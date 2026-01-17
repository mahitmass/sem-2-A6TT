const CACHE_NAME = 'a6-planner-v29'; // Bump Version
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
      
      // 1. Prepare Request Info
      const cleanUrl = new URL(event.request.url);
      cleanUrl.search = '';
      const cleanRequest = new Request(cleanUrl);

      // 2. Prepare Network Promise (With Cache Buster)
      const networkPromise = (async () => {
          const networkUrl = new URL(event.request.url);
          if (isDataFile) networkUrl.searchParams.set('sb', Date.now()); // Unique timestamp
          
          const response = await fetch(networkUrl, { cache: 'no-store' });
          if (response && response.status === 200) {
              return response; // Return fresh response
          }
          throw new Error("Network Failed");
      })();

      // 3. Prepare Timeout Promise
      const timeoutPromise = new Promise(resolve => 
          setTimeout(() => resolve('TIMEOUT'), TIMEOUT_MS)
      );

      // 4. Get Current Cache (Old Data)
      const cachedResponse = await cache.match(cleanRequest);
      
      // --- THE RACE ---
      let winner;
      try {
          // If we have no cache, we MUST wait for network (no race)
          if (!cachedResponse) {
              winner = await networkPromise;
          } else {
              winner = await Promise.race([networkPromise, timeoutPromise]);
          }
      } catch (e) {
          winner = 'TIMEOUT'; // Network failed, treat as timeout
      }

      // SCENARIO A: Network Won (Fast Internet)
      // We have fresh data ready to go!
      if (winner !== 'TIMEOUT') {
          // Save it to cache for next time
          await cache.put(cleanRequest, winner.clone());
          return winner; // User sees NEW data instantly. No reload needed.
      }

      // SCENARIO B: Timeout Won (Slow Internet) -> Serve Old Cache
      // User sees OLD data. We must update in background.
      if (cachedResponse) {
          // Trigger background update logic
          if (isDataFile) {
              event.waitUntil(
                  updateInBackground(networkPromise, cache, cleanRequest, cachedResponse)
              );
          }
          return cachedResponse;
      }
      
      // Fallback (Shouldn't happen if logic is correct)
      return networkPromise;
    })()
  );
});

async function updateInBackground(networkPromise, cache, cleanRequest, oldResponse) {
    try {
        // Wait for the network to finally finish
        const networkResponse = await networkPromise;
        
        // 1. Get text content to compare
        const oldText = await oldResponse.text();
        const newText = await networkResponse.clone().text(); // Clone so we can still save it

        // 2. Save new data to cache (Overwriting old)
        await cache.put(cleanRequest, networkResponse.clone());

        // 3. THE CHECK: Did the data actually change?
        if (oldText !== newText) {
            console.log("[SW] Data Update Detected. Reloading...");
            notifyClients();
        } else {
            console.log("[SW] Data was already up to date.");
        }
    } catch (err) {
        // Network failed completely. Do nothing.
    }
}

async function notifyClients() {
  const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  clients.forEach(client => {
    client.postMessage({ type: 'FORCE_RELOAD' });
  });
}
