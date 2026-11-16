"""PAM authentication: verifies web logins against real Linux users.

POST /api/auth/login   {username, password} -> 200 {user, session}
POST /api/auth/session {token}              -> 200 {user, session}
POST /api/auth/logout  {token}              -> 200
  -> 401 on bad credentials / locked or expired account / bad token

Uses the 'webos' PAM service (see deploy/docker-entrypoint.sh). Locked
accounts (usermod -L) fail pam_unix auth, so the Users app lock/unlock
directly controls web login. Session tokens let the browser stay logged
in across reloads without storing the password anywhere.
"""

import grp
import json
import os
import pwd
import secrets
import threading
import time

from pathlib import Path

from fastapi import APIRouter, HTTPException

try:
    import pam
except ImportError:
    pam = None

router = APIRouter(prefix="/auth", tags=["auth"])

PAM_SERVICE = os.environ.get("WEBOS_PAM_SERVICE", "webos")

# Web session tokens: issued on PAM login, persisted so an agent restart
# does not kick everyone out. The browser stores the token (never the
# password) in the osjs auth cookie and replays it via POST /auth/session.
SESSIONS_FILE = Path("/opt/webos/.sessions.json")
SESSION_TTL = 7 * 86400

_sessions: dict = {}
_sessions_lock = threading.Lock()


def _load_sessions() -> None:
    try:
        _sessions.update(json.loads(SESSIONS_FILE.read_text()))
    except (OSError, ValueError):
        pass


def _save_sessions() -> None:
    try:
        SESSIONS_FILE.write_text(json.dumps(_sessions))
        SESSIONS_FILE.chmod(0o600)
    except OSError:
        pass


def _issue_session(user: dict) -> str:
    token = secrets.token_urlsafe(32)
    now = time.time()
    with _sessions_lock:
        expired = [t for t, s in _sessions.items() if s["exp"] < now]
        for t in expired:
            del _sessions[t]
        _sessions[token] = {"user": user, "exp": now + SESSION_TTL}
        _save_sessions()
    return token


def _resolve_session(token: str) -> dict | None:
    with _sessions_lock:
        session = _sessions.get(token)
        if not session:
            return None
        if session["exp"] < time.time():
            del _sessions[token]
            _save_sessions()
            return None
        return session["user"]


_load_sessions()


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

    user = {
        "username": pw.pw_name,
        "uid": pw.pw_uid,
        "gid": pw.pw_gid,
        "name": pw.pw_gecos.split(",")[0] or pw.pw_name,
        "groups": _groups(pw.pw_name, pw.pw_gid),
        "home": pw.pw_dir,
        "shell": pw.pw_shell,
    }
    return {**user, "session": _issue_session(user)}


@router.post("/session")
def session(body: dict):
    """Re-authenticate with a token issued by /login (cookie replay)."""
    token = str(body.get("token") or "")
    user = _resolve_session(token) if token else None
    if not user:
        raise HTTPException(401, "invalid session")
    return {**user, "session": token}


@router.post("/logout")
def logout(body: dict):
    """Revoke a session token. Always succeeds — logout is best-effort."""
    token = str(body.get("token") or "")
    with _sessions_lock:
        if _sessions.pop(token, None) is not None:
            _save_sessions()
    return {"ok": True}
