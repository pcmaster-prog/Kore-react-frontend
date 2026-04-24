import axios from "axios";
import { useAuthStore } from "@/features/auth/authStore";

const baseURL =
  import.meta.env.VITE_API_URL ??
  'https://kore-laravel-backend-production.up.railway.app/api/v1';

// URL base del backend (sin /api/v1) para CSRF cookie
const backendOrigin = baseURL.replace(/\/api\/v1\/?$/, '');

const api = axios.create({
  baseURL,
  withCredentials: true, // Necesario para cookies CSRF de Sanctum
  headers: {
    "Content-Type": "application/json",
    "Accept-Language": "es",
  },
});

// ─── CSRF: obtener cookie antes de requests que lo requieran ────────────────
export async function fetchCsrfCookie(): Promise<void> {
  await axios.get(`${backendOrigin}/sanctum/csrf-cookie`, {
    withCredentials: true,
  });
}

// ─── Request interceptor: adjuntar token + verificar expiración ────────────
api.interceptors.request.use((config) => {
  const { token, isTokenExpired, logout } = useAuthStore.getState();

  if (token) {
    // Si el token expiró, limpiar y redirigir
    if (isTokenExpired()) {
      logout();
      window.dispatchEvent(new CustomEvent("kore:unauthorized"));
      return Promise.reject(new axios.Cancel("Token expirado"));
    }
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ─── Response interceptor: manejar 401 + toast global para 500+ ───────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    if (status === 401) {
      useAuthStore.getState().logout();
      window.dispatchEvent(new CustomEvent("kore:unauthorized"));
    }

    // Toast global para errores del servidor (500+)
    if (status && status >= 500) {
      const serverMsg =
        error?.response?.data?.message ?? "Error del servidor. Intenta más tarde.";
      window.dispatchEvent(
        new CustomEvent("kore-error", {
          detail: { message: serverMsg, status },
        })
      );
    }

    return Promise.reject(error);
  }
);

export default api;
