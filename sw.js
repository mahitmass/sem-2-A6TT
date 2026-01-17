const CACHE_NAME = 'a6-planner-v21'; // Bump Version
const TIMEOUT_MS = 2000; 

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './Logo.png',
  './js/app.js',
  './js/data.js', // We cache the clean URL
  './js/utils.js',
  './css/styles.css'
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force new SW to take over immediately
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
  self.clients.claim(); // Take control of open pages immediately
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  // We only care about silent updates for data and app logic
  const isDataFile = url.pathname.includes('data.js') || url.pathname.includes('app.js');

  event.respondWith(
    (async () => {
      // 1. Create a "Cache Buster" request for the network
      // This forces the browser/Vercel to give us the REAL file, not a cached copy.
      let networkRequest = event.request;
      if (isDataFile) {
          // Append ?t=timestamp to the URL
          const cacheBusterUrl = new URL(event.request.url);
          cacheBusterUrl.searchParams.set('t', Date.now());
          networkRequest = new Request(cacheBusterUrl);
      }

      // 2. Network Promise
      const networkPromise = fetch(networkRequest, { cache: 'no-store' })
        .catch(() => null);

      // 3. Timeout Promise (2 seconds)
      const timeoutPromise = new Promise(resolve => 
        setTimeout(() => resolve('TIMEOUT'), TIMEOUT_MS)
      );

      // 4. Cache Promise
      const cachePromise = caches.match(event.request);

      // 5. RACE: Network vs Timeout
      const raceResult = await Promise.race([networkPromise, timeoutPromise]);

      // SCENARIO A: Fast Internet (Serve Fresh & Update Cache)
      if (raceResult && raceResult !== 'TIMEOUT' && raceResult.status === 200) {
        const cache = await caches.open(CACHE_NAME);
        // Important: We save the *original* request (no timestamp), but the *new* response
        cache.put(event.request, raceResult.clone());
        return raceResult;
      }

      // SCENARIO B: Slow Internet (Serve Cache First)
      const cachedResponse = await cachePromise;
      if (cachedResponse) {
        // Return old data to user INSTANTLY
        // BUT... start the background check
        if (isDataFile) {
            checkForSilentUpdate(event.request, networkPromise, cachedResponse);
        }
        return cachedResponse;
      }

      // Fallback if no cache
      return networkPromise;
    })()
  );
});

async function checkForSilentUpdate(originalRequest, networkPromise, cachedResponse) {
  try {
    const networkResponse = await networkPromise;
    if (networkResponse && networkResponse.status === 200) {
      const cachedText = await cachedResponse.text();
      const networkText = await networkResponse.clone().text();

      // Compare the files
      if (cachedText !== networkText) {
        console.log("Difference detected! Updating cache and reloading...");
        
        const cache = await caches.open(CACHE_NAME);
        cache.put(originalRequest, networkResponse.clone());
        
        // SEND THE COMMAND
        notifyClientsOfForceUpdate();
      }
    }
  } catch (e) { /* Ignore errors */ }
}

async function notifyClientsOfForceUpdate() {
  const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  clients.forEach(client => {
    client.postMessage({ type: 'FORCE_RELOAD' });
  });
}
