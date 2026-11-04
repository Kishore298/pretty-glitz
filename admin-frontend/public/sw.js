// PrettyGlitz Admin Service Worker - Push Notifications & Focus Handling

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch (e) {
    payload = {
      title: 'PrettyGlitz Alert',
      body: event.data.text(),
      data: { url: '/orders' },
    };
  }

  const title = payload.title || '🛍️ New Order Request';
  const options = {
    body: payload.body || 'A new order has been requested.',
    icon: payload.icon || '/pretty-glitz-logo.png',
    badge: '/pretty-glitz-logo.png',
    vibrate: [200, 100, 200],
    data: payload.data || { url: '/orders' },
    tag: (payload.data && payload.data.orderId) || 'prettyglitz-order',
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url)
    ? event.notification.data.url
    : '/orders';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a window is already open, focus it and navigate
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
      // If no window is open, open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

