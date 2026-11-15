import osjs from 'osjs';
import {name as applicationName} from './metadata.json';
import {el, css} from '../_shared/ui.js';

css('webos-browser', `
  .nn-root { display: flex; flex-direction: column; height: 100%; width: 100%;
    background: #c0c0c0; font-family: "MS Sans Serif", Tahoma, Verdana, sans-serif;
    font-size: 12px; color: #000; }
  .nn-menus { display: flex; gap: 2px; padding: 2px 6px; background: #c0c0c0;
    border-bottom: 1px solid #808080; }
  .nn-menus span { padding: 1px 7px; cursor: default; }
  .nn-menus span:hover { background: #000080; color: #fff; }
  .nn-toolbar { display: flex; gap: 4px; padding: 4px 6px; align-items: center;
    background: #c0c0c0; border-bottom: 2px groove #dfdfdf; }
  .nn-btn { display: flex; flex-direction: column; align-items: center; gap: 1px;
    min-width: 52px; padding: 3px 6px; background: #c0c0c0; color: #000;
    border: 2px outset #efefef; font: 11px Tahoma, sans-serif; cursor: pointer; }
  .nn-btn:active { border-style: inset; }
  .nn-btn:disabled { color: #808080; cursor: default; }
  .nn-btn:disabled:active { border-style: outset; }
  .nn-btn .ic { font-size: 16px; line-height: 1; }
  .nn-throb { margin-left: auto; width: 34px; height: 34px; border: 2px inset #efefef;
    display: flex; align-items: center; justify-content: center;
    font: bold 20px/1 Georgia, serif; color: #ffe; background: #0a4a8a; }
  .nn-throb.on { animation: nnspin 0.9s infinite; background: #c0392b; }
  @keyframes nnspin { 0% {transform: rotate(0)} 100% {transform: rotate(360deg)} }
  .nn-locbar { display: flex; gap: 6px; align-items: center; padding: 4px 6px;
    background: #c0c0c0; border-bottom: 1px solid #808080; }
  .nn-locbar label { font-weight: bold; }
  .nn-loc { flex: 1; border: 2px inset #fff; background: #fff; color: #000;
    padding: 3px 5px; font: 12px monospace; }
  .nn-proxy { display: flex; align-items: center; gap: 3px; font-size: 11px; }
  .nn-view { flex: 1 1 auto; border: 2px inset #808080; margin: 0; background: #fff; }
  .nn-status { display: flex; align-items: center; gap: 8px; padding: 2px 6px;
    background: #c0c0c0; border-top: 2px groove #dfdfdf; font-size: 11px; }
  .nn-msg { flex: 1; border: 1px inset #fff; padding: 1px 6px; background: #c0c0c0; }
`);

const MENUS = ['File', 'Edit', 'View', 'Go', 'Bookmarks', 'Options', 'Directory', 'Window', 'Help'];

const HOME_HTML = `<!DOCTYPE html><html><body bgcolor="#c0c0c0" text="#000" link="#0000ee">
<center><table width="70%"><tr><td align="center">
<font face="Georgia,serif" size="7" color="#0a4a8a"><b>N</b></font>
<h2>Netscape Navigator</h2>
<p>Welcome aboard, navigator. Type an address in <b>Location</b> or pick a destination:</p>
<table cellpadding="8"><tr>
<td bgcolor="#e8e8e8"><a href="https://lite.duckduckgo.com/lite/"><b>DuckDuckGo Lite</b></a><br><font size="2">search</font></td>
<td bgcolor="#e8e8e8"><a href="https://en.wikipedia.org"><b>Wikipedia</b></a><br><font size="2">encyclopedia</font></td>
<td bgcolor="#e8e8e8"><a href="https://news.ycombinator.com"><b>Hacker News</b></a><br><font size="2">tech news</font></td>
</tr></table>
<p><font size="2" color="#444">Some sites refuse to load inside a window — tick <b>proxy</b> to fetch them through the server.</font></p>
</td></tr></table></center>
<script>document.addEventListener('click',function(e){var a=e.target.closest('a[href]');if(a){e.preventDefault();parent.postMessage({webosNav:a.href},'*')}});</script>
</body></html>`;

