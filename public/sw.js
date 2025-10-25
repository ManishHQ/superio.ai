const CACHE_NAME = 'nextapp-v1';
const urlsToCache = [
  '/',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  // Bypass service worker for API calls
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('localhost:8000') ||
      event.request.url.includes('127.0.0.1:8000')) {
    return; // Let the browser handle these requests normally
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      }
    )
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Push event handler - receive and display notifications
self.addEventListener('push', function (event) {
  console.log('Push event received:', event);
  
  if (event.data) {
    const data = event.data.json();
    console.log('Push data:', data);
    
    const options = {
      body: data.body,
      icon: data.icon || '/icons/icon-192.svg',
      badge: data.badge || '/icons/icon-192.svg',
      vibrate: [100, 50, 100],
      data: data.data || { url: '/' },
      actions: [
        {
          action: 'open',
          title: 'Open App'
        },
        {
          action: 'close',
          title: 'Close'
        }
      ],
      requireInteraction: false,
      tag: 'pwa-notification'
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'PWA Notification', options)
    );
  }
});

// Notification click event handler
self.addEventListener('notificationclick', function (event) {
  console.log('Notification click received:', event);
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Handle notification click
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Try to focus existing window
      for (const client of clientList) {
        if (client.url === self.registration.scope && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window if no existing window found
      if (clients.openWindow) {
        const url = event.notification.data?.url || '/';
        return clients.openWindow(url);
      }
    })
  );
});