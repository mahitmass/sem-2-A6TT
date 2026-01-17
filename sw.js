const CACHE_NAME = 'a6-planner-v19'; // Bump version
const TIMEOUT_MS = 2000; // Give it 2 seconds to try fast network

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
  self.skipWaiting();
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
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  event.respondWith(
    (async () => {
      // 1. Network Promise (No Store = Force Check)
      const networkPromise = fetch(event.request.url, { cache: 'no-store' })
        .catch(() => null);

      // 2. Timeout Promise
      const timeoutPromise = new Promise(resolve => 
        setTimeout(() => resolve('TIMEOUT'), TIMEOUT_MS)
      );

      // 3. Cache Promise
      const cachePromise = caches.match(event.request);

      // 4. RACE
      const raceResult = await Promise.race([networkPromise, timeoutPromise]);

      // SCENARIO A: Fast Internet (Update Instant)
      if (raceResult && raceResult !== 'TIMEOUT' && raceResult.status === 200) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, raceResult.clone());
        return raceResult;
      }

      // SCENARIO B: Slow Internet (Serve Cache First)
      const cachedResponse = await cachePromise;
      if (cachedResponse) {
        // Serve cache immediately
        // BUT check for updates in background
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
        // Data Changed!
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, networkResponse.clone());
        
        // FORCE RELOAD COMMAND
        notifyClientsOfForceUpdate();
      }
    }
  } catch (e) { /* Ignore */ }
}

async function notifyClientsOfForceUpdate() {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ type: 'FORCE_RELOAD' });
  });
}
