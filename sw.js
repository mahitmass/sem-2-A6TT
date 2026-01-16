const CACHE_NAME = 'a6-planner-v6'; 
const TIMEOUT_MS = 3000; // 3 Seconds Timeout

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

// 3. STALE-WHILE-REVALIDATE (Instant Load + Background Update)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      // 1. Try to get it from the cache FIRST
      const cachedResponse = await cache.match(event.request);

      // 2. Start a network fetch in the background
      const networkFetch = fetch(event.request).then((networkResponse) => {
        // If the network works and gives us valid data...
        if (networkResponse && networkResponse.status === 200) {
          // Update the cache with the new data
          cache.put(event.request, networkResponse.clone());
          
          // NOTIFY THE APP that new data is here
          notifyClients(event.request.url);
        }
        return networkResponse;
      }).catch(() => {
        // Network failed? That's fine, we handled it.
      });

      // 3. Return the cached response IMMEDIATELY (if we have it)
      // If cache is empty (first visit), wait for the network.
      return cachedResponse || networkFetch;
    })
  );
});

// Helper to tell the frontend "Hey, I updated something!"
async function notifyClients(url) {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'UPDATE_AVAILABLE',
      url: url
    });
  });
}
