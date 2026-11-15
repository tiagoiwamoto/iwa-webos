import osjs from 'osjs';
import {name as applicationName} from './metadata.json';
import {api} from '../_shared/api.js';
import {el, button, statusbar, layout} from '../_shared/ui.js';

const APPS = [
  {name: 'WebOSTerminal', glyph: '💻', label: 'Terminal'},
  {name: 'WebOSProcesses', glyph: '📈', label: 'Tasks'},
  {name: 'WebOSServices', glyph: '⚙️', label: 'Services'},
  {name: 'WebOSDocker', glyph: '🐳', label: 'Docker'},
  {name: 'WebOSStore', glyph: '🛒', label: 'App Store'},
  {name: 'WebOSDisks', glyph: '💽', label: 'Disks'},
  {name: 'WebOSUsers', glyph: '👤', label: 'Users'},
  {name: 'FileManager', glyph: '📁', label: 'Files'},
  {name: 'WebOSEditor', glyph: '📝', label: 'Editor'},
  {name: 'WebOSSysInfo', glyph: '📊', label: 'System'},
  {name: 'WebOSLogs', glyph: '📜', label: 'Logs'},
  {name: 'WebOSCron', glyph: '⏰', label: 'Cron'},
  {name: 'Settings', glyph: '🔧', label: 'Settings'}
];

const register = (core, args, options, metadata) => {
  const proc = core.make('osjs/application', {args, options, metadata});

  const body = el('div');
  const sb = statusbar();

  const render = () => {
    body.innerHTML = '';
    const grid = el('div', {class: 'webos-grid'});
    APPS.forEach(a => {
      grid.appendChild(el('div', {
        class: 'webos-iconbtn',
        onclick: () => core.run(a.name).catch(e => sb.error(e.message))
      },
        el('div', {class: 'glyph'}, a.glyph),
        el('div', {}, a.label)));
    });
    body.appendChild(grid);
  };

  proc.createWindow({
    id: 'WebOSPanelWindow',
    title: metadata.title.en_EN,
    dimension: {width: 560, height: 460}
  })
    .on('destroy', () => proc.destroy())
    .render($content => {
      const tb = el('div', {class: 'webos-toolbar'},
        button('Refresh', render),
        el('span', {style: {flex: '1'}}),
        el('span', {style: {color: '#889', fontSize: '11px'}}, 'system control panel'));
      $content.appendChild(layout(tb, body, sb));
      render();
      api.get('system/info')
        .then(i => sb.set(`${i.hostname} · ${i.os}`))
        .catch(() => sb.set('agent offline — check webos-agent service'));
    });

  return proc;
};

osjs.register(applicationName, register);
