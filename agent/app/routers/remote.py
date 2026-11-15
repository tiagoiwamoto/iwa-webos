"""Remote access: SSH/SFTP/SCP via OpenSSH, FTP via curl, Git via git+ssh/https.

Saved connections live in /opt/webos/.remote-connections.json (chmod 600 —
may hold passwords or key paths). Unsaved ad-hoc connections can be passed
inline in every request.
"""
import json
import os
import re
import shlex
import subprocess
from pathlib import Path

from fastapi import APIRouter, HTTPException

router = APIRouter()

CONN_FILE = Path('/opt/webos/.remote-connections.json')
KNOWN_HOSTS = '/opt/webos/.remote-known-hosts'
MAX_OUT = 128 * 1024


# ---------------------------------------------------------------- helpers
def _load() -> dict:
    if CONN_FILE.exists():
        try:
            return json.loads(CONN_FILE.read_text())
        except Exception:
            return {}
    return {}


def _save(conns: dict):
    CONN_FILE.write_text(json.dumps(conns, indent=2))
    CONN_FILE.chmod(0o600)


def _conn(body: dict) -> dict:
    """Resolve `conn` field: saved name or inline dict."""
    c = body.get('conn')
    if isinstance(c, str):
        saved = _load().get(c)
        if not saved:
            raise HTTPException(404, f'connection not found: {c}')
        return saved
    if not isinstance(c, dict) or not c.get('host'):
        raise HTTPException(400, 'conn: saved name or {proto,host,user,...} required')
    return c


def _run(cmd: list, env=None, timeout=60) -> dict:
    e = dict(os.environ)
    if env:
        e.update(env)
    try:
        p = subprocess.run(cmd, capture_output=True, text=True,
                           timeout=timeout, env=e)
        return {'rc': p.returncode, 'out': p.stdout[-MAX_OUT:],
                'err': p.stderr[-MAX_OUT:]}
    except subprocess.TimeoutExpired:
        return {'rc': -1, 'out': '', 'err': f'timeout after {timeout}s'}
    except FileNotFoundError:
        return {'rc': -1, 'out': '', 'err': f'not found: {cmd[0]} — instale openssh-client/sshpass/git/curl'}


def _check(r: dict, what='remote operation'):
    if r['rc'] != 0:
        raise HTTPException(502, f'{what} failed: {r["err"] or r["out"]}'[:500])
    return r


def _ssh_args(c: dict) -> tuple:
    """(prefix, target_suffix) for ssh/scp commands."""
    opts = ['-o', 'StrictHostKeyChecking=accept-new',
            '-o', f'UserKnownHostsFile={KNOWN_HOSTS}',
            '-o', 'ConnectTimeout=10']
    env, prefix = {}, []
    auth = c.get('auth', 'password')
    if auth == 'key':
        key = c.get('secret', '') or c.get('key', '')
        if not key:
            raise HTTPException(400, 'auth=key requires secret=key path')
        opts += ['-i', key, '-o', 'BatchMode=yes']
    else:
        prefix = ['sshpass', '-e']
        env['SSHPASS'] = c.get('secret', '')
        opts += ['-o', 'PreferredAuthentications=password',
                 '-o', 'PubkeyAuthentication=no']
    return prefix, opts, env


def _ftp_url(c: dict, path='/') -> str:
    user = c.get('user', 'anonymous')
    pw = c.get('secret', '')
    host, port = c['host'], int(c.get('port') or 21)
    auth = f'{user}:{pw}@' if pw else f'{user}@'
    if not path.startswith('/'):
        path = '/' + path
    return f'ftp://{auth}{host}:{port}{path}'


def _is_ftp(c: dict) -> bool:
    return c.get('proto', 'ssh') == 'ftp'


def _curl(args: list, c: dict, timeout=60) -> dict:
    return _run(['curl', '-sS', '--connect-timeout', '10'] + args,
                timeout=timeout)


# ------------------------------------------------------- connections CRUD
@router.get('/remote/connections')
def list_connections():
    out = {}
    for name, c in _load().items():
        out[name] = {k: ('***' if k == 'secret' and v else v)
                     for k, v in c.items()}
    return {'connections': out}


@router.post('/remote/connections')
def save_connection(body: dict):
    name = (body.get('name') or '').strip()
    if not name:
        raise HTTPException(400, 'name required')
    conns = _load()
    if not body.get('secret') and name in conns:
        body['secret'] = conns[name].get('secret', '')
    conns[name] = {k: body.get(k) for k in
                   ('proto', 'host', 'port', 'user', 'auth', 'secret', 'dir')}
    _save(conns)
    return {'ok': True}


@router.delete('/remote/connections/{name}')
def delete_connection(name: str):
    conns = _load()
    conns.pop(name, None)
    _save(conns)
    return {'ok': True}


