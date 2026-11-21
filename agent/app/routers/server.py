"""Server administration: firewall, network, packages, web sites, TLS
certificates, databases, file shares, security, disk health, VPN and
threshold alerts — the thin layer missing between Malta OS and a Cockpit-
like panel.

Every section degrades gracefully: when the underlying tool is absent the
endpoint answers {"available": false} so the UI can grey itself out instead
of erroring. All mutating inputs are validated against strict whitelists —
this process runs privileged.
"""

import json
import os
import re
import secrets
import shutil
import subprocess
import tempfile
import time
from pathlib import Path

import psutil
from fastapi import APIRouter, HTTPException

from ..main import run

router = APIRouter(prefix="/server", tags=["server"])

_has = shutil.which

# ---- validation -----------------------------------------------------------
_PORT = re.compile(r"^\d{1,5}(-\d{1,5})?$")          # 80 | 8000-8010
_NAME = re.compile(r"^[A-Za-z0-9_][A-Za-z0-9_.-]{0,63}$")
_HOSTNAME = re.compile(r"^[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?$")
_DOMAIN = re.compile(r"^(\*\.)?[A-Za-z0-9]([A-Za-z0-9.-]{0,250}[A-Za-z0-9])?$")
_IP = re.compile(r"^[0-9a-fA-F:.,/%]{1,45}$")        # v4/v6/CIDR, commas for lists
_IFACE = re.compile(r"^[A-Za-z0-9_.@-]{1,32}$")
_PATH = re.compile(r"^/[A-Za-z0-9_./~ -]{0,254}$")
_PKG = re.compile(r"^[A-Za-z0-9][A-Za-z0-9+._:-]{0,127}$")
_PUBKEY = re.compile(r"^[A-Za-z0-9+/]{43}=$")
_JAIL = re.compile(r"^[A-Za-z0-9_-]{1,40}$")
_EMAIL = re.compile(r"^[^@\s]{1,64}@[^@\s]{1,128}\.[^@\s]{1,24}$")
_PROXY = re.compile(r"^https?://[A-Za-z0-9._~-]+(:\d{1,5})?(/[A-Za-z0-9_./~-]*)?$")
_COMMENT = re.compile(r"^[A-Za-z0-9_ .,:/@-]{0,80}$")


def _req(cond, msg="invalid input"):
    if not cond:
        raise HTTPException(400, msg)


def _port(p):
    p = str(p or "").strip()
    _req(_PORT.match(p), "invalid port")
    a, _, b = p.partition("-")
    _req(1 <= int(a) <= 65535 and (not b or int(a) <= int(b) <= 65535),
         "port out of range")
    return p


def _path(p, must_exist=False):
    p = str(p or "").strip()
    _req(_PATH.match(p) and ".." not in p, "invalid path")
    if must_exist:
        _req(Path(p).is_dir(), f"{p} is not a directory")
    return p


def _run(cmd, timeout=30, check=True, **kw):
    proc = run(cmd, timeout=timeout, **kw)
    if check and proc.returncode != 0:
        raise HTTPException(500, (proc.stderr or proc.stdout).strip() or
                          f"{cmd[0]} failed ({proc.returncode})")
    return proc


# ---------------------------------------------------------------------------
# capabilities

@router.get("/capabilities")
def capabilities():
    tools = ("ufw", "ip", "ss", "apt-get", "apt-cache", "dpkg-query", "dnf",
             "yum", "pacman", "zypper", "apk", "slackpkg", "rpm", "nginx",
             "certbot", "openssl", "testparm", "exportfs", "psql", "mysql",
             "runuser", "fail2ban-client", "sshd", "smartctl", "lsblk",
             "wg", "wg-quick", "hostnamectl", "systemctl", "crontab")
    return {t: bool(_has(t)) for t in tools}


# ---------------------------------------------------------------------------
# package manager detection — the panel works on apt, dnf/yum, pacman,
# zypper, apk and slackpkg systems

def _pm():
    """Detect the system package manager from the binaries on PATH."""
    for pm, bins in (("apt", ("apt-get", "apt-cache")),
                     ("dnf", ("dnf",)),
                     ("yum", ("yum",)),
                     ("pacman", ("pacman",)),
                     ("zypper", ("zypper",)),
                     ("apk", ("apk",)),
                     ("slackpkg", ("slackpkg",))):
        if all(_has(b) for b in bins):
            return pm
    return None


@router.get("/pkgmanager")
def pkgmanager():
    return {"manager": _pm()}


_PM_INSTALL = {
    "apt":      ["apt-get", "install", "-y", "--no-install-recommends"],
    "dnf":      ["dnf", "install", "-y"],
    "yum":      ["yum", "install", "-y"],
    "pacman":   ["pacman", "-S", "--noconfirm", "--needed"],
    "zypper":   ["zypper", "-n", "install", "-y"],
    "apk":      ["apk", "add"],
    "slackpkg": ["slackpkg", "-batch=on", "-default_answer=y", "install"],
}

# tool → package name per manager ("default" is the fallback)
TOOL_PKGS = {
    "ufw":           {"default": "ufw"},
    "iproute2":      {"default": "iproute2"},
    "openssh":       {"apt": "openssh-server", "dnf": "openssh-server",
                      "yum": "openssh-server", "zypper": "openssh",
                      "default": "openssh"},
    "nginx":         {"default": "nginx"},
    "certbot":       {"default": "certbot"},
    "postgresql":    {"dnf": "postgresql-server", "yum": "postgresql-server",
                      "zypper": "postgresql-server", "default": "postgresql"},
    "mariadb":       {"apt": "mariadb-server", "dnf": "mariadb-server",
                      "yum": "mariadb-server", "zypper": "mariadb",
                      "default": "mariadb"},
    "samba":         {"default": "samba"},
    "nfs":           {"apt": "nfs-kernel-server", "zypper": "nfs-kernel-server",
                      "default": "nfs-utils"},
    "fail2ban":      {"default": "fail2ban"},
    "smartmontools": {"default": "smartmontools"},
    "wireguard":     {"default": "wireguard-tools"},
}


