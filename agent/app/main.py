"""WebOS Agent - privileged backend for the OS.js based web desktop.

Runs on 127.0.0.1:8765 by default and is meant to be reached through the
OS.js server proxy (which injects the auth token), or directly during dev.
"""

import os
import subprocess
from pathlib import Path

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException, WebSocket, WebSocketException, status

load_dotenv(Path(__file__).resolve().parents[2] / ".env")

TOKEN = os.environ.get("WEBOS_TOKEN", "changeme")

app = FastAPI(title="webos-agent", version="0.1.0")


def _deny():
    raise HTTPException(status.HTTP_401_UNAUTHORIZED, "invalid token")


def require_token(x_webos_token: str = Header(default="")):
    if x_webos_token != TOKEN:
        _deny()


def require_ws_token(websocket: WebSocket):
    if websocket.query_params.get("token") != TOKEN:
        raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION)


def run(cmd: list[str], timeout: int = 30, input_text: str | None = None) -> subprocess.CompletedProcess:
    return subprocess.run(
        cmd, capture_output=True, text=True, timeout=timeout, input=input_text
    )


from app.routers import auth, backup, browser, cron, disks, docker_api, files, logs, processes, remote, services, store, system, terminal, users  # noqa: E402

for router in (system.router, files.router, disks.router, users.router,
               docker_api.router, services.router, auth.router,
               processes.router, store.router, logs.router, cron.router,
               remote.router, backup.router, browser.router):
    app.include_router(router, prefix="/api", dependencies=[Depends(require_token)])

app.include_router(terminal.router)


@app.get("/health")
def health():
    return {"ok": True}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="127.0.0.1", port=8765, reload=True)
