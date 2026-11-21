# Malta OS

**English** | [Português (BR)](README.pt-BR.md)

A browser-based "operating system desktop" for administering Linux —
an alternative to traditional Cockpit/CasaOS/Webmin UIs.

- **Shell**: [OS.js](https://github.com/os-js/OS.js) (`web/`) — windows with
  minimize/maximize/close, dock with launcher and click-to-restore,
  widgets and wallpapers.
- **6 languages**: local dictionaries (en, pt-BR, pt-PT, es, ja, zh) with
  instant switch — window titles, Settings and apps re-translate live.
- **Privileged backend**: Python FastAPI agent (`agent/`) listening on
  `127.0.0.1:8765`, reachable only through the OS.js server's authenticated
  proxy.
- **Real authentication**: PAM login against system Linux users
  (`WEBOS_AUTH=pam`); the terminal opens a shell as the session user.

## Screenshots

![Demo](docs/screenshots/demo.gif)

![Login](docs/screenshots/01-login.png)

![Desktop](docs/screenshots/02-desktop.png)

| Launcher | System Info | Logs |
|---|---|---|
| ![Launcher](docs/screenshots/03-launcher.png) | ![SysInfo](docs/screenshots/10-sysinfo.png) | ![Logs](docs/screenshots/11-logs.png) |
| **Services** | **Processes** | **Disks** |
| ![Services](docs/screenshots/12-services.png) | ![Processes](docs/screenshots/13-processes.png) | ![Disks](docs/screenshots/14-disks.png) |
| **Docker** | **Users** | **Cron** |
| ![Docker](docs/screenshots/15-docker.png) | ![Users](docs/screenshots/16-users.png) | ![Cron](docs/screenshots/17-cron.png) |
| **App Store** | **Terminal** | **File Manager** |
| ![Store](docs/screenshots/18-store.png) | ![Terminal](docs/screenshots/19-terminal.png) | ![FileManager](docs/screenshots/20-filemanager.png) |
| **Settings** | **Remote Access** | **Backup** |
| ![Settings](docs/screenshots/21-settings.png) | ![Remote](docs/screenshots/22-remote.png) | ![Backup](docs/screenshots/24-backup.png) |
| **Navigator** | **Folder picker (Backup)** | **Databases** |
| ![Navigator](docs/screenshots/25-navigator.png) | ![Picker](docs/screenshots/26-backup-picker.png) | ![Databases](docs/screenshots/30-databases.png) |
| **Packages** | **Network** | **Firewall** |
| ![Packages](docs/screenshots/31-packages.png) | ![Network](docs/screenshots/32-network.png) | ![Firewall](docs/screenshots/33-firewall.png) |
| **Web Sites** | **Certificates** | **Shares** |
| ![WebSites](docs/screenshots/34-websites.png) | ![Certificates](docs/screenshots/35-certificates.png) | ![Shares](docs/screenshots/36-shares.png) |
| **Security** | **Drive Health** | **VPN** |
| ![Security](docs/screenshots/37-security.png) | ![Smart](docs/screenshots/38-smart.png) | ![VPN](docs/screenshots/39-vpn.png) |
| **Alerts** | **System Update** | |
| ![Alerts](docs/screenshots/40-alerts.png) | ![Update](docs/screenshots/41-update.png) | |

## Tested platforms

| Platform | Architecture | Mode |
|---|---|---|
| Docker (Ubuntu 24.04) | x86_64 | container (`--docker`) |
| Docker (Fedora / Arch / Slackware) | x86_64 | `docker-compose.test.yml` — package-manager validation |
| Ubuntu VPS | x86_64 | native install — production |
| Raspberry Pi 2 | armv7l | native install |
| Orange Pi | armv7l/arm64 | native install |
| Walnut Pi | armv7l/arm64 | native install |

## Quick install

```bash
git clone https://github.com/tiagoiwamoto/iwa-webos.git
cd iwa-webos
./install.sh
```

By default `install.sh` performs a **native install on the host** — the
panel manages the system it was installed on: real users, systemd, disks,
docker, crontab and logs **of this machine**.

It automatically detects and resolves:

- python3 + venv/pip, curl, ca-certificates, xz (via
  apt/dnf/pacman/zypper/apk — `-y` skips the questions)
- node >= 20.6 — uses the system one if present, otherwise downloads its
  own runtime to `/opt/webos/node` (no conflict with the distro's node)
- copies sources to `/opt/webos`, creates the agent venv, builds the web
- writes `/opt/webos/.env` (random token) and `/etc/pam.d/webos`
- creates the `webos` group and adds **your user** to it
- installs and enables the `webos-agent` + `webos-web` units (systemd)

```
URL:    http://<your-ip>:8000
Login:  your Linux user + password  (must be in the 'webos' group)

Grant access to another user:  sudo usermod -aG webos <user>
```

### Container demo mode

```bash
./install.sh --docker
```

Brings up an Ubuntu container with systemd as PID 1 — user `webos/webos`
created at boot. Useful for trying the UI without touching the real
system; everything the panel does happens **inside the container**.

Multi-distro test rigs (Fedora, Arch and Slackware side by side, used to
validate the package-manager detection in the Packages app):

```bash
docker compose -f docker-compose.test.yml up -d --build
# http://localhost:8001 Fedora · :8002 Arch · :8003 Slackware — webos/webos
```

## Updating (without losing anything)

```bash
./update.sh               # git pull + reinstall preserving state
SKIP_GIT=1 ./update.sh    # skips the pull (sources already updated/manual)
```

If the update mechanism fails, recover over SSH — go to the source
directory (`WEBOS_SOURCE_DIR` in `/opt/webos/.env`, or `/opt/webos-src`),
pull and run the script as root:

```bash
cd /opt/webos-src          # or your clone dir
sudo git pull
sudo chmod +x update.sh
sudo ./update.sh
```

Run it as a normal user — it re-execs itself under `sudo` and, when
already root, pulls the repo as the `.git` owner via `runuser`. The
System Update app triggers the same script through `systemd-run`; the
agent locates the source checkout via `WEBOS_SOURCE_DIR` (written to
`.env` by the installer) or clones the repo into `/opt/webos-src`.

`update.sh` makes an extra backup in `/opt/webos-state-backup/` and runs
`install.sh`, which **does not touch** the data:

| Preserved | Where |
|---|---|
| Token/config | `/opt/webos/.env` |
| Google Drive connection | `/opt/webos/rclone.conf` |
| Backup jobs | `/opt/webos/.backup-jobs.json` |
| Remote connections (SSH/FTP/Git) | `/opt/webos/.remote-connections.json` |
| Remote host keys | `/opt/webos/.remote-known-hosts` |
| Node runtime, venv, node_modules | `/opt/webos/{node,agent/.venv,web/node_modules}` |
| Wallpapers (incl. uploads) | `/home/images/` |
| Linux users and `webos` group | system |

On ARM (Pi) the web rebuild takes ~15 min — that's normal. If you prefer
the manual route: `git pull`, copy sources to `/opt/webos` **without**
`--delete` (or with the same `--exclude` as `install.sh`), rebuild the web
(`npm ci`, `patch-settings.js`, `npm run build`, `package:discover`) and
`systemctl restart webos-agent webos-web`.

## Uninstall

```bash
./uninstall.sh            # detects the mode used (native or docker)
./uninstall.sh --all -y   # removes everything without asking
```

- **Native**: stops/disables the units, removes
  `/etc/systemd/system/webos-*`, `/etc/pam.d/webos` and `/opt/webos`
  (asks first). The `webos` group stays — remove it with
  `sudo groupdel webos`.
- **Docker**: `compose down` (+ store app volumes with `--all`) and
  removes the image.

## What runs on the system

Installed natively, two systemd units (`deploy/`):

- `webos-agent` — FastAPI on `127.0.0.1:8765` (root — useradd, udisksctl,
  docker socket)
- `webos-web` — OS.js server on `:8000`

```bash
systemctl status webos-agent webos-web   # native
docker exec linux-webos systemctl status webos-agent webos-web   # demo
```

In `--docker` mode, a single Ubuntu 24.04 container with systemd as
PID 1 (`privileged`, `tmpfs /run`) runs the same units plus
`webos-bootstrap` (oneshot that generates `.env`, PAM, group and demo
user).

## Included apps

| App | What it does | Via |
|---|---|---|
| Files | Dolphin-like manager: breadcrumb, places sidebar with block devices (mount/unmount) and favorites, cut/copy/paste, upload/download, list & icon views | OS.js VFS + agent `disks` |
| Terminal | Multi-tab shell — each tab = 1 WS + 1 PTY with `setuid` to the session user | agent `/ws/terminal` |
| Tasks | Lists processes, TERM/KILL/INT signals (protects PID1/agent) | agent `/api/processes` |
| Services | systemd units: start/stop/enable/status | `systemctl` |
| Disks | `fdisk -l`, mklabel/mkpart/mkfs, mount/umount, wipefs | `lsblk`+`parted` |
| Docker | Containers/images: start/stop/logs/pull, edit env/ports/params and recreate | docker socket |
| App Store | CasaOS index + bundled catalog (`store/`): 14 classic apps — WordPress, phpBB, MyBB, SMF, Joomla, Drupal, Ghost, MediaWiki, PrestaShop, osTicket, Kanboard, Flarum, Matomo, phpMyAdmin — works offline, icons via authenticated proxy | `docker compose` |
| Users | User CRUD, password, lock/unlock | `useradd`/`usermod` |
| Packages | Search/install/remove, pending system updates, one-click install of missing admin tools — auto-detects the distro's package manager | `apt`, `dnf`/`yum`, `pacman`, `zypper`, `apk`, `slackpkg` |
| Network | Interfaces, addresses, routes, listening ports | `ip`/`ss` |
| Firewall | ufw rules: list, allow/deny, enable/disable | `ufw` |
| Web Sites | Nginx vhosts and reverse proxies | `nginx` |
| Certificates | Let's Encrypt TLS issue/renew per site | `certbot` |
| Databases | PostgreSQL/MySQL manager: object tree, tabbed SQL console, saved queries, table designer, CSV import/export, pop-out result windows | `psql`/`mysql` |
| Shares | Samba/NFS shares: list, create, valid users | `testparm`/`exportfs` |
| Security | SSH daemon options + fail2ban jails and banned IPs | `sshd`/`fail2ban` |
| Drive Health | SMART status and attributes per disk | `smartctl` |
| VPN | WireGuard interfaces, peers and client configs | `wg` |
| Alerts | CPU/RAM/disk usage thresholds → desktop notifications | agent `/api/server/alerts` |
| Cron | Visual crontab: presets, toggle, per user | `crontab` |
| Logs | Journald with filters (unit/prio/time/text), live tail, export | `journalctl` |
| Remote Access | Saved SSH/SFTP/SCP/FTP connections + remote browser, command exec and Git (clone/pull/push/log) | `ssh`/`scp`/`curl`/`git` |
| Backup | Sync local folders to Google Drive (OAuth via rclone, jobs with toggle + on-demand sync) | `rclone` |
| Navigator | Netscape-classic style web browser — back/forward/reload/stop, Location bar, retro home and same-origin proxy for sites that block iframes | iframe + proxy (`requests`) |
| System Update | Malta OS update from the launcher — runs update.sh via systemd-run (survives service restarts) with live log, progress bar and update lock; preserves all state | `update.sh`/`systemd-run` |
| SysInfo | CPU/RAM/disk/net-I/O gauges, per-core bars, sensor temps, per-mount usage, open TCP conns, hostname editor | agent `/api/system` |
| Editor | Monaco for host files | agent `/api/files` |
| Settings | Themes, window style (Win11/macOS/KDE/GNOME), wallpaper gallery + upload, dock (size/position/magnify/manage), language | OS.js settings |

The server-administration apps (Packages → Alerts) share one agent module
(`agent/app/routers/server.py`) and offer **one-click install** when the
underlying tool is missing.

## Authentication (PAM)

With `WEBOS_AUTH=pam` the login validates against `/etc/passwd` +
`/etc/shadow` via `pam_unix` (service `/etc/pam.d/webos`):

- **Users app** → creates/removes accounts that can actually log in.
- **Lock/Unlock** (`usermod -L/-U`) blocks/allows the web login.
- **`WEBOS_REQUIRED_GROUPS`** (default `webos`): only members log in;
  `usermod -aG webos <user>` grants access.
- **`WEBOS_DENY_USERS`**: denylist even with correct password.
- **Terminal** inherits the logged-in user (`initgroups`/`setuid` in the
  PTY).
- **`home:/`** points to the real `/home/<user>` (`WEBOS_VFS_ROOT=/home`).
- **Sessions** persist in `/opt/webos/.sessions.json` (7-day TTL); logging
  out from the session menu revokes the token.

Without `WEBOS_AUTH=pam` dev mode applies: any credential gets in
(null-adapter) and the terminal runs as root.

### Changing the port

```bash
# Docker — host AND container port via env var:
WEBOS_PORT=9090 docker compose up -d

# Native — add to /opt/webos/.env and restart:
echo 'WEBOS_PORT=9090' | sudo tee -a /opt/webos/.env
sudo systemctl restart webos-web
```

## Configuration (docker-compose.yml `environment:`)

| Var | Default | Effect |
|---|---|---|
| `WEBOS_AUTH` | `pam` | `pam` = Linux users; other = dev |
| `WEBOS_USER` / `WEBOS_PASSWORD` | `webos` / `webos` | demo user created at boot |
| `WEBOS_REQUIRED_GROUPS` | `webos` | group gate at login |
| `WEBOS_DENY_USERS` | — | banned users |
| `WEBOS_VFS_ROOT` | `/home` | root of the `home:` mount |
| `WEBOS_STORE_URL` | CasaOS-AppStore | app store index |
| `WEBOS_TOKEN` | random/boot | agent token (pin it to persist) |

## Manual setup (development, no docker)

```bash
echo "WEBOS_TOKEN=$(openssl rand -hex 32)" > .env

cd agent && python3 -m venv .venv \
  && ./.venv/bin/pip install -r requirements.txt \
  && ./.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8765

cd web && npm install \
  && npm run build && npm run package:discover \
  && npm run serve   # http://localhost:8000
```

## Deploy (production)

1. Copy the repo to `/opt/webos` (or adjust the paths in `deploy/`).
2. `deploy/webos-agent.service` and `deploy/webos-web.service` are
   ready-made systemd units — the agent needs root (useradd, chpasswd,
   udisksctl, docker socket).
3. The agent only listens on `127.0.0.1:8765`; browser calls go through
   the `/api/webos/*` proxy which injects `X-WebOS-Token` — the token
   never reaches the browser.

## Notes and limitations

- **Docker socket** mounted in compose gives the store/Docker app control
  over the **host's** containers — remove the volume if you don't need it.
- **File Manager/Editor** operate with process privileges (root);
  `host:/` gives full filesystem access — admin tool.
- **Disks**: destructive operations validate the device and refuse
  mounted ones, but there's no undo.
- **App Store** merges the remote CasaOS index with the bundled `store/`
  catalog — local recipes win conflicts and install offline; only run
  apps you trust either way.
- Node ≥ 20.6 (`process.loadEnvFile`). Build tested with Node 26.
- Webpack 4 uses md4; `scripts/build.js` aliases it to sha256.
- `scripts/patch-settings.js` injects the appearance/wallpaper items into
  the minified Settings (run during the image build and idempotent).

## Structure

```
install.sh / uninstall.sh  # auto-detected install / removal
agent/app/main.py          # FastAPI: token auth, routers
agent/app/routers/*.py     # auth, system, files, disks, users, docker,
                           # services, processes, store, logs, cron,
                           # terminal(WS), remote, backup, browser,
                           # server, notifications, sysupdate
agent/tests/               # pytest suite for the agent API
store/                     # bundled app-store catalog (compose recipes)
web/src/server/webos.js    # authenticated proxy /api/webos/* + /ws/webos/terminal
web/src/server/auth-pam.js # OS.js -> PAM adapter (WEBOS_AUTH=pam)
web/src/client/config.js   # mountpoints, default wallpaper
web/src/client/dock.js     # dock, launcher, session menu, appearance
web/src/client/widgets.js  # desktop system widgets
web/src/packages/webos-*   # desktop apps
web/src/packages/_shared/  # api.js + ui.js + i18n.js + server-app.js
web/scripts/build.js       # unified build (md4->sha256, brand replace)
web/scripts/patch-settings.js # injects sections into the Settings app
docker/images/             # wallpapers in /home/images
docker/webos-bootstrap*    # container bootstrap
deploy/*.service           # systemd units (production AND container)
```

## References and credits

**Framework and UI**

- [OS.js](https://github.com/os-js/OS.js) — browser desktop windowed
  environment, by [Anders Evenrud](https://github.com/andersevenrud).
  The base of the entire client: windows, VFS, settings, apps and
  authentication (`@osjs/client`, `@osjs/server`, `@osjs/gui`,
  `@osjs/dialogs`, `@osjs/panels`, `@osjs/standard-theme`,
  `@osjs/gnome-icons`, `@osjs/filemanager-application`,
  `@osjs/settings-application`, `@osjs/htmlviewer-application`,
  `@osjs/preview-application`)
- [Hyperapp](https://github.com/jorgebucaran/hyperapp) — micro UI
  framework used internally by `@osjs/gui`
- [xterm.js](https://github.com/xtermjs/xterm.js) — terminal emulator of
  the Terminal app
- [Monaco Editor](https://github.com/microsoft/monaco-editor) — code
  editor of the Code Editor app
- [Node.js](https://nodejs.org) — server runtime (official builds used
  by the installer for x64/arm64/armv7l/ppc64le/s390x)

**Privileged agent (Python)**

- [FastAPI](https://github.com/fastapi/fastapi) +
  [uvicorn](https://github.com/encode/uvicorn) — REST API + proxy
- [psutil](https://github.com/giampaolo/psutil) — CPU, RAM, disk,
  network, processes
- [python-pam](https://pypi.org/project/python-pam/) — real PAM
  authentication (`pam_unix`)
- [docker-py](https://github.com/docker/docker-py) — Docker app and store
- [websockets](https://github.com/python-websockets/websockets) — terminal
  PTY (spawn with `setuid`/`initgroups` of the logged-in user)
- [requests](https://github.com/psf/requests),
  [python-dotenv](https://github.com/theskumar/python-dotenv)
- [rclone](https://rclone.org/) — Google Drive backup (headless OAuth +
  `rclone sync`)
- [pytest](https://pytest.org) + [httpx](https://www.python-httpx.org/) —
  agent test suite (`agent/tests/`)

**App store**

- [CasaOS AppStore](https://github.com/IceWhaleTech/CasaOS-AppStore) —
  app index (docker-compose + `x-casaos` metadata), consumed via
  [jsDelivr](https://www.jsdelivr.com/)
- [Docker](https://www.docker.com/) +
  [Docker Compose](https://docs.docker.com/compose/) — execution of
  installed apps

**Managed system tools**

- [systemd](https://systemd.io/) / `journalctl` — services and logs
- [util-linux](https://github.com/util-linux/util-linux) (`lsblk`,
  `fdisk`, `mount`) + [GNU parted](https://www.gnu.org/software/parted/) +
  `mkfs`/`wipefs` — disks
- [shadow](https://github.com/shadow-maint/shadow) (`useradd`, `usermod`,
  `chpasswd`) — users
- `crontab` ([cron](https://github.com/cronie-crond/cronie)) — scheduler
- [PAM](https://github.com/linux-pam/linux-pam) (`pam_unix`) —
  authentication
- [nginx](https://nginx.org/) +
  [certbot](https://certbot.eff.org/) — web sites and Let's Encrypt
  certificates
- [PostgreSQL](https://www.postgresql.org/) /
  [MariaDB](https://mariadb.org/) — managed by the Databases app
- [Samba](https://www.samba.org/) + NFS — file shares
- [UFW](https://wiki.ubuntu.com/UncomplicatedFirewall) — firewall
- [WireGuard](https://www.wireguard.com/) — VPN
- [fail2ban](https://github.com/fail2ban/fail2ban) + OpenSSH — security
- [smartmontools](https://www.smartmontools.org/) — drive health

**Assets**

- Maltese icon and wallpapers: SVGs generated for this project
  (`docker/images/`), plus JPEGs provided by the author
