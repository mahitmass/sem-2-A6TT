const CACHE_NAME = 'a6-planner-v30'; // Bump Version
const TIMEOUT_MS = 1000; // 1 Second Timeout

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
  self.clients.claim();
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    ))
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const isDataFile = url.pathname.endsWith('data.js');

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      
      // 1. Prepare Clean Request
      const cleanUrl = new URL(event.request.url);
      cleanUrl.search = '';
      const cleanRequest = new Request(cleanUrl);

      // 2. Network Promise (Safe)
      // We wrap this so it never throws an error that crashes the page
      const networkPromise = (async () => {
          try {
              const networkUrl = new URL(event.request.url);
              if (isDataFile) networkUrl.searchParams.set('sb', Date.now()); // Cache Buster
              
              const response = await fetch(networkUrl, { cache: 'no-store' });
              if (response && response.status === 200) {
                  return response;
              }
          } catch(e) { /* Ignore offline errors */ }
          throw new Error("Network Failed");
      })();

      // 3. Timeout Promise
      const timeoutPromise = new Promise(resolve => 
          setTimeout(() => resolve('TIMEOUT'), TIMEOUT_MS)
      );

      // 4. Get Cache
      const cachedResponse = await cache.match(cleanRequest);

      // --- THE RACE ---
      let winner;
      try {
          if (!cachedResponse) {
              // If no cache (First Visit), we MUST wait for network. No racing.
              winner = await networkPromise;
          } else {
              // If we have cache, we race.
              winner = await Promise.race([networkPromise, timeoutPromise]);
          }
      } catch (e) {
          winner = 'TIMEOUT';
      }

      // SCENARIO A: Network Won (Fresh Data!)
      if (winner !== 'TIMEOUT') {
          // Save valid response to cache
          await cache.put(cleanRequest, winner.clone());
          return winner;
      }

      // SCENARIO B: Timeout Won (Slow Net) or Network Failed
      if (cachedResponse) {
          // Serve Old Data immediately
          // But update in background if it was the data file
          if (isDataFile) {
              event.waitUntil(
                  updateInBackground(networkPromise, cache, cleanRequest, cachedResponse)
              );
          }
          return cachedResponse;
      }
      
      // SCENARIO C: No Cache + Network Failed (Offline on First Visit)
      // Instead of crashing with ERR_FAILED, return a basic fallback or nothing
      // (The browser will show its standard offline page, which is better than a crash)
      return networkPromise;
    })()
  );
});

async function updateInBackground(networkPromise, cache, cleanRequest, oldResponse) {
    try {
        const networkResponse = await networkPromise;
        
        const oldText = await oldResponse.text();
        const newText = await networkResponse.clone().text();

        // Update Cache
        await cache.put(cleanRequest, networkResponse.clone());

        // Notify if changed
        if (oldText !== newText) {
            console.log("[SW] Update Detected. Reloading...");
            notifyClients();
        }
    } catch (err) {
        // Network failed silently. Do nothing.
    }
}

async function notifyClients() {
  const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  clients.forEach(client => {
    client.postMessage({ type: 'FORCE_RELOAD' });
  });
}
