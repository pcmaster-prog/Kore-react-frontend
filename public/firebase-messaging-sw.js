importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            'AIzaSyBSuXppFbXeEPsSrvHmeipEKotlc4Q7jDg',
  authDomain:        'kore-ops.firebaseapp.com',
  projectId:         'kore-ops',
  storageBucket:     'kore-ops.firebasestorage.app',
  messagingSenderId: '387072867680',
  appId:             '1:387072867680:web:a6b4d462e649fced607205',
});

const messaging = firebase.messaging();

// Manejar notificaciones en segundo plano
messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification ?? {};
  if (!title) return;

  self.registration.showNotification(title, {
    body:  body ?? '',
    icon:  '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    data:  payload.data ?? {},
    vibrate: [200, 100, 200],
  });
});

// Click en notificación → abrir la app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
