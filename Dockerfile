# Linux WebOS — Ubuntu test image.
#
# systemd is PID 1 and runs the same units as deploy/: webos-agent (FastAPI,
# root, 127.0.0.1:8765) and webos-web (OS.js, root, :8000). Requires a
# privileged container (or cgroup mounts) for systemd to work.
#
# Auth is real: WEBOS_AUTH=pam validates logins against the container's
# Linux users via pam_unix (service /etc/pam.d/webos, written by the
# webos-bootstrap unit at boot).

FROM node:22-bookworm AS node

FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
      systemd systemd-sysv dbus \
      python3 python3-venv python3-pip \
      libpam0g libpam-modules libpam-runtime \
      passwd util-linux procps fdisk parted udisks2 \
      e2fsprogs dosfstools xfsprogs btrfs-progs ntfs-3g exfatprogs \
      docker.io docker-compose-v2 cron \
      openssh-client sshpass git curl rclone \
      iproute2 ufw openssh-server nginx \
      certbot python3-certbot-nginx \
      postgresql mariadb-server samba nfs-kernel-server \
      fail2ban smartmontools wireguard-tools \
      ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    # host's dockerd is used via the mounted socket; mask in-container ones
    && systemctl mask docker.service docker.socket containerd.service \
    # webos-web.service ExecStart=/usr/bin/node
    && ln -sf /usr/local/bin/node /usr/bin/node

# Node runtime (>= 20.6 required for process.loadEnvFile)
COPY --from=node /usr/local/ /usr/local/

WORKDIR /opt/webos

COPY agent/requirements.txt agent/requirements.txt
RUN python3 -m venv agent/.venv \
    && agent/.venv/bin/pip install --no-cache-dir -r agent/requirements.txt

COPY web/package.json web/package-lock.json web/
COPY web/scripts/ web/scripts/
RUN cd web && npm ci --omit=dev && node scripts/patch-settings.js

COPY agent/ agent/
COPY web/ web/
# bundled app-store catalog of classic hosting apps (phpBB, MyBB, SMF…)
COPY store/ store/
COPY docker/images/ /home/images/
# dist/{apps,themes,icons,sounds}/* are absolute symlinks made on the host;
# wipe and regenerate for /opt/webos (discover only cleans apps + themes)
RUN cd web && rm -rf dist/apps dist/themes dist/icons dist/sounds \
    && npm run package:discover

COPY deploy/webos-agent.service deploy/webos-web.service /etc/systemd/system/
COPY docker/webos-bootstrap.service /etc/systemd/system/
COPY docker/webos-bootstrap /usr/local/bin/webos-bootstrap
RUN chmod +x /usr/local/bin/webos-bootstrap \
    && mkdir -p /srv/webos-apps \
    && systemctl enable webos-bootstrap webos-agent webos-web

EXPOSE 8000
STOPSIGNAL SIGRTMIN+3
ENTRYPOINT ["/sbin/init"]
