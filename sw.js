// Hanvika app — offline shell. Never touches Supabase traffic (other origin).
const CACHE='hanvika-v44';
const SHELL=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png','apple-touch-icon.png'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{
  const req=e.request, url=new URL(req.url);
  if(req.method!=='GET'||url.origin!==self.location.origin) return;
  const isPage=req.mode==='navigate'||url.pathname.endsWith('/')||url.pathname.endsWith('/index.html');
  if(isPage){ // network first, so updates arrive as soon as you're online
    e.respondWith(fetch(req).then(r=>{ if(r.ok){ const cp=r.clone(); caches.open(CACHE).then(c=>c.put('index.html',cp)); } return r; })
      .catch(()=>caches.match('index.html').then(r=>r||caches.match('./'))));
    return; }
  e.respondWith(caches.match(req).then(r=>r||fetch(req)));
});
