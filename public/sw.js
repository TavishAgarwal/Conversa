// Conversa Service Worker — Cache-first for app shell, network-first for model files
const CACHE_VERSION = 'conversa-v1';
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`;

// App shell resources to pre-cache on install
const APP_SHELL_URLS = [
  '/',
  '/favicon.ico',
];

// Install: pre-cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => {
      return cache.addAll(APP_SHELL_URLS);
    })
  );
  // Activate immediately
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== APP_SHELL_CACHE)
          .map((key) => caches.delete(key))
      );
    })
  );
  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch: cache-first for static assets, network-first for everything else
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip cross-origin requests (model downloads from HuggingFace etc.)
  if (url.origin !== self.location.origin) return;

  // For WASM and static assets — cache-first (they don't change)
  if (
    url.pathname.startsWith('/assets/') ||
    url.pathname.endsWith('.wasm') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.woff2')
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(APP_SHELL_CACHE).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // For navigation/HTML — network-first with cache fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(APP_SHELL_CACHE).then((cache) => {
            cache.put(event.request, clone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then((cached) => {
            return cached || caches.match('/');
          });
        })
    );
    return;
  }
});
