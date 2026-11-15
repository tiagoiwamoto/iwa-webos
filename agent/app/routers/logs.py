"""Journald log viewer: filtered reads over journalctl."""

import json
import re

from fastapi import APIRouter, HTTPException

from ..main import run

router = APIRouter(prefix="/logs", tags=["logs"])

_PRIORITIES = {"emerg", "alert", "crit", "err", "warning", "notice", "info", "debug"}
_MAX_LINES = 2000


@router.get("")
def logs(unit: str | None = None, priority: str | None = None,
         q: str | None = None, lines: int = 300, since: str | None = None):
    """Recent journal entries, newest last. Filters map to journalctl flags."""
    lines = max(1, min(lines, _MAX_LINES))
    cmd = ["journalctl", "--no-pager", "-o", "json", "-n", str(lines)]
    if unit:
        cmd += ["-u", unit]
    if priority:
        if priority not in _PRIORITIES:
            raise HTTPException(400, f"priority must be one of {sorted(_PRIORITIES)}")
        cmd += ["-p", priority]
    if since:
        cmd += ["--since", since]
    if q:
        cmd += ["-g", q]  # journald-side regex filter

    proc = run(cmd)
    if proc.returncode != 0:
        raise HTTPException(500, proc.stderr.strip() or "journalctl failed")

    entries = []
    for line in proc.stdout.splitlines():
        try:
            e = json.loads(line)
        except json.JSONDecodeError:
            continue
        entries.append({
            "time": e.get("__REALTIME_TIMESTAMP"),
            "unit": e.get("_SYSTEMD_UNIT") or e.get("SYSLOG_IDENTIFIER") or "",
            "priority": int(e.get("PRIORITY", 6)),
            "pid": e.get("_PID"),
            "message": e.get("MESSAGE") or "",
        })
    return {"count": len(entries), "entries": entries}


@router.get("/units")
def units():
    """Unit names seen in the journal — feeds the filter dropdown."""
    proc = run(["journalctl", "-F", "_SYSTEMD_UNIT", "--no-pager"])
    if proc.returncode != 0:
        raise HTTPException(500, proc.stderr.strip() or "journalctl failed")
    names = sorted({l.strip() for l in proc.stdout.splitlines()
                    if re.match(r"^[a-zA-Z0-9@.:_-]+$", l.strip())})
    return {"units": names}
