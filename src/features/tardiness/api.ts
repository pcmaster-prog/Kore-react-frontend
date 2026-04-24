// src/features/tardiness/api.ts
// ─── API bridge for tardiness system ──────────────────────────────────────────
// Uses mocks while backend isn't ready. When backend is ready:
// 1. Set USE_MOCKS = false
// 2. The real API calls below will activate automatically

import api from "@/lib/http";
import {
  mockGetTardinessConfig,
  mockUpdateTardinessConfig,
  mockGetMonthlySummary,
  mockGetEmployeeDetail,
  type TardinessConfig,
  type TardinessMonthlySummary,
  type EmployeeTardinessDetail,
} from "@/mocks/tardinessMocks";

// ─── Toggle: flip to false when backend endpoints are live ───────────────────
const USE_MOCKS = false;

// ─── Config ──────────────────────────────────────────────────────────────────

export async function getTardinessConfig(): Promise<TardinessConfig> {
  if (USE_MOCKS) return mockGetTardinessConfig();
  const res = await api.get("/config/retardos");
  return res.data as TardinessConfig;
}

export async function updateTardinessConfig(
  data: Partial<TardinessConfig>
): Promise<{ message: string; config: TardinessConfig }> {
  if (USE_MOCKS) return mockUpdateTardinessConfig(data);
  const res = await api.patch("/config/retardos", data);
  return res.data;
}

// ─── Reports ─────────────────────────────────────────────────────────────────

export async function getMonthlySummary(
  month?: string
): Promise<TardinessMonthlySummary> {
  if (USE_MOCKS) return mockGetMonthlySummary(month);
  const res = await api.get("/retardos/resumen-mes", { params: { month } });
  return res.data as TardinessMonthlySummary;
}

export async function getEmployeeDetail(
  empleadoId: string
): Promise<EmployeeTardinessDetail> {
  if (USE_MOCKS) return mockGetEmployeeDetail(empleadoId);
  const res = await api.get(`/retardos/empleado/${empleadoId}`);
  return res.data as EmployeeTardinessDetail;
}

// Re-export types for convenience
export type { TardinessConfig, TardinessMonthlySummary, EmployeeTardinessDetail };
export type { EmployeeLateRecord } from "@/mocks/tardinessMocks";