@router.post("/tools")
def tool_install(body: dict):
    tool = str(body.get("tool") or "")
    _req(tool in TOOL_PKGS, "unknown tool")
    pm = _pm()
    _req(pm, "no supported package manager")
    pkg = TOOL_PKGS[tool].get(pm, TOOL_PKGS[tool]["default"])
    env = {**os.environ, "DEBIAN_FRONTEND": "noninteractive"}
    proc = _run(_PM_INSTALL[pm] + [pkg], timeout=600, check=False, env=env)
    if proc.returncode != 0 and pm == "apt":
        run(["apt-get", "update"], timeout=300)
        proc = _run(_PM_INSTALL[pm] + [pkg], timeout=600, env=env)
    _req(proc.returncode == 0,
         (proc.stderr or proc.stdout).strip()[:300] or "install failed")
    return {"ok": True, "package": pkg, "output": proc.stdout[-2000:]}


# ---------------------------------------------------------------------------
# firewall (ufw)

_RULE = re.compile(r"\[\s*(\d+)\]\s+(.+?)\s{2,}(ALLOW|DENY|REJECT|LIMIT)"
                   r"\s+(IN|OUT|FWD)\s+(.+)$")


@router.get("/firewall")
def firewall():
    if not _has("ufw"):
        return {"available": False}
    proc = run(["ufw", "status", "numbered"])
    out = proc.stdout
    rules = [{"num": int(m.group(1)), "to": m.group(2).strip(),
              "action": m.group(3), "dir": m.group(4),
              "src": m.group(5).strip()}
             for m in map(_RULE.match, out.splitlines()) if m]
    return {"available": True, "active": "Status: active" in out,
            "rules": rules, "raw": out}


@router.post("/firewall")
def firewall_op(body: dict):
    _req(_has("ufw"), "ufw not installed")
    op = body.get("op", "")
    if op in ("enable", "disable", "reload"):
        proc = _run(["ufw", "--force", op])
        return {"ok": True, "output": proc.stdout}
    if op == "delete":
        num = body.get("num")
        _req(isinstance(num, int) and 1 <= num < 1000, "invalid rule number")
        proc = _run(["ufw", "--force", "delete", str(num)])
        return {"ok": True, "output": proc.stdout}
    if op == "add":
        action = body.get("action", "allow")
        direction = body.get("direction", "in")
        proto = body.get("proto", "any")
        _req(action in ("allow", "deny", "reject", "limit"), "bad action")
        _req(direction in ("in", "out"), "bad direction")
        _req(proto in ("tcp", "udp", "any"), "bad protocol")
        src = str(body.get("from") or "any").strip()
        dst = str(body.get("to") or "any").strip()
        for v in (src, dst):
            _req(v == "any" or _IP.match(v), f"bad address {v!r}")
        port = body.get("port")
        cmd = ["ufw", action, direction, "from", src, "to", dst]
        if port not in (None, ""):
            cmd += ["port", _port(port)]
        if proto != "any":
            _req(port not in (None, ""), "proto requires a port")
            cmd += ["proto", proto]
        comment = str(body.get("comment") or "").strip()
        if comment:
            _req(_COMMENT.match(comment), "bad comment")
            cmd += ["comment", comment]
        proc = _run(cmd)
        return {"ok": True, "output": proc.stdout}
    raise HTTPException(400, "bad op")


# ---------------------------------------------------------------------------
# network

@router.get("/network")
def network():
    if not _has("ip"):
        return {"available": False}
    ifaces = []
    proc = run(["ip", "-j", "addr", "show"])
    if proc.returncode == 0:
        try:
            for i in json.loads(proc.stdout):
                ifaces.append({
                    "name": i.get("ifname"), "state": i.get("operstate"),
                    "mac": i.get("address"),
                    "ips": [f"{a.get('local')}/{a.get('prefixlen')}"
                            for a in i.get("addr_info", [])
                            if a.get("family") in ("inet", "inet6")]})
        except json.JSONDecodeError:
            pass

    routes = []
    proc = run(["ip", "-j", "route", "show", "default"])
    if proc.returncode == 0:
        try:
            routes = [{"via": r.get("gateway"), "dev": r.get("dev")}
                      for r in json.loads(proc.stdout)]
        except json.JSONDecodeError:
            pass

    listen = []
    for args, proto in ((["ss", "-tlnp"], "tcp"), (["ss", "-ulnp"], "udp")):
        proc = run(args)
        for line in proc.stdout.splitlines():
            cols = line.split()
            if len(cols) < 4 or cols[0].lower() in ("netid", "state"):
                continue
            proc_name = ""
            m = re.search(r'users:\(\("([^"]+)"', line)
            if m:
                proc_name = m.group(1)
            listen.append({"proto": proto, "state": cols[0],
                           "local": cols[3],
                           "process": proc_name})

    dns = []
    try:
        dns = [l.split()[1] for l in Path("/etc/resolv.conf").read_text()
               .splitlines() if l.startswith("nameserver")][:4]
    except OSError:
        pass

    host = run(["hostname"]).stdout.strip()
    return {"available": True, "hostname": host, "interfaces": ifaces,
            "routes": routes, "listening": listen, "dns": dns}


@router.post("/network")
def network_op(body: dict):
    op = body.get("op", "")
    if op == "hostname":
        name = str(body.get("name") or "").strip()
        _req(_HOSTNAME.match(name), "invalid hostname")
        _req(_has("hostnamectl"), "hostnamectl not installed")
        _run(["hostnamectl", "set-hostname", name])
        return {"ok": True}
    raise HTTPException(400, "bad op")


# ---------------------------------------------------------------------------
# packages (apt / dnf / yum / pacman / zypper / apk / slackpkg)

_SLACK_PKG = re.compile(r"^(.+)-([^-]+)-([^-]+)-([^-]+)$")
_APK_PKG = re.compile(r"^(.+)-(\d[^-]*-r\d+.*)$")
_RPM_ARCHES = ("x86_64", "noarch", "aarch64", "ppc64le", "s390x", "i386",
               "i486", "i586", "i686", "armv6hl", "armv7hl", "armhfp", "src")


def _slack_split(s):
    """'name-version-arch-build' → (name, version)."""
    m = _SLACK_PKG.match(s)
    return (m.group(1), m.group(2)) if m else (s, "")


