"""Process listing and signals via psutil."""

import os
import signal

import psutil
from fastapi import APIRouter, HTTPException
from typing import Optional

router = APIRouter(prefix="/processes", tags=["processes"])

_SIGNALS = {"term": signal.SIGTERM, "kill": signal.SIGKILL, "int": signal.SIGINT}


def _protected(pid: int) -> bool:
    """Never signal init, ourselves, or our ancestors (they'd kill the agent)."""
    if pid in (1, os.getpid()):
        return True
    try:
        p = psutil.Process(os.getpid())
        while p.ppid() > 1:
            p = p.parent()
            if p is None:
                break
            if p.pid == pid:
                return True
    except psutil.NoSuchProcess:
        pass
    return False


@router.get("")
def list_processes(user: Optional[str] = None, sample_ms: int = 400):
    attrs = ["pid", "ppid", "name", "username", "status", "cmdline",
             "cpu_percent", "memory_percent", "num_threads", "create_time"]

    procs = list(psutil.process_iter(attrs))
    for p in procs:
        p.cpu_percent(interval=None)  # prime the counter
    if sample_ms > 0:
        import time
        time.sleep(min(sample_ms, 2000) / 1000)

    out = []
    for p in procs:
        try:
            i = p.info
            if user and i["username"] != user:
                continue
            out.append({
                "pid": i["pid"], "ppid": i["ppid"], "name": i["name"],
                "user": i["username"], "status": i["status"],
                "cpu": round(p.cpu_percent(interval=None), 1),
                "mem": round(i["memory_percent"] or 0, 1),
                "threads": i["num_threads"],
                "cmd": " ".join(i["cmdline"] or [])[:200],
                "started": i["create_time"],
            })
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue
    return out


@router.post("/{pid}/signal")
def send_signal(pid: int, body: dict):
    sig = _SIGNALS.get(str(body.get("signal", "term")).lower())
    if sig is None:
        raise HTTPException(400, "signal must be term, kill or int")
    if _protected(pid):
        raise HTTPException(403, "cannot signal init or the agent itself")
    try:
        os.kill(pid, sig)
    except ProcessLookupError:
        raise HTTPException(404, "process gone")
    except PermissionError:
        raise HTTPException(403, "permission denied")
    return {"ok": True, "signal": sig.value}
