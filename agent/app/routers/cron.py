"""Crontab management: list/add/edit/toggle/delete cron jobs per user.

Entries are addressed by line index inside `crontab -l`. Disabled jobs are
kept as '# disabled:'-prefixed comments so they can be re-enabled.
"""

import re

from fastapi import APIRouter, HTTPException

from ..main import run

router = APIRouter(prefix="/cron", tags=["cron"])

_USER = re.compile(r"^[a-zA-Z_][a-zA-Z0-9_-]{0,31}$")
_FIELD = re.compile(r"^[\d*,/\-]+$")
_SPECIAL = {"reboot", "yearly", "annually", "monthly", "weekly",
            "daily", "midnight", "hourly"}
_DISABLED_PREFIX = "# disabled:"


def _crontab(user: str) -> list[str]:
    proc = run(["crontab", "-u", user, "-l"])
    if proc.returncode != 0:
        err = proc.stderr.lower()
        if "no crontab" in err:
            return []
        raise HTTPException(500, proc.stderr.strip() or "crontab -l failed")
    return proc.stdout.splitlines()


def _write(user: str, lines: list[str]):
    text = "\n".join(lines) + "\n"
    proc = run(["crontab", "-u", user, "-"], input_text=text)
    if proc.returncode != 0:
        raise HTTPException(500, proc.stderr.strip() or "crontab write failed")


def _user(name: str | None) -> str:
    u = (name or "root").strip()
    if not _USER.match(u):
        raise HTTPException(400, "invalid user")
    return u


def _parse(line: str, idx: int) -> dict:
    """Parse one crontab line into a job dict (or env/comment marker)."""
    enabled = True
    raw = line
    stripped = line.strip()
    if stripped.startswith(_DISABLED_PREFIX):
        enabled = False
        stripped = stripped[len(_DISABLED_PREFIX):].strip()
    elif stripped.startswith("#"):
        return {"index": idx, "kind": "comment", "raw": raw}
    if not stripped:
        return {"index": idx, "kind": "blank", "raw": raw}

    if stripped.startswith("@"):
        parts = stripped.split(None, 1)
        if len(parts) == 2:
            return {"index": idx, "kind": "job", "raw": raw, "enabled": enabled,
                    "special": parts[0][1:], "command": parts[1]}
    elif "=" in stripped.split()[0]:
        return {"index": idx, "kind": "env", "raw": raw}
    else:
        parts = stripped.split(None, 5)
        if len(parts) == 6:
            return {"index": idx, "kind": "job", "raw": raw, "enabled": enabled,
                    "minute": parts[0], "hour": parts[1], "dom": parts[2],
                    "month": parts[3], "dow": parts[4], "command": parts[5]}
    return {"index": idx, "kind": "unparsed", "raw": raw}


def _valid_fields(body: dict):
    special = (body.get("special") or "").strip().lstrip("@")
    if special:
        if special not in _SPECIAL:
            raise HTTPException(400, f"special must be one of {sorted(_SPECIAL)}")
        return f"@{special}"
    fields = []
    for key in ("minute", "hour", "dom", "month", "dow"):
        v = str(body.get(key) or "*").strip()
        if not _FIELD.match(v) or len(v) > 20:
            raise HTTPException(400, f"invalid {key} field: {v!r}")
        fields.append(v)
    return " ".join(fields)


def _job_line(body: dict) -> str:
    command = (body.get("command") or "").strip()
    if not command or "\n" in command or "#" == command[0]:
        raise HTTPException(400, "command required (single line)")
    return f"{_valid_fields(body)} {command}"


def _get(lines: list[str], idx: int) -> str:
    if idx < 0 or idx >= len(lines):
        raise HTTPException(404, f"no line {idx}")
    return lines[idx]


@router.get("")
def list_jobs(user: str | None = None):
    u = _user(user)
    lines = _crontab(u)
    return {"user": u, "entries": [_parse(l, i) for i, l in enumerate(lines)]}


@router.post("")
def add_job(body: dict):
    u = _user(body.get("user"))
    lines = _crontab(u)
    lines.append(_job_line(body))
    _write(u, lines)
    return {"ok": True}


@router.put("/{idx}")
def edit_job(idx: int, body: dict):
    u = _user(body.get("user"))
    lines = _crontab(u)
    _get(lines, idx)
    lines[idx] = _job_line(body)
    _write(u, lines)
    return {"ok": True}


@router.post("/{idx}/toggle")
def toggle_job(idx: int, body: dict):
    u = _user(body.get("user"))
    lines = _crontab(u)
    raw = _get(lines, idx)
    stripped = raw.strip()
    if stripped.startswith(_DISABLED_PREFIX):
        lines[idx] = stripped[len(_DISABLED_PREFIX):].strip()
    elif stripped and not stripped.startswith("#"):
        lines[idx] = f"{_DISABLED_PREFIX} {raw}"
    else:
        raise HTTPException(400, "line is not a job")
    _write(u, lines)
    return {"ok": True}


@router.delete("/{idx}")
def delete_job(idx: int, user: str | None = None):
    u = _user(user)
    lines = _crontab(u)
    _get(lines, idx)
    del lines[idx]
    _write(u, lines)
    return {"ok": True}