const register = (core, args, options, metadata) => {
  const proc = core.make('osjs/application', {args, options, metadata});
  const frame = el('iframe', {class: 'nn-view', sandbox: 'allow-scripts allow-forms allow-popups'});
  const msg = el('span', {class: 'nn-msg'}, 'Document: Done');
  const throb = el('div', {class: 'nn-throb'}, 'N');
  const url = el('input', {class: 'nn-loc', spellcheck: 'false'});
  const proxy = el('input', {type: 'checkbox'});
  const hist = [];
  let hi = -1;

  const back = el('button', {class: 'nn-btn'}, el('span', {class: 'ic'}, '⬅'), 'Back');
  const fwd = el('button', {class: 'nn-btn'}, el('span', {class: 'ic'}, '➡'), 'Forward');
  const state = () => { back.disabled = hi <= 0; fwd.disabled = hi >= hist.length - 1; };

  const normalize = u => {
    u = (u || '').trim();
    if (!u) return '';
    if (!/^[a-z]+:/i.test(u)) u = (u.includes('.') && !u.includes(' ') ? 'https://' : 'https://lite.duckduckgo.com/lite/?q=') + (u.includes('.') && !u.includes(' ') ? u : encodeURIComponent(u));
    return u;
  };

  const load = u => {
    msg.textContent = 'Loading ' + u + ' ...';
    throb.classList.add('on');
    frame.removeAttribute('srcdoc');
    frame.src = proxy.checked
      ? '/api/webos/browser/browse?url=' + encodeURIComponent(u)
      : u;
  };

  const nav = u => {
    u = normalize(u);
    if (!u) return;
    hist.splice(hi + 1);
    hist.push(u);
    hi = hist.length - 1;
    url.value = u;
    state();
    load(u);
  };

  back.onclick = () => { if (hi > 0) { hi--; url.value = hist[hi]; state(); load(hist[hi]); } };
  fwd.onclick = () => { if (hi < hist.length - 1) { hi++; url.value = hist[hi]; state(); load(hist[hi]); } };

  frame.addEventListener('load', () => {
    throb.classList.remove('on');
    msg.textContent = 'Document: Done';
  });
  url.addEventListener('keydown', e => { if (e.key === 'Enter') nav(url.value); });

  const onMsg = e => { if (e.data && e.data.webosNav) nav(e.data.webosNav); };
  window.addEventListener('message', onMsg);

  const home = () => {
    url.value = '';
    throb.classList.remove('on');
    frame.srcdoc = HOME_HTML;
    msg.textContent = 'Document: Done';
  };

  proc.createWindow({
    id: 'WebOSBrowserWindow',
    title: 'Netscape Navigator — Malta OS',
    dimension: {width: 920, height: 560}
  })
    .on('destroy', () => { window.removeEventListener('message', onMsg); proc.destroy(); })
    .render($c => {
      $c.appendChild(el('div', {class: 'nn-root'},
        el('div', {class: 'nn-menus'}, ...MENUS.map(m => el('span', {}, m))),
        el('div', {class: 'nn-toolbar'},
          back, fwd,
          (() => { const b = el('button', {class: 'nn-btn'}, el('span', {class: 'ic'}, '⟳'), 'Reload'); b.onclick = () => load(url.value || hist[hi] || ''); return b; })(),
          (() => { const b = el('button', {class: 'nn-btn'}, el('span', {class: 'ic'}, '⌂'), 'Home'); b.onclick = home; return b; })(),
          (() => { const b = el('button', {class: 'nn-btn'}, el('span', {class: 'ic'}, '✕'), 'Stop'); b.onclick = () => { frame.src = 'about:blank'; throb.classList.remove('on'); msg.textContent = 'Stopped.'; }; return b; })(),
          throb),
        el('div', {class: 'nn-locbar'},
          el('label', {}, 'Location:'), url,
          el('label', {class: 'nn-proxy'}, proxy, 'proxy'),
          (() => { const b = el('button', {class: 'nn-btn', style: 'min-width:40px'}, 'Go'); b.onclick = () => nav(url.value); return b; })()),
        frame,
        el('div', {class: 'nn-status'}, '🔒', msg)));
      state();
      home();
    });

  return proc;
};

osjs.register(applicationName, register);
