const CACHE_NAME = 'a6-planner-v20'; // Version Bump
const TIMEOUT_MS = 2000; 

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

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Activate immediately
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    ))
  );
  self.clients.claim(); // Take control immediately
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  event.respondWith(
    (async () => {
      // 1. Network Promise (No Store)
      const networkPromise = fetch(event.request.url, { cache: 'no-store' })
        .catch(() => null);

      // 2. Timeout
      const timeoutPromise = new Promise(resolve => 
        setTimeout(() => resolve('TIMEOUT'), TIMEOUT_MS)
      );

      // 3. Cache
      const cachePromise = caches.match(event.request);

      // 4. Race
      const raceResult = await Promise.race([networkPromise, timeoutPromise]);

      // Fast Network: Update Cache & Return
      if (raceResult && raceResult !== 'TIMEOUT' && raceResult.status === 200) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, raceResult.clone());
        return raceResult;
      }

      // Slow Network: Return Cache, but check background
      const cachedResponse = await cachePromise;
      if (cachedResponse) {
        checkForSilentUpdate(event.request, networkPromise, cachedResponse);
        return cachedResponse;
      }

      return networkPromise;
    })()
  );
});

async function checkForSilentUpdate(request, networkPromise, cachedResponse) {
  try {
    const networkResponse = await networkPromise;
    if (networkResponse && networkResponse.status === 200) {
      const cachedText = await cachedResponse.text();
      const networkText = await networkResponse.clone().text();

      if (cachedText !== networkText) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, networkResponse.clone());
        notifyClientsOfForceUpdate(); // <--- Data Changed!
      }
    }
  } catch (e) { /* Ignore */ }
}

async function notifyClientsOfForceUpdate() {
  // MATCH ALL CLIENTS (The fix)
  const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  clients.forEach(client => {
    client.postMessage({ type: 'FORCE_RELOAD' });
  });
}
