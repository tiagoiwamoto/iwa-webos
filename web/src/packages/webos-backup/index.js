import osjs from 'osjs';
import {name as applicationName} from './metadata.json';
import {api} from '../_shared/api.js';
import {el, css, button, table, statusbar, layout, confirmDialog} from '../_shared/ui.js';
import {useI18n, metaTitle} from '../_shared/i18n.js';

css('webos-backup', `
  .wb-card { margin: 8px; padding: 12px; background: #1d212b;
    border: 1px solid #2a2f3c; border-radius: 8px; }
  .wb-card h3 { margin: 0 0 8px; font-size: 13px; color: #8fb7e8; }
  .wb-card .muted { color: #9ab; font-size: 12px; }
  .wb-auth { display: none; }
  .wb-auth.open { display: block; }
  .wb-auth input, .wb-jobs input { background: #14171f; border: 1px solid #333845;
    color: #dde4f0; border-radius: 5px; padding: 5px 8px; font-size: 12px;
    margin: 4px 4px 4px 0; }
  .wb-auth input { width: 90%; font-family: monospace; }
  .wb-auth a { color: #7db4ff; }
  .wb-auth .step { margin: 8px 0; font-size: 12px; color: #cfd6e4; }
  .wb-jobs input.local { width: 260px; font-family: monospace; }
  .wb-jobs input.remote { width: 200px; font-family: monospace; }
  .wb-log { margin: 8px; padding: 10px; background: #10131a; color: #cde;
    font-family: monospace; font-size: 11px; white-space: pre-wrap;
    border-radius: 6px; max-height: 160px; overflow: auto; }
  .wb-ok { color: #7ddc8f; } .wb-bad { color: #f66; }
  .wb-pick { display: flex; flex-direction: column; height: 100%;
    background: #20232a; color: #dde4f0; font-size: 13px; }
  .wb-pick-path { display: flex; gap: 6px; padding: 8px;
    border-bottom: 1px solid #2a2f3c; }
  .wb-pick-path input { flex: 1; background: #14171f; border: 1px solid #333845;
    color: #dde4f0; border-radius: 5px; padding: 5px 8px; font-size: 12px;
    font-family: monospace; }
  .wb-pick-list { flex: 1; overflow: auto; padding: 4px 8px; }
  .wb-pick-dir { display: flex; align-items: center; gap: 8px;
    padding: 6px 8px; border-radius: 6px; cursor: pointer;
    font-size: 13px; color: #dde4f0; }
  .wb-pick-dir:hover { background: rgba(127, 212, 255, .1); }
  .wb-pick-dir .ic { width: 16px; text-align: center; }
  .wb-pick-foot { display: flex; gap: 6px; justify-content: flex-end;
    padding: 8px; border-top: 1px solid #2a2f3c; }
  .wb-pick-empty { color: #66708a; font-size: 12px; padding: 14px 8px; }
`);

