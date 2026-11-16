"""End-to-end flow tests for /api/server — every section of the
server-management surface: capabilities, firewall, network, packages,
web sites, certificates, databases, shares, security, SMART, VPN and
alerts, plus token auth and input validation."""
import json

from app.routers import server
from tests.conftest import mkproc

PUB = "A" * 43 + "="


# --------------------------------------------------------------------------
# auth

def test_requires_token(fake):
    from fastapi.testclient import TestClient
    from app import main
    r = TestClient(main.app).get("/api/server/capabilities")
    assert r.status_code == 401


# --------------------------------------------------------------------------
# capabilities

def test_capabilities_all_present(client, fake):
    r = client.get("/api/server/capabilities")
    assert r.status_code == 200
    data = r.json()
    assert data["ufw"] is True and data["smartctl"] is True


def test_capabilities_missing(client, fake):
    fake.tools = {"ip"}
    data = client.get("/api/server/capabilities").json()
    assert data["ufw"] is False and data["ip"] is True


# --------------------------------------------------------------------------
# firewall

UFW_STATUS = """Status: active

     To                         Action      From
     --                         ------      ----
[ 1] 22/tcp                     ALLOW IN    Anywhere
[ 2] 443                        DENY IN     10.0.0.0/8
"""


def test_firewall_status_parsed(client, fake):
    fake.add(("ufw", "status"), out=UFW_STATUS)
    data = client.get("/api/server/firewall").json()
    assert data["available"] and data["active"]
    assert data["rules"] == [
        {"num": 1, "to": "22/tcp", "action": "ALLOW", "dir": "IN",
         "src": "Anywhere"},
        {"num": 2, "to": "443", "action": "DENY", "dir": "IN",
         "src": "10.0.0.0/8"}]


def test_firewall_unavailable(client, fake):
    fake.tools = set()
    assert client.get("/api/server/firewall").json() == {"available": False}


def test_firewall_enable_and_delete(client, fake):
    assert client.post("/api/server/firewall",
                       json={"op": "enable"}).status_code == 200
    assert fake.called("ufw", "--force", "enable")
    assert client.post("/api/server/firewall",
                       json={"op": "delete", "num": 2}).status_code == 200
    assert fake.called("ufw", "--force", "delete", "2")


def test_firewall_add_rule(client, fake):
    r = client.post("/api/server/firewall", json={
        "op": "add", "action": "allow", "direction": "in",
        "proto": "tcp", "port": "80", "from": "any", "to": "any"})
    assert r.status_code == 200
    assert fake.called("ufw", "allow", "in", "from", "any", "to", "any",
                       "port", "80", "proto", "tcp")


def test_firewall_add_range_port(client, fake):
    r = client.post("/api/server/firewall", json={
        "op": "add", "port": "8000-8010"})
    assert r.status_code == 200
    assert fake.called("ufw", "allow", "in", "from", "any", "to", "any",
                       "port", "8000-8010")


def test_firewall_validation(client, fake):
    for body in (
        {"op": "nuke"},
        {"op": "add", "action": "permit"},
        {"op": "add", "direction": "sideways"},
        {"op": "add", "proto": "icmp"},
        {"op": "add", "proto": "tcp"},                    # proto needs port
        {"op": "add", "port": "99999"},
        {"op": "add", "port": "80-70"},                   # inverted range
        {"op": "add", "from": "10.0.0.1; rm -rf /"},      # injection
        {"op": "add", "comment": "ok; $(reboot)"},
        {"op": "delete", "num": "abc"},
        {"op": "delete", "num": 0},
    ):
        assert client.post("/api/server/firewall",
                           json=body).status_code == 400, body


def test_firewall_command_failure_is_500(client, fake):
    fake.add(("ufw", "--force", "enable"), rc=1, err="permission denied")
    r = client.post("/api/server/firewall", json={"op": "enable"})
    assert r.status_code == 500 and "permission denied" in r.json()["detail"]


# --------------------------------------------------------------------------
# network

