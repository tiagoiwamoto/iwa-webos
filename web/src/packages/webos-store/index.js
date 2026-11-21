import osjs from 'osjs';
import {name as applicationName} from './metadata.json';
import {api} from '../_shared/api.js';
import {el, css, button, statusbar, layout, confirmDialog} from '../_shared/ui.js';
import {createLocalizedWindow} from '../_shared/i18n.js';

css('webos-store', `
  .wstore-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 10px; padding: 12px; }
  .wstore-card { display: flex; gap: 10px; padding: 10px; background: #262a33;
    border: 1px solid #333845; border-radius: 6px; align-items: flex-start; }
  .wstore-card img { width: 40px; height: 40px; flex: 0 0 auto; }
  .wstore-card .info { flex: 1 1 auto; min-width: 0; }
  .wstore-card .t { font-weight: bold; }
  .wstore-card .tag { color: #9ab; font-size: 11px; overflow: hidden;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
  .wstore-card .meta { color: #788; font-size: 10px; margin-top: 3px; }
  .wstore-card .actions { margin-top: 6px; display: flex; gap: 6px; }
`);

const register = (core, args, options, metadata) => {
  const proc = core.make('osjs/application', {args, options, metadata});

  const body = el('div');
  const sb = statusbar();
  const search = el('input', {
    class: 'webos-input', placeholder: 'search apps',
    style: {width: '200px'}
  });
  const catSel = el('select', {class: 'webos-input'},
    el('option', {value: ''}, 'all categories'));
  let apps = [];
  let installed = new Set();
  let installedOnly = false;

  const render = () => {
    body.innerHTML = '';
    const list = installedOnly ? apps.filter(a => installed.has(a.id)) : apps;
    const grid = el('div', {class: 'wstore-grid'});
    list.forEach(a => {
      const isIn = installed.has(a.id);
      const actions = el('div', {class: 'actions'});
      if (isIn) {
        actions.append(
          button('Restart', () => act(a, 'restart')),
          button('Stop', () => act(a, 'stop')),
          button('Uninstall', () => uninstall(a), 'danger'));
      } else {
        actions.appendChild(button('Install', () => install(a)));
      }
      grid.appendChild(el('div', {class: 'wstore-card'},
        el('img', {src: a.icon, loading: 'lazy',
          onerror: ev => {
            ev.target.style.visibility = 'hidden';
          }}),
        el('div', {class: 'info'},
          el('div', {class: 't'}, a.title),
          el('div', {class: 'tag'}, a.tagline || ''),
          el('div', {class: 'meta'},
            `${a.category || ''} · v${a.version || '?'}${isIn ? ' · installed' : ''}`),
          actions)));
    });
    body.appendChild(list.length
      ? grid
      : el('div', {style: {padding: '20px', color: '#9ab'}}, 'no apps'));
  };

  const refresh = () => {
    sb.set('loading store...');
    Promise.all([
      api.get('store/apps', {
        q: search.value || undefined,
        category: catSel.value || undefined
      }),
      api.get('store/installed')
    ]).then(([data, inst]) => {
      apps = data.apps;
      installed = new Set(inst.map(i => i.id));
      const cats = [...new Set(apps.map(a => a.category).filter(Boolean))].sort();
      if (catSel.children.length <= 1) {
        cats.forEach(c => catSel.appendChild(el('option', {value: c}, c)));
      }
      sb.set(`${apps.length} apps · ${installed.size} installed`);
      render();
    }).catch(e => sb.error(e.message));
  };

  const install = a => {
    sb.set(`installing ${a.title}...`);
    api.post('store/install', {id: a.id})
      .then(() => {
        sb.set(`${a.title} installed`); refresh();
      })
      .catch(e => sb.error(e.message));
  };

  const act = (a, action) => {
    sb.set(`${action} ${a.title}...`);
    api.post('store/action', {id: a.id, action})
      .then(() => {
        sb.set('ok'); refresh();
      })
      .catch(e => sb.error(e.message));
  };

  const uninstall = a => {
    confirmDialog(core, 'Uninstall app',
      `Remove ${a.title}? Runs 'docker compose down' and deletes its config.`)
      .then(ok => ok && api.del(`store/${a.id}`)
        .then(() => {
          sb.set(`${a.title} removed`); refresh();
        })
        .catch(e => sb.error(e.message)));
  };

  let debounce = null;
  search.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(refresh, 400);
  });
  catSel.addEventListener('change', refresh);

  const tb = el('div', {class: 'webos-toolbar'},
    search, catSel,
    button(installedOnly ? '✓ Installed only' : 'Installed only', () => {
      installedOnly = !installedOnly;
      tb.children[2].textContent = installedOnly ? '✓ Installed only' : 'Installed only';
      render();
    }),
    el('span', {style: {flex: '1'}}),
    button('Refresh', refresh));

  createLocalizedWindow(proc, {
    id: 'WebOSStoreWindow',
    dimension: {width: 820, height: 500}
  })
    .on('destroy', () => proc.destroy())
    .render($content => {
      $content.appendChild(layout(tb, body, sb));
      refresh();
    });

  return proc;
};

osjs.register(applicationName, register);
