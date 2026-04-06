import { useEffect, useRef } from 'react';
import { requestNotificationPermission, onForegroundMessage } from '@/lib/firebase';
import api from '@/lib/http';
import { auth } from '@/features/auth/store';

export function useNotifications() {
  const tokenRef = useRef<string | null>(null);

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

    setup();

    // Escuchar notificaciones en primer plano (app abierta)
    const unsub = onForegroundMessage((payload) => {
      const { title, body } = payload.notification ?? {};
      if (!title) return;

      // Mostrar toast en la app
      window.dispatchEvent(new CustomEvent('kore-notification', {
        detail: { title, body, data: payload.data }
      }));
    });

    // Limpiar token al cerrar sesión
    return () => {
      unsub();
      if (tokenRef.current) {
        api.delete('/fcm/token', { data: { token: tokenRef.current } })
          .catch(() => {});
      }
    };
  }, []);
}
