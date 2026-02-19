const CACHE_NAME = 'rota-gerais-v4'; // Versão v4: Foco em Offline
const STATIC_ASSETS = [
  './',
  './index.html',
  './Obras_Validadas.json',
  './manifest.json',
  './investimentos.svg',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

const MAP_TILE_CACHE = 'map-tiles-persist-v1';

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

  // ESTRATÉGIA: Cache-First Agressiva para Tiles (Satélite Esri)
  if (url.hostname.includes('arcgisonline.com')) {
    event.respondWith(
      caches.open(MAP_TILE_CACHE).then(cache => {
        return cache.match(event.request).then(response => {
          // Se está no cache, retorna imediatamente (Zero Latency)
          if (response) return response;

          // Se não está, busca na rede e salva para sempre
          return fetch(event.request).then(networkResponse => {
            if (networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            // Silenciosamente falha se estiver totalmente offline e sem cache
          });
        });
      })
    );
    return;
  }

  // ESTRATÉGIA: Cache-First para Ativos Locais
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).then(networkResponse => {
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