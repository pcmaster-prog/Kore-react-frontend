import api, { fetchCsrfCookie } from "@/lib/http";
import type { AuthUser } from "./store";

export async function login(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
  // Obtener cookie CSRF de Sanctum antes del login
  await fetchCsrfCookie();
  const res = await api.post("/auth/login", { email, password });
  return res.data;
}

export type RegisterPayload = {
  empresa_nombre: string;
  industry: string;
  employee_range: string;
  modules: string[];
  admin_name: string;
  admin_email: string;
  admin_password: string;
};

export async function register(payload: RegisterPayload): Promise<{ token: string; user: AuthUser }> {
  // Obtener cookie CSRF de Sanctum antes del registro
  await fetchCsrfCookie();
  const res = await api.post("/register", payload);
  return res.data;
}
