import osjs from 'osjs';
import {name as applicationName} from './metadata.json';
import {api} from '../_shared/api.js';
import {el, button, table, statusbar, layout, confirmDialog} from '../_shared/ui.js';

const SORTS = {
  cpu: (a, b) => b.cpu - a.cpu,
  mem: (a, b) => b.mem - a.mem,
  pid: (a, b) => a.pid - b.pid,
  name: (a, b) => a.name.localeCompare(b.name)
};

const register = (core, args, options, metadata) => {
  const proc = core.make('osjs/application', {args, options, metadata});

  const body = el('div');
  const sb = statusbar();
  const filter = el('input', {
    class: 'webos-input', placeholder: 'filter by name/cmd/user',
    style: {width: '220px'}
  });
  let rows = [];
  let selected = null;
  let sortKey = 'cpu';
  let timer = null;

  const refresh = () => {
    api.get('processes', {sample_ms: 300}).then(data => {
      rows = data;
      render();
    }).catch(e => sb.error(e.message));
  };

  const render = () => {
    body.innerHTML = '';
    const f = filter.value.toLowerCase();
    const list = rows
      .filter(p => !f || (p.name + p.cmd + p.user).toLowerCase().includes(f))
      .sort(SORTS[sortKey]);
    sb.set(`${list.length} processes (of ${rows.length})`);
    body.appendChild(table(
      ['PID', 'User', 'Name', 'CPU%', 'MEM%', 'Threads', 'Status', 'Command'],
      list.map(p => [
        p.pid, p.user, p.name, p.cpu, p.mem, p.threads, p.status,
        el('span', {title: p.cmd, style: {
          display: 'inline-block', maxWidth: '340px', overflow: 'hidden',
          textOverflow: 'ellipsis', whiteSpace: 'nowrap', verticalAlign: 'bottom'
        }}, p.cmd)
      ]),
      tr => {
        body.querySelectorAll('tr.selected')
          .forEach(x => x.classList.remove('selected'));
        tr.classList.add('selected');
        selected = list[Array.from(tr.parentNode.children).indexOf(tr)];
      }
    ));
  };

  const kill = sig => {
    if (!selected) {
      sb.set('select a process first');
      return;
    }
    const p = selected;
    confirmDialog(core, 'Signal process',
      `Send SIG${sig === 'kill' ? 'KILL' : sig.toUpperCase()} to ${p.name} (pid ${p.pid})?`)
      .then(ok => ok && api.post(`processes/${p.pid}/signal`, {signal: sig})
        .then(() => { sb.set(`signaled ${p.pid}`); refresh(); })
        .catch(e => sb.error(e.message)));
  };

  const sorter = key => () => { sortKey = key; render(); };

  const tb = el('div', {class: 'webos-toolbar'},
    filter,
    button('Sort CPU', sorter('cpu')),
    button('Sort MEM', sorter('mem')),
    button('Sort PID', sorter('pid')),
    button('Sort name', sorter('name')),
    el('span', {style: {flex: '1'}}),
    button('End (SIGTERM)', () => kill('term')),
    button('Kill (SIGKILL)', () => kill('kill'), 'danger'),
    button('Refresh', refresh)
  );

  proc.createWindow({
    id: 'WebOSProcessesWindow',
    title: metadata.title.en_EN,
    dimension: {width: 860, height: 480}
  })
    .on('destroy', () => {
      if (timer) {
        clearInterval(timer);
      }
      proc.destroy();
    })
    .render($content => {
      filter.addEventListener('input', render);
      $content.appendChild(layout(tb, body, sb));
      refresh();
      timer = setInterval(refresh, 3000);
    });

  return proc;
};

osjs.register(applicationName, register);
