const CACHE_NAME = 'a6-planner-v24'; // Bump version
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
        // 1. OPEN CACHE
        const cache = await caches.open(CACHE_NAME);
        const cleanUrl = new URL(request.url);
        cleanUrl.search = ''; 
        const cleanRequest = new Request(cleanUrl);
        const cachedResponse = await cache.match(cleanRequest);

        // 2. THE "INSTANT" PART
        // If we have cache, return it IMMEDIATELY. Do not wait for network.
        if (cachedResponse) {
            // Trigger the background update safely
            if (isDataFile) {
                event.waitUntil(updateInBackground(request, cache, cleanRequest, cachedResponse));
            }
            return cachedResponse;
        }

        // 3. NO CACHE? (First install) -> Must use network
        return fetch(request);
    })()
  );
});

async function updateInBackground(request, cache, cleanRequest, cachedResponse) {
    try {
        // Fetch fresh data from network (bypass browser cache)
        const networkResponse = await fetch(request, { cache: 'no-store' });
        
        if (networkResponse && networkResponse.status === 200) {
            const cachedText = await cachedResponse.text();
            const networkText = await networkResponse.clone().text();

            // Compare: Did the schedule change?
            if (cachedText !== networkText) {
                // Update Cache
                await cache.put(cleanRequest, networkResponse.clone());
                // Trigger Reload
                notifyClients();
            }
        }
    } catch (err) {
        // Offline? No problem. User is already seeing the cached app.
    }
}

async function notifyClients() {
  const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  clients.forEach(client => {
    client.postMessage({ type: 'FORCE_RELOAD' });
  });
}
