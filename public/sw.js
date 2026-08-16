const CACHE_NAME = 'nutrimemi-v3'; // Bump manual en cada deploy relevante
const STATIC_ASSETS = [
  '/logopwa.jpg',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim().then(() => {
    // Notificar a los clientes para recargar la página si el SW cambió
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      clients.forEach((client) => {
        client.postMessage({ type: 'SW_UPDATED' });
      });
    });
  });
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  
  // 1. Recursos estáticos e imágenes: CACHE-FIRST
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request).then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // 2. JS, CSS, y Navegación (HTML): NETWORK-FIRST
  // Intentamos red primero; si falla (offline), caemos en caché.
  if (
    event.request.mode === 'navigate' || 
    url.pathname.startsWith('/_next/') || 
    event.request.destination === 'script' || 
    event.request.destination === 'style' ||
    event.request.destination === 'document'
  ) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // 3. Fallback general: Network-first
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// === PUSH NOTIFICATIONS ===
self.addEventListener('push', (event) => {
  let data = { title: 'Nutrimemi', body: 'Tienes una notificación nueva', url: '/' };
  try { data = JSON.parse(event.data.text()); } catch {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/logopwa.jpg',
      badge: '/logopwa.jpg',
      data: { url: data.url },
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(event.notification.data?.url || '/');
    })
  );
});
