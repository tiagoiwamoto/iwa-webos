/*
 * WebOS Files — Dolphin-like file manager: places sidebar with block
 * devices and favorites, breadcrumb navigation, list/icon views,
 * clipboard and context menu. Uses the OS.js VFS (host:/ = real fs).
 */
import osjs from 'osjs';
import {name as applicationName} from './metadata.json';
import {api, formatBytes} from '../_shared/api.js';
import {el, css, statusbar, confirmDialog, promptText, baseStyles} from '../_shared/ui.js';
import {useI18n, metaTitle, getLocale, intlLocale, watchLocale} from '../_shared/i18n.js';

css('webos-files', `
  .wf-wrap { display: flex; height: 100%; min-height: 0; }
  .wf-side { flex: 0 0 190px; overflow: auto; background: #23262e;
    border-right: 1px solid #17191f; padding: 8px 6px; font-size: 12px; }
  .wf-side h4 { margin: 10px 6px 4px; color: #8a93a8; font-size: 10px;
    text-transform: uppercase; letter-spacing: .06em; }
  .wf-side h4:first-child { margin-top: 2px; }
  .wf-place { display: flex; align-items: center; gap: 7px; padding: 5px 7px;
    border-radius: 4px; cursor: pointer; white-space: nowrap; overflow: hidden;
    text-overflow: ellipsis; }
  .wf-place:hover { background: #2d3244; }
  .wf-place.active { background: #3a4160; }
  .wf-place .ic { flex: 0 0 16px; text-align: center; }
  .wf-place .nm { flex: 1 1 auto; overflow: hidden; text-overflow: ellipsis; }
  .wf-place .sub { color: #8a93a8; font-size: 10px; }
  .wf-place .x { color: #8a93a8; padding: 0 2px; visibility: hidden; }
  .wf-place:hover .x { visibility: visible; }
  .wf-place .x:hover { color: #f88; }
  .wf-place.unmounted { opacity: .65; }
  .wf-main { flex: 1 1 auto; display: flex; flex-direction: column; min-width: 0; }
  .wf-crumbs { display: flex; align-items: center; gap: 2px; flex: 1 1 auto;
    min-width: 0; overflow-x: auto; scrollbar-width: none; }
  .wf-crumb { padding: 3px 7px; border-radius: 4px; cursor: pointer;
    white-space: nowrap; }
  .wf-crumb:hover { background: #3a4150; }
  .wf-crumb.cur { background: #3a4160; }
  .wf-crumbsep { color: #5a6275; }
  .wf-pathedit { flex: 1 1 auto; min-width: 80px; }
  .wf-list { flex: 1 1 auto; overflow: auto; }
  .wf-grid { display: grid; grid-template-columns: repeat(auto-fill, 92px);
    gap: 4px; padding: 10px; align-content: start; }
  .wf-cell { display: flex; flex-direction: column; align-items: center;
    gap: 4px; padding: 8px 4px; border-radius: 5px; cursor: default;
    text-align: center; }
  .wf-cell:hover { background: #2d3244; }
  .wf-cell.sel { background: #3a4160; }
  .wf-cell .g { font-size: 34px; }
  .wf-cell .n { font-size: 11px; word-break: break-all; max-height: 30px;
    overflow: hidden; }
  .wf-row td { cursor: default; user-select: none; }
  .wf-th { cursor: pointer; user-select: none; }
  .wf-th:hover { color: #fff; }
  .wf-empty { padding: 40px; text-align: center; color: #8a93a8; }
  .wf-toolbarbtn.on { background: #4a5165; border-color: #6a7288; }
  .wf-star { color: #8a93a8; }
  .wf-star.faved { color: #e0aa3e; }
`);

const tbtn = (label, onclick, title, cls = '') =>
  el('button', {class: 'webos-btn wf-toolbarbtn' + cls, onclick, i18nTitle: title}, label);

