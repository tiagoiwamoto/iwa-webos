"""Google Drive backup via rclone.

OAuth flow (headless-friendly): we spawn `rclone authorize "drive"`, grab its
loopback auth URL, fetch the Google consent URL server-side and hand it to
the UI. After Google redirects the user to the (unreachable) loopback URL,
they paste that URL back — the agent replays it on localhost, rclone emits
the token and we persist it with `rclone config create`.

Sync jobs (local dir -> gdrive:remote) live in /opt/webos/.backup-jobs.json
and run through `rclone sync` on a background thread.
"""
import json
import os
import re
import shlex
import subprocess
import threading
import time
import uuid
from pathlib import Path
from urllib.parse import urlparse, parse_qs

import requests
from shutil import which
from fastapi import APIRouter, HTTPException

router = APIRouter()

RCLONE_CONFIG = '/opt/webos/rclone.conf'
JOBS_FILE = Path('/opt/webos/.backup-jobs.json')
REMOTE = 'gdrive'
AUTH_CB = 'http://127.0.0.1:53682'

_env = lambda: {**os.environ, 'RCLONE_CONFIG': RCLONE_CONFIG}

# auth sessions: sid -> {proc, lines:[], url}
_auth: dict = {}
# sync runner state
_sync = {'running': None, 'job': None, 'log': '', 'finished': None}


# ---------------------------------------------------------------- helpers
def _rclone(*args, timeout=60) -> dict:
    try:
        p = subprocess.run(['rclone'] + list(args), capture_output=True,
                           text=True, timeout=timeout, env=_env())
        return {'rc': p.returncode, 'out': p.stdout, 'err': p.stderr}
    except FileNotFoundError:
        raise HTTPException(500, 'rclone não instalado — instale o pacote rclone')
    except subprocess.TimeoutExpired:
        return {'rc': -1, 'out': '', 'err': f'timeout {timeout}s'}


def _connected() -> bool:
    return Path(RCLONE_CONFIG).exists() and REMOTE in _rclone('listremotes')['out']


def _jobs() -> list:
    if JOBS_FILE.exists():
        try:
            return json.loads(JOBS_FILE.read_text())
        except Exception:
            return []
    return []


def _save_jobs(jobs: list):
    JOBS_FILE.write_text(json.dumps(jobs, indent=2))
    JOBS_FILE.chmod(0o600)


# ------------------------------------------------------------------ status
@router.get('/backup/status')
def backup_status():
    r = _rclone('version', timeout=10)
    installed = r['rc'] == 0
    out = {'rclone': installed, 'connected': False, 'jobs': _jobs()}
    if not installed:
        return out
    out['version'] = r['out'].splitlines()[0] if r['out'] else ''
    if _connected():
        out['connected'] = True
        about = _rclone('about', f'{REMOTE}:', timeout=20)
        out['about'] = {k.strip(): v.strip()
                        for k, _, v in (l.partition(':')
                                        for l in about['out'].splitlines())
                        if k.strip() and v.strip()}
    if _sync['running']:
        out['running'] = _sync['job']
    elif _sync['finished']:
        out['last'] = _sync['finished']
    return out


@router.post('/backup/disconnect')
def backup_disconnect():
    if Path(RCLONE_CONFIG).exists():
        _rclone('config', 'delete', REMOTE)
    return {'ok': True, 'connected': _connected()}


# -------------------------------------------------------------------- auth
def _drain(proc, store):
    try:
        for line in proc.stdout:
            store.append(line)
            if len(store) > 200:
                break
    except Exception:
        pass


