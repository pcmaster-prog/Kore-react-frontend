import api from "@/lib/http";
import type { AuthUser } from "./store";

export async function login(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
  const res = await api.post("/auth/login", { email, password });
  return res.data;
}

export type RegisterPayload = {
  empresa_name: string;
  industry: string;
  employee_range: string;
  modules: string[];
  admin_name: string;
  admin_email: string;
  admin_password: string;
};

export async function register(payload: RegisterPayload): Promise<{ token: string; user: AuthUser }> {
  const res = await api.post("/auth/register", payload);
  return res.data;
}
