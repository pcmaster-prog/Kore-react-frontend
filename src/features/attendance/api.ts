// src/features/attendance/api.ts
import api from "@/lib/http";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type AttendanceState = "out" | "working" | "break" | "closed" | "rest";

export type AttendanceDay = {
  id: string;
  empleado_id: string;
  date: string;
  status: "open" | "closed" | "day_off" | "present" | "late";
  first_check_in_at?: string | null;
  last_check_out_at?: string | null;
};

export type AttendanceTotals = {
  worked_minutes: number;
  break_minutes: number;
};

export type TodayResponse = {
  date: string;
  is_rest_day: boolean;
  state: AttendanceState;
  actions: {
    check_in: boolean;
    break_start: boolean;
    break_end: boolean;
    check_out: boolean;
  };
  day: AttendanceDay | null;
  totals: AttendanceTotals | null;
};

export type MyDayRow = AttendanceDay & {
  totals?: AttendanceTotals;
};

export type ByDateItem = AttendanceDay & {
  totals: AttendanceTotals;
};

export type WeeklySummary = {
  week: { from: string; to: string };
  empleado: {
    id: string;
    full_name: string;
    daily_hours: number;
    rest_weekday?: number | null;
  };
  totals: {
    worked_minutes: number;
    break_minutes: number;
    paid_rest_minutes: number;
    payable_minutes: number;
  };
};

// ─── Empleado ─────────────────────────────────────────────────────────────────

export async function getMyToday(): Promise<TodayResponse> {
  const res = await api.get("/asistencia/mis-hoy");
  return res.data;
}

export async function checkIn() {
  const res = await api.post("/asistencia/entrada", {});
  return res.data;
}

export async function breakStart() {
  const res = await api.post("/asistencia/pausa/iniciar", {});
  return res.data;
}

export async function breakEnd() {
  const res = await api.post("/asistencia/pausa/terminar", {});
  return res.data;
}

export async function checkOut() {
  const res = await api.post("/asistencia/salida", {});
  return res.data;
}

export async function getMyDays(params?: { from?: string; to?: string; page?: number }) {
  const res = await api.get("/asistencia/mis-dias", { params });
  return res.data as {
    data: MyDayRow[];
    total: number;
    last_page: number;
    current_page: number;
  };
}

// ─── Manager ──────────────────────────────────────────────────────────────────

export async function getByDate(date: string) {
  const res = await api.get("/asistencia/por-fecha", { params: { date } });
  return res.data as { date: string; items: ByDateItem[] };
}

export async function getWeeklySummary(empleado_id: string, date: string) {
  const res = await api.get("/asistencia/semanal", {
    params: { empleado_id, date },
  });
  return res.data as WeeklySummary;
}

export async function markRestDay(date: string): Promise<void> {
  await api.post("/asistencia/descanso", { date });
}

export async function cancelRestDay(date: string): Promise<void> {
  await api.delete(`/asistencia/descanso/${date}`);
}

// ─── Manager: Ajustar Asistencia ─────────────────────────────────────────────

export async function ajustarAsistencia(
  empleadoId: string,
  fecha: string,
  data: {
    first_check_in_at?: string;  // "HH:mm"
    last_check_out_at?: string;  // "HH:mm"
    motivo: string;
  }
) {
  const res = await api.patch(
    `/asistencia/ajustar/${empleadoId}/${fecha}`,
    data
  );
  return res.data;
}

// ─── Empleado: Comida ────────────────────────────────────────────────────────

export async function iniciarComida() {
  const res = await api.post('/asistencia/comida/iniciar');
  return res.data as {
    message: string;
    lunch_start_at: string;
    lunch_limit_at: string;
  };
}

export async function terminarComida() {
  const res = await api.post('/asistencia/comida/terminar');
  return res.data as {
    message: string;
    lunch_start_at: string;
    lunch_end_at: string;
    minutos: number;
    excedio: boolean;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Convierte minutos a formato legible "Xh Ym".
 * Maneja casos de sesiones muy cortas (< 1 min) mostrando "< 1m".
 */
export function minutesToHHMM(minutes: number): string {
  if (!minutes || minutes < 0) return "0h 0m";
  if (minutes === 0) return "0h 0m";
  
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  
  // ✅ FIX: mostrar "< 1m" cuando el redondeo da 0 pero hubo actividad
  if (h === 0 && m === 0) return "< 1m";
  
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatTime(iso?: string | null): string {
  if (!iso) return "--:--";
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}