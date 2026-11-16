/*
 * Minimal DOM helpers so apps don't need a framework.
 */
import {useI18n} from './i18n.js';

// translate through the global OSjs api (window.OSjs.make) — available in
// every package bundle without threading `core` through el()
const tGlobal = () => {
  try {
    return useI18n(window.OSjs).t;
  } catch (e) {
    return key => key;
  }
};

// re-translate every element tagged with data-i18n* on locale change —
// this is what makes open windows follow the language live
if (typeof document !== 'undefined' && !document.__webosI18nBound) {
  document.__webosI18nBound = true;
  document.addEventListener('webos:locale', () => {
    const t = tGlobal();
    document.querySelectorAll('[data-i18n]').forEach(n => {
      n.textContent = t(n.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(n => {
      n.placeholder = t(n.dataset.i18nPh);
    });
    document.querySelectorAll('[data-i18n-title]').forEach(n => {
      n.title = t(n.dataset.i18nTitle);
    });
  });
}

export const el = (tag, attrs = {}, ...children) => {
  const node = document.createElement(tag);
  const t = tGlobal();
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'style' && typeof v === 'object') {
      Object.assign(node.style, v);
    } else if (k === 'i18n') {
      node.dataset.i18n = v;
      node.textContent = t(v);
    } else if (k === 'i18nPh') {
      node.dataset.i18nPh = v;
      node.placeholder = t(v);
    } else if (k === 'i18nTitle') {
      node.dataset.i18nTitle = v;
      node.title = t(v);
    } else if (k.startsWith('on')) {
      node.addEventListener(k.slice(2).toLowerCase(), v);
    } else if (k === 'class') {
      node.className = v;
    } else if (v !== null && v !== undefined && v !== false) {
      node.setAttribute(k, v === true ? '' : v);
    }
  });
  children.flat(9).forEach(c => {
    if (c === null || c === undefined || c === false) {
      return;
    }
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return node;
};

export const css = (() => {
  const done = new Set();
  return (id, text) => {
    if (done.has(id)) {
      return;
    }
    done.add(id);
    const style = document.createElement('style');
    style.dataset.webos = id;
    style.textContent = text;
    document.head.appendChild(style);
  };
})();

export const toolbar = (...items) => el('div', {class: 'webos-toolbar'}, ...items);

// label: string, or {i18n: 'ns.key'} for a live-translated caption.
// 3rd/4th arg: a tooltip string, or a known modifier class ('danger',
// 'primary') — callers historically passed 'danger' as the 3rd arg.
export const button = (label, onclick, title, cls) => {
  const i18n = label && label.i18n;
  const isCls = v => v === 'danger' || v === 'primary';
  const b = el('button', {class: 'webos-btn', onclick,
    title: isCls(title) ? undefined : title,
    ...(i18n ? {i18n} : {})}, i18n ? '' : label);
  [title, cls].forEach(c => isCls(c) && b.classList.add(c));
  return b;
};

// columns: strings or {i18n: 'ns.key'} — headers also re-translate live
export const table = (columns, rows, onRow) => {
  const thead = el('thead', {},
    el('tr', {}, ...columns.map(c => c && c.i18n
      ? el('th', {i18n: c.i18n})
      : el('th', {}, c))));
  const tbody = el('tbody', {}, ...rows.map(r => {
    const tr = el('tr', {}, ...r.map(c =>
      el('td', {}, c instanceof Node ? c : String(c ?? ''))));
    if (onRow) {
      tr.addEventListener('click', () => onRow(tr));
    }
    return tr;
  }));
  return el('table', {class: 'webos-table'}, thead, tbody);
};

export const statusbar = () => {
  const node = el('div', {class: 'webos-status'});
  node.set = msg => { node.textContent = msg; };
  node.error = msg => {
    node.textContent = `Error: ${msg}`;
    node.style.color = '#f66';
    setTimeout(() => { node.style.color = ''; }, 4000);
  };
  return node;
};

export const baseStyles = () => css('base', `
  .webos-root { display: flex; flex-direction: column; height: 100%; width: 100%;
    font-family: sans-serif; font-size: 13px; background: #20232a; color: #e8e8e8; }
  .webos-toolbar { display: flex; gap: 6px; padding: 6px; align-items: center;
    background: #2a2e37; border-bottom: 1px solid #17191f; flex: 0 0 auto; flex-wrap: wrap; }
  .webos-body { flex: 1 1 auto; overflow: auto; padding: 0; }
  .webos-body.padded { padding: 10px; }
  .webos-table { width: 100%; border-collapse: collapse; }
  .webos-table th { text-align: left; padding: 6px 8px; background: #2a2e37;
    position: sticky; top: 0; border-bottom: 1px solid #17191f; }
  .webos-table td { padding: 5px 8px; border-bottom: 1px solid #262a33; }
  .webos-table tbody tr:hover { background: #2d3244; }
  .webos-table tbody tr.selected { background: #3a4160; }
  .webos-btn { background: #3a4150; color: #e8e8e8; border: 1px solid #4a5165;
    border-radius: 3px; padding: 4px 10px; cursor: pointer; font-size: 12px; }
  .webos-btn:hover { background: #4a5165; }
  .webos-btn.danger { background: #6e3038; border-color: #8a4148; }
  .webos-btn.danger:hover { background: #8a4148; }
  .webos-input { background: #17191f; color: #e8e8e8; border: 1px solid #3a4150;
    border-radius: 3px; padding: 4px 8px; font-size: 12px; }
  .webos-status { padding: 4px 8px; background: #2a2e37; border-top: 1px solid #17191f;
    flex: 0 0 auto; min-height: 22px; font-size: 12px; color: #aab; }
  .webos-badge { display: inline-block; padding: 1px 7px; border-radius: 8px;
    font-size: 11px; }
  .webos-badge.on { background: #2c5b2f; color: #9f9; }
  .webos-badge.off { background: #4a4a4a; color: #bbb; }
  .webos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    gap: 14px; padding: 18px; }
  .webos-iconbtn { display: flex; flex-direction: column; align-items: center; gap: 8px;
    padding: 14px 8px; background: #262a33; border: 1px solid #333845; border-radius: 6px;
    cursor: pointer; text-align: center; }
  .webos-iconbtn:hover { background: #313748; }
  .webos-iconbtn .glyph { font-size: 30px; }
  .webos-kv { display: grid; grid-template-columns: 160px 1fr; gap: 4px 12px; }
  .webos-kv b { color: #9ab; }
`);

export const layout = (tb, body, sb) => {
  baseStyles();
  const b = el('div', {class: 'webos-body'}, body);
  return el('div', {class: 'webos-root'}, tb, b, sb);
};

export const confirmDialog = (core, title, message) => new Promise(resolve => {
  core.make('osjs/dialog', 'confirm', {title, message},
    btn => resolve(btn === 'yes' || btn === 'ok'));
});

export const promptText = (core, title, message, value = '') => new Promise(resolve => {
  core.make('osjs/dialog', 'prompt', {title, message, value},
    (btn, v) => resolve(btn === 'ok' ? v : null));
});

/*
 * Small form window inside the app process.
 * fields: [{name, label, type ('text'|'password')}]
 * cb(values | null)
 */
export const formWindow = (proc, {title, fields}, cb) => {
  const {t} = useI18n(proc.core);
  const win = proc.createWindow({
    title,
    dimension: {width: 340, height: 110 + fields.length * 36},
    attributes: {gravity: 'center', resizable: false, maximizable: false, minimizable: false}
  });

  win.on('destroy', () => cb(null));

  win.render($c => {
    baseStyles();
    const inputs = {};
    const form = el('div', {style: {padding: '12px', display: 'grid', gap: '8px'}},
      ...fields.map(f => {
        inputs[f.name] = f.options
          ? el('select', {class: 'webos-input'},
              f.options.map(o => el('option', {value: o.value ?? o}, o.label ?? o)))
          : el('input', {
              class: 'webos-input', type: f.type || 'text',
              placeholder: f.placeholder || '', value: f.value || ''
            });
        if (f.value) inputs[f.name].value = f.value;
        return el('label', {style: {display: 'grid', gap: '3px'}}, f.label, inputs[f.name]);
      }),
      el('div', {style: {display: 'flex', gap: '8px', justifyContent: 'flex-end'}},
        button(t('cancel'), () => { cb = () => {}; win.close(); }),
        button(t('ok'), () => {
          const values = {};
          Object.keys(inputs).forEach(k => { values[k] = inputs[k].value; });
          const done = cb;
          cb = () => {};
          win.close();
          done(values);
        })
      )
    );
    $c.appendChild(form);
  });

  return win;
};
