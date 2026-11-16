/*
 * WebOS Files — Dolphin-like file manager: places sidebar with block
 * devices and favorites, breadcrumb navigation, list/icon views,
 * clipboard and context menu. Uses the OS.js VFS (host:/ = real fs).
 */
import osjs from 'osjs';
import {name as applicationName} from './metadata.json';
import {api, formatBytes} from '../_shared/api.js';
import {el, css, statusbar, confirmDialog, promptText, baseStyles} from '../_shared/ui.js';

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
  el('button', {class: 'webos-btn wf-toolbarbtn' + cls, onclick, title}, label);

const join = (dir, name) => dir.replace(/\/?$/, '/') + name;
const parent = path => {
  const m = path.replace(/\/+$/, '');
  const i = m.lastIndexOf('/');
  return i <= m.indexOf(':') ? m.slice(0, m.indexOf(':') + 1) + '/' : m.slice(0, i);
};
const mountOf = path => path.slice(0, path.indexOf(':') + 1);
const innerOf = path => path.slice(path.indexOf(':') + 1);
const fmtDate = it => {
  const d = it.stat && (it.stat.mtime || it.stat.ctime);
  if (!d) return '';
  try { return new Date(d).toLocaleString(); } catch (e) { return ''; }
};
const glyph = it => {
  if (it.isDirectory) return '📁';
  const m = it.mime || '';
  if (m.startsWith('image/')) return '🖼️';
  if (m.startsWith('video/')) return '🎬';
  if (m.startsWith('audio/')) return '🎵';
  if (m === 'application/pdf') return '📕';
  if (/zip|tar|gzip|compress|archive/.test(m)) return '📦';
  return '📄';
};

