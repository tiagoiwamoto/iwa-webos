"""Docker management via docker-py on the local socket."""

import shlex

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


@router.get("/containers/{cid}/inspect")
def container_inspect(cid: str):
    """Editable spec for the Recreate dialog: image, env, ports,
    restart policy, command and network mode."""
    c = _client()
    try:
        cont = c.containers.get(cid)
    except docker.errors.NotFound:
        raise HTTPException(404, "container not found")
    a = cont.attrs
    cfg, hc = a.get("Config", {}), a.get("HostConfig", {})
    return {
        "name": cont.name,
        "image": cfg.get("Image"),
        "command": " ".join(shlex.quote(x) for x in (cfg.get("Cmd") or [])),
        "env": cfg.get("Env") or [],
        "ports": [
            {"container": k, "host": v[0].get("HostPort") if v else ""}
            for k, v in (hc.get("PortBindings") or {}).items()],
        "restart": (hc.get("RestartPolicy") or {}).get("Name", ""),
        "network": hc.get("NetworkMode", ""),
        "status": cont.status,
    }


@router.post("/containers/{cid}/recreate")
def container_recreate(cid: str, body: dict):
    """Stop, remove and re-run a container with patched parameters.

    body: ports {containerPort[/proto]: hostPort|null}, env_set {},
    env_del [], restart <name>, command <str>. Volumes, labels,
    entrypoint, workdir, user and network are preserved.
    """
    c = _client()
    try:
        cont = c.containers.get(cid)
    except docker.errors.NotFound:
        raise HTTPException(404, "container not found")
    a = cont.attrs
    cfg, hc = a.get("Config", {}), a.get("HostConfig", {})

    env = dict(e.split("=", 1) for e in (cfg.get("Env") or []))
    for k, v in (body.get("env_set") or {}).items():
        env[str(k)] = str(v)
    for k in (body.get("env_del") or []):
        env.pop(str(k), None)

    pb = dict(hc.get("PortBindings") or {})
    for key, hp in (body.get("ports") or {}).items():
        key = key if "/" in key else f"{key}/tcp"
        if hp in (None, ""):
            pb.pop(key, None)
        else:
            pb[key] = str(hp)

    volumes = {}
    for m in a.get("Mounts") or []:
        src = m.get("Name") if m.get("Type") == "volume" else m.get("Source")
        if src:
            volumes[src] = {"bind": m.get("Destination"),
                            "mode": m.get("Mode") or "rw"}
    for b in hc.get("Binds") or []:
        src, dst, *mode = b.split(":")
        volumes[src] = {"bind": dst, "mode": mode[0] if mode else "rw"}

    kwargs = {
        "image": cfg.get("Image"),
        "name": cont.name,
        "environment": [f"{k}={v}" for k, v in env.items()],
        "ports": pb,
        "volumes": volumes,
        "restart_policy": {
            "Name": body.get("restart")
                    or (hc.get("RestartPolicy") or {}).get("Name", "")},
        "detach": True,
    }
    if body.get("command"):
        kwargs["command"] = shlex.split(body["command"])
    elif cfg.get("Cmd"):
        kwargs["command"] = cfg["Cmd"]
    for src_key, dst_key in (("Entrypoint", "entrypoint"),
                             ("WorkingDir", "working_dir"),
                             ("User", "user"),
                             ("Labels", "labels"),
                             ("Hostname", "hostname")):
        if cfg.get(src_key):
            kwargs[dst_key] = cfg[src_key]
    if hc.get("Privileged"):
        kwargs["privileged"] = True
    mode = hc.get("NetworkMode") or ""
    if mode in ("host", "none"):
        kwargs["network_mode"] = mode
    elif mode and mode not in ("default", "bridge"):
        kwargs["network"] = mode

    try:
        cont.stop(timeout=10)
        cont.remove()
        newc = c.containers.run(**kwargs)
    except docker.errors.APIError as e:
        raise HTTPException(500, e.explanation or str(e))
    return {"ok": True, "id": newc.short_id}


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
