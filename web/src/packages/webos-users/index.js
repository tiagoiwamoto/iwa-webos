import osjs from 'osjs';
import {name as applicationName} from './metadata.json';
import {api} from '../_shared/api.js';
import {el, button, table, statusbar, layout, confirmDialog, promptText, formWindow} from '../_shared/ui.js';

const register = (core, args, options, metadata) => {
  const proc = core.make('osjs/application', {args, options, metadata});

  const body = el('div');
  const sb = statusbar();
  let selected = null;
  let rows = [];

  const refresh = () => {
    sb.set('loading...');
    body.innerHTML = '';
    api.get('users').then(data => {
      rows = data;
      sb.set(`${rows.length} users`);
      body.appendChild(table(
        ['User', 'UID', 'Home', 'Shell', 'Groups', 'State'],
        rows.map(u => [
          u.name, u.uid, u.home, u.shell,
          (u.groups || []).join(' '),
          el('span', {class: `webos-badge ${u.locked ? 'off' : 'on'}`},
            u.locked ? 'locked' : 'active')
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
      title: 'New user',
      fields: [
        {name: 'name', label: 'Username'},
        {name: 'password', label: 'Password', type: 'password'},
        {name: 'groups', label: 'Extra groups (comma separated)'}
      ]
    }, v => {
      if (!v || !v.name) {
        return;
      }
      api.post('users', {
        name: v.name,
        password: v.password,
        groups: (v.groups || '').split(',').map(s => s.trim()).filter(Boolean)
      }).then(() => { sb.set(`created ${v.name}`); refresh(); })
        .catch(e => sb.error(e.message));
    });
  };

  const setPw = () => {
    if (!selected) {
      sb.set('select a user first');
      return;
    }
    promptText(core, 'Set password', `New password for ${selected.name}`)
      .then(password => {
        if (!password) {
          return;
        }
        api.post('users/password', {name: selected.name, password})
          .then(() => sb.set('password updated'))
          .catch(e => sb.error(e.message));
      });
  };

  const lock = lockIt => {
    if (!selected) {
      sb.set('select a user first');
      return;
    }
    api.post(`users/${lockIt ? 'lock' : 'unlock'}`, {name: selected.name})
      .then(() => { sb.set('ok'); refresh(); })
      .catch(e => sb.error(e.message));
  };

  const remove = () => {
    if (!selected) {
      sb.set('select a user first');
      return;
    }
    confirmDialog(core, 'Delete user',
      `Delete ${selected.name} and their home directory?`)
      .then(ok => ok && api.del(`users/${selected.name}`, {remove_home: true})
        .then(() => { sb.set('deleted'); refresh(); })
        .catch(e => sb.error(e.message)));
  };

  const tb = el('div', {class: 'webos-toolbar'},
    button('+ New user', createUser),
    button('Set password', setPw),
    button('Lock', () => lock(true)),
    button('Unlock', () => lock(false)),
    button('✕ Delete', remove, 'danger'),
    button('Refresh', refresh)
  );

  proc.createWindow({
    id: 'WebOSUsersWindow',
    title: metadata.title.en_EN,
    dimension: {width: 720, height: 430}
  })
    .on('destroy', () => proc.destroy())
    .render($content => {
      $content.appendChild(layout(tb, body, sb));
      refresh();
    });

  return proc;
};

osjs.register(applicationName, register);
