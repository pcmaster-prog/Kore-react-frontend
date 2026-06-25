import api, { webApi, fetchCsrfCookie } from "@/lib/http";
import type { AuthUser } from "./store";

export async function login(email: string, password: string, remember = false): Promise<{ user: AuthUser }> {
  // Obtener cookie CSRF de Sanctum antes del login
  await fetchCsrfCookie();
  const res = await webApi.post("/auth/login", { email, password, remember });
  return res.data;
}

export async function logout(): Promise<void> {
  await fetchCsrfCookie();
  await webApi.post("/auth/logout");
}

export type RegisterPayload = {
  empresa_nombre: string;
  industry: string;
  employee_count_range: string;
  modules: string[];
  admin_name: string;
  admin_email: string;
  admin_password: string;
  recaptcha_token: string;
};

export type RegisterResponse = {
  message: string;
  user: AuthUser;
  empresa?: Record<string, unknown>;
};

export async function register(payload: RegisterPayload): Promise<RegisterResponse> {
  // Obtener cookie CSRF de Sanctum antes del registro
  await fetchCsrfCookie();
  const res = await webApi.post("/register", payload);
  return res.data;
}

export async function resendVerificationEmail(): Promise<{ message: string }> {
  await fetchCsrfCookie();
  const res = await webApi.post("/email/resend");
  return res.data;
}

export async function sendPasswordResetLink(email: string): Promise<{ status: string }> {
  await fetchCsrfCookie();
  const res = await webApi.post("/forgot-password", { email });
  return res.data;
}

export async function resetPassword(payload: any): Promise<{ status: string }> {
  await fetchCsrfCookie();
  const res = await webApi.post("/reset-password", payload);
  return res.data;
}

export default api;
