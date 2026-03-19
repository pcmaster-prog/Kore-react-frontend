//features/tasks/employeeApi.ts
import api from "@/lib/http";

export async function listEmployees() {
  const res = await api.get("/empleados");
  return res.data;
}