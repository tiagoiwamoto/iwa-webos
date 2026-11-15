"""Self-update: compara a versão local com o main do GitHub e instala
o update.sh do diretório-fonte em uma transient unit systemd (que
sobrevive ao restart do próprio agente/web).

GET  /api/sysupdate -> {running, rc, log, source, local, remote, update_available}
POST /api/sysupdate -> inicia (409 se já rodando; body {"pull": true})
"""

import glob
import os
import subprocess
import time
from pathlib import Path

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/sysupdate", tags=["sysupdate"])

REPO = "https://github.com/tiagoiwamoto/iwa-webos.git"
FALLBACK_SRC = Path("/opt/webos-src")
_LOG = Path("/opt/webos/.update.log")
_RC = Path("/opt/webos/.update.rc")
_remote_cache = {"at": 0.0, "head": None}


def _git(*args, cwd=None, timeout=20):
    return subprocess.run(["git", "-c", "safe.directory=*", *args],
                          cwd=cwd, capture_output=True, text=True, timeout=timeout)


def _source_dir() -> str | None:
    src = os.environ.get("WEBOS_SOURCE_DIR")
    cands = ([src] if src else []) + \
        sorted(glob.glob("/home/*/*") + glob.glob("/root/*")) + [str(FALLBACK_SRC)]
    for cand in cands:
        if cand and Path(cand, "update.sh").exists() \
                and Path(cand, "agent/app/main.py").exists():
            return cand
    return None


def _ensure_source() -> str | None:
    src = _source_dir()
    if src:
        return src
    # sem clone local: cria um em /opt/webos-src (repo público)
    p = _git("clone", "--depth", "50", REPO, str(FALLBACK_SRC), timeout=180)
    if p.returncode != 0:
        return None
    return str(FALLBACK_SRC) if _source_dir() else None


def _local_head(src: str) -> str | None:
    p = _git("rev-parse", "--short", "HEAD", cwd=src, timeout=10)
    return p.stdout.strip() if p.returncode == 0 else None


def _remote_head() -> str | None:
    if time.time() - _remote_cache["at"] < 60 and _remote_cache["head"]:
        return _remote_cache["head"]
    try:
        p = _git("ls-remote", REPO, "main", timeout=15)
        _remote_cache["head"] = p.stdout.split()[0][:8] if p.returncode == 0 and p.stdout else None
    except Exception:
        _remote_cache["head"] = None
    _remote_cache["at"] = time.time()
    return _remote_cache["head"]


def _tail(n: int = 250) -> str:
    try:
        return "".join(_LOG.read_text(errors="replace").splitlines(keepends=True)[-n:])
    except FileNotFoundError:
        return ""


def _recent() -> bool:
    try:
        return time.time() - _LOG.stat().st_mtime < 3600
    except FileNotFoundError:
        return False


@router.get("")
def status():
    rc = _RC.read_text().strip() if _RC.exists() else None
    src = _source_dir()
    local = _local_head(src) if src else None
    remote = _remote_head()
    return {
        "running": rc is None and _recent(),
        "rc": rc, "log": _tail(), "source": src,
        "local": local, "remote": remote,
        "update_available": bool(remote and local != remote),
    }


@router.post("")
def start_update(body: dict | None = None):
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
    sync = "true"
    if (body or {}).get("pull", True):
        sync = ("git fetch origin main && git reset --hard FETCH_HEAD") \
            if Path(src, ".git").exists() else "echo 'fonte sem .git — usando fontes locais'"
    cmd = ("systemd-run --unit=webos-manual-update --collect --quiet sh -c "
           f"'cd {src} && {sync} && sh ./update.sh >> {_LOG} 2>&1; echo $? > {_RC}'")
    proc = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if proc.returncode != 0:
        raise HTTPException(500, proc.stderr.strip() or "systemd-run failed")
    return {"ok": True, "source": src, "local": local, "remote": remote}