def _apk_split(s):
    """'name-1.2.3-r4' → (name, version)."""
    m = _APK_PKG.match(s)
    return (m.group(1), m.group(2)) if m else (s, "")


def _pm_installed(pm):
    """Return {name: version} for every installed package."""
    if pm == "apt":
        proc = run(["dpkg-query", "-W", "-f=${binary:Package}\t${Version}\n"],
                   timeout=60)
        rows = (l.split("\t", 1) for l in proc.stdout.splitlines())
    elif pm in ("dnf", "yum", "zypper") and _has("rpm"):
        proc = run(["rpm", "-qa", "--qf", "%{NAME}\t%{VERSION}\n"],
                   timeout=60)
        rows = (l.split("\t", 1) for l in proc.stdout.splitlines())
    elif pm == "pacman":
        proc = run(["pacman", "-Q"], timeout=60)
        rows = (l.split(None, 1) for l in proc.stdout.splitlines())
    elif pm == "apk":
        proc = run(["apk", "info", "-v"], timeout=60)
        rows = (_apk_split(l) for l in proc.stdout.splitlines())
    elif pm == "slackpkg":
        try:
            rows = (_slack_split(f.name)
                    for f in Path("/var/log/packages").iterdir())
        except OSError:
            rows = ()
    else:
        rows = ()
    return {r[0]: (r[1] if len(r) > 1 else "") for r in rows if r and r[0]}


def _pm_updates(pm):
    if pm == "apt":
        proc = run(["apt", "list", "--upgradable"], timeout=90)
        out = []
        for line in proc.stdout.splitlines():
            m = re.match(r"^(\S+)/\S+\s+(\S+)\s+(\S+)\s+\[upgradable from: "
                         r"(\S+)\]", line)
            if m:
                out.append({"name": m.group(1), "version": m.group(2),
                            "arch": m.group(3), "from": m.group(4)})
        return out
    if pm in ("dnf", "yum"):
        proc = run([pm, "check-update", "-q"], timeout=300)
        out = []
        for line in proc.stdout.splitlines():
            cols = line.split()
            if len(cols) == 3 and "." in cols[0]:
                name, _, arch = cols[0].rpartition(".")
                out.append({"name": name, "version": cols[1],
                            "arch": arch, "from": ""})
        return out
    if pm == "pacman":
        proc = run(["pacman", "-Qu"], timeout=30)
        out = []
        for line in proc.stdout.splitlines():
            m = re.match(r"^(\S+)\s+(\S+)\s+->\s+(\S+)", line)
            if m:
                out.append({"name": m.group(1), "from": m.group(2),
                            "version": m.group(3)})
        return out
    if pm == "zypper":
        proc = run(["zypper", "-n", "lu"], timeout=120)
        out = []
        for line in proc.stdout.splitlines():
            cols = [c.strip() for c in line.split("|")]
            if len(cols) >= 5 and cols[0] == "v":
                out.append({"name": cols[2], "from": cols[3],
                            "version": cols[4],
                            "arch": cols[5] if len(cols) > 5 else ""})
        return out
    if pm == "apk":
        proc = run(["apk", "version", "-l", "<"], timeout=30)
        out = []
        for line in proc.stdout.splitlines():
            m = re.match(r"^(\S+)\s+<\s+(\S+)", line)
            if m:
                name, cur = _apk_split(m.group(1))
                out.append({"name": name, "from": cur,
                            "version": m.group(2)})
        return out
    return []


def _pm_search(pm, q, have):
    if pm == "apt":
        proc = run(["apt-cache", "search", "--names-only", q], timeout=30)
        return [{"name": n.strip(), "desc": d.strip()[:80],
                 "installed": n.strip() in have}
                for n, _, d in (l.partition(" - ")
                                for l in proc.stdout.splitlines()[:200])
                if n]
    if pm in ("dnf", "yum"):
        proc = run([pm, "search", q], timeout=120)
        out, seen = [], set()
        arch_re = r"\.(" + "|".join(_RPM_ARCHES) + r")$"
        for line in proc.stdout.splitlines():
            name, sep, desc = line.partition(" : ")      # dnf4
            if not sep:
                name, sep, desc = line.partition("\t")  # dnf5
            name = re.sub(arch_re, "", name.strip()) if sep else ""
            if sep and name and name not in seen:
                seen.add(name)
                out.append({"name": name, "desc": desc.strip()[:80],
                            "installed": name in have})
            if len(out) >= 200:
                break
        return out
    if pm == "pacman":
        proc = run(["pacman", "-Ss", q], timeout=30)
        out, cur = [], None
        for line in proc.stdout.splitlines()[:400]:
            m = re.match(r"^(\S+)/(\S+)\s+(\S+)(.*)$", line)
            if m:
                cur = {"name": m.group(2), "version": m.group(3),
                       "desc": "",
                       "installed": "[installed" in m.group(4)}
                out.append(cur)
            elif cur is not None and line.startswith((" ", "\t")):
                cur["desc"] = line.strip()[:80]
        for p in out:
            p["installed"] = p["installed"] or p["name"] in have
        return out
    if pm == "zypper":
        proc = run(["zypper", "-n", "se", q], timeout=60)
        out = []
        for line in proc.stdout.splitlines():
            cols = [c.strip() for c in line.split("|")]
            if len(cols) >= 4 and cols[0].lower() not in ("s", "") \
                    and cols[1] != "Name":
                out.append({"name": cols[1], "desc": cols[2][:80],
                            "installed": "i" in cols[0]})
        return out
    if pm == "apk":
        proc = run(["apk", "search", q], timeout=30)
        out = []
        for line in proc.stdout.splitlines()[:200]:
            name, ver = _apk_split(line.strip())
            if name:
                out.append({"name": name, "version": ver,
                            "desc": "", "installed": name in have})
        return out
    if pm == "slackpkg":
        proc = run(["slackpkg", "search", q], timeout=60)
        out = []
        for line in proc.stdout.splitlines():
            m = re.match(r"^\[\s*(\w+)\s*\]\s+-\s+(\S+)", line)
            if m:
                name, ver = _slack_split(m.group(2))
                out.append({"name": name, "version": ver, "desc": "",
                            "installed": m.group(1) == "installed"})
        return out[:200]
    return []


