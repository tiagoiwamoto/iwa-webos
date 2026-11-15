"""System information endpoints."""

import os
import platform
import re
import time

import psutil
from fastapi import APIRouter, HTTPException

from ..main import run

router = APIRouter(prefix="/system", tags=["system"])

_boot = psutil.boot_time()
_HOSTNAME = re.compile(r"^[a-zA-Z0-9][a-zA-Z0-9.-]{0,252}$")


def _os_release() -> dict:
    data = {}
    try:
        for line in open("/etc/os-release"):
            if "=" in line:
                k, v = line.strip().split("=", 1)
                data[k] = v.strip('"')
    except OSError:
        pass
    return data


def _read_first(*paths) -> str | None:
    for p in paths:
        try:
            value = open(p).read().strip()
            if value and value.lower() not in ("none", "unknown"):
                return value
        except OSError:
            continue
    return None


def _domain() -> str:
    # dnsdomainname prints the NIS/YP domain; on modern systems that's what
    # resolv.conf's `domain`/`search` says, so parse that too as fallback
    proc = run(["dnsdomainname"])
    name = proc.stdout.strip()
    if proc.returncode != 0 or not name or name == "(none)":
        name = ""
    if not name:
        try:
            for line in open("/etc/resolv.conf"):
                parts = line.split()
                if parts and parts[0] in ("domain", "search") and len(parts) > 1:
                    name = parts[1]
                    break
        except OSError:
            pass
    return name


@router.get("/info")
def info():
    vm = psutil.virtual_memory()
    du = psutil.disk_usage("/")
    osr = _os_release()
    net = psutil.net_io_counters()
    return {
        "hostname": platform.node(),
        "domain": _domain(),
        "kernel": platform.release(),
        "os": osr.get("PRETTY_NAME", platform.system()),
        "model": _read_first("/sys/class/dmi/id/product_name",
                             "/sys/firmware/devicetree/base/model"),
        "machine_id": _read_first("/etc/machine-id", "/var/lib/dbus/machine-id"),
        "uptime_seconds": int(time.time() - _boot),
        "cpu": {
            "count": psutil.cpu_count(),
            "percent": psutil.cpu_percent(interval=0.1),
            "loadavg": list(os.getloadavg()) if hasattr(os, "getloadavg") else None,
        },
        "memory": {"total": vm.total, "used": vm.used, "percent": vm.percent},
        "root_disk": {"total": du.total, "used": du.used, "percent": du.percent},
        "network_io": {"rx_bytes": net.bytes_recv, "tx_bytes": net.bytes_sent,
                       "ts": time.time()},
    }


@router.post("/hostname")
def set_hostname(body: dict):
    name = (body.get("hostname") or "").strip()
    if not _HOSTNAME.match(name) or ".." in name:
        raise HTTPException(400, "invalid hostname")
    proc = run(["hostnamectl", "set-hostname", name])
    if proc.returncode != 0:
        raise HTTPException(500, proc.stderr.strip() or "hostnamectl failed")
    return {"ok": True, "hostname": name}
