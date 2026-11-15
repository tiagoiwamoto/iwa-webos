#!/usr/bin/env bash
#
# IwaWebOs installer.
#
#   ./install.sh              # instala NATIVO no host (default) — o painel
#                             # gerencia ESTE sistema: usuários, systemd,
#                             # discos, docker, crontab, logs.
#   ./install.sh --docker     # modo demo: tudo dentro de um container.
#   ./install.sh -y           # sem perguntas (instala deps automaticamente)
#   ./install.sh --no-deps    # só detecta; falha se algo faltar
#
# Fluxo:
#   git clone https://github.com/tiagoiwamoto/iwa-webos.git
#   cd iwa-webos && ./install.sh
#
set -euo pipefail

MODE=host
YES=0
NO_DEPS=0
PORT="${WEBOS_PORT:-8000}"
PREFIX=/opt/webos
for arg in "$@"; do
  case "$arg" in
    --docker) MODE=docker ;;
    --host) MODE=host ;;
    -y|--yes) YES=1 ;;
    --no-deps) NO_DEPS=1 ;;
    -h|--help) sed -n '2,16p' "$0"; exit 0 ;;
    *) echo "opção desconhecida: $arg" >&2; exit 2 ;;
  esac
done

log()  { printf '\033[1;36m==>\033[0m %s\n' "$*"; }
ok()   { printf '\033[1;32m  ✓\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m  !\033[0m %s\n' "$*"; }
die()  { printf '\033[1;31mERRO:\033[0m %s\n' "$*" >&2; exit 1; }
need() { command -v "$1" >/dev/null 2>&1; }

SUDO=""
[ "$(id -u)" -ne 0 ] && need sudo && SUDO="sudo"

confirm() {
  [ "$YES" -eq 1 ] && return 0
  printf '%s [y/N] ' "$1"; read -r a </dev/tty 2>/dev/null || a=n
  [ "$a" = "y" ] || [ "$a" = "Y" ]
}

install_pkg() {
  if   need apt-get; then $SUDO apt-get update -qq && $SUDO apt-get install -y "$@"
  elif need dnf;     then $SUDO dnf install -y "$@"
  elif need pacman;  then $SUDO pacman -Sy --noconfirm "$@"
  elif need zypper;  then $SUDO zypper install -y "$@"
  elif need apk;     then $SUDO apk add "$@"
  else return 1
  fi
}

pkg_for() { # $1 = dep lógico → nomes por distro
  case "$1" in
    docker)
      if   need apt-get; then echo "docker.io docker-compose-v2"
      elif need dnf;     then echo "docker docker-compose-plugin"
      elif need pacman;  then echo "docker docker-compose"
      elif need zypper;  then echo "docker docker-compose"
      elif need apk;     then echo "docker docker-compose"
      else echo "docker"; fi ;;
    python)
      if   need apt-get; then echo "python3 python3-venv python3-pip"
      elif need dnf;     then echo "python3 python3-pip"
      elif need pacman;  then echo "python python-pip"
      elif need zypper;  then echo "python3 python3-pip"
      elif need apk;     then echo "python3 py3-pip"
      else echo "python3"; fi ;;
    tools)
      if   need apt-get; then echo "curl ca-certificates xz-utils"
      elif need dnf;     then echo "curl ca-certificates xz"
      elif need pacman;  then echo "curl ca-certificates xz"
      elif need zypper;  then echo "curl ca-certificates xz"
      elif need apk;     then echo "curl ca-certificates xz"
      else echo "curl xz"; fi ;;
    build) # pip compila psutil do source em arquiteturas sem wheel (armv7l…)
      if   need apt-get; then echo "gcc python3-dev"
      elif need dnf;     then echo "gcc python3-devel"
      elif need pacman;  then echo "base-devel"
      elif need zypper;  then echo "gcc python3-devel"
      elif need apk;     then echo "gcc musl-dev python3-dev"
      else echo "gcc"; fi ;;
    npm) echo "npm" ;;
  esac
}