@router.get("/packages")
def packages(q: str = "", updates: bool = False, installed: bool = False):
    pm = _pm()
    if not pm:
        return {"manager": None, "packages": [], "updates": []}
    if updates:
        return {"manager": pm, "updates": _pm_updates(pm)}
    have = _pm_installed(pm)
    if installed:
        pk = [{"name": n, "version": v, "installed": True}
              for n, v in have.items()
              if not q or q.lower() in n.lower()]
        return {"manager": pm, "packages": pk[:500],
                "truncated": len(pk) > 500}
    q = q.strip()
    _req(2 <= len(q) <= 64 and "\n" not in q, "bad query")
    return {"manager": pm, "packages": _pm_search(pm, q, have)}


# user-facing installs pull recommends (unlike tool installs above)
_PM_PKG_INSTALL = dict(_PM_INSTALL, apt=["apt-get", "-y", "install"])

_PM_REMOVE = {
    "apt":      ["apt-get", "-y", "remove"],
    "dnf":      ["dnf", "-y", "remove"],
    "yum":      ["yum", "-y", "remove"],
    "pacman":   ["pacman", "-R", "--noconfirm"],
    "zypper":   ["zypper", "-n", "remove"],
    "apk":      ["apk", "del"],
    "slackpkg": ["slackpkg", "-batch=on", "-default_answer=y", "remove"],
}

_PM_REFRESH = {
    "apt":      ["apt-get", "update"],
    "dnf":      ["dnf", "makecache"],
    "yum":      ["yum", "makecache"],
    "pacman":   ["pacman", "-Sy"],
    "zypper":   ["zypper", "-n", "ref"],
    "apk":      ["apk", "update"],
    "slackpkg": ["slackpkg", "update"],
}

_PM_UPGRADE = {
    "apt":      ["apt-get", "-y", "upgrade"],
    "dnf":      ["dnf", "-y", "upgrade"],
    "yum":      ["yum", "-y", "update"],
    "pacman":   ["pacman", "-Syu", "--noconfirm"],
    "zypper":   ["zypper", "-n", "up", "-y"],
    "apk":      ["apk", "upgrade"],
    "slackpkg": ["slackpkg", "-batch=on", "-default_answer=y", "upgrade-all"],
}


@router.post("/packages")
def packages_op(body: dict):
    pm = _pm()
    _req(pm, "no supported package manager")
    op = body.get("op", "")
    env = {**os.environ, "DEBIAN_FRONTEND": "noninteractive"}
    if op in ("install", "remove"):
        name = str(body.get("name") or "").strip()
        _req(_PKG.match(name), "invalid package name")
        base = _PM_PKG_INSTALL[pm] if op == "install" else _PM_REMOVE[pm]
        proc = run(base + [name], timeout=600, env=env)
    elif op == "update":
        proc = run(_PM_REFRESH[pm], timeout=300, env=env)
    elif op == "upgrade":
        proc = run(_PM_UPGRADE[pm], timeout=1800, env=env)
    else:
        raise HTTPException(400, "bad op")
    tail = "\n".join((proc.stdout + "\n" + proc.stderr).splitlines()[-15:])
    if proc.returncode != 0:
        raise HTTPException(500, tail or f"{pm} {op} failed")
    return {"ok": True, "manager": pm, "output": tail}


# ---------------------------------------------------------------------------
# web sites (nginx)

NGINX_AVAIL = Path("/etc/nginx/sites-available")
NGINX_ENABLED = Path("/etc/nginx/sites-enabled")


def _nginx_reload():
    test = run(["nginx", "-t"])
    if test.returncode != 0:
        raise HTTPException(500, "nginx -t failed: " +
                            (test.stderr or test.stdout).strip()[:400])
    reload = run(["systemctl", "reload", "nginx"])
    if reload.returncode != 0:
        run(["nginx", "-s", "reload"])


def _site_info(f: Path):
    try:
        text = f.read_text()
    except OSError:
        return None
    names = re.findall(r"server_name\s+([^;]+);", text)
    listens = re.findall(r"listen\s+([^;]+);", text)
    root = re.search(r"^\s*root\s+(\S+);", text, re.M)
    proxy = re.search(r"proxy_pass\s+(\S+);", text)
    return {"name": f.name,
            "enabled": (NGINX_ENABLED / f.name).exists(),
            "server_names": " ".join(names).split() if names else [],
            "listen": [l.strip() for l in listens],
            "root": root.group(1) if root else "",
            "proxy": proxy.group(1) if proxy else ""}


@router.get("/web")
def web_sites():
    if not NGINX_AVAIL.exists():
        return {"available": False}
    sites = [s for s in (_site_info(f) for f in sorted(NGINX_AVAIL.iterdir())
                       if f.is_file()) if s]
    return {"available": True, "sites": sites}


@router.post("/web")
def web_op(body: dict):
    _req(_has("nginx"), "nginx not installed")
    _req(NGINX_AVAIL.exists(), "no sites-available dir")
    op = body.get("op", "")
    name = str(body.get("name") or "").strip()
    _req(_NAME.match(name) and not name.startswith("."), "bad site name")
    conf = NGINX_AVAIL / name
    link = NGINX_ENABLED / name

    if op == "create":
        _req(not conf.exists(), f"{name} already exists")
        names = [n for n in str(body.get("server_names") or "").split()
                 if _DOMAIN.match(n)]
        _req(names, "at least one valid server_name required")
        kind = body.get("kind", "static")
        if kind == "proxy":
            target = str(body.get("proxy") or "").strip()
            _req(_PROXY.match(target), "bad proxy target (http://host:port)")
            block = (f"    location / {{\n"
                     f"        proxy_pass {target};\n"
                     f"        proxy_set_header Host $host;\n"
                     f"        proxy_set_header X-Real-IP $remote_addr;\n"
                     f"        proxy_set_header X-Forwarded-For "
                     f"$proxy_add_x_forwarded_for;\n"
                     f"        proxy_set_header X-Forwarded-Proto $scheme;\n"
                     f"    }}\n")
        else:
            root = _path(body.get("root") or
                         f"/var/www/{names[0].replace('*.', '')}")
            Path(root).mkdir(parents=True, exist_ok=True)
            block = f"    root {root};\n    index index.html index.htm;\n"
        listen = str(body.get("listen") or "80").strip()
        _req(re.match(r"^\d{2,5}(\s+ssl)?$", listen), "bad listen")
        conf.write_text(
            "server {\n"
            f"    listen {listen};\n"
            f"    server_name {' '.join(names)};\n"
            f"{block}"
            "}\n")
        try:
            NGINX_ENABLED.mkdir(exist_ok=True)
            if not link.exists():
                link.symlink_to(conf)
            _nginx_reload()
        except Exception:
            conf.unlink(missing_ok=True)
            link.unlink(missing_ok=True)
            raise
        return {"ok": True}

    _req(conf.is_file(), f"no site {name}")
    if op == "enable":
        NGINX_ENABLED.mkdir(exist_ok=True)
        if not link.exists():
            link.symlink_to(conf)
    elif op == "disable":
        link.unlink(missing_ok=True)
    elif op == "delete":
        link.unlink(missing_ok=True)
        conf.unlink()
    else:
        raise HTTPException(400, "bad op")
    _nginx_reload()
    return {"ok": True}


