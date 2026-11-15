import osjs from 'osjs';
import {name as applicationName} from './metadata.json';
import {api} from '../_shared/api.js';
import {el, css, button, layout, statusbar, confirmDialog} from '../_shared/ui.js';

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
  const sb = statusbar();
  const log = el('div', {class: 'wup-log'}, 'sem atualização em andamento');
  const statusTxt = el('div', {class: 'd'}, 'Verifique e instale a versão mais recente.');
  const verTxt = el('div', {class: 'd', style: {marginTop: '4px', fontFamily: 'monospace'}}, '');
  const btn = button('Atualizar agora', null);
  let timer = null;

  const paint = st => {
    const v = `local: ${st.local || '?'}  ·  main: ${st.remote || '?'}`;
    verTxt.textContent = st.update_available ? v + '  —  atualização disponível ⬆' : v;
    verTxt.style.color = st.update_available ? '#7ddc8f' : '#9ab';
    if (st.running) {
      btn.disabled = true;
      statusTxt.textContent = 'Atualizando… os serviços vão reiniciar (a sessão pode cair).';
      sb.set('atualizando…');
    } else if (st.rc !== null && st.rc !== undefined) {
      btn.disabled = false;
      const ok = st.rc === '0';
      statusTxt.textContent = ok ? 'Atualização concluída.' : `Falhou (rc=${st.rc}).`;
      sb.set(ok ? 'concluído ✓' : 'falhou — veja o log');
    } else {
      btn.disabled = false;
      sb.set(st.update_available ? 'nova versão disponível' : 'pronto');
    }
    if (st.log) {
      log.textContent = st.log;
      log.scrollTop = log.scrollHeight;
    }
  };

  const poll = () => {
    api.get('sysupdate').then(paint).catch(() => {
      // agente reiniciando durante o update — segue tentando
      statusTxt.textContent = 'Serviços reiniciando… aguardando retorno.';
    });
  };

  btn.onclick = () => confirmDialog(core, 'Atualizar Malta OS',
    'Baixa a versão mais recente e reinstala preservando configurações, ' +
    'jobs de backup e conexões. Os serviços reiniciam no final.')
    .then(ok => {
      if (!ok) return;
      btn.disabled = true;
      api.post('sysupdate', {pull: true})
        .then(r => { sb.set('update iniciado em ' + r.source); poll(); })
        .catch(e => { btn.disabled = false; sb.error(e.message); });
    });

  proc.createWindow({
    id: 'WebOSUpdateWindow',
    title: metadata.title.en_EN,
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
