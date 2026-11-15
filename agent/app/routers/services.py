"""systemd service management."""

import json
import re

from fastapi import APIRouter, HTTPException

from ..main import run

router = APIRouter(prefix="/services", tags=["services"])

_UNIT = re.compile(r"^[\w@.:-]+\.service$")


@router.get("")
def list_services():
    proc = run(["systemctl", "list-units", "--type=service", "--all",
                "--no-legend", "--no-pager", "--output=json"])
    if proc.returncode == 0 and proc.stdout.strip():
        try:
            units = json.loads(proc.stdout)
            return [{
                "unit": u.get("unit"), "load": u.get("load"),
                "active": u.get("active"), "sub": u.get("sub"),
                "description": u.get("description"),
            } for u in units]
        except json.JSONDecodeError:
            pass

    # fallback for systemctl without --output=json
    proc = run(["systemctl", "list-units", "--type=service", "--all",
                "--no-legend", "--no-pager"])
    if proc.returncode != 0:
        raise HTTPException(500, proc.stderr.strip() or "systemctl failed")
    out = []
    for line in proc.stdout.splitlines():
        parts = line.split(None, 4)
        if len(parts) >= 4 and parts[0].endswith(".service"):
            out.append({"unit": parts[0], "load": parts[1], "active": parts[2],
                        "sub": parts[3], "description": parts[4] if len(parts) > 4 else ""})
    return out


@router.post("/action")
def action(body: dict):
    unit = body.get("unit", "")
    act = body.get("action", "")
    if not _UNIT.match(unit):
        raise HTTPException(400, "invalid unit name")
    if act not in ("start", "stop", "restart", "reload", "enable", "disable"):
        raise HTTPException(400, "invalid action")
    proc = run(["systemctl", act, unit])
    if proc.returncode != 0:
        raise HTTPException(500, proc.stderr.strip() or proc.stdout.strip())
    return {"ok": True}


@router.get("/{unit}/status")
def status(unit: str):
    if not _UNIT.match(unit):
        raise HTTPException(400, "invalid unit name")
    proc = run(["systemctl", "status", unit, "--no-pager", "-n", "30"])
    return {"output": proc.stdout, "active": proc.returncode == 0}