def test_network_overview(client, fake):
    fake.add(("ip", "-j", "addr"), out=json.dumps([{
        "ifname": "eth0", "operstate": "UP", "address": "aa:bb:cc:dd:ee:ff",
        "addr_info": [{"local": "10.0.0.5", "prefixlen": 24, "family": "inet"},
                      {"local": "fe80::1", "prefixlen": 64, "family": "inet6"},
                      {"local": "x", "prefixlen": 1, "family": "link"}]}]))
    fake.add(("ip", "-j", "route"), out=json.dumps(
        [{"gateway": "10.0.0.1", "dev": "eth0"}]))
    fake.add(("ss", "-tlnp"), out=(
        "State  Recv-Q Send-Q Local Address:Port Peer Address:Port Process\n"
        "LISTEN 0      128    0.0.0.0:22         0.0.0.0:*         "
        'users:(("sshd",pid=1,fd=3))\n'))
    fake.add(("ss", "-ulnp"), out="State Recv-Q Send-Q Local P Process\n")
    fake.add(("hostname",), out="web-01\n")

    data = client.get("/api/server/network").json()
    assert data["hostname"] == "web-01"
    assert data["interfaces"][0]["name"] == "eth0"
    assert data["interfaces"][0]["ips"] == ["10.0.0.5/24", "fe80::1/64"]
    assert data["routes"] == [{"via": "10.0.0.1", "dev": "eth0"}]
    assert data["listening"] == [{"proto": "tcp", "state": "LISTEN",
                                  "local": "0.0.0.0:22", "process": "sshd"}]


def test_network_hostname(client, fake):
    assert client.post("/api/server/network",
                       json={"op": "hostname", "name": "web-02"}).is_success
    assert fake.called("hostnamectl", "set-hostname", "web-02")


def test_network_hostname_rejected(client, fake):
    for name in ("bad;host", "a b", "-lead", "", "x" * 70):
        r = client.post("/api/server/network",
                        json={"op": "hostname", "name": name})
        assert r.status_code == 400, name
    assert not fake.called("hostnamectl")


# --------------------------------------------------------------------------
# packages

def test_packages_upgradable(client, fake):
    fake.add(("apt", "list", "--upgradable"), out=(
        "Listing...\n"
        "nginx/jammy-updates 1.2 amd64 [upgradable from: 1.1]\n"))
    data = client.get("/api/server/packages?updates=true").json()
    assert data["updates"] == [{"name": "nginx", "version": "1.2",
                                "arch": "amd64", "from": "1.1"}]


def test_packages_installed_filtered(client, fake):
    fake.add(("dpkg-query", "-W"),
             out="nginx\t1.2\ncurl\t7.8\nlinux-image\t6.0\n")
    data = client.get("/api/server/packages?installed=true&q=n").json()
    names = [p["name"] for p in data["packages"]]
    assert names == ["nginx", "linux-image"]


def test_packages_search_marks_installed(client, fake):
    fake.add(("dpkg-query", "-W", "-f=${binary:Package}\n"), out="nginx\n")
    fake.add(("apt-cache", "search"), out=(
        "nginx - small web server\nnginx-extras - full build\n"))
    data = client.get("/api/server/packages?q=nginx").json()
    assert [p["name"] for p in data["packages"]] == ["nginx", "nginx-extras"]
    assert data["packages"][0]["installed"] is True
    assert data["packages"][1]["installed"] is False


def test_packages_search_query_validated(client, fake):
    assert client.get("/api/server/packages?q=x").status_code == 400


def test_packages_ops(client, fake):
    assert client.post("/api/server/packages",
                       json={"op": "install", "name": "htop"}).is_success
    assert fake.called("apt-get", "-y", "install", "htop")
    assert client.post("/api/server/packages", json={"op": "update"}).is_success
    assert fake.called("apt-get", "update")
    assert client.post("/api/server/packages", json={"op": "upgrade"}).is_success


def test_packages_name_validated(client, fake):
    for name in ("a;rm -rf", "../evil", "UPPER", "x" * 65, ""):
        r = client.post("/api/server/packages",
                        json={"op": "install", "name": name})
        assert r.status_code == 400, name
    assert client.post("/api/server/packages",
                       json={"op": "wipe"}).status_code == 400
    assert not fake.called("apt-get", "-y", "install")


def test_packages_apt_failure_is_500(client, fake):
    fake.add(("apt-get", "-y", "install"), rc=100, out="E: not found")
    r = client.post("/api/server/packages",
                    json={"op": "install", "name": "nosuch"})
    assert r.status_code == 500