const register = (core, args, options, metadata) => {
  const proc = core.make('osjs/application', {args, options, metadata});
  const {t} = useI18n(core);
  const sb = statusbar();
  let polling = null;

  // ---------- status card ----------
  const statusCard = el('div', {class: 'wb-card'});
  const authBox = el('div', {class: 'wb-card wb-auth'});
  const jobsCard = el('div', {class: 'wb-card wb-jobs'});
  const logBox = el('div', {class: 'wb-log', style: {display: 'none'}});

  const setRunning = on => {
    logBox.style.display = on ? '' : 'none';
    if (on && !polling) {
      polling = setInterval(() => {
        api.get('backup/sync/status').then(r => {
          logBox.textContent = r.log || '';
          logBox.scrollTop = logBox.scrollHeight;
          if (!r.running) {
            clearInterval(polling); polling = null;
            sb.set(t(r.finished && r.finished.ok
              ? 'backup.syncDone' : 'backup.syncFinished'));
            refresh();
          }
        }).catch(() => {});
      }, 2000);
    }
  };

  const refresh = () => api.get('backup/status').then(r => {
    statusCard.textContent = '';
    statusCard.appendChild(el('h3', {}, 'Google Drive'));
    if (!r.rclone) {
      statusCard.appendChild(el('div', {class: 'muted wb-bad'},
        t('backup.rcloneMissing')));
      return;
    }
    if (r.connected) {
      const about = r.about && r.about.Used
        ? t('backup.usedOf', {used: r.about.Used, total: r.about.Total || '?'})
        : '';
      statusCard.appendChild(el('div', {class: 'wb-ok'},
        `● ${t('backup.connected')}${about}`));
      statusCard.appendChild(button(t('backup.disconnectTitle'), () => {
        confirmDialog(core, t('backup.disconnectTitle'), t('backup.disconnectMsg'))
          .then(ok => ok && api.post('backup/disconnect').then(refresh)
            .catch(e => sb.error(e.message)));
      }));
    } else {
      statusCard.appendChild(el('div', {class: 'muted'},
        t('backup.notConnected')));
      statusCard.appendChild(button(t('backup.connectDrive'), startAuth));
      statusCard.appendChild(button(t('backup.manualToken'),
        () => tokenBox.classList.toggle('open')));
    }
    if (r.running) { setRunning(true); }
  }).catch(e => sb.error(e.message));

  // ---------- auth flow ----------
  const urlIn = el('input', {placeholder:
    'http://127.0.0.1:53682/?state=...&code=...'});
  const tokIn = el('input', {placeholder: '{"access_token": ...}'});
  const tokenBox = el('div', {class: 'wb-auth'});
  let authSid = null;

  const startAuth = () => {
    sb.set(t('backup.startingOAuth'));
    api.post('backup/auth/start').then(r => {
      authSid = r.sid;
      authBox.classList.add('open');
      authBox.textContent = '';
      authBox.appendChild(el('div', {class: 'step'},
        t('backup.step1'),
        el('div', {}, el('a', {href: r.google_url, target: '_blank'},
          r.google_url.slice(0, 90) + '…'))));
      authBox.appendChild(el('div', {class: 'step'},
        t('backup.step2')));
      authBox.appendChild(urlIn);
      authBox.appendChild(el('div', {},
        button(t('backup.finish'), () => {
          api.post('backup/auth/finish', {sid: authSid, url: urlIn.value})
            .then(() => { authBox.classList.remove('open');
              sb.set(t('backup.connectedMsg')); refresh(); })
            .catch(e => sb.error(e.message));
        }),
        button(t('cancel'), () => {
          api.post('backup/auth/cancel', {sid: authSid});
          authBox.classList.remove('open');
        })));
      window.open(r.google_url, '_blank');
    }).catch(e => sb.error(e.message));
  };

  tokenBox.appendChild(el('div', {class: 'step'},
    t('backup.manualStep')));
  tokenBox.appendChild(tokIn);
  tokenBox.appendChild(button(t('backup.saveToken'), () => {
    api.post('backup/auth/token', {token: tokIn.value})
      .then(() => { tokenBox.classList.remove('open'); refresh(); })
      .catch(e => sb.error(e.message));
  }));

  // ---------- dir picker (local host dirs ou pastas do Drive) ----------
  const dirPicker = (title, listDirs, cb, remote) => {
    let cur = remote ? '' : '/';
    const listBox = el('div', {class: 'wb-pick-list'});
    const pathIn = el('input', {value: cur});
    const win = proc.createWindow({
      title, dimension: {width: 420, height: 360},
      attributes: {resizable: false, maximizable: false, minimizable: false}
    });
    const go = p => {
      cur = p; pathIn.value = p; listBox.textContent = '';
      listDirs(p).then(dirs => {
        listBox.textContent = '';
        if (!dirs.length) {
          listBox.appendChild(el('div', {class: 'wb-pick-empty'},
            t('backup.noSubdirs')));
        }
        dirs.forEach(d => listBox.appendChild(
          el('div', {class: 'wb-pick-dir',
            onclick: () => go(cur === '/' || cur === ''
              ? cur + d : cur + '/' + d)},
            el('span', {class: 'ic'}, '📁'), d)));
      }).catch(e => {
        listBox.textContent = '';
        listBox.appendChild(el('div', {class: 'wb-pick-empty'},
          t('backup.errPrefix') + e.message));
      });
    };
    win.render($c => {
      $c.appendChild(el('div', {class: 'wb-pick'},
        el('div', {class: 'wb-pick-path'},
          button('⬆', () => {
            if (cur === '/' || cur === '') {
              return;
            }
            go(cur.slice(0, cur.lastIndexOf('/')) || (remote ? '' : '/'));
          }),
          pathIn,
          button(t('go'), () => go(pathIn.value.trim()))),
        listBox,
        el('div', {class: 'wb-pick-foot'},
          button(t('cancel'), () => win.destroy()),
          button(t('backup.selThis'), () => { cb(cur); win.destroy(); }))));
      go(cur);
    });
  };

  const localDirs = p => fetch('/vfs/readdir?path=' +
      encodeURIComponent('host:' + p), {credentials: 'same-origin'})
    .then(r => r.json())
    .then(l => l.filter(f => f.isDirectory).map(f => f.filename).sort());

  const remoteDirs = p => api.get('backup/remote/list', {path: p || ''})
    .then(r => r.dirs);

  // ---------- jobs ----------
  const localIn = el('input', {class: 'local', placeholder: t('backup.localPh')});
  const remoteIn = el('input', {class: 'remote', placeholder: t('backup.remotePh')});
  const jobsBody = el('div', {});

  const renderJobs = jobs => {
    jobsBody.textContent = '';
    if (!jobs.length) {
      jobsBody.appendChild(el('div', {class: 'muted'},
        t('backup.noJobs')));
      return;
    }
    jobsBody.appendChild(table(
      [t('backup.hLocal'), t('backup.hRemote'), t('backup.hStatus'), t('backup.hLast'), ''],
      jobs.map(j => [
        j.local, j.remote,
        j.enabled ? (j.status || t('backup.pending')) : t('backup.disabled'),
        j.last || '—',
        el('span', {},
          button(j.enabled ? 'Off' : 'On', () =>
            api.post(`backup/jobs/${j.id}/toggle`).then(loadJobs)),
          button('Sync', () => api.post('backup/sync', {id: j.id})
            .then(() => { setRunning(true); sb.set(t('backup.syncStarted')); })
            .catch(e => sb.error(e.message))),
          button(t('del'), () =>
            api.del(`backup/jobs/${j.id}`).then(loadJobs)))
      ])));
  };

  const loadJobs = () => api.get('backup/jobs')
    .then(r => renderJobs(r.jobs)).catch(e => sb.error(e.message));

  jobsCard.appendChild(el('h3', {}, t('backup.syncedFolders')));
  jobsCard.appendChild(jobsBody);
  jobsCard.appendChild(el('div', {style: {marginTop: '8px'}},
    localIn,
    button('📁', () => dirPicker(t('backup.pickLocal'), localDirs,
      p => { localIn.value = p; }), false),
    remoteIn,
    button('☁️', () => dirPicker(t('backup.pickRemote'), remoteDirs,
      p => { remoteIn.value = p; }, true)),
    button(t('add'), () => {
      api.post('backup/jobs', {local: localIn.value, remote: remoteIn.value})
        .then(() => { localIn.value = remoteIn.value = ''; loadJobs(); })
        .catch(e => sb.error(e.message));
    }),
    button(t('backup.syncAll'), () => api.post('backup/sync', {})
      .then(() => { setRunning(true); sb.set(t('backup.syncStarted')); })
      .catch(e => sb.error(e.message)))));

  proc.createWindow({
    id: 'WebOSBackupWindow',
    title: metaTitle(core, metadata),
    dimension: {width: 760, height: 540}
  })
    .on('destroy', () => { if (polling) { clearInterval(polling); } proc.destroy(); })
    .render($content => {
      $content.appendChild(layout(
        el('div', {class: 'webos-toolbar'},
          el('span', {style: {color: '#9ab', fontSize: '12px'}},
            t('backup.hint'))),
        el('div', {style: {overflow: 'auto'}},
          statusCard, authBox, tokenBox, jobsCard, logBox), sb));
      refresh(); loadJobs();
    });

  return proc;
};

osjs.register(applicationName, register);
