const CACHE_NAME = 'seven-chat-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/pages/login.html',
  '/pages/register.html',
  '/pages/chat.html',
  '/pages/profile.html',
  '/pages/settings.html',
  '/css/main.css',
  '/css/auth.css',
  '/css/chat.css',
  '/css/profile.css',
  '/css/settings.css',
  '/js/firebase-config.js',
  '/js/utils.js',
  '/js/auth.js',
  '/js/login.js',
  '/js/register.js',
  '/js/chat.js',
  '/js/profile.js',
  '/js/search.js',
  '/js/notification.js',
  '/js/github-storage.js',
  '/js/pwa.js',
  '/js/app.js',
  '/js/settings.js',
  '/assets/images/default-avatar.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/webfonts/fa-solid-900.woff2',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-database-compat.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics-compat.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== 'GET') return;

  if (url.hostname === 'raw.githubusercontent.com' ||
      url.hostname === 'firebaseio.com' ||
      url.hostname === 'googleapis.com') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then((response) => {
            if (response && response.status === 200 && response.type === 'basic') {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone);
              });
            }
            return response;
          })
          .catch(() => {
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
            return new Response('Offline', { status: 503 });
          });
      })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.notification?.body || 'New message',
      icon: '/assets/icons/icon-192.png',
      badge: '/assets/icons/icon-96.png',
      vibrate: [200, 100, 200],
      data: {
        chatId: data.data?.chatId || '',
        senderId: data.data?.senderId || '',
        url: '/index.html'
      },
      actions: [
        { action: 'open', title: 'Open Chat' }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(
        data.notification?.title || 'SEVEN',
        options
      )
    );
  } catch (e) {}
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    const urlToOpen = event.notification.data?.url || '/index.html';

    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          for (const client of clientList) {
            if (client.url.includes('/') && 'focus' in client) {
              client.postMessage({
                type: 'OPEN_CHAT',
                chatId: event.notification.data?.chatId || ''
              });
              return client.focus();
            }
          }
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  }
});
