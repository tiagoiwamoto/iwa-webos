import osjs from 'osjs';
import {name as applicationName} from './metadata.json';
import {api, formatBytes} from '../_shared/api.js';
import {el, css, button, table, statusbar, layout, confirmDialog, formWindow, promptText} from '../_shared/ui.js';
import {useI18n, createLocalizedWindow} from '../_shared/i18n.js';

const FS_COLOR = {
  ext4: '#5b8dd9', ext3: '#5b8dd9', ext2: '#5b8dd9',
  xfs: '#8d6fd0', btrfs: '#58b89b', zfs: '#4fa8a0',
  vfat: '#e0aa3e', fat32: '#e0aa3e', fat16: '#e0aa3e', fat: '#e0aa3e',
  exfat: '#d98e5b', ntfs: '#58b864',
  'linux-swap': '#c05555', swap: '#c05555',
  iso9660: '#8a8f98', udf: '#8a8f98', crypto_LUKS: '#6b7280'
};
const fsColor = fs => FS_COLOR[(fs || '').toLowerCase()] || '#7d8aa5';

const FS_OPTS = ['ext4', 'xfs', 'btrfs', 'vfat', 'exfat', 'ntfs', 'swap'];

css('webos-disks', `
  .wdk-diskbar { display: flex; gap: 8px; align-items: center; padding: 8px 10px;
    background: #2a2e37; border-bottom: 1px solid #17191f; flex-wrap: wrap; }
  .wdk-diskbar select { background: #17191f; color: #e8e8e8; border: 1px solid #3a4150;
    border-radius: 4px; padding: 5px 8px; font-size: 13px; min-width: 300px; }
  .wdk-diskinfo { color: #9ab; font-size: 12px; }
  .wdk-usb { color: #e0aa3e; font-size: 11px; border: 1px solid #e0aa3e55;
    border-radius: 8px; padding: 1px 8px; }
  .wdk-graph { display: flex; height: 46px; margin: 12px 14px 4px;
    border: 1px solid #17191f; border-radius: 4px; overflow: hidden; background: #14171f; }
  .wdk-seg { display: flex; flex-direction: column; justify-content: center;
    padding: 0 8px; overflow: hidden; cursor: pointer; color: #fff;
    font-size: 11px; white-space: nowrap; text-overflow: ellipsis;
    border-right: 1px solid #00000055; min-width: 2px; }
  .wdk-seg.sel { outline: 2px solid #fff; outline-offset: -2px; }
  .wdk-seg .sz { opacity: .8; font-size: 10px; }
  .wdk-free { background: repeating-linear-gradient(45deg, #2a2f3a, #2a2f3a 8px, #242834 8px, #242834 16px);
    color: #9aa4b8; align-items: center; flex-direction: row; justify-content: center; }
  .wdk-legend { display: flex; gap: 14px; padding: 4px 16px 8px; font-size: 11px;
    color: #9ab; flex-wrap: wrap; }
  .wdk-legend i { display: inline-block; width: 10px; height: 10px; border-radius: 2px;
    margin-right: 5px; vertical-align: -1px; }
  .wdk-tablewrap { flex: 1 1 auto; overflow: auto; }
  .wdk-empty { padding: 30px; text-align: center; color: #9ab; }
`);

