import osjs from 'osjs';
import {name as applicationName} from './metadata.json';
import {api} from '../_shared/api.js';
import {el, css, button, table, statusbar, layout, confirmDialog} from '../_shared/ui.js';

css('webos-cron', `
  .wcron-card { display: flex; align-items: center; gap: 10px; margin: 8px 12px;
    padding: 10px 12px; background: #1d212b; border: 1px solid #2a2f3c;
    border-radius: 8px; }
  .wcron-card.off { opacity: .5; }
  .wcron-when { flex: 0 0 150px; }
  .wcron-when .h { color: #8fb7e8; font-size: 13px; font-weight: 600; }
  .wcron-when .e { color: #6b7280; font-size: 10px; font-family: monospace; }
  .wcron-cmd { flex: 1 1 auto; font-family: monospace; font-size: 12px;
    color: #cfd6e4; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .wcron-form { margin: 8px 12px; padding: 10px 12px; background: #1d212b;
    border: 1px solid #333845; border-radius: 8px; display: none; }
  .wcron-form.open { display: block; }
  .wcron-form .row { display: flex; gap: 8px; margin-bottom: 8px;
    align-items: center; flex-wrap: wrap; }
  .wcron-form input, .wcron-form select {
    background: #14171f; border: 1px solid #333845; color: #dde4f0;
    border-radius: 5px; padding: 5px 8px; font-size: 12px; }
  .wcron-form input.cmd { flex: 1; min-width: 240px; font-family: monospace; }
  .wcron-form input.expr { width: 130px; font-family: monospace; }
`);

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// human-readable schedule for common patterns (falls back to raw expr)
const humanize = j => {
  if (j.special) {
    return {hourly: 'Every hour', daily: 'Daily 00:00', midnight: 'Daily 00:00',
      weekly: 'Weekly (Sun)', monthly: 'Monthly (1st)',
      yearly: 'Yearly', annually: 'Yearly', reboot: 'At boot'}[j.special]
      || `@${j.special}`;
  }
  const {minute: mi, hour: h, dom, month, dow} = j;
  const time = `${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}`;
  if (mi === '*' && h === '*' && dom === '*' && dow === '*') {
    return 'Every minute';
  }
  if (mi.startsWith('*/') && h === '*' && dom === '*' && dow === '*') {
    return `Every ${mi.slice(2)} min`;
  }
  if (/^\d+$/.test(mi) && h === '*' && dom === '*' && dow === '*') {
    return `Hourly at :${mi.padStart(2, '0')}`;
  }
  if (/^\d+$/.test(mi) && h.startsWith('*/') && dom === '*' && dow === '*') {
    return `Every ${h.slice(2)} h at :${mi.padStart(2, '0')}`;
  }
  if (/^\d+$/.test(mi) && /^\d+$/.test(h)) {
    if (dom === '*' && dow === '*') {
      return `Daily at ${time}`;
    }
    if (dom === '*' && /^\d$/.test(dow)) {
      return `${DOW[Number(dow)] || dow}s at ${time}`;
    }
    if (/^\d+$/.test(dom) && month === '*' && dow === '*') {
      return `Monthly day ${dom} at ${time}`;
    }
  }
  return `${mi} ${h} ${dom} ${month} ${dow}`;
};

const PRESETS = [
  ['every-1min', 'Every minute', {minute: '*', hour: '*', dom: '*', month: '*', dow: '*'}],
  ['every-5min', 'Every 5 minutes', {minute: '*/5', hour: '*', dom: '*', month: '*', dow: '*'}],
  ['every-15min', 'Every 15 minutes', {minute: '*/15', hour: '*', dom: '*', month: '*', dow: '*'}],
  ['hourly', 'Hourly', {minute: '0', hour: '*', dom: '*', month: '*', dow: '*'}],
  ['daily', 'Daily at 03:00', {minute: '0', hour: '3', dom: '*', month: '*', dow: '*'}],
  ['weekly', 'Weekly (Sun 04:00)', {minute: '0', hour: '4', dom: '*', month: '*', dow: '0'}],
  ['monthly', 'Monthly (1st 05:00)', {minute: '0', hour: '5', dom: '1', month: '*', dow: '*'}],
  ['reboot', 'At boot', {special: 'reboot'}],
  ['custom', 'Custom expression', null]
];

