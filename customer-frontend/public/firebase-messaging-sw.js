// PrettyGlitz Customer Storefront - Firebase Cloud Messaging (FCM) Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Listen for push notifications delivered via Firebase Cloud Messaging
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    let payload;
    try {
      payload = event.data.json();
    } catch (e) {
      payload = {
        notification: {
          title: '✨ PrettyGlitz Update',
          body: event.data.text(),
        },
      };
    }

    const title = payload.notification?.title || payload.title || '✨ PrettyGlitz Update';
    const body = payload.notification?.body || payload.body || 'You have a new update from PrettyGlitz.';
    const clickUrl = payload.data?.url || payload.url || '/';
    const imageUrl = payload.notification?.imageUrl || payload.notification?.image || payload.data?.imageUrl || undefined;

    const options = {
      body,
      icon: '/pretty-glitz-logo.png',
      badge: '/pretty-glitz-logo.png',
      vibrate: [200, 100, 200],
      data: { url: clickUrl },
      tag: payload.data?.orderId ? `order-${payload.data.orderId}` : 'prettyglitz-store',
      renotify: true,
      ...(imageUrl ? { image: imageUrl } : {}),
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.warn('[FCM-SW] Error presenting customer push notification:', err);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url && 'focus' in client) {
          client.focus();
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return;
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
