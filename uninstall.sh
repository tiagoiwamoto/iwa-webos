#!/usr/bin/env bash
#
# IwaWebOs uninstaller — para e remove container, imagem e volumes.
#
# Uso:
#   ./uninstall.sh            # remove container + imagem, pergunta sobre volumes
#   ./uninstall.sh --all -y   # remove tudo incluindo dados (webos-apps) sem perguntar
#   ./uninstall.sh --keep-img # remove container, mantém a imagem
#
set -euo pipefail

KEEP_IMG=0
PURGE=0
YES=0
for arg in "$@"; do
  case "$arg" in
    --keep-img) KEEP_IMG=1 ;;
    --all|--purge) PURGE=1 ;;
    -y|--yes) YES=1 ;;
    -h|--help) sed -n '2,10p' "$0"; exit 0 ;;
    *) echo "opção desconhecida: $arg" >&2; exit 2 ;;
  esac
done

log() { printf '\033[1;36m==>\033[0m %s\n' "$*"; }
confirm() {
  [ "$YES" -eq 1 ] && return 0
  printf '%s [y/N] ' "$1"; read -r a </dev/tty 2>/dev/null || a=n
  [ "$a" = "y" ] || [ "$a" = "Y" ]
}

cd "$(dirname "$(readlink -f "$0")")"

DOCKER="docker"
docker info >/dev/null 2>&1 || DOCKER="sudo docker"
if $DOCKER compose version >/dev/null 2>&1; then
  COMPOSE="$DOCKER compose"
else
  COMPOSE="$DOCKER-compose"
fi

log "Parando e removendo container"
if [ "$PURGE" -eq 1 ] || confirm "Remover também os dados (volume webos-apps / apps instalados pela loja)?"; then
  $COMPOSE down -v --remove-orphans
  echo "  volumes removidos"
else
  $COMPOSE down --remove-orphans
  echo "  volume webos-apps preservado"
fi

if [ "$KEEP_IMG" -eq 0 ]; then
  log "Removendo imagem"
  $DOCKER rmi linux-webos-webos 2>/dev/null \
    || $DOCKER images --format '{{.Repository}}:{{.Tag}}' \
       | grep -i webos | xargs -r $DOCKER rmi || true
fi

# nada é instalado no host além do container/imagem — arquivos do repo ficam
if [ -d .git ] && confirm "Apagar também este diretório ($(pwd))?"; then
  cd .. && rm -rf "${OLDPWD##*/}"
  echo "diretório removido"
fi

log "Desinstalação concluída. Nada foi alterado no host além do docker."
