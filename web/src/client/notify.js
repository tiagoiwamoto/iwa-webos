/*
 * Notification center widget: a bell card pinned below the System
 * widget (inside .webos-widget-stack). Polls /api/webos/notifications
 * and opens a popup with important events — alert breaches, failed
 * units, journal errors, pending updates and overdue backups.
 * Clicking an item opens the related app.
 */
import {useI18n} from '../packages/_shared/i18n.js';

const SEV_ICON = {critical: '\u{1F534}', warning: '\u{1F7E0}',
  info: '\u{1F535}'};
const KIND_APP = {alert: 'WebOSAlerts', updates: 'WebOSUpdate',
  unit: 'WebOSServices', log: 'WebOSLogs', backup: 'WebOSBackup'};

const body = (t, it) => {
  const p = it.params || {};
  switch (it.kind) {
    case 'alert':
      return t('ntf.alert', {metric: p.metric, value: p.value,
        threshold: p.threshold});
    case 'updates':
      return t('ntf.updates', {count: p.count});
    case 'unit':
      return p.name && p.name !== p.unit
        ? `${p.unit} — ${p.name}` : p.unit;
    case 'log':
      return p.msg || p.unit || '';
    case 'backup':
      return p.last
        ? t('ntf.backupLast', {days: p.days})
        : t('ntf.backupNever');
    default:
      return '';
  }
};

export const createNotifyWidget = core => {
  const {t} = useI18n(core);
  let card = null;
  let popup = null;
  let timer = null;
  let items = [];
  const dismissed = new Set();

  const visible = () => items.filter(i => !dismissed.has(i.id));

  const drawPopup = () => {
    if (!popup) {
      return;
    }
    const list = popup.querySelector('.wn-list');
    list.innerHTML = '';
    const vis = visible();
    if (!vis.length) {
      const empty = document.createElement('div');
      empty.className = 'wn-empty';
      empty.textContent = '\u{2705} ' + t('ntf.clear');
      list.appendChild(empty);
      return;
    }
    vis.forEach(it => {
      const row = document.createElement('div');
      row.className = `wn-item sev-${it.severity}`;
      const dot = document.createElement('span');
      dot.className = 'wn-dot';
      dot.textContent = SEV_ICON[it.severity] || SEV_ICON.info;
      const txt = document.createElement('div');
      txt.className = 'wn-txt';
      const title = document.createElement('div');
      title.className = 'wn-title';
      title.textContent = t('ntf.k.' + it.kind);
      const desc = document.createElement('div');
      desc.className = 'wn-desc';
      desc.textContent = body(t, it);
      txt.append(title, desc);
      const close = document.createElement('button');
      close.className = 'wn-x';
      close.textContent = '\u{00D7}';
      close.title = t('ntf.dismiss');
      close.addEventListener('click', ev => {
        ev.stopPropagation();
        dismissed.add(it.id);
        paint();
      });
      row.append(dot, txt, close);
      row.addEventListener('click', () => {
        const app = KIND_APP[it.kind];
        if (app) {
          core.run(app).catch(() => {});
        }
      });
      list.appendChild(row);
    });
  };

  const paint = () => {
    if (!card) {
      return;
    }
    const vis = visible();
    const count = card.querySelector('.wn-count');
    count.textContent = vis.length || '';
    count.dataset.sev = vis.some(i => i.severity === 'critical')
      ? 'critical'
      : vis.some(i => i.severity === 'warning') ? 'warning' : '';
    card.querySelector('.wn-sub').textContent = vis.length
      ? t('ntf.count', {count: vis.length})
      : t('ntf.clearShort');
    drawPopup();
  };

  const refresh = () => fetch('/api/webos/notifications')
    .then(r => r.json())
    .then(d => {
      items = d.items || [];
      paint();
    })
    .catch(() => {});

  const open = () => {
    popup = document.createElement('div');
    popup.className = 'wn-popup';
    const head = document.createElement('div');
    head.className = 'wn-head';
    head.textContent = t('ntf.title');
    const list = document.createElement('div');
    list.className = 'wn-list';
    popup.append(head, list);
    card.appendChild(popup);
    drawPopup();
    refresh();
  };

  const toggle = () => {
    if (popup) {
      popup.remove();
      popup = null;
    } else {
      open();
    }
  };

  const build = parent => {
    if (card) {
      return;
    }
    card = document.createElement('div');
    card.className = 'webos-notify';

    const bell = document.createElement('span');
    bell.className = 'wn-bell';
    bell.textContent = '\u{1F514}';
    const mid = document.createElement('div');
    mid.className = 'wn-mid';
    const name = document.createElement('div');
    name.className = 'wn-name';
    name.textContent = t('ntf.title');
    const sub = document.createElement('div');
    sub.className = 'wn-sub';
    sub.textContent = t('ntf.clearShort');
    mid.append(name, sub);
    const count = document.createElement('span');
    count.className = 'wn-count';
    card.append(bell, mid, count);
    card.addEventListener('click', toggle);
    parent.appendChild(card);

    document.addEventListener('click', ev => {
      if (popup && !card.contains(ev.target)) {
        popup.remove();
        popup = null;
      }
    });

    refresh();
    timer = setInterval(refresh, 60000);
  };

  const destroy = () => {
    clearInterval(timer);
    card = null;
    popup = null;
    items = [];
    dismissed.clear();
  };

  return {build, destroy};
};
