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
  rfc?: string | null;
  nss?: string | null;
  curp?: string | null;
  expediente_url?: string | null;
  check_in_time?: string | null;
  // Campos de nómina
  payment_type?: "hourly" | "daily" | null;
  hourly_rate?: number | null;
  daily_rate?: number | null;
};

function normalizeUser(user: any): UserItem {
  if (!user || typeof user !== "object") return user;
  const emp = user.empleado ?? {};
  return {
    ...user,
    employee_id: emp.id ?? user.employee_id ?? null,
    employee_code: emp.employee_code ?? user.employee_code ?? null,
    position_title: emp.position_title ?? user.position_title ?? null,
    hired_at: emp.hired_at ?? user.hired_at ?? null,
    rfc: emp.rfc ?? user.rfc ?? null,
    nss: emp.nss ?? user.nss ?? null,
    curp: emp.curp ?? user.curp ?? null,
    check_in_time: emp.check_in_time ?? user.check_in_time ?? null,
    payment_type: emp.payment_type ?? user.payment_type ?? null,
    hourly_rate: emp.hourly_rate ?? user.hourly_rate ?? null,
    daily_rate: emp.daily_rate ?? user.daily_rate ?? null,
  };
}

export type CreateUserPayload = {
  name: string;
  email: string;
  password: string;
  role: "admin" | "supervisor" | "empleado";
  employee_code?: string;
  position_title?: string;
  hired_at?: string;
  rfc?: string;
  nss?: string;
  curp?: string;
  expediente?: File | null;
  payment_type?: "hourly" | "daily";
  hourly_rate?: number;
  daily_rate?: number;
  check_in_time?: string;
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
  const raw = res.data as {
    data: any[];
    total: number;
    current_page: number;
    last_page: number;
  };
  return {
    ...raw,
    data: raw.data.map(normalizeUser),
  };
}

export async function createUser(payload: CreateUserPayload) {
  const formData = new FormData();
  Object.entries(payload).forEach(([k, v]) => {
    if (v !== undefined && v !== null) {
      formData.append(k, v instanceof File ? v : String(v));
    }
  });

  const res = await api.post("/usuarios", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return normalizeUser(res.data);
}

export async function updateUser(id: string, payload: UpdateUserPayload) {
  const formData = new FormData();
  formData.append("_method", "PUT"); // Laravel way to spoof PUT with POST and files
  Object.entries(payload).forEach(([k, v]) => {
    if (v !== undefined && v !== null) {
      formData.append(k, v instanceof File ? v : String(v));
    }
  });

  const res = await api.post(`/usuarios/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return normalizeUser(res.data);
}

export async function toggleUserStatus(id: string) {
  const res = await api.patch(`/usuarios/${id}/toggle-status`);
  return normalizeUser(res.data);
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/usuarios/${id}`);
}