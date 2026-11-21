/*
 * macOS-style floating dock: pinned launchers + running indicators +
 * cursor-proximity magnification. Appended to <body> after login so it
 * never blocks the auth screen; removed on logout.
 */
import {useI18n, LOCALES, setLocale, getLocale, intlLocale, metaTitle}
  from '../packages/_shared/i18n.js';
import {allDockItems, dockItemFor, DEFAULT_DOCK, HIDDEN_APPS}
  from './dock-items.js';
import {pickApp, openCustomize, openDockManager, setSetting}
  from './customize.js';


const BASE = 48;      // px icon size at rest
const RANGE = 120;    // px falloff radius
const FONTPCT = 0.62; // glyph font-size as fraction of item size

const dockCfg = core => {
  const s = core.make('osjs/settings');
  const get = (k, d) => s.get('osjs/desktop', k, d);
  return {
    items: get('webos.dock', null),
    size: Number(get('webos.docksize', 0)) || BASE,
    pos: get('webos.dockpos', 'bottom') || 'bottom',
    magnify: get('webos.magnify', true) !== false
  };
};

const DOCK_LAYOUT_V = 2; // bump to re-apply the default once per install

const dockItems = core => {
  const all = allDockItems(core);
  const s = core.make('osjs/settings');
  let names = s.get('osjs/desktop', 'webos.dock', null);
  // one-time migration: any dock saved by an older layout (incl. the
  // Dock Manager's "pin everything") resets to the clean default; the
  // version flag lets later user customizations win
  if ((s.get('osjs/desktop', 'webos.dockv', 0) || 0) < DOCK_LAYOUT_V) {
    names = DEFAULT_DOCK;
    s.set('osjs/desktop', 'webos.dock', DEFAULT_DOCK);
    s.set('osjs/desktop', 'webos.dockv', DOCK_LAYOUT_V);
    s.save();
  }
  const list = Array.isArray(names) ? names : DEFAULT_DOCK;
  return list.map(n => all.find(i => i.name === n) || dockItemFor(n));
};


const applyAppearance = core => {
  let wm = 'win11', wbtn = 14;
  try {
    const s = core.make('osjs/settings');
    wm = s.get('osjs/desktop', 'webos.wm') || 'win11';
    wbtn = Number(s.get('osjs/desktop', 'webos.wbtn')) || 14;
  } catch (e) {
    try {
      const a = JSON.parse(localStorage.getItem('webos-appearance')) || {};
      wm = a.wm || 'win11';
      wbtn = a.wbtn || 14;
    } catch (e2) { /* defaults */ }
  }
  document.body.dataset.wm = wm;
  document.body.style.setProperty('--wbtn-size', `${wbtn}px`);
};

