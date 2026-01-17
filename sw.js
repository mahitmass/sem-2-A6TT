const CACHE_NAME = 'a6-planner-v25'; // Bump Version
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
      const cachedResponse = await cache.match(event.request);

      // 1. INSTANT LOAD: If we have it, give it to the user IMMEDIATELY.
      if (cachedResponse) {
        // If it's the data file, check for updates in the background
        if (isDataFile) {
          event.waitUntil(checkNetworkForUpdates(event.request, cache, cachedResponse));
        }
        return cachedResponse;
      }

      // 2. NO CACHE? (First time visit): Go to network
      try {
        return await fetch(event.request);
      } catch (error) {
        // If offline and no cache, we can't do anything.
        // But for data.js, we return nothing to prevent the "ERR_FAILED" crash
        return new Response('', { status: 408, statusText: 'Offline' });
      }
    })()
  );
});

// The Background Worker (Safety Net Added)
async function checkNetworkForUpdates(request, cache, cachedResponse) {
  try {
    // 1. Fetch fresh data (bypass browser cache)
    const networkResponse = await fetch(request, { cache: 'no-store' });
    
    // 2. If network works...
    if (networkResponse && networkResponse.status === 200) {
      const cachedText = await cachedResponse.text();
      const networkText = await networkResponse.clone().text();

      // 3. Compare: Is the new data different?
      if (cachedText !== networkText) {
        console.log("[SW] Data changed! Updating cache & refreshing...");
        
        // Update the cache
        await cache.put(request, networkResponse.clone());
        
        // Tell the App to Reload
        notifyClients();
      }
    }
  } catch (err) {
    // NETWORK FAILED (Offline)? 
    // Do nothing. The user is already seeing the cached app. 
    // This prevents the crash!
    console.log("[SW] Background check failed (likely offline). Ignoring.");
  }
}

async function notifyClients() {
  const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  clients.forEach(client => {
    client.postMessage({ type: 'FORCE_RELOAD' });
  });
}
