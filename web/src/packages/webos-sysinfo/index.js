import osjs from 'osjs';
import {name as applicationName} from './metadata.json';
import {api, formatBytes} from '../_shared/api.js';
import {el, css, button, statusbar, layout, promptText, confirmDialog} from '../_shared/ui.js';

css('webos-sysinfo', `
  .wsi-dash { display: flex; flex-wrap: wrap; gap: 14px; padding: 16px; }
  .wsi-gauge { width: 150px; text-align: center; }
  .wsi-gauge canvas { width: 150px; height: 100px; }
  .wsi-gauge .lbl { color: #9ab; font-size: 12px; margin-top: 2px; }
  .wsi-gauge .val { color: #dde4f0; font-size: 13px; font-weight: bold; }
  .wsi-cards { display: flex; gap: 14px; padding: 0 16px 16px; flex-wrap: wrap; }
  .wsi-card { flex: 1 1 320px; background: #1d212b; border: 1px solid #2a2f3c;
    border-radius: 10px; padding: 12px 14px; }
  .wsi-card h3 { margin: 0 0 8px; font-size: 13px; color: #8fb7e8;
    text-transform: uppercase; letter-spacing: .05em; }
  .wsi-kv { display: grid; grid-template-columns: 110px 1fr; gap: 4px 10px;
    font-size: 12px; }
  .wsi-kv b { color: #9ab; font-weight: normal; }
  .wsi-kv span { color: #dde4f0; word-break: break-all; }
  .wsi-card input { background: #14171f; border: 1px solid #333845; color: #dde4f0;
    border-radius: 5px; padding: 4px 8px; font-size: 12px; width: 140px; }
`);

const color = pct => pct > 85 ? '#e5534b' : pct > 60 ? '#e8a13f' : '#4fb96f';

const gauge = (canvas, pct, label, value) => {
  const ctx = canvas.getContext('2d');
  const w = canvas.width = 300;
  const h = canvas.height = 200;
  const cx = w / 2, cy = 170, r = 110;
  ctx.clearRect(0, 0, w, h);

  const arc = (from, to, style, width) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI + from * Math.PI, Math.PI + to * Math.PI);
    ctx.strokeStyle = style;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  arc(0, 1, '#242a36', 22);
  const p = Math.max(0, Math.min(1, pct / 100));
  if (p > 0.003) {
    arc(0, p, color(pct), 22);
  }
  // ticks
  ctx.strokeStyle = '#3a4152';
  ctx.lineWidth = 2;
  for (let t = 0; t <= 10; t++) {
    const a = Math.PI + (t / 10) * Math.PI;
    ctx.beginPath();
    ctx.moveTo(cx + (r - 18) * Math.cos(a), cy + (r - 18) * Math.sin(a));
    ctx.lineTo(cx + (r - 26) * Math.cos(a), cy + (r - 26) * Math.sin(a));
    ctx.stroke();
  }
  ctx.fillStyle = '#dde4f0';
  ctx.font = 'bold 34px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(value, cx, cy - 26);
  ctx.fillStyle = '#8b93a5';
  ctx.font = '16px sans-serif';
  ctx.fillText(label, cx, cy - 6);
};

const fmtUptime = s => {
  const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600),
        m = Math.floor(s % 3600 / 60);
  return d ? `${d}d ${h}h ${m}m` : h ? `${h}h ${m}m` : `${m}m ${Math.floor(s % 60)}s`;
};

