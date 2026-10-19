// src/features/reportes/periodo.ts
//
// El endpoint /reportes/asistencia-semanal agrupa por día de la semana
// ("domingo".."sábado"), así que una sola respuesta solo puede representar 7
// días: si se le pide un mes, los cuatro lunes caen en la misma llave y
// sobrevive uno. Para cubrir un período largo se parte el rango en semanas
// (domingo a sábado), se pide una por una y se arman aquí los agregados.
import { DIAS_ORDEN, type DiaSemana, type ReporteAsistenciaFila, type ReporteAsistenciaResponse } from "./api";

/** Tope de semanas por reporte: un mes natural puede abarcar 6 semanas. */
export const MAX_SEMANAS = 10;

// Zona horaria de la empresa: el backend interpreta las HH:mm de los ajustes en
// esta zona, así que los promedios deben calcularse igual sin importar el navegador.
export const COMPANY_TZ = "America/Mexico_City";

export type RangoSemana = { from: string; to: string };

function parseISO(fecha: string): Date {
  const [y, m, d] = fecha.split("-").map(Number);
  // mediodía local: evita que un cambio de horario mueva la fecha un día
  return new Date(y, m - 1, d, 12, 0, 0);
}

function fmtISO(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/**
 * Parte [from, to] en semanas domingo–sábado, recortadas al rango pedido para
 * que el reporte no muestre días fuera del filtro.
 */
export function weekChunks(from: string, to: string): RangoSemana[] {
  if (!from || !to) return [];
  const inicio = parseISO(from);
  const fin = parseISO(to);
  if (inicio > fin) return [];

  const out: RangoSemana[] = [];
  let cursor = inicio;
  while (cursor <= fin) {
    const domingo = addDays(cursor, -cursor.getDay());
    const sabado = addDays(domingo, 6);
    out.push({
      from: fmtISO(domingo < inicio ? inicio : domingo),
      to: fmtISO(sabado > fin ? fin : sabado),
    });
    cursor = addDays(sabado, 1);
  }
  return out;
}

/** "HH:mm" (24 h, zona de la empresa) a partir de un ISO del backend. */
export function isoToHHmm(iso?: string | null): string {
  if (!iso) return "";
  // en-GB da "HH:mm" en 24 h
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: COMPANY_TZ,
  });
}

function isoToMinutos(iso?: string | null): number | null {
  const hhmm = isoToHHmm(iso);
  if (!hhmm) return null;
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

/** Minutos desde medianoche a "HH:mm". */
export function minutosAHHmm(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = Math.round(min % 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}`;
}

// ─── Totales del período (lo que paga la nómina: sumas, no promedios) ────────

export type TotalPeriodo = {
  empleado: ReporteAsistenciaFila["empleado"];
  minutos: number;
  retardos: number;
  dias_trabajados: number;
  faltas: number;
};

/**
 * Suma las semanas por empleado. Conserva el orden en que aparecen los
 * empleados en la primera semana que los incluye.
 */
export function totalesPeriodo(semanas: ReporteAsistenciaResponse[]): TotalPeriodo[] {
  const acc = new Map<string, TotalPeriodo>();

  for (const semana of semanas) {
    for (const fila of semana.filas) {
      const id = fila.empleado.id;
      const prev = acc.get(id) ?? {
        empleado: fila.empleado,
        minutos: 0,
        retardos: 0,
        dias_trabajados: 0,
        faltas: 0,
      };
      prev.minutos += fila.total_horas ?? 0;
      prev.retardos += fila.total_retardos ?? 0;
      for (const d of DIAS_ORDEN) {
        const dia = fila.dias?.[d];
        if (!dia) continue;
        if (dia.entrada) prev.dias_trabajados++;
        else if (dia.estado === "falta") prev.faltas++;
      }
      acc.set(id, prev);
    }
  }

  return [...acc.values()];
}

// ─── Semana promedio (solo informativa, nunca para nómina) ───────────────────

export type PromedioDia = {
  /** Promedio de entrada en minutos desde medianoche; ausente si no hubo horas. */
  entrada?: number;
  salida?: number;
  /** Días que entraron al promedio (los que tenían hora registrada). */
  muestras: number;
  /** Estado más repetido cuando ningún día de ese día de la semana tuvo horas. */
  estado?: string;
};

export type FilaPromedio = {
  empleado: ReporteAsistenciaFila["empleado"];
  dias: Record<DiaSemana, PromedioDia>;
  /** Minutos trabajados / semanas con actividad. */
  minutos_promedio: number;
  semanas_contadas: number;
};

/**
 * Promedia cada día de la semana entre las semanas del período. El divisor son
 * los días con hora registrada, no los días del calendario: así una semana de
 * vacaciones o de descanso no arrastra la hora promedio de entrada.
 */
export function semanaPromedio(semanas: ReporteAsistenciaResponse[]): FilaPromedio[] {
  type Acum = {
    empleado: ReporteAsistenciaFila["empleado"];
    dias: Record<string, { entrada: number[]; salida: number[]; estados: string[] }>;
    minutos: number;
    semanas: Set<number>;
  };
  const acc = new Map<string, Acum>();

  semanas.forEach((semana, idx) => {
    for (const fila of semana.filas) {
      const id = fila.empleado.id;
      let a = acc.get(id);
      if (!a) {
        a = { empleado: fila.empleado, dias: {}, minutos: 0, semanas: new Set() };
        for (const d of DIAS_ORDEN) a.dias[d] = { entrada: [], salida: [], estados: [] };
        acc.set(id, a);
      }

      let actividad = false;
      for (const d of DIAS_ORDEN) {
        const dia = fila.dias?.[d];
        if (!dia) continue;
        const entrada = isoToMinutos(dia.entrada);
        const salida = isoToMinutos(dia.salida);
        if (entrada !== null) {
          a.dias[d].entrada.push(entrada);
          actividad = true;
        }
        if (salida !== null) a.dias[d].salida.push(salida);
        if (entrada === null && salida === null) a.dias[d].estados.push(dia.estado);
      }

      a.minutos += fila.total_horas ?? 0;
      if (actividad) a.semanas.add(idx);
    }
  });

  const media = (xs: number[]) => Math.round(xs.reduce((s, x) => s + x, 0) / xs.length);

  return [...acc.values()].map((a) => {
    const dias = {} as Record<DiaSemana, PromedioDia>;
    for (const d of DIAS_ORDEN) {
      const bucket = a.dias[d];
      if (bucket.entrada.length > 0 || bucket.salida.length > 0) {
        dias[d] = {
          entrada: bucket.entrada.length > 0 ? media(bucket.entrada) : undefined,
          salida: bucket.salida.length > 0 ? media(bucket.salida) : undefined,
          muestras: Math.max(bucket.entrada.length, bucket.salida.length),
        };
      } else {
        dias[d] = { muestras: 0, estado: estadoDominante(bucket.estados) };
      }
    }
    const semanas_contadas = a.semanas.size;
    return {
      empleado: a.empleado,
      dias,
      semanas_contadas,
      minutos_promedio: semanas_contadas > 0 ? Math.round(a.minutos / semanas_contadas) : 0,
    };
  });
}

function estadoDominante(estados: string[]): string | undefined {
  if (estados.length === 0) return undefined;
  const cuenta = new Map<string, number>();
  for (const e of estados) cuenta.set(e, (cuenta.get(e) ?? 0) + 1);
  return [...cuenta.entries()].sort((a, b) => b[1] - a[1])[0][0];
}