# --------------------------------------------------------------- listing
_LS_RE = re.compile(
    r'^(?P<mode>[bcdlpsS-][rwxStTs-]{9})\S*\s+\d+\s+\S+\s+\S+\s+'
    r'(?P<size>\d+)\s+(?P<date>\d{4}-\d{2}-\d{2})\s+(?P<time>\d{2}:\d{2})\s+'
    r'(?P<name>.+)$')


def _list_ssh(c: dict, path: str) -> list:
    prefix, opts, env = _ssh_args(c)
    cmd = (prefix + ['ssh'] + opts + ['-p', str(int(c.get('port') or 22)),
           f"{c.get('user', 'root')}@{c['host']}",
           'ls -la --time-style=long-iso -- ' + shlex.quote(path)])
    r = _check(_run(cmd, env=env, timeout=30), 'ssh list')
    entries = []
    for line in r['out'].splitlines():
        m = _LS_RE.match(line)
        if not m or m['name'] in ('.', '..'):
            continue
        t = {'d': 'dir', 'l': 'link'}.get(m['mode'][0], 'file')
        entries.append({'name': m['name'], 'type': t,
                        'size': int(m['size']),
                        'mtime': f"{m['date']} {m['time']}",
                        'target': m['name'].split(' -> ')[-1] if ' -> ' in m['name'] else ''})
        if ' -> ' in m['name']:
            entries[-1]['name'] = m['name'].split(' -> ')[0]
    return entries


def _list_ftp(c: dict, path: str) -> list:
    r = _check(_curl([_ftp_url(c, path + '/')], c, timeout=30), 'ftp list')
    names = [n for n in r['out'].splitlines() if n and n not in ('.', '..')]
    entries = []
    for name in names[:300]:
        # probe type: CWD succeeds only on directories
        probe = _curl(['-o', '/dev/null', '--quote', f'CWD {path}/{name}',
                       _ftp_url(c)], c, timeout=15)
        entries.append({'name': name,
                        'type': 'dir' if probe['rc'] == 0 else 'file',
                        'size': 0, 'mtime': ''})
    return entries


@router.post('/remote/list')
def remote_list(body: dict):
    c, path = _conn(body), body.get('path') or '/'
    fn = _list_ftp if _is_ftp(c) else _list_ssh
    try:
        return {'entries': fn(c, path)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))


# -------------------------------------------------------------- operations
def _ssh_exec(c: dict, remote_cmd: str, timeout=60):
    prefix, opts, env = _ssh_args(c)
    return _run(prefix + ['ssh'] + opts + ['-p', str(int(c.get('port') or 22)),
                f"{c.get('user', 'root')}@{c['host']}", '--', remote_cmd],
                env=env, timeout=timeout)


def _ftp_op(c: dict, *quotes: str):
    args = []
    for q in quotes:
        args += ['--quote', q]
    return _curl(args + ['-o', '/dev/null', _ftp_url(c)], c)


@router.post('/remote/mkdir')
def remote_mkdir(body: dict):
    c, path = _conn(body), body.get('path', '')
    if not path:
        raise HTTPException(400, 'path required')
    if _is_ftp(c):
        r = _ftp_op(c, f'MKD {path}')
    else:
        r = _ssh_exec(c, 'mkdir -p -- ' + shlex.quote(path))
    _check(r, 'mkdir')
    return {'ok': True}


@router.post('/remote/delete')
def remote_delete(body: dict):
    c, path = _conn(body), body.get('path', '')
    if not path or path in ('/', '*'):
        raise HTTPException(400, 'invalid path')
    if _is_ftp(c):
        what = 'RMD' if body.get('type') == 'dir' else 'DELE'
        r = _ftp_op(c, f'{what} {path}')
    else:
        r = _ssh_exec(c, 'rm -rf -- ' + shlex.quote(path))
    _check(r, 'delete')
    return {'ok': True}


@router.post('/remote/rename')
def remote_rename(body: dict):
    c = _conn(body)
    path, new = body.get('path', ''), body.get('new', '')
    if not path or not new or '/' in new:
        raise HTTPException(400, 'path + new name required')
    if _is_ftp(c):
        r = _ftp_op(c, f'RNFR {path}', f'RNTO {new}')
    else:
        parent = path.rsplit('/', 1)[0] or '/'
        r = _ssh_exec(c, f'mv -- {shlex.quote(path)} '
                         f'{shlex.quote(parent + "/" + new)}')
    _check(r, 'rename')
    return {'ok': True}


