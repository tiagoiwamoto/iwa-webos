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


def _temps() -> list:
    """CPU/chipset temperatures: psutil sensors with a sysfs fallback
    (psutil returns {} inside containers without /sys hwmon access)."""
    out = []
    try:
        for chip, entries in psutil.sensors_temperatures().items():
            for e in entries:
                out.append({
                    "sensor": e.label or chip,
                    "temp": e.current,
                    "high": e.high,
                    "critical": e.critical,
                })
    except (AttributeError, OSError):
        pass
    if out:
        return out[:12]
    try:
        import glob
        for z in sorted(glob.glob("/sys/class/thermal/thermal_zone*/temp")):
            base = os.path.dirname(z)
            label = _read_first(os.path.join(base, "type")) or base
            out.append({"sensor": label,
                        "temp": int(open(z).read().strip()) / 1000.0,
                        "high": None, "critical": None})
    except (OSError, ValueError):
        pass
    return out[:12]


def _mounts() -> list:
    skip = ("squashfs", "tmpfs", "devtmpfs", "overlay", "aufs",
            "nsfs", "cgroup", "cgroup2", "proc", "sysfs", "devpts",
            "mqueue", "shm", "ramfs", "fusectl", "debugfs", "tracefs",
            "securityfs", "pstore", "bpf", "configfs", "efivarfs",
            "autofs", "binfmt_misc", "hugetlbfs")
    out = []
    seen = set()
    for p in psutil.disk_partitions(all=False):
        if p.fstype.lower() in skip or p.mountpoint in seen:
            continue
        try:
            u = psutil.disk_usage(p.mountpoint)
        except OSError:
            continue
        seen.add(p.mountpoint)
        out.append({"mount": p.mountpoint, "device": p.device,
                    "fstype": p.fstype, "total": u.total, "used": u.used,
                    "percent": u.percent})
    return sorted(out, key=lambda m: m["mount"])


@router.get("/info")
def info():
    vm = psutil.virtual_memory()
    sw = psutil.swap_memory()
    du = psutil.disk_usage("/")
    osr = _os_release()
    net = psutil.net_io_counters()
    dio = psutil.disk_io_counters()
    freq = psutil.cpu_freq()
    procs = list(psutil.process_iter(["status"]))
    try:
        conns = len(psutil.net_connections(kind="tcp"))
    except (psutil.AccessDenied, OSError):
        conns = None
    return {
        "hostname": platform.node(),
        "domain": _domain(),
        "kernel": platform.release(),
        "os": osr.get("PRETTY_NAME", platform.system()),
        "model": _read_first("/sys/class/dmi/id/product_name",
                             "/sys/firmware/devicetree/base/model"),
        "machine_id": _read_first("/etc/machine-id", "/var/lib/dbus/machine-id"),
        "uptime_seconds": int(time.time() - _boot),
        "boot_time": int(_boot),
        "cpu": {
            "count": psutil.cpu_count(),
            "percent": psutil.cpu_percent(interval=0.1),
            "per_cpu": psutil.cpu_percent(interval=None, percpu=True),
            "freq_mhz": freq.current if freq else None,
            "temps": _temps(),
            "loadavg": list(os.getloadavg()) if hasattr(os, "getloadavg") else None,
        },
        "memory": {"total": vm.total, "used": vm.used, "percent": vm.percent,
                   "swap_total": sw.total, "swap_used": sw.used,
                   "swap_percent": sw.percent},
        "root_disk": {"total": du.total, "used": du.used, "percent": du.percent},
        "mounts": _mounts(),
        "disk_io": {"read_bytes": dio.read_bytes if dio else 0,
                    "write_bytes": dio.write_bytes if dio else 0,
                    "ts": time.time()},
        "network_io": {"rx_bytes": net.bytes_recv, "tx_bytes": net.bytes_sent,
                       "ts": time.time(),
                       "connections": conns},
        "processes": {"total": len(procs),
                      "running": sum(1 for p in procs
                                     if p.info["status"] == "running")},
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