const register = (core, args, options, metadata) => {
  const proc = core.make('osjs/application', {args, options, metadata});
  const list = el('div');
  const sb = statusbar();
  const userIn = el('input', {class: 'webos-input', value: 'root',
    style: {width: '80px'}, title: 'crontab owner'});
  let entries = [];
  let editing = null; // index being edited or null = new

  // --- job form ---
  const presetSel = el('select', {},
    PRESETS.map(([v, l]) => el('option', {value: v}, l)));
  const exprIn = el('input', {class: 'expr', placeholder: '* * * * *'});
  const cmdIn = el('input', {class: 'cmd', placeholder: 'command to run'});
  const form = el('div', {class: 'wcron-form'},
    el('div', {class: 'row'},
      el('span', {style: {color: '#9ab', fontSize: '12px'}}, 'When:'),
      presetSel, exprIn),
    el('div', {class: 'row'},
      el('span', {style: {color: '#9ab', fontSize: '12px'}}, 'Run:'), cmdIn),
    el('div', {class: 'row'},
      button('Save', saveJob),
      button('Cancel', () => { form.classList.remove('open'); editing = null; })));

  const exprFromPreset = () => {
    const p = PRESETS.find(([v]) => v === presetSel.value);
    return p && p[2] ? {...p[2]} : null;
  };

  presetSel.addEventListener('change', () => {
    const f = exprFromPreset();
    exprIn.value = f
      ? (f.special ? `@${f.special}` : `${f.minute} ${f.hour} ${f.dom} ${f.month} ${f.dow}`)
      : '';
    exprIn.style.display = presetSel.value === 'custom' ? '' : 'none';
  });
  presetSel.value = 'daily';
  presetSel.dispatchEvent(new Event('change'));

  function saveJob() {
    const cmd = cmdIn.value.trim();
    if (!cmd) {
      sb.set('command required');
      return;
    }
    let body = {user: userIn.value.trim() || 'root', command: cmd};
    const preset = exprFromPreset();
    if (preset) {
      body = {...body, ...preset};
    } else {
      const parts = exprIn.value.trim().split(/\s+/);
      if (parts[0] && parts[0].startsWith('@')) {
        body.special = parts[0].slice(1);
      } else if (parts.length === 5) {
        [body.minute, body.hour, body.dom, body.month, body.dow] = parts;
      } else {
        sb.set('expression needs 5 fields or @special');
        return;
      }
    }
    const call = editing === null
      ? api.post('cron', body)
      : api.put(`cron/${editing}`, body);
    call.then(() => {
      sb.set(editing === null ? 'job added' : 'job updated');
      form.classList.remove('open');
      editing = null;
      cmdIn.value = '';
      refresh();
    }).catch(e => sb.error(e.message));
  }

  const refresh = () => {
    api.get('cron', {user: userIn.value.trim() || 'root'}).then(r => {
      entries = r.entries;
      const jobs = entries.filter(e => e.kind === 'job');
      const others = entries.filter(e => e.kind !== 'job' && e.kind !== 'blank');
      sb.set(`${jobs.length} jobs · user ${r.user}` +
        (others.length ? ` · ${others.length} other lines` : ''));
      list.innerHTML = '';
      jobs.forEach(j => {
        const card = el('div', {class: 'wcron-card' + (j.enabled ? '' : ' off')},
          el('div', {class: 'wcron-when'},
            el('div', {class: 'h'}, humanize(j)),
            el('div', {class: 'e'},
              j.special ? `@${j.special}` : `${j.minute} ${j.hour} ${j.dom} ${j.month} ${j.dow}`)),
          el('div', {class: 'wcron-cmd', title: j.command}, j.command),
          button(j.enabled ? 'Disable' : 'Enable', () =>
            api.post(`cron/${j.index}/toggle`, {user: r.user})
              .then(refresh).catch(e => sb.error(e.message))),
          button('Edit', () => {
            editing = j.index;
            presetSel.value = 'custom';
            presetSel.dispatchEvent(new Event('change'));
            exprIn.value = j.special
              ? `@${j.special}` : `${j.minute} ${j.hour} ${j.dom} ${j.month} ${j.dow}`;
            cmdIn.value = j.command;
            form.classList.add('open');
          }),
          button('Delete', () =>
            confirmDialog(core, 'Delete job', `Delete "${j.command}"?`)
              .then(ok => ok && api.del(`cron/${j.index}`, {user: r.user})
                .then(refresh).catch(e => sb.error(e.message))), 'danger'));
        list.appendChild(card);
      });
      if (!jobs.length) {
        list.appendChild(el('div',
          {style: {padding: '20px', color: '#9ab'}},
          `no cron jobs for ${r.user} — click "New job"`));
      }
    }).catch(e => sb.error(e.message));
  };

  proc.createWindow({
    id: 'WebOSCronWindow',
    title: metadata.title.en_EN,
    dimension: {width: 720, height: 460}
  })
    .on('destroy', () => proc.destroy())
    .render($content => {
      $content.appendChild(layout(
        el('div', {class: 'webos-toolbar'},
          el('span', {style: {color: '#9ab', fontSize: '12px'}}, 'User:'),
          userIn,
          button('Load', refresh),
          el('span', {style: {flex: '1'}}),
          button('New job', () => {
            editing = null;
            presetSel.value = 'daily';
            presetSel.dispatchEvent(new Event('change'));
            cmdIn.value = '';
            form.classList.add('open');
          }),
          button('Refresh', refresh)),
        el('div', {style: {overflow: 'auto'}}, form, list), sb));
      refresh();
    });

  return proc;
};

osjs.register(applicationName, register);
