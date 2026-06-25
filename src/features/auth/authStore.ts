// src/features/auth/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Role = "admin" | "supervisor" | "empleado" | "empleado_prueba";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  empresa_id: string;
  modules?: string[];
  /** Sección asignada al supervisor (ej. Carnicería). Solo aplica para role='supervisor' */
  section?: string | null;
};

export type AuthState = {
  user: AuthUser | null;
};

interface AuthStoreState {
  user: AuthUser | null;
  modules: string[];

  setUser: (user: AuthUser | null) => void;
  setModules: (modules: string[]) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set) => ({
      user: null,
      modules: [],

      setUser: (user) =>
        set({
          user,
        }),

      setModules: (modules) => {
        set({ modules });
        // Mantener evento custom para compatibilidad con AppShell
        window.dispatchEvent(new CustomEvent("kore-modules-updated"));
      },

      logout: () =>
        set({
          user: null,
          modules: [],
        }),
    }),
    {
      name: 'kore-auth',
      storage: {
        getItem: (name) => {
          const str = sessionStorage.getItem(name);
          return str ? JSON.parse(str) : null;
        },
        setItem: (name, value) => {
          sessionStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          sessionStorage.removeItem(name);
        },
      },
    }
  )
);

// ─── Legacy wrapper para retrocompatibilidad ───────────────────────────────
// Todos los archivos que importan `auth` de `./store` seguirán funcionando.
// El token ya no se almacena en el cliente; la sesión vive en una cookie HttpOnly.
export const auth = {
  get(): AuthState {
    const { user } = useAuthStore.getState();
    return { user };
  },
  set(payload: { user: AuthUser }) {
    useAuthStore.getState().setUser(payload.user);
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
