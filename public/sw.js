// Service Worker mínimo para habilitar la instalación PWA
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  // Necesario para que Chrome considere la App instalable
  event.respondWith(fetch(event.request));
});
