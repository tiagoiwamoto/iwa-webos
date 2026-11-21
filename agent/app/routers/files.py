"""Privileged file read/write used by the code editor app."""

from pathlib import Path

from fastapi import APIRouter, HTTPException
from typing import Optional

router = APIRouter(prefix="/files", tags=["files"])

_MAX = 10 * 1024 * 1024  # 10 MiB


def _path(p: Optional[str]) -> Path:
    if not p or not p.startswith("/"):
        raise HTTPException(400, "absolute path required")
    return Path(p)


@router.get("/read")
def read_file(path: str):
    p = _path(path)
    if not p.is_file():
        raise HTTPException(404, "not a file")
    if p.stat().st_size > _MAX:
        raise HTTPException(413, "file too large")
    try:
        content = p.read_text(errors="replace")
    except OSError as e:
        raise HTTPException(500, str(e))
    st = p.stat()
    return {"path": str(p), "content": content, "size": st.st_size, "mtime": st.st_mtime}


@router.post("/write")
def write_file(body: dict):
    p = _path(body.get("path"))
    content = body.get("content")
    if content is None:
        raise HTTPException(400, "content required")
    if len(content.encode()) > _MAX:
        raise HTTPException(413, "content too large")
    try:
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(content)
    except OSError as e:
        raise HTTPException(500, str(e))
    return {"ok": True, "size": p.stat().st_size}


@router.get("/stat")
def stat_path(path: str):
    p = _path(path)
    if not p.exists():
        raise HTTPException(404, "not found")
    st = p.stat()
    return {"path": str(p), "is_dir": p.is_dir(), "size": st.st_size,
            "mtime": st.st_mtime, "mode": oct(st.st_mode)}
