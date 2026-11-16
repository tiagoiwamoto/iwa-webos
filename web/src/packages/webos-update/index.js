import osjs from 'osjs';
import {name as applicationName} from './metadata.json';
import {api} from '../_shared/api.js';
import {el, css, button, layout, statusbar, confirmDialog} from '../_shared/ui.js';
import {useI18n, metaTitle} from '../_shared/i18n.js';

css('webos-update', `
  .wup-box { padding: 14px; display: flex; flex-direction: column; gap: 10px;
    height: 100%; box-sizing: border-box; }
  .wup-card { background: #2a2e37; border: 1px solid #333845; border-radius: 8px;
    padding: 14px; display: flex; align-items: center; gap: 14px; }
  .wup-card .big { font-size: 30px; }
  .wup-card .t { font-size: 14px; font-weight: bold; }
  .wup-card .d { color: #9ab; font-size: 12px; margin-top: 3px; }
  .wup-card .wup-btn { margin-left: auto; }
  .wup-log { flex: 1; background: #10131a; color: #cde; font-family: monospace;
    font-size: 11px; white-space: pre-wrap; overflow: auto; border-radius: 6px;
    padding: 10px; }
`);

const register = (core, args, options, metadata) => {
  const proc = core.make('osjs/application', {args, options, metadata});
  const {t} = useI18n(core);
  const sb = statusbar();
  const log = el('div', {class: 'wup-log'}, t('update.idle'));
  const statusTxt = el('div', {class: 'd'}, t('update.hint'));
  const verTxt = el('div', {class: 'd', style: {marginTop: '4px', fontFamily: 'monospace'}}, '');
  const btn = button(t('update.btn'), null);
  let timer = null;

  const paint = st => {
    const v = `local: ${st.local || '?'}  ·  main: ${st.remote || '?'}`;
    verTxt.textContent = st.update_available ? v + t('update.availTag') : v;
    verTxt.style.color = st.update_available ? '#7ddc8f' : '#9ab';
    if (st.running) {
      btn.disabled = true;
      statusTxt.textContent = t('update.running');
      sb.set(t('update.runningSb'));
    } else if (st.rc !== null && st.rc !== undefined) {
      btn.disabled = false;
      const ok = st.rc === '0';
      statusTxt.textContent = ok ? t('update.done') : t('update.failed', {rc: st.rc});
      sb.set(ok ? t('update.doneSb') : t('update.failedSb'));
    } else {
      btn.disabled = false;
      sb.set(st.update_available ? t('update.avail') : t('update.ready'));
    }
    if (st.log) {
      log.textContent = st.log;
      log.scrollTop = log.scrollHeight;
    }
  };

  const poll = () => {
    api.get('sysupdate').then(paint).catch(() => {
      // agente reiniciando durante o update — segue tentando
      statusTxt.textContent = t('update.restarting');
    });
  };

  btn.onclick = () => confirmDialog(core, t('update.title'),
    t('update.confirm'))
    .then(ok => {
      if (!ok) return;
      btn.disabled = true;
      api.post('sysupdate', {pull: true})
        .then(r => { sb.set(t('update.started', {src: r.source})); poll(); })
        .catch(e => { btn.disabled = false; sb.error(e.message); });
    });

  proc.createWindow({
    id: 'WebOSUpdateWindow',
    title: metaTitle(core, metadata),
    dimension: {width: 560, height: 480}
  })
    .on('destroy', () => { clearInterval(timer); proc.destroy(); })
    .render($c => {
      $c.appendChild(layout(el('div'), el('div', {class: 'wup-box'},
        el('div', {class: 'wup-card'},
          el('span', {class: 'big'}, '⬆'),
          el('div', {},
            el('div', {class: 't'}, 'Malta OS'),
            statusTxt, verTxt),
          el('span', {class: 'wup-btn'}, btn)),
        log), sb));
      poll();
      timer = setInterval(poll, 2000);
    });

  return proc;
};

osjs.register(applicationName, register);
