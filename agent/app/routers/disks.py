"""Disk management: lsblk listing, fdisk partition table view, and
partition/filesystem operations via parted + mkfs + mount.

Destructive actions are refused on devices that (or whose partitions) are
mounted.
"""

import json
import re
import shutil

from fastapi import APIRouter, HTTPException

from ..main import run

router = APIRouter(prefix="/disks", tags=["disks"])

_DEV = re.compile(r"^/dev/[a-zA-Z0-9/_-]+$")
_FS_TYPES = ("ext4", "ext3", "xfs", "btrfs", "vfat", "exfat", "ntfs", "swap")


def _devices() -> dict:
    proc = run(["lsblk", "-J", "-b", "-o",
                "NAME,KNAME,PKNAME,PATH,TYPE,SIZE,FSTYPE,LABEL,UUID,MOUNTPOINTS,FSSIZE,FSAVAIL,FSUSE%,RM,RO,HOTPLUG,MODEL,TRAN"])
    if proc.returncode != 0:
        raise HTTPException(500, proc.stderr.strip() or "lsblk failed")
    return json.loads(proc.stdout)


def _device_ok(device: str) -> dict:
    """Resolve a device node that lsblk actually reports."""
    if not _DEV.match(device):
        raise HTTPException(400, "invalid device path")
    found = _find_node(_devices().get("blockdevices", []), device)
    if found is None:
        raise HTTPException(404, f"{device} not found")
    return found


def _find_node(nodes: list, path: str) -> dict | None:
    for n in nodes:
        if n.get("path") == path:
            return n
        hit = _find_node(n.get("children") or [], path)
        if hit:
            return hit
    return None


def _mounted(node: dict) -> bool:
    if node.get("mountpoints"):
        return any(node["mountpoints"])
    return False


def _guard_mounted(node: dict):
    """Refuse destructive ops on a mounted device."""
    if _mounted(node):
        raise HTTPException(409, "device is mounted — unmount it first")
    for child in node.get("children") or []:
        if _mounted(child):
            raise HTTPException(
                409, f"{child.get('path')} is mounted — unmount it first")


@router.get("")
def list_disks():
    return _devices()


@router.get("/table")
def partition_table(device: str):
    """`fdisk -l <dev>` output for the selected disk."""
    _device_ok(device)
    proc = run(["fdisk", "-l", device])
    # "no partition table"/"no medium" are informative, not exceptions:
    # return fdisk's message so the panel can show it
    return {"output": (proc.stdout + proc.stderr).strip() or "no output"}


@router.post("/mklabel")
def mklabel(body: dict):
    device = str(body.get("device") or "")
    label = str(body.get("label") or "gpt")
    node = _device_ok(device)
    if node.get("type") != "disk":
        raise HTTPException(400, "select a whole disk")
    if label not in ("gpt", "msdos"):
        raise HTTPException(400, "label must be gpt or msdos")
    _guard_mounted(node)
    proc = run(["parted", "-s", device, "mklabel", label])
    if proc.returncode != 0:
        raise HTTPException(500, proc.stderr.strip() or proc.stdout.strip())
    return {"ok": True}


@router.post("/mkpart")
def mkpart(body: dict):
    device = str(body.get("device") or "")
    start = str(body.get("start") or "0%")
    end = str(body.get("end") or "100%")
    fs_type = str(body.get("fs") or "ext4")
    node = _device_ok(device)
    if node.get("type") != "disk":
        raise HTTPException(400, "select a whole disk")
    if not re.match(r"^\d{1,3}%$", start) or not re.match(r"^\d{1,3}%$", end):
        raise HTTPException(400, "start/end must be percentages like 0% 50%")
    _guard_mounted(node)
    proc = run(["parted", "-s", device, "mkpart", "primary",
                fs_type, start, end])
    if proc.returncode != 0:
        raise HTTPException(500, proc.stderr.strip() or proc.stdout.strip())
    run(["partprobe", device])
    return {"ok": True}