# ---------------------------------------------------------------------------
# TLS certificates (certbot / letsencrypt)

CERT_LIVE = Path("/etc/letsencrypt/live")


def _cert_list():
    proc = run(["certbot", "certificates"], timeout=30)
    certs, cur = [], {}
    for line in proc.stdout.splitlines():
        line = line.strip()
        if line.startswith("Certificate Name:"):
            cur = {"name": line.split(":", 1)[1].strip()}
        elif line.startswith("Domains:"):
            cur["domains"] = line.split(":", 1)[1].split()
        elif line.startswith("Expiry Date:"):
            cur["expiry"] = line.split(":", 1)[1].strip()
            m = re.search(r"VALID:\s*(\d+)\s*day", line)
            if m:
                cur["days"] = int(m.group(1))
            certs.append(cur)
            cur = {}
    return certs


@router.get("/certs")
def certs():
    if not _has("certbot"):
        if not CERT_LIVE.exists():
            return {"available": False}
        out = []
        for pem in CERT_LIVE.glob("*/cert.pem"):
            proc = run(["openssl", "x509", "-in", str(pem),
                        "-noout", "-subject", "-enddate"])
            cn = re.search(r"CN\s*=\s*(\S+)", proc.stdout)
            end = re.search(r"notAfter=(.+)", proc.stdout)
            out.append({"name": pem.parent.name,
                        "domains": [cn.group(1)] if cn else [],
                        "expiry": end.group(1).strip() if end else ""})
        return {"available": True, "certbot": False, "certs": out}
    return {"available": True, "certbot": True, "certs": _cert_list()}


@router.post("/certs")
def certs_op(body: dict):
    _req(_has("certbot"), "certbot not installed")
    op = body.get("op", "")
    if op == "renew":
        proc = run(["certbot", "renew", "-n"], timeout=300)
        if proc.returncode != 0:
            raise HTTPException(500, proc.stderr.strip() or "renew failed")
        return {"ok": True, "output": proc.stdout[-2000:]}
    if op == "issue":
        domain = str(body.get("domain") or "").strip()
        _req(_DOMAIN.match(domain) and "*" not in domain,
             "invalid domain")
        extra = [d for d in str(body.get("extra") or "").split()
                 if _DOMAIN.match(d) and "*" not in d][:9]
        email = str(body.get("email") or "").strip()
        _req(_EMAIL.match(email), "invalid email")
        plugin = body.get("plugin", "nginx")
        _req(plugin in ("nginx", "standalone"), "bad plugin")
        cmd = ["certbot", f"--{plugin}", "-d", domain]
        for d in extra:
            cmd += ["-d", d]
        cmd += ["-m", email, "--agree-tos", "-n"]
        if body.get("redirect"):
            cmd.append("--redirect")
        proc = run(cmd, timeout=300)
        out = (proc.stdout + proc.stderr)[-2000:]
        if proc.returncode != 0:
            raise HTTPException(500, out)
        return {"ok": True, "output": out}
    raise HTTPException(400, "bad op")


# ---------------------------------------------------------------------------
# databases (postgres / mysql, local socket auth)

def _pg(cmd):
    if _has("runuser"):
        return run(["runuser", "-u", "postgres", "--"] + cmd)
    return run(["sudo", "-u", "postgres"] + cmd)


@router.get("/db")
def db_list():
    out = {}
    if _has("psql"):
        proc = _pg(["psql", "-lqt", "-A"])
        if proc.returncode == 0:
            out["postgres"] = [
                {"name": l.split("|")[0], "owner": l.split("|")[2]
                 if l.count("|") > 2 else ""}
                for l in proc.stdout.splitlines() if "|" in l]
        else:
            out["postgres_error"] = proc.stderr.strip()[:200]
    if _has("mysql"):
        proc = run(["mysql", "-NBe", "SHOW DATABASES"], timeout=15)
        if proc.returncode == 0:
            out["mysql"] = [{"name": l} for l in proc.stdout.splitlines()]
        else:
            out["mysql_error"] = proc.stderr.strip()[:200]
    out["available"] = "postgres" in out or "mysql" in out
    return out


_MAX_ROWS = 500
_TABLE = re.compile(r"^\w{1,63}(\.\w{1,63})?$")


def _db_exec(engine: str, name: str, sql: str):
    """Run SQL against `name` and return TSV output (headers included)."""
    if engine == "postgres":
        return _pg(["psql", "-d", name, "-A", "-F", "\t",
                    "--pset", "footer=off", "-c", sql])
    return run(["mysql", "-B", "-e", sql] + ([name] if name else []),
               timeout=30)


def _tsv(out: str):
    lines = [l for l in out.splitlines() if l]
    if not lines:
        return {"cols": [], "rows": []}
    rows = [l.split("\t") for l in lines]
    truncated = len(rows) - 1 > _MAX_ROWS
    return {"cols": rows[0], "rows": rows[1:_MAX_ROWS + 1],
            "truncated": truncated}


def _qident(engine: str, name: str) -> str:
    """Quote a possibly schema-qualified table name."""
    q = '"' if engine == "postgres" else "`"
    return ".".join(q + p + q for p in name.split("."))


