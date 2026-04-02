// src/features/bitacora/api.ts
import api from "@/lib/http";
import { getByDate } from "@/features/attendance/api";
import { listTasks } from "@/features/tasks/api";

export { getByDate, listTasks };

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type EvaluacionCriterio = {
  id: string;
  label: string;
  tipo: "positivo" | "negativo";
  activo: boolean;
  sort_order?: number;
};

// ─── Criterios de Evaluación ─────────────────────────────────────────────────

/** Criterios por defecto mientras el backend no esté listo */
export const DEFAULT_CRITERIOS: EvaluacionCriterio[] = [
  { id: "c1", label: "Completó tareas",     tipo: "positivo", activo: true, sort_order: 1 },
  { id: "c2", label: "Actitud proactiva",   tipo: "positivo", activo: true, sort_order: 2 },
  { id: "c3", label: "Llegó tarde",         tipo: "negativo", activo: true, sort_order: 3 },
  { id: "c4", label: "Estuvo en el celular",tipo: "negativo", activo: true, sort_order: 4 },
  { id: "c5", label: "Platicó en exceso",   tipo: "negativo", activo: true, sort_order: 5 },
];

export async function getEvaluationCriteria(): Promise<EvaluacionCriterio[]> {
  try {
    const res = await api.get("/bitacora/criterios");
    const raw = res.data;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.data)) return raw.data;
    return DEFAULT_CRITERIOS;
  } catch {
    // Fallback a criterios por defecto si el backend no está listo
    return DEFAULT_CRITERIOS;
  }
}

export async function saveEvaluationCriteria(criterios: Omit<EvaluacionCriterio, "id">[]): Promise<EvaluacionCriterio[]> {
  const res = await api.post("/bitacora/criterios", { criterios });
  return res.data as EvaluacionCriterio[];
}
