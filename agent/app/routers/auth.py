"""PAM authentication: verifies web logins against real Linux users.

POST /api/auth/login {username, password}
  -> 200 {username, uid, gid, name, groups, home, shell}
  -> 401 on bad credentials / locked or expired account

Uses the 'webos' PAM service (see deploy/docker-entrypoint.sh). Locked
accounts (usermod -L) fail pam_unix auth, so the Users app lock/unlock
directly controls web login.
"""

import grp
import os
import pwd

from fastapi import APIRouter, HTTPException

try:
    import pam
except ImportError:
    pam = None

router = APIRouter(prefix="/auth", tags=["auth"])

PAM_SERVICE = os.environ.get("WEBOS_PAM_SERVICE", "webos")


def _groups(username: str, gid: int) -> list[str]:
    groups = [g.gr_name for g in grp.getgrall() if username in g.gr_mem]
    primary = grp.getgrgid(gid).gr_name
    if primary not in groups:
        groups.insert(0, primary)
    return groups


@router.post("/login")
def login(body: dict):
    username = str(body.get("username") or "")
    password = str(body.get("password") or "")
    if pam is None:
        raise HTTPException(503, "PAM backend unavailable")
    if not username or not password:
        raise HTTPException(400, "username and password required")

    try:
        pw = pwd.getpwnam(username)
    except KeyError:
        # burn a PAM round-trip anyway so unknown users take the same time
        pam.authenticate(username, password, service=PAM_SERVICE)
        raise HTTPException(401, "invalid credentials")

    if not pam.authenticate(username, password, service=PAM_SERVICE):
        raise HTTPException(401, "invalid credentials")

    return {
        "username": pw.pw_name,
        "uid": pw.pw_uid,
        "gid": pw.pw_gid,
        "name": pw.pw_gecos.split(",")[0] or pw.pw_name,
        "groups": _groups(pw.pw_name, pw.pw_gid),
        "home": pw.pw_dir,
        "shell": pw.pw_shell,
    }
