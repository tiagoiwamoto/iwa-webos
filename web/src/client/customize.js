/*
 * Desktop customization helpers:
 *  - "Add app shortcut…" desktop context-menu entry writing to
 *    home:/.desktop/.shortcuts.json (the OS.js iconview watches the dir
 *    and reloads itself)
 *  - App picker overlay (reused by dock pin + shortcut flows)
 *  - "Customize…" dialog: window theme, dock geometry/magnify,
 *    desktop icons toggle — the detailed form behind the quick actions
 */
import {useI18n, metaTitle} from '../packages/_shared/i18n.js';
import {allDockItems, HIDDEN_APPS} from './dock-items.js';

const S_KEY = 'osjs/desktop';

const getSetting = (core, key, dflt) => {
  try {
    return core.make('osjs/settings').get(S_KEY, key, dflt);
  } catch (e) {
    return dflt;
  }
};

export const setSetting = (core, key, val) =>
  core.make('osjs/settings').set(S_KEY, key, val).save();

// installed OS.js applications (metadata objects), minus hidden helpers
export const installedApps = core =>
  core.make('osjs/packages').getPackages(m => m.type === 'application' &&
    !HIDDEN_APPS.includes(m.name));

const iconUrl = (core, meta) => {
  const item = allDockItems(core).find(i => i.name === meta.name);
  const names = [];
  if (item && item.icon) names.push(item.icon);
  if (typeof meta.icon === 'string') names.push(meta.icon);
  for (const name of names) {
    try {
      const url = core.make('osjs/theme').icon(name);
      if (url) return url;
    } catch (e) { /* try next name */ }
  }
  return (meta.icon && meta.icon.src) || null;
};

// ---------------------------------------------------------------------------
// app picker overlay — one click = one action

export const pickApp = (core, onPick) => {
  const {t} = useI18n(core);
  const overlay = document.createElement('div');
  overlay.className = 'webos-launcher';
  const close = () => overlay.remove();
  overlay.addEventListener('click', ev => ev.target === overlay && close());
  const onKey = ev => ev.key === 'Escape' && close();
  document.addEventListener('keydown', onKey);
  overlay.addEventListener('DOMNodeRemoved', () =>
    document.removeEventListener('keydown', onKey));

  const search = document.createElement('input');
  search.className = 'webos-launcher-search';
  search.placeholder = t('cust.pickApp');

  const grid = document.createElement('div');
  grid.className = 'webos-launcher-grid';
  const paint = () => {
    const q = search.value.toLowerCase();
    grid.innerHTML = '';
    installedApps(core)
      .filter(m => !q || (m.name + metaTitle(core, m))
        .toLowerCase().includes(q))
      .forEach(m => {
        const node = document.createElement('div');
        node.className = 'webos-launcher-item';
        const glyph = document.createElement('span');
        glyph.className = 'glyph';
        glyph.textContent = '\u{1F4E6}';
        const url = iconUrl(core, m);
        if (url) {
          const img = document.createElement('img');
          img.src = url;
          img.onerror = () => img.replaceWith(glyph);
          node.appendChild(img);
        } else {
          node.appendChild(glyph);
        }
        const label = document.createElement('div');
        label.className = 'lbl';
        label.textContent = metaTitle(core, m);
        node.appendChild(label);
        node.addEventListener('click', () => {
          close();
          onPick(m);
        });
        grid.appendChild(node);
      });
  };
  search.addEventListener('input', paint);
  paint();
  overlay.append(search, grid);
  document.body.appendChild(overlay);
  search.focus();
};

// ---------------------------------------------------------------------------
// desktop shortcuts — home:/.desktop/.shortcuts.json

const DESKTOP_DIR = {path: 'home:/.desktop'};
const SHORTCUTS_FILE = {path: 'home:/.desktop/.shortcuts.json'};

export const addAppShortcut = (core, meta) => {
  const {t} = useI18n(core);
  const vfs = core.make('osjs/vfs');
  const entry = {filename: meta.name, mime: 'osjs/application',
    icon: iconUrl(core, meta)};
  return vfs.mkdir(DESKTOP_DIR).catch(() => {})
    .then(() => vfs.readfile(SHORTCUTS_FILE).catch(() => '[]'))
    .then(txt => {
      let arr = [];
      try {
        arr = JSON.parse(txt) || [];
      } catch (e) { /* keep [] */ }
      if (!arr.some(e => e.filename === meta.name)) {
        arr.push(entry);
      }
      return vfs.writefile(SHORTCUTS_FILE, JSON.stringify(arr));
    })
    .then(() => {
      try {
        core.make('osjs/notification',
          {title: t('cust.shortcutAdded', {name: metaTitle(core, meta)})});
      } catch (e) { /* notification service optional */ }
    })
    .catch(() => {});
};

