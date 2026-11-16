/*
 * Injects Malta OS appearance items into the Settings app:
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
  {path: 'host:/home/images/maltes-sentado-pb-metade-wallpaper.png', label: 'Maltese · Sitting'},
  {path: 'host:/home/images/maltes-correndo-pb-wallpaper.png', label: 'Maltese · Running'},
  {path: 'host:/home/images/maltes-anime-contorno-wallpaper.svg', label: 'Maltese · Anime'},
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

// --- gallery renderer: grid of clickable thumbnails + upload tile ---
// Lists host:/home/images via VFS (uploaded files appear automatically)
// and appends a '+' tile that uploads png/jpg/jpeg via /vfs/writefile.
const renderAnchor = ',fallback:function(t){return function(e,n){return f(G';
const galleryRenderer = ',gallery:function(t){return function(e,n){' +
  'var dir="host:/home/images";' +
  'var PER=10,page=0;' +
  'var sel=t.value&&(t.value.path||t.value);' +
  'var draw=function(box,imgs){' +
    'box.querySelectorAll(".webos-wallpaper-thumb,' +
      '.webos-wallpaper-upload,.webos-wallpaper-pager")' +
      '.forEach(function(x){x.remove()});' +
    'var total=Math.max(1,Math.ceil(imgs.length/PER));' +
    'if(page>=total)page=total-1;' +
    'imgs.slice(page*PER,page*PER+PER).forEach(function(g){' +
      'var im=document.createElement("img");' +
      'im.className="webos-wallpaper-thumb";' +
      'im.title=g.label||g.filename||"";' +
      'if(sel===g.path)im.setAttribute("data-selected","true");' +
      'im.src="/vfs/readfile?path="+encodeURIComponent(g.path);' +
      'im.onclick=function(){n.update({path:t.path,' +
        'value:{path:g.path}})};' +
      'box.appendChild(im)});' +
    'var up=document.createElement("div");' +
    'up.className="webos-wallpaper-upload";' +
    'up.title="Enviar imagem (png, jpg, jpeg)";' +
    'up.textContent="+";' +
    'box.appendChild(up);' +
    'if(total>1){' +
      'var pager=document.createElement("div");' +
      'pager.className="webos-wallpaper-pager";' +
      'var mk=function(txt,fn,dis){' +
        'var b=document.createElement("button");' +
        'b.type="button";b.textContent=txt;b.disabled=!!dis;' +
        'b.onclick=fn;return b};' +
      'var info=document.createElement("span");' +
      'info.textContent=(page+1)+"/"+total;' +
      'pager.appendChild(mk("\u2039",function(){page--;' +
        'draw(box,imgs)},page<1));' +
      'pager.appendChild(info);' +
      'pager.appendChild(mk("\u203a",function(){page++;' +
        'draw(box,imgs)},page>=total-1));' +
      'box.appendChild(pager)};' +
    'return up};' +
  'var build=function(box){' +
    'var pick=document.createElement("input");' +
    'pick.type="file";pick.accept=".png,.jpg,.jpeg,image/png,image/jpeg";' +
    'pick.style.display="none";box.appendChild(pick);' +
    'var up=draw(box,t.images||[]);' +
    'up.onclick=function(){pick.click()};' +
    'var load=function(){' +
      'fetch("/vfs/readdir?path="+encodeURIComponent(dir),' +
        '{credentials:"same-origin"})' +
      '.then(function(r){return r.json()})' +
      '.then(function(list){' +
        'var up2=draw(box,list.filter(function(f){' +
          'return f.isFile&&/\\.(png|jpe?g|svg|gif|webp)$/i' +
            '.test(f.filename)}));' +
        'up2.onclick=function(){pick.click()}})' +
      '.catch(function(){})};' +
    'pick.onchange=function(){' +
      'var file=pick.files&&pick.files[0];if(!file)return;' +
      'var name=String(file.name).replace(/\\s+/g,"_");' +
      'var fd=new FormData();' +
      'fd.append("upload",file);' +
      'fd.append("path",dir+"/"+name);' +
      'fd.append("options",JSON.stringify({overwrite:true}));' +
      'fetch("/vfs/writefile",{method:"POST",' +
        'credentials:"same-origin",body:fd})' +
      '.then(function(r){' +
        'if(!r.ok)throw new Error("upload falhou: "+r.status);' +
        'n.update({path:t.path,value:{path:dir+"/"+name}});' +
        'load()})' +
      '.catch(function(err){alert(err.message)})};' +
    'load()};' +
  'return f("div",{class:"webos-wallpaper-grid",oncreate:build})}}';
const gStart = src.indexOf('gallery:function(t){return function(e,n){');
if (gStart === -1) {
  if (!src.includes(renderAnchor)) {
    fail('renderer anchor not found');
  }
  src = src.replace(renderAnchor, galleryRenderer + renderAnchor);
} else {
  // replace any previously injected gallery renderer (idempotent):
  // it always sits right before the `fallback` renderer anchor
  const gEnd = src.indexOf(renderAnchor, gStart);
  if (gEnd === -1) {
    fail('gallery renderer end (fallback anchor) not found');
  }
  src = src.slice(0, gStart) + galleryRenderer.slice(1) + src.slice(gEnd);
}

fs.writeFileSync(file, src);
console.log('settings patched (themes + wallpaper gallery)');
