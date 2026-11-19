/* Acacia offline app shell. API/auth/payment requests are never cached. */
const CACHE = 'acacia-rides-shell-v1';
const SHELL = ["./", "./index.html", "./styles.css", "./scripts.js", "./pwa-register.js", "./manifest.webmanifest", "./sw.js", "./logs.html", "./audit-log.js", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png", "./favicon-32.png"];
self.addEventListener('install', event => event.waitUntil((async()=>{const c=await caches.open(CACHE); await Promise.all(SHELL.map(x=>c.add(x).catch(()=>{}))); await self.skipWaiting();})()));
self.addEventListener('activate', event => event.waitUntil((async()=>{for(const k of await caches.keys()) if(k!==CACHE) await caches.delete(k); await self.clients.claim();})()));
self.addEventListener('fetch', event => {const r=event.request; if(r.method!=='GET') return; const u=new URL(r.url); if(u.origin!==location.origin) return; event.respondWith((async()=>{try{const res=await fetch(r); if(res.ok && res.type==='basic'){const c=await caches.open(CACHE); c.put(r,res.clone());} return res;}catch(e){return (await caches.match(r)) || (r.mode==='navigate' ? await caches.match('./index.html') : Response.error());}})());});
