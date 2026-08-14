const CACHE_NAME = 'lifi-campaign-v3';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './favicon.ico',
  './css/style.css',
  './js/db.js',
  './js/triggers.js',
  './js/icons.js',
  './js/views.js',
  './js/app.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-192-maskable.png',
  './icons/icon-512-maskable.png',
  './icons/apple-touch-icon.png',
  './img/hero-640.webp',
  './img/hero-1024.webp',
  './img/hero-1536.webp',
  './img/zones-640.webp',
  './img/zones-1024.webp',
  './img/zones-1536.webp',
  './img/analytics-640.webp',
  './img/analytics-864.webp',
  './img/onboarding-640.webp',
  './img/onboarding-1024.webp',
  './img/onboarding-1536.webp',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Network-first for navigation requests, fallback to cache/app shell
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Cache-first for same-origin static assets, fall back to network
  const url = new URL(event.request.url);
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return res;
        }).catch(() => cached);
      })
    );
  }
});
