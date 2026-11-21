/*
 * Injects Malta OS appearance items into the Settings app:
 *  - Themes: window style and titlebar button size
 *    (saved under osjs/desktop -> webos.{wm,wbtn} — only `desktop.*` and
 *    `locale.*` paths survive the app's save()).
 *  - Background: "Wallpapers" gallery item rendered as clickable thumbnails
 *    via an injected `gallery` renderer.
 *  - Dock: size, position, hover magnification and pinned apps.
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
  '{label:"Titlebar button size",path:"desktop.webos.wbtn",type:"webosRange",' +
  'defaultValue:14,min:10,max:24}' +
  themesAnchor;
if (!src.includes('desktop.webos.wm')) {
  if (!src.includes(themesAnchor)) {
    fail('themes anchor not found');
  }
  src = src.replace(themesAnchor, themesInject);
}

// Upgrade earlier runs of this patch as well as fresh package installs.
src = src
  .replace(/type:"select",defaultValue:"14",choices:function\(\)\{return\{"10":"small","14":"normal","18":"large","24":"huge"\}\}\}/,
    'type:"webosRange",defaultValue:14,min:10,max:24}')
  .replace('{label:"Appearance and dock",path:"desktop",type:"webosCustomize"},', '')
  .replace(/,webosCustomize:function\(\)\{.*?(?=,webosLanguage:function|,gallery:function)/, '');

const dockAnchor = ']},{title:"Locales"';
const dockItems = ']},{title:"Dock",items:[' +
  '{label:"cust.dockSize",path:"desktop.webos.docksize",type:"webosRange",defaultValue:48,min:32,max:72},' +
  '{label:"cust.dockPos",path:"desktop.webos.dockpos",type:"select",defaultValue:"bottom",' +
  'choices:function(){return{bottom:"cust.posBottom",left:"cust.posLeft",right:"cust.posRight"}}},' +
  '{label:"cust.magnify",path:"desktop.webos.magnify",type:"webosToggle",defaultValue:true},' +
  '{path:"desktop",type:"webosManageDock"}';
if (!src.includes('title:"Dock",items:[')) {
  if (!src.includes(dockAnchor)) {
    fail('dock anchor not found');
  }
  src = src.replace(dockAnchor, dockItems + dockAnchor);
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
  src = src.replace(/("?images"?\s*:\s*)\[+[^\]]*\]+/,
    '$1' + JSON.stringify(GALLERY_IMAGES));
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
  'var PER=4,page=0;' +
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
    'up.title=e.malta.translate("Upload image")+" (png, jpg, jpeg)";' +
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
      '.catch(function(){alert(e.malta.translate("Image upload failed"))})};' +
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

const galleryAnchor = ',gallery:function(t){';

const replaceOnce = (before, after) => {
  if (src.includes(after)) return;
  if (!src.includes(before)) fail('settings anchor not found: ' + before);
  src = src.replace(before, after);
};

replaceOnce('g=p({loading:!1', 'g=p({malta:t.make("webos/preferences"),loading:!1');
const translatedLabel = 'marginBottom:0}},t.label?e.malta.translate(t.label):"")';
src = src.replace('marginBottom:0}},e.malta.translate(t.label))', translatedLabel);
replaceOnce('marginBottom:0}},t.label)', translatedLabel);
replaceOnce('labels:tt.map((function(t){return t.title}))',
  'labels:tt.map((function(r){return t.malta.translate(r.title)}))');
replaceOnce('d("LBL_SAVE"))', 't.malta.translate("Save"))');
replaceOnce('choices:t.choices(e),oninput',
  'choices:((choices)=>Array.isArray(choices)?choices.map(o=>({...o,label:e.malta.translate(o.label)})):' +
    'Object.fromEntries(Object.entries(choices).map(([k,v])=>[k,e.malta.translate(v)])))(t.choices(e)),oninput');
replaceOnce('title:"Select background"', 'title:e.malta.translate("Select background")');
replaceOnce('label:"Language (requires restart)",path:"locale.language",type:"select",choices:function(t){return t.locales}',
  'label:"Language",path:"locale.language",type:"webosLanguage"');
replaceOnce(galleryAnchor, ',webosLanguage:function(){return function(e){' +
  'return f(H,{value:e.malta.locale(),choices:e.malta.locales,oninput:function(_,id){' +
  'e.malta.setLocale(id)}})}}' + galleryAnchor);
replaceOnce('n.on("settings/refresh",(function(){return g.refresh()}))',
  'var m=t.make("webos/preferences"),refresh=function(){n.setTitle(m.translate("Settings"));g.refresh()};' +
  'n.on("settings/refresh",(function(){return g.refresh()}));n.on("destroy",m.onLocale(refresh));refresh()');

replaceOnce('path:"desktop.iconview.enabled",type:"select",choices:',
  'path:"desktop.iconview.enabled",type:"select",transformValue:function(value){return String(value!==false)},choices:');

const languageRenderer = ',webosLanguage:function(){';
replaceOnce(languageRenderer,
  ',webosRange:function(t){return function(e,n){' +
  'return f("div",{style:{display:"flex",alignItems:"center",gap:"8px"}},[' +
  'f("input",{type:"range",min:t.min,max:t.max,value:t.value,' +
  '"aria-label":e.malta.translate(t.label),oninput:function(ev){' +
  'return n.update({path:t.path,value:Number(ev.target.value)})}}),' +
  'f("span",{},t.value+" px")])}},' +
  'webosToggle:function(t){return function(e,n){return f("input",{' +
  'type:"checkbox",checked:t.value,"aria-label":e.malta.translate(t.label),' +
  'onchange:function(ev){return n.update({path:t.path,value:ev.target.checked})}})}},' +
  'webosManageDock:function(){return function(e){return f(I,{onclick:function(){' +
  'document.dispatchEvent(new Event("webos:manage-dock"))}},e.malta.translate("cust.manageDock"))}}' +
  languageRenderer);

fs.writeFileSync(file, src);
console.log('settings patched (themes, wallpapers, dock and localization)');
