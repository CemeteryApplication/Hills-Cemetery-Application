// Hill's Cemetery Application - service worker
// Bump CACHE_VERSION whenever you upload a new index.html so devices refresh.
const CACHE_VERSION = 'hca-v1';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Never cache database/API/storage traffic - always go to the network.
  if (url.hostname.endsWith('.supabase.co') || url.hostname.endsWith('.supabase.in')) return;
  // Network first (so updates show up), fall back to cache when offline.
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.status === 200 && (url.origin === location.origin || res.type === 'cors')) {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then(c => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then(r => r || (req.mode === 'navigate' ? caches.match('./index.html') : undefined)))
  );
});