const register = (core, args, options, metadata) => {
  const proc = core.make('osjs/application', {args, options, metadata});
  const {t} = useI18n(core);
  const sb = statusbar();
  const diskSel = el('select', {onchange: () => {
    disk = disks.find(d => d.path === diskSel.value) || null;
    sel = null;
    renderDisk();
  }});
  const diskInfo = el('span', {class: 'wdk-diskinfo'});
  const graph = el('div');
  const legend = el('div', {class: 'wdk-legend'});
  const tableWrap = el('div', {class: 'wdk-tablewrap'});

  let disks = [];        // só discos inteiros (type=disk)
  let disk = null;       // disco selecionado
  let sel = null;        // partição selecionada, ou {free:true}
  let label = '';        // gpt|dos detectado via fdisk

  const parts = () => (disk && disk.children || []).filter(c => c.type === 'part');
  const freeBytes = () => disk ? Math.max(0, disk.size - parts().reduce((s, p) => s + (p.size || 0), 0)) : 0;
  const mounts = n => (n.mountpoints || []).filter(Boolean);

  const refresh = () => {
    sb.set(t('loading'));
    api.get('disks').then(data => {
      const keep = disk && disk.path;
      disks = (data.blockdevices || [])
        .filter(d => d.type === 'disk' && d.size > 0);
      diskSel.innerHTML = '';
      disks.forEach(d => {
        const tag = (d.rm || d.hotplug || d.tran === 'usb') ? ' ⏏' : '';
        diskSel.appendChild(el('option', {value: d.path},
          `${d.path} — ${(d.model || '').trim() || t('disks.disk')} — ${formatBytes(d.size)}${tag}`));
      });
      disk = disks.find(d => d.path === keep) || disks[0] || null;
      if (disk) diskSel.value = disk.path;
      sel = null;
      renderDisk();
      sb.set(t('disks.diskTag', {n: disks.length}));
    }).catch(e => sb.error(e.message));
  };

  const renderDisk = () => {
    graph.innerHTML = '';
    legend.innerHTML = '';
    tableWrap.innerHTML = '';
    diskInfo.textContent = '';
    if (!disk) {
      tableWrap.appendChild(el('div', {class: 'wdk-empty'}, t('disks.noDisk')));
      return;
    }
    const info = [formatBytes(disk.size), (disk.model || '').trim(), disk.tran].filter(Boolean).join(' · ');
    diskInfo.textContent = info;
    const isUsb = disk.rm || disk.hotplug || disk.tran === 'usb';
    if (isUsb) diskInfo.appendChild(el('span', {class: 'wdk-usb', style: {marginLeft: '8px'}}, t('disks.usb')));

    // label da tabela de partições (via fdisk)
    api.get('disks/table', {device: disk.path}).then(r => {
      const m = /Disklabel type:\s*(\S+)/.exec(r.output || '');
      label = m ? m[1] : '';
      if (label && diskInfo) {
        diskInfo.appendChild(el('span', {class: 'wdk-usb', style: {marginLeft: '8px', color: '#58b89b', borderColor: '#58b89b55'}}, label.toUpperCase()));
      }
    }).catch(() => {});

    // barra gráfica
    const g = el('div', {class: 'wdk-graph'});
    const seen = new Set();
    parts().forEach(p => {
      const pct = Math.max(1, (p.size / disk.size) * 100);
      const fs = (p.fstype || '').toLowerCase();
      seen.add(fs || '?');
      g.appendChild(el('div', {
        class: 'wdk-seg' + (sel === p ? ' sel' : ''),
        style: {width: pct + '%', background: fsColor(fs)},
        title: `${p.path} — ${p.fstype || t('disks.unknown')} — ${formatBytes(p.size)}`,
        onclick: () => { sel = p; renderDisk(); }
      }, el('span', {}, `${p.name} ${p.fstype || ''}`), el('span', {class: 'sz'}, formatBytes(p.size))));
    });
    const fb = freeBytes();
    if (fb > 1024 * 1024) {
      g.appendChild(el('div', {
        class: 'wdk-seg wdk-free' + (sel && sel.free ? ' sel' : ''),
        style: {flex: 1},
        title: `${t('disks.free')} — ${formatBytes(fb)}`,
        onclick: () => { sel = {free: true}; renderDisk(); }
      }, `${t('disks.free')} — ${formatBytes(fb)}`));
    }
    graph.appendChild(g);

    seen.forEach(fs => legend.appendChild(
      el('span', {}, el('i', {style: {background: fsColor(fs)}}), fs === '?' ? t('disks.unknown') : fs)));
    if (fb > 1024 * 1024) legend.appendChild(
      el('span', {}, el('i', {style: {background: 'repeating-linear-gradient(45deg,#2a2f3a,#2a2f3a 4px,#242834 4px,#242834 8px)'}}), t('disks.free')));

    // tabela
    const rows = parts().map(p => ({node: p, cells: [
      p.name, p.fstype || '—', p.label || '',
      formatBytes(p.size), p['fsuse%'] != null ? `${p['fsuse%']}%` : '',
      mounts(p).join(', ') || '—'
    ]}));
    if (fb > 1024 * 1024) rows.push({node: {free: true}, cells: [t('disks.free'), '', '', formatBytes(fb), '', '']});
    if (!rows.length) {
      tableWrap.appendChild(el('div', {class: 'wdk-empty'},
        t('disks.noParts')));
    } else {
      tableWrap.appendChild(table(
        [t('disks.part'), t('disks.fs'), t('disks.label'), t('size'), t('disks.used'), t('disks.mountedAt')],
        rows.map(r => r.cells),
        tr => {
          sel = rows[Array.from(tr.parentNode.children).indexOf(tr)].node;
          renderDisk();
        }
      ));
      tableWrap.querySelectorAll('tbody tr').forEach((tr, i) => {
        const r = rows[i];
        if (r.node.free) tr.style.color = '#9aa4b8';
        if (sel === r.node || (sel && sel.free && r.node.free)) tr.classList.add('selected');
      });
    }
  };

  const call = (ep, extra = {}) =>
    api.post(`disks/${ep}`, {device: extra.device || (sel && sel.path) || disk.path, ...extra})
      .then(r => { sb.set(r.output || 'ok'); refresh(); })
      .catch(e => sb.error(e.message));

  const needDisk = () => {
    if (!disk) { sb.set(t('disks.selDisk')); return false; }
    return true;
  };
  const needPart = () => {
    if (!sel || !sel.path) { sb.set(t('disks.selPart')); return false; }
    return true;
  };

  const newTable = () => needDisk() && formWindow(proc, {
    title: t('disks.newTableTitle', {dev: disk.path}),
    fields: [{name: 'label', label: t('disks.type'), options: [
      {value: 'gpt', label: t('disks.gpt')},
      {value: 'msdos', label: t('disks.msdos')}], value: 'gpt'}]
  }, v => v && confirmDialog(core, t('disks.wipeAll'),
    t('disks.confirmTable', {label: v.label, dev: disk.path}))
    .then(ok => ok && call('mklabel', {device: disk.path, label: v.label})));

  const newPart = () => needDisk() && formWindow(proc, {
    title: t('disks.newPartTitle', {dev: disk.path}),
    fields: [
      {name: 'fs', label: t('disks.fs'), options: FS_OPTS, value: 'ext4'},
      {name: 'start', label: t('disks.start'), value: String(Math.round(100 * (disk.size - freeBytes()) / disk.size)) + '%'},
      {name: 'end', label: t('disks.end'), value: '100%'}
    ]
  }, v => v && call('mkpart', {device: disk.path, start: v.start, end: v.end, fs: v.fs}));

  const format = () => needPart() && formWindow(proc, {
    title: t('disks.formatTitle', {dev: sel.path}),
    fields: [
      {name: 'fs', label: t('disks.fs'), options: FS_OPTS, value: 'ext4'},
      {name: 'label', label: t('disks.labelOpt')}
    ]
  }, v => v && v.fs && confirmDialog(core, t('disks.format'),
    t('disks.confirmFormat', {dev: sel.path, fs: v.fs}))
    .then(ok => ok && call('mkfs', {fs: v.fs, label: v.label})));

  const delPart = () => needPart() && confirmDialog(core, t('disks.delPart'),
    t('disks.confirmDelete', {dev: sel.path}))
    .then(ok => ok && call('rmpart'));

  const mountAt = () => needPart() && promptText(core, t('disks.mount'),
    t('disks.mountMsg', {dev: sel.path}))
    .then(t => t !== null && call('mount', {target: t}));

  const tb = el('div', {class: 'webos-toolbar'},
    button(t('disks.newPart'), newPart),
    button(t('disks.format'), format),
    button(t('disks.delete'), delPart, 'danger'),
    button(t('disks.mount'), mountAt),
    button(t('disks.unmount'), () => needPart() && call('unmount')),
    button(t('disks.newTable'), newTable, 'danger'),
    button(t('disks.eject'), () => needDisk() && call('power-off', {device: disk.path})),
    button(t('disks.refresh'), refresh)
  );

  createLocalizedWindow(proc, {
    id: 'WebOSDisksWindow',
    dimension: {width: 900, height: 500}
  })
    .on('destroy', () => proc.destroy())
    .render($content => {
      $content.appendChild(layout(
        el('div', {}, el('div', {class: 'wdk-diskbar'}, diskSel, diskInfo), tb),
        el('div', {style: {display: 'flex', flexDirection: 'column', height: '100%'}}, graph, legend, tableWrap),
        sb));
      refresh();
    });

  return proc;
};

osjs.register(applicationName, register);
