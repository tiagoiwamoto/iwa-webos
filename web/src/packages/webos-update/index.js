import osjs from 'osjs';
import {name as applicationName} from './metadata.json';
import {api} from '../_shared/api.js';
import {el, css, button, layout, statusbar, confirmDialog} from '../_shared/ui.js';
import {useI18n, createLocalizedWindow} from '../_shared/i18n.js';

css('webos-update', `
  .wup-box { padding: 14px; display: flex; flex-direction: column; gap: 10px;
    height: 100%; box-sizing: border-box; }
  .wup-card { background: #2a2e37; border: 1px solid #333845; border-radius: 8px;
    padding: 14px; display: flex; align-items: center; gap: 14px; }
  .wup-card .big { font-size: 30px; }
  .wup-card .t { font-size: 14px; font-weight: bold; }
  .wup-card .d { color: #9ab; font-size: 12px; margin-top: 3px; }
  .wup-card .wup-btn { margin-left: auto; }
  .wup-progress { width: 100%; flex: 0 0 auto; accent-color: #7ddc8f; }
  .wup-log { flex: 1; background: #10131a; color: #cde; font-family: monospace;
    min-height: 0; font-size: 11px; white-space: pre-wrap; overflow: auto;
    overflow-wrap: anywhere; border-radius: 6px;
    padding: 10px; }
`);

const register = (core, args, options, metadata) => {
  const proc = core.make('osjs/application', {args, options, metadata});
  const {t} = useI18n(core);
  const sb = statusbar();
  const log = el('div', {class: 'wup-log'}, t('update.idle'));
  const statusTxt = el('div', {class: 'd', role: 'status'}, t('loading'));
  const verTxt = el('div', {class: 'd', style: {marginTop: '4px', fontFamily: 'monospace'}}, '');
  const btn = button(t('update.btn'), null);
  const progress = el('progress', {class: 'wup-progress', hidden: true,
    'aria-label': t('update.title')});
  btn.disabled = true;
  let timer = null;
  let polling = false;
  let starting = false;
  let running = false;
  let updateAttempt = 0;

  const showRunning = () => {
    running = true;
    btn.disabled = true;
    progress.hidden = false;
    progress.removeAttribute('value');
    statusTxt.textContent = t('update.running');
    sb.set(t('update.runningSb'));
  };

  const paint = st => {
    const v = `local: ${st.local || '?'}  ·  main: ${st.remote || '?'}`;
    verTxt.textContent = st.update_available ? v + t('update.availTag') : v;
    verTxt.style.color = st.update_available ? '#7ddc8f' : '#9ab';
    running = st.running;
    btn.disabled = running;
    if (running) {
      showRunning();
    } else if (st.rc !== null && st.rc !== undefined) {
      const ok = String(st.rc) === '0';
      progress.hidden = !ok;
      progress.value = 1;
      statusTxt.textContent = ok ? t('update.done') : t('update.failed', {rc: st.rc});
      sb.set(ok ? t('update.doneSb') : t('update.failedSb'));
    } else {
      progress.hidden = true;
      statusTxt.textContent = t('update.hint');
      sb.set(st.update_available ? t('update.avail') : t('update.ready'));
    }
    const output = st.log || t('update.idle');
    if (output !== log.textContent) {
      const atBottom = log.scrollHeight - log.scrollTop - log.clientHeight < 4;
      log.textContent = output;
      if (atBottom) {
        log.scrollTop = log.scrollHeight;
      }
    }
  };

  const poll = () => {
    if (polling || starting) {
      return;
    }
    polling = true;
    const attempt = updateAttempt;
    api.get('sysupdate').then(st => {
      if (attempt === updateAttempt) {
        paint(st);
      }
    }).catch(e => {
      if (attempt !== updateAttempt) {
        return;
      }
      btn.disabled = true;
      if (running) {
        statusTxt.textContent = t('update.restarting');
      } else {
        sb.error(e.message);
      }
    }).finally(() => {
      polling = false;
      if (attempt !== updateAttempt) {
        poll();
      }
    });
  };

  btn.onclick = () => confirmDialog(core, t('update.title'),
    t('update.confirm'))
    .then(ok => {
      if (!ok || starting || btn.disabled) {
        return;
      }
      updateAttempt += 1;
      starting = true;
      showRunning();
      log.textContent = t('update.runningSb');
      api.post('sysupdate', {pull: true})
        .then(r => sb.set(t('update.started', {src: r.source})))
        .catch(e => {
          log.textContent = e.message; sb.error(e.message);
        })
        .finally(() => {
          starting = false; poll();
        });
    });

  createLocalizedWindow(proc, {
    id: 'WebOSUpdateWindow',
    dimension: {width: 560, height: 480}
  })
    .on('destroy', () => {
      clearInterval(timer); proc.destroy();
    })
    .render($c => {
      $c.appendChild(layout(el('div'), el('div', {class: 'wup-box'},
        el('div', {class: 'wup-card'},
          el('span', {class: 'big'}, '⬆'),
          el('div', {},
            el('div', {class: 't'}, 'Malta OS'),
            statusTxt, verTxt),
          el('span', {class: 'wup-btn'}, btn)),
        progress, log), sb));
      poll();
      timer = setInterval(poll, 2000);
    });

  return proc;
};

osjs.register(applicationName, register);