export const removeAppShortcut = (core, filename) => {
  const vfs = core.make('osjs/vfs');
  return vfs.readfile(SHORTCUTS_FILE).catch(() => '[]')
    .then(txt => {
      let arr = [];
      try {
        arr = JSON.parse(txt) || [];
      } catch (e) { /* keep [] */ }
      return vfs.writefile(SHORTCUTS_FILE,
        JSON.stringify(arr.filter(e => e.filename !== filename)));
    })
    .catch(() => {});
};

// ---------------------------------------------------------------------------
// desktop context-menu entries — registered once per session

export const setupDesktopExtras = core => {
  const {t, onLocale} = useI18n(core);
  let added = false;

  const entries = () => [
    {label: t('cust.addShortcut'),
      onclick: () => pickApp(core, m => addAppShortcut(core, m))},
    {label: t('cust.customize'), onclick: () => openCustomize(core)}
  ];

  const install = () => {
    if (added) {
      return;
    }
    added = true;
    try {
      core.make('osjs/desktop').addContextMenuEntries(entries);
    } catch (e) { /* desktop contract not ready yet */ }
  };

  core.on('osjs/core:started', install);
  onLocale(() => { /* labels resolve per-render via t() */ });
};

// ---------------------------------------------------------------------------
// "Customize…" dialog — appearance + dock sections in one modal

export const openCustomize = core => {
  const {t} = useI18n(core);
  if (document.querySelector('.webos-cust')) {
    return;
  }
  const overlay = document.createElement('div');
  overlay.className = 'webos-cust';
  const close = () => overlay.remove();
  overlay.addEventListener('click', ev => ev.target === overlay && close());
  const onKey = ev => ev.key === 'Escape' && close();
  document.addEventListener('keydown', onKey);
  overlay.addEventListener('DOMNodeRemoved', () =>
    document.removeEventListener('keydown', onKey));

  const box = document.createElement('div');
  box.className = 'webos-cust-box';
  const h = document.createElement('h4');
  h.textContent = t('cust.customize');
  box.appendChild(h);

  const row = (label, input) => {
    const r = document.createElement('div');
    r.className = 'row';
    const l = document.createElement('label');
    l.textContent = label;
    r.append(l, input);
    return r;
  };
  const sel = (options, val, onchange) => {
    const s = document.createElement('select');
    options.forEach(([v, l]) => {
      const o = document.createElement('option');
      o.value = v;
      o.textContent = l;
      s.appendChild(o);
    });
    s.value = val;
    s.addEventListener('change', () => onchange(s.value));
    return s;
  };
  const range = (min, max, val, onchange) => {
    const r = document.createElement('input');
    r.type = 'range';
    r.min = min;
    r.max = max;
    r.value = val;
    const span = document.createElement('span');
    span.textContent = `${val}px`;
    r.addEventListener('input', () => {
      span.textContent = `${r.value}px`;
      onchange(Number(r.value));
    });
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex:1;gap:8px;align-items:center';
    wrap.append(r, span);
    return wrap;
  };
  const check = (val, onchange) => {
    const c = document.createElement('input');
    c.type = 'checkbox';
    c.checked = !!val;
    c.addEventListener('change', () => onchange(c.checked));
    return c;
  };

  const WM = [['', 'Standard'], ['macos', 'macOS'], ['win11', 'Windows 11'],
    ['kde', 'KDE Breeze'], ['gnome', 'GNOME']];
  const POS = [['bottom', t('cust.posBottom')],
    ['left', t('cust.posLeft')], ['right', t('cust.posRight')]];

  const iv = getSetting(core, 'iconview', {}) || {};
  box.append(
    row(t('cust.wmTheme'), sel(WM,
      getSetting(core, 'webos.wm', 'win11'),
      v => setSetting(core, 'webos.wm', v))),
    row(t('cust.winBtns'), range(10, 24,
      Number(getSetting(core, 'webos.wbtn', 14)) || 14,
      v => setSetting(core, 'webos.wbtn', v))),
    row(t('cust.dockSize'), range(32, 72,
      Number(getSetting(core, 'webos.docksize', 48)) || 48,
      v => setSetting(core, 'webos.docksize', v))),
    row(t('cust.dockPos'), sel(POS,
      getSetting(core, 'webos.dockpos', 'bottom'),
      v => setSetting(core, 'webos.dockpos', v))),
    row(t('cust.magnify'), check(
      getSetting(core, 'webos.magnify', true),
      v => setSetting(core, 'webos.magnify', v))),
    row(t('cust.desktopIcons'), check(
      iv.enabled !== false,
      v => setSetting(core, 'iconview',
        Object.assign({}, iv, {enabled: v,
          path: iv.path || 'home:/.desktop'}))
        .then(() => {
          try {
            core.make('osjs/desktop').applySettings();
          } catch (e) { /* desktop not ready */ }
        }))));

  const b = document.createElement('button');
  b.className = 'webos-btn';
  b.textContent = t('cust.manageDock');
  b.addEventListener('click', () => {
    close();
    openDockManager(core);
  });
  box.appendChild(b);

  overlay.appendChild(box);
  document.body.appendChild(overlay);
};

