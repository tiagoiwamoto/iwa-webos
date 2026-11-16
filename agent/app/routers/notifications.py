"""Aggregated system notifications for the desktop widget.

GET /api/notifications
  -> {items: [{id, kind, severity, params}], ts}

Sources — each degrades gracefully (missing tool/state simply produces
no items of that kind):

  - alert   threshold breaches (the user's alert rules, evaluated live)
  - unit    failed systemd units
  - log     journal errors (priority err+, current boot, last 5)
  - updates pending package upgrades (apt-get -s, no network)
  - backup  enabled sync jobs never run or older than 7 days
"""

import json
import time

from datetime import datetime
from shutil import which

from fastapi import APIRouter

from ..main import run
from .backup import JOBS_FILE
from .server import _evaluate, _rules

router = APIRouter(prefix="/notifications", tags=["notifications"])

BACKUP_STALE_DAYS = 7
_sev_rank = {"critical": 0, "warning": 1, "info": 2}


def _alert_items(items):
    for r in _evaluate(_rules()):
        if r["breach"]:
            items.append({
                "id": "alert:" + r["id"], "kind": "alert",
                "severity": "critical",
                "params": {"metric": r["metric"],
                           "path": r.get("path") or "",
                           "value": r["value"],
                           "threshold": r["threshold"]}})


def _unit_items(items):
    if not which("systemctl"):
        return
    p = run(["systemctl", "--failed", "--no-legend", "--plain"])
    if p.returncode != 0:
        return
    for line in p.stdout.splitlines()[:5]:
        cols = line.split()
        if cols:
            items.append({
                "id": "unit:" + cols[0], "kind": "unit",
                "severity": "critical",
                "params": {"unit": cols[0],
                           "name": " ".join(cols[4:]) or cols[0]}})


def _log_items(items):
    if not which("journalctl"):
        return
    p = run(["journalctl", "-p", "err", "-b", "--no-pager", "-r", "-n", "30",
             "-o", "json", "--output-fields=MESSAGE,_SYSTEMD_UNIT"])
    if p.returncode != 0:
        return
    seen = set()
    for line in p.stdout.splitlines():
        try:
            e = json.loads(line)
        except ValueError:
            continue
        msg = e.get("MESSAGE") or ""
        unit = e.get("_SYSTEMD_UNIT") or ""
        if (unit, msg) in seen:
            continue
        seen.add((unit, msg))
        items.append({
            "id": f"log:{unit}:{msg[:40]}", "kind": "log",
            "severity": "warning",
            "params": {"unit": unit, "msg": msg[:200]}})
        if len(seen) >= 5:
            break


def _update_items(items):
    if not which("apt-get"):
        return
    p = run(["apt-get", "-s", "upgrade"], timeout=60)
    if p.returncode != 0:
        return
    count = sum(1 for l in p.stdout.splitlines() if l.startswith("Inst "))
    if count:
        items.append({
            "id": "updates", "kind": "updates", "severity": "info",
            "params": {"count": count}})


def _backup_items(items):
    try:
        jobs = json.loads(JOBS_FILE.read_text())
    except (OSError, ValueError):
        jobs = []
    now = time.time()
    for j in jobs:
        if not j.get("enabled", True):
            continue
        last, days = j.get("last"), None
        if last:
            try:
                ts = datetime.strptime(last, "%Y-%m-%d %H:%M").timestamp()
                days = int((now - ts) / 86400)
            except ValueError:
                pass
        if last is None or (days is not None and days > BACKUP_STALE_DAYS):
            items.append({
                "id": "backup:" + j["id"], "kind": "backup",
                "severity": "warning",
                "params": {"job": j.get("local") or j["id"],
                           "last": last, "days": days}})


@router.get("")
def notifications():
    items = []
    # never let one source break the whole feed
    for collect in (_alert_items, _unit_items, _log_items,
                    _update_items, _backup_items):
        try:
            collect(items)
        except Exception:
            pass
    items.sort(key=lambda i: _sev_rank.get(i["severity"], 3))
    return {"items": items, "ts": time.time()}
