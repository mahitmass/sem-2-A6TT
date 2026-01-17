const CACHE_NAME = 'a6-planner-v22'; // Bump version
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
  self.skipWaiting(); // Take over immediately
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('activate', (event) => {
  self.clients.claim(); // Control open pages immediately
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
  
  // We strictly filter for data.js to apply the special logic
  const isDataFile = url.pathname.endsWith('data.js');

  if (isDataFile) {
      event.respondWith(handleDataUpdate(event.request));
  } else {
      // Standard Cache First strategy for everything else (CSS, Images)
      event.respondWith(
        caches.match(event.request).then(cached => {
            return cached || fetch(event.request);
        })
      );
  }
});

// The Special Logic for data.js
async function handleDataUpdate(request) {
    const cache = await caches.open(CACHE_NAME);
    
    // 1. Get the "Clean" Request (without timestamp ?t=...)
    // We need this so we save it to the cache correctly
    const cleanUrl = new URL(request.url);
    cleanUrl.search = ''; 
    const cleanRequest = new Request(cleanUrl);

    // 2. Try to fetch from Network (bypass ALL caches)
    try {
        const networkResponse = await fetch(request, { 
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' } 
        });

        if (networkResponse && networkResponse.status === 200) {
            // 3. Compare with what we have in Cache
            const cachedResponse = await cache.match(cleanRequest);
            
            if (cachedResponse) {
                const cachedText = await cachedResponse.text();
                const networkText = await networkResponse.clone().text();

                if (cachedText !== networkText) {
                    console.log("[SW] Data changed! Updating cache & reloading...");
                    await cache.put(cleanRequest, networkResponse.clone());
                    notifyClients(); // TRIGGER RELOAD
                }
            } else {
                // First time? Just save it.
                await cache.put(cleanRequest, networkResponse.clone());
            }
            return networkResponse;
        }
    } catch (error) {
        // Network failed? Fall back to cache
    }

    // 4. Return Cached Version if network failed
    return cache.match(cleanRequest);
}

async function notifyClients() {
  const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  clients.forEach(client => {
    client.postMessage({ type: 'FORCE_RELOAD' });
  });
}
