// src/features/auth/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Role = "admin" | "supervisor" | "empleado";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  empresa_id: string;
  modules?: string[];
};

export type AuthState = {
  token: string | null;
  user: AuthUser | null;
};

interface AuthStoreState {
  token: string | null;
  user: AuthUser | null;
  modules: string[];
  tokenExpiresAt: number | null; // timestamp in ms

  setAuth: (token: string, user: AuthUser) => void;
  setModules: (modules: string[]) => void;
  logout: () => void;
  isTokenExpired: () => boolean;
}

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      modules: [],
      tokenExpiresAt: null,

      setAuth: (token, user) =>
        set({
          token,
          user,
          tokenExpiresAt: Date.now() + TOKEN_TTL_MS,
        }),

      setModules: (modules) => {
        set({ modules });
        // Mantener evento custom para compatibilidad con AppShell
        window.dispatchEvent(new CustomEvent("kore-modules-updated"));
      },

      logout: () =>
        set({
          token: null,
          user: null,
          modules: [],
          tokenExpiresAt: null,
        }),

      isTokenExpired: () => {
        const { tokenExpiresAt } = get();
        if (!tokenExpiresAt) return true;
        return Date.now() > tokenExpiresAt;
      },
    }),
    {
      name: 'kore-auth', // key in localStorage
    }
  )
);

// ─── Legacy wrapper para retrocompatibilidad ───────────────────────────────
// Todos los archivos que importan `auth` de `./store` seguirán funcionando.
export const auth = {
  get(): AuthState {
    const { token, user, isTokenExpired } = useAuthStore.getState();
    // Si el token expiró, limpiamos
    if (token && isTokenExpired()) {
      useAuthStore.getState().logout();
      return { token: null, user: null };
    }
    return { token, user };
  },
  set(payload: { token: string; user: AuthUser }) {
    useAuthStore.getState().setAuth(payload.token, payload.user);
  },
  clear() {
    useAuthStore.getState().logout();
  },
  setModules(modules: string[]) {
    useAuthStore.getState().setModules(modules);
  },
  getModules(): string[] {
    return useAuthStore.getState().modules;
  },
};
