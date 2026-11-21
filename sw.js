/* Service worker: guarda la web para usarla sin conexión.
   Estrategia: responde desde caché y actualiza en segundo plano (stale-while-revalidate).
   Sube CACHE de versión cuando cambies archivos importantes. */
const CACHE = 'dmfinal-v2';
const ASSETS = ['./', './index.html', './engine.js', './data.js', './app.js', './manifest.webmanifest', './icons/icon-192.png', './icons/apple-touch-icon.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.open(CACHE).then((c) => c.match(e.request, { ignoreSearch: true }).then((hit) => {
    const net = fetch(e.request).then((res) => { if (res && (res.ok || res.type === 'opaque')) c.put(e.request, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  })));
});
