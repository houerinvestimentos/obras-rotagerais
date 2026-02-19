const CACHE_NAME = 'rota-gerais-v2'; // Incrementada versão para forçar atualização
const assets = [
  './',
  './index.html',
  './Obras_Validadas.json',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(assets))
    .then(() => self.skipWaiting()) // Força a ativação imediata
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
});

// Cache-First Strategy para recursos críticos: Crucial para performance offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).then(networkResponse => {
        // Opcional: Adicionar novos recursos ao cache dinamicamente se necessário
        return networkResponse;
      });
    })
  );
});