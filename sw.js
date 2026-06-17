const CACHE = 'kalkulaku-v4';
const ASSETS = ['/', '/index.html', '/manifest.json'];

// skipWaiting AFTER cache is fully populated
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// clients.claim AFTER old caches are deleted
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network First with 3s timeout → falls back to cache instantly when offline
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    Promise.race([
      fetch(e.request.clone()).then(res => {
        if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        return res;
      }),
      new Promise((_, rej) => setTimeout(() => rej('timeout'), 3000))
    ]).catch(() =>
      caches.match(e.request).then(r => r || caches.match('/index.html'))
    )
  );
});
