#!/bin/sh
# Malta OS — atualização preservando estado
#
# Uso (a partir de um checkout novo ou após git pull):
#   ./update.sh            # puxa git (se houver) e reinstala preservando dados
#   SKIP_GIT=1 ./update.sh # pula o git pull (fontes já atualizadas)
#
# O que é preservado automaticamente (o rsync do install.sh não os toca):
#   /opt/webos/.env                      token/configuração
#   /opt/webos/rclone.conf               conexão do Google Drive
#   /opt/webos/.backup-jobs.json         jobs de backup
#   /opt/webos/.remote-connections.json  conexões salvas (SSH/FTP/Git)
#   /opt/webos/.remote-known-hosts       chaves de hosts remotos
#   /opt/webos/node                      runtime node baixado
#   /opt/webos/agent/.venv               venv do agente
#   /opt/webos/web/node_modules          deps do web
#   /home/images/*                       wallpapers (incl. uploads)
#
# Por precaução extra, este script também copia os arquivos de estado
# para /opt/webos-state-backup/ antes de atualizar.

set -e
cd "$(dirname "$0")"

SUDO=""; [ "$(id -u)" -ne 0 ] && SUDO="sudo"
PREFIX=/opt/webos
STATE_BACKUP=/opt/webos-state-backup

echo "==> Malta OS update (preserva estado)"

# 1) fontes novas
if [ "${SKIP_GIT:-0}" != "1" ] && [ -d .git ]; then
  echo "==> git pull"
  git pull --ff-only || echo "  ! git pull falhou — seguindo com as fontes locais"
fi

# 2) backup de segurança do estado (cópia, não move nada)
if [ -d "$PREFIX" ]; then
  echo "==> backup do estado em $STATE_BACKUP"
  $SUDO mkdir -p "$STATE_BACKUP"
  for f in .env rclone.conf .backup-jobs.json .remote-connections.json .remote-known-hosts; do
    [ -f "$PREFIX/$f" ] && $SUDO cp -a "$PREFIX/$f" "$STATE_BACKUP/$f" || true
  done
fi

# 3) reinstala (install.sh já exclui os arquivos de estado do rsync --delete
#    e só escreve .env se não existir)
exec sh ./install.sh -y