ensure() { # $1 = dep lógico, $2 = teste (comando)
  local dep="$1"; shift
  if "$@" >/dev/null 2>&1; then ok "$dep presente"; return 0; fi
  warn "$dep faltando"
  [ "$NO_DEPS" -eq 1 ] && die "instale $dep e rode novamente"
  if confirm "Instalar $(pkg_for "$dep")?"; then
    # shellcheck disable=SC2046
    install_pkg $(pkg_for "$dep") || die "falha instalando $dep"
  else
    die "$dep é obrigatório"
  fi
}

cd "$(dirname "$(readlink -f "$0")")"
[ -f docker-compose.yml ] || die "rode de dentro do repo (onde está docker-compose.yml)"
[ "$(uname -s)" = "Linux" ] || die "IwaWebOs precisa de Linux."

# =========================================================================
install_docker() {
  log "Modo: container demo (docker)"
  if ! need docker; then
    warn "docker não encontrado"
    [ "$NO_DEPS" -eq 1 ] && die "instale docker"
    if confirm "Instalar docker ($(pkg_for docker))?"; then
      # shellcheck disable=SC2046
      install_pkg $(pkg_for docker) || die "falha instalando docker"
    else die "docker é obrigatório"; fi
  fi
  ok "docker instalado"

  DOCKER="docker"
  if ! docker info >/dev/null 2>&1; then
    if $SUDO docker info >/dev/null 2>&1; then
      DOCKER="$SUDO docker"
      warn "daemon via sudo — considere: sudo usermod -aG docker $USER"
    else
      $SUDO systemctl start docker 2>/dev/null || $SUDO service docker start 2>/dev/null || true
      sleep 2
      docker info >/dev/null 2>&1 || $SUDO docker info >/dev/null 2>&1 \
        || die "daemon docker indisponível"
      docker info >/dev/null 2>&1 || DOCKER="$SUDO docker"
    fi
  fi
  ok "daemon docker ativo"

  if $DOCKER compose version >/dev/null 2>&1; then
    COMPOSE="$DOCKER compose"
  elif need docker-compose; then
    COMPOSE="${DOCKER/docker/docker-compose}"
  else
    warn "compose não encontrado"
    [ "$NO_DEPS" -eq 1 ] && die "instale o compose"
    confirm "Instalar compose?" \
      && { install_pkg $(pkg_for docker) || true; } || die "compose obrigatório"
    $DOCKER compose version >/dev/null 2>&1 \
      && COMPOSE="$DOCKER compose" \
      || COMPOSE="${DOCKER/docker/docker-compose}"
  fi
  ok "compose: $COMPOSE"

  command -v ss >/dev/null 2>&1 && ss -ltn | grep -q ":$PORT " \
    && die "porta $PORT ocupada (mude WEBOS_PORT)"
  ok "porta $PORT livre"

  log "Buildando imagem e subindo container"
  $COMPOSE up -d --build

  log "Aguardando o desktop responder"
  tries=0
  until curl -sf "http://localhost:$PORT/" >/dev/null 2>&1; do
    tries=$((tries + 1)); [ "$tries" -gt 90 ] && die "timeout — veja: $DOCKER logs linux-webos"
    sleep 2
  done

  cat <<EOF

$(printf '\033[1;32m')IwaWebOs (demo em container) no ar!$(printf '\033[0m')

  URL:    http://localhost:$PORT
  Login:  webos / webos   (criado no boot do container — é demo!)

  Logs:      $DOCKER logs -f linux-webos
  Remover:   ./uninstall.sh --docker

  Dica: para gerenciar ESTE sistema de verdade, rode ./install.sh (sem --docker).
EOF
}

