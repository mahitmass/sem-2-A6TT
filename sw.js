const CACHE_NAME = 'a6-planner-v17'; // Version bump
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './Logo.png',
  './js/app.js',
  './js/data.js',
  './js/utils.js',
  './css/styles.css',
  
  // Font files (if you added them later, otherwise ignore)
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

// 3. FETCH (The "No-Store" Fix)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(event.request);

      // --- THE FIX IS HERE ---
      // We add { cache: 'no-store' } to force the browser to go to the internet
      const networkFetch = fetch(event.request.url, { cache: 'no-store' }).then(async (networkResponse) => {
        
        if (networkResponse && networkResponse.status === 200) {
          
          let shouldNotify = true;
          
          if (cachedResponse) {
            const cachedText = await cachedResponse.clone().text();
            const networkText = await networkResponse.clone().text();
            
            // Compare content
            if (cachedText === networkText) {
              shouldNotify = false;
            }
          }

          cache.put(event.request, networkResponse.clone());

          if (shouldNotify) {
             notifyClients(event.request.url);
          }
        }
        return networkResponse;
      }).catch(() => { 
        // If offline, 'no-store' fails, so we just fall back to cache. Perfect.
      });

      return cachedResponse || networkFetch;
    })
  );
});

async function notifyClients(url) {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ type: 'UPDATE_AVAILABLE', url: url });
  });
}
