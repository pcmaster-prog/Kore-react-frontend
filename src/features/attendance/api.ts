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
  // Enviar coordenadas GPS para futura validación de geofencing (§2.3)
  // Si no hay geolocation o falla, enviamos sin coords — el backend las ignora hoy
  let lat: number | null = null;
  let lng: number | null = null;

  try {
    if (navigator.geolocation) {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 60000,
        });
      });
      lat = position.coords.latitude;
      lng = position.coords.longitude;
    }
  } catch {
    // Geolocation denied or timed out — proceed without coords
  }

  const body: Record<string, unknown> = {};
  if (lat !== null && lng !== null) {
    body.lat = lat;
    body.lng = lng;
  }

  const res = await api.post("/asistencia/entrada", body);
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

export async function eliminarAsistencia(empleadoId: string, fecha: string) {
  const res = await api.delete(`/asistencia/eliminar/${empleadoId}/${fecha}`);
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

// ─── Retardos ────────────────────────────────────────────────────────────────

export type LateInfo = {
  late_count: number;
  today_late_minutes: number | null;
  penalty_active: boolean;
  late_days: { date: string; late_minutes: number }[];
  month: string;
};

export async function getMyLateInfo(): Promise<LateInfo> {
  const res = await api.get("/asistencia/mis-retardos");
  return res.data as LateInfo;
}

// ─── Solicitudes de Ausencia ─────────────────────────────────────────────────

export type AbsenceStatus = "pending" | "approved" | "rejected";

export type AbsenceRequest = {
  id: string;
  date: string;
  motivo: string;
  status: AbsenceStatus;
  reviewer_note?: string | null;
  reviewed_at?: string | null;
  created_at?: string | null;
  // Solo en vista admin
  empleado_id?: string;
  empleado_name?: string;
};

export async function createAbsenceRequest(data: {
  date: string;
  motivo: string;
}): Promise<AbsenceRequest> {
  const res = await api.post("/asistencia/ausencias", data);
  return res.data.request as AbsenceRequest;
}

export async function getMyAbsenceRequests(): Promise<AbsenceRequest[]> {
  const res = await api.get("/asistencia/ausencias");
  return (res.data.data ?? []) as AbsenceRequest[];
}

export async function getPendingAbsences(): Promise<AbsenceRequest[]> {
  const res = await api.get("/asistencia/ausencias/pendientes");
  return (res.data.data ?? []) as AbsenceRequest[];
}

export async function reviewAbsence(
  id: string,
  status: "approved" | "rejected",
  reviewerNote?: string
): Promise<AbsenceRequest> {
  const res = await api.patch(`/asistencia/ausencias/${id}`, {
    status,
    reviewer_note: reviewerNote ?? null,
  });
  return res.data.request as AbsenceRequest;
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