@router.post("/rmpart")
def rmpart(body: dict):
    device = str(body.get("device") or "")
    node = _device_ok(device)
    if node.get("type") != "part":
        raise HTTPException(400, "select a partition")
    _guard_mounted(node)
    parent_path = node.get("pkname")
    disk = f"/dev/{parent_path}" if parent_path else device.rstrip("0123456789p")
    disk_node = _device_ok(disk)
    _guard_mounted(disk_node)
    num = re.search(r"(\d+)$", node.get("kname") or node.get("name") or "")
    if not num:
        raise HTTPException(400, "cannot determine partition number")
    proc = run(["parted", "-s", disk, "rm", num.group(1)])
    if proc.returncode != 0:
        raise HTTPException(500, proc.stderr.strip() or proc.stdout.strip())
    run(["partprobe", disk])
    return {"ok": True}


@router.post("/mkfs")
def mkfs(body: dict):
    device = str(body.get("device") or "")
    fs_type = str(body.get("fs") or "ext4")
    label = str(body.get("label") or "")
    node = _device_ok(device)
    if fs_type not in _FS_TYPES:
        raise HTTPException(400, f"fs must be one of {', '.join(_FS_TYPES)}")
    _guard_mounted(node)
    tool = "mkswap" if fs_type == "swap" else f"mkfs.{fs_type}"
    if not shutil.which(tool):
        raise HTTPException(400, f"{tool} not installed")
    cmd = [tool]
    if label:
        cmd += {"vfat": ["-n", label], "ntfs": ["-L", label],
                "swap": ["-L", label]}.get(fs_type, ["-L", label])
    if fs_type != "swap":
        cmd.append("-F" if fs_type == "vfat" else "-f")
    cmd.append(device)
    proc = run(cmd, timeout=120)
    if proc.returncode != 0:
        raise HTTPException(500, proc.stderr.strip() or proc.stdout.strip())
    return {"ok": True}


@router.post("/mount")
def mount(body: dict):
    device = str(body.get("device") or "")
    target = str(body.get("target") or "")
    node = _device_ok(device)
    if _mounted(node):
        raise HTTPException(409, "already mounted")
    if shutil.which("udisksctl") and not target:
        proc = run(["udisksctl", "mount", "-b", device])
    else:
        if not target or not target.startswith("/"):
            raise HTTPException(400, "target mountpoint required")
        proc = run(["mount", device, target])
    if proc.returncode != 0:
        raise HTTPException(500, proc.stderr.strip() or proc.stdout.strip())
    return {"output": proc.stdout.strip()}


@router.post("/unmount")
def unmount(body: dict):
    device = str(body.get("device") or "")
    force = bool(body.get("force"))
    _device_ok(device)
    if shutil.which("udisksctl"):
        cmd = ["udisksctl", "unmount", "-b", device]
        if force:
            cmd.append("--force")
    else:
        cmd = ["umount", "-f" if force else "", device]
    proc = run([c for c in cmd if c])
    if proc.returncode != 0:
        raise HTTPException(500, proc.stderr.strip() or proc.stdout.strip())
    return {"output": proc.stdout.strip()}


@router.post("/wipefs")
def wipefs(body: dict):
    device = str(body.get("device") or "")
    node = _device_ok(device)
    _guard_mounted(node)
    proc = run(["wipefs", "-a", device])
    if proc.returncode != 0:
        raise HTTPException(500, proc.stderr.strip() or proc.stdout.strip())
    return {"ok": True}


@router.post("/power-off")
def power_off(body: dict):
    device = str(body.get("device") or "")
    _device_ok(device)
    if not shutil.which("udisksctl"):
        raise HTTPException(400, "udisks2 not available")
    proc = run(["udisksctl", "power-off", "-b", device])
    if proc.returncode != 0:
        raise HTTPException(500, proc.stderr.strip() or proc.stdout.strip())
    return {"output": proc.stdout.strip()}


@router.get("/udisks-available")
def udisks_available():
    return {"available": shutil.which("udisksctl") is not None}