# --------------------------------------------------------------------------
# web (nginx sites)

def test_web_unavailable_without_nginx_dir(client, fake, monkeypatch,
                                           tmp_path):
    monkeypatch.setattr(server, "NGINX_AVAIL", tmp_path / "nope")
    assert client.get("/api/server/web").json() == {"available": False}


def test_web_lists_sites(client, fake, paths):
    (paths / "sites-available" / "blog").write_text(
        "server {\n listen 80;\n server_name blog.example.com;\n"
        " root /var/www/blog;\n}\n")
    (paths / "sites-enabled" / "blog").symlink_to(
        paths / "sites-available" / "blog")
    (paths / "sites-available" / "api").write_text(
        "server {\n listen 443 ssl;\n server_name api.example.com;\n"
        " location / { proxy_pass http://127.0.0.1:3000; }\n}\n")
    data = client.get("/api/server/web").json()
    sites = {s["name"]: s for s in data["sites"]}
    assert sites["blog"]["enabled"] is True
    assert sites["blog"]["server_names"] == ["blog.example.com"]
    assert sites["blog"]["root"] == "/var/www/blog"
    assert sites["api"]["enabled"] is False
    assert sites["api"]["proxy"] == "http://127.0.0.1:3000"


def test_web_create_static_site(client, fake, paths):
    r = client.post("/api/server/web", json={
        "op": "create", "name": "blog",
        "server_names": "blog.example.com www.blog.example.com",
        "kind": "static", "root": str(paths / "www" / "blog")})
    assert r.status_code == 200
    conf = paths / "sites-available" / "blog"
    text = conf.read_text()
    assert "server_name blog.example.com www.blog.example.com;" in text
    assert f"root {paths}/www/blog;" in text
    assert (paths / "sites-enabled" / "blog").is_symlink()
    assert fake.called("nginx", "-t")
    assert fake.called("systemctl", "reload", "nginx")


def test_web_create_proxy_site(client, fake, paths):
    r = client.post("/api/server/web", json={
        "op": "create", "name": "api", "server_names": "api.example.com",
        "kind": "proxy", "proxy": "http://127.0.0.1:3000"})
    assert r.status_code == 200
    assert "proxy_pass http://127.0.0.1:3000;" in \
        (paths / "sites-available" / "api").read_text()


def test_web_create_rolls_back_on_nginx_t(client, fake, paths):
    fake.add(("nginx", "-t"), rc=1, err="emerg")
    r = client.post("/api/server/web", json={
        "op": "create", "name": "bad", "server_names": "bad.example.com",
        "root": str(paths / "www" / "bad")})
    assert r.status_code == 500
    assert not (paths / "sites-available" / "bad").exists()
    assert not (paths / "sites-enabled" / "bad").exists()


def test_web_enable_disable_delete(client, fake, paths):
    conf = paths / "sites-available" / "x"
    conf.write_text("server { listen 80; }\n")
    assert client.post("/api/server/web",
                       json={"op": "enable", "name": "x"}).is_success
    link = paths / "sites-enabled" / "x"
    assert link.is_symlink()
    assert client.post("/api/server/web",
                       json={"op": "disable", "name": "x"}).is_success
    assert not link.exists()
    assert client.post("/api/server/web",
                       json={"op": "delete", "name": "x"}).is_success
    assert not conf.exists()


def test_web_validation(client, fake, paths):
    for body in (
        {"op": "create", "name": "../evil", "server_names": "x.com"},
        {"op": "create", "name": "a", "server_names": "! ?"},
        {"op": "create", "name": "a", "server_names": "x.com",
         "kind": "proxy", "proxy": "javascript:alert(1)"},
        {"op": "create", "name": "a", "server_names": "x.com",
         "root": "/tmp", "listen": "80; rm -rf /"},
        {"op": "bogus", "name": "x"},
    ):
        assert client.post("/api/server/web",
                           json=body).status_code == 400, body


# --------------------------------------------------------------------------
# certificates

CERTBOT_OUT = """
Certificate Name: example.com
    Domains: example.com www.example.com
    Expiry Date: 2025-12-01 00:00:00+00:00 (VALID: 89 days)
    Certificate Path: /etc/letsencrypt/live/example.com/fullchain.pem
Certificate Name: api.example.com
    Domains: api.example.com
    Expiry Date: 2025-09-01 00:00:00+00:00 (VALID: 30 days)
"""


