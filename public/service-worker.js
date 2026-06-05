self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  return self.clients.claim();
});

// FIX: Pass the network request through so Chrome sees a valid fetch handler
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      // This catches network failures (offline mode)
      // For now, it just lets the failure happen, but the handler is active!
      return null;
    })
  );
});