const join = (dir, name) => dir.replace(/\/?$/, '/') + name;
const parent = path => {
  const m = path.replace(/\/+$/, '');
  const i = m.lastIndexOf('/');
  return i <= m.indexOf(':') ? m.slice(0, m.indexOf(':') + 1) + '/' : m.slice(0, i);
};
const mountOf = path => path.slice(0, path.indexOf(':') + 1);
const innerOf = path => path.slice(path.indexOf(':') + 1);
const fmtDate = (it, core) => {
  const d = it.stat && (it.stat.mtime || it.stat.ctime);
  if (!d) {
    return '';
  }
  try {
    return new Date(d).toLocaleString(intlLocale(getLocale(core)));
  } catch (e) {
    return '';
  }
};
const glyph = it => {
  if (it.isDirectory) {
    return '📁';
  }
  const m = it.mime || '';
  if (m.startsWith('image/')) {
    return '🖼️';
  }
  if (m.startsWith('video/')) {
    return '🎬';
  }
  if (m.startsWith('audio/')) {
    return '🎵';
  }
  if (m === 'application/pdf') {
    return '📕';
  }
  if (/zip|tar|gzip|compress|archive/.test(m)) {
    return '📦';
  }
  return '📄';
};

const register = (core, args, options, metadata) => {
  const proc = core.make('osjs/application', {args, options, metadata});
  const vfs = core.make('osjs/vfs');
  const {t} = useI18n(core);
  const mountLabel = mount => {
    if (mount.name === 'home' || mount.name === 'host') {
      return t('mounts.' + mount.name);
    }
    return mount.label || mount.name;
  };
  const sb = statusbar();
  const sideBox = el('div', {class: 'wf-side'});
  const listBox = el('div', {class: 'wf-list'});
  const crumbsBox = el('div', {class: 'wf-crumbs'});
  const pathEdit = el('input', {class: 'webos-input wf-pathedit', type: 'text'});
  const fileInput = el('input', {type: 'file', multiple: true, style: {display: 'none'}});

  let cwd = (args.path && (args.path.path || args.path)) || 'home:/';
  if (!/^[a-z]+:/.test(cwd)) {
    cwd = 'host:' + cwd;
  }
  let items = [];
  let sel = null;
  let sort = {key: 'name', dir: 1};
  let showHidden = false;
  let view = proc.settings.view || 'list';
  let clipboard = {items: [], cut: false};
  let backStack = [];
  let fwdStack = [];
  let devices = [];
  let crumbsEdit = false;
  const favorites = () => proc.settings.favorites || [];
  const saveFavs = favs => {
    proc.settings.favorites = favs; proc.saveSettings();
  };

  // ---------- navigation ----------

  const nav = (path, push = true) => {
    if (push && cwd !== path) {
      backStack.push(cwd); fwdStack = [];
    }
    cwd = path;
    sel = null;
    load();
  };
  const goBack = () => {
    if (backStack.length) {
      fwdStack.push(cwd); nav(backStack.pop(), false);
    }
  };
  const goFwd = () => {
    if (fwdStack.length) {
      backStack.push(cwd); nav(fwdStack.pop(), false);
    }
  };

  const load = () => {
    sb.set(t('loading') + ' ' + cwd);
    vfs.readdir(cwd, {showHiddenFiles: showHidden})
      .then(list => {
        items = (list || []).filter(i => i.filename !== '.' && i.filename !== '..');
        sortItems();
        renderAll();
        const dirs = items.filter(i => i.isDirectory).length;
        sb.set(t('files.items', {n: items.length}) + ' · ' +
          t('files.folders', {n: dirs}) + ' — ' + cwd);
      })
      .catch(e => {
        items = []; renderAll(); sb.error(e.message || e);
      });
  };

  const sortItems = () => {
    const k = sort.key;
    items.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) {
        return a.isDirectory ? -1 : 1;
      }
      const va = k === 'size' ? (a.size || 0) : k === 'mtime'
        ? String((a.stat && a.stat.mtime) || '')
        : a.filename.toLowerCase();
      const vb = k === 'size' ? (b.size || 0) : k === 'mtime'
        ? String((b.stat && b.stat.mtime) || '')
        : b.filename.toLowerCase();
      return (va < vb ? -1 : va > vb ? 1 : 0) * sort.dir;
    });
  };

  const sortBy = key => {
    sort = {key, dir: sort.key === key ? -sort.dir : 1};
    sortItems();
    renderList();
  };

  // ---------- file ops ----------

  const open = it => {
    if (it.isDirectory) {
      nav(it.path); return;
    }
    const mime = it.mime || '';
    const app = /^(image|video)\//.test(mime) ? 'Preview' : 'WebOSEditor';
    core.run(app, {file: it}).catch(e => sb.error(e.message));
  };

  const doMkdir = () => promptText(core, t('files.newFolder'),
    t('files.newFolderMsg', {dir: innerOf(cwd)}))
    .then(n => n && vfs.mkdir({path: join(cwd, n)}).then(load).catch(e => sb.error(e.message)));

  const doTouch = () => promptText(core, t('files.newFile'),
    t('files.newFileMsg', {dir: innerOf(cwd)}))
    .then(n => n && vfs.touch({path: join(cwd, n)}).then(load).catch(e => sb.error(e.message)));

  const doRename = it => promptText(core, t('files.rename'),
    t('files.renameMsg', {name: it.filename}), it.filename)
    .then(n => n && n !== it.filename &&
      vfs.rename(it, {path: join(parent(it.path), n)}).then(load).catch(e => sb.error(e.message)));

  const doDelete = it => confirmDialog(core, t('files.deleteTitle'),
    t('files.deleteMsg', {name: it.filename}))
    .then(ok => ok && vfs.unlink(it).then(load).catch(e => sb.error(e.message)));

  const doCopy = (it, cut) => {
    clipboard = {items: [it], cut}; renderStatus();
  };
  const doPaste = () => {
    const {items: src, cut} = clipboard;
    if (!src.length) {
      return;
    }
    Promise.all(src.map(it => {
      const dest = {path: join(cwd, it.filename)};
      return (cut ? vfs.rename(it, dest) : vfs.copy(it, dest))
        .catch(e => sb.error(`${it.filename}: ${e.message}`));
    })).then(() => {
      if (cut) {
        clipboard = {items: [], cut: false};
      }
      load();
    });
  };

  const doDownload = it => vfs.download(it).catch(e => sb.error(e.message));

  const openWith = (pos, it) => {
    const run = name => core.run(name, {file: it})
      .catch(e => sb.error(e.message));
    const pkgs = core.make('osjs/packages')
      .getCompatiblePackages(it.mime || 'application/octet-stream')
      .filter(m => m.type === 'application' && m.name !== applicationName);
    const entries = pkgs.map(m => ({
      label: metaTitle(core, m), onclick: () => run(m.name)
    }));
    if (!pkgs.some(m => m.name === 'WebOSEditor')) {
      entries.push({label: 'Code Editor', onclick: () => run('WebOSEditor')});
    }
    // defer: the click that opened this menu would close a menu shown now
    setTimeout(() => core.make('osjs/contextmenu')
      .show({position: pos, menu: entries}), 0);
  };

  const doUpload = files => {
    [...files].forEach(f => {
      sb.set(t('files.uploading', {name: f.name}));
      vfs.writefile({path: join(cwd, f.name)}, f)
        .then(() => {
          sb.set(t('files.uploaded', {name: f.name})); load();
        })
        .catch(e => sb.error(`${f.name}: ${e.message}`));
    });
  };

  // ---------- favorites ----------

  const isFav = p => favorites().some(f => f.path === p);
  const toggleFav = (p, label) => {
    const favs = favorites().filter(f => f.path !== p);
    if (favs.length === favorites().length) {
      favs.push({name: label || innerOf(p).replace(/\/+$/, '').split('/').pop() || p, path: p});
    }
    saveFavs(favs);
    renderSidebar();
    renderFavBtn();
  };

  // ---------- context menu ----------

  const menu = (pos, it) => {
    const entries = it ? [
      {label: t('files.open'), onclick: () => open(it)},
      !it.isDirectory ? {label: t('files.openWith'),
        onclick: () => openWith(pos, it)} : null,
      it.isDirectory ? {label: t('files.favorite'),
        onclick: () => toggleFav(it.path, it.filename)} : null,
      !it.isDirectory ? {label: t('files.download'),
        onclick: () => doDownload(it)} : null,
      {label: t('files.cut'), onclick: () => doCopy(it, true)},
      {label: t('files.copy'), onclick: () => doCopy(it, false)},
      {label: t('files.rename') + '…', onclick: () => doRename(it)},
      {label: t('del'), onclick: () => doDelete(it)}
    ] : [
      {label: t('files.newFolder') + '…', onclick: doMkdir},
      {label: t('files.newFile') + '…', onclick: doTouch},
      {label: t('files.upload'), onclick: () => fileInput.click()},
      {label: t('files.paste'), disabled: !clipboard.items.length, onclick: doPaste},
      {label: isFav(cwd) ? t('files.unfavPlace') : t('files.favPlace'),
        onclick: () => toggleFav(cwd)},
      {label: t('files.refresh'), onclick: load}
    ];
    core.make('osjs/contextmenu').show({
      position: pos, menu: entries.filter(Boolean)
    });
  };

  // ---------- rendering ----------

  const place = (icon, name, sub, path, extra = {}) => {
    const node = el('div', {
      class: 'wf-place' + (cwd === path ? ' active' : '') + (extra.dim ? ' unmounted' : ''),
      title: sub || path,
      onclick: () => extra.onclick ? extra.onclick() : nav(path)
    },
    el('span', {class: 'ic'}, icon),
    el('span', {class: 'nm'}, name),
    sub ? el('span', {class: 'sub'}, sub) : null,
    extra.x ? el('span', {
      class: 'x', title: t('files.removeFav'),
      onclick: ev => {
        ev.stopPropagation(); extra.x();
      }
    }, '✕') : null);
    if (extra.menu) {
      node.addEventListener('contextmenu', ev => {
        ev.preventDefault(); extra.menu(ev);
      });
    }
    return node;
  };

  const renderSidebar = () => {
    sideBox.innerHTML = '';
    const sec = s => sideBox.appendChild(el('h4', {}, s));

    sec(t('files.places'));
    const mounts = core.make('osjs/fs').mountpoints() || [];
    const order = {home: 0, host: 1};
    mounts
      .filter(m => m.attributes && m.attributes.visibility !== 'hidden')
      .sort((a, b) => (a.name in order ? order[a.name] : 9) -
        (b.name in order ? order[b.name] : 9))
      .forEach(m => sideBox.appendChild(place(
        m.name === 'home' ? '🏠' : m.name === 'host' ? '💻' : '💾',
        mountLabel(m), '', m.name + ':/')));

    sec(t('files.devices'));
    if (!devices.length) {
      sideBox.appendChild(el('div', {class: 'wf-place'}, '  ' + t('files.noVolumes')));
    }
    devices.forEach(p => {
      const mp = (p.mountpoints || []).filter(Boolean)[0];
      const label = p.label || p.name || p.path;
      sideBox.appendChild(place(
        mp ? '💽' : '⏏', label,
        `${p.fstype || '?'} · ${formatBytes(p.size)}` +
          (mp ? ' · ' + mp : ' · ' + t('files.notMounted')),
        mp ? 'host:' + mp : null,
        {
          dim: !mp,
          onclick: mp ? null : () => {
            sb.set(t('files.mounting', {dev: p.path}));
            api.post('disks/mount', {device: p.path})
              .then(r => {
                const m = / at (\S+)/.exec(r.output || '');
                loadDevices().then(() => m && nav('host:' + m[1]));
              })
              .catch(e => sb.error(e.message));
          },
          menu: mp ? ev => core.make('osjs/contextmenu').show({
            position: ev,
            menu: [{label: t('files.unmount', {dev: p.path}), onclick: () =>
              api.post('disks/unmount', {device: p.path})
                .then(() => loadDevices())
                .catch(e => sb.error(e.message))}]
          }) : null
        }));
    });

    sec(t('files.favorites'));
    if (!favorites().length) {
      sideBox.appendChild(el('div', {class: 'wf-place', title: t('files.favTitle')},
        '  ' + t('files.noFavorites')));
    }
    favorites().forEach(f => sideBox.appendChild(
      place('⭐', f.name, f.path, f.path, {
        x: () => toggleFav(f.path),
        menu: ev => core.make('osjs/contextmenu').show({
          position: ev,
          menu: [{label: t('files.removeFav'), onclick: () => toggleFav(f.path)}]
        })
      })));
  };

  const loadDevices = () =>
    api.get('disks').then(data => {
      const flat = [];
      const walk = n => (n.children || []).forEach(c => {
        flat.push(c); walk(c);
      });
      (data.blockdevices || []).forEach(d => walk(d));
      devices = flat.filter(n => n.type === 'part' || n.type === 'rom');
      renderSidebar();
    }).catch(() => {});

  const renderCrumbs = () => {
    crumbsBox.innerHTML = '';
    if (crumbsEdit) {
      pathEdit.value = cwd;
      crumbsBox.appendChild(pathEdit);
      pathEdit.focus();
      pathEdit.select();
      return;
    }
    const mount = mountOf(cwd);
    const mounts = core.make('osjs/fs').mountpoints() || [];
    const entry = mounts.find(m => m.name + ':' === mount);
    const mlabel = entry ? mountLabel(entry) : mount;
    crumbsBox.appendChild(el('span', {class: 'wf-crumb', onclick: () => nav(mount)}, mlabel));
    const parts = innerOf(cwd).split('/').filter(Boolean);
    let acc = mount;
    parts.forEach((p, i) => {
      acc = join(acc, p);
      const target = acc;
      crumbsBox.appendChild(el('span', {class: 'wf-crumbsep'}, '›'));
      crumbsBox.appendChild(el('span', {
        class: 'wf-crumb' + (i === parts.length - 1 ? ' cur' : ''),
        onclick: () => nav(target)
      }, p));
    });
  };

  const nameCell = it => el('td', {class: 'wf-row'},
    el('span', {style: {marginRight: '6px'}}, glyph(it)), it.filename);

  const renderList = () => {
    listBox.innerHTML = '';
    if (!items.length) {
      listBox.appendChild(el('div', {class: 'wf-empty'}, t('files.emptyFolder')));
      return;
    }
    if (view === 'grid') {
      const g = el('div', {class: 'wf-grid'});
      items.forEach(it => {
        const c = el('div', {
          class: 'wf-cell' + (sel === it ? ' sel' : ''),
          title: `${it.filename}\n${formatBytes(it.size)}`,
          onclick: () => {
            sel = it; renderList(); renderStatus();
          },
          ondblclick: () => open(it)
        }, el('span', {class: 'g'}, glyph(it)), el('span', {class: 'n'}, it.filename));
        c.addEventListener('contextmenu', ev => {
          ev.preventDefault(); sel = it; menu(ev, it);
        });
        g.appendChild(c);
      });
      listBox.appendChild(g);
      return;
    }
    const th = (label, key) => el('th', {class: 'wf-th', onclick: () => sortBy(key)},
      label + (sort.key === key ? (sort.dir > 0 ? ' ▲' : ' ▼') : ''));
    const head = el('tr', {}, th(t('name'), 'name'), th(t('size'), 'size'),
      th(t('modified'), 'mtime'), el('th', {}, t('type')));
    const tbody = el('tbody', {}, items.map(it => {
      const tr = el('tr', {class: 'wf-row' + (sel === it ? ' selected' : '')},
        nameCell(it),
        el('td', {}, it.isDirectory ? '' : formatBytes(it.size)),
        el('td', {}, fmtDate(it, core)),
        el('td', {}, it.isDirectory ? t('files.folder') : (it.mime || t('files.file'))));
      tr.addEventListener('click', () => {
        sel = it; renderList(); renderStatus();
      });
      tr.addEventListener('dblclick', () => open(it));
      tr.addEventListener('contextmenu', ev => {
        ev.preventDefault(); sel = it; menu(ev, it);
      });
      return tr;
    }));
    listBox.appendChild(el('table', {class: 'webos-table'},
      el('thead', {}, head), tbody));
  };

  const renderStatus = () => {
    const clip = clipboard.items.length
      ? ' · ' + t('files.clip', {n: clipboard.items.length}) +
        (clipboard.cut ? t('files.clipCut') : '')
      : '';
    sb.set(sel
      ? t('files.selInfo', {name: sel.filename,
        info: sel.isDirectory ? t('files.folder')
          : formatBytes(sel.size) + ' · ' + (sel.mime || '')}) + clip
      : t('files.items', {n: items.length}) + ' — ' + cwd + clip);
  };

  const favBtn = tbtn('☆', () => toggleFav(cwd), 'files.favTitle');
  const renderFavBtn = () => {
    favBtn.textContent = isFav(cwd) ? '★' : '☆';
    favBtn.classList.toggle('faved', isFav(cwd));
    favBtn.classList.add('wf-star');
  };

  const viewBtn = tbtn(view === 'grid' ? '☰' : '⊞', () => {
    view = view === 'grid' ? 'list' : 'grid';
    proc.settings.view = view;
    proc.saveSettings();
    viewBtn.textContent = view === 'grid' ? '☰' : '⊞';
    renderList();
  }, 'files.viewToggle');

  const hiddenBtn = tbtn('.', () => {
    showHidden = !showHidden;
    hiddenBtn.classList.toggle('on', showHidden);
    load();
  }, 'files.showHidden');
  hiddenBtn.classList.toggle('on', showHidden);

  const renderAll = (preservePathEdit = false) => {
    if (!preservePathEdit || !crumbsEdit) {
      renderCrumbs();
    }
    renderSidebar();
    renderList();
    renderStatus();
    renderFavBtn();
    win && win.setTitle(`${innerOf(cwd) || '/'} — ${metaTitle(core, metadata)}`);
  };

  // ---------- toolbar & window ----------

  pathEdit.addEventListener('keydown', ev => {
    if (ev.key === 'Enter') {
      const v = pathEdit.value.trim();
      crumbsEdit = false;
      nav(/^[a-z]+:/.test(v) ? v : 'host:' + (v.startsWith('/') ? v : '/' + v));
    } else if (ev.key === 'Escape') {
      crumbsEdit = false; renderCrumbs();
    }
  });
  pathEdit.addEventListener('blur', () => {
    if (crumbsEdit) {
      crumbsEdit = false; renderCrumbs();
    }
  });
  fileInput.addEventListener('change', () => {
    doUpload(fileInput.files); fileInput.value = '';
  });
  listBox.addEventListener('contextmenu', ev => {
    if (ev.target === listBox || ev.target.classList.contains('wf-grid') ||
        ev.target.classList.contains('wf-empty')) {
      ev.preventDefault();
      sel = null;
      menu(ev, null);
    }
  });

  const editBtn = tbtn('✎', () => {
    crumbsEdit = true; renderCrumbs();
  },
  'files.editPath');

  const toolbar = el('div', {class: 'webos-toolbar'},
    tbtn('←', goBack, 'files.back'), tbtn('→', goFwd, 'files.forward'),
    tbtn('↑', () => nav(parent(cwd)), 'files.up'),
    tbtn('⟳', load, 'files.refresh'),
    crumbsBox, editBtn,
    tbtn('📁+', doMkdir, 'files.newFolder'),
    tbtn('⬆', () => fileInput.click(), 'files.upload'),
    favBtn, hiddenBtn, viewBtn);

  const win = proc.createWindow({
    id: 'WebOSFilesWindow',
    title: metaTitle(core, metadata),
    dimension: {width: 860, height: 520}
  });

  win.on('destroy', () => proc.destroy());
  watchLocale(proc, () => renderAll(true));
  win.on('keydown', (ev, w) => {
    if (ev.target.tagName === 'INPUT') {
      return;
    }
    if (ev.key === 'Backspace') {
      ev.preventDefault(); nav(parent(cwd));
    } else if (ev.key === 'Delete' && sel) {
      ev.preventDefault(); doDelete(sel);
    } else if (ev.key === 'F2' && sel) {
      ev.preventDefault(); doRename(sel);
    } else if (ev.key === 'Enter' && sel) {
      ev.preventDefault(); open(sel);
    } else if (ev.ctrlKey && ev.key === 'l') {
      ev.preventDefault(); crumbsEdit = true; renderCrumbs();
    } else if (ev.ctrlKey && ev.key === 'c' && sel) {
      doCopy(sel, false);
    } else if (ev.ctrlKey && ev.key === 'x' && sel) {
      doCopy(sel, true);
    } else if (ev.ctrlKey && ev.key === 'v') {
      doPaste();
    } else if (ev.ctrlKey && ev.key === 'h') {
      ev.preventDefault(); hiddenBtn.click();
    }
  });

  win.render($content => {
    baseStyles();
    $content.appendChild(el('div', {class: 'webos-root'},
      toolbar,
      el('div', {class: 'wf-wrap'},
        sideBox,
        el('div', {class: 'wf-main'}, listBox)),
      sb,
      fileInput));
    loadDevices();
    load();
  });

  return proc;
};

osjs.register(applicationName, register);
