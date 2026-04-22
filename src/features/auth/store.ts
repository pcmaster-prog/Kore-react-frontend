// features/auth/store.ts
// ─── Re-export desde authStore para retrocompatibilidad ────────────────────
// Todos los archivos que importan { auth } o tipos de este archivo
// seguirán funcionando sin cambios.

export { auth, useAuthStore } from './authStore';
export type { Role, AuthUser, AuthState } from './authStore';
