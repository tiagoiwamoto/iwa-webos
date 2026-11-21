"""Self-update: compara a versão local com o main do GitHub e instala
o update.sh do diretório-fonte em uma transient unit systemd (que
sobrevive ao restart do próprio agente/web).

GET  /api/sysupdate -> {running, rc, log, source, local, remote, update_available}
POST /api/sysupdate -> inicia (409 se já rodando; body {"pull": true})
"""

import glob
import os
import re
import subprocess
import time
from pathlib import Path
from threading import Lock

from fastapi import APIRouter, HTTPException
from typing import Optional

router = APIRouter(prefix="/sysupdate", tags=["sysupdate"])

REPO = "https://github.com/tiagoiwamoto/iwa-webos.git"
FALLBACK_SRC = Path("/opt/webos-src")
_LOG = Path("/opt/webos/.update.log")
_RC = Path("/opt/webos/.update.rc")
_remote_cache = {"at": float("-inf"), "head": None}
_start_lock = Lock()


def _git(*args, cwd=None, timeout=20):
    return subprocess.run(["git", "-c", "safe.directory=*", *args],
                          cwd=cwd, capture_output=True, text=True, timeout=timeout)


def _source_dir() -> Optional[str]:
    src = os.environ.get("WEBOS_SOURCE_DIR")
    cands = ([src] if src else []) + \
        sorted(glob.glob("/home/*/*") + glob.glob("/root/*")) + [str(FALLBACK_SRC)]
    for cand in cands:
        if cand and Path(cand, "update.sh").exists() \
                and Path(cand, "agent/app/main.py").exists():
            return cand
    return None


def _ensure_source() -> Optional[str]:
    src = _source_dir()
    if src:
        return src
    # sem clone local: cria um em /opt/webos-src (repo público)
    p = _git("clone", "--depth", "50", REPO, str(FALLBACK_SRC), timeout=180)
    if p.returncode != 0:
        return None
    return str(FALLBACK_SRC) if _source_dir() else None


def _local_head(src: str) -> Optional[str]:
    p = _git("rev-parse", "HEAD", cwd=src, timeout=10)
    return p.stdout.strip()[:8] if p.returncode == 0 else None


def _remote_head() -> Optional[str]:
    if time.monotonic() - _remote_cache["at"] < 60:
        return _remote_cache["head"]
    try:
        p = _git("ls-remote", REPO, "main", timeout=15)
        _remote_cache["head"] = p.stdout.split()[0][:8] if p.returncode == 0 and p.stdout else None
    except Exception:
        _remote_cache["head"] = None
    _remote_cache["at"] = time.monotonic()
    return _remote_cache["head"]


def _tail(n: int = 250) -> str:
    try:
        lines = _LOG.read_text(errors="replace").splitlines()
        return re.sub(r"\x1b\[[0-?]*[ -/]*[@-~]", "", "\n".join(lines[-n:]))
    except FileNotFoundError:
        return ""


def _recent() -> bool:
    try:
        return time.time() - _LOG.stat().st_mtime < 3600
    except FileNotFoundError:
        return False


@router.get("")
def status():
    try:
        rc = _RC.read_text().strip() or None
    except FileNotFoundError:
        rc = None
    running = rc is None and _recent()
    src = _source_dir()
    local = _local_head(src) if src else None
    remote = _remote_cache["head"] if running else _remote_head()
    return {
        "running": running,
        "rc": rc, "log": _tail(), "source": src,
        "local": local, "remote": remote,
        "update_available": bool(remote and local != remote),
    }


@router.post("")
def start_update(body: Optional[dict] = None):
    if not _start_lock.acquire(blocking=False):
        raise HTTPException(409, "update já em andamento")
    try:
        return _start_update((body or {}).get("pull", True))
    finally:
        _start_lock.release()


def _start_update(pull: bool):
    if not _RC.exists() and _recent():
        raise HTTPException(409, "update já em andamento")
    src = _ensure_source()
    if not src:
        raise HTTPException(400, "sem fonte e git clone falhou "
                            "(rede/GitHub indisponível?)")
    local, remote = _local_head(src), _remote_head()
    _RC.unlink(missing_ok=True)
    _LOG.write_text(f"=== Malta OS update ===\nfonte:  {src}\n"
                    f"local:  {local or 'desconhecido'}\nremoto: {remote or '?'}\n\n")
    script = """
    exec >> "$2" 2>&1
    (
        set -e
        cd "$1"
        GIT_TERMINAL_PROMPT=0 SKIP_GIT="$4" sh ./update.sh --main
    )
    rc=$?
    printf '\\n==> Código de saída: %s\\n' "$rc"
    printf '%s\\n' "$rc" > "$3"
    exit "$rc"
    """
    try:
        proc = subprocess.run(
            ["systemd-run", "--unit=webos-manual-update", "--collect", "--quiet",
             "--no-ask-password",
             "sh", "-c", script, "webos-update", src, str(_LOG), str(_RC),
             "0" if pull else "1"],
            capture_output=True, text=True,
        )
    except OSError as exc:
        _record_launch_failure(str(exc), 1)
    if proc.returncode != 0:
        _record_launch_failure(proc.stderr.strip() or "systemd-run failed", proc.returncode)
    return {"ok": True, "source": src, "local": local, "remote": remote}


def _record_launch_failure(message: str, rc: int):
    with _LOG.open("a") as log:
        log.write(f"\n{message}\n")
    _RC.write_text(f"{rc}\n")
    raise HTTPException(500, message)