def test_certs_via_certbot(client, fake):
    fake.add(("certbot", "certificates"), out=CERTBOT_OUT)
    data = client.get("/api/server/certs").json()
    assert data["available"] and data["certbot"]
    assert data["certs"][0] == {"name": "example.com",
                                "domains": ["example.com", "www.example.com"],
                                "expiry": "2025-12-01 00:00:00+00:00 "
                                          "(VALID: 89 days)",
                                "days": 89}
    assert data["certs"][1]["name"] == "api.example.com"


def test_certs_unavailable(client, fake, paths):
    fake.tools = set()
    assert client.get("/api/server/certs").json() == {"available": False}


def test_certs_renew_and_issue(client, fake):
    assert client.post("/api/server/certs", json={"op": "renew"}).is_success
    assert fake.called("certbot", "renew", "-n")
    r = client.post("/api/server/certs", json={
        "op": "issue", "domain": "x.com", "extra": "www.x.com",
        "email": "a@b.co", "redirect": True})
    assert r.is_success
    assert fake.called("certbot", "--nginx", "-d", "x.com", "-d", "www.x.com",
                       "-m", "a@b.co", "--agree-tos", "-n", "--redirect")


def test_certs_issue_validated(client, fake):
    for body in (
        {"op": "issue", "domain": "*.x.com", "email": "a@b.co"},
        {"op": "issue", "domain": "x.com;rm", "email": "a@b.co"},
        {"op": "issue", "domain": "x.com", "email": "not-an-email"},
        {"op": "issue", "domain": "x.com", "email": "a@b.co",
         "plugin": "dns-01"},
    ):
        assert client.post("/api/server/certs",
                           json=body).status_code == 400, body


# --------------------------------------------------------------------------
# databases

def test_db_lists_postgres_and_mysql(client, fake):
    def psql(cmd, input_text):
        return mkproc(out="appdb|postgres|UTF8|c\nother|alice|UTF8|c\n")
    fake.add(("runuser", "-u", "postgres"), fn=psql)
    fake.add(("mysql", "-NBe"), out="mydb\nmysql\n")
    data = client.get("/api/server/db").json()
    assert data["available"]
    assert [d["name"] for d in data["postgres"]] == ["appdb", "other"]
    assert [d["name"] for d in data["mysql"]] == ["mydb", "mysql"]


def test_db_create_drop_postgres(client, fake):
    assert client.post("/api/server/db", json={
        "op": "create", "engine": "postgres", "name": "app",
        "owner": "alice"}).is_success
    assert fake.called("runuser", "-u", "postgres", "--", "psql", "-c",
                       'CREATE DATABASE "app" OWNER "alice"')
    assert client.post("/api/server/db", json={
        "op": "drop", "engine": "postgres", "name": "app"}).is_success
    assert fake.called("runuser", "-u", "postgres", "--", "psql", "-c",
                       'DROP DATABASE "app"')


def test_db_create_mysql(client, fake):
    assert client.post("/api/server/db", json={
        "op": "create", "engine": "mysql", "name": "shop"}).is_success
    assert fake.called("mysql", "-e", "CREATE DATABASE `shop`")


def test_db_name_validated(client, fake):
    for name in ("a;b", "x y", "x`drop`", "", "x" * 64):
        assert client.post("/api/server/db", json={
            "op": "create", "engine": "mysql",
            "name": name}).status_code == 400, name


def test_db_failure_is_500(client, fake):
    fake.add(("mysql", "-e"), rc=1, err="access denied")
    r = client.post("/api/server/db", json={
        "op": "create", "engine": "mysql", "name": "x"})
    assert r.status_code == 500 and "access denied" in r.json()["detail"]


# --------------------------------------------------------------------------
# shares

SMB_CONF = """[global]
   workgroup = WG

[media]
   path = /srv/media
   read only = yes
   guest ok = no

[print$]
   path = /var/spool/samba
"""