# =========================================================================
install_host() {
  log "Modo: instalação nativa — gerencia ESTE sistema"
  [ -n "$SUDO" ] || [ "$(id -u)" -eq 0 ] \
    || die "precisa de root ou sudo (systemd, PAM, /opt)"
  need systemctl || die "requer systemd no host"

  # --- deps de SO ---
  ensure python python3 -c 'import venv'
  ensure tools curl --version
  need xz || { warn "xz faltando"; install_pkg $(pkg_for tools) || true; }
  # gcc + headers Python: pip compila psutil do source onde não há wheel (armv7l)
  { need gcc && python3 -c 'import sysconfig,os,sys; sys.exit(0 if os.path.isfile(sysconfig.get_path("include")+"/Python.h") else 1)'; } \
    || ensure build false

  # --- node >= 20.6 + npm ---
  NODEDIR_PKG="$PREFIX/node"   # runtime próprio, quando baixado
  NODE_BIN=""
  node_ok() {
    need node && [ "$(node -e 'const v=process.version.slice(1).split(".");console.log(+v[0]>20||(+v[0]==20&&+v[1]>=6)?1:0)' 2>/dev/null)" = "1" ]
  }
  bundled_ok() { # runtime próprio já instalado e íntegro?
    [ -x "$NODEDIR_PKG/bin/node" ] && [ -x "$NODEDIR_PKG/bin/npm" ] \
      && [ "$("$NODEDIR_PKG/bin/node" -e 'const v=process.version.slice(1).split(".");console.log(+v[0]>20||(+v[0]==20&&+v[1]>=6)?1:0)' 2>/dev/null)" = "1" ]
  }

  if node_ok && need npm; then
    NODE_BIN="$(command -v node)"
    ok "node $(node -v) + npm do sistema"
  elif bundled_ok; then
    NODE_BIN="$NODEDIR_PKG/bin/node"
    ok "node $($NODE_BIN -v) próprio já em $NODEDIR_PKG"
  else
    # node da distro pode vir sem npm (apt separa os pacotes) — tenta instalar
    if node_ok && ! need npm; then
      warn "node OK mas 'npm' ausente — instalando da distro"
      install_pkg $(pkg_for npm) || true
      if node_ok && need npm; then
        NODE_BIN="$(command -v node)"
        ok "node $(node -v) + npm (instalado) do sistema"
      fi
    fi
  fi

  if [ -z "$NODE_BIN" ]; then
    warn "baixando runtime node próprio para $NODEDIR_PKG"
    local arch; arch="$(uname -m)"
    case "$arch" in
      x86_64|amd64) arch=x64 ;;
      aarch64|arm64) arch=arm64 ;;
      armv7l|armhf) arch=armv7l ;;
      ppc64le) arch=ppc64le ;;
      s390x) arch=s390x ;;
      *) die "arquitetura $arch sem build node oficial (tente node da distro >= 20.6)" ;;
    esac
    local base="https://nodejs.org/dist/latest-v22.x"
    local fname
    fname="$(curl -fsSL "$base/SHASUMS256.txt" | grep "linux-$arch.tar.xz" | awk '{print $2}')" \
      || die "não consegui listar builds node (sem internet?)"
    [ -n "$fname" ] || die "build node linux-$arch não encontrado"
    $SUDO mkdir -p "$PREFIX"
    log "Baixando $fname"
    curl -fsSL "$base/$fname" -o /tmp/node.tar.xz
    $SUDO tar -xJf /tmp/node.tar.xz -C "$PREFIX" || die "falha extraindo node"
    $SUDO rm -rf "$NODEDIR_PKG"   # substituição limpa — nunca aninha
    $SUDO mv "$PREFIX"/node-v*-linux-"$arch" "$NODEDIR_PKG" \
      || die "falha movendo node para $NODEDIR_PKG"
    NODE_BIN="$NODEDIR_PKG/bin/node"
    [ -x "$NODEDIR_PKG/bin/npm" ] || die "runtime node incompleto (npm ausente em $NODEDIR_PKG/bin)"
    ok "node $($NODE_BIN -v) em $NODEDIR_PKG"
  fi

  # --- copia fontes ---
  log "Copiando fontes para $PREFIX"
  $SUDO mkdir -p "$PREFIX"
  $SUDO rsync -a --delete \
    --exclude '.git' --exclude 'web/node_modules' --exclude 'web/dist' \
    --exclude 'agent/.venv' --exclude '.env' --exclude 'web/vfs' \
    --exclude 'node' \
    ./ "$PREFIX/" 2>/dev/null \
    || { $SUDO cp -a agent web deploy docker install.sh uninstall.sh \
         docker-compose.yml Dockerfile README.md "$PREFIX/"; }
  ok "fontes em $PREFIX"

  # --- wallpapers (/home/images, mesmo caminho do modo docker) ---
  $SUDO mkdir -p /home/images
  $SUDO cp -a docker/images/. /home/images/
  ok "wallpapers em /home/images"

  # --- agente python ---
  log "Criando venv do agente"
  $SUDO python3 -m venv "$PREFIX/agent/.venv"
  $SUDO "$PREFIX/agent/.venv/bin/pip" install -q -r "$PREFIX/agent/requirements.txt"
  ok "agente pronto"

  # --- web (build) ---
  log "Instalando deps web + build (demora na primeira vez)"
  NODEDIR="$(dirname "$NODE_BIN")"
  NPMCLI="$NODEDIR/../lib/node_modules/npm/bin/npm-cli.js"
  if [ -f "$NPMCLI" ]; then NPM="'$NODE_BIN' '$NPMCLI'"; else NPM="npm"; fi
  $SUDO env "PATH=$NODEDIR:$PATH" sh -c \
    "cd '$PREFIX/web' && $NPM ci && '$NODE_BIN' scripts/patch-settings.js \
     && $NPM run build && $NPM run package:discover" \
    || die "build do web falhou"
  ok "web buildado"

  # --- config ---
  log "Escrevendo .env e PAM"
  token="$(head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')"
  $SUDO tee "$PREFIX/.env" >/dev/null <<EOF
