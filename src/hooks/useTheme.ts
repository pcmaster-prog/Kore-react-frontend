import { useState, useEffect, useCallback } from 'react';

export type ThemeName = 'beige' | 'azul' | 'morado' | 'rosa' | 'oscuro' | 'black';

interface ThemeConfig {
  id: ThemeName;
  label: string;
  preview: string; // color del dot
  description: string;
}

export const THEMES: ThemeConfig[] = [
  { id: 'beige', label: 'Beige Clásico', preview: '#4f46e5', description: 'El look original de Kore' },
  { id: 'azul', label: 'Azul Pro', preview: '#2563eb', description: 'Profesional y corporativo' },
  { id: 'morado', label: 'Morado Elegante', preview: '#7c3aed', description: 'Sofisticado y diferenciador' },
  { id: 'rosa', label: 'Rosa Suave', preview: '#db2777', description: 'Moderno y amigable' },
  { id: 'oscuro', label: 'Oscuro Espacial', preview: '#0ea5e9', description: 'Para turnos nocturnos' },
  { id: 'black', label: 'Black', preview: '#e5e5e5', description: 'Minimalista y audaz' },
];

const STORAGE_KEY = 'kore-theme';
const DEFAULT_THEME: ThemeName = 'beige';

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    // 1. Intentar leer de localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY) as ThemeName;
      if (saved && THEMES.find(t => t.id === saved)) return saved;
    }
    return DEFAULT_THEME;
  });

  const applyTheme = useCallback((newTheme: ThemeName) => {
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
    setThemeState(newTheme);
  }, []);

  // Aplicar tema al montar
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  // Sincronizar con backend (opcional, se llama cuando el usuario guarda preferencias)
  const syncWithBackend = useCallback(async (userId: string) => {
    try {
      await fetch(`/api/users/${userId}/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme }),
      });
    } catch (e) {
      console.warn('No se pudo sincronizar tema con backend:', e);
    }
  }, [theme]);

  return { theme, setTheme: applyTheme, syncWithBackend, themes: THEMES };
}