// ---------------------------------------------------------------------------
// dock manager — checklist of installed apps (the detailed form)

export const openDockManager = core => {
  const {t} = useI18n(core);
  if (document.querySelector('.webos-dockmgr')) {
    return;
  }
  const overlay = document.createElement('div');
  overlay.className = 'webos-cust webos-dockmgr';
  const close = () => overlay.remove();
  overlay.addEventListener('click', ev => ev.target === overlay && close());

  const box = document.createElement('div');
  box.className = 'webos-cust-box';
  const h = document.createElement('h4');
  h.textContent = t('cust.manageDock');
  const list = document.createElement('div');
  list.className = 'webos-dockmgr-list';
  box.append(h, list);

  const pinned = () => getSetting(core, 'webos.dock', null);
  const current = () => pinned() ||
    allDockItems(core).map(i => i.name);

  const save = names => setSetting(core, 'webos.dock', names);

  const paint = () => {
    const cur = current();
    list.innerHTML = '';
    cur.forEach(name => {
      const r = document.createElement('div');
      r.className = 'row';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = true;
      const meta = installedApps(core).find(m => m.name === name);
      const lbl = document.createElement('label');
      lbl.style.flex = '1';
      lbl.textContent = meta ? metaTitle(core, meta) : name;
      const mv = dir => {
        const arr = current().slice();
        const i = arr.indexOf(name);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= arr.length) {
          return;
        }
        [arr[i], arr[j]] = [arr[j], arr[i]];
        save(arr);
      };
      const up = document.createElement('button');
      up.className = 'webos-btn';
      up.textContent = '↑';
      up.addEventListener('click', () => mv(-1));
      const dn = document.createElement('button');
      dn.className = 'webos-btn';
      dn.textContent = '↓';
      dn.addEventListener('click', () => mv(1));
      cb.addEventListener('change', () => {
        if (!cb.checked) {
          save(current().filter(n => n !== name));
        }
      });
      r.append(cb, lbl, up, dn);
      list.appendChild(r);
    });
    // not-pinned apps get an "add" row at the bottom
    installedApps(core)
      .filter(m => !current().includes(m.name))
      .forEach(m => {
        const r = document.createElement('div');
        r.className = 'row';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = false;
        const lbl = document.createElement('label');
        lbl.style.flex = '1';
        lbl.textContent = metaTitle(core, m);
        cb.addEventListener('change', () => {
          if (cb.checked) {
            save([...current(), m.name]);
          }
        });
        r.append(cb, lbl);
        list.appendChild(r);
      });
  };

  const foot = document.createElement('div');
  foot.className = 'webos-cust-foot';
  const reset = document.createElement('button');
  reset.className = 'webos-btn';
  reset.textContent = t('cust.resetDock');
  reset.addEventListener('click', () => {
    save(allDockItems(core).map(i => i.name));
    paint();
  });
  const done = document.createElement('button');
  done.className = 'webos-btn primary';
  done.textContent = t('close');
  done.addEventListener('click', close);
  foot.append(reset, done);
  box.appendChild(foot);

  overlay.appendChild(box);
  document.body.appendChild(overlay);
  paint();

  // rows re-render when the dock rebuilds after each settings save
  core.on('osjs/settings:save', function onSave() {
    if (!overlay.isConnected) {
      core.off('osjs/settings:save', onSave);
      return;
    }
    paint();
  });
};
