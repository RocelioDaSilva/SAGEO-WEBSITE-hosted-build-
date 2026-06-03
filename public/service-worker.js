self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Listener for authentic server-side push notifications
self.addEventListener('push', (event) => {
  let data = { title: 'Notificação SAGEO 2026', body: 'Alerta de Evento!' };
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/sageo_icon.png',
    badge: '/sageo_icon.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// PostMessage fallback channel to trigger direct, real-time native alerts
// from the client thread onto the cell phone's native alert engine!
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'TRIGGER_NOTIFICATION') {
    const { title, body, tag } = event.data;
    const options = {
      body: body,
      icon: '/sageo_icon.png',
      badge: '/sageo_icon.png',
      tag: tag || 'sageo-reminders',
      renotify: true,
      vibrate: [150, 100, 150],
      data: {
        url: '/'
      }
    };
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  }
});

// Route active click to bring the PWA back to focus
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
            break;
          }
        }
        return client.focus();
      }
      return self.clients.openWindow('/');
    })
  );
});
