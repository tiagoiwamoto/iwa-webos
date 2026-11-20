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

  const recreate = () => {
    if (tab !== 'containers' || !selected) {
      sb.set('select a container first');
      return;
    }
    api.get(`docker/containers/${selected.id}/inspect`).then(spec => {
      const envRows = spec.env.map(e => {
        const i = e.indexOf('=');
        const k = i < 0 ? e : e.slice(0, i);
        return {k, v: i < 0 ? '' : e.slice(i + 1), origK: k,
          del: false, orig: true};
      });
      const portRows = spec.ports.map(p => ({cp: p.container, hp: p.host,
        origCp: p.container, del: false, orig: true}));

      const input = (val, width, ph) => el('input', {
        class: 'webos-input', value: val, placeholder: ph || '',
        style: {width, padding: '3px 6px', fontSize: '11px'}
      });
      const sec = t => el('div', {style: {fontWeight: 'bold', color: '#8cf',
        marginTop: '8px'}}, t);
      const lbl = t => el('span', {style: {color: '#9ab', fontSize: '11px'}}, t);

      const portBox = el('div');
      const renderPorts = () => {
        portBox.innerHTML = '';
        portRows.filter(r => !r.del).forEach(r => {
          const cp = input(r.cp, '90px', '80/tcp');
          const hp = input(r.hp, '90px', 'host');
          cp.oninput = () => { r.cp = cp.value; };
          hp.oninput = () => { r.hp = hp.value; };
          portBox.appendChild(el('div', {style: {display: 'flex', gap: '6px',
            alignItems: 'center'}},
            cp, lbl('→'), hp,
            button('✕', () => { r.del = true; renderPorts(); })));
        });
      };
      renderPorts();

      const envBox = el('div');
      const renderEnv = () => {
        envBox.innerHTML = '';
        envRows.filter(r => !r.del).forEach(r => {
          const k = input(r.k, '150px', 'NAME');
          const v = input(r.v, '230px', 'value');
          k.oninput = () => { r.k = k.value; };
          v.oninput = () => { r.v = v.value; };
          envBox.appendChild(el('div', {style: {display: 'flex', gap: '6px',
            alignItems: 'center'}},
            k, lbl('='), v,
            button('✕', () => { r.del = true; renderEnv(); })));
        });
      };
      renderEnv();

      const restartSel = el('select', {class: 'webos-input',
        style: {padding: '3px 6px'}},
        ...['', 'no', 'always', 'unless-stopped', 'on-failure']
          .map(o => el('option', {value: o,
            selected: o === spec.restart}, o || '(keep)')));
      const cmdIn = input(spec.command || '', '420px', 'command (blank = keep)');
      const foot = el('div', {style: {display: 'flex', gap: '8px',
        marginTop: '10px'}});

      const win = proc.createWindow({
        title: `Recreate: ${spec.name}`,
        dimension: {width: 540, height: 480}
      });
      win.render($c => {
        foot.appendChild(button('Recreate', () => {
          const ports = {};
          portRows.forEach(r => {
            if (r.del) {
              if (r.orig) ports[r.origCp] = null;
            } else if (r.cp && r.hp) {
              ports[r.cp] = r.hp;
            }
          });
          const envSet = {}, envDel = [];
          envRows.forEach(r => {
            if (r.del) {
              if (r.orig) envDel.push(r.origK);
            } else if (r.k) {
              envSet[r.k] = r.v;
            }
          });
          const payload = {ports, env_set: envSet, env_del: envDel,
            restart: restartSel.value};
          if (cmdIn.value.trim() && cmdIn.value.trim() !== spec.command)
            payload.command = cmdIn.value.trim();
          api.post(`docker/containers/${selected.id}/recreate`, payload)
            .then(() => {
              win.destroy();
              sb.set(`recreated ${spec.name}`);
              refresh();
            })
            .catch(e => sb.error(e.message));
        }));
        foot.appendChild(button('Cancel', () => win.destroy()));
        $c.appendChild(el('div', {style: {
          display: 'flex', flexDirection: 'column', gap: '6px', height: '100%',
          padding: '12px', overflow: 'auto', background: '#20232a',
          color: '#e8e8e8', fontSize: '12px'
        }},
          el('div', {style: {color: '#9ab'}},
            `${spec.image} · ${spec.network || 'bridge'} · ${spec.status}`),
          sec('Ports (container → host)'), portBox,
          button('+ add port', () => {
            portRows.push({cp: '', hp: '', del: false, orig: false});
            renderPorts();
          }),
          sec('Environment'), envBox,
          button('+ add var', () => {
            envRows.push({k: '', v: '', del: false, orig: false});
            renderEnv();
          }),
          sec('Restart policy'), restartSel,
          sec('Command'), cmdIn, foot));
      });
    }).catch(e => sb.error(e.message));
  };

  const tb = el('div', {class: 'webos-toolbar'},
    button('Containers', () => { tab = 'containers'; refresh(); }),
    button('Images', () => { tab = 'images'; refresh(); }),
    el('span', {style: {width: '12px'}}),
    button('▶ Start', () => act('start')),
    button('■ Stop', () => act('stop')),
    button('↻ Restart', () => act('restart')),
    button('✎ Recreate', recreate),
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
