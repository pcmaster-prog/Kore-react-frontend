// src/mocks/tardinessMocks.ts
// ─── Mock data for tardiness/retardos endpoints ──────────────────────────────
// Use these while the backend implements the real endpoints (§3.7).
// When the backend is ready, replace the imports in the UI with real API calls.

// ─── Types ───────────────────────────────────────────────────────────────────

export type TardinessConfig = {
  id: string;
  empresa_id: string;
  grace_period_minutes: number;
  late_threshold_minutes: number;
  lates_to_absence: number;
  accumulation_period: "week" | "biweek" | "month";
  penalize_rest_day: boolean;
  notify_employee_on_late: boolean;
  notify_manager_on_late: boolean;
  created_at: string;
  updated_at: string;
};

export type EmployeeLateRecord = {
  empleado_id: string;
  empleado_name: string;
  total_lates: number;
  total_late_minutes: number;
  absences_generated: number;
  rest_day_penalized: boolean;
  dates: string[];
};

export type TardinessMonthlySummary = {
  period: string;
  config: Pick<TardinessConfig, "grace_period_minutes" | "lates_to_absence">;
  summary: EmployeeLateRecord[];
};

export type EmployeeTardinessDetail = {
  empleado_id: string;
  empleado_name: string;
  period: string;
  lates: {
    date: string;
    late_minutes: number;
    converted_to_absence: boolean;
  }[];
  absences: {
    id: string;
    period_key: string;
    type: "late_accumulation" | "unjustified" | "justified";
    affects_rest_day_payment: boolean;
    note: string | null;
    created_at: string;
  }[];
};

// ─── Mock Data ───────────────────────────────────────────────────────────────

export const MOCK_TARDINESS_CONFIG: TardinessConfig = {
  id: "cfg-001",
  empresa_id: "emp-001",
  grace_period_minutes: 10,
  late_threshold_minutes: 1,
  lates_to_absence: 3,
  accumulation_period: "month",
  penalize_rest_day: true,
  notify_employee_on_late: true,
  notify_manager_on_late: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-04-20T14:30:00Z",
};

export const MOCK_MONTHLY_SUMMARY: TardinessMonthlySummary = {
  period: "2026-04",
  config: {
    grace_period_minutes: 10,
    lates_to_absence: 3,
  },
  summary: [
    {
      empleado_id: "e-001",
      empleado_name: "Juan Pérez",
      total_lates: 4,
      total_late_minutes: 65,
      absences_generated: 1,
      rest_day_penalized: true,
      dates: ["2026-04-02", "2026-04-05", "2026-04-10", "2026-04-15"],
    },
    {
      empleado_id: "e-002",
      empleado_name: "María García",
      total_lates: 2,
      total_late_minutes: 25,
      absences_generated: 0,
      rest_day_penalized: false,
      dates: ["2026-04-03", "2026-04-12"],
    },
    {
      empleado_id: "e-003",
      empleado_name: "Carlos López",
      total_lates: 3,
      total_late_minutes: 45,
      absences_generated: 1,
      rest_day_penalized: true,
      dates: ["2026-04-01", "2026-04-08", "2026-04-14"],
    },
    {
      empleado_id: "e-004",
      empleado_name: "Ana Rodríguez",
      total_lates: 1,
      total_late_minutes: 8,
      absences_generated: 0,
      rest_day_penalized: false,
      dates: ["2026-04-07"],
    },
    {
      empleado_id: "e-005",
      empleado_name: "Roberto Sánchez",
      total_lates: 0,
      total_late_minutes: 0,
      absences_generated: 0,
      rest_day_penalized: false,
      dates: [],
    },
  ],
};

export const MOCK_EMPLOYEE_DETAIL: EmployeeTardinessDetail = {
  empleado_id: "e-001",
  empleado_name: "Juan Pérez",
  period: "2026-04",
  lates: [
    { date: "2026-04-02", late_minutes: 15, converted_to_absence: true },
    { date: "2026-04-05", late_minutes: 20, converted_to_absence: true },
    { date: "2026-04-10", late_minutes: 12, converted_to_absence: true },
    { date: "2026-04-15", late_minutes: 18, converted_to_absence: false },
  ],
  absences: [
    {
      id: "abs-001",
      period_key: "2026-04",
      type: "late_accumulation",
      affects_rest_day_payment: true,
      note: null,
      created_at: "2026-04-10T09:15:00Z",
    },
  ],
};

// ─── Mock API functions ──────────────────────────────────────────────────────
// These simulate the real endpoints with a small delay for realistic UX.

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** GET /config/retardos */
export async function mockGetTardinessConfig(): Promise<TardinessConfig> {
  await delay(300);
  return { ...MOCK_TARDINESS_CONFIG };
}

/** PATCH /config/retardos */
export async function mockUpdateTardinessConfig(
  data: Partial<TardinessConfig>
): Promise<{ message: string; config: TardinessConfig }> {
  await delay(400);
  const updated = { ...MOCK_TARDINESS_CONFIG, ...data, updated_at: new Date().toISOString() };
  // In real usage, the singleton MOCK_TARDINESS_CONFIG would be mutated.
  // For dev, we just return the merged result.
  Object.assign(MOCK_TARDINESS_CONFIG, updated);
  return { message: "Configuración actualizada", config: updated };
}

/** GET /retardos/resumen-mes?month=2026-04 */
export async function mockGetMonthlySummary(
  _month?: string
): Promise<TardinessMonthlySummary> {
  await delay(350);
  return { ...MOCK_MONTHLY_SUMMARY };
}

/** GET /retardos/empleado/{id} */
export async function mockGetEmployeeDetail(
  _empleadoId: string
): Promise<EmployeeTardinessDetail> {
  await delay(300);
  return { ...MOCK_EMPLOYEE_DETAIL };
}
