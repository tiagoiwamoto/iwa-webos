"""Shared fixtures for the webos-agent test-suite.

The agent executes privileged subprocesses via ``app.main.run``; every
test replaces it (and the ``shutil.which`` capability probe ``_has``) in
the ``app.routers.server`` module with a fake that answers canned output
per command prefix. Filesystem paths that point at privileged locations
(``/etc/nginx``, ``/etc/samba``, ``/etc/wireguard`` …) are redirected to
``tmp_path`` so nothing outside the sandbox is touched.
"""
import subprocess
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app import main                       # noqa: E402
from app.routers import server             # noqa: E402

ALL_TOOLS = {"ufw", "ip", "ss", "apt-get", "apt-cache", "dpkg-query",
             "apt", "nginx", "certbot", "openssl", "testparm", "exportfs",
             "psql", "mysql", "runuser", "fail2ban-client", "sshd",
             "smartctl", "lsblk", "wg", "wg-quick", "hostnamectl",
             "systemctl", "crontab", "sudo", "smbcontrol"}


def mkproc(cmd=(), out="", err="", rc=0):
    return subprocess.CompletedProcess(cmd, rc, out, err)


class Fake:
    """Callable stand-in for ``app.routers.server.run``.

    ``add(prefix, out, err, rc)`` registers a canned response matched by
    command prefix; ``add(prefix, fn=callable)`` lets a handler compute the
    result from (cmd, input_text). Unmatched commands succeed silently.
    Every invoked command is recorded in ``calls``.
    """

    def __init__(self):
        self.calls = []
        self.routes = []
        self.tools = set(ALL_TOOLS)

    def add(self, prefix, out="", err="", rc=0, fn=None):
        self.routes.append((tuple(prefix), fn or mkproc(out=out, err=err, rc=rc)))

    def __call__(self, cmd, timeout=30, input_text=None, **kw):
        self.calls.append(list(cmd))
        for prefix, proc in self.routes:
            if tuple(cmd[:len(prefix)]) == prefix:
                return proc(cmd, input_text) if callable(proc) else proc
        return mkproc(cmd)

    def called(self, *prefix):
        return any(tuple(c[:len(prefix)]) == tuple(prefix) for c in self.calls)


@pytest.fixture
def fake(monkeypatch):
    f = Fake()
    monkeypatch.setattr(server, "run", f)
    monkeypatch.setattr(server, "_has", lambda t: t in f.tools)
    return f


@pytest.fixture
def paths(monkeypatch, tmp_path):
    """Redirect every privileged path constant into tmp_path."""
    avail = tmp_path / "sites-available"
    enabled = tmp_path / "sites-enabled"
    avail.mkdir()
    enabled.mkdir()
    wg = tmp_path / "wireguard"
    wg.mkdir()
    monkeypatch.setattr(server, "NGINX_AVAIL", avail)
    monkeypatch.setattr(server, "NGINX_ENABLED", enabled)
    monkeypatch.setattr(server, "CERT_LIVE", tmp_path / "letsencrypt" / "live")
    monkeypatch.setattr(server, "SMB_CONF", tmp_path / "smb.conf")
    monkeypatch.setattr(server, "NFS_EXPORTS", tmp_path / "exports")
    monkeypatch.setattr(server, "WG_DIR", wg)
    monkeypatch.setattr(server, "RULES_FILE",
                        tmp_path / "state" / ".alert-rules.json")
    return tmp_path


@pytest.fixture
def client():
    c = TestClient(main.app)
    c.headers["x-webos-token"] = main.TOKEN
    return c
