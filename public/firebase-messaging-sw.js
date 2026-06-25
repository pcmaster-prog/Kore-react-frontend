importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            'AIzaSyAE4Z0mZIcQYWL7CkXsq9M5YWXE6S6M1Rc',
  authDomain:        'gen-lang-client-0235122332.firebaseapp.com',
  projectId:         'gen-lang-client-0235122332',
  storageBucket:     'gen-lang-client-0235122332.firebasestorage.app',
  messagingSenderId: '402133484686',
  appId:             '1:402133484686:web:7840f50d960c7cc44675df',
});

const messaging = firebase.messaging();

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

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