const register = (core, args, options, metadata) => {
  const proc = core.make('osjs/application', {args, options, metadata});
  const vfs = core.make('osjs/vfs');
  const sb = statusbar();
  const sideBox = el('div', {class: 'wf-side'});
  const listBox = el('div', {class: 'wf-list'});
  const crumbsBox = el('div', {class: 'wf-crumbs'});
  const pathEdit = el('input', {class: 'webos-input wf-pathedit', type: 'text'});
  const fileInput = el('input', {type: 'file', multiple: true, style: {display: 'none'}});

  let cwd = (args.path && (args.path.path || args.path)) || 'home:/';
  if (!/^[a-z]+:/.test(cwd)) cwd = 'host:' + cwd;
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
  const saveFavs = favs => { proc.settings.favorites = favs; proc.saveSettings(); };

  // ---------- navigation ----------

  const nav = (path, push = true) => {
    if (push && cwd !== path) { backStack.push(cwd); fwdStack = []; }
    cwd = path;
    sel = null;
    load();
  };
  const goBack = () => { if (backStack.length) { fwdStack.push(cwd); nav(backStack.pop(), false); } };
  const goFwd = () => { if (fwdStack.length) { backStack.push(cwd); nav(fwdStack.pop(), false); } };

  const load = () => {
    sb.set('loading ' + cwd);
    vfs.readdir(cwd, {showHiddenFiles: showHidden})
      .then(list => {
        items = (list || []).filter(i => i.filename !== '.' && i.filename !== '..');
        sortItems();
        renderAll();
        const dirs = items.filter(i => i.isDirectory).length;
        sb.set(`${items.length} item(s) · ${dirs} pasta(s) — ${cwd}`);
      })
      .catch(e => { items = []; renderAll(); sb.error(e.message || e); });
  };

  const sortItems = () => {
    const k = sort.key;
    items.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
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
    if (it.isDirectory) { nav(it.path); return; }
    const mime = it.mime || '';
    const app = /^(image|video)\//.test(mime) ? 'Preview' : 'WebOSEditor';
    core.run(app, {file: it}).catch(e => sb.error(e.message));
  };

  const doMkdir = () => promptText(core, 'Nova pasta', 'Nome da pasta em ' + innerOf(cwd))
    .then(n => n && vfs.mkdir({path: join(cwd, n)}).then(load).catch(e => sb.error(e.message)));

  const doTouch = () => promptText(core, 'Novo arquivo', 'Nome do arquivo em ' + innerOf(cwd))
    .then(n => n && vfs.touch({path: join(cwd, n)}).then(load).catch(e => sb.error(e.message)));

  const doRename = it => promptText(core, 'Renomear', 'Novo nome para ' + it.filename, it.filename)
    .then(n => n && n !== it.filename &&
      vfs.rename(it, {path: join(parent(it.path), n)}).then(load).catch(e => sb.error(e.message)));

  const doDelete = it => confirmDialog(core, 'Excluir',
    `Excluir ${it.filename} definitivamente?`)
    .then(ok => ok && vfs.unlink(it).then(load).catch(e => sb.error(e.message)));

  const doCopy = (it, cut) => { clipboard = {items: [it], cut}; renderStatus(); };
  const doPaste = () => {
    const {items: src, cut} = clipboard;
    if (!src.length) return;
    Promise.all(src.map(it => {
      const dest = {path: join(cwd, it.filename)};
      return (cut ? vfs.rename(it, dest) : vfs.copy(it, dest))
        .catch(e => sb.error(`${it.filename}: ${e.message}`));
    })).then(() => {
      if (cut) clipboard = {items: [], cut: false};
      load();
    });
  };

  const doDownload = it => vfs.download(it).catch(e => sb.error(e.message));

  const doUpload = files => {
    [...files].forEach(f => {
      sb.set(`enviando ${f.name}...`);
      vfs.writefile({path: join(cwd, f.name)}, f)
        .then(() => { sb.set(`${f.name} enviado`); load(); })
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
      {label: 'Abrir', onclick: () => open(it)},
      it.isDirectory ? {label: '★ Favoritar', onclick: () => toggleFav(it.path, it.filename)} : null,
      !it.isDirectory ? {label: 'Download', onclick: () => doDownload(it)} : null,
      {label: 'Recortar', onclick: () => doCopy(it, true)},
      {label: 'Copiar', onclick: () => doCopy(it, false)},
      {label: 'Renomear…', onclick: () => doRename(it)},
      {label: 'Excluir', onclick: () => doDelete(it)}
    ] : [
      {label: 'Nova pasta…', onclick: doMkdir},
      {label: 'Novo arquivo…', onclick: doTouch},
      {label: 'Enviar arquivo…', onclick: () => fileInput.click()},
      {label: 'Colar', disabled: !clipboard.items.length, onclick: doPaste},
      {label: isFav(cwd) ? '★ Remover favorito' : '★ Favoritar pasta', onclick: () => toggleFav(cwd)},
      {label: 'Atualizar', onclick: load}
    ].filter(Boolean);
    core.make('osjs/contextmenu').show({position: pos, menu: entries});
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
        class: 'x', title: 'Remover favorito',
        onclick: ev => { ev.stopPropagation(); extra.x(); }
      }, '✕') : null);
    if (extra.menu) {
      node.addEventListener('contextmenu', ev => { ev.preventDefault(); extra.menu(ev); });
    }
    return node;
  };

  const renderSidebar = () => {
    sideBox.innerHTML = '';
    const sec = t => sideBox.appendChild(el('h4', {}, t));

    sec('Locais');
    const mounts = core.make('osjs/fs').mountpoints() || [];
    const order = {home: 0, host: 1};
    mounts
      .filter(m => m.attributes && m.attributes.visibility !== 'hidden')
      .sort((a, b) => (a.name in order ? order[a.name] : 9) -
        (b.name in order ? order[b.name] : 9))
      .forEach(m => sideBox.appendChild(place(
        m.name === 'home' ? '🏠' : m.name === 'host' ? '💻' : '💾',
        m.label || m.name, '', m.name + ':/')));

    sec('Dispositivos');
    if (!devices.length) {
      sideBox.appendChild(el('div', {class: 'wf-place'}, '  nenhum volume'));
    }
    devices.forEach(p => {
      const mp = (p.mountpoints || []).filter(Boolean)[0];
      const label = p.label || p.name || p.path;
      sideBox.appendChild(place(
        mp ? '💽' : '⏏', label,
        `${p.fstype || '?'} · ${formatBytes(p.size)}${mp ? ' · ' + mp : ' · não montado'}`,
        mp ? 'host:' + mp : null,
        {
          dim: !mp,
          onclick: mp ? null : () => {
            sb.set(`montando ${p.path}...`);
            api.post('disks/mount', {device: p.path})
              .then(r => {
                const m = / at (\S+)/.exec(r.output || '');
                loadDevices().then(() => m && nav('host:' + m[1]));
              })
              .catch(e => sb.error(e.message));
          },
          menu: mp ? ev => core.make('osjs/contextmenu').show({
            position: ev,
            menu: [{label: `Desmontar ${p.path}`, onclick: () =>
              api.post('disks/unmount', {device: p.path})
                .then(() => loadDevices())
                .catch(e => sb.error(e.message))}]
          }) : null
        }));
    });

    sec('Favoritos');
    if (!favorites().length) {
      sideBox.appendChild(el('div', {class: 'wf-place', title: 'Use ★ na barra'},
        '  nenhum favorito'));
    }
    favorites().forEach(f => sideBox.appendChild(
      place('⭐', f.name, f.path, f.path, {
        x: () => toggleFav(f.path),
        menu: ev => core.make('osjs/contextmenu').show({
          position: ev,
          menu: [{label: 'Remover favorito', onclick: () => toggleFav(f.path)}]
        })
      })));
  };

  const loadDevices = () =>
    api.get('disks').then(data => {
      const flat = [];
      const walk = n => (n.children || []).forEach(c => { flat.push(c); walk(c); });
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
    const mlabel = (mounts.find(m => m.name + ':' === mount.slice(0, -1)) || {}).label || mount;
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
      listBox.appendChild(el('div', {class: 'wf-empty'}, 'pasta vazia'));
      return;
    }
    if (view === 'grid') {
      const g = el('div', {class: 'wf-grid'});
      items.forEach(it => {
        const c = el('div', {
          class: 'wf-cell' + (sel === it ? ' sel' : ''),
          title: `${it.filename}\n${formatBytes(it.size)}`,
          onclick: () => { sel = it; renderList(); renderStatus(); },
          ondblclick: () => open(it)
        }, el('span', {class: 'g'}, glyph(it)), el('span', {class: 'n'}, it.filename));
        c.addEventListener('contextmenu', ev => { ev.preventDefault(); sel = it; menu(ev, it); });
        g.appendChild(c);
      });
      listBox.appendChild(g);
      return;
    }
    const th = (label, key) => el('th', {class: 'wf-th', onclick: () => sortBy(key)},
      label + (sort.key === key ? (sort.dir > 0 ? ' ▲' : ' ▼') : ''));
    const head = el('tr', {}, th('Nome', 'name'), th('Tamanho', 'size'),
      th('Modificado', 'mtime'), el('th', {}, 'Tipo'));
    const tbody = el('tbody', {}, items.map(it => {
      const tr = el('tr', {class: 'wf-row' + (sel === it ? ' selected' : '')},
        nameCell(it),
        el('td', {}, it.isDirectory ? '' : formatBytes(it.size)),
        el('td', {}, fmtDate(it)),
        el('td', {}, it.isDirectory ? 'pasta' : (it.mime || 'arquivo')));
      tr.addEventListener('click', () => { sel = it; renderList(); renderStatus(); });
      tr.addEventListener('dblclick', () => open(it));
      tr.addEventListener('contextmenu', ev => { ev.preventDefault(); sel = it; menu(ev, it); });
      return tr;
    }));
    listBox.appendChild(el('table', {class: 'webos-table'},
      el('thead', {}, head), tbody));
  };

  const renderStatus = () => {
    const clip = clipboard.items.length
      ? ` · ${clipboard.items.length} na área de transferência${clipboard.cut ? ' (recortar)' : ''}`
      : '';
    sb.set(sel
      ? `${sel.filename} — ${sel.isDirectory ? 'pasta' : formatBytes(sel.size) + ' · ' + (sel.mime || '')}${clip}`
      : `${items.length} item(s) — ${cwd}${clip}`);
  };

  const favBtn = tbtn('☆', () => toggleFav(cwd), 'Adicionar/remover favorito');
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
  }, 'Alternar lista/ícones');

  const hiddenBtn = tbtn('.', () => {
    showHidden = !showHidden;
    hiddenBtn.classList.toggle('on', showHidden);
    load();
  }, 'Mostrar arquivos ocultos');
  hiddenBtn.classList.toggle('on', showHidden);

  const renderAll = () => {
    renderCrumbs();
    renderSidebar();
    renderList();
    renderStatus();
    renderFavBtn();
    win && win.setTitle(`${innerOf(cwd) || '/'} — ${metadata.title.en_EN}`);
  };

  // ---------- toolbar & window ----------

  pathEdit.addEventListener('keydown', ev => {
    if (ev.key === 'Enter') {
      const v = pathEdit.value.trim();
      crumbsEdit = false;
      nav(/^[a-z]+:/.test(v) ? v : 'host:' + (v.startsWith('/') ? v : '/' + v));
    } else if (ev.key === 'Escape') { crumbsEdit = false; renderCrumbs(); }
  });
  pathEdit.addEventListener('blur', () => { if (crumbsEdit) { crumbsEdit = false; renderCrumbs(); } });
  fileInput.addEventListener('change', () => { doUpload(fileInput.files); fileInput.value = ''; });
  listBox.addEventListener('contextmenu', ev => {
    if (ev.target === listBox || ev.target.classList.contains('wf-grid') ||
        ev.target.classList.contains('wf-empty')) {
      ev.preventDefault();
      sel = null;
      menu(ev, null);
    }
  });

  const editBtn = tbtn('✎', () => { crumbsEdit = true; renderCrumbs(); },
    'Editar caminho (Ctrl+L)');

  const toolbar = el('div', {class: 'webos-toolbar'},
    tbtn('←', goBack, 'Voltar'), tbtn('→', goFwd, 'Avançar'),
    tbtn('↑', () => nav(parent(cwd)), 'Subir'), tbtn('⟳', load, 'Atualizar'),
    crumbsBox, editBtn,
    tbtn('📁+', doMkdir, 'Nova pasta'), tbtn('⬆', () => fileInput.click(), 'Enviar arquivo'),
    favBtn, hiddenBtn, viewBtn);

  const win = proc.createWindow({
    id: 'WebOSFilesWindow',
    title: metadata.title.en_EN,
    dimension: {width: 860, height: 520}
  });

  win.on('destroy', () => proc.destroy());
  win.on('keydown', (ev, w) => {
    if (ev.target.tagName === 'INPUT') return;
    if (ev.key === 'Backspace') { ev.preventDefault(); nav(parent(cwd)); }
    else if (ev.key === 'Delete' && sel) { ev.preventDefault(); doDelete(sel); }
    else if (ev.key === 'F2' && sel) { ev.preventDefault(); doRename(sel); }
    else if (ev.key === 'Enter' && sel) { ev.preventDefault(); open(sel); }
    else if (ev.ctrlKey && ev.key === 'l') { ev.preventDefault(); crumbsEdit = true; renderCrumbs(); }
    else if (ev.ctrlKey && ev.key === 'c' && sel) { doCopy(sel, false); }
    else if (ev.ctrlKey && ev.key === 'x' && sel) { doCopy(sel, true); }
    else if (ev.ctrlKey && ev.key === 'v') { doPaste(); }
    else if (ev.ctrlKey && ev.key === 'h') { ev.preventDefault(); hiddenBtn.click(); }
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
