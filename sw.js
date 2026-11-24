/* Service worker: guarda la web para usarla sin conexión.
   Estrategia: responde desde caché y actualiza en segundo plano (stale-while-revalidate).
   Los videos (carpeta videos/) no se guardan: son pesados y el navegador los pide por rangos.
   Sube CACHE de versión cuando cambies archivos importantes. */
const CACHE = 'dmfinal-v4';
const ASSETS = ['./', './index.html', './engine.js', './data.js', './videos.js', './app.js', './apuntes.pdf', './manifest.webmanifest', './icons/icon-192.png', './icons/apple-touch-icon.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (new URL(e.request.url).pathname.includes('/videos/')) return; // red directa (soporta Range)
  e.respondWith(caches.open(CACHE).then((c) => c.match(e.request, { ignoreSearch: true }).then((hit) => {
    const net = fetch(e.request).then((res) => { if (res && (res.ok || res.type === 'opaque')) c.put(e.request, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  })));
});
