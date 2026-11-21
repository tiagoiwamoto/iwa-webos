import osjs from 'osjs';
import {name as applicationName} from './metadata.json';
import {api, formatBytes} from '../_shared/api.js';
import {el, css, button, statusbar, layout, promptText, confirmDialog} from '../_shared/ui.js';
import {createLocalizedWindow, intlLocale, useI18n} from '../_shared/i18n.js';

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
  .wsi-bar { display: flex; align-items: center; gap: 8px; font-size: 11px;
    margin: 3px 0; }
  .wsi-bar .n { width: 96px; color: #9ab; overflow: hidden;
    text-overflow: ellipsis; white-space: nowrap; flex-shrink: 0; }
  .wsi-bar .tr { flex: 1; height: 7px; background: #14171f;
    border-radius: 4px; overflow: hidden; }
  .wsi-bar .f { height: 100%; border-radius: 4px; }
  .wsi-bar .p { width: 64px; color: #dde4f0; text-align: right;
    flex-shrink: 0; }
  .wsi-cores { display: grid; grid-template-columns: repeat(4, 1fr);
    gap: 3px 8px; margin-top: 4px; }
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
  const {t, locale} = useI18n(core);
  const body = el('div');
  const sb = statusbar();
  let timer = null;
  let prevNet = null;
  let prevDio = null;
  let netRate = {rx: 0, tx: 0};
  let dioRate = {r: 0, w: 0};

  const rate = (cur, prev, get) => prev
    ? Math.max(0, (get(cur) - get(prev)) / Math.max(0.001, cur.ts - prev.ts))
    : 0;

  const refresh = () => api.get('system/info').then(i => {
    netRate = {rx: rate(i.network_io, prevNet, x => x.rx_bytes),
      tx: rate(i.network_io, prevNet, x => x.tx_bytes)};
    prevNet = i.network_io;
    dioRate = {r: rate(i.disk_io, prevDio, x => x.read_bytes),
      w: rate(i.disk_io, prevDio, x => x.write_bytes)};
    prevDio = i.disk_io;

    body.innerHTML = '';
    const gauges = el('div', {class: 'wsi-dash'});
    const mk = (pct, label, value) => {
      const c = el('canvas', {role: 'img', 'aria-label': `${label}: ${value}`});
      gauge(c, pct, label, value);
      return el('div', {class: 'wsi-gauge'}, c);
    };
    const logPct = (bytes, ceiling) => Math.min(100,
      100 * Math.log10(1 + bytes / 1024) / Math.log10(1 + ceiling / 1024));
    const mb = 1024 * 1024;
    const temp = (i.cpu.temps || [])
      .reduce((m, t) => Math.max(m, t.temp || 0), 0);

    gauges.append(
      mk(i.cpu.percent, `CPU · ${t('sysinfo.cores', {n: i.cpu.count})}`, `${i.cpu.percent.toFixed(0)}%`),
      mk(i.memory.percent,
        `RAM · ${formatBytes(i.memory.used)}/${formatBytes(i.memory.total)}`,
        `${i.memory.percent.toFixed(0)}%`),
      mk(i.root_disk.percent,
        t('sysinfo.diskFree', {size: formatBytes(i.root_disk.total - i.root_disk.used)}),
        `${i.root_disk.percent.toFixed(0)}%`),
      mk(logPct(netRate.rx + netRate.tx, 100 * mb), t('sysinfo.netIO'),
        `\u2193${formatBytes(netRate.rx)}/s \u2191${formatBytes(netRate.tx)}/s`),
      mk(logPct(dioRate.r + dioRate.w, 500 * mb), t('sysinfo.diskIO'),
        `R ${formatBytes(dioRate.r)}/s W ${formatBytes(dioRate.w)}/s`));
    if (temp > 0) {
      gauges.appendChild(mk(Math.min(100, temp), t('sysinfo.cpuTemp'),
        `${temp.toFixed(1)}\u00b0C`));
    }
    body.appendChild(gauges);

    const host = (i.hostname || '').split('.')[0];
    const dom = i.domain || (i.hostname || '').split('.').slice(1).join('.');
    const cards = el('div', {class: 'wsi-cards'});
    cards.append(
      el('div', {class: 'wsi-card'},
        el('h3', {}, t('shell.app.System')),
        el('div', {class: 'wsi-kv'},
          el('b', {}, t('sysinfo.model')), el('span', {}, i.model || '-'),
          el('b', {}, t('sysinfo.machineId')), el('span', {}, i.machine_id || '-'),
          el('b', {}, t('sysinfo.os')), el('span', {}, i.os),
          el('b', {}, 'Kernel'), el('span', {}, i.kernel),
          el('b', {}, t('sysinfo.uptime')), el('span', {}, fmtUptime(i.uptime_seconds)),
          el('b', {}, t('sysinfo.loadAvg')), el('span', {},
            i.cpu.loadavg ? i.cpu.loadavg.map(x => x.toFixed(2)).join('  ') : '-'))),
      el('div', {class: 'wsi-card'},
        el('h3', {}, t('sysinfo.hostConfig')),
        el('div', {class: 'wsi-kv'},
          el('b', {}, t('server.hostname')), el('span', {}, host || i.hostname || '-'),
          el('b', {}, t('sysinfo.domain')), el('span', {}, dom || t('sysinfo.none'))),
        el('div', {style: {marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap'}},
          button(t('server.setHostname'), () => promptText(core, t('server.setHostname'),
            t('sysinfo.hostnamePrompt'), host || '')
            .then(v => v && confirmDialog(core, t('server.setHostname'),
              `hostnamectl set-hostname ${v}?`)
              .then(ok => ok && api.post('system/hostname', {hostname: v})
                .then(() => {
                  sb.set(t('sysinfo.hostnameSet', {name: v})); refresh();
                })
                .catch(e => sb.error(e.message))))))),

      // --- CPU: frequency, per-core usage, sensor temperatures ---
      el('div', {class: 'wsi-card'},
        el('h3', {}, 'CPU'),
        el('div', {class: 'wsi-kv'},
          el('b', {}, t('sysinfo.frequency')), el('span', {},
            i.cpu.freq_mhz ? `${(i.cpu.freq_mhz / 1000).toFixed(2)} GHz` : '-'),
          el('b', {}, t('sysinfo.processes')), el('span', {},
            t('sysinfo.processCount', i.processes))),
        el('div', {class: 'wsi-cores'},
          ...(i.cpu.per_cpu || []).map((p, idx) => el('div', {class: 'wsi-bar'},
            el('span', {class: 'n'}, t('sysinfo.core', {n: idx})),
            el('div', {class: 'tr'},
              el('div', {class: 'f', style: {
                width: `${p.toFixed(0)}%`, background: color(p)}})),
            el('span', {class: 'p'}, `${p.toFixed(0)}%`)))),
        (i.cpu.temps || []).length
          ? el('div', {class: 'wsi-kv', style: {marginTop: '8px'}},
            ...(i.cpu.temps || []).map(t => [
              el('b', {}, t.sensor),
              el('span', {},
                `${(t.temp || 0).toFixed(1)}°C${t.critical
                  ? ` (crit ${t.critical.toFixed(0)}°)` : ''}`)]
            ).flat())
          : null),

      // --- network: throughput + open TCP connections ---
      el('div', {class: 'wsi-card'},
        el('h3', {}, t('server.network')),
        el('div', {class: 'wsi-kv'},
          el('b', {}, t('sysinfo.receive')), el('span', {},
            `${formatBytes(netRate.rx)}/s`),
          el('b', {}, t('sysinfo.transmit')), el('span', {},
            `${formatBytes(netRate.tx)}/s`),
          el('b', {}, 'Total rx/tx'), el('span', {},
            `${formatBytes(i.network_io.rx_bytes)} / ${formatBytes(i.network_io.tx_bytes)}`),
          el('b', {}, t('sysinfo.tcp')), el('span', {},
            typeof i.network_io.connections === 'number'
              ? String(i.network_io.connections) : '-'))),

      // --- memory: swap detail ---
      el('div', {class: 'wsi-card'},
        el('h3', {}, t('sysinfo.memory')),
        el('div', {class: 'wsi-kv'},
          el('b', {}, 'RAM'), el('span', {},
            `${formatBytes(i.memory.used)} / ${formatBytes(i.memory.total)}`),
          el('b', {}, 'Swap'), el('span', {},
            i.memory.swap_total
              ? `${formatBytes(i.memory.swap_used)} / ${formatBytes(i.memory.swap_total)} (${i.memory.swap_percent.toFixed(0)}%)`
              : t('sysinfo.none')))),

      // --- storage: every mounted filesystem ---
      el('div', {class: 'wsi-card'},
        el('h3', {}, t('sysinfo.storage')),
        ...(i.mounts || []).map(m => el('div', {class: 'wsi-bar'},
          el('span', {class: 'n', title: `${m.device} (${m.fstype})`}, m.mount),
          el('div', {class: 'tr'},
            el('div', {class: 'f', style: {
              width: `${m.percent.toFixed(0)}%`,
              background: color(m.percent)}})),
          el('span', {class: 'p', title: m.device},
            `${formatBytes(m.used)}/${formatBytes(m.total)}`))))
    );
    body.appendChild(cards);
    sb.set(t('sysinfo.updated', {time: new Date().toLocaleTimeString(intlLocale(locale()))}));
  }).catch(e => sb.error(e.message));

  createLocalizedWindow(proc, {
    id: 'WebOSSysInfoWindow',
    dimension: {width: 780, height: 640}
  })
    .on('destroy', () => {
      clearInterval(timer); proc.destroy();
    })
    .render($content => {
      $content.appendChild(layout(
        el('div', {class: 'webos-toolbar'},
          el('span', {i18n: 'sysinfo.autoRefresh', style: {color: '#889', fontSize: '11px'}}),
          el('span', {style: {flex: '1'}}),
          button({i18n: 'refresh'}, refresh)),
        el('div', {style: {overflow: 'auto'}}, body), sb));
      refresh();
      timer = setInterval(refresh, 2000);
    });

  return proc;
};

osjs.register(applicationName, register);