def test_shares_lists_samba_and_nfs(client, fake, paths):
    (paths / "smb.conf").write_text(SMB_CONF)
    (paths / "exports").write_text("/srv/data\t*(ro,sync)\n# comment\n")
    data = client.get("/api/server/shares").json()
    assert data["samba"]["available"]
    assert data["samba"]["shares"] == [
        {"name": "media", "path": "/srv/media",
         "read only": "yes", "guest ok": "no"}]
    assert data["nfs"]["exports"] == [
        {"path": "/srv/data", "hosts": "*(ro,sync)"}]


def test_shares_samba_add_and_del(client, fake, paths):
    conf = paths / "smb.conf"
    conf.write_text(SMB_CONF)
    (paths / "srv").mkdir()
    (paths / "srv" / "docs").mkdir(parents=True)
    r = client.post("/api/server/shares", json={
        "op": "add", "kind": "samba", "name": "docs",
        "path": str(paths / "srv" / "docs"), "readonly": False,
        "guest": True, "users": "alice bob"})
    assert r.is_success
    text = conf.read_text()
    assert "[docs]" in text and "read only = no" in text
    assert "valid users = alice bob" in text
    assert fake.called("systemctl", "reload", "smbd")

    assert client.post("/api/server/shares", json={
        "op": "del", "kind": "samba", "name": "docs"}).is_success
    assert "[docs]" not in conf.read_text()


def test_shares_nfs_add_and_del(client, fake, paths):
    ex = paths / "exports"
    r = client.post("/api/server/shares", json={
        "op": "add", "kind": "nfs", "path": "/srv/data",
        "hosts": "192.168.1.0/24", "readonly": True})
    assert r.is_success
    assert ex.read_text().strip() == \
        "/srv/data\t192.168.1.0/24(ro,sync,no_subtree_check)"
    assert fake.called("exportfs", "-ra")

    assert client.post("/api/server/shares", json={
        "op": "del", "kind": "nfs", "path": "/srv/data"}).is_success
    assert ex.read_text() == ""


def test_shares_validation(client, fake, paths):
    (paths / "smb.conf").write_text(SMB_CONF)
    for body in (
        {"op": "add", "kind": "samba", "name": "x", "path": "/nonexistent"},
        {"op": "add", "kind": "samba", "name": "x;y", "path": "/tmp"},
        {"op": "add", "kind": "nfs", "path": "relative/path"},
        {"op": "add", "kind": "nfs", "path": "/srv/x",
         "hosts": "host; rm -rf"},
        {"op": "add", "kind": "ntfs", "path": "/srv/x"},
    ):
        assert client.post("/api/server/shares",
                           json=body).status_code == 400, body


# --------------------------------------------------------------------------
# security

F2B_STATUS = """Status
|- Number of jail:	1
`- Jail list:	sshd
"""

F2B_JAIL = """Status for the jail: sshd
|- Total banned:	2
`- Banned IP list:	1.2.3.4 5.6.7.8
"""


def test_security_overview(client, fake):
    def f2b(cmd, input_text):
        return mkproc(out=F2B_JAIL if len(cmd) > 2 else F2B_STATUS)
    fake.add(("fail2ban-client", "status"), fn=f2b)
    fake.add(("sshd", "-T"), out=(
        "port 22\npasswordauthentication no\n"
        "permitrootlogin prohibit-password\npubkeyauthentication yes\n"))
    data = client.get("/api/server/security").json()
    assert data["fail2ban"]["available"]
    assert data["fail2ban"]["jails"] == [
        {"name": "sshd", "banned": 2, "ips": ["1.2.3.4", "5.6.7.8"]}]
    assert data["sshd"]["port"] == ["22"]
    assert data["sshd"]["passwordauthentication"] == ["no"]


def test_security_ban_unban(client, fake):
    assert client.post("/api/server/security", json={
        "op": "ban", "jail": "sshd", "ip": "9.9.9.9"}).is_success
    assert fake.called("fail2ban-client", "set", "sshd", "banip", "9.9.9.9")
    assert client.post("/api/server/security", json={
        "op": "unban", "jail": "sshd", "ip": "9.9.9.9"}).is_success


def test_security_validation(client, fake):
    for body in (
        {"op": "ban", "jail": "sshd", "ip": "1.2.3.4;rm"},
        {"op": "ban", "jail": "sshd", "ip": "1.2.3.0/24"},
        {"op": "ban", "jail": "bad jail!", "ip": "1.2.3.4"},
        {"op": "reload", "jail": "sshd", "ip": "1.2.3.4"},
    ):
        assert client.post("/api/server/security",
                           json=body).status_code == 400, body


