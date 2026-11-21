#!/bin/bash
# PID 1 for the Slackware test container — Slackware has no systemd, so
# this script plays webos-bootstrap + a tiny supervisor: writes the PAM
# service, harvests WEBOS_* into /opt/webos/.env, creates the demo user,
# then runs webos-agent and webos-web side by side.
set -u

cat > /etc/pam.d/webos <<'EOF'
auth     required  pam_unix.so
account  required  pam_unix.so
EOF

: > /opt/webos/.env
while IFS='=' read -r name value; do
  case "$name" in
    WEBOS_*) printf '%s=%s\n' "$name" "$value" >> /opt/webos/.env ;;
  esac
done < <(env)

grep -q '^WEBOS_TOKEN=' /opt/webos/.env \
  || echo "WEBOS_TOKEN=$(head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')" >> /opt/webos/.env

getent group webos >/dev/null 2>&1 || groupadd webos

WEBOS_USER="${WEBOS_USER:-webos}"
WEBOS_PASSWORD="${WEBOS_PASSWORD:-webos}"
WEBOS_GROUPS="${WEBOS_GROUPS:-webos}"

if ! id "$WEBOS_USER" >/dev/null 2>&1; then
  useradd -m -s /bin/bash -N "$WEBOS_USER"
fi
[ -n "$WEBOS_GROUPS" ] && usermod -aG "$WEBOS_GROUPS" "$WEBOS_USER"
[ -n "$WEBOS_PASSWORD" ] && echo "$WEBOS_USER:$WEBOS_PASSWORD" | chpasswd
mkdir -p /srv/webos-apps

cd /opt/webos/agent
/opt/webos/agent/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8765 &
AGENT=$!

cd /opt/webos/web
NODE_ENV=production /usr/bin/node src/server/index.js &
WEB=$!

trap 'kill $AGENT $WEB 2>/dev/null' TERM INT
wait -n $AGENT $WEB
exit $?
