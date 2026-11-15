import osjs from 'osjs';
import {name as applicationName} from './metadata.json';
import {api, formatBytes} from '../_shared/api.js';
import {el, css, button, table, statusbar, layout, confirmDialog, formWindow, promptText} from '../_shared/ui.js';

css('webos-disks', `
  .wdisks-split { display: flex; height: 100%; }
  .wdisks-left { flex: 1 1 55%; overflow: auto; border-right: 1px solid #17191f; }
  .wdisks-right { flex: 1 1 45%; overflow: auto; padding: 8px; }
  .wdisks-pre { font-family: monospace; font-size: 11px; white-space: pre;
    color: #bcd; }
`);

const flatten = (nodes, depth = 0, out = []) => {
  (nodes || []).forEach(n => {
    out.push({node: n, depth});
    flatten(n.children, depth + 1, out);
  });
  return out;
};

const register = (core, args, options, metadata) => {
  const proc = core.make('osjs/application', {args, options, metadata});

  const left = el('div', {class: 'wdisks-left'});
  const right = el('div', {class: 'wdisks-right'});
  const sb = statusbar();
  let selected = null;
  let rows = [];

  const refresh = () => {
    sb.set('loading...');
    api.get('disks').then(data => {
      rows = flatten(data.blockdevices);
      sb.set(`${rows.length} devices`);
      left.innerHTML = '';
      left.appendChild(table(
        ['Device', 'Type', 'Size', 'FS', 'Label', 'Used', 'Mounted at'],
        rows.map(({node: n, depth}) => [
          ' '.repeat(depth * 3) + (n.name || ''),
          n.type || '',
          formatBytes(n.size),
          n.fstype || '',
          n.label || '',
          n['fsuse%'] != null ? `${n['fsuse%']}%` : '',
          (n.mountpoints || []).filter(Boolean).join(', ')
        ]),
        tr => {
          left.querySelectorAll('tr.selected')
            .forEach(x => x.classList.remove('selected'));
          tr.classList.add('selected');
          selected = rows[Array.from(tr.parentNode.children).indexOf(tr)].node;
          showTable();
        }
      ));
    }).catch(e => sb.error(e.message));
  };

  const showTable = () => {
    right.innerHTML = '';
    if (!selected || selected.type !== 'disk') {
      right.appendChild(el('div', {class: 'wdisks-pre'},
        selected ? `${selected.path} — select a whole disk to see its partition table`
                 : 'select a device'));
      return;
    }
    api.get('disks/table', {device: selected.path})
      .then(r => right.appendChild(el('pre', {class: 'wdisks-pre'}, r.output)))
      .catch(e => right.appendChild(el('div', {class: 'wdisks-pre'}, `Error: ${e.message}`)));
  };

  const call = (ep, extra = {}) => {
    if (!selected || !selected.path) {
      sb.set('select a device first');
      return;
    }
    api.post(`disks/${ep}`, {device: selected.path, ...extra})
      .then(r => { sb.set(r.output || 'ok'); refresh(); })
      .catch(e => sb.error(e.message));
  };

  const needDisk = () => {
    if (!selected || selected.type !== 'disk') {
      sb.set('select a whole disk (type=disk)');
      return false;
    }
    return true;
  };

  const needPart = () => {
    if (!selected || selected.type !== 'part') {
      sb.set('select a partition (type=part)');
      return false;
    }
    return true;
  };

  const newLabel = () => needDisk() && formWindow(proc, {
    title: `New partition table on ${selected.path}`,
    fields: [{name: 'label', label: 'Type (gpt or msdos)', placeholder: 'gpt'}]
  }, v => v && v.label && confirmDialog(core, 'Wipe partition table',
      `Create a ${v.label} table on ${selected.path}? All partitions are lost.`)
      .then(ok => ok && call('mklabel', {label: v.label})));

  const newPart = () => needDisk() && formWindow(proc, {
    title: `New partition on ${selected.path}`,
    fields: [
      {name: 'start', label: 'Start %', placeholder: '0%'},
      {name: 'end', label: 'End %', placeholder: '100%'},
      {name: 'fs', label: 'FS hint (ext4, xfs, btrfs, vfat, ntfs, swap)', placeholder: 'ext4'}
    ]
  }, v => v && call('mkpart', {start: v.start || '0%', end: v.end || '100%', fs: v.fs || 'ext4'}));

  const delPart = () => needPart() && confirmDialog(core, 'Delete partition',
    `Delete ${selected.path} via parted? Its data is lost.`)
    .then(ok => ok && call('rmpart'));

  const format = () => needPart() && formWindow(proc, {
    title: `Format ${selected.path}`,
    fields: [
      {name: 'fs', label: 'Filesystem (ext4, xfs, btrfs, vfat, exfat, ntfs, swap)', placeholder: 'ext4'},
      {name: 'label', label: 'Label (optional)'}
    ]
  }, v => v && v.fs && confirmDialog(core, 'Format',
      `mkfs.${v.fs} on ${selected.path}? All data is lost.`)
      .then(ok => ok && call('mkfs', {fs: v.fs, label: v.label})));

  const mountAt = () => promptText(core, 'Mount',
    `Mountpoint for ${selected ? selected.path : ''} (empty = udisks)`)
    .then(target => target !== null && call('mount', {target}));

  const tb = el('div', {class: 'webos-toolbar'},
    button('Mount', mountAt),
    button('Unmount', () => call('unmount')),
    button('New table', newLabel),
    button('New partition', newPart),
    button('Format', format),
    button('Delete part', delPart, 'danger'),
    button('WipeFS', () => confirmDialog(core, 'Wipe signatures',
      `wipefs -a on ${selected ? selected.path : ''}?`)
      .then(ok => ok && call('wipefs')), 'danger'),
    button('Power off', () => call('power-off')),
    button('Refresh', refresh)
  );

  proc.createWindow({
    id: 'WebOSDisksWindow',
    title: metadata.title.en_EN,
    dimension: {width: 900, height: 480}
  })
    .on('destroy', () => proc.destroy())
    .render($content => {
      $content.appendChild(layout(tb,
        el('div', {class: 'wdisks-split'}, left, right), sb));
      refresh();
    });

  return proc;
};

osjs.register(applicationName, register);
