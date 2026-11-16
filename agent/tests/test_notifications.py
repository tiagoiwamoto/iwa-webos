"""Tests for the aggregated notifications endpoint."""

import json

import pytest

from app.routers import notifications as ntf


@pytest.fixture()
def client(client):  # noqa: F811 — conftest client with token header
    return client


@pytest.fixture(autouse=True)
def env(monkeypatch, tmp_path):
    """Isolate every collector: no tools, no rules file, no jobs file."""
    monkeypatch.setattr(ntf, "JOBS_FILE", tmp_path / "jobs.json")
    monkeypatch.setattr(ntf, "_rules", lambda: [])
    monkeypatch.setattr(ntf, "_evaluate", lambda rules:
                        [dict(r, value=99.0, breach=True) for r in rules])
    monkeypatch.setattr(ntf, "which", lambda tool: None)
    yield


def test_empty_feed(client):
    r = client.get("/api/notifications")
    assert r.is_success
    assert r.json()["items"] == []


def test_alert_breach_is_critical(client, monkeypatch):
    monkeypatch.setattr(ntf, "_rules", lambda: [
        {"id": "r1", "metric": "cpu", "threshold": 90, "path": ""}])
    r = client.get("/api/notifications")
    items = r.json()["items"]
    assert len(items) == 1
    assert items[0]["kind"] == "alert"
    assert items[0]["severity"] == "critical"
    assert items[0]["params"]["metric"] == "cpu"


def test_failed_units(client, monkeypatch):
    monkeypatch.setattr(ntf, "which", lambda tool: tool == "systemctl")
    monkeypatch.setattr(ntf, "run", lambda *a, **k: type("P", (), {
        "returncode": 0,
        "stdout": "foo.service loaded failed failed Foo daemon\n"
    })())
    items = client.get("/api/notifications").json()["items"]
    assert [i["kind"] for i in items] == ["unit"]
    assert items[0]["params"]["unit"] == "foo.service"


def test_journal_errors_deduped(client, monkeypatch):
    monkeypatch.setattr(ntf, "which", lambda tool: tool == "journalctl")
    lines = "\n".join(json.dumps({"MESSAGE": "boom", "_SYSTEMD_UNIT": "x.svc"})
                      for _ in range(6))
    monkeypatch.setattr(ntf, "run", lambda *a, **k: type("P", (), {
        "returncode": 0, "stdout": lines})())
    items = client.get("/api/notifications").json()["items"]
    assert len(items) == 1  # identical entries collapse
    assert items[0]["kind"] == "log"
    assert items[0]["severity"] == "warning"


def test_pending_updates(client, monkeypatch):
    monkeypatch.setattr(ntf, "which", lambda tool: tool == "apt-get")
    monkeypatch.setattr(ntf, "run", lambda *a, **k: type("P", (), {
        "returncode": 0,
        "stdout": "Inst foo [1.0] (1.1 repo)\nInst bar [2.0] (2.1 repo)\nConf x\n"
    })())
    items = client.get("/api/notifications").json()["items"]
    assert items[0]["kind"] == "updates"
    assert items[0]["params"]["count"] == 2


def test_backup_reminder(client, tmp_path, monkeypatch):
    (tmp_path / "jobs.json").write_text(json.dumps([
        {"id": "j1", "local": "/srv/data", "enabled": True, "last": None},
        {"id": "j2", "local": "/srv/ok", "enabled": True,
         "last": "2999-01-01 00:00"},
        {"id": "j3", "local": "/srv/off", "enabled": False, "last": None}]))
    items = client.get("/api/notifications").json()["items"]
    assert len(items) == 1
    assert items[0]["kind"] == "backup"
    assert items[0]["params"]["job"] == "/srv/data"


def test_severity_ordering(client, monkeypatch):
    monkeypatch.setattr(ntf, "_rules", lambda: [
        {"id": "r1", "metric": "mem", "threshold": 90, "path": ""}])
    monkeypatch.setattr(ntf, "which", lambda t: t == "apt-get")
    monkeypatch.setattr(ntf, "run", lambda *a, **k: type("P", (), {
        "returncode": 0, "stdout": "Inst a [1] (2 r)\n"})())
    items = client.get("/api/notifications").json()["items"]
    assert [i["severity"] for i in items] == ["critical", "info"]
