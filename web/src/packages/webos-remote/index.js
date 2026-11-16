import osjs from 'osjs';
import {name as applicationName} from './metadata.json';
import {api, formatBytes} from '../_shared/api.js';
import {el, css, button, table, statusbar, layout, confirmDialog} from '../_shared/ui.js';
import {useI18n, metaTitle} from '../_shared/i18n.js';

css('webos-remote', `
  .wr-form { margin: 8px; padding: 10px; background: #1d212b; display: none;
    border: 1px solid #333845; border-radius: 8px; }
  .wr-form.open { display: block; }
  .wr-form .row { display: flex; gap: 8px; margin-bottom: 8px; flex-wrap: wrap;
    align-items: center; }
  .wr-form input, .wr-form select { background: #14171f; border: 1px solid #333845;
    color: #dde4f0; border-radius: 5px; padding: 5px 8px; font-size: 12px; }
  .wr-form input.host { width: 160px; } .wr-form input.port { width: 60px; }
  .wr-form input.user { width: 110px; } .wr-form input.name { width: 120px; }
  .wr-form input.secret { width: 160px; } .wr-form input.dir { flex: 1; min-width: 120px; }
  .wr-tabs { display: flex; gap: 4px; padding: 4px 8px; background: #262a34;
    border-bottom: 1px solid #17191f; flex: 0 0 auto; }
  .wr-tab { padding: 4px 14px; border-radius: 6px 6px 0 0; cursor: pointer;
    color: #9ab; font-size: 12px; }
  .wr-tab.on { background: #20232a; color: #fff; border-bottom: 2px solid #6aa5ff; }
  .wr-path { flex: 1; background: #14171f; border: 1px solid #333845; color: #dde4f0;
    border-radius: 5px; padding: 5px 8px; font-size: 12px; font-family: monospace; }
  .wr-pre { margin: 8px; padding: 10px; background: #10131a; color: #cde;
    font-family: monospace; font-size: 11px; white-space: pre-wrap;
    border-radius: 6px; overflow: auto; flex: 1; }
  .wr-cmd { flex: 1; background: #14171f; border: 1px solid #333845; color: #dde4f0;
    border-radius: 5px; padding: 5px 8px; font-family: monospace; font-size: 12px; }
  .webos-table tr.sel td { background: #2d3a55 !important; }
  .webos-table tr.dir td { cursor: pointer; }
`);

const fmtEntry = e => {
  const icon = {dir: '\u{1F4C1}', file: '\u{1F4C4}', link: '\u{1F517}'}[e.type] || '\u{1F4C4}';
  return [icon + ' ' + e.name, e.type === 'file' ? formatBytes(e.size) : '',
          e.mtime || ''];
};

