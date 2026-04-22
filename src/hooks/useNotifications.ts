import { useEffect, useRef } from 'react';
import { requestNotificationPermission, onForegroundMessage } from '@/lib/firebase';
import api from '@/lib/http';
import { auth } from '@/features/auth/store';

export function useNotifications() {
  const tokenRef = useRef<string | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const { user } = auth.get();
    if (!user) return;

    async function setup() {
      try {
        const token = await requestNotificationPermission();
        if (!token) return;

        tokenRef.current = token;

        // Registrar token en el backend
        await api.post('/fcm/token', {
          token,
          platform: 'web',
        });
      } catch (err) {
        console.warn('Error configurando notificaciones:', err);
      }
    }

    async function setupListener() {
      try {
        // onForegroundMessage es ahora async (lazy-load de Firebase Messaging)
        const unsub = await onForegroundMessage((payload) => {
          const { title, body } = payload.notification ?? {};
          if (!title) return;

          // Mostrar toast en la app
          window.dispatchEvent(new CustomEvent('kore-notification', {
            detail: { title, body, data: payload.data }
          }));
        });
        unsubRef.current = unsub;
      } catch (err) {
        console.warn('Error configurando listener de notificaciones:', err);
      }
    }

    setup();
    setupListener();

    // Limpiar token al cerrar sesión
    return () => {
      unsubRef.current?.();
      if (tokenRef.current) {
        api.delete('/fcm/token', { data: { token: tokenRef.current } })
          .catch(() => {});
      }
    };
  }, []);
}
