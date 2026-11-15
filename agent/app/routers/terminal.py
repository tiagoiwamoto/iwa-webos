"""PTY terminal over WebSocket.

Protocol:
  client -> server: binary/utf-8 text = stdin data
                    json text {"type": "resize", "cols": N, "rows": N}
                    json text {"type": "auth", "token": "..."} (first message)
  server -> client: binary = pty output
"""

import asyncio
import fcntl
import json
import os
import pty
import pwd
import struct
import termios

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from ..main import TOKEN

router = APIRouter()


def _set_size(fd: int, cols: int, rows: int):
    fcntl.ioctl(fd, termios.TIOCSWINSZ, struct.pack("HHHH", rows, cols, 0, 0))


@router.websocket("/ws/terminal")
async def terminal(websocket: WebSocket):
    await websocket.accept()

    # auth: first message must be {"type":"auth","token":"...","username":"..."}
    try:
        first = await asyncio.wait_for(websocket.receive_text(), timeout=10)
        msg = json.loads(first)
        if msg.get("type") != "auth" or msg.get("token") != TOKEN:
            await websocket.close(code=4401)
            return
    except Exception:
        await websocket.close(code=4401)
        return

    # Resolve the session's Linux user; the shell runs as them.
    username = msg.get("username") or ""
    pw = None
    if username:
        try:
            pw = pwd.getpwnam(username)
        except KeyError:
            await websocket.close(code=4403)
            return
        if os.geteuid() != 0 and pw.pw_uid != os.geteuid():
            await websocket.send_bytes(
                f"\r\n[webos] cannot spawn shell as {username}: agent is not root\r\n".encode())
            await websocket.close(code=4403)
            return

    pid, fd = pty.fork()
    if pid == 0:
        env = dict(os.environ)
        env["TERM"] = "xterm-256color"
        shell = "/bin/bash"
        if pw is not None:
            try:
                os.initgroups(pw.pw_name, pw.pw_gid)
                os.setgid(pw.pw_gid)
                os.setuid(pw.pw_uid)
                env.update({
                    "HOME": pw.pw_dir,
                    "USER": pw.pw_name,
                    "LOGNAME": pw.pw_name,
                    "SHELL": pw.pw_shell,
                })
                os.chdir(pw.pw_dir)
                if pw.pw_shell and os.path.exists(pw.pw_shell):
                    shell = pw.pw_shell
            except OSError:
                os._exit(1)
        os.execvpe(shell, [shell, "-l"], env)
        os._exit(1)

    _set_size(fd, 120, 30)
    loop = asyncio.get_running_loop()
    reader_done = asyncio.Event()

    def _read_pty():
        try:
            data = os.read(fd, 65536)
            if data:
                loop.call_soon_threadsafe(
                    asyncio.ensure_future, websocket.send_bytes(data))
            else:
                loop.call_soon_threadsafe(reader_done.set)
        except OSError:
            loop.call_soon_threadsafe(reader_done.set)

    loop.add_reader(fd, _read_pty)

    try:
        while not reader_done.is_set():
            try:
                data = await asyncio.wait_for(websocket.receive(), timeout=1.0)
            except asyncio.TimeoutError:
                continue
            except WebSocketDisconnect:
                break

            if data.get("bytes") is not None:
                os.write(fd, data["bytes"])
            elif data.get("text") is not None:
                text = data["text"]
                if text.startswith("{"):
                    try:
                        msg = json.loads(text)
                        if msg.get("type") == "resize":
                            _set_size(fd, int(msg["cols"]), int(msg["rows"]))
                            continue
                    except (json.JSONDecodeError, KeyError):
                        pass
                    continue
                os.write(fd, text.encode())
    finally:
        loop.remove_reader(fd)
        try:
            os.close(fd)
        except OSError:
            pass
        try:
            os.kill(pid, 9)
            os.waitpid(pid, 0)
        except (OSError, ChildProcessError):
            pass
        try:
            await websocket.close()
        except Exception:
            pass
