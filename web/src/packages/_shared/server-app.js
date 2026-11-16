/*
 * Shared application factory for the server-administration apps.
 * Each independent package (Firewall, Network, Packages, Web Sites,
 * Certificates, Databases, Shares, Security, Drive Health, VPN, Alerts)
 * registers itself via `serverApp('<section>', {width, height})`.
 * Every app keeps the same pattern: quick actions on top, an
 * "Advanced…" button that opens a detailed form window.
 */
import {api, formatBytes} from './api.js';
import {el, css, button, table, statusbar, formWindow, baseStyles}
  from './ui.js';
import {useI18n, metaTitle, watchLocale} from './i18n.js';

css('webos-server-apps', `
  .wsrv-wrap { display: flex; height: 100%; width: 100%; font-family: sans-serif;
    font-size: 13px; background: #20232a; color: #e8e8e8; }
  .wsrv-main { flex: 1 1 auto; display: flex; flex-direction: column; min-width: 0; }
  .wsrv-body { flex: 1 1 auto; overflow: auto; padding: 8px 10px; }
  .wsrv-body .webos-table { margin-top: 8px; }
  .wsrv-quick { display: flex; gap: 6px; align-items: center; flex-wrap: wrap;
    padding: 6px 8px; background: #2a2e37; border-radius: 4px; }
  .wsrv-h { margin: 10px 0 4px; color: #9ab; font-size: 12px;
    text-transform: uppercase; letter-spacing: .4px; }
  .wsrv-hint { padding: 18px; color: #9ab; }
  .wsrv-kv { display: inline-flex; gap: 4px 14px; flex-wrap: wrap; color: #bbc;
    font-size: 12px; padding: 4px 0; }
  .wsrv-kv b { color: #9ab; font-weight: 600; }
  .wsrv-mini { padding: 1px 7px; font-size: 11px; }
  .wsrv-pre { margin: 8px 0; padding: 10px; background: #17191f; border-radius: 4px;
    white-space: pre-wrap; font-size: 11px; color: #cde; max-height: 220px;
    overflow: auto; user-select: text; }
  .wsrv-sql { width: 100%; box-sizing: border-box; min-height: 64px;
    background: #17191f; color: #cde; border: 1px solid #3a3f4b;
    border-radius: 4px; font-family: monospace; font-size: 12px;
    padding: 6px 8px; resize: vertical; }
  .wsrv-grid { overflow: auto; max-height: 340px; margin-top: 8px; }
  .wsrv-grid .webos-table { margin-top: 0; }
  .wsrv-grid td { max-width: 240px; overflow: hidden;
    text-overflow: ellipsis; white-space: nowrap; }
`);

