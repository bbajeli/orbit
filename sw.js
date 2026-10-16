// Service worker di Orbite: l'app si apre anche senza rete. I dati di CelesTrak passano sempre dalla rete.
// Dopo ogni modifica all'app cambia il numero di versione qui sotto, così il telefono scarica i file nuovi.
const V='orbite-v2';
const SHELL=['./','index.html','manifest.webmanifest','icon-180.png','icon-192.png','icon-512.png'];
const LIBS=['https://cdnjs.cloudflare.com/ajax/libs/satellite.js/5.0.0/satellite.min.js','https://cdnjs.cloudflare.com/ajax/libs/topojson/3.0.2/topojson.min.js'];
self.addEventListener('install',e=>{
  e.waitUntil((async()=>{
    const c=await caches.open(V);
    await c.addAll(SHELL);
    for(const u of LIBS){try{await c.add(u)}catch(err){}}
    await self.skipWaiting();
  })());
});
self.addEventListener('activate',e=>{
  e.waitUntil((async()=>{
    for(const k of await caches.keys())if(k.startsWith('orbite-v')&&k!==V)await caches.delete(k);// 'orbite-gp' (dati CelesTrak) resta
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET')return;
  if(new URL(r.url).hostname==='celestrak.org')return;
  e.respondWith((async()=>{
    const c=await caches.open(V),hit=await c.match(r);
    const net=fetch(r).then(res=>{if(res&&(res.ok||res.type==='opaque'))c.put(r,res.clone());return res}).catch(()=>null);
    if(hit){e.waitUntil(net);return hit}
    return (await net)||new Response('Offline',{status:503});
  })());
});
