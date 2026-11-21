import osjs from 'osjs';
import {name as applicationName} from './metadata.json';
import {api} from '../_shared/api.js';
import {el, css, button, statusbar, layout} from '../_shared/ui.js';
import {createLocalizedWindow} from '../_shared/i18n.js';

css('webos-logs', `
  .wlog-list { font-family: monospace; font-size: 11.5px; }
  .wlog-row { display: flex; gap: 8px; padding: 2px 8px;
    border-bottom: 1px solid rgba(255,255,255,.03); white-space: pre-wrap; }
  .wlog-row:hover { background: rgba(255,255,255,.04); }
  .wlog-row .t { color: #7a869c; flex: 0 0 auto; }
  .wlog-row .u { color: #8fb7e8; flex: 0 0 170px; overflow: hidden;
    text-overflow: ellipsis; }
  .wlog-row .m { color: #cfd6e4; flex: 1 1 auto; }
  .wlog-row.p0, .wlog-row.p1, .wlog-row.p2 { background: rgba(229,83,75,.14); }
  .wlog-row.p3 { background: rgba(229,83,75,.08); }
  .wlog-row.p0 .m, .wlog-row.p1 .m, .wlog-row.p2 .m, .wlog-row.p3 .m { color: #ff9a94; }
  .wlog-row.p4 .m { color: #e8c07f; }
  .wlog-select { background: #14171f; border: 1px solid #333845; color: #dde4f0;
    border-radius: 5px; padding: 4px 6px; font-size: 12px; max-width: 220px; }
  .wlog-tail { background: rgba(79,185,111,.15); }
`);

const PRIORITIES = [
  ['', 'all priorities'], ['emerg', 'emerg+'], ['alert', 'alert+'],
  ['crit', 'crit+'], ['err', 'err+'], ['warning', 'warning+'],
  ['notice', 'notice+'], ['info', 'info+'], ['debug', 'debug']
];

const SINCE = [
  ['', 'all time'], ['-15min', 'last 15 min'], ['-1hour', 'last hour'],
  ['-6hour', 'last 6 h'], ['today', 'today'], ['-1day', 'last 24 h']
];

const fmtTs = us => {
  const d = new Date(Number(us) / 1000);
  return d.toLocaleString('sv-SE').replace('T', ' ');
};

const register = (core, args, options, metadata) => {
  const proc = core.make('osjs/application', {args, options, metadata});
  const body = el('div', {class: 'wlog-list'});
  const sb = statusbar();
  let timer = null;
  let lastEntries = [];

  const unitSel = el('select', {class: 'wlog-select'},
    el('option', {value: ''}, 'all units'));
  const prioSel = el('select', {class: 'wlog-select'},
    PRIORITIES.map(([v, l]) => el('option', {value: v}, l)));
  const sinceSel = el('select', {class: 'wlog-select'},
    SINCE.map(([v, l]) => el('option', {value: v}, l)));
  const grepIn = el('input', {class: 'webos-input',
    placeholder: 'filter text (regex)', style: {width: '160px'}});
  const linesSel = el('select', {class: 'wlog-select'},
    ['100', '300', '500', '1000'].map(n => el('option',
      {value: n, selected: n === '300' ? 'selected' : undefined}, `${n} lines`)));
  const liveCb = el('input', {type: 'checkbox'});

  const params = () => ({
    unit: unitSel.value || undefined,
    priority: prioSel.value || undefined,
    since: sinceSel.value || undefined,
    q: grepIn.value || undefined,
    lines: linesSel.value
  });

  const render = entries => {
    body.innerHTML = '';
    entries.forEach(e => {
      body.appendChild(el('div', {class: `wlog-row p${e.priority}`},
        el('span', {class: 't'}, fmtTs(e.time)),
        el('span', {class: 'u', title: e.unit}, e.unit),
        el('span', {class: 'm'}, e.message)));
    });
    if (!entries.length) {
      body.appendChild(el('div', {style: {padding: '20px', color: '#9ab'}},
        'no entries match'));
    }
    body.scrollTop = body.scrollHeight;
  };

  const refresh = () => {
    api.get('logs', params()).then(r => {
      lastEntries = r.entries;
      sb.set(`${r.count} entries`);
      render(lastEntries);
    }).catch(e => sb.error(e.message));
  };

  const setLive = on => {
    clearInterval(timer);
    timer = on ? setInterval(refresh, 3000) : null;
  };

  const exportLog = () => {
    const text = lastEntries.map(e =>
      `${fmtTs(e.time)} [${e.priority}] ${e.unit}: ${e.message}`).join('\n');
    const blob = new Blob([text], {type: 'text/plain'});
    const a = el('a', {href: URL.createObjectURL(blob),
      download: `journal-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.log`});
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // populate unit filter once
  api.get('logs/units').then(r => {
    r.units.forEach(u => unitSel.appendChild(el('option', {value: u}, u)));
  }).catch(() => {});

  let debounce = null;
  [unitSel, prioSel, sinceSel, linesSel].forEach(s =>
    s.addEventListener('change', refresh));
  grepIn.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(refresh, 500);
  });
  liveCb.addEventListener('change', () => setLive(liveCb.checked));

  createLocalizedWindow(proc, {
    id: 'WebOSLogsWindow',
    dimension: {width: 880, height: 520}
  })
    .on('destroy', () => {
      setLive(false); proc.destroy();
    })
    .render($content => {
      $content.appendChild(layout(
        el('div', {class: 'webos-toolbar'},
          unitSel, prioSel, sinceSel, grepIn, linesSel,
          el('label', {style: {display: 'flex', alignItems: 'center', gap: '4px',
            color: '#9ab', fontSize: '12px'}}, liveCb, 'live'),
          el('span', {style: {flex: '1'}}),
          button('Export', exportLog),
          button('Refresh', refresh)),
        body, sb));
      refresh();
    });

  return proc;
};

osjs.register(applicationName, register);
