import osjs from 'osjs';
import {name as applicationName} from './metadata.json';
import {api} from '../_shared/api.js';
import {el, button, table, statusbar, layout, confirmDialog, promptText, formWindow} from '../_shared/ui.js';
import {useI18n, metaTitle, watchLocale} from '../_shared/i18n.js';

const register = (core, args, options, metadata) => {
  const proc = core.make('osjs/application', {args, options, metadata});
  const {t} = useI18n(core);
  let win = null;

  const body = el('div');
  const sb = statusbar();
  let selected = null;
  let rows = [];

  const refresh = () => {
    sb.set(t('loading'));
    body.innerHTML = '';
    api.get('users').then(data => {
      rows = data;
      sb.set(t('users.count', {n: rows.length}));
      body.appendChild(table(
        [{i18n: 'users.user'}, 'UID', 'Home', 'Shell',
         {i18n: 'users.groups'}, {i18n: 'users.state'}],
        rows.map(u => [
          u.name, u.uid, u.home, u.shell,
          (u.groups || []).join(' '),
          el('span', {class: `webos-badge ${u.locked ? 'off' : 'on'}`},
            u.locked ? t('users.locked') : t('users.active'))
        ]),
        tr => {
          body.querySelectorAll('tr.selected')
            .forEach(x => x.classList.remove('selected'));
          tr.classList.add('selected');
          selected = rows[Array.from(tr.parentNode.children).indexOf(tr)];
        }
      ));
    }).catch(e => sb.error(e.message));
  };

  const createUser = () => {
    formWindow(proc, {
      title: t('users.newUser'),
      fields: [
        {name: 'name', label: t('users.user')},
        {name: 'password', label: t('users.password'), type: 'password'},
        {name: 'groups', label: t('users.extraGroups')}
      ]
    }, v => {
      if (!v || !v.name) {
        return;
      }
      api.post('users', {
        name: v.name,
        password: v.password,
        groups: (v.groups || '').split(',').map(s => s.trim()).filter(Boolean)
      }).then(() => { sb.set(t('users.created', {name: v.name})); refresh(); })
        .catch(e => sb.error(e.message));
    });
  };

  const setPw = () => {
    if (!selected) {
      sb.set(t('users.selFirst'));
      return;
    }
    promptText(core, t('users.setPw'), t('users.newPwFor', {name: selected.name}))
      .then(password => {
        if (!password) {
          return;
        }
        api.post('users/password', {name: selected.name, password})
          .then(() => sb.set(t('users.pwUpdated')))
          .catch(e => sb.error(e.message));
      });
  };

  const lock = lockIt => {
    if (!selected) {
      sb.set(t('users.selFirst'));
      return;
    }
    api.post(`users/${lockIt ? 'lock' : 'unlock'}`, {name: selected.name})
      .then(() => { sb.set('ok'); refresh(); })
      .catch(e => sb.error(e.message));
  };

  const remove = () => {
    if (!selected) {
      sb.set(t('users.selFirst'));
      return;
    }
    confirmDialog(core, t('users.delUser'),
      t('users.delUserMsg', {name: selected.name}))
      .then(ok => ok && api.del(`users/${selected.name}`, {remove_home: true})
        .then(() => { sb.set(t('users.deleted')); refresh(); })
        .catch(e => sb.error(e.message)));
  };

  const tb = el('div', {class: 'webos-toolbar'},
    button({i18n: 'users.newUser'}, createUser),
    button({i18n: 'users.setPw'}, setPw),
    button({i18n: 'users.lock'}, () => lock(true)),
    button({i18n: 'users.unlock'}, () => lock(false)),
    button({i18n: 'del'}, remove, 'danger'),
    button({i18n: 'refresh'}, refresh)
  );

  win = proc.createWindow({
    id: 'WebOSUsersWindow',
    title: metaTitle(core, metadata),
    dimension: {width: 720, height: 430}
  })
    .on('destroy', () => proc.destroy())
    .render($content => {
      $content.appendChild(layout(tb, body, sb));
      refresh();
    });

  watchLocale(proc, () => {
    win.setTitle(metaTitle(core, metadata));
    refresh();
  });

  return proc;
};

osjs.register(applicationName, register);