const register = (core, args, options, metadata) => {
  const proc = core.make('osjs/application', {args, options, metadata});
  const {t} = useI18n(core);
  const sb = statusbar();
  let conn = null;          // active connection (resolved dict or name)
  let cwd = '/';
  let entries = [];
  let sel = null;
  let conns = {};

  // ---------- connection form ----------
  const f = {
    name: el('input', {class: 'name', placeholder: t('remote.aliasPh')}),
    proto: el('select', {}, el('option', {value: 'ssh'}, 'SSH / SFTP / SCP'),
              el('option', {value: 'ftp'}, 'FTP')),
    host: el('input', {class: 'host', placeholder: 'host'}),
    port: el('input', {class: 'port', placeholder: '22'}),
    user: el('input', {class: 'user', placeholder: 'user'}),
    auth: el('select', {}, el('option', {value: 'password'}, 'password'),
             el('option', {value: 'key'}, 'ssh key')),
    secret: el('input', {class: 'secret', type: 'password',
                         placeholder: t('remote.secretPh')}),
    dir: el('input', {class: 'dir', placeholder: t('remote.dirPh')})
  };
  const form = el('div', {class: 'wr-form'},
    el('div', {class: 'row'}, f.name, f.proto, f.host, f.port),
    el('div', {class: 'row'}, f.user, f.auth, f.secret),
    el('div', {class: 'row'}, f.dir));

  const connSel = el('select', {});
  const loadConns = () => api.get('remote/connections').then(r => {
    conns = r.connections || {};
    connSel.textContent = '';
    connSel.appendChild(el('option', {value: ''}, t('remote.savedConn')));
    Object.keys(conns).forEach(n =>
      connSel.appendChild(el('option', {value: n}, `${n} (${conns[n].proto}://${conns[n].host})`)));
  }).catch(e => sb.error(e.message));

  const fillForm = c => {
    f.proto.value = c.proto || 'ssh'; f.host.value = c.host || '';
    f.port.value = c.port || ''; f.user.value = c.user || '';
    f.auth.value = c.auth || 'password'; f.secret.value = '';
    f.dir.value = c.dir || '';
  };
  const formConn = () => ({
    proto: f.proto.value, host: f.host.value.trim(),
    port: f.port.value || (f.proto.value === 'ftp' ? 21 : 22),
    user: f.user.value.trim(), auth: f.auth.value,
    secret: f.secret.value, dir: f.dir.value.trim() || '/'
  });

  // ---------- file browser ----------
  const pathIn = el('input', {class: 'wr-path', value: '/'});
  const body = el('div', {class: 'webos-body'});
  const join = (a, b) => (a.endsWith('/') ? a : a + '/') + b;
  const parent = p => p === '/' ? '/' : p.replace(/\/[^/]+\/?$/, '') || '/';

  const render = () => {
    const rows = entries.map((e, i) => {
      const tr = table(['name', 'size', 'modified'], [fmtEntry(e)]);
      const row = tr.querySelector('tbody tr');
      row.classList.add(e.type);
      row.addEventListener('click', () => {
        sel = i;
        body.querySelectorAll('tr').forEach(r => r.classList.remove('sel'));
        row.classList.add('sel');
      });
      row.addEventListener('dblclick', () => {
        if (e.type === 'dir') {
          refresh(join(cwd, e.name));
        } else {
          sb.set(t('remote.downloading', {name: e.name}));
          api.post('remote/download', {conn, remote: join(cwd, e.name),
            local: '/tmp/' + e.name})
            .then(r => sb.set(t('remote.savedTo', {path: r.to})))
            .catch(err => sb.error(err.message));
        }
      });
      return tr.querySelector('tbody');
    });
    const tbl = el('table', {class: 'webos-table'},
      el('thead', {}, el('tr', {},
        el('th', {}, t('name')), el('th', {}, t('size')), el('th', {}, t('modified')))),
      el('tbody', {}, ...rows.map(tb => tb.children[0])));
    body.textContent = '';
    body.appendChild(entries.length ? tbl : el('div',
      {style: {padding: '20px', color: '#9ab'}},
      conn ? t('remote.emptyDir') : t('remote.connectFirst')));
  };

  const refresh = (path) => {
    if (!conn) { sb.error(t('remote.connectFirst')); return; }
    cwd = path || cwd;
    pathIn.value = cwd;
    sb.set(t('remote.listing', {dir: cwd}));
    api.post('remote/list', {conn, path: cwd}).then(r => {
      entries = r.entries; sel = null; render();
      sb.set(t('remote.itemsIn', {n: entries.length, dir: cwd}));
    }).catch(e => sb.error(e.message));
  };

  const selected = () => sel === null ? null : entries[sel];

  const prompt = (label, def = '') => {
    const v = window.prompt(label, def);
    return v === null ? null : v;
  };

  const filesBar = el('div', {class: 'webos-toolbar'},
    button('⬆', () => refresh(parent(cwd)), t('files.up')),
    pathIn,
    button(t('go'), () => refresh(pathIn.value)),
    button(t('remote.newDir'), () => {
      const n = prompt(t('remote.newDirMsg'));
      if (!n) { return; }
      api.post('remote/mkdir', {conn, path: join(cwd, n)})
        .then(() => refresh()).catch(e => sb.error(e.message));
    }),
    button('Upload', () => {
      const l = prompt(t('remote.localPathMsg'));
      if (!l) { return; }
      sb.set(t('remote.sending'));
      api.post('remote/upload', {conn, local: l, remote: cwd})
        .then(() => { sb.set(t('remote.uploadOk')); refresh(); })
        .catch(e => sb.error(e.message));
    }),
    button('Download', () => {
      const e = selected();
      if (!e) { sb.error(t('files.selItem')); return; }
      const l = prompt(t('remote.destLocal'), '/tmp/' + e.name);
      if (!l) { return; }
      sb.set(t('remote.downloading', {name: e.name}));
      api.post('remote/download', {conn, remote: join(cwd, e.name), local: l})
        .then(() => sb.set(t('remote.savedTo', {path: l})))
        .catch(err => sb.error(err.message));
    }),
    button('Rename', () => {
      const e = selected();
      if (!e) { sb.error(t('files.selItem')); return; }
      const n = prompt(t('remote.newNameMsg'), e.name);
      if (!n) { return; }
      api.post('remote/rename', {conn, path: join(cwd, e.name), new: n})
        .then(() => refresh()).catch(err => sb.error(err.message));
    }),
    button('Delete', () => {
      const e = selected();
      if (!e) { sb.error(t('files.selItem')); return; }
      confirmDialog(core, t('remote.deleteTitle'),
        t('remote.deleteMsg', {path: join(cwd, e.name)})).then(ok => {
        if (!ok) { return; }
        api.post('remote/delete', {conn, path: join(cwd, e.name), type: e.type})
          .then(() => refresh()).catch(err => sb.error(err.message));
      });
    }),
    button('⟳', () => refresh(), t('refresh')));

  // ---------- command tab ----------
  const cmdOut = el('pre', {class: 'wr-pre'}, '');
  const cmdIn = el('input', {class: 'wr-cmd',
    placeholder: t('remote.cmdPh')});
  const runCmd = () => {
    if (!conn || !cmdIn.value.trim()) { return; }
    sb.set(t('remote.running'));
    api.post('remote/exec', {conn, cmd: cmdIn.value}).then(r => {
      cmdOut.textContent = `$ ${cmdIn.value}\n${r.out}${r.err ? '\n' + r.err : ''}` +
        `\n[exit ${r.rc}]`;
      sb.set(`exit ${r.rc}`);
    }).catch(e => sb.error(e.message));
  };
  cmdIn.addEventListener('keydown', e => e.key === 'Enter' && runCmd());
  const cmdTab = el('div', {class: 'webos-root'},
    el('div', {class: 'webos-toolbar'}, cmdIn, button('Run', runCmd)), cmdOut);

  // ---------- git tab ----------
  const gConnSel = el('select', {},
    el('option', {value: ''}, t('remote.gitNoCred')));
  const gUrl = el('input', {class: 'wr-cmd',
    placeholder: t('remote.repoUrlPh')});
  const gPath = el('input', {class: 'wr-cmd', placeholder: t('remote.localDirPh')});
  const gOut = el('pre', {class: 'wr-pre'}, '');
  const git = (action, extra = {}) => {
    sb.set(`git ${action}…`);
    api.post('remote/git', {conn: gConnSel.value || undefined,
      url: gUrl.value, path: gPath.value, action, ...extra}).then(r => {
      gOut.textContent = r.heads ? `branches:\n${r.heads.join('\n')}`
        : (r.out || '') + (r.err ? '\n' + r.err : '');
      sb.set(`git ${action} ok`);
    }).catch(e => { sb.error(e.message); gOut.textContent = e.message; });
  };
  const gitTab = el('div', {class: 'webos-root'},
    el('div', {class: 'webos-toolbar'}, gConnSel, gUrl),
    el('div', {class: 'webos-toolbar'}, gPath,
      button('Test', () => git('test')), button('Clone', () => git('clone')),
      button('Pull', () => git('pull')), button('Push', () => git('push')),
      button('Status', () => git('status')), button('Log', () => git('log'))),
    gOut);

  // ---------- tabs ----------
  const tabs = {};
  const tabBar = el('div', {class: 'wr-tabs'});
  const tabBody = el('div', {class: 'webos-body'});
  const show = name => {
    Object.entries(tabs).forEach(([n, t]) => {
      t.btn.classList.toggle('on', n === name);
      t.node.style.display = n === name ? '' : 'none';
    });
  };
  [['Files', el('div', {class: 'webos-root'}, filesBar, body)],
   ['Command', cmdTab], ['Git', gitTab]].forEach(([n, node]) => {
    const btn = el('div', {class: 'wr-tab', onclick: () => show(n)}, n);
    tabBar.appendChild(btn);
    tabBody.appendChild(node);
    tabs[n] = {btn, node};
    node.style.display = 'none';
  });

  // ---------- connection bar ----------
  const setConn = name => {
    conn = name || {
      proto: f.proto.value, host: f.host.value.trim(),
      port: f.port.value || 22, user: f.user.value.trim(),
      auth: f.auth.value, secret: f.secret.value
    };
    const saved = typeof conn === 'string' ? conns[conn] : null;
    const startDir = ((saved || conn).dir) || '/';
    sb.set(t('remote.connectedTo',
      {name: typeof conn === 'string' ? conn : conn.host}));
    gConnSel.textContent = '';
    gConnSel.appendChild(el('option', {value: ''},
      t('remote.gitNoCred')));
    Object.keys(conns).forEach(n => gConnSel.appendChild(
      el('option', {value: n}, n)));
    refresh(startDir);
  };

  const connBar = el('div', {class: 'webos-toolbar'},
    connSel,
    button('Connect', () => setConn(connSel.value || null)),
    button('New', () => {
      f.name.value = ''; fillForm({}); form.classList.add('open');
    }),
    button('Edit', () => {
      const n = connSel.value;
      if (!n) { sb.error(t('remote.selConn')); return; }
      f.name.value = n; fillForm(conns[n]); form.classList.add('open');
    }),
    button('Save', () => {
      const c = formConn();
      if (!f.name.value.trim() || !c.host) {
        sb.error(t('remote.fillAliasHost')); return;
      }
      api.post('remote/connections', {name: f.name.value.trim(), ...c})
        .then(() => { form.classList.remove('open'); loadConns();
          sb.set(t('remote.connSaved', {name: f.name.value})); })
        .catch(e => sb.error(e.message));
    }),
    button('Del', () => {
      const n = connSel.value;
      if (!n) { sb.error(t('remote.selConn')); return; }
      confirmDialog(core, t('remote.deleteTitle'), t('remote.delConnMsg', {name: n})).then(ok => {
        if (ok) {
          api.del(`remote/connections/${encodeURIComponent(n)}`)
            .then(loadConns).catch(e => sb.error(e.message));
        }
      });
    }));

  proc.createWindow({
    id: 'WebOSRemoteWindow',
    title: metaTitle(core, metadata),
    dimension: {width: 780, height: 520}
  })
    .on('destroy', () => proc.destroy())
    .render($content => {
      $content.appendChild(layout(
        el('div', {class: 'webos-toolbar'}, ...connBar.children),
        el('div', {style: {display: 'flex', flexDirection: 'column', height: '100%'}},
          form, tabBar, tabBody), sb));
      loadConns();
      show('Files');
    });

  return proc;
};

osjs.register(applicationName, register);