@router.post("/db")
def db_op(body: dict):
    op = body.get("op", "")
    engine = body.get("engine", "")
    name = str(body.get("name") or "").strip()
    if engine == "postgres":
        _req(_has("psql"), "postgres not installed")
    elif engine == "mysql":
        _req(_has("mysql"), "mysql not installed")
    else:
        raise HTTPException(400, "bad engine")

    # ops that don't need a database name
    if op == "query":
        db = str(body.get("db") or "").strip()
        _req(re.match(r"^\w{1,63}$", db), "invalid database")
        sql = str(body.get("sql") or "").strip()
        _req(bool(sql), "empty query")
        proc = _db_exec(engine, db, sql)
        if proc.returncode != 0:
            raise HTTPException(500, proc.stderr.strip()[:400])
        return _tsv(proc.stdout)

    _req(re.match(r"^\w{1,63}$", name), "invalid database name")
    if op == "create":
        if engine == "postgres":
            owner = str(body.get("owner") or "").strip()
            sql = f'CREATE DATABASE "{name}"'
            if owner:
                _req(_NAME.match(owner), "bad owner")
                sql += f' OWNER "{owner}"'
        else:
            sql = f"CREATE DATABASE `{name}`"
        proc = _db_exec(engine, "", sql) if engine == "mysql" \
            else _pg(["psql", "-c", sql])
    elif op == "drop":
        sql = (f'DROP DATABASE "{name}"' if engine == "postgres"
               else f"DROP DATABASE `{name}`")
        proc = _db_exec(engine, "", sql) if engine == "mysql" \
            else _pg(["psql", "-c", sql])
    elif op == "tables":
        if engine == "postgres":
            sql = ("SELECT table_schema||'.'||table_name "
                   "FROM information_schema.tables "
                   "WHERE table_schema NOT IN ('pg_catalog',"
                   "'information_schema') ORDER BY 1")
        else:
            sql = ("SELECT table_name FROM information_schema.tables "
                   f"WHERE table_schema='{name}' ORDER BY 1")
        proc = _db_exec(engine, name, sql)
        if proc.returncode != 0:
            raise HTTPException(500, proc.stderr.strip()[:400])
        data = _tsv(proc.stdout)
        return {"tables": [r[0] for r in data["rows"]]}
    elif op == "rows":
        table = str(body.get("table") or "").strip()
        _req(_TABLE.match(table), "invalid table")
        sql = f"SELECT * FROM {_qident(engine, table)} LIMIT {_MAX_ROWS}"
        proc = _db_exec(engine, name, sql)
        if proc.returncode != 0:
            raise HTTPException(500, proc.stderr.strip()[:400])
        data = _tsv(proc.stdout)
        if not data["cols"] and engine == "mysql":
            # mysql -B prints nothing on empty results — fetch the schema
            bare = table.split(".")[-1]
            cols = _db_exec(engine, name,
                            "SELECT column_name FROM information_schema.columns"
                            f" WHERE table_schema='{name}'"
                            f" AND table_name='{bare}'"
                            " ORDER BY ordinal_position")
            if cols.returncode == 0:
                data["cols"] = [r[0] for r in _tsv(cols.stdout)["rows"]]
        return data
    elif op == "table_drop":
        table = str(body.get("table") or "").strip()
        _req(_TABLE.match(table), "invalid table")
        proc = _db_exec(engine, name,
                        f"DROP TABLE {_qident(engine, table)}")
    else:
        raise HTTPException(400, "bad op")
    if proc.returncode != 0:
        raise HTTPException(500, proc.stderr.strip()[:400])
    return {"ok": True}


# ---------------------------------------------------------------------------
# file shares (samba + nfs)

SMB_CONF = Path("/etc/samba/smb.conf")
NFS_EXPORTS = Path("/etc/exports")


def _smb_reload():
    for cmd in (["systemctl", "reload", "smbd"],
                ["systemctl", "reload", "smb"],
                ["smbcontrol", "all", "reload-config"]):
        if run(cmd).returncode == 0:
            return


def _smb_shares():
    text = SMB_CONF.read_text() if SMB_CONF.exists() else ""
    shares, cur = [], None
    for line in text.splitlines():
        m = re.match(r"\s*\[([^\]]+)\]", line)
        if m:
            cur = {"name": m.group(1).strip()}
            if cur["name"] != "global":
                shares.append(cur)
            continue
        if cur and "=" in line:
            k, _, v = line.partition("=")
            cur[k.strip().lower()] = v.strip()
    return [s for s in shares if s["name"] not in ("global", "print$")
            and s.get("path")]


def _smb_rewrite(drop=None, add=None):
    lines = SMB_CONF.read_text().splitlines() if SMB_CONF.exists() else []
    out, skip = [], False
    for line in lines:
        m = re.match(r"\s*\[([^\]]+)\]", line)
        if m:
            skip = drop is not None and m.group(1).strip() == drop
        if not skip:
            out.append(line)
    if add:
        out += ["", f"[{add['name']}]",
                f"   path = {add['path']}",
                f"   read only = {'yes' if add['readonly'] else 'no'}",
                f"   guest ok = {'yes' if add['guest'] else 'no'}",
                "   browseable = yes"]
        if add.get("users"):
            out.append(f"   valid users = {add['users']}")
    SMB_CONF.write_text("\n".join(out) + "\n")


def _nfs_exports():
    out = []
    if NFS_EXPORTS.exists():
        for line in NFS_EXPORTS.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#"):
                path, _, hosts = line.partition("\t") if "\t" in line \
                    else line.partition(" ")
                out.append({"path": path.strip(), "hosts": hosts.strip()})
    return out


@router.get("/shares")
def shares():
    return {"samba": {"available": bool(_has("testparm"))
                      or SMB_CONF.exists(), "shares": _smb_shares()},
            "nfs": {"available": bool(_has("exportfs"))
                    or NFS_EXPORTS.exists(), "exports": _nfs_exports()}}