const register = (core, args, options, metadata) => {
  const proc = core.make('osjs/application', {args, options, metadata});
  const body = el('div');
  const sb = statusbar();
  let timer = null;
  let prevNet = null;
  let netRate = {rx: 0, tx: 0};

  const refresh = () => api.get('system/info').then(i => {
    if (prevNet) {
      const dt = Math.max(0.001, i.network_io.ts - prevNet.ts);
      netRate = {
        rx: Math.max(0, (i.network_io.rx_bytes - prevNet.rx_bytes) / dt),
        tx: Math.max(0, (i.network_io.tx_bytes - prevNet.tx_bytes) / dt)
      };
    }
    prevNet = i.network_io;

    body.innerHTML = '';
    const gauges = el('div', {class: 'wsi-dash'});
    const mk = (pct, label, value) => {
      const c = el('canvas');
      gauge(c, pct, label, value);
      return el('div', {class: 'wsi-gauge'}, c);
    };
    gauges.append(
      mk(i.cpu.percent, `CPU · ${i.cpu.count} cores`, `${i.cpu.percent.toFixed(0)}%`),
      mk(i.memory.percent, `RAM · ${formatBytes(i.memory.used)}/${formatBytes(i.memory.total)}`,
        `${i.memory.percent.toFixed(0)}%`),
      mk(i.root_disk.percent, `Disk / · ${formatBytes(i.root_disk.used)} free ${formatBytes(i.root_disk.total - i.root_disk.used)}`,
        `${i.root_disk.percent.toFixed(0)}%`));

    // network rate gauge: log-scaled against 100 MB/s ceiling
    const mb = 1024 * 1024;
    const netPct = Math.min(100,
      100 * Math.log10(1 + (netRate.rx + netRate.tx) / 1024) / Math.log10(1 + 100 * mb / 1024));
    gauges.appendChild(mk(netPct, 'Network I/O',
      `\u2193${formatBytes(netRate.rx)}/s \u2191${formatBytes(netRate.tx)}/s`));
    body.appendChild(gauges);

    const host = (i.hostname || '').split('.')[0];
    const dom = i.domain || (i.hostname || '').split('.').slice(1).join('.');
    const cards = el('div', {class: 'wsi-cards'});
    cards.append(
      el('div', {class: 'wsi-card'},
        el('h3', {}, 'System'),
        el('div', {class: 'wsi-kv'},
          el('b', {}, 'Model'), el('span', {}, i.model || '-'),
          el('b', {}, 'Machine ID'), el('span', {}, i.machine_id || '-'),
          el('b', {}, 'OS'), el('span', {}, i.os),
          el('b', {}, 'Kernel'), el('span', {}, i.kernel),
          el('b', {}, 'Uptime'), el('span', {}, fmtUptime(i.uptime_seconds)),
          el('b', {}, 'Load avg'), el('span', {},
            i.cpu.loadavg ? i.cpu.loadavg.map(x => x.toFixed(2)).join('  ') : '-'))),
      el('div', {class: 'wsi-card'},
        el('h3', {}, 'Host config'),
        el('div', {class: 'wsi-kv'},
          el('b', {}, 'Hostname'), el('span', {}, host || i.hostname || '-'),
          el('b', {}, 'Domain'), el('span', {}, dom || '(none)')),
        el('div', {style: {marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap'}},
          button('Set hostname', () => promptText(core, 'Set hostname',
            'New hostname (short name or FQDN host.domain):', host || '')
            .then(v => v && confirmDialog(core, 'Set hostname',
              `hostnamectl set-hostname ${v}?`)
              .then(ok => ok && api.post('system/hostname', {hostname: v})
                .then(() => { sb.set(`hostname set to ${v}`); refresh(); })
                .catch(e => sb.error(e.message)))))))
    );
    body.appendChild(cards);
    sb.set('updated ' + new Date().toLocaleTimeString());
  }).catch(e => sb.error(e.message));

  proc.createWindow({
    id: 'WebOSSysInfoWindow',
    title: metadata.title.en_EN,
    dimension: {width: 720, height: 560}
  })
    .on('destroy', () => { clearInterval(timer); proc.destroy(); })
    .render($content => {
      $content.appendChild(layout(
        el('div', {class: 'webos-toolbar'},
          el('span', {style: {color: '#889', fontSize: '11px'}}, 'auto-refresh 2s'),
          el('span', {style: {flex: '1'}}),
          button('Refresh', refresh)),
        el('div', {style: {overflow: 'auto'}}, body), sb));
      refresh();
      timer = setInterval(refresh, 2000);
    });

  return proc;
};

osjs.register(applicationName, register);
