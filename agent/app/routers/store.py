"""Server-app store: browse a CasaOS-compatible appstore index and install
apps as docker compose projects.

Layout: /srv/webos-apps/<appid>/docker-compose.yml, deployed as compose
project 'webos-app-<appid>'.
"""

import json
import os
import re
import shutil
import time
from pathlib import Path

import requests
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from ..main import run

router = APIRouter(prefix="/store", tags=["store"])

STORE_URL = os.environ.get(
    "WEBOS_STORE_URL",
    "https://cdn.jsdelivr.net/gh/IceWhaleTech/CasaOS-AppStore@gh-pages")
APPS_ROOT = Path(os.environ.get("WEBOS_STORE_ROOT", "/srv/webos-apps"))
# bundled catalog of classic hosting apps shipped in the image
LOCAL_STORE = Path(os.environ.get("WEBOS_LOCAL_STORE", "/opt/webos/store"))
CACHE_TTL = 300
_ID = re.compile(r"^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$")

_cache = {"at": 0, "data": None}


def _local_index() -> dict:
    f = LOCAL_STORE / "index.json"
    if not f.is_file():
        return {"apps": []}
    try:
        data = json.loads(f.read_text())
    except (OSError, ValueError):
        return {"apps": []}
    for a in data.get("apps", []):
        a["local"] = True
    return data


def _remote_index() -> dict:
    if _cache["data"] is not None and time.time() - _cache["at"] < CACHE_TTL:
        return _cache["data"]
    try:
        r = requests.get(f"{STORE_URL}/index.json", timeout=15)
        r.raise_for_status()
    except requests.RequestException:
        # the remote store is optional — the local catalog still works
        _cache.update(at=time.time(), data=_cache["data"] or {"apps": []})
        return _cache["data"]
    _cache.update(at=time.time(), data=r.json())
    return _cache["data"]


def _index() -> dict:
    local = _local_index()
    local_ids = {a.get("id") for a in local["apps"]}
    remote = _remote_index()
    return {"app_count": remote.get("app_count"),
            "apps": local["apps"] + [a for a in remote.get("apps", [])
                                     if a.get("id") not in local_ids]}


def _find(app_id: str) -> dict:
    for app in _index().get("apps", []):
        if app.get("id") == app_id:
            return app
    raise HTTPException(404, "app not found in store")


def _abs(path: str) -> str:
    if path.startswith("http"):
        return path
    return STORE_URL + ("" if path.startswith("/") else "/") + path


def _project(app_id: str) -> str:
    return "webos-app-" + re.sub(r"[^a-zA-Z0-9_.-]", "", app_id.replace(".", "-"))


def _compose(app_id: str, *compose_args: str):
    path = APPS_ROOT / app_id / "docker-compose.yml"
    return run(["docker", "compose", "-p", _project(app_id),
                "-f", str(path), *compose_args], timeout=600)


@router.get("/apps")
def list_apps(category: str | None = None, q: str | None = None):
    idx = _index()
    apps = []
    for a in idx.get("apps", []):
        if category and (a.get("category") or "").lower() != category.lower():
            continue
        if q and q.lower() not in (a.get("title", "") + " " + a.get("tagline", "")).lower():
            continue
        apps.append({
            "id": a.get("id"), "title": a.get("title"),
            "tagline": a.get("tagline"), "category": a.get("category"),
            "version": a.get("version"),
            "icon": a.get("icon", "") if a.get("local")
                    else _abs(a.get("icon") or ""),
        })
    return {"count": idx.get("app_count"), "apps": apps}


@router.get("/apps/{app_id}")
def app_detail(app_id: str):
    app = _find(app_id)
    out = dict(app)
    out["icon"] = (app.get("icon") or "") if app.get("local") \
        else _abs(app.get("icon") or "")
    meta = app.get("meta_url")
    if meta:
        try:
            out["meta"] = requests.get(_abs(meta), timeout=10).json()
        except requests.RequestException:
            out["meta"] = None
    return out


@router.get("/icon/{app_id}")
def icon(app_id: str):
    """Bundled-app icon, served through the OS.js auth proxy."""
    if not _ID.match(app_id):
        raise HTTPException(400, "invalid app id")
    app = _find(app_id)
    if not app.get("local"):
        raise HTTPException(404, "not a local app")
    d = LOCAL_STORE / str(app.get("dir") or app_id)
    for name in ("icon.svg", "icon.png", "icon.jpg"):
        f = d / name
        if f.is_file():
            return FileResponse(f)
    raise HTTPException(404, "no icon")


@router.post("/install")
def install(body: dict):
    app_id = str(body.get("id") or "")
    if not _ID.match(app_id):
        raise HTTPException(400, "invalid app id")
    app = _find(app_id)

    target = APPS_ROOT / app_id
    if app.get("local"):
        # bundled app: copy the whole recipe dir (compose + optional
        # Dockerfile/boot files) and build if needed
        src = LOCAL_STORE / str(app.get("dir") or app_id)
        if not (src / "docker-compose.yml").is_file():
            raise HTTPException(502, "local app files missing from image")
        shutil.rmtree(target, ignore_errors=True)
        shutil.copytree(src, target)
        proc = _compose(app_id, "up", "-d", "--build")
    else:
        target.mkdir(parents=True, exist_ok=True)
        try:
            r = requests.get(_abs(app["compose_url"]), timeout=30)
            r.raise_for_status()
        except requests.RequestException as e:
            raise HTTPException(502, f"compose download failed: {e}")
        (target / "docker-compose.yml").write_text(r.text)
        proc = _compose(app_id, "up", "-d")
    if proc.returncode != 0:
        raise HTTPException(500, proc.stderr.strip() or proc.stdout.strip())
    return {"installed": app_id, "output": proc.stdout.strip()}


@router.get("/installed")
def installed():
    out = []
    if APPS_ROOT.is_dir():
        for d in sorted(APPS_ROOT.iterdir()):
            if (d / "docker-compose.yml").is_file():
                proc = _compose(d.name, "ps", "--format", "json")
                out.append({"id": d.name, "project": _project(d.name),
                            "status": proc.stdout.strip()})
    return out


@router.post("/action")
def action(body: dict):
    app_id = str(body.get("id") or "")
    act = str(body.get("action") or "")
    if not _ID.match(app_id):
        raise HTTPException(400, "invalid app id")
    if act not in ("start", "stop", "restart"):
        raise HTTPException(400, "action must be start, stop or restart")
    if not (APPS_ROOT / app_id / "docker-compose.yml").is_file():
        raise HTTPException(404, "app not installed")
    proc = _compose(app_id, act)
    if proc.returncode != 0:
        raise HTTPException(500, proc.stderr.strip() or proc.stdout.strip())
    return {"ok": True}


@router.delete("/{app_id}")
def uninstall(app_id: str):
    if not _ID.match(app_id):
        raise HTTPException(400, "invalid app id")
    target = APPS_ROOT / app_id
    if not (target / "docker-compose.yml").is_file():
        raise HTTPException(404, "app not installed")
    proc = _compose(app_id, "down")
    if proc.returncode != 0:
        raise HTTPException(500, proc.stderr.strip() or proc.stdout.strip())
    shutil.rmtree(target, ignore_errors=True)
    return {"removed": app_id}
