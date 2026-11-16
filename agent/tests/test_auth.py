"""Tests for the auth router session-token flow (PAM itself is mocked)."""

import json
import types

import pytest

from fastapi.testclient import TestClient

from app import main


@pytest.fixture()
def client(tmp_path, monkeypatch):
    """TestClient with a stubbed pam module and a tmp sessions file."""
    import app.routers.auth as auth

    fake_pam = types.SimpleNamespace(
        authenticate=lambda u, p, service=None: p == "secret"
    )
    fake_pwd = types.SimpleNamespace(
        getpwnam=lambda name: types.SimpleNamespace(
            pw_name=name, pw_uid=1000, pw_gid=1000,
            pw_gecos="Test User,,,", pw_dir="/home/test",
            pw_shell="/bin/bash")
    )
    fake_grp = types.SimpleNamespace(
        getgrall=lambda: [],
        getgrgid=lambda gid: types.SimpleNamespace(gr_name="test")
    )
    monkeypatch.setattr(auth, "pam", fake_pam)
    monkeypatch.setattr(auth, "pwd", fake_pwd)
    monkeypatch.setattr(auth, "grp", fake_grp)
    monkeypatch.setattr(auth, "SESSIONS_FILE", tmp_path / "sessions.json")
    monkeypatch.setattr(auth, "_sessions", {})
    return TestClient(main.app)


def test_login_issues_session_and_replays_it(client):
    r = client.post("/api/auth/login", json={"username": "test", "password": "secret"},
                    headers={"X-WebOS-Token": main.TOKEN})
    assert r.is_success
    token = r.json()["session"]
    assert token

    r = client.post("/api/auth/session", json={"token": token},
                    headers={"X-WebOS-Token": main.TOKEN})
    assert r.is_success
    assert r.json()["username"] == "test"
    assert r.json()["session"] == token


def test_session_rejects_unknown_token(client):
    r = client.post("/api/auth/session", json={"token": "nope"},
                    headers={"X-WebOS-Token": main.TOKEN})
    assert r.status_code == 401


def test_login_rejects_bad_password(client):
    r = client.post("/api/auth/login", json={"username": "test", "password": "wrong"},
                    headers={"X-WebOS-Token": main.TOKEN})
    assert r.status_code == 401


def test_logout_revokes_token(client):
    r = client.post("/api/auth/login", json={"username": "test", "password": "secret"},
                    headers={"X-WebOS-Token": main.TOKEN})
    token = r.json()["session"]

    r = client.post("/api/auth/logout", json={"token": token},
                    headers={"X-WebOS-Token": main.TOKEN})
    assert r.is_success

    r = client.post("/api/auth/session", json={"token": token},
                    headers={"X-WebOS-Token": main.TOKEN})
    assert r.status_code == 401


def test_session_persists_to_file(client, tmp_path):
    import app.routers.auth as auth

    client.post("/api/auth/login", json={"username": "test", "password": "secret"},
                headers={"X-WebOS-Token": main.TOKEN})
    data = json.loads((tmp_path / "sessions.json").read_text())
    assert len(data) == 1
    token, session = next(iter(data.items()))
    assert session["user"]["username"] == "test"
    assert token not in json.dumps(session["user"])
