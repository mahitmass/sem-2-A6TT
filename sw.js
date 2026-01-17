const CACHE_NAME = 'a6-planner-v9'; // I bumped the version for you
const ASSETS = [
  './',
  './index.html',
  './app.js',       // MAKE SURE this matches your actual JS file name!
  './data.js',      // You MUST cache your data file
  './manifest.json',
  './Logo.png'
];

// 1. INSTALL (Fixes the "addAll" error)
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// 2. ACTIVATE (Cleanup)
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

// 3. FETCH (Stale-While-Revalidate + GTM Fix)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // RULE: IGNORE external requests (like Google Tag Manager)
  // This fixes the "Failed to convert value to Response" error
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
      }).catch(() => { /* Network error is fine now */ });

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
