// sw.js

// Nombre y versión del caché. Cambia la versión si haces cambios importantes
// para forzar la actualización del caché en los navegadores de los usuarios.
const CACHE_NAME = 'recorrido-virtual-v3';

// Archivos estáticos fundamentales para el arranque de la app.
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Evento 'install': Se dispara cuando el navegador instala el SW.
self.addEventListener('install', event => {
  console.log('[Service Worker] Instalando...');
  // Espera a que el precaching de los assets principales se complete.
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Guardando assets principales en caché.');
        return cache.addAll(CORE_ASSETS);
      })
      .catch(error => {
        console.error('[Service Worker] Falló el precaching:', error);
      })
  );
  // Forza al nuevo SW a activarse inmediatamente.
  self.skipWaiting();
});

// Evento 'activate': Se dispara cuando el SW se activa.
// Es el momento ideal para limpiar cachés antiguos.
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activado.');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          // Si el nombre del caché no es el actual, se elimina.
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Limpiando caché antiguo:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  // Asegura que el SW tome control de la página inmediatamente.
  return self.clients.claim();
});

// Evento 'fetch': Se dispara cada vez que la página realiza una petición de red.
self.addEventListener('fetch', event => {
  const request = event.request;

  // Estrategia para las peticiones de navegación (documentos HTML).
  if (request.mode === 'navigate') {
    // Network first: Intenta ir a la red primero.
    event.respondWith(
      fetch(request)
        .then(response => {
          // Si la respuesta es válida, la clona, la guarda en caché y la devuelve.
          if (response.ok) {
            const cacheResponse = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, cacheResponse);
            });
          }
          return response;
        })
        .catch(() => {
          // Si la red falla, busca en el caché.
          return caches.match(request);
        })
    );
    return;
  }

  // Estrategia para otros recursos (CSS, JS, imágenes, modelos 3D).
  // Cache first: Busca en el caché primero.
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        // Si está en caché, lo devuelve.
        if (cachedResponse) {
          return cachedResponse;
        }
        // Si no está, va a la red.
        return fetch(request)
          .then(networkResponse => {
            // Clona la respuesta, la guarda en caché y la devuelve.
            const cacheResponse = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, cacheResponse);
            });
            return networkResponse;
          });
      })
  );
});
