//features/tasks/employeeApi.ts
import api from "@/lib/http";

export type Employee = {
  id: string;
  full_name?: string;
  name?: string;
  position_title?: string;
};

export async function listEmployees(): Promise<Employee[]> {
  const res = await api.get("/empleados");
  const raw = res.data;
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  return [];
}