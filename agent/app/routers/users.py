"""Local user management: list, create, password, lock, delete."""

import re

from fastapi import APIRouter, HTTPException

from ..main import run

router = APIRouter(prefix="/users", tags=["users"])

_NAME = re.compile(r"^[a-z_][a-z0-9_-]{0,31}$")


def _passwd_entries():
    users = []
    try:
        with open("/etc/passwd") as f:
            for line in f:
                name, _, uid, gid, gecos, home, shell = line.strip().split(":")[:7]
                users.append({
                    "name": name, "uid": int(uid), "gid": int(gid),
                    "gecos": gecos, "home": home, "shell": shell,
                })
    except OSError as e:
        raise HTTPException(500, str(e))
    return users


def _locked(name: str) -> bool:
    proc = run(["passwd", "-S", name])
    return proc.returncode == 0 and " L" in f" {proc.stdout}"


def _groups(name: str) -> list[str]:
    proc = run(["id", "-nG", name])
    return proc.stdout.split() if proc.returncode == 0 else []


@router.get("")
def list_users(human: bool = True):
    users = _passwd_entries()
    if human:
        users = [u for u in users if u["uid"] >= 1000 or u["uid"] == 0]
    for u in users:
        u["groups"] = _groups(u["name"])
        u["locked"] = _locked(u["name"])
    return users


@router.post("")
def create_user(body: dict):
    name = body.get("name", "")
    if not _NAME.match(name):
        raise HTTPException(400, "invalid username")
    if any(u["name"] == name for u in _passwd_entries()):
        raise HTTPException(409, "user already exists")

    cmd = ["useradd", "-m", "-s", body.get("shell") or "/bin/bash"]
    if body.get("groups"):
        cmd += ["-G", ",".join(g for g in body["groups"] if _NAME.match(g))]
    cmd.append(name)
    proc = run(cmd)
    if proc.returncode != 0:
        raise HTTPException(500, proc.stderr.strip())

    password = body.get("password")
    if password:
        set_password({"name": name, "password": password})
    return {"created": name}


@router.post("/password")
def set_password(body: dict):
    name = body.get("name", "")
    password = body.get("password", "")
    if not _NAME.match(name) or not password:
        raise HTTPException(400, "name and password required")
    proc = run(["chpasswd"], input_text=f"{name}:{password}\n")
    if proc.returncode != 0:
        raise HTTPException(500, proc.stderr.strip())
    return {"ok": True}


@router.post("/lock")
def lock_user(body: dict):
    name = body.get("name", "")
    if not _NAME.match(name):
        raise HTTPException(400, "invalid username")
    proc = run(["usermod", "-L", name])
    if proc.returncode != 0:
        raise HTTPException(500, proc.stderr.strip())
    return {"ok": True}


@router.post("/unlock")
def unlock_user(body: dict):
    name = body.get("name", "")
    if not _NAME.match(name):
        raise HTTPException(400, "invalid username")
    proc = run(["usermod", "-U", name])
    if proc.returncode != 0:
        raise HTTPException(500, proc.stderr.strip())
    return {"ok": True}


@router.delete("/{name}")
def delete_user(name: str, remove_home: bool = False):
    if not _NAME.match(name):
        raise HTTPException(400, "invalid username")
    if name == "root":
        raise HTTPException(400, "cannot delete root")
    cmd = ["userdel"]
    if remove_home:
        cmd.append("-r")
    cmd.append(name)
    proc = run(cmd)
    if proc.returncode != 0:
        raise HTTPException(500, proc.stderr.strip())
    return {"deleted": name}