@router.post("/shares")
def shares_op(body: dict):
    op = body.get("op", "")
    kind = body.get("kind", "")
    if kind == "samba":
        _req(SMB_CONF.exists(), "no smb.conf")
        name = str(body.get("name") or "").strip()
        _req(_NAME.match(name), "bad share name")
        if op == "add":
            _smb_rewrite(add={
                "name": name, "path": _path(body.get("path"), True),
                "readonly": bool(body.get("readonly", True)),
                "guest": bool(body.get("guest")),
                "users": re.sub(r"[^A-Za-z0-9_ ,@-]", "",
                                str(body.get("users") or ""))})
        elif op == "del":
            _smb_rewrite(drop=name)
        else:
            raise HTTPException(400, "bad op")
        _smb_reload()
        return {"ok": True}
    if kind == "nfs":
        path = _path(body.get("path") or body.get("name"))
        lines = [l for l in (NFS_EXPORTS.read_text().splitlines()
                 if NFS_EXPORTS.exists() else [])
                 if not l.strip().startswith(path + " ")
                 and not l.strip().startswith(path + "\t")]
        if op == "add":
            hosts = str(body.get("hosts") or "*").strip()
            _req(re.match(r"^[\w.*,/:()-]{1,120}$", hosts), "bad hosts")
            opts = "ro" if body.get("readonly") else "rw"
            line = f"{path}\t{hosts}({opts},sync,no_subtree_check)"
            NFS_EXPORTS.write_text("\n".join(lines + [line]) + "\n")
        elif op != "del":
            raise HTTPException(400, "bad op")
        else:
            NFS_EXPORTS.write_text("\n".join(lines) + ("\n" if lines else ""))
        if _has("exportfs"):
            _run(["exportfs", "-ra"])
        return {"ok": True}
    raise HTTPException(400, "bad kind")


# ---------------------------------------------------------------------------
# security (fail2ban + sshd summary)

@router.get("/security")
def security():
    out = {"fail2ban": {"available": bool(_has("fail2ban-client"))},
           "sshd": {}}
    if out["fail2ban"]["available"]:
        jails = []
        proc = run(["fail2ban-client", "status"])
        m = re.search(r"Jail list:\s*(.+)", proc.stdout)
        for jail in (m.group(1).split(",") if m else []):
            jail = jail.strip()
            st = run(["fail2ban-client", "status", jail])
            banned = re.search(r"Banned IP list:\s*(.*)", st.stdout)
            total = re.search(r"Total banned:\s*(\d+)", st.stdout)
            jails.append({"name": jail,
                          "banned": int(total.group(1)) if total else 0,
                          "ips": banned.group(1).split() if banned else []})
        out["fail2ban"]["jails"] = jails
    if _has("sshd"):
        proc = run(["sshd", "-T"])
        keys = ("port", "passwordauthentication", "permitrootlogin",
                "pubkeyauthentication")
        for line in proc.stdout.splitlines():
            k, _, v = line.partition(" ")
            if k in keys:
                out["sshd"].setdefault(k, []).append(v)
    return out


@router.post("/security")
def security_op(body: dict):
    _req(_has("fail2ban-client"), "fail2ban not installed")
    op = body.get("op", "")
    _req(op in ("ban", "unban"), "bad op")
    jail = str(body.get("jail") or "").strip()
    ip = str(body.get("ip") or "").strip()
    _req(_JAIL.match(jail), "bad jail")
    _req(_IP.match(ip) and "/" not in ip, "bad ip")
    _run(["fail2ban-client", "set", jail, f"{op}ip", ip])
    return {"ok": True}


# ---------------------------------------------------------------------------
# disk health (S.M.A.R.T.)

@router.get("/smart")
def smart():
    if not _has("smartctl"):
        return {"available": False}
    proc = run(["lsblk", "-J", "-d", "-n", "-o", "NAME,TYPE,TRAN"])
    names = []
    try:
        names = [d["name"] for d in json.loads(proc.stdout)["blockdevices"]
                 if d.get("type") == "disk"
                 and not re.match(r"(zram|loop|dm-|md|sr|nbd)", d["name"])]
    except (json.JSONDecodeError, KeyError):
        pass

    def attr(data, *ids):
        for row in (data.get("ata_smart_attributes") or {}).get("table", []):
            if row.get("id") in ids:
                return (row.get("raw") or {}).get("value")
        return None

    disks = []
    for n in names:
        dev = f"/dev/{n}"
        proc = run(["smartctl", "-j", "-a", dev], timeout=20)
        try:
            d = json.loads(proc.stdout)
        except json.JSONDecodeError:
            disks.append({"dev": dev, "error": "unreadable"})
            continue
        nvme = d.get("nvme_smart_health_information_log") or {}
        disks.append({
            "dev": dev,
            "model": d.get("model_name") or (d.get("device") or {}).get("model"),
            "health": (d.get("smart_status") or {}).get("passed"),
            "temp": (d.get("temperature") or {}).get("current"),
            "hours": (d.get("power_on_time") or {}).get("hours"),
            "realloc": attr(d, 5) if not nvme else nvme.get("media_errors"),
            "pending": attr(d, 197, 198) if not nvme else
            nvme.get("percentage_used"),
            "supported": bool(d.get("smartctl") or d.get("smart_status")
                              or nvme)})
    return {"available": True, "disks": disks}


# ---------------------------------------------------------------------------
# VPN (wireguard)

WG_DIR = Path("/etc/wireguard")


def _wg_conf(iface):
    p = WG_DIR / f"{iface}.conf"
    return p if p.is_file() else None


def _wg_status():
    proc = run(["wg", "show", "all", "dump"])
    ifaces, cur = [], None
    for line in proc.stdout.splitlines():
        c = line.split("\t")
        if len(c) == 5:
            cur = {"name": c[0], "pubkey": c[2], "port": c[3], "peers": []}
            ifaces.append(cur)
        elif len(c) >= 9 and cur is not None and c[0] == cur["name"]:
            cur["peers"].append({
                "pubkey": c[1], "endpoint": "" if c[3] == "(none)" else c[3],
                "allowed": c[4], "handshake": int(c[5] or 0),
                "rx": int(c[6] or 0), "tx": int(c[7] or 0)})
    return ifaces


@router.get("/vpn")
def vpn():
    if not _has("wg"):
        return {"available": False}
    return {"available": True, "interfaces": _wg_status(),
            "configs": [p.stem for p in WG_DIR.glob("*.conf")]
            if WG_DIR.exists() else []}


