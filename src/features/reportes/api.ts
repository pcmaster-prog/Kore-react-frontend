// src/features/reportes/api.ts
import api from "@/lib/http";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type DiaSemana = "domingo" | "lunes" | "martes" | "miércoles" | "jueves" | "viernes" | "sábado";

export const DIAS_ORDEN: DiaSemana[] = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];

export type SemanaDia = {
  dia: DiaSemana;
  fecha: string;
  entrada?: string | null;
  salida?: string | null;
  estado:
    | "presente"
    | "falta"
    | "descanso"
    | "vacaciones"
    | "incapacidad"
    | "festivo"
    | "retardo"
    | "en_turno"
    | "ausente";
  horas_trabajadas?: number;
  tiempo_comida_minutos?: number;
};

export type ReporteAsistenciaFila = {
  empleado: {
    id: string;
    nombre: string;
    comida_hora?: string | null;
    position_title?: string | null;
  };
  dias: Record<DiaSemana, SemanaDia | undefined>;
  total_horas: number; // en minutos
  total_retardos: number;
};

export type ReporteAsistenciaResponse = {
  semana: number;
  anio: number;
  rango: { desde: string; hasta: string };
  filas: ReporteAsistenciaFila[];
};

export type FiltrosAsistencia = {
  from?: string;
  to?: string;
  empleado_ids?: string[];
  incluir_retardos?: boolean;
  incluir_tiempos_comida?: boolean;
};

export type ReporteEmpleadoResumen = {
  dias_trabajados: number;
  dias_faltas: number;
  dias_descanso: number;
  total_horas: number;
  total_retardos: number;
  promedio_comida_minutos: number;
};

export type ReporteEmpleadoDetalle = {
  fecha: string;
  entrada?: string | null;
  salida?: string | null;
  estado: string;
  horas_trabajadas: number;
  tiempo_comida_minutos: number;
  retardos_minutos?: number;
};

export type ReporteEmpleadoResponse = {
  empleado: {
    id: string;
    nombre: string;
    position_title?: string | null;
    hired_at?: string | null;
  };
  periodo: { desde: string; hasta: string };
  resumen: ReporteEmpleadoResumen;
  detalle: ReporteEmpleadoDetalle[];
};

// ─── Endpoints ────────────────────────────────────────────────────────────────

export async function getReporteAsistenciaSemanal(
  filtros: FiltrosAsistencia
): Promise<ReporteAsistenciaResponse> {
  const params: Record<string, unknown> = {};
  if (filtros.from) params.from = filtros.from;
  if (filtros.to) params.to = filtros.to;
  if (filtros.empleado_ids && filtros.empleado_ids.length > 0)
    params.empleado_ids = filtros.empleado_ids.join(",");
  if (filtros.incluir_retardos) params.incluir_retardos = true;
  if (filtros.incluir_tiempos_comida) params.incluir_tiempos_comida = true;

  const res = await api.get("/reportes/asistencia-semanal", { params });
  return res.data as ReporteAsistenciaResponse;
}

export async function getReporteEmpleado(
  empleadoId: string,
  filtros: Omit<FiltrosAsistencia, "empleado_ids">
): Promise<ReporteEmpleadoResponse> {
  const params: Record<string, unknown> = {};
  if (filtros.from) params.from = filtros.from;
  if (filtros.to) params.to = filtros.to;
  if (filtros.incluir_retardos) params.incluir_retardos = true;
  if (filtros.incluir_tiempos_comida) params.incluir_tiempos_comida = true;

  const res = await api.get(`/reportes/empleado/${empleadoId}`, { params });
  return res.data as ReporteEmpleadoResponse;
}