def test_security_needs_fail2ban(client, fake):
    fake.tools = set()
    assert client.post("/api/server/security", json={
        "op": "ban", "jail": "sshd", "ip": "1.2.3.4"}).status_code == 400


# --------------------------------------------------------------------------
# smart

def test_smart_unavailable(client, fake):
    fake.tools = set()
    assert client.get("/api/server/smart").json() == {"available": False}


def test_smart_parses_disks(client, fake):
    fake.add(("lsblk", "-J"), out=json.dumps({"blockdevices": [
        {"name": "sda", "type": "disk", "tran": "sata"},
        {"name": "zram0", "type": "disk"},
        {"name": "sda1", "type": "part"}]}))
    fake.add(("smartctl", "-j", "-a", "/dev/sda"), out=json.dumps({
        "model_name": "Samsung SSD",
        "smart_status": {"passed": True},
        "temperature": {"current": 34},
        "power_on_time": {"hours": 1200},
        "ata_smart_attributes": {"table": [
            {"id": 5, "raw": {"value": 0}},
            {"id": 197, "raw": {"value": 2}}]}}))
    data = client.get("/api/server/smart").json()
    assert data["available"] and len(data["disks"]) == 1
    d = data["disks"][0]
    assert d == {"dev": "/dev/sda", "model": "Samsung SSD", "health": True,
                 "temp": 34, "hours": 1200, "realloc": 0, "pending": 2,
                 "supported": True}


def test_smart_unreadable_disk(client, fake):
    fake.add(("lsblk", "-J"), out=json.dumps(
        {"blockdevices": [{"name": "sdb", "type": "disk"}]}))
    fake.add(("smartctl", "-j", "-a", "/dev/sdb"), out="not json")
    data = client.get("/api/server/smart").json()
    assert data["disks"] == [{"dev": "/dev/sdb", "error": "unreadable"}]


# --------------------------------------------------------------------------
# vpn (wireguard)

WG_DUMP = (
    "wg0\tSRVPRIV\tSRVPUB\t51820\toff\n"
    f"wg0\t{PUB}\tPSK\t1.2.3.4:1234\t10.0.0.2/32\t1700000000\t1024\t2048\toff\n")

WG_CONF = """[Interface]
PrivateKey = SRVPRIVKEY
Address = 10.0.0.1/24
ListenPort = 51820

[Peer]
PublicKey = {old}
AllowedIPs = 10.0.0.2/32
"""


def _wg_setup(fake, paths):
    conf = paths / "wireguard" / "wg0.conf"
    conf.write_text(WG_CONF.format(old=PUB))
    fake.add(("wg", "show", "all", "dump"), out=WG_DUMP)
    return conf


def test_vpn_unavailable(client, fake):
    fake.tools = set()
    assert client.get("/api/server/vpn").json() == {"available": False}


def test_vpn_status(client, fake, paths):
    _wg_setup(fake, paths)
    data = client.get("/api/server/vpn").json()
    assert data["available"] and data["configs"] == ["wg0"]
    iface = data["interfaces"][0]
    assert iface["name"] == "wg0" and iface["port"] == "51820"
    assert iface["peers"] == [{"pubkey": PUB, "endpoint": "1.2.3.4:1234",
                               "allowed": "10.0.0.2/32",
                               "handshake": 1700000000,
                               "rx": 1024, "tx": 2048}]


def test_vpn_up_down(client, fake, paths):
    _wg_setup(fake, paths)
    assert client.post("/api/server/vpn",
                       json={"op": "up", "iface": "wg0"}).is_success
    assert fake.called("wg-quick", "up", "wg0")
    assert client.post("/api/server/vpn",
                       json={"op": "down", "iface": "wg0"}).is_success
    assert fake.called("wg-quick", "down", "wg0")


