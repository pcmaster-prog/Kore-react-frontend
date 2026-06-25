import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL;

if (!baseURL) {
  throw new Error(
    "VITE_API_URL no está definida. Crea un archivo .env.local con la URL del backend."
  );
}

// URL base del backend (sin /api/v1) para CSRF cookie
const backendOrigin = baseURL.replace(/\/api\/v1\/?$/, '');

const api = axios.create({
  baseURL,
  withCredentials: true, // Necesario para cookies de sesión y CSRF
  headers: {
    "Content-Type": "application/json",
    "Accept-Language": "es",
  },
});

// Instancia para endpoints stateful de Laravel que viven en la raíz del backend
// (login, registro, logout, CSRF, verificación de correo, etc.).
export const webApi = axios.create({
  baseURL: backendOrigin,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "Accept-Language": "es",
  },
});

webApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      window.dispatchEvent(new CustomEvent("kore:unauthorized"));
    }
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

// ─── CSRF: obtener cookie antes de requests que lo requieran ────────────────
export async function fetchCsrfCookie(): Promise<void> {
  await axios.get(`${backendOrigin}/sanctum/csrf-cookie`, {
    withCredentials: true,
  });
}

// ─── Response interceptor: manejar 401 + toast global para 500+ ───────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    if (status === 401) {
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

// ─── Configuración de horarios ───────────────────────────────────────────────
export interface SchedulePayload {
  entry_time?: string;
  exit_time?: string;
  week_start_day?: number;
  tolerance_minutes?: number;
  max_hours?: number;
  auto_close_shift?: boolean;
  week_schedule?: Array<{
    weekday: number;
    check_in_time: string;
    check_out_time: string;
    is_working_day: boolean;
  }>;
}

export async function saveSchedule(payload: SchedulePayload) {
  return api.put("/settings/schedule", payload);
}

export default api;
