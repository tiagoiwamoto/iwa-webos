#!/usr/bin/env bash
#
# IwaWebOs installer — detecta dependências, instala o que falta,
# builda a imagem e sobe o container systemd.
#
# Uso:
#   git clone https://github.com/tiagoiwamoto/iwa-webos.git && cd iwa-webos && ./install.sh
#   ./install.sh -y          # sem perguntas (instala deps automaticamente)
#   ./install.sh --no-deps   # só detecta, não instala nada (falha se faltar)
#
set -euo pipefail

YES=0
NO_DEPS=0
PORT="${WEBOS_PORT:-8000}"
for arg in "$@"; do
  case "$arg" in
    -y|--yes) YES=1 ;;
    --no-deps) NO_DEPS=1 ;;
    -h|--help) sed -n '2,12p' "$0"; exit 0 ;;
    *) echo "opção desconhecida: $arg" >&2; exit 2 ;;
  esac
done

log()  { printf '\033[1;36m==>\033[0m %s\n' "$*"; }
ok()   { printf '\033[1;32m  ✓\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m  !\033[0m %s\n' "$*"; }
die()  { printf '\033[1;31mERRO:\033[0m %s\n' "$*" >&2; exit 1; }

need() { command -v "$1" >/dev/null 2>&1; }

SUDO=""
if [ "$(id -u)" -ne 0 ]; then
  need sudo && SUDO="sudo" || warn "sem root e sem sudo — instalação de deps pode falhar"
fi

confirm() {
  [ "$YES" -eq 1 ] && return 0
  printf '%s [y/N] ' "$1"
  read -r a </dev/tty 2>/dev/null || a=n
  [ "$a" = "y" ] || [ "$a" = "Y" ]
}

install_pkg() {
  # $@ = pacotes a instalar via gerenciador detectado
  if   need apt-get; then $SUDO apt-get update -qq && $SUDO apt-get install -y "$@"
  elif need dnf;     then $SUDO dnf install -y "$@"
  elif need pacman;  then $SUDO pacman -Sy --noconfirm "$@"
  elif need zypper;  then $SUDO zypper install -y "$@"
  elif need apk;     then $SUDO apk add "$@"
  else return 1
  fi
}

pkg_names() {
  # docker + compose por distro
  if   need apt-get; then echo "docker.io docker-compose-v2"
  elif need dnf;     then echo "docker docker-compose-plugin"
  elif need pacman;  then echo "docker docker-compose"
  elif need zypper;  then echo "docker docker-compose"
  elif need apk;     then echo "docker docker-compose"
  else echo "docker"
  fi
}

cd "$(dirname "$(readlink -f "$0")")"
[ -f docker-compose.yml ] || die "rode de dentro do repo (onde está docker-compose.yml)"
[ "$(uname -s)" = "Linux" ] || die "IwaWebOs precisa de Linux (container com systemd)."

log "Verificando dependências"

# --- git (informativo; o clone já trouxe o script) ---
need git && ok "git $(git --version | awk '{print $3}')" \
         || warn "git não encontrado (ok se já tem os fontes)"

# --- docker ---
if ! need docker; then
  warn "docker não encontrado"
  [ "$NO_DEPS" -eq 1 ] && die "instale docker e rode novamente"
  if confirm "Instalar docker ($(pkg_names))?"; then
    # shellcheck disable=SC2046
    install_pkg $(pkg_names) || die "não consegui instalar docker — instale manualmente"
  else
    die "docker é obrigatório"
  fi
fi
ok "docker $(docker version --format '{{.Server.Version}}' 2>/dev/null || docker --version | awk '{print $3}')"

# --- daemon alcançável ---
DOCKER="docker"
if ! docker info >/dev/null 2>&1; then
  if $SUDO docker info >/dev/null 2>&1; then
    DOCKER="$SUDO docker"
    warn "daemon ok via sudo — considere: sudo usermod -aG docker $USER (e relogue)"
  else
    warn "daemon docker não responde — tentando subir"
    $SUDO systemctl start docker 2>/dev/null || $SUDO service docker start 2>/dev/null || true
    sleep 2
    docker info >/dev/null 2>&1 || $SUDO docker info >/dev/null 2>&1 \
      || die "daemon docker indisponível (docker desktop? rode docker --context desktop-linux info)"
    docker info >/dev/null 2>&1 || DOCKER="$SUDO docker"
  fi
fi
ok "daemon docker ativo"

# --- compose ---
if $DOCKER compose version >/dev/null 2>&1; then
  COMPOSE="$DOCKER compose"
elif need docker-compose; then
  COMPOSE="docker-compose"
  [ "$DOCKER" != "docker" ] && COMPOSE="$SUDO docker-compose"
else
  warn "docker compose não encontrado"
  [ "$NO_DEPS" -eq 1 ] && die "instale o plugin compose"
  if confirm "Instalar compose?"; then
    # shellcheck disable=SC2046
    install_pkg $(pkg_names) || die "não consegui instalar compose"
  else
    die "docker compose é obrigatório"
  fi
  if $DOCKER compose version >/dev/null 2>&1; then
    COMPOSE="$DOCKER compose"
  else
    COMPOSE="${DOCKER/docker/docker-compose}"
  fi
fi
ok "compose: $COMPOSE"

# --- porta ---
if command -v ss >/dev/null 2>&1 && ss -ltn | grep -q ":$PORT "; then
  die "porta $PORT ocupada — pare o serviço que a usa ou mude WEBOS_PORT"
fi
ok "porta $PORT livre"

# --- build + up ---
log "Buildando imagem e subindo container (primeira vez demora)"
$COMPOSE up -d --build

log "Aguardando o desktop ficar pronto"
tries=0
until curl -sf "http://localhost:$PORT/" >/dev/null 2>&1; do
  tries=$((tries + 1))
  [ "$tries" -gt 90 ] && die "timeout esperando :$PORT — veja: $DOCKER logs linux-webos"
  sleep 2
done

cat <<EOF

$(printf '\033[1;32m')IwaWebOs no ar!$(printf '\033[0m')

  URL:    http://localhost:$PORT
  Login:  webos / webos   (usuário Linux real criado no boot — TROQUE a senha)

  Logs:      $DOCKER logs -f linux-webos
  Status:    $DOCKER exec linux-webos systemctl status webos-web webos-agent
  Parar:     $COMPOSE stop
  Remover:   ./uninstall.sh

EOF
