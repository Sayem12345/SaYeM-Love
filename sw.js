const CACHE_NAME = 'seven-chat-v1';
const ASSETS_TO_CACHE = [
  '/chat-app/',
  '/chat-app/index.html',
  '/chat-app/offline.html',
  '/chat-app/manifest.json',
  '/chat-app/pages/login.html',
  '/chat-app/pages/register.html',
  '/chat-app/pages/chat.html',
  '/chat-app/pages/profile.html',
  '/chat-app/pages/settings.html',
  '/chat-app/css/main.css',
  '/chat-app/css/auth.css',
  '/chat-app/css/chat.css',
  '/chat-app/css/profile.css',
  '/chat-app/css/settings.css',
  '/chat-app/js/firebase-config.js',
  '/chat-app/js/utils.js',
  '/chat-app/js/auth.js',
  '/chat-app/js/login.js',
  '/chat-app/js/register.js',
  '/chat-app/js/chat.js',
  '/chat-app/js/profile.js',
  '/chat-app/js/search.js',
  '/chat-app/js/notification.js',
  '/chat-app/js/github-storage.js',
  '/chat-app/js/pwa.js',
  '/chat-app/js/app.js',
  '/chat-app/js/settings.js',
  '/chat-app/assets/images/default-avatar.png',
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
              return caches.match('/chat-app/offline.html');
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
      icon: '/chat-app/assets/icons/icon-192.png',
      badge: '/chat-app/assets/icons/icon-96.png',
      vibrate: [200, 100, 200],
      data: {
        chatId: data.data?.chatId || '',
        senderId: data.data?.senderId || '',
        url: '/chat-app/index.html'
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
    const urlToOpen = event.notification.data?.url || '/chat-app/index.html';

    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          for (const client of clientList) {
            if (client.url.includes('/chat-app/') && 'focus' in client) {
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
