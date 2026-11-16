import osjs from 'osjs';
import {name as applicationName} from './metadata.json';
import {api} from '../_shared/api.js';
import {el, button, table, statusbar, layout} from '../_shared/ui.js';
import {useI18n, metaTitle, watchLocale} from '../_shared/i18n.js';

const register = (core, args, options, metadata) => {
  const proc = core.make('osjs/application', {args, options, metadata});
  const {t} = useI18n(core);

  const body = el('div');
  const sb = statusbar();
  const filter = el('input', {
    class: 'webos-input', i18nPh: 'services.filter', style: {flex: '1'}
  });
  let selected = null;
  let rows = [];
  let win = null;

  const render = () => {
    body.innerHTML = '';
    const q = (filter.value || '').toLowerCase();
    const shown = rows.filter(u =>
      !q || (u.unit + (u.description || '')).toLowerCase().includes(q));
    sb.set(`${shown.length}/${rows.length} ${t('services.units')}`);
    body.appendChild(table(
      [{i18n: 'services.unit'}, 'Load', {i18n: 'services.active'}, 'Sub',
       {i18n: 'services.description'}],
      shown.map(u => [
        u.unit, u.load,
        el('span', {class: `webos-badge ${u.active === 'active' ? 'on' : 'off'}`},
          u.active || '-'),
        u.sub || '', (u.description || '').slice(0, 60)
      ]),
      tr => {
        body.querySelectorAll('tr.selected')
          .forEach(x => x.classList.remove('selected'));
        tr.classList.add('selected');
        selected = shown[Array.from(tr.parentNode.children).indexOf(tr)];
      }
    ));
  };

  const refresh = () => {
    sb.set(t('loading'));
    api.get('services').then(data => {
      rows = data;
      render();
    }).catch(e => sb.error(e.message));
  };

  const act = action => {
    if (!selected) {
      sb.set(t('services.selUnit'));
      return;
    }
    api.post('services/action', {unit: selected.unit, action})
      .then(() => { sb.set(`${action} ${selected.unit}: ok`); refresh(); })
      .catch(e => sb.error(e.message));
  };

  const showStatus = () => {
    if (!selected) {
      sb.set(t('services.selUnit'));
      return;
    }
    api.get(`services/${selected.unit}/status`).then(({output}) => {
      const w = proc.createWindow({
        title: `${t('services.status')}: ${selected.unit}`,
        dimension: {width: 720, height: 440}
      });
      w.render($c => $c.appendChild(el('pre', {style: {
        margin: 0, padding: '10px', height: '100%', overflow: 'auto',
        background: '#17191f', color: '#cde', fontSize: '11px', whiteSpace: 'pre-wrap'
      }}, output)));
    }).catch(e => sb.error(e.message));
  };

  filter.addEventListener('input', render);

  const tb = el('div', {class: 'webos-toolbar'},
    filter,
    button({i18n: 'services.start'}, () => act('start')),
    button({i18n: 'services.stop'}, () => act('stop')),
    button({i18n: 'services.restart'}, () => act('restart')),
    button({i18n: 'services.enable'}, () => act('enable')),
    button({i18n: 'services.disable'}, () => act('disable')),
    button({i18n: 'services.status'}, showStatus),
    button({i18n: 'refresh'}, refresh)
  );

  win = proc.createWindow({
    id: 'WebOSServicesWindow',
    title: metaTitle(core, metadata),
    dimension: {width: 780, height: 480}
  });
  win.on('destroy', () => proc.destroy())
    .render($content => {
      $content.appendChild(layout(tb, body, sb));
      refresh();
    });

  watchLocale(proc, () => {
    win.setTitle(metaTitle(core, metadata));
    render();
  });

  return proc;
};

osjs.register(applicationName, register);
