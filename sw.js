/* sw.js – Life RPG offline shell + runtime cache */
const APP_VERSION = 'lifergp-v1.0.0';
const APP_CACHE   = APP_VERSION;
const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Install: Cache Basisdateien
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(APP_CACHE).then(c => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate: Alte Caches aufräumen
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k.startsWith('lifergp-') && k !== APP_CACHE)
                      .map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: App-Shell-Fallback für Navigation + SWR für Assets
self.addEventListener('fetch', event => {
  const req = event.request;

  // App Shell fürs Navigieren
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Stale-While-Revalidate für alles andere
  event.respondWith(
    caches.match(req).then(hit => {
      const fetchPromise = fetch(req).then(netRes => {
        const copy = netRes.clone();
        caches.open(APP_CACHE).then(cache => cache.put(req, copy));
        return netRes;
      }).catch(() => hit || Promise.reject('offline'));
      return hit || fetchPromise;
    })
  );
});
