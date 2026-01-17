const CACHE_NAME = 'a6-planner-v18';
const TIMEOUT_MS = 1000; // <--- The 1 Second Rule

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

// 3. FETCH (The Hybrid "Race" Logic)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  event.respondWith(
    (async () => {
      // A. Create the Network Promise (Force fresh check)
      const networkPromise = fetch(event.request.url, { cache: 'no-store' })
        .catch(() => null);

      // B. Create the Timeout Promise (1 Second)
      const timeoutPromise = new Promise(resolve => 
        setTimeout(() => resolve('TIMEOUT'), TIMEOUT_MS)
      );

      // C. Get Cache Promise (Just in case we need it)
      const cachePromise = caches.match(event.request);

      // D. RACE: Network vs 1 Second Timer
      const raceResult = await Promise.race([networkPromise, timeoutPromise]);

      // === SCENARIO 1: FAST INTERNET (< 1s) ===
      // If network won and gave us a good file
      if (raceResult && raceResult !== 'TIMEOUT' && raceResult.status === 200) {
        // 1. Save to cache for next time
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, raceResult.clone());
        
        // 2. Return FRESH data to app immediately. 
        // Result: App has latest data. NO BUTTON needed.
        return raceResult;
      }

      // === SCENARIO 2: SLOW INTERNET (> 1s) or OFFLINE ===
      // Timeout won, so we must show Cache to avoid white screen
      const cachedResponse = await cachePromise;
      
      if (cachedResponse) {
        // 1. Clone cache to use for comparison later
        const cacheClone = cachedResponse.clone();

        // 2. Start Background Check
        // Even though we are showing cache, let the slow network finish
        // and notify us if it's different.
        updateInBackground(event.request, networkPromise, cacheClone);
        
        // 3. Show OLD data now (Instant Load)
        return cachedResponse;
      }

      // Fallback: If no cache exists (first visit), we have to wait for network
      return networkPromise;
    })()
  );
});

// Helper: Handles the "Slow" update in background
async function updateInBackground(request, networkPromise, cachedResponse) {
  try {
    const networkResponse = await networkPromise;
    if (networkResponse && networkResponse.status === 200) {
      
      // Compare content: Old Cache vs New Slow Download
      const cachedText = await cachedResponse.text();
      const networkText = await networkResponse.clone().text();
      
      if (cachedText !== networkText) {
        // Content changed! Update cache & Show Button
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, networkResponse.clone());
        notifyClients(request.url);
      }
    }
  } catch (err) {
    // Network failed completely? Ignore.
  }
}

async function notifyClients(url) {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ type: 'UPDATE_AVAILABLE', url: url });
  });
}
