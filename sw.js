const CACHE_NAME = 'a6-planner-v16'; // Version bump
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './Logo.png',
  './js/app.js',
  './js/data.js',
  './js/utils.js',
  './css/styles.css'
];

// 1. INSTALL
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// 2. ACTIVATE
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

// 3. FETCH (The Loop Fix)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(event.request);

      const networkFetch = fetch(event.request).then(async (networkResponse) => {
        // Only process if we got a valid file
        if (networkResponse && networkResponse.status === 200) {
          
          // --- NEW: COMPARE CONTENT BEFORE NOTIFYING ---
          let shouldNotify = true;
          
          if (cachedResponse) {
            // Clone buffers to read text without consuming the main response
            const cachedText = await cachedResponse.clone().text();
            const networkText = await networkResponse.clone().text();
            
            // If the content is exactly the same, DO NOT notify
            if (cachedText === networkText) {
              shouldNotify = false;
            }
          }

          // Update the cache with the new version (to keep headers fresh)
          cache.put(event.request, networkResponse.clone());

          // Only send message if file actually CHANGED
          if (shouldNotify) {
             notifyClients(event.request.url);
          }
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