export const serverApp = (sectionId, dims) =>
  (core, args, options, metadata) => {
    const proc = core.make('osjs/application', {args, options, metadata});
    const {t} = useI18n(core);
    const sb = statusbar();
    const body = el('div', {class: 'wsrv-body'});

    const inp = (ph, w, val) => el('input', {class: 'webos-input',
      i18nPh: ph, style: {width: w || '120px'}, value: val || ''});
    const select = (opts, val) => {
      const s = el('select', {class: 'webos-input'});
      opts.forEach(o => {
        const v = o.value !== undefined ? o.value : o;
        const opt = o.i18n
          ? el('option', {value: v, i18n: o.i18n})
          : el('option', {value: v}, o.label !== undefined ? o.label : o);
        s.appendChild(opt);
      });
      if (val !== undefined) s.value = val;
      return s;
    };
    const mini = (label, fn) => {
      const b = button(label, fn);
      b.classList.add('wsrv-mini');
      return b;
    };
    const badge = (ok, yes = 'on', no = 'off') =>
      el('span', {class: `webos-badge ${ok ? 'on' : 'off'}`}, ok ? yes : no);
    // one-click install for a missing system tool (agent POST /server/tools)
    const installBtn = (key, label, refresh) =>
      button(`${t('server.install')} ${label}`, () => {
        sb.set(t('server.installing'));
        api.post('server/tools', {tool: key})
          .then(() => { sb.set('ok'); refresh(); })
          .catch(e => sb.error(e.message));
      });
    // "tool not installed" card with one-click Install buttons.
    // tools: [{key: TOOL_PKGS key, label: display name}]
    const hint = (tools, refresh) => {
      const box = el('div', {class: 'wsrv-hint'});
      box.appendChild(el('span', {}, t('server.notInstalled') + ' '));
      (tools || []).forEach(({key, label}) => box.appendChild(
        installBtn(key, label, refresh)));
      body.appendChild(box);
    };
    const head = key => el('div', {class: 'wsrv-h', i18n: key});

    const call = (ep, data, done) => {
      sb.set(t('loading'));
      return api.post(`server/${ep}`, data || {})
        .then(r => { sb.set('ok'); done && done(r); return r; })
        .catch(e => { sb.error(e.message); throw e; });
    };

    const confirmDanger = (msg, fn) => {
      if (window.confirm(msg)) fn();
    };

    const peerWindow = conf => {
      const w = proc.createWindow({title: t('server.clientConf'),
        dimension: {width: 420, height: 330}});
      w.render($c => $c.appendChild(
        el('pre', {class: 'wsrv-pre', style: {margin: '10px',
          height: 'calc(100% - 20px)'}}, conf)));
    };

    // -------------------------------------------------------------- firewall
    const firewall = () => {
      body.innerHTML = '';
      api.get('server/firewall').then(d => {
        if (!d.available) return hint([{key: 'ufw', label: 'ufw'}], firewall);
        const quickPort = inp('server.port', '80px');
        body.appendChild(el('div', {class: 'wsrv-quick'},
          el('span', {i18n: 'server.fwQuick'}), quickPort,
          button({i18n: 'server.allow'}, () => {
            if (quickPort.value.trim()) {
              call('firewall', {op: 'add', action: 'allow', direction: 'in',
                proto: 'tcp', port: quickPort.value.trim()}, firewall);
            }
          }),
          button({i18n: 'server.fwAdvanced'}, () => formWindow(proc, {
            title: t('server.fwAdvanced'),
            fields: [
              {name: 'action', label: t('server.action'), options:
                ['allow', 'deny', 'reject', 'limit']},
              {name: 'direction', label: t('server.direction'),
                options: ['in', 'out']},
              {name: 'proto', label: 'Protocol',
                options: ['tcp', 'udp', 'any']},
              {name: 'port', label: t('server.port'), placeholder: '80'},
              {name: 'from', label: t('server.from'), value: 'any'},
              {name: 'to', label: t('server.to'), value: 'any'},
              {name: 'comment', label: t('server.comment')}]
          }, v => v && call('firewall', {op: 'add', ...v}, firewall))),
          button({i18n: d.active ? 'server.fwDisable' : 'server.fwEnable'},
            () => call('firewall', {op: d.active ? 'disable' : 'enable'},
              firewall)),
          badge(d.active, 'on', 'off')
        ));
        body.appendChild(table(
          ['#', {i18n: 'server.fwTo'}, {i18n: 'server.action'},
           {i18n: 'server.direction'}, {i18n: 'server.from'}, ''],
          d.rules.map(r => [
            r.num, r.to, r.action, r.dir, r.src,
            mini('✕', () => confirmDanger(`${t('server.delRule')} #${r.num}?`,
              () => call('firewall', {op: 'delete', num: r.num}, firewall)))
          ])
        ));
        sb.set(`${d.rules.length} ${t('server.rules')}`);
      }).catch(e => sb.error(e.message));
    };

    // -------------------------------------------------------------- network
    const network = () => {
      body.innerHTML = '';
      api.get('server/network').then(d => {
        if (!d.available) return hint([{key: 'iproute2', label: 'iproute2'}], network);
        body.appendChild(el('div', {class: 'wsrv-quick'},
          el('span', {i18n: 'server.hostname'}),
          el('b', {}, d.hostname),
          button({i18n: 'server.setHostname'}, () => formWindow(proc, {
            title: t('server.setHostname'),
            fields: [{name: 'name', label: t('server.hostname'),
              value: d.hostname}]
          }, v => v && v.name && call('network', {op: 'hostname', name: v.name},
            network)))
        ));
        body.appendChild(head('server.interfaces'));
        body.appendChild(table(
          [{i18n: 'name'}, {i18n: 'server.state'}, 'IP', 'MAC'],
          d.interfaces.map(i => [i.name, i.state, i.ips.join(', '), i.mac])));
        if (d.routes.length) {
          body.appendChild(head('server.gateway'));
          body.appendChild(el('div', {class: 'wsrv-kv'},
            ...d.routes.map(r => el('span', {}, `${r.via} (${r.dev})`)),
            el('b', {}, 'DNS'), el('span', {}, d.dns.join(', ') || '—')));
        }
        body.appendChild(head('server.listening'));
        const f = el('input', {class: 'webos-input', i18nPh: 'server.filter',
          oninput: () => draw(), style: {width: '160px'}});
        body.appendChild(f);
        const tbl = el('div');
        body.appendChild(tbl);
        const draw = () => {
          const q = (f.value || '').toLowerCase();
          const rows = d.listening.filter(l =>
            !q || (l.local + l.process).toLowerCase().includes(q));
          tbl.innerHTML = '';
          tbl.appendChild(table(
            ['Proto', {i18n: 'server.state'}, {i18n: 'server.address'},
             {i18n: 'server.process'}],
            rows.map(l => [l.proto, l.state, l.local, l.process])));
        };
        draw();
        sb.set(`${d.listening.length} ${t('server.ports')}`);
      }).catch(e => sb.error(e.message));
    };

    // ------------------------------------------------------------- packages
    const packages = () => {
      body.innerHTML = '';
      const q = inp('server.pkgSearch', '180px');
      const install = name => call('packages', {op: 'install', name}, packages);
      const remove = name => confirmDanger(`${t('server.pkgRemove')} ${name}?`,
        () => call('packages', {op: 'remove', name}, packages));
      const draw = list => {
        body.querySelectorAll('.wsrv-ptbl').forEach(n => n.remove());
        body.appendChild(el('div', {class: 'wsrv-ptbl'},
          table([{i18n: 'name'}, {i18n: 'server.pkgInfo'}, ''],
            list.map(p => [p.name, p.desc || p.version || '',
              p.installed
                ? mini('✕ ' + t('server.remove'), () => remove(p.name))
                : mini('+ ' + t('server.install'), () => install(p.name))]))));
      };
      const search = () => api.get('server/packages', {q: q.value})
        .then(d => draw(d.packages)).catch(e => sb.error(e.message));
      const updates = () => api.get('server/packages', {updates: 1})
        .then(d => draw(d.updates.map(u => ({...u, desc:
          `${u.from} → ${u.version}`})))).catch(e => sb.error(e.message));
      q.addEventListener('keydown', e => e.key === 'Enter' && q.value && search());
      body.appendChild(el('div', {class: 'wsrv-quick'},
        q, button({i18n: 'server.search'}, () => q.value && search()),
        button({i18n: 'server.pkgUpdates'}, updates),
        button({i18n: 'server.pkgAdvanced'}, () => formWindow(proc, {
          title: t('server.pkgAdvanced'),
          fields: [
            {name: 'op', label: t('server.action'), options: [
              {value: 'installed', label: t('server.pkgInstalled')},
              {value: 'update', label: 'apt-get update'},
              {value: 'upgrade', label: 'apt-get upgrade'}]},
            {name: 'q', label: t('server.pkgFilter')}]
        }, v => {
          if (!v) return;
          if (v.op === 'installed') {
            api.get('server/packages', {installed: 1, q: v.q})
              .then(d => draw(d.packages.map(p => ({...p, installed: true}))))
              .catch(e => sb.error(e.message));
          } else {
            call('packages', {op: v.op}, r => {
              body.appendChild(el('pre', {class: 'wsrv-pre'}, r.output || 'ok'));
              packages();
            });
          }
        }))));
      sb.set(t('server.pkgHint'));
    };

    // --------------------------------------------------------------- web sites
    const web = () => {
      body.innerHTML = '';
      api.get('server/web').then(d => {
        if (!d.available) return hint([{key: 'nginx', label: 'nginx'}], web);
        const dom = inp('server.domain', '180px');
        body.appendChild(el('div', {class: 'wsrv-quick'},
          el('span', {i18n: 'server.webQuick'}), dom,
          button({i18n: 'server.create'}, () => {
            if (dom.value.trim()) {
              call('web', {op: 'create', name: dom.value.trim().split('.')[0],
                server_names: dom.value.trim(), kind: 'static'}, web);
            }
          }),
          button({i18n: 'server.webAdvanced'}, () => formWindow(proc, {
            title: t('server.webAdvanced'),
            fields: [
              {name: 'name', label: t('server.confName'),
                placeholder: 'my-site'},
              {name: 'server_names', label: t('server.domains'),
                placeholder: 'example.com www.example.com'},
              {name: 'kind', label: t('server.type'), options: [
                {value: 'static', label: t('server.staticSite')},
                {value: 'proxy', label: t('server.proxyPass')}]},
              {name: 'root', label: 'root', placeholder: '/var/www/site'},
              {name: 'proxy', label: 'proxy_pass',
                placeholder: 'http://127.0.0.1:3000'},
              {name: 'listen', label: 'listen', value: '80'}]
          }, v => v && call('web', {op: 'create', ...v}, web)))));
        body.appendChild(table(
          [{i18n: 'server.site'}, {i18n: 'server.domains'}, 'listen',
           {i18n: 'server.target'}, {i18n: 'server.enabled'}, ''],
          d.sites.map(s => [
            s.name, s.server_names.join(' '), s.listen.join(' '),
            s.root || s.proxy || '—', badge(s.enabled, 'on', 'off'),
            el('span', {},
              mini(s.enabled ? 'off' : 'on',
                () => call('web', {op: s.enabled ? 'disable' : 'enable',
                  name: s.name}, web)),
              ' ',
              mini('✕', () => confirmDanger(`${t('server.delSite')} ${s.name}?`,
                () => call('web', {op: 'delete', name: s.name}, web))))
          ])));
      }).catch(e => sb.error(e.message));
    };

    // ----------------------------------------------------------------- certs
    const certs = () => {
      body.innerHTML = '';
      api.get('server/certs').then(d => {
        if (!d.available) return hint([{key: 'certbot', label: 'certbot'}], certs);
        const dom = inp('server.domain', '160px');
        const mail = inp('server.email', '160px');
        body.appendChild(el('div', {class: 'wsrv-quick'},
          el('span', {i18n: 'server.certQuick'}), dom, mail,
          button({i18n: 'server.issue'}, () => {
            if (dom.value.trim() && mail.value.trim()) {
              call('certs', {op: 'issue', domain: dom.value.trim(),
                email: mail.value.trim(), plugin: 'nginx'}, certs);
            }
          }),
          button({i18n: 'server.certAdvanced'}, () => formWindow(proc, {
            title: t('server.certAdvanced'),
            fields: [
              {name: 'domain', label: t('server.domain')},
              {name: 'extra', label: t('server.extraDomains'),
                placeholder: 'www.ex.com api.ex.com'},
              {name: 'email', label: t('server.email')},
              {name: 'plugin', label: 'plugin',
                options: ['nginx', 'standalone']},
              {name: 'redirect', label: t('server.forceHttps'),
                options: [
                  {value: '', label: t('server.no')},
                  {value: '1', label: t('server.yes')}]}]
          }, v => v && call('certs',
            {op: 'issue', ...v, redirect: v.redirect === '1'}, certs))),
          button({i18n: 'server.renewAll'},
            () => call('certs', {op: 'renew'}, certs))));
        body.appendChild(table(
          [{i18n: 'server.cert'}, {i18n: 'server.domains'},
           {i18n: 'server.expiry'}],
          d.certs.map(c => [c.name, (c.domains || []).join(' '),
            c.expiry + (c.days !== undefined ? ` (${c.days}d)` : '')])));
      }).catch(e => sb.error(e.message));
    };

    // -------------------------------------------------------------- databases
    // Mini database manager served by the agent itself (psql/mysql CLIs):
    // pick engine + database, browse tables and rows, run SQL.
    const db = () => {
      body.innerHTML = '';
      body.style.display = '';
      body.style.flexDirection = '';
      api.get('server/db').then(d => {
        if (!d.available) return hint([
          {key: 'postgresql', label: 'PostgreSQL'},
          {key: 'mariadb', label: 'MariaDB'}], db);
        const engines = ['postgres', 'mysql'].filter(e => d[e]);
        const engSel = select(engines, engines[0]);
        const dbSel = el('select', {class: 'webos-input'});
        const nm = inp('server.dbName', '120px');
        const view = el('div');

        const fillDbs = () => {
          dbSel.innerHTML = '';
          (d[engSel.value] || []).forEach(x =>
            dbSel.appendChild(el('option', {value: x.name}, x.name)));
        };

        const dataTable = data => {
          const wrap = el('div', {class: 'wsrv-grid'});
          if (!data.cols.length) {
            wrap.appendChild(el('div', {class: 'wsrv-hint',
              i18n: 'server.dbEmpty'}));
            return wrap;
          }
          wrap.appendChild(table(data.cols, data.rows));
          if (data.truncated) {
            wrap.appendChild(el('div', {class: 'wsrv-hint',
              i18n: 'server.dbTruncated'}));
          }
          return wrap;
        };

        const showRows = tableName => {
          view.innerHTML = '';
          view.appendChild(el('div', {class: 'wsrv-quick'},
            mini('‹ ' + t('server.dbBack'), showTables),
            el('b', {}, `${dbSel.value} › ${tableName}`)));
          call('db', {op: 'rows', engine: engSel.value, name: dbSel.value,
            table: tableName}, res => view.appendChild(dataTable(res)));
        };

        const showTables = () => {
          view.innerHTML = '';
          const dbname = dbSel.value;
          if (!dbname) return;
          call('db', {op: 'tables', engine: engSel.value, name: dbname},
            r => {
              view.appendChild(el('div', {class: 'wsrv-h'},
                `${dbname} — ${r.tables.length} ${t('server.dbTables')}`));
              view.appendChild(table(
                [{i18n: 'server.dbTable'}, ''],
                r.tables.map(x => [
                  x,
                  el('span', {},
                    mini(t('server.dbBrowse'), () => showRows(x)),
                    ' ',
                    mini('✕', () => confirmDanger(
                      `${t('server.dbDropTable')} ${x}?`,
                      () => call('db', {op: 'table_drop',
                        engine: engSel.value, name: dbname, table: x},
                        showTables))))])));
              const sql = el('textarea', {class: 'wsrv-sql',
                placeholder: 'SELECT * FROM …'});
              view.appendChild(el('div', {class: 'wsrv-h',
                i18n: 'server.dbQuery'}));
              view.appendChild(sql);
              view.appendChild(el('div', {style: {marginTop: '6px'}},
                button({i18n: 'server.dbRun'}, () => {
                  if (sql.value.trim()) {
                    call('db', {op: 'query', engine: engSel.value,
                      db: dbname, sql: sql.value.trim()}, res => {
                      const old = view.querySelector('.wsrv-grid');
                      if (old) old.remove();
                      if (res.cols.length) {
                        view.appendChild(dataTable(res));
                      }
                    });
                  }
                })));
            });
        };

        fillDbs();
        engSel.onchange = () => { fillDbs(); showTables(); };
        dbSel.onchange = showTables;

        body.appendChild(el('div', {class: 'wsrv-quick'},
          el('span', {i18n: 'server.engine'}), engSel,
          el('span', {i18n: 'server.dbName'}), dbSel, nm,
          button({i18n: 'server.create'}, () => {
            if (nm.value.trim()) {
              call('db', {op: 'create', engine: engSel.value,
                name: nm.value.trim()}, db);
            }
          }),
          button({i18n: 'server.dbAdvanced'}, () => formWindow(proc, {
            title: t('server.dbAdvanced'),
            fields: [
              {name: 'engine', label: t('server.engine'),
                options: engines},
              {name: 'name', label: t('server.dbName')},
              {name: 'owner', label: t('server.dbOwner'),
                placeholder: 'postgres'}]
          }, v => v && call('db', {op: 'create', ...v}, db)))));
        engines.forEach(e => {
          body.appendChild(el('div', {class: 'wsrv-h'}, e));
          body.appendChild(table(
            [{i18n: 'server.dbName'}, {i18n: 'server.dbOwner'}, ''],
            (d[e] || []).map(x => [
              x.name, x.owner || '',
              el('span', {},
                mini('▸', () => {
                  engSel.value = e;
                  fillDbs();
                  dbSel.value = x.name;
                  showTables();
                }),
                ' ',
                mini('✕', () => confirmDanger(
                  `${t('server.dropDb')} ${x.name} (${e})?`,
                  () => call('db', {op: 'drop', engine: e, name: x.name},
                    db))))])));
        });
        body.appendChild(view);
        ['postgres_error', 'mysql_error'].forEach(k => {
          if (d[k]) {
            body.appendChild(el('div', {class: 'wsrv-hint'}, `${k}: ${d[k]}`));
          }
        });
        showTables();
      }).catch(e => sb.error(e.message));
    };

    // ---------------------------------------------------------------- shares
    const shares = () => {
      body.innerHTML = '';
      api.get('server/shares').then(d => {
        if (!d.samba.available && !d.nfs.available)
          return hint([{key: 'samba', label: 'Samba'}, {key: 'nfs', label: 'NFS'}], shares);
        const kinds = [['samba', d.samba.available], ['nfs', d.nfs.available]]
          .filter(([, a]) => a).map(([k]) => k);
        const kind = select(kinds);
        const nm = inp('server.shareName', '110px');
        const path = inp('server.path', '200px');
        body.appendChild(el('div', {class: 'wsrv-quick'},
          el('span', {i18n: 'server.shareQuick'}), kind, nm, path,
          button({i18n: 'server.share'}, () => {
            if (path.value.trim()) {
              call('shares', {op: 'add', kind: kind.value,
                name: nm.value.trim() || path.value.split('/').pop(),
                path: path.value.trim(), readonly: true}, shares);
            }
          }),
          button({i18n: 'server.shareAdvanced'}, () => formWindow(proc, {
            title: t('server.shareAdvanced'),
            fields: [
              {name: 'kind', label: t('server.type'), options: kinds},
              {name: 'name', label: t('server.shareName')},
              {name: 'path', label: t('server.path')},
              {name: 'readonly', label: t('server.readOnly'), options: [
                {value: '1', label: t('server.yes')},
                {value: '', label: t('server.no')}]},
              {name: 'guest', label: t('server.guestOk'), options: [
                {value: '', label: t('server.no')},
                {value: '1', label: t('server.yes')}]},
              {name: 'hosts', label: t('server.nfsHosts'),
                placeholder: '* | 192.168.1.0/24'},
              {name: 'users', label: t('server.smbUsers')}]
          }, v => v && call('shares', {op: 'add', ...v,
            readonly: v.readonly === '1', guest: v.guest === '1'}, shares)))));
        if (d.samba.available) {
          body.appendChild(head('server.smbShares'));
          body.appendChild(table(
            [{i18n: 'server.shareName'}, {i18n: 'server.path'},
             {i18n: 'server.readOnly'}, {i18n: 'server.guestOk'}, ''],
            d.samba.shares.map(s => [s.name, s.path,
              s['read only'] || 'no', s['guest ok'] || 'no',
              mini('✕', () => confirmDanger(`${t('server.delShare')} ${s.name}?`,
                () => call('shares', {op: 'del', kind: 'samba', name: s.name},
                  shares)))])));
        }
        if (d.nfs.available) {
          body.appendChild(head('server.nfsExports'));
          body.appendChild(table(
            [{i18n: 'server.path'}, {i18n: 'server.nfsHosts'}, ''],
            d.nfs.exports.map(x => [x.path, x.hosts,
              mini('✕', () => confirmDanger(`${t('server.delShare')} ${x.path}?`,
                () => call('shares', {op: 'del', kind: 'nfs', path: x.path},
                  shares)))])));
        }
        [['samba', 'Samba'], ['nfs', 'NFS']].forEach(([k, label]) => {
          if (!d[k].available) {
            const box = el('div', {class: 'wsrv-hint'},
              `${label} — ${t('server.notInstalled')} `);
            box.appendChild(installBtn(k, label, shares));
            body.appendChild(box);
          }
        });
      }).catch(e => sb.error(e.message));
    };

    // -------------------------------------------------------------- security
    const security = () => {
      body.innerHTML = '';
      api.get('server/security').then(d => {
        if (d.sshd && Object.keys(d.sshd).length) {
          body.appendChild(head('server.sshd'));
          body.appendChild(el('div', {class: 'wsrv-kv'},
            ...Object.entries(d.sshd).map(([k, v]) =>
              el('span', {}, el('b', {}, k), ' ', v.join(', ')))));
        }
        if (d.fail2ban.available) {
          body.appendChild(head('server.fail2ban'));
          const jails = d.fail2ban.jails || [];
          const jl = select(jails.map(j => j.name));
          const ip = inp('server.ipAddr', '140px');
          body.appendChild(el('div', {class: 'wsrv-quick'},
            el('span', {i18n: 'server.secQuick'}), jl, ip,
            button({i18n: 'server.ban'},
              () => ip.value.trim() && call('security', {op: 'ban',
                jail: jl.value, ip: ip.value.trim()}, security)),
            button({i18n: 'server.unban'},
              () => ip.value.trim() && call('security', {op: 'unban',
                jail: jl.value, ip: ip.value.trim()}, security))));
          body.appendChild(table(
            [{i18n: 'server.jail'}, {i18n: 'server.banned'},
             {i18n: 'server.ips'}],
            jails.map(j => [j.name, j.banned, j.ips.join(' ')])));
        } else {
          const box = el('div', {class: 'wsrv-hint'},
            'fail2ban — ' + t('server.notInstalled') + ' ');
          box.appendChild(installBtn('fail2ban', 'fail2ban', security));
          body.appendChild(box);
        }
      }).catch(e => sb.error(e.message));
    };

    // ------------------------------------------------------------------ smart
    const smart = () => {
      body.innerHTML = '';
      api.get('server/smart').then(d => {
        if (!d.available) return hint([{key: 'smartmontools', label: 'smartmontools'}], smart);
        body.appendChild(table(
          [{i18n: 'server.device'}, {i18n: 'server.model'},
           {i18n: 'server.health'}, {i18n: 'server.temp'},
           {i18n: 'server.hours'}, 'realloc', 'pending'],
          d.disks.map(x => [
            x.dev, x.model || '—',
            x.health === null || x.health === undefined ? '—'
              : badge(x.health, 'OK', 'FAIL'),
            x.temp != null ? `${x.temp}°C` : '—',
            x.hours != null ? x.hours : '—',
            x.realloc !== undefined ? x.realloc : '—',
            x.pending !== undefined ? x.pending : '—'])));
      }).catch(e => sb.error(e.message));
    };

    // -------------------------------------------------------------------- vpn
    const vpn = () => {
      body.innerHTML = '';
      api.get('server/vpn').then(d => {
        if (!d.available) return hint([{key: 'wireguard', label: 'WireGuard'}], vpn);
        const ifaces = d.configs.length ? d.configs
          : d.interfaces.map(i => i.name);
        if (!ifaces.length) {
          body.appendChild(el('div', {class: 'wsrv-hint'},
            t('server.vpnNone')));
          return;
        }
        const iface = select(ifaces);
        const afterPeer = r => {
          peerWindow(r.client);
          vpn();
        };
        body.appendChild(el('div', {class: 'wsrv-quick'},
          el('span', {i18n: 'server.iface'}), iface,
          button({i18n: 'server.vpnUp'}, () => call('vpn',
            {op: 'up', iface: iface.value}, vpn)),
          button({i18n: 'server.vpnDown'}, () => call('vpn',
            {op: 'down', iface: iface.value}, vpn)),
          button({i18n: 'server.peerAdd'}, () => call('vpn',
            {op: 'peer_add', iface: iface.value}, afterPeer)),
          button({i18n: 'server.peerAdvanced'}, () => formWindow(proc, {
            title: t('server.peerAdvanced'),
            fields: [
              {name: 'iface', label: t('server.iface'), options: ifaces},
              {name: 'allowed', label: 'AllowedIPs',
                placeholder: '10.0.0.5/32'},
              {name: 'endpoint', label: 'Endpoint',
                placeholder: 'vpn.example.com:51820'}]
          }, v => v && call('vpn', {op: 'peer_add', ...v}, afterPeer)))));
        const sel = d.interfaces.find(i => i.name === iface.value)
          || d.interfaces[0];
        if (sel) {
          body.appendChild(head('server.peers'));
          body.appendChild(table(
            [{i18n: 'server.pubkey'}, 'Endpoint', 'AllowedIPs',
             {i18n: 'server.handshake'}, 'RX', 'TX', ''],
            sel.peers.map(p => [
              p.pubkey.slice(0, 10) + '…', p.endpoint || '—', p.allowed,
              p.handshake ? `${Math.max(0, Math.round(
                Date.now() / 1000 - p.handshake))}s` : '—',
              formatBytes(p.rx), formatBytes(p.tx),
              mini('✕', () => confirmDanger(t('server.peerDel') + '?',
                () => call('vpn', {op: 'peer_del', iface: sel.name,
                  pubkey: p.pubkey}, vpn)))])));
        }
      }).catch(e => sb.error(e.message));
    };

    // ----------------------------------------------------------------- alerts
    const alerts = () => {
      body.innerHTML = '';
      api.get('server/alerts').then(d => {
        const m = d.metrics;
        body.appendChild(el('div', {class: 'wsrv-kv', style: {padding: '8px'}},
          el('span', {}, el('b', {}, 'CPU'), ` ${m.cpu}%`),
          el('span', {}, el('b', {}, 'RAM'), ` ${m.mem}%`),
          el('span', {}, el('b', {}, '/'), ` ${m.disk_root}%`)));
        const metric = select([{value: 'cpu', label: 'CPU'},
          {value: 'mem', label: 'RAM'}, {value: 'disk', i18n: 'server.disk'}]);
        const thr = inp('%', '56px', '90');
        body.appendChild(el('div', {class: 'wsrv-quick'},
          el('span', {i18n: 'server.alertQuick'}), metric,
          el('span', {}, '>'), thr,
          button({i18n: 'add'}, () => thr.value &&
            call('alerts', {op: 'add', metric: metric.value,
              threshold: Number(thr.value)}, alerts)),
          button({i18n: 'server.alertAdvanced'}, () => formWindow(proc, {
            title: t('server.alertAdvanced'),
            fields: [
              {name: 'metric', label: t('server.metric'), options: [
                {value: 'cpu', label: 'CPU %'},
                {value: 'mem', label: 'RAM %'},
                {value: 'disk', label: t('server.disk') + ' %'}]},
              {name: 'threshold', label: 'Threshold %', value: '90'},
              {name: 'path', label: t('server.mountPoint'), value: '/'},
              {name: 'note', label: t('server.note')}]
          }, v => v && call('alerts', {op: 'add', ...v,
            threshold: Number(v.threshold)}, alerts)))));
        body.appendChild(table(
          [{i18n: 'server.metric'}, {i18n: 'server.mountPoint'},
           '>', {i18n: 'server.current'}, {i18n: 'server.state'},
           {i18n: 'server.note'}, ''],
          d.rules.map(r => [
            r.metric, r.path || '—', `${r.threshold}%`,
            r.value === null ? '—' : `${r.value}%`,
            badge(!r.breach, 'ok', 'ALERT'), r.note || '',
            mini('✕', () => call('alerts', {op: 'del', id: r.id}, alerts))])));
      }).catch(e => sb.error(e.message));
    };

    const sections = {firewall, network, packages, web, certs, db,
      shares, security, smart, vpn, alerts};
    const show = sections[sectionId];

    const win = proc.createWindow({
      title: metaTitle(core, metadata),
      dimension: dims || {width: 720, height: 480}
    });
    win.on('destroy', () => proc.destroy());
    win.render($c => {
      baseStyles();
      $c.appendChild(el('div', {class: 'wsrv-wrap'},
        el('div', {class: 'wsrv-main'}, body, sb)));
      show();
    });

    watchLocale(proc, () => {
      win.setTitle(metaTitle(core, metadata));
      show();
    });

    return proc;
  };
