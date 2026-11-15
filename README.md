# IwaWebOs

Um "desktop de sistema operacional" no navegador para administrar Linux —
alternativa à UI tradicional de Cockpit/CasaOS/Webmin.

- **Shell**: [OS.js](https://github.com/os-js/OS.js) (`web/`) — janelas com
  minimizar/maximizar/fechar, dock com launcher estilo GNOME, widgets e
  wallpapers.
- **Backend privilegiado**: agente Python FastAPI (`agent/`) escutando em
  `127.0.0.1:8765`, acessível apenas via proxy autenticado do servidor OS.js.
- **Autenticação real**: login PAM contra usuários Linux do sistema
  (`WEBOS_AUTH=pam`); o terminal abre shell como o usuário da sessão.

## Instalação rápida

```bash
git clone https://github.com/tiagoiwamoto/iwa-webos.git
cd iwa-webos
./install.sh
```

O `install.sh` detecta e resolve automaticamente:

- git, docker, plugin `docker compose` (oferece instalação via
  apt/dnf/pacman/zypper/apk se faltar — `-y` pula as perguntas)
- daemon docker ativo (tenta `systemctl start docker`; usa `sudo docker`
  se seu usuário não está no grupo docker)
- porta `8000` livre (mude com `WEBOS_PORT=8080 ./install.sh`)

Depois ele faz `docker compose up -d --build` e espera o desktop responder.

```
URL:    http://localhost:8000
Login:  webos / webos   (usuário Linux real criado no boot — troque a senha!)
```

## Desinstalação

```bash
./uninstall.sh            # para/remove container, pergunta sobre volumes
./uninstall.sh --all -y   # remove tudo sem perguntar
./uninstall.sh --keep-img # mantém a imagem docker
```

Nada é instalado no host além do container e da imagem — remover os dois
(+- o diretório clonado) desfaz a instalação por completo.

## O que o container roda

Um único container Ubuntu 24.04 com **systemd como PID 1** (`privileged`,
`tmpfs /run`) sobe as mesmas unidades de `deploy/`:

- `webos-bootstrap` — oneshot: gera `.env` do env do PID1, escreve
  `/etc/pam.d/webos`, cria grupo `webos` e usuário demo
- `webos-agent` — FastAPI em `127.0.0.1:8765`
- `webos-web` — servidor OS.js em `:8000`

```bash
docker exec linux-webos systemctl status webos-agent webos-web
```

## Apps incluídos

| App | O que faz | Via |
|---|---|---|
| Files | Navega o filesystem real (`host:/` = `/`) | VFS do OS.js |
| Terminal | Shell multi-abas — cada aba = 1 WS + 1 PTY com `setuid` para o usuário da sessão | agente `/ws/terminal` |
| Tasks | Lista processos, sinal TERM/KILL/INT (protege PID1/agente) | agente `/api/processes` |
| Services | Unidades systemd: start/stop/enable/status | `systemctl` |
| Disks | `fdisk -l`, mklabel/mkpart/mkfs, mount/umount, wipefs | `lsblk`+`parted` |
| Docker | Containers/imagens: start/stop/logs/pull | docker socket |
| App Store | Instala apps de servidor (índice CasaOS) | `docker compose` |
| Users | CRUD de usuários, senha, lock/unlock | `useradd`/`usermod` |
| Cron | Crontab visual: presets, toggle, por usuário | `crontab` |
| Logs | Journald com filtros (unit/prio/tempo/texto), live tail, export | `journalctl` |
| SysInfo | Gauges CPU/RAM/disco/rede, modelo, uptime, hostname | agente `/api/system` |
| Editor | Monaco para arquivos do host | agente `/api/files` |
| Settings | Temas, window style (Win11/macOS/KDE/GNOME), wallpapers | OS.js settings |

## Autenticação (PAM)

Com `WEBOS_AUTH=pam` o login valida contra `/etc/passwd` + `/etc/shadow`
do container via `pam_unix` (serviço `/etc/pam.d/webos`):

- **Users app** → cria/remove contas que logam de verdade.
- **Lock/Unlock** (`usermod -L/-U`) bloqueia/libera o login web.
- **`WEBOS_REQUIRED_GROUPS`** (default `webos`): só membros logam;
  `usermod -aG webos <user>` libera o acesso.
- **`WEBOS_DENY_USERS`**: denylist mesmo com senha correta.
- **Terminal** herda o usuário logado (`initgroups`/`setuid` no PTY).
- **`home:/`** aponta para `/home/<usuário>` real (`WEBOS_VFS_ROOT=/home`).

Sem `WEBOS_AUTH=pam` vale o modo dev: qualquer credencial entra
(null-adapter) e o terminal roda como root.

## Configuração (docker-compose.yml `environment:`)

| Var | Default | Efeito |
|---|---|---|
| `WEBOS_AUTH` | `pam` | `pam` = usuários Linux; outro = dev |
| `WEBOS_USER` / `WEBOS_PASSWORD` | `webos` / `webos` | usuário demo criado no boot |
| `WEBOS_REQUIRED_GROUPS` | `webos` | portão de grupo no login |
| `WEBOS_DENY_USERS` | — | usuários banidos |
| `WEBOS_VFS_ROOT` | `/home` | raiz do mount `home:` |
| `WEBOS_STORE_URL` | CasaOS-AppStore | índice da loja de apps |
| `WEBOS_TOKEN` | aleatório/boot | token agente (fixe para persistir) |

## Setup manual (desenvolvimento, sem docker)

```bash
echo "WEBOS_TOKEN=$(openssl rand -hex 32)" > .env

cd agent && python3 -m venv .venv \
  && ./.venv/bin/pip install -r requirements.txt \
  && ./.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8765

cd web && npm install \
  && npm run build && npm run package:discover \
  && npm run serve   # http://localhost:8000
```

## Deploy (produção)

1. Copie o repo para `/opt/webos` (ou ajuste os paths em `deploy/`).
2. `deploy/webos-agent.service` e `deploy/webos-web.service` são unidades
   systemd prontas — o agente precisa de root (useradd, chpasswd, udisksctl,
   socket do docker).
3. O agente só escuta em `127.0.0.1:8765`; chamadas do browser passam pelo
   proxy `/api/webos/*` que injeta `X-WebOS-Token` — o token nunca sai para
   o browser.

## Notas e limitações

- **Docker socket** montado no compose dá à loja/Docker app controle dos
  containers do **host** — remova o volume se não precisar.
- **File Manager/Editor** operam com privilégios do processo (root);
  `host:/` dá acesso total ao filesystem — ferramenta admin.
- **Disks**: operações destrutivas validam o device e recusam montados,
  mas não há undo.
- **App Store** baixa compose de um índice remoto — só rode fonte confiável.
- Node ≥ 20.6 (`process.loadEnvFile`). Build testado com Node 26.
- Webpack 4 usa md4; `scripts/build.js` faz alias para sha256.
- `scripts/patch-settings.js` injeta os itens de aparência/wallpapers no
  Settings minificado (rodado no build da imagem e idempotente).

## Estrutura

```
install.sh / uninstall.sh  # instalação auto-detectada / remoção
agent/app/main.py          # FastAPI: auth por token, routers
agent/app/routers/*.py     # auth, system, files, disks, users, docker,
                           # services, processes, store, logs, cron, terminal(WS)
web/src/server/webos.js    # proxy autenticado /api/webos/* + /ws/webos/terminal
web/src/server/auth-pam.js # adapter OS.js -> PAM (WEBOS_AUTH=pam)
web/src/client/config.js   # mountpoints, wallpaper default
web/src/client/dock.js     # dock, launcher, session menu, aparência
web/src/client/widgets.js  # widgets de sistema no desktop
web/src/packages/webos-*   # apps do desktop
web/src/packages/_shared/  # api.js + ui.js
web/scripts/build.js       # build unificado (md4->sha256, brand replace)
web/scripts/patch-settings.js # injeta seções no app Settings
docker/images/             # wallpapers em /home/images
docker/webos-bootstrap*    # bootstrap do container
deploy/*.service           # unidades systemd (produção E container)
```
