/*
 * Desktop widgets: live system stats pinned to the desktop background
 * (behind windows). Polls the agent via /api/webos/system/info.
 */

const color = pct => pct > 85 ? '#e5534b' : pct > 60 ? '#e8a13f' : '#4fb96f';

const fmtBytes = n => {
  const u = ['B', 'K', 'M', 'G', 'T'];
  let i = 0, v = Number(n) || 0;
  while (v >= 1024 && i < u.length - 1) {
    v /= 1024; i++;
  }
  return `${v.toFixed(v >= 100 || i === 0 ? 0 : 1)}${u[i]}`;
};

const fmtUptime = s => {
  const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600),
    m = Math.floor(s % 3600 / 60);
  return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}m`;
};

const get = path => fetch(`/api/webos/${path}`).then(r => r.json());

export const createWidgets = () => {
  let root = null;
  let timer = null;
  let prevNet = null;
  let rates = {rx: 0, tx: 0};

  const row = (label, val, pct) => {
    const bar = document.createElement('div');
    bar.className = 'ww-bar';
    const fill = document.createElement('div');
    fill.className = 'ww-fill';
    fill.style.width = `${Math.min(100, pct)}%`;
    fill.style.background = color(pct);
    bar.appendChild(fill);
    const r = document.createElement('div');
    r.className = 'ww-row';
    const l = document.createElement('span');
    l.className = 'ww-label';
    l.textContent = label;
    const v = document.createElement('span');
    v.className = 'ww-val';
    v.textContent = val;
    r.append(l, v);
    const wrap = document.createElement('div');
    wrap.className = 'ww-metric';
    wrap.append(r, bar);
    return wrap;
  };

  const tick = () => get('system/info').then(i => {
    if (!root || !document.contains(root)) {
      clearInterval(timer);
      root = null;
      return;
    }
    if (prevNet) {
      const dt = Math.max(0.001, i.network_io.ts - prevNet.ts);
      rates = {
        rx: Math.max(0, (i.network_io.rx_bytes - prevNet.rx_bytes) / dt),
        tx: Math.max(0, (i.network_io.tx_bytes - prevNet.tx_bytes) / dt)
      };
    }
    prevNet = i.network_io;

    const body = root.querySelector('.ww-body');
    body.innerHTML = '';
    body.append(
      row('CPU', `${i.cpu.percent.toFixed(0)}%`, i.cpu.percent),
      row('RAM', `${fmtBytes(i.memory.used)}/${fmtBytes(i.memory.total)}`,
        i.memory.percent),
      row('DISK', `${i.root_disk.percent.toFixed(0)}%`, i.root_disk.percent),
      row('NET', `\u2193${fmtBytes(rates.rx)}/s \u2191${fmtBytes(rates.tx)}/s`,
        Math.min(100, (rates.rx + rates.tx) / (100 * 1024 * 1024) * 100)));
    root.querySelector('.ww-foot').textContent =
      `${i.hostname} \u00B7 up ${fmtUptime(i.uptime_seconds)}`;
  }).catch(() => {});

  const build = () => {
    if (root) {
      return root.parentNode;
    }
    // stack wraps every desktop widget — spacing handled by flex gap
    const stack = document.createElement('div');
    stack.className = 'webos-widget-stack';
    root = document.createElement('div');
    root.className = 'webos-widgets';
    const head = document.createElement('div');
    head.className = 'ww-head';
    head.textContent = 'System';
    const body = document.createElement('div');
    body.className = 'ww-body';
    const foot = document.createElement('div');
    foot.className = 'ww-foot';
    root.append(head, body, foot);
    stack.appendChild(root);

    // .osjs-contents holds the iconview + windows: appended last, the
    // stack sits above the icons and below any window by DOM order
    const desktop = document.querySelector('.osjs-contents') || document.body;
    desktop.appendChild(stack);
    timer = setInterval(tick, 2000);
    tick();
    return stack;
  };

  return {build};
};
