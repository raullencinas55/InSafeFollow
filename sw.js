/**
 * sw.js - Service Worker de InSafeFollow
 * Proporciona soporte Offline-First (Modo Avión) y capacidades PWA completas.
 * Implementa estrategia Network-First para recibir actualizaciones en tiempo real,
 * con fallback instantáneo a Caché cuando se utiliza sin conexión o en modo avión.
 */

const CACHE_NAME = 'insafefollow-v1.3.2';
const STATIC_ASSETS = [
  './',
  './index.html',
  './app.html',
  './manifest.webmanifest',
  './css/main.css?v=1.3.2',
  './css/landing.css?v=1.3.2',
  './css/app.css?v=1.3.2',
  './js/vendor/fflate.js',
  './js/parser.js?v=1.3.2',
  './js/storage.js?v=1.3.2',
  './js/chart.js?v=1.3.2',
  './js/gestures.js?v=1.3.2',
  './js/landing.js?v=1.3.2',
  './js/app.js?v=1.3.2'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[ServiceWorker] Advertencia al precachear recursos:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Estrategia Network First: busca la versión más reciente en la red
  // para evitar problemas de caché obsoleto tras nuevos despliegues.
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // En ausencia de red (offline), responde con el caché local
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