@router.post('/remote/download')
def remote_download(body: dict):
    c = _conn(body)
    remote, local = body.get('remote', ''), body.get('local', '')
    if not remote or not local:
        raise HTTPException(400, 'remote + local required')
    if _is_ftp(c):
        r = _curl(['-o', local, _ftp_url(c, remote)], c, timeout=300)
    else:
        prefix, opts, env = _ssh_args(c)
        r = _run(prefix + ['scp', '-r'] + opts + ['-P', str(int(c.get('port') or 22)),
                 f"{c.get('user', 'root')}@{c['host']}:{remote}", local],
                 env=env, timeout=300)
    _check(r, 'download')
    return {'ok': True, 'to': local}


@router.post('/remote/upload')
def remote_upload(body: dict):
    c = _conn(body)
    local, remote = body.get('local', ''), body.get('remote', '')
    if not local or not remote:
        raise HTTPException(400, 'local + remote required')
    if not os.path.exists(local):
        raise HTTPException(404, f'local path not found: {local}')
    if _is_ftp(c):
        if os.path.isdir(local):
            raise HTTPException(400, 'FTP upload de diretório não suportado — use SSH/SFTP')
        dest = remote if remote.endswith('/') else remote + '/'
        r = _curl(['-T', local, '--ftp-create-dirs', _ftp_url(c, dest)],
                  c, timeout=300)
    else:
        prefix, opts, env = _ssh_args(c)
        r = _run(prefix + ['scp', '-r'] + opts + ['-P', str(int(c.get('port') or 22)),
                 local, f"{c.get('user', 'root')}@{c['host']}:{remote}"],
                 env=env, timeout=300)
    _check(r, 'upload')
    return {'ok': True}


@router.post('/remote/exec')
def remote_exec(body: dict):
    c = _conn(body)
    cmd = body.get('cmd', '')
    if not cmd:
        raise HTTPException(400, 'cmd required')
    if _is_ftp(c):
        raise HTTPException(400, 'exec só funciona em conexões SSH')
    r = _ssh_exec(c, cmd, timeout=int(body.get('timeout') or 60))
    return r


# -------------------------------------------------------------------- git
def _git_env(body: dict) -> dict:
    """GIT_SSH_COMMAND / https credentials from an optional saved conn."""
    env, c = {}, body.get('conn')
    if not c:
        return env
    c = _conn({'conn': c})
    prefix, opts, env = _ssh_args(c)
    if env.get('SSHPASS') is not None:
        env['GIT_SSH_COMMAND'] = 'sshpass -e ssh ' + ' '.join(opts)
    else:
        env['GIT_SSH_COMMAND'] = 'ssh ' + ' '.join(opts)
    return env


def _git_url(body: dict) -> str:
    url = (body.get('url') or '').strip()
    if not url:
        raise HTTPException(400, 'url required')
    if body.get('conn') and url.startswith('https://'):
        c = _conn({'conn': body['conn']})
        if c.get('user'):
            cred = f"{c['user']}:{c.get('secret','')}@"
            url = 'https://' + cred + url[len('https://'):]
    return url


def _mask(s: str) -> str:
    return re.sub(r'https://[^@]+@', 'https://***@', s)


@router.post('/remote/git')
def remote_git(body: dict):
    action = body.get('action', '')
    path, env = body.get('path', ''), _git_env(body)
    timeout = int(body.get('timeout') or 300)

    if action == 'test':
        r = _run(['git', 'ls-remote', '--heads', _git_url(body)],
                 env=env, timeout=60)
        if r['rc'] != 0:
            r['err'] = _mask(r['err'])
            raise HTTPException(502, 'git ls-remote failed: ' + r['err'][:400])
        heads = [l.split('\t')[-1] for l in r['out'].splitlines()]
        return {'ok': True, 'heads': heads[:50]}

    if action == 'clone':
        url, dest = _git_url(body), path or '/opt/webos-repo'
        r = _run(['git', 'clone', '--progress', url, dest],
                 env=env, timeout=timeout)
        r['err'] = _mask(r['err'])
        _check(r, 'git clone')
        return {'ok': True, 'out': r['err'][-4000:]}

    if action in ('pull', 'push', 'status', 'log', 'fetch'):
        if not path or not os.path.isdir(path):
            raise HTTPException(400, 'path: local repo required')
        if not os.path.isdir(os.path.join(path, '.git')):
            raise HTTPException(400, f'{path} não é um repositório git')
        cmd = {'pull': ['git', '-C', path, 'pull', '--ff-only'],
               'push': ['git', '-C', path, 'push'],
               'fetch': ['git', '-C', path, 'fetch', '--all', '--prune'],
               'status': ['git', '-C', path, 'status', '-sb'],
               'log': ['git', '-C', path, 'log', '--oneline', '--graph',
                       '--decorate', '-20']}[action]
        r = _run(cmd, env=env, timeout=timeout)
        r['err'] = _mask(r['err'])
        return r

    raise HTTPException(400, f'unknown action: {action}')
