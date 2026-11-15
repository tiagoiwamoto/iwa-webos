/*
 * Injects IwaWebOs appearance items into the Settings app:
 *  - Themes: "Window style" + "Titlebar button size" selects
 *    (saved under osjs/desktop -> webos.{wm,wbtn} — only `desktop.*` and
 *    `locale.*` paths survive the app's save()).
 *  - Background: "Wallpapers" gallery item rendered as clickable thumbnails
 *    via an injected `gallery` renderer.
 * The settings package ships only minified dist, so we patch it in place;
 * idempotent — safe to run after every npm ci.
 */
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..',
  'node_modules/@osjs/settings-application/dist/main.js');
let src = fs.readFileSync(file, 'utf8');
const fail = msg => {
  console.error(msg + ' — settings app version changed?');
  process.exit(1);
};

// --- normalize the previous injection (webos.* top-level paths were never
// persisted by save()); upgrade to desktop.webos.* + win11 default ---
if (src.includes('path:"webos.wm"')) {
  src = src
    .replace('path:"webos.wm"', 'path:"desktop.webos.wm"')
    .replace('path:"webos.wbtn"', 'path:"desktop.webos.wbtn"')
    .replace('defaultValue:"",choices:function(){return{' +
      '"":"Standard"', 'defaultValue:"win11",choices:function(){return{' +
      '"":"Standard"');
}

// --- themes items (fresh patch) ---
const themesAnchor = ']},{title:"Desktop"';
const themesInject = ',{label:"Window style",path:"desktop.webos.wm",' +
  'type:"select",defaultValue:"win11",choices:function(){return{' +
  '"":"Standard","macos":"macOS","win11":"Windows 11",' +
  '"kde":"KDE Breeze","gnome":"GNOME"}}},' +
  '{label:"Titlebar button size",path:"desktop.webos.wbtn",type:"select",' +
  'defaultValue:"14",choices:function(){return{' +
  '"10":"small","14":"normal","18":"large","24":"huge"}}}' +
  themesAnchor;
if (!src.includes('desktop.webos.wm')) {
  if (!src.includes(themesAnchor)) {
    fail('themes anchor not found');
  }
  src = src.replace(themesAnchor, themesInject);
}

// --- wallpapers gallery item in the Background section ---
const bgAnchor = ']},{title:"Themes"';
const GALLERY_IMAGES = [
  {path: 'host:/home/images/maltese-ball.svg', label: 'Maltese · Ball'},
  {path: 'host:/home/images/maltese-butterfly.svg', label: 'Maltese · Butterfly'},
  {path: 'host:/home/images/maltese-beach.svg', label: 'Maltese · Beach'},
  {path: 'host:/home/images/maltese-night.svg', label: 'Maltese · Night'},
  {path: 'host:/home/images/maltes-run-ball.jpeg', label: 'Maltese · Run'},
  {path: 'host:/home/images/maltes-stand-sit.jpeg', label: 'Maltese · Sit'},
  {path: 'host:/home/images/maltes-hunt.jpeg', label: 'Maltese · Hunt'}
];
const galleryItem = JSON.stringify({
  label: 'Wallpapers',
  path: 'desktop.background.src',
  type: 'gallery',
  images: GALLERY_IMAGES
});
if (src.includes('type":"gallery"') || src.includes('type:"gallery"')) {
  // already injected — refresh the images list in place
  src = src.replace(/("?images"?\s*:\s*)\[[^\]]*\]/,
    '$1[' + JSON.stringify(GALLERY_IMAGES) + ']');
} else {
  if (!src.includes(bgAnchor)) {
    fail('background anchor not found');
  }
  src = src.replace(bgAnchor, ',' + galleryItem + bgAnchor);
}

// --- gallery renderer: grid of clickable thumbnails in the settings pane ---
const renderAnchor = ',fallback:function(t){return function(e,n){return f(G';
const galleryRenderer = ',gallery:function(t){return function(e,n){' +
  'var sel=t.value&&(t.value.path||t.value);' +
  'return f("div",{class:"webos-wallpaper-grid"},' +
  '(t.images||[]).map(function(g){' +
  'return f("img",{class:"webos-wallpaper-thumb",' +
  '"data-selected":sel===g.path?' +
  '"true":void 0,title:g.label,' +
  'src:"/vfs/readfile?path="+encodeURIComponent(g.path),' +
  'onclick:function(){n.update({path:t.path,value:{path:g.path}})}})}))}}';
if (!src.includes('webos-wallpaper-grid')) {
  if (!src.includes(renderAnchor)) {
    fail('renderer anchor not found');
  }
  src = src.replace(renderAnchor, galleryRenderer + renderAnchor);
}

fs.writeFileSync(file, src);
console.log('settings patched (themes + wallpaper gallery)');
