import osjs from 'osjs';
import {name as applicationName} from './metadata.json';
import {api} from '../_shared/api.js';
import {el, css, button, table, statusbar, layout, confirmDialog} from '../_shared/ui.js';

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
`);

const register = (core, args, options, metadata) => {
  const proc = core.make('osjs/application', {args, options, metadata});
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
            sb.set(`sync ${r.finished && r.finished.ok ? 'concluído' : 'finalizado'}`);
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
        'rclone não instalado — instale o pacote rclone'));
      return;
    }
    if (r.connected) {
      const about = r.about && r.about.Used
        ? ` — usado ${r.about.Used} de ${r.about.Total || '?'}`
        : '';
      statusCard.appendChild(el('div', {class: 'wb-ok'},
        `● conectado${about}`));
      statusCard.appendChild(button('Disconnect', () => {
        confirmDialog(core, 'Disconnect', 'Remover a conexão com o Google Drive?')
          .then(ok => ok && api.post('backup/disconnect').then(refresh)
            .catch(e => sb.error(e.message)));
      }));
    } else {
      statusCard.appendChild(el('div', {class: 'muted'},
        'não conectado — autorize o acesso à sua conta Google'));
      statusCard.appendChild(button('Conectar Google Drive', startAuth));
      statusCard.appendChild(button('Colar token manual',
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
    sb.set('iniciando OAuth…');
    api.post('backup/auth/start').then(r => {
      authSid = r.sid;
      authBox.classList.add('open');
      authBox.textContent = '';
      authBox.appendChild(el('div', {class: 'step'},
        '1. Abra o link e autorize o acesso:',
        el('div', {}, el('a', {href: r.google_url, target: '_blank'},
          r.google_url.slice(0, 90) + '…'))));
      authBox.appendChild(el('div', {class: 'step'},
        '2. O navegador vai falhar em http://127.0.0.1:53682/... — ' +
        'copie a URL completa da barra de endereços e cole abaixo:'));
      authBox.appendChild(urlIn);
      authBox.appendChild(el('div', {},
        button('Concluir', () => {
          api.post('backup/auth/finish', {sid: authSid, url: urlIn.value})
            .then(() => { authBox.classList.remove('open');
              sb.set('conectado!'); refresh(); })
            .catch(e => sb.error(e.message));
        }),
        button('Cancelar', () => {
          api.post('backup/auth/cancel', {sid: authSid});
          authBox.classList.remove('open');
        })));
      window.open(r.google_url, '_blank');
    }).catch(e => sb.error(e.message));
  };

  tokenBox.appendChild(el('div', {class: 'step'},
    'Alternativa: rode `rclone authorize "drive"` em qualquer máquina com ' +
    'navegador e cole o JSON gerado:'));
  tokenBox.appendChild(tokIn);
  tokenBox.appendChild(button('Salvar token', () => {
    api.post('backup/auth/token', {token: tokIn.value})
      .then(() => { tokenBox.classList.remove('open'); refresh(); })
      .catch(e => sb.error(e.message));
  }));

  // ---------- jobs ----------
  const localIn = el('input', {class: 'local', placeholder: 'pasta local (ex: /home/iwacham/fotos)'});
  const remoteIn = el('input', {class: 'remote', placeholder: 'pasta no Drive (ex: backup/fotos)'});
  const jobsBody = el('div', {});

  const renderJobs = jobs => {
    jobsBody.textContent = '';
    if (!jobs.length) {
      jobsBody.appendChild(el('div', {class: 'muted'},
        'nenhuma pasta configurada — adicione abaixo'));
      return;
    }
    jobsBody.appendChild(table(
      ['local', '→ drive', 'status', 'último sync', ''],
      jobs.map(j => [
        j.local, j.remote,
        j.enabled ? (j.status || 'pendente') : 'desativado',
        j.last || '—',
        el('span', {},
          button(j.enabled ? 'Off' : 'On', () =>
            api.post(`backup/jobs/${j.id}/toggle`).then(loadJobs)),
          button('Sync', () => api.post('backup/sync', {id: j.id})
            .then(() => { setRunning(true); sb.set('sync iniciado'); })
            .catch(e => sb.error(e.message))),
          button('Del', () =>
            api.del(`backup/jobs/${j.id}`).then(loadJobs)))
      ])));
  };

  const loadJobs = () => api.get('backup/jobs')
    .then(r => renderJobs(r.jobs)).catch(e => sb.error(e.message));

  jobsCard.appendChild(el('h3', {}, 'Pastas sincronizadas'));
  jobsCard.appendChild(jobsBody);
  jobsCard.appendChild(el('div', {style: {marginTop: '8px'}},
    localIn, remoteIn,
    button('Adicionar', () => {
      api.post('backup/jobs', {local: localIn.value, remote: remoteIn.value})
        .then(() => { localIn.value = remoteIn.value = ''; loadJobs(); })
        .catch(e => sb.error(e.message));
    }),
    button('Sync tudo', () => api.post('backup/sync', {})
      .then(() => { setRunning(true); sb.set('sync iniciado'); })
      .catch(e => sb.error(e.message)))));

  proc.createWindow({
    id: 'WebOSBackupWindow',
    title: metadata.title.en_EN,
    dimension: {width: 760, height: 540}
  })
    .on('destroy', () => { if (polling) { clearInterval(polling); } proc.destroy(); })
    .render($content => {
      $content.appendChild(layout(
        el('div', {class: 'webos-toolbar'},
          el('span', {style: {color: '#9ab', fontSize: '12px'}},
            'Selecione as pastas — o sistema sincroniza com o Google Drive')),
        el('div', {style: {overflow: 'auto'}},
          statusCard, authBox, tokenBox, jobsCard, logBox), sb));
      refresh(); loadJobs();
    });

  return proc;
};

osjs.register(applicationName, register);