export const createDock = core => {
  let dock = null;
  let popover = null;
  const running = new Set();
  const {t, onLocale} = useI18n(core);

  const themeIcon = name => {
    try {
      return core.make('osjs/theme').icon(name);
    } catch (e) {
      return null;
    }
  };

  const itemIcon = item => {
    const span = document.createElement('span');
    span.className = 'glyph';
    span.textContent = item.glyph || '?';
    if (item.iconUrl) {
      const img = document.createElement('img');
      img.src = item.iconUrl;
      img.onerror = () => {
        img.replaceWith(span);
      };
      return img;
    }
    if (item.icon) {
      const src = themeIcon(item.icon);
      if (src) {
        const img = document.createElement('img');
        img.src = src;
        img.onerror = () => {
          img.replaceWith(span);
        };
        return img;
      }
    }
    return span;
  };

  const sizeOf = (node, size) => {
    node.style.width = `${size}px`;
    node.style.height = `${size}px`;
    node.style.fontSize = `${size * FONTPCT}px`;
  };

  // magnify the ICON only (scale transform) — the dock strip never resizes
  const magnify = ev => {
    if (!dockCfg(core).magnify) {
      return;
    }
    dock.querySelectorAll('.webos-dock-item[data-app]').forEach(node => {
      const icon = node.firstChild;
      const r = node.getBoundingClientRect();
      const d = Math.abs(ev.clientX - (r.left + r.width / 2));
      const f = Math.max(0, 1 - d / RANGE);
      icon.style.transform =
        `translateY(${-10 * f * f}px) scale(${1 + 0.5 * f * f})`;
    });
  };

  const reset = () => {
    dock.querySelectorAll('.webos-dock-item').forEach(node => {
      if (node.firstChild) {
        node.firstChild.style.transform = '';
      }
    });
  };

  const windowsFor = name => [...running]
    .filter(proc => proc.metadata.name === name && !proc.destroyed)
    .flatMap(proc => proc.windows)
    .filter(win => !win.destroyed);

  const activate = (name, ev) => {
    const windows = windowsFor(name);
    const focus = win => {
      win.raise();
      win.focus();
    };
    if (windows.length === 1) {
      focus(windows[0]);
    } else if (windows.length > 1) {
      core.make('osjs/contextmenu').show({position: ev, menu: windows.map(win => ({
        label: win.state.title || name,
        onclick: () => focus(win)
      }))});
    } else {
      core.run(name).catch(() => {});
    }
  };

  const paint = () => {
    if (!dock) {
      return;
    }
    const shown = new Set();
    dock.querySelectorAll('.webos-dock-item[data-app]').forEach(node => {
      const name = node.dataset.app;
      const hasWindows = windowsFor(name).length > 0;
      if (node.dataset.unpinned && !hasWindows) {
        node.remove();
        return;
      }
      shown.add(name);
      node.classList.toggle('running', hasWindows);
    });
    const tray = dock.querySelector('.webos-dock-tray');
    const items = allDockItems(core);
    running.forEach(proc => {
      const name = proc.metadata.name;
      if (!shown.has(name) && windowsFor(name).length) {
        const item = items.find(item => item.name === name) || dockItemFor(name);
        const node = appButton(item, dockCfg(core).size);
        node.dataset.unpinned = 'true';
        node.classList.add('running');
        dock.insertBefore(node, tray);
        shown.add(name);
      }
    });
  };

  // GNOME-style fullscreen app grid
  const openLauncher = () => {
    if (document.querySelector('.webos-launcher')) {
      return;
    }
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
    search.placeholder = t('shell.search');

    const grid = document.createElement('div');
    grid.className = 'webos-launcher-grid';
    const paint = () => {
      const q = search.value.toLowerCase();
      grid.innerHTML = '';
      core.make('osjs/packages')
        .getPackages(m => m.type === 'application' &&
          !HIDDEN_APPS.includes(m.name))
        .filter(m => !q || (m.name + metaTitle(core, m))
          .toLowerCase().includes(q))
        .forEach(m => {
          const item = allDockItems(core).find(i => i.name === m.name);
          const node = document.createElement('div');
          node.className = 'webos-launcher-item';
          node.appendChild(item ? itemIcon(item)
            : Object.assign(document.createElement('span'),
              {className: 'glyph', textContent: '\u{1F4E6}'}));
          const label = document.createElement('div');
          label.className = 'lbl';
          label.textContent = metaTitle(core, m);
          node.appendChild(label);
          node.addEventListener('click', ev => {
            close();
            activate(m.name, ev);
          });
          node.addEventListener('contextmenu', ev => {
            ev.preventDefault();
            ev.stopPropagation();
            core.make('osjs/contextmenu').show({position: ev, menu: [
              {label: t('cust.addToDock'), onclick: () => {
                const cur = dockCfg(core).items ||
                  allDockItems(core).map(i => i.name);
                if (!cur.includes(m.name)) {
                  setSetting(core, 'webos.dock', [...cur, m.name]);
                }
              }}
            ]});
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

  const appButton = (item, size, pinned = false) => {
    const node = document.createElement('div');
    node.className = 'webos-dock-item';
    node.dataset.app = item.name;
    node.title = t('shell.app.' + item.label);
    if (node.title === 'shell.app.' + item.label) {
      try {
        const meta = core.make('osjs/packages')
          .getPackages(m => m.name === item.name)[0];
        node.title = meta ? metaTitle(core, meta) : item.label;
      } catch (e) {
        node.title = item.label;
      }
    }
    node.appendChild(itemIcon(item));
    node.addEventListener('click', ev => {
      node.classList.remove('bounce');
      void node.offsetWidth;
      node.classList.add('bounce');
      activate(item.name, ev);
    });
    sizeOf(node, size);
    if (pinned) {
      node.addEventListener('contextmenu', ev => {
        ev.preventDefault();
        ev.stopPropagation();
        core.make('osjs/contextmenu').show({position: ev, menu: [
          {label: t('cust.removeDock'), onclick: () =>
            setSetting(core, 'webos.dock',
              dockItems(core).map(i => i.name)
                .filter(n => n !== item.name))}
        ]});
      });
    }
    return node;
  };

  const build = () => {
    const cfg = dockCfg(core);
    dock = document.createElement('div');
    dock.className = 'webos-dock pos-' + cfg.pos;

    // brand/start button opens the app launcher
    const brand = document.createElement('div');
    brand.className = 'webos-dock-item';
    brand.dataset.app = 'Malta OS';
    brand.title = 'Malta OS';
    const brandImg = document.createElement('img');
    brandImg.src = '/icone.png';
    brand.appendChild(brandImg);
    sizeOf(brand, cfg.size);
    brand.addEventListener('click', () => openLauncher());
    dock.appendChild(brand);
    dock.appendChild(Object.assign(document.createElement('div'),
      {className: 'webos-dock-sep'}));

    dockItems(core).forEach(item => dock.appendChild(appButton(item, cfg.size, true)));
    // --- tray: appearance settings + clock ---
    const tray = document.createElement('div');
    tray.className = 'webos-dock-tray';

    const clock = document.createElement('div');
    clock.className = 'webos-dock-clock';
    const tick = () => {
      const loc = intlLocale(getLocale(core));
      const d = new Date();
      clock.textContent = d.toLocaleTimeString(loc, {hour: '2-digit', minute: '2-digit'});
      clock.title = d.toLocaleDateString(loc, {weekday: 'long', day: 'numeric',
        month: 'long', year: 'numeric'});
    };
    tick();
    setInterval(tick, 1000);

    const power = document.createElement('div');
    power.className = 'webos-dock-item';
    power.title = t('shell.session');
    power.innerHTML = '<svg viewBox="0 0 24 24" fill="none" ' +
      'stroke="#fff" stroke-width="2.4" stroke-linecap="round" ' +
      'style="width:52%;height:52%"><path d="M12 3v8"/>' +
      '<path d="M6.3 6.5a8 8 0 1 0 11.4 0"/></svg>';
    sizeOf(power, cfg.size * 0.7);
    power.addEventListener('click', ev => {
      ev.stopPropagation();
      toggleSessionMenu();
    });

    tray.append(clock, power);
    dock.appendChild(tray);

    dock.addEventListener('mousemove', magnify);
    dock.addEventListener('mouseleave', reset);
    dock.addEventListener('contextmenu', ev => {
      if (ev.target !== dock) {
        return;
      }
      ev.preventDefault();
      core.make('osjs/contextmenu').show({position: ev, menu: [
        {label: t('cust.addToDock'), onclick: () =>
          pickApp(core, m =>
            setSetting(core, 'webos.dock',
              [...dockItems(core).map(i => i.name), m.name]))},
        {label: t('cust.manageDock'), onclick: () => openDockManager(core)},
        {label: t('cust.customize'), onclick: () => openCustomize(core)}
      ]});
    });
    document.body.appendChild(dock);
    requestAnimationFrame(() => dock.classList.add('visible'));
    paint();
  };

  const toggleSessionMenu = () => {
    if (popover) {
      popover.remove();
      popover = null;
      return;
    }
    popover = document.createElement('div');
    popover.className = 'webos-dock-popover webos-dock-menu';
    const item = (label, fn) => {
      const b = document.createElement('button');
      b.textContent = label;
      b.addEventListener('click', () => {
        popover.remove();
        popover = null;
        fn();
      });
      return b;
    };
    const langRow = document.createElement('div');
    langRow.className = 'row';
    const langLabel = document.createElement('label');
    langLabel.textContent = '\u{1F310} ' + t('shell.language');
    const langSel = document.createElement('select');
    LOCALES.forEach(l => {
      const o = document.createElement('option');
      o.value = l.id;
      o.textContent = l.label;
      langSel.appendChild(o);
    });
    langSel.value = getLocale(core);
    langSel.addEventListener('click', ev => ev.stopPropagation());
    langSel.addEventListener('change', () => setLocale(core, langSel.value));
    langRow.append(langLabel, langSel);
    popover.append(
      langRow,
      item('\u{1F3A8}  ' + t('cust.customize'), () => openCustomize(core)),
      item('\u{1F4BE}  ' + t('shell.saveSession'), () =>
        core.make('osjs/session').save()),
      item('\u{1F511}  ' + t('shell.logout'), () =>
        core.make('osjs/auth').logout()));
    dock.appendChild(popover);
    document.addEventListener('click', function close(ev) {
      if (popover && !popover.contains(ev.target)) {
        popover.remove();
        popover = null;
        document.removeEventListener('click', close);
      }
    });
  };

  core.on('osjs/application:launched', (name, proc) => {
    if (!proc || proc.destroyed) {
      return;
    }
    running.add(proc);
    proc.on('create-window', paint);
    paint();
  });
  core.on('osjs/application:destroy', proc => {
    running.delete(proc);
    paint();
  });
  core.on('osjs/window:destroy', paint);
  core.on('osjs/core:logged-in', build);
  // the packages provider only exists after boot completes; rebuild once
  // so user-pinned apps resolve their real icon/title
  core.on('osjs/core:started', () => {
    if (dock) {
      dock.remove();
      dock = null;
      build();
    }
  });
  core.on('osjs/core:logged-out', () => {
    if (dock) {
      dock.remove();
      dock = null;
    }
    if (popover) {
      popover.remove();
      popover = null;
    }
    running.clear();
  });

  // language switch rebuilds the dock so labels/clock pick the new locale
  onLocale(() => {
    if (dock) {
      popover = null;
      dock.remove();
      dock = null;
      build();
    }
  });

  const apply = () => applyAppearance(core);
  core.on('osjs/settings:save', apply);
  core.on('osjs/settings:load', apply);
  apply();

  // dock geometry/items live in settings too — rebuild on save
  core.on('osjs/settings:save', () => {
    if (dock) {
      popover = null;
      dock.remove();
      dock = null;
      build();
    }
  });
};
