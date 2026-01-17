const CACHE_NAME = 'a6-planner-v7'; // Updated version
const ASSETS = [
  './',
  './index.html',
  './timetable.js',
  './manifest.json',
  './Logo.png' 
];

// 1. INSTALL
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// 2. ACTIVATE (Cleanup old versions)
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

// 3. FETCH (Stale-While-Revalidate Strategy)
self.addEventListener('fetch', (event) => {
  // RULE: Only handle GET requests
  if (event.request.method !== 'GET') return;

  // RULE: IGNORE external requests (Google, APIs, etc.)
  // This prevents the "Failed to convert value to Response" error
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      // A. Try Cache First (Instant Load)
      const cachedResponse = await cache.match(event.request);

      // B. Fetch Network in Background (To Update Cache)
      const networkFetch = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          cache.put(event.request, networkResponse.clone());
          notifyClients(event.request.url); // Tell App to reload if needed
        }
        return networkResponse;
      }).catch(() => {
        // Network failed? No problem, we have cache.
      });

      // C. Return Cache if available, otherwise wait for Network
      return cachedResponse || networkFetch;
    })
  );
});

// Helper to notify app of updates
async function notifyClients(url) {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ type: 'UPDATE_AVAILABLE', url: url });
  });
}
