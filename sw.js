/**
 * sw.js - Service Worker de InSafeFollow
 * Proporciona soporte Offline-First (Modo Avión) y capacidades PWA completas.
 */

const CACHE_NAME = 'insafefollow-v1.3.0';
const STATIC_ASSETS = [
  './',
  './index.html',
  './app.html',
  './manifest.webmanifest',
  './css/main.css?v=1.2.0',
  './css/landing.css?v=1.2.0',
  './css/app.css?v=1.2.0',
  './js/vendor/fflate.js',
  './js/parser.js?v=1.3.0',
  './js/storage.js?v=1.3.0',
  './js/chart.js?v=1.3.0',
  './js/gestures.js?v=1.3.0',
  './js/landing.js?v=1.2.0',
  './js/app.js?v=1.3.0'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        // En caso de fallo en algún recurso individual, continuar instalación
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
  // Estrategia Cache First con fallback a Red
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        // Si no hay red y se pide una página HTML, servir index.html desde caché
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
