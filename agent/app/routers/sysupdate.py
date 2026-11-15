"""Self-update: roda o update.sh do diretório-fonte em uma transient
unit systemd (sobrevive ao restart do próprio agente/web).

POST /api/sysupdate        -> inicia (409 se já rodando)
GET  /api/sysupdate        -> {running, rc, log} (tail do log)
"""

import glob
import os
import subprocess
from pathlib import Path

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/sysupdate", tags=["sysupdate"])

_LOG = Path("/opt/webos/.update.log")
_RC = Path("/opt/webos/.update.rc")


def _source_dir() -> str | None:
    src = os.environ.get("WEBOS_SOURCE_DIR")
    if src and Path(src, "update.sh").exists():
        return src
    for cand in sorted(glob.glob("/home/*/*") + glob.glob("/root/*")):
        if Path(cand, "update.sh").exists() and Path(cand, "agent/app/main.py").exists():
            return cand
    return None


def _tail(n: int = 250) -> str:
    try:
        return "".join(_LOG.read_text(errors="replace").splitlines(keepends=True)[-n:])
    except FileNotFoundError:
        return ""


@router.post("")
def start_update(body: dict | None = None):
    if _rc_missing() and _recent():
        raise HTTPException(409, "update já em andamento")
    src = _source_dir()
    if not src:
        raise HTTPException(400, "diretório-fonte não encontrado "
                            "(WEBOS_SOURCE_DIR ou ~/iwa-webos com update.sh)")
    pull = "git pull --ff-only || true" if (body or {}).get("pull", True) else "true"
    _RC.unlink(missing_ok=True)
    _LOG.write_text(f"=== Malta OS update ({src}) ===\n")
    # transient unit: o update sobrevive ao restart do webos-agent
    cmd = ("systemd-run --unit=webos-manual-update --collect --quiet sh -c "
           f"'cd {src} && {pull} && sh ./update.sh >> {_LOG} 2>&1; echo $? > {_RC}'")
    proc = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if proc.returncode != 0:
        raise HTTPException(500, proc.stderr.strip() or "systemd-run failed")
    return {"ok": True, "source": src}


@router.get("")
def status():
    rc = _RC.read_text().strip() if _RC.exists() else None
    return {"running": rc is None and _recent(), "rc": rc, "log": _tail()}


def _recent() -> bool:
    try:
        import time
        return time.time() - _LOG.stat().st_mtime < 3600
    except FileNotFoundError:
        return False


def _rc_missing() -> bool:
    return not _RC.exists()