def test_vpn_peer_add_flow(client, fake, paths):
    conf = _wg_setup(fake, paths)
    keys = {"NEWPRIVKEY": "NEWPUBKEY", "SRVPRIVKEY": "SRVPUBKEY"}
    fake.add(("wg", "genkey"), out="NEWPRIVKEY\n")
    fake.add(("wg", "genpsk"), out="NEWPSK\n")
    fake.add(("wg", "pubkey"),
             fn=lambda c, i: mkproc(out=keys[i.strip()] + "\n"))
    fake.add(("ip", "-4", "route", "get"),
             out="1.1.1.1 via 10.0.0.1 dev eth0 src 203.0.113.9\n")

    r = client.post("/api/server/vpn",
                    json={"op": "peer_add", "iface": "wg0"})
    assert r.status_code == 200
    data = r.json()
    assert data["allowed"] == "10.0.0.3/32"      # .2 is taken by old peer
    assert "PublicKey = NEWPUBKEY" in conf.read_text()
    assert "AllowedIPs = 10.0.0.3/32" in conf.read_text()
    assert "PrivateKey = NEWPRIVKEY" in data["client"]
    assert "Endpoint = 203.0.113.9:51820" in data["client"]
    assert "PublicKey = SRVPUBKEY" in data["client"]


def test_vpn_peer_add_explicit_allowed(client, fake, paths):
    _wg_setup(fake, paths)
    fake.add(("wg", "pubkey"), out="X\n")
    r = client.post("/api/server/vpn", json={
        "op": "peer_add", "iface": "wg0", "allowed": "10.0.0.50/32",
        "endpoint": "vpn.example.com:51820"})
    assert r.is_success and r.json()["allowed"] == "10.0.0.50/32"
    assert "Endpoint = vpn.example.com:51820" in r.json()["client"]


def test_vpn_peer_del(client, fake, paths):
    conf = _wg_setup(fake, paths)
    r = client.post("/api/server/vpn", json={
        "op": "peer_del", "iface": "wg0", "pubkey": PUB})
    assert r.is_success
    assert fake.called("wg", "set", "wg0", "peer", PUB, "remove")
    assert PUB not in conf.read_text()


def test_vpn_validation(client, fake, paths):
    _wg_setup(fake, paths)
    for body in (
        {"op": "up", "iface": "eth0;down"},
        {"op": "up", "iface": "wg9"},                      # no config
        {"op": "peer_del", "iface": "wg0", "pubkey": "short"},
        {"op": "peer_add", "iface": "wg0", "allowed": "a;b"},
        {"op": "explode", "iface": "wg0"},
    ):
        assert client.post("/api/server/vpn",
                           json=body).status_code == 400, body


# --------------------------------------------------------------------------
# alerts

def test_alerts_full_flow(client, fake, paths):
    assert client.get("/api/server/alerts").json()["rules"] == []

    r = client.post("/api/server/alerts", json={
        "op": "add", "metric": "cpu", "threshold": 80, "note": "loud"})
    assert r.is_success
    rule = r.json()["rule"]
    assert rule["metric"] == "cpu" and rule["threshold"] == 80.0
    assert rule["id"] and isinstance(rule["value"], float)
    assert rule["breach"] == (rule["value"] > 80)

    r = client.post("/api/server/alerts", json={
        "op": "add", "metric": "disk", "threshold": 90, "path": "/"})
    assert r.is_success and r.json()["rule"]["path"] == "/"

    listed = client.get("/api/server/alerts").json()
    assert len(listed["rules"]) == 2
    assert set(listed["metrics"]) == {"cpu", "mem", "disk_root"}

    checked = client.post("/api/server/alerts", json={"op": "check"}).json()
    assert len(checked["rules"]) == 2

    assert client.post("/api/server/alerts",
                       json={"op": "del", "id": rule["id"]}).is_success
    remaining = client.get("/api/server/alerts").json()["rules"]
    assert [x["id"] for x in remaining] != [rule["id"]]
    assert len(remaining) == 1


def test_alerts_validation(client, fake, paths):
    for body in (
        {"op": "add", "metric": "gpu", "threshold": 50},
        {"op": "add", "metric": "cpu", "threshold": 0},
        {"op": "add", "metric": "cpu", "threshold": 101},
        {"op": "add", "metric": "cpu", "threshold": "high"},
        {"op": "add", "metric": "disk", "threshold": 50,
         "path": "etc/../x"},
        {"op": "explode"},
    ):
        assert client.post("/api/server/alerts",
                           json=body).status_code == 400, body
