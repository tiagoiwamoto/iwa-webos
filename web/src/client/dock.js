/*
 * macOS-style floating dock: pinned launchers + running indicators +
 * cursor-proximity magnification. Appended to <body> after login so it
 * never blocks the auth screen; removed on logout.
 */

const ITEMS = [
  {name: 'WebOSTerminal', glyph: '\u{1F4BB}', icon: 'utilities-terminal', label: 'Terminal'},
  {name: 'WebOSProcesses', glyph: '\u{1F4C8}', icon: 'utilities-system-monitor', label: 'Tasks'},
  {name: 'WebOSServices', glyph: '\u2699\uFE0F', icon: 'applications-system', label: 'Services'},
  {name: 'WebOSDocker', glyph: '\u{1F433}', label: 'Docker'},
  {name: 'WebOSStore', glyph: '\u{1F6D2}', icon: 'system-software-install', label: 'App Store'},
  {name: 'WebOSDisks', glyph: '\u{1F4BD}', icon: 'drive-harddisk', label: 'Disks'},
  {name: 'WebOSUsers', glyph: '\u{1F464}', icon: 'system-users', label: 'Users'},
  {name: 'FileManager', glyph: '\u{1F4C1}', icon: 'system-file-manager', label: 'Files'},
  {name: 'WebOSEditor', glyph: '\u{1F4DD}', icon: 'text-editor', label: 'Editor'},
  {name: 'WebOSSysInfo', glyph: '\u{1F4CA}', icon: 'utilities-system-monitor', label: 'System'},
  {name: 'WebOSLogs', glyph: '\u{1F4DC}', icon: 'text-x-generic', label: 'Logs'},
  {name: 'WebOSCron', glyph: '\u23F0', icon: 'x-office-calendar', label: 'Cron'},
  {name: 'WebOSRemote', glyph: '\u{1F310}', icon: 'network-server', label: 'Remote'},
  {name: 'WebOSBrowser', glyph: '\u{1F9ED}', icon: 'web-browser', label: 'Navigator'},
  {name: 'WebOSBackup', glyph: '\u{2601}\u{FE0F}', icon: 'folder-remote', label: 'Backup'},
  {name: 'Settings', glyph: '\u{1F527}', icon: 'preferences-system', label: 'Settings'}
];

const BASE = 48;      // px icon size at rest
const BOOST = 34;     // px extra size at the cursor
const RANGE = 120;    // px falloff radius
const FONTPCT = 0.62; // glyph font-size as fraction of item size

const WM_THEMES = [['', 'Standard'], ['macos', 'macOS'],
  ['win11', 'Windows 11'], ['kde', 'KDE Breeze'], ['gnome', 'GNOME']];

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
  const running = new Map(); // app name -> instance count

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
      img.onerror = () => { img.replaceWith(span); };
      return img;
    }
    if (item.icon) {
      const src = themeIcon(item.icon);
      if (src) {
        const img = document.createElement('img');
        img.src = src;
        img.onerror = () => { img.replaceWith(span); };
        return img;
      }
    }
    return span;
  };

  const sizeOf = (node, size) => {
    node.style.width = node.style.height = `${size}px`;
    node.style.fontSize = `${size * FONTPCT}px`;
  };

  // magnify the ICON only (scale transform) — the dock strip never resizes
  const magnify = ev => {
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

  const paint = () => {
    if (!dock) {
      return;
    }
    dock.querySelectorAll('.webos-dock-item').forEach(node => {
      node.classList.toggle('running', !!running.get(node.dataset.app));
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
    search.placeholder = 'Type to search...';

    const grid = document.createElement('div');
    grid.className = 'webos-launcher-grid';
    const paint = () => {
      const q = search.value.toLowerCase();
      grid.innerHTML = '';
      core.make('osjs/packages').getPackages(m => m.type === 'application')
        .filter(m => !q || (m.name + (m.title && m.title.en_EN || ''))
          .toLowerCase().includes(q))
        .forEach(m => {
          const item = ITEMS.find(i => i.name === m.name);
          const node = document.createElement('div');
          node.className = 'webos-launcher-item';
          node.appendChild(item ? itemIcon(item)
            : Object.assign(document.createElement('span'),
              {className: 'glyph', textContent: '\u{1F4E6}'}));
          const label = document.createElement('div');
          label.className = 'lbl';
          label.textContent = (m.title && m.title.en_EN) || m.name;
          node.appendChild(label);
          node.addEventListener('click', () => {
            close();
            core.run(m.name).catch(() => {});
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

  const build = () => {
    dock = document.createElement('div');
    dock.className = 'webos-dock';

    // brand/start button opens the app launcher
    const brand = document.createElement('div');
    brand.className = 'webos-dock-item';
    brand.dataset.app = 'Malta OS';
    brand.title = 'Malta OS';
    const brandImg = document.createElement('img');
    brandImg.src = '/dog.svg';
    brand.appendChild(brandImg);
    sizeOf(brand, BASE);
    brand.addEventListener('click', () => openLauncher());
    dock.appendChild(brand);
    dock.appendChild(Object.assign(document.createElement('div'),
      {className: 'webos-dock-sep'}));

    ITEMS.forEach(item => {
      const node = document.createElement('div');
      node.className = 'webos-dock-item';
      node.dataset.app = item.name;
      node.title = item.label;
      node.appendChild(itemIcon(item));
      node.addEventListener('click', () => {
        node.classList.remove('bounce');
        void node.offsetWidth;
        node.classList.add('bounce');
        core.run(item.name).catch(() => {});
      });
      sizeOf(node, BASE);
      dock.appendChild(node);
    });
    // --- tray: appearance settings + clock ---
    const tray = document.createElement('div');
    tray.className = 'webos-dock-tray';

    const clock = document.createElement('div');
    clock.className = 'webos-dock-clock';
    const tick = () => {
      const d = new Date();
      clock.textContent = d.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
      clock.title = d.toLocaleDateString([], {weekday: 'long', day: 'numeric',
        month: 'long', year: 'numeric'});
    };
    tick();
    setInterval(tick, 1000);

    const power = document.createElement('div');
    power.className = 'webos-dock-item';
    power.title = 'Session';
    power.innerHTML = '<svg viewBox="0 0 24 24" fill="none" ' +
      'stroke="#fff" stroke-width="2.4" stroke-linecap="round" ' +
      'style="width:52%;height:52%"><path d="M12 3v8"/>' +
      '<path d="M6.3 6.5a8 8 0 1 0 11.4 0"/></svg>';
    sizeOf(power, BASE * 0.7);
    power.addEventListener('click', ev => {
      ev.stopPropagation();
      toggleSessionMenu();
    });

    tray.append(clock, power);
    dock.appendChild(tray);

    dock.addEventListener('mousemove', magnify);
    dock.addEventListener('mouseleave', reset);
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
    popover.append(
      item('\u{1F4BE}  Save session', () =>
        core.make('osjs/session').save()),
      item('\u{1F511}  Log out', () =>
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

  const bump = (proc, delta) => {
    const name = proc && proc.metadata && proc.metadata.name;
    if (!name) {
      return;
    }
    running.set(name, Math.max(0, (running.get(name) || 0) + delta));
    paint();
  };

  core.on('osjs/application:launched', proc => bump(proc, 1));
  core.on('osjs/application:destroy', proc => bump(proc, -1));
  core.on('osjs/core:logged-in', build);
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

  const apply = () => applyAppearance(core);
  core.on('osjs/settings:save', apply);
  core.on('osjs/settings:load', apply);
  apply();
};
