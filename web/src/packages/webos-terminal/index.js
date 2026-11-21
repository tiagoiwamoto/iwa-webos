import osjs from 'osjs';
import {name as applicationName} from './metadata.json';
import {Terminal} from 'xterm';
import {FitAddon} from 'xterm-addon-fit';
import {terminalSocket} from '../_shared/api.js';
import {el, css, statusbar} from '../_shared/ui.js';
import {createLocalizedWindow} from '../_shared/i18n.js';

const ensureXtermCss = () => {
  if (!document.querySelector('link[href="/xterm.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/xterm.css';
    document.head.appendChild(link);
  }
};

css('webos-terminal', `
  .wterm-tabs { display: flex; gap: 2px; background: #2a2e37; padding: 4px 4px 0;
    flex: 0 0 auto; overflow-x: auto; }
  .wterm-tab { display: flex; align-items: center; gap: 6px; padding: 3px 10px;
    background: #22252d; color: #aab; border: 1px solid #17191f;
    border-bottom: none; border-radius: 5px 5px 0 0; cursor: pointer;
    font-size: 12px; white-space: nowrap; }
  .wterm-tab.active { background: #17191f; color: #e8e8e8; }
  .wterm-tab .x { color: #788; padding: 0 2px; border-radius: 3px; }
  .wterm-tab .x:hover { background: #6e3038; color: #fff; }
  .wterm-new { padding: 3px 10px; background: none; color: #9ab; border: none;
    cursor: pointer; font-size: 14px; }
  .wterm-pane { flex: 1 1 auto; min-height: 0; background: #17191f; padding: 2px; }
`);

const register = (core, args, options, metadata) => {
  const proc = core.make('osjs/application', {args, options, metadata});
  ensureXtermCss();

  const sb = statusbar();
  const tabsBar = el('div', {class: 'wterm-tabs'});
  const panes = el('div', {class: 'wterm-pane'});
  const tabs = [];
  let active = -1;
  let seq = 0;
  let observer = null;

  const renderTabs = () => {
    tabsBar.innerHTML = '';
    tabs.forEach((t, i) => {
      tabsBar.appendChild(el('div', {
        class: `wterm-tab${i === active ? ' active' : ''}`,
        onclick: () => select(i)
      },
      el('span', {}, t.title),
      el('span', {
        class: 'x', title: 'close tab',
        onclick: ev => {
          ev.stopPropagation(); closeTab(i);
        }
      }, '×')));
    });
    tabsBar.appendChild(el('button', {
      class: 'wterm-new', title: 'new tab',
      onclick: () => openTab()
    }, '+'));
  };

  const select = i => {
    active = i;
    tabs.forEach((t, j) => {
      t.pane.style.display = j === i ? '' : 'none';
    });
    if (i >= 0 && tabs[i]) {
      const t = tabs[i];
      t.fit.fit();
      t.term.focus();
      sendResize(t);
    }
    renderTabs();
  };

  const sendResize = t => {
    if (t.ws && t.ws.readyState === WebSocket.OPEN) {
      t.ws.send(JSON.stringify({type: 'resize', cols: t.term.cols, rows: t.term.rows}));
    }
  };

  const closeTab = i => {
    const t = tabs[i];
    if (!t) {
      return;
    }
    if (t.ws) {
      try {
        t.ws.close();
      } catch (e) { /* noop */ }
    }
    t.term.dispose();
    t.pane.remove();
    tabs.splice(i, 1);
    if (tabs.length === 0) {
      proc.destroy();
      return;
    }
    select(Math.min(i, tabs.length - 1));
  };

  const openTab = () => {
    const n = ++seq;
    const pane = el('div', {style: {height: '100%', width: '100%'}});
    panes.appendChild(pane);

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      theme: {background: '#17191f'}
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(pane);

    const t = {title: `shell ${n}`, term, fit, pane, ws: null};
    tabs.push(t);

    const ws = terminalSocket();
    ws.binaryType = 'arraybuffer';
    ws.onopen = () => {
      sb.set(`${tabs.length} session(s)`);
      sendResize(t);
      if (tabs[active] === t) {
        t.term.focus();
      }
    };
    ws.onmessage = ev => {
      term.write(ev.data instanceof ArrayBuffer ? new Uint8Array(ev.data) : ev.data);
    };
    ws.onclose = () => {
      t.title = `shell ${n} (closed)`;
      term.write('\r\n\x1b[31m[session closed]\x1b[0m\r\n');
      renderTabs();
    };
    ws.onerror = () => sb.error('websocket error');
    t.ws = ws;

    term.onData(d => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(d);
      }
    });

    select(tabs.length - 1);
  };

  createLocalizedWindow(proc, {
    id: 'WebOSTerminalWindow',
    dimension: {width: 780, height: 440}
  })
    .on('destroy', () => {
      tabs.forEach(t => {
        if (t.ws) {
          try {
            t.ws.close();
          } catch (e) { /* noop */ }
        }
      });
      if (observer) {
        observer.disconnect();
      }
      proc.destroy();
    })
    .render($content => {
      sb.set('');
      $content.appendChild(el('div', {
        style: {display: 'flex', flexDirection: 'column', height: '100%'}
      }, tabsBar, panes, sb));

      observer = new ResizeObserver(() => {
        if (active >= 0 && tabs[active]) {
          tabs[active].fit.fit();
          sendResize(tabs[active]);
        }
      });
      observer.observe(panes);

      openTab();
    });

  return proc;
};

osjs.register(applicationName, register);
