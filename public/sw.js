// Service Worker

const CACHE_NAME = 'recorrido-virtual-cache-v1';
// Lista de archivos a cachear. ¡IMPORTANTE! Añade aquí tus modelos 3D.
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/src/main.js',
  '/src/core/FirstPersonControls.js',
  '/src/scenes/SchoolScene.js',
  // --- AÑADE TUS ARCHIVOS DE MODELOS Y TEXTURAS AQUÍ ---
  // Ejemplo:
  // '/models/scene_4k.glb',
  // '/textures/sky.hdr',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Evento de instalación: se dispara cuando el SW se instala por primera vez.
self.addEventListener('install', event => {
  console.log('Service Worker: Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Cache abierto, añadiendo archivos principales.');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Todos los archivos han sido cacheados correctamente.');
        return self.skipWaiting();
      })
  );
});

// Evento de activación: se dispara cuando el SW se activa.
self.addEventListener('activate', event => {
  console.log('Service Worker: Activando...');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Eliminando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Evento fetch: intercepta todas las peticiones de red.
self.addEventListener('fetch', event => {
  console.log('Service Worker: Fetching', event.request.url);
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si la respuesta está en la caché, la devuelve.
        if (response) {
          console.log('Service Worker: Devolviendo desde caché:', event.request.url);
          return response;
        }
        // Si no, la busca en la red.
        console.log('Service Worker: Buscando en la red:', event.request.url);
        return fetch(event.request);
      })
  );
});
