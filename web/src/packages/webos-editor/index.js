import osjs from 'osjs';
import {name as applicationName} from './metadata.json';
import {api} from '../_shared/api.js';
import {el, button, statusbar, layout} from '../_shared/ui.js';
import {metaTitle, watchLocale} from '../_shared/i18n.js';

let monacoPromise = null;

const loadMonaco = () => {
  if (monacoPromise) {
    return monacoPromise;
  }
  monacoPromise = new Promise((resolve, reject) => {
    const done = () => {
      window.require.config({paths: {vs: '/vs'}});
      window.require(['vs/editor/editor.main'], () => resolve(window.monaco));
    };
    if (window.require && window.require.config) {
      done();
      return;
    }
    window.MonacoEnvironment = {
      getWorkerUrl: () => '/vs/base/worker/workerMain.js'
    };
    const s = document.createElement('script');
    s.src = '/vs/loader.js';
    s.onload = done;
    s.onerror = () => reject(new Error('failed to load monaco loader'));
    document.head.appendChild(s);
  });
  return monacoPromise;
};

const vfsToHost = (p, user) => {
  const m = /^(\w+):(\/.*)$/.exec(p || '');
  if (!m) {
    return p;
  }
  if (m[1] === 'host') {
    return m[2];
  }
  if (m[1] === 'home' && user) {
    return `/home/${user}${m[2]}`;
  }
  return null;
};

const register = (core, args, options, metadata) => {
  const proc = core.make('osjs/application', {args, options, metadata});

  const sb = statusbar();
  let editor = null;
  let currentPath = null;
  const winTitle = () => metaTitle(core, metadata);
  let win = null;

  const setPath = p => {
    currentPath = p;
    if (win) {
      win.setTitle(p ? `${p} — ${winTitle()}` : winTitle());
    }
    sb.set(p || '(no file)');
  };

  const openPath = path => {
    sb.set(`loading ${path}...`);
    api.get('files/read', {path})
      .then(({content}) => {
        const monaco = window.monaco;
        const model = monaco.editor.createModel(
          content, undefined, monaco.Uri.file(path));
        editor.setModel(model);
        setPath(path);
      })
      .catch(e => sb.error(e.message));
  };

  const openDialog = () => {
    core.make('osjs/dialog', 'file', {type: 'open'}, (btn, file) => {
      if ((btn === 'ok' || btn === 'yes') && file && file.path) {
        const host = vfsToHost(file.path);
        if (host) {
          openPath(host);
        } else {
          sb.error('pick a file under the Filesystem (host:/) mount');
        }
      }
    });
  };

  const save = () => {
    if (!currentPath || !editor) {
      sb.set('nothing to save — open a file first');
      return;
    }
    api.post('files/write', {path: currentPath, content: editor.getValue()})
      .then(() => sb.set(`saved ${currentPath}`))
      .catch(e => sb.error(e.message));
  };

  win = proc.createWindow({
    id: 'WebOSEditorWindow',
    title: winTitle(),
    dimension: {width: 800, height: 520}
  })
    .on('destroy', () => {
      if (editor) {
        editor.dispose();
      }
      proc.destroy();
    })
    .render($content => {
      sb.set('loading editor...');
      const editorBox = el('div', {style: {height: '100%', width: '100%'}});
      const tb = el('div', {class: 'webos-toolbar'},
        button('Open…', openDialog),
        button('Save', save),
        el('span', {style: {color: '#889', fontSize: '11px'}}, 'Ctrl+S saves'));
      $content.appendChild(layout(tb, editorBox, sb));

      loadMonaco().then(monaco => {
        editor = monaco.editor.create(editorBox, {
          theme: 'vs-dark',
          automaticLayout: true,
          fontSize: 13
        });
        editor.addCommand(
          monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, save);
        sb.set('ready');

        const fileArg = args.file || args.path;
        if (fileArg) {
          const auth = core.make('osjs/auth');
          const getUser = (core.getUser || auth.getUser || (() => ({})));
          const user = (getUser.call(core.getUser ? core : auth) || {}).username;
          const host = vfsToHost(fileArg.path || fileArg, user);
          if (host) {
            openPath(host);
          } else {
            sb.set(`cannot open ${fileArg.path || fileArg} — only host:/ and home:/ files`);
          }
        }
      }).catch(e => sb.error(e.message));
    });

  watchLocale(proc, () => win.setTitle(
    currentPath ? `${currentPath} — ${winTitle()}` : winTitle()));
  return proc;
};

osjs.register(applicationName, register);
