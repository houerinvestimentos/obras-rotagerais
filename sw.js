const CACHE_NAME = 'rota-gerais-v3'; // Versão incrementada para novos recursos
const STATIC_ASSETS = [
  './',
  './index.html',
  './Obras_Validadas.json',
  './manifest.json',
  './investimentos.svg',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

const MAP_TILE_CACHE = 'map-tiles-cache-v1';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME && key !== MAP_TILE_CACHE)
        .map(key => caches.delete(key))
    ))
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Estratégia para Tiles do Mapa (Satélite Esri)
  if (url.hostname.includes('arcgisonline.com')) {
    event.respondWith(
      caches.open(MAP_TILE_CACHE).then(cache => {
        return cache.match(event.request).then(response => {
          if (response) return response; // Retorna do cache se existir
          return fetch(event.request).then(networkResponse => {
            cache.put(event.request, networkResponse.clone()); // Salva no cache para a próxima vez
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // Estratégia Cache-First para Ativos Estáticos
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).then(networkResponse => {
        // Opcional: Cachear dinamicamente outros arquivos do próprio domínio
        if (url.origin === location.origin) {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        }
        return networkResponse;
      });
    })
  );
});