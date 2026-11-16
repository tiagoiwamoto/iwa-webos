/*
 * Canonical dock item table: OS.js package name -> launch info.
 * The dock shows a user-configurable subset/order of these (persisted in
 * osjs/desktop -> webos.dock); unknown names fall back to the package
 * metadata icon and title.
 */
import {metaTitle} from '../packages/_shared/i18n.js';

export const DOCK_ITEMS = [
  {name: 'WebOSTerminal', glyph: '\u{1F4BB}', icon: 'utilities-terminal', label: 'Terminal'},
  {name: 'WebOSProcesses', glyph: '\u{1F4C8}', icon: 'utilities-system-monitor', label: 'Tasks'},
  {name: 'WebOSServices', glyph: '\u{2699}\u{FE0F}', icon: 'applications-system', label: 'Services'},
  {name: 'WebOSDocker', glyph: '\u{1F433}', label: 'Docker'},
  {name: 'WebOSStore', glyph: '\u{1F6D2}', icon: 'system-software-install', label: 'App Store'},
  {name: 'WebOSDisks', glyph: '\u{1F4BD}', icon: 'drive-harddisk', label: 'Disks'},
  {name: 'WebOSUsers', glyph: '\u{1F464}', icon: 'system-users', label: 'Users'},
  {name: 'WebOSFiles', glyph: '\u{1F4C1}', icon: 'system-file-manager', label: 'Files'},
  {name: 'WebOSEditor', glyph: '\u{1F4DD}', icon: 'text-editor', label: 'Editor'},
  {name: 'WebOSSysInfo', glyph: '\u{1F4CA}', icon: 'computer', label: 'System'},
  {name: 'WebOSLogs', glyph: '\u{1F4DC}', icon: 'text-x-generic', label: 'Logs'},
  {name: 'WebOSCron', glyph: '\u{23F0}', icon: 'x-office-calendar', label: 'Cron'},
  {name: 'WebOSRemote', glyph: '\u{1F310}', icon: 'network-server', label: 'Remote'},
  {name: 'WebOSBrowser', glyph: '\u{1F9ED}', icon: 'web-browser', label: 'Navigator'},
  {name: 'WebOSBackup', glyph: '\u{2601}\u{FE0F}', icon: 'folder-remote', label: 'Backup'},
  {name: 'Settings', glyph: '\u{1F527}', icon: 'preferences-system', label: 'Settings'}
];

// helper/viewer packages that must not clutter the launcher or the dock:
// FileManager duplicates WebOSFiles, HTMLViewer/Preview are "open with" targets
export const HIDDEN_APPS = ['FileManager', 'HTMLViewer', 'Preview'];

const itemForMeta = (core, m) => ({
  name: m.name,
  icon: m.icon,
  glyph: '\u{1F4E6}',
  label: metaTitle(core, m) || m.name
});

/*
 * Full launchable set: known dock items plus every visible installed
 * application package (icon + localized title come from its metadata).
 */
export const allDockItems = core => {
  const items = DOCK_ITEMS.slice();
  try {
    core.make('osjs/packages')
      .getPackages(m => m.type === 'application' &&
        !HIDDEN_APPS.includes(m.name))
      .forEach(m => {
        if (!items.some(i => i.name === m.name)) {
          items.push(itemForMeta(core, m));
        }
      });
  } catch (e) { /* packages not ready */ }
  return items;
};

export const dockItemFor = name =>
  DOCK_ITEMS.find(i => i.name === name) ||
  {name, glyph: '\u{1F4E6}', label: name};
