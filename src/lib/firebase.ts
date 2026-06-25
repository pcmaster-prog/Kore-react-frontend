import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseApp = initializeApp(firebaseConfig);

// NO importar getMessaging al inicio — se carga bajo demanda
// para evitar incluir todo el SDK de messaging en el bundle inicial.

export const VAPID_KEY =
  import.meta.env.VITE_FIREBASE_VAPID_KEY ?? ''; // NUNCA hardcodear en producción

/**
 * Lazy-load del módulo de Firebase Messaging.
 * Solo se importa cuando realmente se necesita.
 */
export async function getMessagingInstance() {
  const { getMessaging } = await import('firebase/messaging');
  return getMessaging(firebaseApp);
}

/**
 * Solicitar permiso y obtener token FCM.
 * Retorna el token o null si el usuario denegó el permiso.
 */
export async function requestNotificationPermission(): Promise<string | null> {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const { getToken } = await import('firebase/messaging');
    const messaging = await getMessagingInstance();
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    return token || null;
  } catch (_err) {
    // Error silencioso en producción
    return null;
  }
}

// Tipado mínimo para payloads de Firebase Messaging.
type FirebaseMessagePayload = {
  notification?: { title?: string; body?: string };
  data?: Record<string, string>;
};

/**
 * Escuchar notificaciones cuando la app está en primer plano.
 * Retorna función de unsuscripción.
 */
export async function onForegroundMessage(
  callback: (payload: FirebaseMessagePayload) => void
): Promise<() => void> {
  try {
    const { onMessage } = await import('firebase/messaging');
    const messaging = await getMessagingInstance();
    return onMessage(messaging, callback as (payload: unknown) => void);
  } catch (_err) {
    // Error silencioso en producción
    return () => {}; // noop unsubscribe
  }
}
