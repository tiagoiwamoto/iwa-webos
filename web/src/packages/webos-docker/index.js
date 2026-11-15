import osjs from 'osjs';
import {name as applicationName} from './metadata.json';
import {api, formatBytes} from '../_shared/api.js';
import {el, button, table, statusbar, layout, confirmDialog} from '../_shared/ui.js';

const badge = on => el('span', {class: `webos-badge ${on ? 'on' : 'off'}`},
  on ? 'running' : 'stopped');

const register = (core, args, options, metadata) => {
  const proc = core.make('osjs/application', {args, options, metadata});

  let tab = 'containers';
  const body = el('div');
  const sb = statusbar();
  let selected = null;

  const refresh = () => {
    sb.set('loading...');
    body.innerHTML = '';
    selected = null;

    const p = tab === 'containers'
      ? api.get('docker/containers')
      : api.get('docker/images');

    p.then(rows => {
      sb.set(`${rows.length} ${tab}`);
      if (tab === 'containers') {
        body.appendChild(table(
          ['Name', 'Image', 'Status', 'Ports'],
          rows.map(c => [
            c.name, c.image, badge(c.status === 'running'),
            Object.entries(c.ports || {})
              .map(([k, v]) => v ? `${v}->${k}` : k).join(', ')
          ]),
          tr => {
            body.querySelectorAll('tr.selected')
              .forEach(x => x.classList.remove('selected'));
            tr.classList.add('selected');
            selected = rows[Array.from(tr.parentNode.children).indexOf(tr)];
          }
        ));
      } else {
        body.appendChild(table(
          ['Tag', 'ID', 'Size', 'Created'],
          rows.map(i => [i.tag, i.id, formatBytes(i.size),
            (i.created || '').slice(0, 10)]),
          tr => {
            body.querySelectorAll('tr.selected')
              .forEach(x => x.classList.remove('selected'));
            tr.classList.add('selected');
            selected = rows[Array.from(tr.parentNode.children).indexOf(tr)];
          }
        ));
      }
    }).catch(e => {
      sb.error(e.message);
      body.appendChild(el('div', {style: {padding: '20px'}},
        `Docker unavailable: ${e.message}`));
    });
  };

  const act = action => {
    if (!selected) {
      sb.set('select a row first');
      return;
    }
    const id = selected.id;
    const run = () => (tab === 'containers'
      ? api.post(`docker/containers/${id}/action`, {action, force: true})
      : api.del(`docker/images/${encodeURIComponent(id)}`, {force: action === 'remove'}));

    run().then(() => { sb.set(`${action} ok`); refresh(); })
      .catch(e => sb.error(e.message));
  };

  const logs = () => {
    if (tab !== 'containers' || !selected) {
      sb.set('select a container first');
      return;
    }
    api.get(`docker/containers/${selected.id}/logs`, {tail: 300})
      .then(({logs: text}) => {
        const w = proc.createWindow({
          title: `Logs: ${selected.name}`,
          dimension: {width: 700, height: 420}
        });
        w.render($c => {
          const pre = el('pre', {style: {
            margin: 0, padding: '10px', height: '100%', overflow: 'auto',
            background: '#17191f', color: '#cde', fontSize: '11px',
            whiteSpace: 'pre-wrap', wordBreak: 'break-all'
          }}, text || '(no logs)');
          $c.appendChild(pre);
          pre.scrollTop = pre.scrollHeight;
        });
      })
      .catch(e => sb.error(e.message));
  };

  const tb = el('div', {class: 'webos-toolbar'},
    button('Containers', () => { tab = 'containers'; refresh(); }),
    button('Images', () => { tab = 'images'; refresh(); }),
    el('span', {style: {width: '12px'}}),
    button('▶ Start', () => act('start')),
    button('■ Stop', () => act('stop')),
    button('↻ Restart', () => act('restart')),
    button('Logs', logs),
    button('✕ Remove', () => {
      if (!selected) {
        sb.set('select a row first');
        return;
      }
      confirmDialog(core, 'Confirm', `Remove ${selected.name || selected.tag}?`)
        .then(ok => ok && act('remove'));
    }, 'remove'),
    button('Refresh', refresh)
  );

  proc.createWindow({
    id: 'WebOSDockerWindow',
    title: metadata.title.en_EN,
    dimension: {width: 720, height: 460}
  })
    .on('destroy', () => proc.destroy())
    .render($content => {
      $content.appendChild(layout(tb, body, sb));
      refresh();
    });

  return proc;
};

osjs.register(applicationName, register);