@router.post('/backup/auth/start')
def auth_start():
    if not which('rclone'):
        raise HTTPException(500, 'rclone não instalado')
    proc = subprocess.Popen(
        ['rclone', 'authorize', 'drive'], env=_env(),
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    sid = uuid.uuid4().hex[:12]
    store: list = []
    threading.Thread(target=_drain, args=(proc, store), daemon=True).start()
    _auth[sid] = {'proc': proc, 'lines': store, 'url': None}

    deadline = time.time() + 20
    while time.time() < deadline:
        for line in store:
            m = re.search(r'(http://127\.0\.0\.1:53682/auth\?state=\S+)', line)
            if m:
                _auth[sid]['url'] = m.group(1)
                # resolve o redirect local -> URL real do Google
                try:
                    r = requests.get(m.group(1), allow_redirects=False,
                                     timeout=10)
                    gurl = r.headers.get('Location', m.group(1))
                except Exception:
                    gurl = m.group(1)
                return {'sid': sid, 'url': m.group(1), 'google_url': gurl}
        if proc.poll() is not None:
            break
        time.sleep(0.3)
    proc.kill()
    raise HTTPException(504, 'rclone authorize não respondeu — '
                           + ''.join(store)[-400:])


@router.post('/backup/auth/finish')
def auth_finish(body: dict):
    sid = body.get('sid', '')
    url = (body.get('url') or '').strip()
    sess = _auth.get(sid)
    if not sess:
        raise HTTPException(404, 'sessão expirada — clique em Conectar de novo')
    if AUTH_CB not in url or 'code=' not in url:
        raise HTTPException(400, 'cole a URL completa da página de erro '
                            '(http://127.0.0.1:53682/?code=...)')
    # valida o state contra o que o rclone gerou
    want = parse_qs(urlparse(sess.get('url') or url).query).get('state', [''])[0]
    got = parse_qs(urlparse(url).query).get('state', [''])[0]
    if want and got and want != got:
        raise HTTPException(400, 'state não confere — refaça o fluxo')
    try:
        requests.get(url, timeout=15)   # dispara o callback no loopback
    except Exception:
        pass
    proc = sess['proc']
    try:
        proc.wait(timeout=30)
    except subprocess.TimeoutExpired:
        proc.kill()
        raise HTTPException(504, 'rclone não finalizou — tente de novo')
    text = ''.join(sess['lines'])
    m = re.search(r'--->\s*(\{.*?\})\s*<---', text, re.S)
    if not m:
        m = re.search(r'(\{"access_token".*?\})\s*\n', text)
    if not m:
        raise HTTPException(502, 'token não encontrado: ' + text[-400:])
    json.loads(m.group(1))   # valida
    Path(RCLONE_CONFIG).parent.mkdir(parents=True, exist_ok=True)
    r = _rclone('config', 'create', REMOTE, 'drive', 'scope', 'drive')
    if r['rc'] != 0:
        raise HTTPException(502, 'config create falhou: ' + r['err'][:300])
    r = _rclone('config', 'update', REMOTE, 'token', m.group(1))
    if r['rc'] != 0:
        raise HTTPException(502, 'config update falhou: ' + r['err'][:300])
    _auth.pop(sid, None)
    return {'ok': True, 'connected': _connected()}


@router.post('/backup/auth/cancel')
def auth_cancel(body: dict):
    sess = _auth.pop(body.get('sid', ''), None)
    if sess:
        sess['proc'].kill()
    return {'ok': True}


@router.post('/backup/auth/token')
def auth_token(body: dict):
    """Alternativa: cola um token JSON obtido com `rclone authorize` em outra
    máquina (método headless clássico)."""
    token = (body.get('token') or '').strip()
    try:
        json.loads(token)
    except Exception:
        raise HTTPException(400, 'JSON de token inválido')
    _rclone('config', 'create', REMOTE, 'drive', 'scope', 'drive')
    r = _rclone('config', 'update', REMOTE, 'token', token)
    if r['rc'] != 0:
        raise HTTPException(502, r['err'][:300])
    return {'ok': True, 'connected': _connected()}



# -------------------------------------------------------------------- jobs
@router.get('/backup/jobs')
def list_jobs():
    return {'jobs': _jobs()}


@router.post('/backup/jobs')
def add_job(body: dict):
    local = (body.get('local') or '').strip()
    remote = (body.get('remote') or '').strip().strip('/')
    if not local or not remote:
        raise HTTPException(400, 'local + remote required')
    if not os.path.isdir(local):
        raise HTTPException(404, f'local dir não existe: {local}')
    jobs = _jobs()
    jobs.append({'id': uuid.uuid4().hex[:8], 'local': local, 'remote': remote,
                 'enabled': True, 'last': None, 'status': None})
    _save_jobs(jobs)
    return {'ok': True}


@router.delete('/backup/jobs/{job_id}')
def del_job(job_id: str):
    _save_jobs([j for j in _jobs() if j['id'] != job_id])
    return {'ok': True}


@router.post('/backup/jobs/{job_id}/toggle')
def toggle_job(job_id: str):
    jobs = _jobs()
    for j in jobs:
        if j['id'] == job_id:
            j['enabled'] = not j.get('enabled', True)
    _save_jobs(jobs)
    return {'ok': True}


# -------------------------------------------------------------------- sync
def _run_sync(job: dict):
    global _sync
    src, dst = job['local'], f"{REMOTE}:{job['remote']}"
    cmd = ['rclone', 'sync', src, dst, '-v', '--stats', '2s',
           '--stats-one-line', '--create-empty-src-dirs']
    _sync = {'running': job['id'], 'job': job['local'],
             'log': f'$ {" ".join(shlex.quote(a) for a in cmd)}\n', 'finished': None}
    try:
        p = subprocess.run(cmd, capture_output=True, text=True,
                           timeout=3600, env=_env())
        ok = p.returncode == 0
        out = (p.stdout + p.stderr).strip()
        _sync['log'] += '\n'.join(out.splitlines()[-60:])
        jobs = _jobs()
        for j in jobs:
            if j['id'] == job['id']:
                j['last'] = time.strftime('%Y-%m-%d %H:%M')
                j['status'] = 'ok' if ok else f'error rc={p.returncode}'
        _save_jobs(jobs)
        _sync['finished'] = {'id': job['id'], 'ok': ok,
                             'when': time.strftime('%H:%M:%S')}
    except Exception as e:
        _sync['log'] += f'\nERROR: {e}'
        _sync['finished'] = {'id': job['id'], 'ok': False, 'err': str(e)}
    finally:
        _sync['running'] = None


@router.post('/backup/sync')
def start_sync(body: dict):
    if _sync['running']:
        raise HTTPException(409, 'já existe uma sincronização rodando')
    if not _connected():
        raise HTTPException(400, 'Google Drive não conectado')
    want = body.get('id')
    jobs = [j for j in _jobs() if j.get('enabled')
            and (not want or j['id'] == want)]
    if not jobs:
        raise HTTPException(404, 'nenhum job para sincronizar')
    job = jobs[0]
    threading.Thread(target=_run_sync, args=(job,), daemon=True).start()
    return {'ok': True, 'job': job['id']}


@router.get('/backup/sync/status')
def sync_status():
    return {'running': _sync['running'], 'job': _sync['job'],
            'log': _sync['log'][-8000:], 'finished': _sync['finished']}


# ------------------------------------------------------------ remote dirs
@router.get('/backup/remote/list')
def remote_list(path: str = ''):
    if not _connected():
        raise HTTPException(400, 'Google Drive não conectado')
    r = _rclone('lsf', f'{REMOTE}:{path}', '--dirs-only',
                '--max-depth', '1', timeout=30)
    if r['rc'] != 0:
        raise HTTPException(502, r['err'][:300])
    return {'dirs': [l.strip().rstrip('/')
                     for l in r['out'].splitlines() if l.strip()]}
