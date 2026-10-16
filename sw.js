/**
 * Rasoee Fresh Supermarket - Service Worker (v5)
 * Network-first for HTML pages and real-time bypass for Firebase and images,
 * ensuring catalog updates, live images, and multi-device order sync occur instantaneously.
 */
const CACHE_NAME = 'rasoee-fresh-v5';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './admin.html',
  './operator.html',
  './track.html',
  './login.html',
  './outlet.html',
  './app.js',
  './store-config.js',
  './products.js',
  './manifest.json',
  './logo.svg',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Never cache non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Live Cloud RTDB, image CDNs, SMS gateways, and cache-busted requests: ALWAYS fetch live network
  if (
    url.includes('firebasedatabase.app') ||
    url.includes('firebaseio.com') ||
    url.includes('googleusercontent.com') ||
    url.includes('drive.google.com') ||
    url.includes('api.qrserver.com') ||
    url.includes('unsplash.com') ||
    url.includes('_t=') ||
    url.includes('fast2sms.com') ||
    url.includes('2factor.in')
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Navigation requests (HTML pages): Network-first with cache fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request) || caches.match('./index.html'))
    );
    return;
  }

  // Static Local Assets: Stale-while-revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse.clone()));
          }
          return networkResponse;
        })
        .catch(() => {});
      return cachedResponse || fetchPromise;
    })
  );
});