WEBOS_AUTH=pam
WEBOS_REQUIRED_GROUPS=webos
WEBOS_VFS_ROOT=/home
WEBOS_TOKEN=$token
EOF
  $SUDO tee /etc/pam.d/webos >/dev/null <<'EOF'
auth     required  pam_unix.so
account  required  pam_unix.so
EOF
  getent group webos >/dev/null 2>&1 || $SUDO groupadd webos
  # quem instalou já ganha acesso ao painel
  invoker="${SUDO_USER:-$(id -un)}"
  $SUDO usermod -aG webos "$invoker" 2>/dev/null \
    && ok "usuário '$invoker' adicionado ao grupo webos" || true
  ok "PAM + grupo webos"

  # --- units ---
  log "Instalando unidades systemd"
  $SUDO cp deploy/webos-agent.service /etc/systemd/system/
  $SUDO sed "s|ExecStart=/usr/bin/node|ExecStart=$NODE_BIN|" \
    deploy/webos-web.service | $SUDO tee /etc/systemd/system/webos-web.service >/dev/null
  $SUDO systemctl daemon-reload
  $SUDO systemctl enable --now webos-agent webos-web
  sleep 3
  $SUDO systemctl is-active --quiet webos-agent webos-web \
    || die "serviços não subiram — veja: journalctl -u webos-agent -u webos-web"
  ok "webos-agent + webos-web ativos"

  ip="$(hostname -I 2>/dev/null | awk '{print $1}')"
  cat <<EOF

$(printf '\033[1;32m')IwaWebOs instalado e gerenciando ESTE sistema!$(printf '\033[0m')

  URL:    http://${ip:-localhost}:$PORT
  Login:  seu usuário Linux + senha  (precisa estar no grupo 'webos')

  Dar acesso a outro usuário:  sudo usermod -aG webos <usuario>
  Logs:     journalctl -u webos-web -u webos-agent -f
  Parar:    sudo systemctl stop webos-web webos-agent
  Remover:  ./uninstall.sh
EOF
}

[ "$MODE" = docker ] && install_docker || install_host
