// src/features/employees/api.ts
import api from "@/lib/http";

export type UserItem = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "supervisor" | "empleado";
  is_active: boolean;
  created_at?: string;
  // Empleado vinculado
  employee_id?: string | null;
  employee_code?: string | null;
  position_title?: string | null;
  hired_at?: string | null;
  // Campos de nómina
  payment_type?: "hourly" | "daily" | null;
  hourly_rate?: number | null;
  daily_rate?: number | null;
};

export type CreateUserPayload = {
  name: string;
  email: string;
  password: string;
  role: "admin" | "supervisor" | "empleado";
  employee_code?: string;
  position_title?: string;
  hired_at?: string;
  payment_type?: "hourly" | "daily";
  hourly_rate?: number;
  daily_rate?: number;
};

export type UpdateUserPayload = Partial<Omit<CreateUserPayload, "password"> & {
  password?: string;
  is_active?: boolean;
}>;

export async function listUsers(params?: {
  search?: string;
  role?: string;
  page?: number;
}) {
  const res = await api.get("/usuarios", { params });
  return res.data as {
    data: UserItem[];
    total: number;
    current_page: number;
    last_page: number;
  };
}

export async function createUser(payload: CreateUserPayload) {
  const res = await api.post("/usuarios", payload);
  return res.data.item as UserItem;
}

export async function updateUser(id: string, payload: UpdateUserPayload) {
  const res = await api.put(`/usuarios/${id}`, payload);
  return res.data.item as UserItem;
}

export async function toggleUserStatus(id: string) {
  const res = await api.patch(`/usuarios/${id}/toggle-status`);
  return res.data.item as UserItem;
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/usuarios/${id}`);
}