"""Docker management via docker-py on the local socket."""

import docker
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/docker", tags=["docker"])


def _client() -> docker.DockerClient:
    try:
        return docker.from_env()
    except Exception as e:
        raise HTTPException(503, f"docker unavailable: {e}")


def _container_dict(c):
    image = c.image.tags[0] if c.image and c.image.tags else (c.image.id[:12] if c.image else "?")
    ports = c.attrs.get("NetworkSettings", {}).get("Ports") or {}
    return {
        "id": c.short_id,
        "name": c.name,
        "image": image,
        "status": c.status,
        "state": c.attrs.get("State", {}).get("Status"),
        "created": c.attrs.get("Created"),
        "ports": {k: (v[0]["HostPort"] if v else None) for k, v in ports.items()},
    }


@router.get("/status")
def status():
    try:
        c = _client()
        info = c.info()
        return {"available": True, "version": info.get("ServerVersion"),
                "containers": info.get("Containers"), "images": info.get("Images")}
    except HTTPException as e:
        return {"available": False, "error": e.detail}


@router.get("/containers")
def containers(all: bool = True):
    c = _client()
    return [_container_dict(x) for x in c.containers.list(all=all)]


@router.get("/images")
def images():
    c = _client()
    out = []
    for img in c.images.list():
        tags = img.tags or ["<none>"]
        for tag in tags:
            out.append({"id": img.short_id, "tag": tag, "size": img.attrs.get("Size"),
                        "created": img.attrs.get("Created")})
    return out


@router.post("/containers/{cid}/action")
def container_action(cid: str, body: dict):
    action = body.get("action")
    if action not in ("start", "stop", "restart", "kill", "pause", "unpause", "remove"):
        raise HTTPException(400, "invalid action")
    c = _client()
    try:
        cont = c.containers.get(cid)
        if action == "remove":
            cont.remove(force=bool(body.get("force")))
        else:
            getattr(cont, action)()
    except docker.errors.NotFound:
        raise HTTPException(404, "container not found")
    except docker.errors.APIError as e:
        raise HTTPException(500, e.explanation or str(e))
    return {"ok": True}


@router.get("/containers/{cid}/logs")
def container_logs(cid: str, tail: int = 200):
    c = _client()
    try:
        cont = c.containers.get(cid)
    except docker.errors.NotFound:
        raise HTTPException(404, "container not found")
    return {"logs": cont.logs(tail=tail, timestamps=True).decode(errors="replace")}


@router.delete("/images/{iid}")
def remove_image(iid: str, force: bool = False):
    c = _client()
    try:
        c.images.remove(iid, force=force)
    except docker.errors.ImageNotFound:
        raise HTTPException(404, "image not found")
    except docker.errors.APIError as e:
        raise HTTPException(500, e.explanation or str(e))
    return {"ok": True}


@router.post("/images/pull")
def pull_image(body: dict):
    ref = body.get("image")
    if not ref:
        raise HTTPException(400, "image required")
    c = _client()
    try:
        img = c.images.pull(ref)
        return {"pulled": img.tags}
    except docker.errors.APIError as e:
        raise HTTPException(500, e.explanation or str(e))