@router.post("/vpn")
def vpn_op(body: dict):
    _req(_has("wg"), "wireguard not installed")
    op = body.get("op", "")
    iface = str(body.get("iface") or "").strip()
    _req(_IFACE.match(iface), "bad interface")
    if op in ("up", "down"):
        _req(_has("wg-quick") and _wg_conf(iface), "no config for " + iface)
        _run(["wg-quick", op, iface], timeout=60)
        return {"ok": True}
    conf = _wg_conf(iface)
    _req(conf, "no config for " + iface)
    if op == "peer_del":
        pub = str(body.get("pubkey") or "").strip()
        _req(_PUBKEY.match(pub), "bad pubkey")
        _run(["wg", "set", iface, "peer", pub, "remove"])
        text = conf.read_text()
        text = re.sub(r"\[Peer\]\s*\n(?:[^\[]*?PublicKey\s*=\s*"
                      + re.escape(pub) + r"[^\[]*)", "", text,
                      flags=re.S | re.I)
        conf.write_text(text)
        return {"ok": True}
    if op == "peer_add":
        priv = _run(["wg", "genkey"]).stdout.strip()
        pub = _run(["wg", "pubkey"], input_text=priv).stdout.strip()
        psk = _run(["wg", "genpsk"]).stdout.strip()
        allowed = str(body.get("allowed") or "").strip()
        text = conf.read_text()
        if not allowed:
            # first free /32 inside the interface's IPv4 subnet
            used = {int(m.split(".")[-1])
                    for m in re.findall(r"(\d+\.\d+\.\d+\.\d+)/32",
                                        text + _dump())}
            base = re.search(r"Address\s*=\s*(\d+\.\d+\.\d+)\.", text)
            if base:
                for i in range(2, 254):
                    if i not in used:
                        allowed = f"{base.group(1)}.{i}/32"
                        break
        else:
            _req(_IP.match(allowed), "bad allowed ips")
        _req(allowed, "no free ip — pass allowed_ips")
        with tempfile.NamedTemporaryFile("w", delete=False) as tf:
            tf.write(psk + "\n")
        try:
            _run(["wg", "set", iface, "peer", pub, "preshared-key",
                  tf.name, "allowed-ips", allowed])
        finally:
            os.unlink(tf.name)
        with conf.open("a") as f:
            f.write(f"\n[Peer]\nPublicKey = {pub}\n"
                    f"PresharedKey = {psk}\nAllowedIPs = {allowed}\n")
        srv_pub = re.search(r"PrivateKey\s*=\s*(\S+)", conf.read_text())
        srv_pub = _run(["wg", "pubkey"],
                       input_text=srv_pub.group(1)).stdout.strip() \
            if srv_pub else ""
        port = re.search(r"ListenPort\s*=\s*(\d+)", conf.read_text())
        endpoint = str(body.get("endpoint") or "").strip()
        if endpoint:
            _req(re.match(r"^[\w.-]+:\d{2,5}$", endpoint), "bad endpoint")
        else:
            ip = re.search(r"src\s+([\d.]+)",
                           run(["ip", "-4", "route", "get", "1.1.1.1"]).stdout)
            endpoint = f"{ip.group(1) if ip else 'SERVER_IP'}:" \
                       f"{port.group(1) if port else '51820'}"
        client = (f"[Interface]\nPrivateKey = {priv}\n"
                  f"Address = {allowed}\nDNS = 1.1.1.1\n\n[Peer]\n"
                  f"PublicKey = {srv_pub}\nPresharedKey = {psk}\n"
                  f"Endpoint = {endpoint}\nAllowedIPs = 0.0.0.0/0, ::/0\n"
                  f"PersistentKeepalive = 25\n")
        return {"ok": True, "pubkey": pub, "allowed": allowed,
                "client": client}
    raise HTTPException(400, "bad op")


def _dump():
    return run(["wg", "show", "all", "dump"]).stdout


# ---------------------------------------------------------------------------
# threshold alerts

RULES_FILE = Path("/opt/webos/.alert-rules.json")


def _rules():
    try:
        return json.loads(RULES_FILE.read_text())
    except (OSError, json.JSONDecodeError):
        return []


def _save_rules(rules):
    RULES_FILE.parent.mkdir(parents=True, exist_ok=True)
    RULES_FILE.write_text(json.dumps(rules, indent=2))


def _disk_pct(path):
    try:
        return round(psutil.disk_usage(path).percent, 1)
    except OSError:
        return None


def _evaluate(rules):
    cpu = psutil.cpu_percent(interval=0.25)
    mem = psutil.virtual_memory().percent
    out = []
    for r in rules:
        if r["metric"] == "cpu":
            value = cpu
        elif r["metric"] == "mem":
            value = mem
        else:
            value = _disk_pct(r.get("path") or "/")
        out.append({**r, "value": value,
                    "breach": value is not None and
                    value > float(r["threshold"])})
    return out


@router.get("/alerts")
def alerts():
    return {"rules": _evaluate(_rules()),
            "metrics": {"cpu": psutil.cpu_percent(interval=0.1),
                        "mem": psutil.virtual_memory().percent,
                        "disk_root": _disk_pct("/")}}


@router.post("/alerts")
def alerts_op(body: dict):
    op = body.get("op", "")
    rules = _rules()
    if op == "add":
        metric = body.get("metric", "")
        _req(metric in ("cpu", "mem", "disk"), "bad metric")
        try:
            threshold = float(body.get("threshold"))
        except (TypeError, ValueError):
            raise HTTPException(400, "bad threshold")
        _req(1 <= threshold <= 100, "threshold must be 1-100")
        rule = {"id": secrets.token_hex(4), "metric": metric,
                "threshold": threshold,
                "path": _path(body.get("path") or "/")
                if metric == "disk" else "",
                "note": str(body.get("note") or "")[:80]}
        rules.append(rule)
        _save_rules(rules)
        return {"ok": True, "rule": _evaluate([rule])[0]}
    if op == "del":
        rid = str(body.get("id") or "")
        rules = [r for r in rules if r.get("id") != rid]
        _save_rules(rules)
        return {"ok": True}
    if op == "check":
        return {"rules": _evaluate(rules)}
    raise HTTPException(400, "bad op")
