const CACHE_NAME = 'boki-rpg-v4';
const APP_SHELL = [
  './', './index.html', './manifest.webmanifest', './icons/app-icon.svg', './css/style.css',
  './data/questions.js', './js/calculator.js', './js/model.js', './js/rpg.js', './js/engine.js',
  './js/view.js', './js/controller.js', './js/app.js'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request, { ignoreSearch: true }).then(cached => cached || fetch(event.request).then(response => {
    if (!response.ok || response.type === 'opaque') return response;
    const copy = response.clone(); caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)); return response;
  }).catch(() => event.request.mode === 'navigate' ? caches.match('./index.html') : undefined)));
});
