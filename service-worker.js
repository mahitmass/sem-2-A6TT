const CACHE_NAME = 'a6-planner-v27'; // Bump Version to 27
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
      
      // 1. Get Clean URL (Strip all params so we store it cleanly)
      // Example: "data.js?t=123" becomes "data.js"
      const cleanUrl = new URL(event.request.url);
      cleanUrl.search = ''; 
      const cleanRequest = new Request(cleanUrl);

      // 2. Try Cache First (INSTANT LOAD)
      const cachedResponse = await cache.match(cleanRequest);

      if (cachedResponse) {
        // Return cache immediately!
        // But if it's data.js, check for updates in the background
        if (isDataFile) {
          event.waitUntil(
            updateInBackground(event.request, cache, cleanRequest, cachedResponse)
          );
        }
        return cachedResponse;
      }

      // 3. No Cache? Fetch from Network
      return fetch(event.request);
    })()
  );
});

async function updateInBackground(originalRequest, cache, cleanRequest, cachedResponse) {
  try {
    // 1. CREATE A UNIQUE NETWORK REQUEST
    // We append ?sw_bust=timestamp to FORCE the server to give us a fresh file.
    // This bypasses Vercel/CDN caching.
    const networkUrl = new URL(originalRequest.url);
    networkUrl.searchParams.set('sw_bust', Date.now());
    
    const networkRequest = new Request(networkUrl);

    // 2. Fetch fresh data
    const networkResponse = await fetch(networkRequest, { cache: 'no-store' });
    
    if (networkResponse && networkResponse.status === 200) {
      const cachedText = await cachedResponse.text();
      const networkText = await networkResponse.clone().text();

      // 3. Compare
      if (cachedText !== networkText) {
        console.log("[SW] New data detected! Updating cache...");
        
        // Update Cache (using the CLEAN request, so next load gets this version)
        await cache.put(cleanRequest, networkResponse.clone());
        
        // Trigger Reload
        notifyClients();
      }
    }
  } catch (err) {
    // Offline? Ignore.
  }
}

async function notifyClients() {
  const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  clients.forEach(client => {
    client.postMessage({ type: 'FORCE_RELOAD' });
  });
}
