// src/features/tasks/catalog/api.ts
import api from "@/lib/http";

export type Paginated<T> = {
  data: T[];
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
  links?: any;
  meta?: any;
};

export type Template = {
  id: string;
  title: string;
  description?: string | null;
  instructions?: any;
  estimated_minutes?: number | null;
  priority: "low" | "medium" | "high" | "urgent";
  tags?: any;
  is_active: boolean;
  show_in_dashboard?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type Routine = {
  id: string;
  name: string;
  description?: string | null;
  recurrence: "daily" | "weekly";
  weekdays?: number[] | null; // 0=Sun..6=Sat
  start_date?: string | null;
  end_date?: string | null;
  is_active: boolean;
};

export type RoutineItem = {
  id: string;
  routine_id: string;
  template_id: string;
  sort_order: number;
  is_active: boolean;
};

export type CatalogItem = {
  routine_item_id: string;
  sort_order: number;
  template: Template;
};

export type Employee = { id: string; name?: string; full_name?: string; apellido?: string; is_active?: boolean };

function unwrapPaginated<T>(res: any): Paginated<T> {
  if (res?.data?.data && Array.isArray(res.data.data)) return res.data as Paginated<T>;
  if (res?.data && Array.isArray(res.data)) return { data: res.data } as Paginated<T>;
  if (res?.data?.data && Array.isArray(res.data.data)) return res.data;
  return { data: res?.data?.data ?? [] } as Paginated<T>;
}

// ───────── Templates ─────────
export async function listTemplates(params: { page?: number; active?: boolean; search?: string; show_in_dashboard?: boolean } = {}) {
  const res = await api.get("/task-templates", { params });
  return unwrapPaginated<Template>(res);
}

export async function getTemplate(id: string) {
  const res = await api.get(`/task-templates/${id}`);
  return res.data?.item as Template;
}

export async function createTemplate(payload: Partial<Template>) {
  const res = await api.post("/task-templates", payload);
  return res.data?.item as Template;
}

export async function updateTemplate(id: string, payload: Partial<Template>) {
  const res = await api.patch(`/task-templates/${id}`, payload);
  return res.data?.item as Template;
}

export async function deleteTemplate(id: string) {
  const res = await api.delete(`/task-templates/${id}`);
  return res.data;
}

// ───────── Routines ─────────
export async function listRoutines(params: { page?: number; active?: boolean } = {}) {
  const res = await api.get("/task-routines", { params });
  return unwrapPaginated<Routine>(res);
}

export async function createRoutine(payload: Partial<Routine>) {
  const res = await api.post("/task-routines", payload);
  return res.data?.item as Routine;
}

export async function updateRoutine(id: string, payload: Partial<Routine>) {
  const res = await api.patch(`/task-routines/${id}`, payload);
  return res.data?.item as Routine;
}

export async function deleteRoutine(id: string) {
  const res = await api.delete(`/task-routines/${id}`);
  return res.data;
}

export async function getRoutine(id: string) {
  const res = await api.get(`/task-routines/${id}`);
  return res.data as { item: Routine; items: RoutineItem[] };
}

export async function addRoutineItems(routineId: string, template_ids: string[]) {
  const res = await api.post(`/task-routines/${routineId}/items`, { template_ids });
  return res.data;
}

export async function removeRoutineItem(routineId: string, itemId: string) {
  const res = await api.delete(`/task-routines/${routineId}/items/${itemId}`);
  return res.data;
}

export async function assignRoutine(
  routineId: string,
  payload: { date: string; empleado_ids: string[]; due_at?: string | null; allow_duplicate?: boolean }
) {
  const res = await api.post(`/task-routines/${routineId}/assign`, payload);
  return res.data;
}

// ───────── Catalog ─────────
export async function getCatalog(date: string) {
  const res = await api.get(`/tareas/catalogo`, { params: { date } });
  return res.data as { date: string; dow: number; routines: Routine[]; catalog: CatalogItem[] };
}

export async function bulkCreateFromCatalog(payload: {
  date: string;
  template_ids: string[];
  empleado_ids: string[];
  due_at?: string | null;
  allow_duplicate?: boolean;
}) {
  const res = await api.post(`/tareas/crear-desde-catalogo-bulk`, payload);
  return res.data;
}

// ───────── Employees ─────────
export async function listEmployees() {
  const res = await api.get("/empleados");
  const p = unwrapPaginated<Employee>(res);
  return p.data;
}