const CACHE_NAME = 'a6-planner-v23'; // Bump version
const TIMEOUT_MS = 400; // <--- 0.4 Seconds (Very Fast)

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
  
  // Apply special logic ONLY to data.js
  // We check for 'data.js' in the path
  const isDataFile = url.pathname.endsWith('data.js');

  if (isDataFile) {
      event.respondWith(handleDataUpdate(event.request));
  } else {
      // Standard Cache First for everything else
      event.respondWith(
        caches.match(event.request).then(cached => {
            return cached || fetch(event.request);
        })
      );
  }
});

async function handleDataUpdate(request) {
    const cache = await caches.open(CACHE_NAME);
    
    // 1. Identify the "Clean" URL (No timestamp)
    const cleanUrl = new URL(request.url);
    cleanUrl.search = ''; 
    const cleanRequest = new Request(cleanUrl);

    // 2. Prepare the Network Promise
    // We attach the logic to compare/update INSIDE this promise
    const networkPromise = fetch(request, { cache: 'no-store' })
        .then(async (networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
                // Check if we need to update
                await checkForChanges(cache, cleanRequest, networkResponse.clone());
                return networkResponse;
            }
            throw new Error("Network failed");
        })
        .catch(() => null); // If fails, return null so Race doesn't break

    // 3. Prepare the Timeout Promise (400ms)
    const timeoutPromise = new Promise(resolve => 
        setTimeout(() => resolve('TIMEOUT'), TIMEOUT_MS)
    );

    // 4. Try to get Cache first (to have it ready)
    const cachedResponse = await cache.match(cleanRequest);

    // 5. THE RACE
    // We race Network vs Timeout
    const winner = await Promise.race([networkPromise, timeoutPromise]);

    // SCENARIO A: Network Won (Super Fast Internet)
    if (winner && winner !== 'TIMEOUT') {
        return winner;
    }

    // SCENARIO B: Timeout Won (Slow Internet) OR Network Failed
    // Return Cache immediately so app opens
    if (cachedResponse) {
        return cachedResponse;
    }

    // SCENARIO C: First Visit (No Cache) + Slow Internet
    // We have to wait for network
    return networkPromise;
}

// Helper to compare and notify
async function checkForChanges(cache, cleanRequest, networkResponse) {
    const cachedResponse = await cache.match(cleanRequest);
    
    // Always update the cache with the new version
    await cache.put(cleanRequest, networkResponse.clone());

    if (cachedResponse) {
        const cachedText = await cachedResponse.text();
        const networkText = await networkResponse.clone().text();

        if (cachedText !== networkText) {
            console.log("[SW] Content changed. Triggering Reload.");
            notifyClients();
        }
    }
}

async function notifyClients() {
  const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  clients.forEach(client => {
    client.postMessage({ type: 'FORCE_RELOAD' });
  });
}
