// src/features/tasks/api.ts

import api from "@/lib/http";
import type { Paginated, Task } from "./types";

// ===== TIPOS COMPARTIDOS =====
export type AssignmentStatus = "assigned" | "in_progress" | "done_pending" | "approved" | "rejected";

// ===== TAREAS (manager) =====
type ListTasksParams = {
  page?: number;
  status?: string; // "open,in_progress"
  empleado_id?: string; // UUID
  priority?: string;
  date?: string; // YYYY-MM-DD (catalog_date)
  search?: string;
  overdue?: boolean;
};

export async function listTasks(params: ListTasksParams) {
  const res = await api.get<Paginated<Task>>("/tareas", { params });
  return res.data;
}

// ===== CATÁLOGO DE TAREAS =====
export type CatalogItem = {
  id: string;
  title: string;
  description?: string;
  priority?: string;
  // Agrega otros campos que vengan del catálogo según sea necesario
};

// ✅ NUEVO: Tipo completo de la respuesta del backend
export type CatalogResponse = {
  date: string;
  dow: number;
  routines: any[];
  catalog: {
    routine_item_id: string;
    routine_id: string;
    routine_name?: string | null;
    template: {
      id: string;
      title: string;
      description?: string;
      priority?: string;
      meta?: any;
    };
    sort_order?: number;
  }[];
};

export async function getCatalog(date: string) {
  const res = await api.get<CatalogResponse>("/tareas/catalogo", { params: { date } });
  return res.data; // ✅ Devuelve el objeto completo con tipo correcto
}

// ===== ASIGNACIÓN MASIVA DESDE CATÁLOGO =====
export async function bulkAssignFromCatalog(payload: {
  date: string;
  template_ids: string[];
  empleado_ids: string[];
  due_at?: string | null;
  allow_duplicate?: boolean;
}) {
  const res = await api.post("/tareas/crear-desde-catalogo-bulk", payload);
  return res.data;
}

// ===== CREAR TAREA AD-HOC =====
export async function createTask(payload: {
  title: string;
  description?: string;
  priority?: string; // low|medium|high|urgent
  due_at?: string | null;
  catalog_date?: string;
  estimated_minutes?: number;
}) {
  const res = await api.post("/tareas", payload);
  return res.data as { item: Task };
}

// ===== ASIGNAR EMPLEADOS A TAREA =====
export async function assignTask(taskId: string, payload: { empleado_ids: string[] }) {
  const res = await api.post(`/tareas/${taskId}/asignar`, payload);
  return res.data;
}

// ===== ACTUALIZAR ESTADO DE TAREA =====
export async function updateTaskStatus(id: string, status: "open" | "in_progress" | "completed") {
  const res = await api.patch(`/tareas/${id}/status`, { status });
  return res.data;
}

// ===== APROBACIONES (manager) =====
export type PendingApprovalItem = {
  id: string; // assignmentId
  task_id: string;
  empleado_id: string;
  status: AssignmentStatus; // ✅ Usando tipo unificado
  done_at?: string | null;
  note?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  review_note?: string | null;

  task?: {
    id: string;
    title: string;
    description?: string | null;
    priority?: string | null;
    status?: string;
  };

  empleado?: {
    id: string;
    nombre?: string;
    name?: string;
    full_name?: string;
  };
};

export async function listPendingApprovals(params?: { page?: number }) {
  const res = await api.get("/tareas/revision", { params });
  return res.data as { data: PendingApprovalItem[]; total: number; last_page: number };
}

export async function approveAssignment(assignmentId: string) {
  const res = await api.post(`/tareas/asignaciones/${assignmentId}/approve`, {});
  return res.data;
}

export async function rejectAssignment(assignmentId: string, note: string) {
  const res = await api.post(`/tareas/asignaciones/${assignmentId}/reject`, { note });
  return res.data;
}

// ===== EVIDENCIAS =====
export type EvidenceItem = {
  id: string;
  task_id: string;
  task_assignee_id?: string | null;
  empleado_id?: string | null;
  original_name?: string | null;
  mime?: string | null;
  size?: number | null;
  created_at?: string | null;
  url?: string | null;
};

export async function listTaskEvidences(taskId: string) {
  const res = await api.get(`/tareas/${taskId}/evidencias`);
  return res.data as { data: EvidenceItem[] };
}

// ===== EMPLEADO: MIS ASIGNACIONES =====
export type ChecklistItem = {
  id: string;
  label: string;
  required?: boolean;
};

export type ChecklistState = Record<string, { done: boolean; at?: string }>;

export type ChecklistProgress = {
  required_done: number;
  required_total: number;
};

export type MyAssignmentRow = {
  assignment: {
    id: string;
    task_id: string;
    empleado_id: string;
    status: AssignmentStatus; // ✅ Usando tipo unificado
    started_at?: string | null;
    done_at?: string | null;
    note?: string | null;
    reviewed_at?: string | null;
    review_note?: string | null;

    // ✅ NUEVOS CAMPOS (desde el backend)
    has_evidence?: boolean;
    evidence_count?: number;
    latest_evidence_url?: string | null;
  };
  task: {
    id: string;
    title: string;
    description?: string | null;
    priority?: string | null;
    status?: string;
    due_at?: string | null;
    meta?: any;
  };
  // ✅ CHECKLIST CAMPOS
  checklist_def?: ChecklistItem[] | null;
  checklist_state?: ChecklistState | null;
  checklist_progress?: ChecklistProgress | null;
};

export async function listMyAssignments(params?: { page?: number; date?: string; status?: string; search?: string }) {
  const res = await api.get("/mis-tareas/asignaciones", { params });
  return res.data as { data: MyAssignmentRow[]; total: number; last_page: number };
}

export async function updateMyAssignment(
  assignmentId: string,
  payload: { status: "assigned" | "in_progress" | "done_pending"; note?: string }
) {
  const res = await api.patch(`/mis-tareas/asignacion/${assignmentId}`, payload);
  return res.data;
}

// ✅ NUEVO: Actualizar item del checklist
export async function updateMyChecklistItem(
  assignmentId: string,
  payload: { item_id: string; done: boolean }
) {
  const res = await api.patch(`/mis-tareas/asignacion/${assignmentId}/checklist`, payload);
  return res.data;
}

// ===== EMPLEADO: EVIDENCIAS =====
export async function uploadEvidence(file: File, meta?: any) {
  const fd = new FormData();
  fd.append("file", file);
  if (meta !== undefined) {
    fd.append("meta", typeof meta === "string" ? meta : JSON.stringify(meta));
  }

  const res = await api.post("/evidencias/upload", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data as {
    item: { id: string; original_name?: string; mime?: string; size?: number };
    url?: string;
  };
}

export async function attachEvidenceToMyAssignment(assignmentId: string, evidenceId: string) {
  const res = await api.post(`/mis-tareas/asignacion/${assignmentId}/evidencia`, {
    evidence_id: evidenceId,
  });
  return res.data; // { message, item, url }
}