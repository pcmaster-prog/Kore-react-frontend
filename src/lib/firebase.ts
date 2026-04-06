import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         'kore-ops',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: '387072867680',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseApp = initializeApp(firebaseConfig);
export const messaging = getMessaging(firebaseApp);

export const VAPID_KEY =
  'BHaKLf7ppoyI5o98NwBO506hcSkX9Sg1HAvEhP5G18oBdTpm6AXT9iTd9JwsGPc3OvWOj71OfxR4EScAfLoNBEc';

/**
 * Solicitar permiso y obtener token FCM
 * Retorna el token o null si el usuario denegó el permiso
 */
export async function requestNotificationPermission(): Promise<string | null> {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    return token || null;
  } catch (err) {
    console.warn('Error obteniendo token FCM:', err);
    return null;
  }
}

/**
 * Escuchar notificaciones cuando la app está en primer plano
 */
export function onForegroundMessage(callback: (payload: any) => void) {
  return onMessage(messaging, callback);
}
