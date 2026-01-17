const CACHE_NAME = 'a6-planner-v10'; // I bumped the version for you
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './Logo.png',
  './js/app.js',
  './js/data.js',
  './js/utils.js', 
  './css/style.css' 
];

// 1. INSTALL
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// 2. ACTIVATE (Cleanup old caches)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    ))
  );
  self.clients.claim();
});

// 3. FETCH (Stale-While-Revalidate)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(event.request);
      const networkFetch = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          cache.put(event.request, networkResponse.clone());
          notifyClients(event.request.url);
        }
        return networkResponse;
      }).catch(() => { /* Offline fallback */ });

      return cachedResponse || networkFetch;
    })
  );
});

async function notifyClients(url) {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ type: 'UPDATE_AVAILABLE', url: url });
  });
}
