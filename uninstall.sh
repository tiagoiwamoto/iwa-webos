#!/usr/bin/env bash
#
# IwaWebOs uninstaller.
#
#   ./uninstall.sh              # desinstala do MODO usado na instalação:
#                               # nativo (units/PAM//opt/webos) se detectado,
#                               # senão container docker.
#   ./uninstall.sh --docker     # força modo container
#   ./uninstall.sh --all -y     # remove tudo (inclui /opt/webos) sem perguntar
#   ./uninstall.sh --keep-img   # modo docker: mantém a imagem
#
set -euo pipefail

MODE=""
KEEP_IMG=0
YES=0
for arg in "$@"; do
  case "$arg" in
    --docker) MODE=docker ;;
    --host) MODE=host ;;
    --keep-img) KEEP_IMG=1 ;;
    --all|-y|--yes|--purge) YES=1 ;;
    -h|--help) sed -n '2,12p' "$0"; exit 0 ;;
    *) echo "opção desconhecida: $arg" >&2; exit 2 ;;
  esac
done

log() { printf '\033[1;36m==>\033[0m %s\n' "$*"; }
confirm() {
  [ "$YES" -eq 1 ] && return 0
  printf '%s [y/N] ' "$1"; read -r a </dev/tty 2>/dev/null || a=n
  [ "$a" = "y" ] || [ "$a" = "Y" ]
}

cd "$(dirname "$(readlink -f "$0")")" 2>/dev/null || true
SUDO=""; [ "$(id -u)" -ne 0 ] && command -v sudo >/dev/null 2>&1 && SUDO="sudo"

[ -z "$MODE" ] && {
  if [ -f /etc/systemd/system/webos-web.service ]; then MODE=host; else MODE=docker; fi
}
log "Modo detectado: $MODE"

if [ "$MODE" = host ]; then
  log "Parando e desabilitando unidades"
  $SUDO systemctl disable --now webos-web webos-agent 2>/dev/null || true
  $SUDO rm -f /etc/systemd/system/webos-web.service \
             /etc/systemd/system/webos-agent.service \
             /etc/systemd/system/webos-bootstrap.service \
             /etc/pam.d/webos
  $SUDO systemctl daemon-reload

  if confirm "Remover /opt/webos (código, venv, node, build)?"; then
    $SUDO rm -rf /opt/webos
  fi
  echo "  nota: grupo 'webos' mantido; remova com: sudo groupdel webos"
  echo "  nota: apps instalados pela loja são containers docker do host —"
  echo "        liste com: docker ps -a"
  log "Desinstalação concluída"
else
  DOCKER="docker"; docker info >/dev/null 2>&1 || DOCKER="sudo docker"
  if $DOCKER compose version >/dev/null 2>&1; then
    COMPOSE="$DOCKER compose"; else COMPOSE="${DOCKER/docker/docker-compose}"; fi

  log "Parando e removendo container"
  if confirm "Remover também os dados (volume webos-apps / apps da loja)?"; then
    $COMPOSE down -v --remove-orphans
  else
    $COMPOSE down --remove-orphans
  fi

  [ "$KEEP_IMG" -eq 0 ] && {
    log "Removendo imagem"
    $DOCKER rmi linux-webos-webos 2>/dev/null || true
  }
  log "Desinstalação concluída"
fi
