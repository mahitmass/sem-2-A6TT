const CACHE_NAME = 'a6-planner-v26'; // Bump Version to 26
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
      
      // 1. Get Clean URL (Strip timestamps for cache matching)
      const cleanUrl = new URL(event.request.url); // <--- FIXED: Was 'request.url'
      cleanUrl.search = ''; 
      const cleanRequest = new Request(cleanUrl);

      // 2. Try Cache First (INSTANT LOAD)
      const cachedResponse = await cache.match(cleanRequest);

      if (cachedResponse) {
        // If we have cache, return it immediately!
        // But kick off a background update if it's the data file
        if (isDataFile) {
          event.waitUntil(
            updateInBackground(event.request, cache, cleanRequest, cachedResponse)
          );
        }
        return cachedResponse;
      }

      // 3. No Cache? (First Visit) -> Fetch from Network
      return fetch(event.request);
    })()
  );
});

async function updateInBackground(request, cache, cleanRequest, cachedResponse) {
  try {
    // Check network for fresh data (Bypass browser cache)
    const networkResponse = await fetch(request, { cache: 'no-store' });
    
    if (networkResponse && networkResponse.status === 200) {
      const cachedText = await cachedResponse.text();
      const networkText = await networkResponse.clone().text();

      // Compare: Has data changed?
      if (cachedText !== networkText) {
        console.log("[SW] Data changed! Updating cache & reloading...");
        
        // Update Cache
        await cache.put(cleanRequest, networkResponse.clone());
        
        // Shout to the App: "RELOAD NOW!"
        notifyClients();
      }
    }
  } catch (err) {
    // Offline? Ignore it. User stays on cached version.
  }
}

async function notifyClients() {
  const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  clients.forEach(client => {
    client.postMessage({ type: 'FORCE_RELOAD' });
  });
}
