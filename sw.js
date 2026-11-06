// Hanvika app — offline shell. Never touches Supabase traffic (other origin).
const CACHE='hanvika-v49';
const SHELL=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png','apple-touch-icon.png'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL.map(u=>new Request(u,{cache:'reload'})))).then(()=>self.skipWaiting())); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{
  const req=e.request, url=new URL(req.url);
  if(req.method!=='GET'||url.origin!==self.location.origin) return;
  const isPage=req.mode==='navigate'||url.pathname.endsWith('/')||url.pathname.endsWith('/index.html');
  if(isPage){ // the phone's copy is used until the person taps "Update now" (?u=): then the newest copy is fetched and kept.
    // ?check=1 is the app asking the website which version is there (never cached).
    const fresh=url.searchParams.has('u')||url.searchParams.has('check');
    const net=()=>fetch(req.url,{cache:'no-cache',credentials:'same-origin'}).then(r=>{ if(r.redirected) return Response.redirect(r.url,302);
      if(r.ok&&!url.searchParams.has('check')){ const cp=r.clone(); caches.open(CACHE).then(c=>c.put('index.html',cp)); } return r; });
    e.respondWith(fresh?net().catch(()=>caches.match('index.html').then(r=>r||caches.match('./'))):caches.match('index.html').then(r=>r||net()));
    return; }
  e.respondWith(caches.match(req).then(r=>r||fetch(req)));
});
// morning reminders (Web Push from the push-reminders server function): show them; a tap opens the app
self.addEventListener('push',e=>{ let d={}; try{ d=e.data?e.data.json():{}; }catch(x){ d={body:e.data?e.data.text():''}; }
  e.waitUntil(self.registration.showNotification(d.title||'Hanvika Industries',{body:d.body||'',icon:'icon-192.png',tag:d.tag||'hanvika',renotify:true,data:{url:d.url||'./'}})); });
self.addEventListener('notificationclick',e=>{ e.notification.close(); const url=new URL((e.notification.data&&e.notification.data.url)||'./',self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(ws=>{ for(const w of ws){ if(w.url.indexOf(self.registration.scope)===0&&'focus' in w) return w.focus(); } return self.clients.openWindow(url); })); });
