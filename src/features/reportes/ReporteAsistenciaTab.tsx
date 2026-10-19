// src/features/reportes/ReporteAsistenciaTab.tsx
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
  getReporteAsistenciaSemanal,
  DIAS_ORDEN,
  type DiaSemana,
  type FiltrosAsistencia,
  type ReporteAsistenciaResponse,
  type ReporteAsistenciaFila,
} from "./api";
import {
  COMPANY_TZ,
  MAX_SEMANAS,
  isoToHHmm,
  minutosAHHmm,
  semanaPromedio,
  totalesPeriodo,
  weekChunks,
  type FilaPromedio,
  type TotalPeriodo,
} from "./periodo";
import { minutesToHHMM, ajustarAsistenciaMasivo, type BulkAdjustItem } from "@/features/attendance/api";
import FiltrosReporte from "./FiltrosReporte";
import {
  Loader2,
  AlertTriangle,
  Download,
  Trash2,
  RotateCcw,
  Pencil,
  Save,
  X,
  CalendarRange,
  Sigma,
  Info,
} from "lucide-react";
import { cx } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type EmployeeOption = { id: string; full_name?: string; name?: string };

const ESTADO_COLORES: Record<string, { bg: string; text: string; label: string }> = {
  falta: { bg: "#E8774A", text: "#FFFFFF", label: "Falta" },
  descanso: { bg: "#A0AEC0", text: "#FFFFFF", label: "Descanso" },
  vacaciones: { bg: "#D6BCFA", text: "#553C9A", label: "Vacaciones" },
  incapacidad: { bg: "#90CDF4", text: "#2C5282", label: "Incapacidad" },
  festivo: { bg: "#9F7AEA", text: "#FFFFFF", label: "Festivo" },
  retardo: { bg: "#F6AD55", text: "#744210", label: "Retardo" },
  presente: { bg: "#FFFFFF", text: "#1A202C", label: "Presente" },
  en_turno: { bg: "#FEFCBF", text: "#744210", label: "En turno" },
  ausente: { bg: "#E2E8F0", text: "#4A5568", label: "Ausente" },
};

const COMIDA_COLOR = "#F2C94C";
const ENTRADA_COLOR = "#27AE60";
const SALIDA_COLOR = "#EB5757";
const TOTAL_COLOR = "#2B6CB0";

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0];
}

function formatHora(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: COMPANY_TZ });
}

function formatFechaCorta(fecha: string): string {
  return new Date(fecha + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

function todayISO(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const LEYENDA = [
  { label: "COMIDA 30 min", color: COMIDA_COLOR },
  { label: "ENTRADA", color: ENTRADA_COLOR },
  { label: "SALIDA", color: SALIDA_COLOR },
  { label: "FALTA", color: ESTADO_COLORES.falta.bg },
  { label: "DESCANSO", color: ESTADO_COLORES.descanso.bg },
  { label: "INCAPACIDAD", color: ESTADO_COLORES.incapacidad.bg },
  { label: "VACACIONES", color: ESTADO_COLORES.vacaciones.bg },
  { label: "HORAS TOTAL", color: TOTAL_COLOR },
];

type CeldaDiaProps = {
  dia?: { fecha: string; entrada?: string | null; salida?: string | null; estado: string };
  editable?: boolean;
  draft?: { entrada?: string; salida?: string };
  onDraft?: (patch: { entrada?: string; salida?: string }) => void;
};

function CeldaDia({ dia, editable, draft, onDraft }: CeldaDiaProps) {
  if (!dia) {
    return <div className="h-full flex items-center justify-center text-[10px] text-neutral-300">—</div>;
  }

  // Modo edición: entrada y salida editables en la misma celda (también en faltas)
  if (editable) {
    const entradaVal = draft?.entrada ?? isoToHHmm(dia.entrada);
    const salidaVal = draft?.salida ?? isoToHHmm(dia.salida);
    const changed = !!draft?.entrada || !!draft?.salida;
    const inputCls = "w-full rounded border border-k-border bg-white px-1 py-0.5 text-[11px] font-bold outline-none focus:ring-2 focus:ring-obsidian/10";
    return (
      <div className={cx("h-full flex flex-col items-center justify-center gap-0.5 py-1 px-1", changed && "bg-amber-50")}>
        <input
          type="time"
          value={entradaVal}
          onChange={(e) => onDraft?.({ entrada: e.target.value })}
          className={inputCls}
          style={{ color: ENTRADA_COLOR }}
          title="Entrada"
        />
        <input
          type="time"
          value={salidaVal}
          onChange={(e) => onDraft?.({ salida: e.target.value })}
          className={inputCls}
          style={{ color: SALIDA_COLOR }}
          title="Salida"
        />
      </div>
    );
  }

  const style = ESTADO_COLORES[dia.estado] ?? ESTADO_COLORES.ausente;
  const tieneHoras = !!dia.entrada || !!dia.salida;

  if (!tieneHoras && dia.estado !== "presente" && dia.estado !== "en_turno") {
    return (
      <div
        className="h-full flex items-center justify-center rounded-sm mx-0.5 my-0.5"
        style={{ backgroundColor: style.bg, color: style.text }}
      >
        <span className="text-[10px] font-bold uppercase tracking-wider">{style.label}</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center gap-0.5 py-1">
      {dia.entrada && (
        <span className="text-[11px] font-bold" style={{ color: ENTRADA_COLOR }}>
          {formatHora(dia.entrada)}
        </span>
      )}
      {dia.salida && (
        <span className="text-[11px] font-bold" style={{ color: SALIDA_COLOR }}>
          {formatHora(dia.salida)}
        </span>
      )}
      {!dia.entrada && !dia.salida && (
        <span className="text-[10px] text-neutral-400">—</span>
      )}
    </div>
  );
}

// ─── Matriz de una semana ────────────────────────────────────────────────────

type MatrizSemanaProps = {
  semana: ReporteAsistenciaResponse;
  semanaIdx: number;
  filas: ReporteAsistenciaFila[];
  mostrarTitulo: boolean;
  editMode: boolean;
  changes: Record<string, { entrada?: string; salida?: string }>;
  hoy: string;
  fillRow: { semanaIdx: number; empId: string } | null;
  onDraft: (empleadoId: string, fecha: string, patch: { entrada?: string; salida?: string }) => void;
  onFill: (semanaIdx: number, fila: ReporteAsistenciaFila) => void;
  onHideRow: (id: string) => void;
};

function MatrizSemana({
  semana,
  semanaIdx,
  filas,
  mostrarTitulo,
  editMode,
  changes,
  hoy,
  fillRow,
  onDraft,
  onFill,
  onHideRow,
}: MatrizSemanaProps) {
  return (
    <div className="rounded-[28px] border border-k-border bg-k-bg-card shadow-k-card overflow-hidden">
      {mostrarTitulo && (
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-k-border bg-k-bg-card2/60">
          <div className="flex items-baseline gap-2">
            <span className="text-[10px] font-bold text-k-text-b uppercase tracking-widest">Semana</span>
            <span className="text-xl font-black text-k-text-h leading-none">{semana.semana}</span>
          </div>
          <span className="text-xs font-bold text-k-text-b">
            {formatFechaCorta(semana.rango.desde)} — {formatFechaCorta(semana.rango.hasta)}
          </span>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-k-bg-card2/80">
              <th className="text-left px-3 py-3 text-[10px] font-bold text-k-text-b uppercase tracking-[0.1em] border-b border-k-border sticky left-0 bg-k-bg-card2/95 z-10 min-w-[140px]">
                Nombre
              </th>
              <th
                className="text-center px-2 py-3 text-[10px] font-bold uppercase tracking-[0.1em] border-b border-k-border min-w-[70px]"
                style={{ backgroundColor: `${COMIDA_COLOR}22` }}
              >
                Comida
                <br />
                <span className="text-[9px] opacity-70">30 min</span>
              </th>
              {DIAS_ORDEN.map((d) => (
                <th
                  key={d}
                  className={cx(
                    "text-center px-2 py-3 text-[10px] font-bold uppercase tracking-[0.1em] border-b border-k-border min-w-[80px]",
                    (d === "sábado" || d === "domingo") && "bg-neutral-50/50"
                  )}
                >
                  {d}
                </th>
              ))}
              <th
                className="text-center px-3 py-3 text-[10px] font-bold uppercase tracking-[0.1em] border-b border-k-border min-w-[70px]"
                style={{ backgroundColor: `${TOTAL_COLOR}15` }}
              >
                Total
              </th>
              <th className="text-center px-3 py-3 text-[10px] font-bold uppercase tracking-[0.1em] border-b border-k-border min-w-[100px]">
                Firma de
                <br />
                Conformidad
              </th>
              <th className="w-10 border-b border-k-border" />
            </tr>
          </thead>
          <tbody>
            {filas.map((fila) => (
              <tr key={fila.empleado.id} className="border-t border-k-border hover:bg-k-bg-card2/30 transition group">
                {/* Nombre */}
                <td className="px-3 py-2 sticky left-0 bg-k-bg-card border-r border-k-border z-10">
                  <div className="text-sm font-bold text-k-text-h whitespace-nowrap">{fila.empleado.nombre}</div>
                  {fila.empleado.position_title && (
                    <div className="text-[9px] text-k-text-b">{fila.empleado.position_title}</div>
                  )}
                  {editMode && (
                    <button
                      onClick={() => onFill(semanaIdx, fila)}
                      className={cx(
                        "mt-1 inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-bold transition",
                        fillRow?.empId === fila.empleado.id && fillRow?.semanaIdx === semanaIdx
                          ? "bg-sky-600 border-sky-600 text-white"
                          : "bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100"
                      )}
                      title="Poner la misma entrada y salida en todos los días de esta semana"
                    >
                      <CalendarRange className="h-3 w-3" />
                      Toda la semana
                    </button>
                  )}
                </td>

                {/* Comida */}
                <td
                  className="px-2 py-2 text-center border-r border-k-border"
                  style={{ backgroundColor: `${COMIDA_COLOR}33` }}
                >
                  <span className="text-xs font-bold" style={{ color: "#B7791F" }}>
                    {fila.empleado.comida_hora ?? "—"}
                  </span>
                </td>

                {/* Días */}
                {DIAS_ORDEN.map((d) => (
                  <td
                    key={d}
                    className={cx(
                      "px-0 py-0 border-r border-k-border h-[52px] w-[80px]",
                      (d === "sábado" || d === "domingo") && "bg-neutral-50/30"
                    )}
                  >
                    <CeldaDia
                      dia={
                        fila.dias[d]
                          ? {
                              fecha: fila.dias[d]!.fecha,
                              entrada: fila.dias[d]!.entrada,
                              salida: fila.dias[d]!.salida,
                              estado: fila.dias[d]!.estado,
                            }
                          : undefined
                      }
                      editable={editMode && !!fila.dias[d] && fila.dias[d]!.fecha <= hoy}
                      draft={fila.dias[d] ? changes[`${fila.empleado.id}|${fila.dias[d]!.fecha}`] : undefined}
                      onDraft={
                        fila.dias[d]
                          ? (patch) => onDraft(fila.empleado.id, fila.dias[d]!.fecha, patch)
                          : undefined
                      }
                    />
                  </td>
                ))}

                {/* Total de la semana */}
                <td
                  className="px-3 py-2 text-center border-r border-k-border"
                  style={{ backgroundColor: `${TOTAL_COLOR}10` }}
                >
                  <span className="text-sm font-black" style={{ color: TOTAL_COLOR }}>
                    {minutesToHHMM(fila.total_horas)}
                  </span>
                </td>

                {/* Firma */}
                <td className="px-3 py-2 border-r border-k-border">
                  <div className="h-8 w-full border-b border-dashed border-neutral-300" />
                </td>

                {/* Eliminar */}
                <td className="px-2 py-2 text-center">
                  <button
                    onClick={() => onHideRow(fila.empleado.id)}
                    className="h-7 w-7 rounded-lg border border-k-border bg-k-bg-card2 flex items-center justify-center hover:bg-rose-50 hover:border-rose-200 hover:text-rose-500 transition opacity-0 group-hover:opacity-100"
                    title="Quitar del reporte"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}

            {filas.length === 0 && (
              <tr>
                <td colSpan={13} className="px-8 py-12 text-center text-k-text-b text-sm">
                  No hay registros para esta semana.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Totales del período (lo que se paga) ────────────────────────────────────

function TablaTotales({ totales }: { totales: TotalPeriodo[] }) {
  return (
    <div className="rounded-[28px] border border-k-border bg-k-bg-card shadow-k-card overflow-hidden">
      <div className="px-5 py-3 border-b border-k-border bg-k-bg-card2/60">
        <div className="text-[10px] font-bold text-k-text-b uppercase tracking-widest">Totales del período</div>
        <div className="text-xs text-k-text-b mt-0.5">Suma de todas las semanas: es lo que se usa para nómina.</div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-k-bg-card2/80">
              <th className="text-left px-3 py-3 text-[10px] font-bold text-k-text-b uppercase tracking-[0.1em] border-b border-k-border min-w-[160px]">
                Nombre
              </th>
              <th className="text-center px-3 py-3 text-[10px] font-bold text-k-text-b uppercase tracking-[0.1em] border-b border-k-border">
                Días trabajados
              </th>
              <th className="text-center px-3 py-3 text-[10px] font-bold text-k-text-b uppercase tracking-[0.1em] border-b border-k-border">
                Faltas
              </th>
              <th className="text-center px-3 py-3 text-[10px] font-bold text-k-text-b uppercase tracking-[0.1em] border-b border-k-border">
                Retardos
              </th>
              <th
                className="text-center px-3 py-3 text-[10px] font-bold uppercase tracking-[0.1em] border-b border-k-border"
                style={{ backgroundColor: `${TOTAL_COLOR}15` }}
              >
                Horas totales
              </th>
              <th className="text-center px-3 py-3 text-[10px] font-bold text-k-text-b uppercase tracking-[0.1em] border-b border-k-border min-w-[120px]">
                Firma de
                <br />
                Conformidad
              </th>
            </tr>
          </thead>
          <tbody>
            {totales.map((t) => (
              <tr key={t.empleado.id} className="border-t border-k-border hover:bg-k-bg-card2/30 transition">
                <td className="px-3 py-2">
                  <div className="text-sm font-bold text-k-text-h whitespace-nowrap">{t.empleado.nombre}</div>
                  {t.empleado.position_title && (
                    <div className="text-[9px] text-k-text-b">{t.empleado.position_title}</div>
                  )}
                </td>
                <td className="px-3 py-2 text-center text-sm font-bold text-k-text-h">{t.dias_trabajados}</td>
                <td className="px-3 py-2 text-center">
                  <span className={cx("text-sm font-bold", t.faltas > 0 ? "text-rose-600" : "text-k-text-b")}>
                    {t.faltas}
                  </span>
                </td>
                <td className="px-3 py-2 text-center">
                  <span className={cx("text-sm font-bold", t.retardos > 0 ? "text-amber-600" : "text-k-text-b")}>
                    {t.retardos}
                  </span>
                </td>
                <td className="px-3 py-2 text-center" style={{ backgroundColor: `${TOTAL_COLOR}10` }}>
                  <span className="text-sm font-black" style={{ color: TOTAL_COLOR }}>
                    {minutesToHHMM(t.minutos)}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="h-8 w-full border-b border-dashed border-neutral-300" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Semana promedio (aislada, solo de muestra) ──────────────────────────────

function CeldaPromedio({ dia }: { dia: FilaPromedio["dias"][DiaSemana] }) {
  if (dia.muestras === 0) {
    const style = dia.estado ? ESTADO_COLORES[dia.estado] ?? ESTADO_COLORES.ausente : null;
    if (!style) {
      return <div className="h-full flex items-center justify-center text-[10px] text-neutral-300">—</div>;
    }
    return (
      <div
        className="h-full flex items-center justify-center rounded-sm mx-0.5 my-0.5"
        style={{ backgroundColor: style.bg, color: style.text }}
      >
        <span className="text-[10px] font-bold uppercase tracking-wider">{style.label}</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center gap-0.5 py-1">
      {dia.entrada !== undefined && (
        <span className="text-[11px] font-bold" style={{ color: ENTRADA_COLOR }}>
          {minutosAHHmm(dia.entrada)}
        </span>
      )}
      {dia.salida !== undefined && (
        <span className="text-[11px] font-bold" style={{ color: SALIDA_COLOR }}>
          {minutosAHHmm(dia.salida)}
        </span>
      )}
      <span className="text-[9px] text-k-text-b">
        {dia.muestras} día{dia.muestras !== 1 ? "s" : ""}
      </span>
    </div>
  );
}

function SeccionPromedio({ filas, semanas }: { filas: FilaPromedio[]; semanas: number }) {
  return (
    <div className="rounded-[28px] border-2 border-dashed border-sky-300 bg-sky-50/40 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <Info className="h-5 w-5 text-sky-600 shrink-0 mt-0.5" />
        <div>
          <div className="text-sm font-black text-k-text-h">Semana promedio — solo de muestra</div>
          <p className="text-xs text-k-text-b mt-1 max-w-3xl">
            Promedio de las {semanas} semanas del período: cada celda es la hora promedio de entrada y salida de ese día
            de la semana, calculada solo con los días que tienen registro, así que descansos, vacaciones e incapacidades
            no arrastran el promedio.{" "}
            <span className="font-bold">No se usa para nómina, no se puede editar y no entra al PDF.</span> Para pagar,
            usa los totales del período.
          </p>
        </div>
      </div>

      <div className="rounded-[20px] border border-sky-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-sky-50">
                <th className="text-left px-3 py-3 text-[10px] font-bold text-k-text-b uppercase tracking-[0.1em] border-b border-sky-200 min-w-[160px]">
                  Nombre
                </th>
                {DIAS_ORDEN.map((d) => (
                  <th
                    key={d}
                    className="text-center px-2 py-3 text-[10px] font-bold text-k-text-b uppercase tracking-[0.1em] border-b border-sky-200 min-w-[80px]"
                  >
                    {d}
                  </th>
                ))}
                <th className="text-center px-3 py-3 text-[10px] font-bold text-k-text-b uppercase tracking-[0.1em] border-b border-sky-200 min-w-[90px]">
                  Horas por
                  <br />
                  semana
                </th>
              </tr>
            </thead>
            <tbody>
              {filas.map((fila) => (
                <tr key={fila.empleado.id} className="border-t border-sky-100">
                  <td className="px-3 py-2">
                    <div className="text-sm font-bold text-k-text-h whitespace-nowrap">{fila.empleado.nombre}</div>
                    <div className="text-[9px] text-k-text-b">
                      {fila.semanas_contadas} semana{fila.semanas_contadas !== 1 ? "s" : ""} con actividad
                    </div>
                  </td>
                  {DIAS_ORDEN.map((d) => (
                    <td key={d} className="px-0 py-0 border-l border-sky-100 h-[56px] w-[80px]">
                      <CeldaPromedio dia={fila.dias[d]} />
                    </td>
                  ))}
                  <td className="px-3 py-2 text-center border-l border-sky-100">
                    <span className="text-sm font-black text-sky-700">{minutesToHHMM(fila.minutos_promedio)}</span>
                    <div className="text-[9px] text-k-text-b">promedio</div>
                  </td>
                </tr>
              ))}
              {filas.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-8 py-10 text-center text-k-text-b text-sm">
                    No hay datos suficientes para promediar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── PDF: una hoja por semana + una hoja de totales ──────────────────────────

const PDF_MARGIN = 10;

function encabezadoPDF(pdf: jsPDF, desde: string, hasta: string, etiqueta: string, valor: string): number {
  const pageW = pdf.internal.pageSize.getWidth();
  const m = PDF_MARGIN;

  pdf.setFontSize(16);
  pdf.setFont("helvetica", "bold");
  pdf.text("CONTROL DE ASISTENCIA", pageW / 2, m + 6, { align: "center" });

  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  const d = new Date(desde + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "long" });
  const h = new Date(hasta + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
  pdf.text(`del ${d} al ${h}`, pageW / 2, m + 11, { align: "center" });

  pdf.setFontSize(7);
  pdf.text(etiqueta, pageW - m - 2, m + 4, { align: "right" });
  pdf.setFontSize(20);
  pdf.setFont("helvetica", "bold");
  pdf.text(valor, pageW - m - 2, m + 13, { align: "right" });

  // Leyenda
  const legendY = m + 16;
  pdf.setFontSize(6);
  pdf.setFont("helvetica", "normal");
  let legendX = m;
  LEYENDA.forEach((item) => {
    pdf.setFillColor(item.color);
    pdf.rect(legendX, legendY, 2.5, 2.5, "F");
    pdf.text(item.label, legendX + 3.5, legendY + 2);
    legendX += pdf.getTextWidth(item.label) + 7;
  });

  return legendY + 6;
}

function hojaSemanaPDF(pdf: jsPDF, semana: ReporteAsistenciaResponse, filas: ReporteAsistenciaFila[]) {
  const startY = encabezadoPDF(pdf, semana.rango.desde, semana.rango.hasta, "SEMANA", String(semana.semana));

  const head = [["NOMBRE", "COMIDA\n30 min", "DOMINGO", "LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO", "TOTAL", "FIRMA"]];

  const body = filas.map((fila) => {
    const nombre = fila.empleado.nombre + (fila.empleado.position_title ? `\n${fila.empleado.position_title}` : "");
    const comida = fila.empleado.comida_hora ?? "—";

    const diasCells = DIAS_ORDEN.map((d) => {
      const dia = fila.dias[d];
      if (!dia) return { content: "—", styles: { halign: "center" as const, fontSize: 6 } };

      const style = ESTADO_COLORES[dia.estado] ?? ESTADO_COLORES.ausente;
      const tieneHoras = !!dia.entrada || !!dia.salida;

      if (!tieneHoras && dia.estado !== "presente" && dia.estado !== "en_turno") {
        return {
          content: style.label,
          styles: {
            fillColor: hexToRgb(style.bg),
            textColor: hexToRgb(style.text),
            halign: "center" as const,
            fontSize: 6,
            fontStyle: "bold" as const,
          },
        };
      }

      const lines: string[] = [];
      if (dia.entrada) lines.push(formatHora(dia.entrada));
      if (dia.salida) lines.push(formatHora(dia.salida));
      if (lines.length === 0) lines.push("—");

      return { content: lines.join("\n"), styles: { halign: "center" as const, fontSize: 6 } };
    });

    return [
      { content: nombre, styles: { fontSize: 7, valign: "middle" as const } },
      { content: comida, styles: { halign: "center" as const, fontSize: 6, valign: "middle" as const } },
      ...diasCells,
      {
        content: minutesToHHMM(fila.total_horas),
        styles: { halign: "center" as const, fontSize: 7, fontStyle: "bold" as const, textColor: hexToRgb(TOTAL_COLOR), valign: "middle" as const },
      },
      { content: "", styles: { minCellHeight: 8 } },
    ];
  });

  autoTable(pdf, {
    head,
    body,
    startY,
    margin: { left: PDF_MARGIN, right: PDF_MARGIN },
    styles: { fontSize: 6, cellPadding: 1, lineColor: [200, 200, 200], lineWidth: 0.15, font: "helvetica" },
    headStyles: { fillColor: [243, 244, 246], textColor: [60, 60, 60], fontStyle: "bold", fontSize: 6, halign: "center", valign: "middle" },
    alternateRowStyles: { fillColor: [248, 249, 250] },
    columnStyles: { 0: { cellWidth: 38 }, 1: { cellWidth: 16 }, 10: { cellWidth: 22 } },
    didDrawCell: (hookData) => {
      // Dibujar línea de firma en la columna FIRMA
      if (hookData.column.index === 10 && hookData.cell.section === "body") {
        const { cell, doc } = hookData;
        const y = cell.y + cell.height - 2.5;
        doc.setDrawColor(180, 180, 180);
        doc.setLineDashPattern([1, 1], 0);
        doc.line(cell.x + 1, y, cell.x + cell.width - 1, y);
        doc.setLineDashPattern([], 0);
      }
    },
  });
}

function hojaTotalesPDF(pdf: jsPDF, totales: TotalPeriodo[], desde: string, hasta: string, semanas: number) {
  const startY = encabezadoPDF(pdf, desde, hasta, "SEMANAS", String(semanas));

  autoTable(pdf, {
    head: [["NOMBRE", "DÍAS TRABAJADOS", "FALTAS", "RETARDOS", "HORAS TOTALES", "FIRMA"]],
    body: totales.map((t) => [
      { content: t.empleado.nombre + (t.empleado.position_title ? `\n${t.empleado.position_title}` : ""), styles: { fontSize: 7 } },
      { content: String(t.dias_trabajados), styles: { halign: "center" as const } },
      { content: String(t.faltas), styles: { halign: "center" as const } },
      { content: String(t.retardos), styles: { halign: "center" as const } },
      {
        content: minutesToHHMM(t.minutos),
        styles: { halign: "center" as const, fontStyle: "bold" as const, textColor: hexToRgb(TOTAL_COLOR) },
      },
      { content: "", styles: { minCellHeight: 8 } },
    ]),
    startY,
    margin: { left: PDF_MARGIN, right: PDF_MARGIN },
    styles: { fontSize: 7, cellPadding: 1.5, lineColor: [200, 200, 200], lineWidth: 0.15, font: "helvetica" },
    headStyles: { fillColor: [243, 244, 246], textColor: [60, 60, 60], fontStyle: "bold", fontSize: 6, halign: "center", valign: "middle" },
    alternateRowStyles: { fillColor: [248, 249, 250] },
    columnStyles: { 0: { cellWidth: 60 }, 5: { cellWidth: 45 } },
    didDrawCell: (hookData) => {
      if (hookData.column.index === 5 && hookData.cell.section === "body") {
        const { cell, doc } = hookData;
        const y = cell.y + cell.height - 2.5;
        doc.setDrawColor(180, 180, 180);
        doc.setLineDashPattern([1, 1], 0);
        doc.line(cell.x + 1, y, cell.x + cell.width - 1, y);
        doc.setLineDashPattern([], 0);
      }
    },
  });
}

// ─── Pestaña ─────────────────────────────────────────────────────────────────

export default function ReporteAsistenciaTab({ employees }: { employees: EmployeeOption[] }) {
  // Una entrada por semana del período, en orden cronológico.
  const [semanas, setSemanas] = useState<ReporteAsistenciaResponse[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [hiddenRows, setHiddenRows] = useState<Set<string>>(new Set());
  const [lastFiltros, setLastFiltros] = useState<FiltrosAsistencia | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [changes, setChanges] = useState<Record<string, { entrada?: string; salida?: string }>>({});
  const [motivo, setMotivo] = useState("");
  const [saving, setSaving] = useState(false);
  const [verPromedio, setVerPromedio] = useState(false);
  // Panel "aplicar a toda la semana" de un empleado en una semana concreta
  const [fillRow, setFillRow] = useState<{ semanaIdx: number; empId: string; nombre: string; entrada: string; salida: string; overwrite: boolean } | null>(null);

  const pendingEditsRef = useRef(0);

  /** Pide una respuesta por semana del rango: el endpoint solo cubre 7 días. */
  const cargar = useCallback(async (filtros: FiltrosAsistencia): Promise<ReporteAsistenciaResponse[]> => {
    const chunks = weekChunks(filtros.from ?? "", filtros.to ?? "");
    if (chunks.length === 0) {
      throw new Error("Revisa el rango: la fecha Desde debe ser anterior o igual a Hasta.");
    }
    if (chunks.length > MAX_SEMANAS) {
      throw new Error(`El rango abarca ${chunks.length} semanas y el máximo es ${MAX_SEMANAS}. Acorta el período.`);
    }
    return Promise.all(chunks.map((c) => getReporteAsistenciaSemanal({ ...filtros, from: c.from, to: c.to })));
  }, []);

  const handleFilter = useCallback(
    async (filtros: FiltrosAsistencia) => {
      if (pendingEditsRef.current > 0 && !window.confirm("Hay cambios sin guardar en la matriz. ¿Descartarlos y generar el reporte?")) {
        return;
      }
      setLoading(true);
      setErr(null);
      setHiddenRows(new Set());
      setLastFiltros(filtros);
      setChanges({});
      setEditMode(false);
      setMotivo("");
      setVerPromedio(false);
      setFillRow(null);
      try {
        setSemanas(await cargar(filtros));
      } catch (e: any) {
        setErr(e?.response?.data?.message ?? e?.message ?? "Error al generar el reporte");
      } finally {
        setLoading(false);
      }
    },
    [cargar]
  );

  function hideRow(id: string) {
    setHiddenRows((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }

  function resetRows() {
    setHiddenRows(new Set());
  }

  // ── Edición masiva de horas (entrada/salida) ──
  const cambiosCount = Object.values(changes).filter((c) => !!c.entrada || !!c.salida).length;
  useEffect(() => {
    pendingEditsRef.current = cambiosCount;
  }, [cambiosCount]);
  const hoy = todayISO();

  function setDraft(empleadoId: string, fecha: string, patch: { entrada?: string; salida?: string }) {
    const key = `${empleadoId}|${fecha}`;
    setChanges((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }

  function cancelarEdicion() {
    if (cambiosCount > 0 && !window.confirm("Hay cambios sin guardar. ¿Descartarlos?")) return;
    setChanges({});
    setMotivo("");
    setEditMode(false);
    setFillRow(null);
  }

  // Estados que no deben recibir horas al rellenar la semana
  const NO_RELLENAR = new Set(["descanso", "festivo", "vacaciones", "incapacidad"]);

  /** Aplica entrada/salida a todos los días editables de una semana de un empleado. */
  function aplicarSemana() {
    if (!fillRow || (!fillRow.entrada && !fillRow.salida)) return;
    const fila = semanas?.[fillRow.semanaIdx]?.filas.find((f) => f.empleado.id === fillRow.empId);
    if (!fila) return;

    const next = { ...changes };
    let tocados = 0;
    for (const d of DIAS_ORDEN) {
      const dia = fila.dias[d];
      if (!dia || dia.fecha > hoy || NO_RELLENAR.has(dia.estado)) continue;
      const key = `${fila.empleado.id}|${dia.fecha}`;
      const draft = next[key] ?? {};
      const entradaActual = draft.entrada ?? isoToHHmm(dia.entrada);
      const salidaActual = draft.salida ?? isoToHHmm(dia.salida);
      const patch: { entrada?: string; salida?: string } = {};
      if (fillRow.entrada && (fillRow.overwrite || !entradaActual)) patch.entrada = fillRow.entrada;
      if (fillRow.salida && (fillRow.overwrite || !salidaActual)) patch.salida = fillRow.salida;
      if (Object.keys(patch).length === 0) continue;
      next[key] = { ...draft, ...patch };
      tocados++;
    }
    setChanges(next);
    setFillRow(null);
    if (tocados === 0) {
      setErr("No había días por rellenar para ese empleado (todos ya tienen hora, son descanso/festivo o son futuros). Activa \"Sobrescribir\" si quieres forzar la misma hora.");
    } else {
      setErr(null);
    }
  }

  async function guardarCambios() {
    const items: BulkAdjustItem[] = Object.entries(changes)
      .map(([key, c]) => {
        const [empleado_id, fecha] = key.split("|");
        return {
          empleado_id,
          fecha,
          first_check_in_at: c.entrada || undefined,
          last_check_out_at: c.salida || undefined,
        };
      })
      .filter((i) => i.first_check_in_at || i.last_check_out_at);
    if (items.length === 0) return;

    setSaving(true);
    setErr(null);
    try {
      await ajustarAsistenciaMasivo(items, motivo.trim() || "Ajuste desde reporte de asistencia");
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "Error al guardar los ajustes");
      setSaving(false);
      return;
    }
    setChanges({});
    setMotivo("");
    setEditMode(false);
    setFillRow(null);
    try {
      if (lastFiltros) setSemanas(await cargar(lastFiltros));
    } catch {
      setErr("Los cambios se guardaron, pero no se pudo recargar el reporte. Vuelve a generarlo.");
    } finally {
      setSaving(false);
    }
  }

  // ── Agregados del período ──
  const multi = (semanas?.length ?? 0) > 1;
  const rango =
    semanas && semanas.length > 0
      ? { desde: semanas[0].rango.desde, hasta: semanas[semanas.length - 1].rango.hasta }
      : null;
  const totales = useMemo(() => (semanas ? totalesPeriodo(semanas) : []), [semanas]);
  const promedio = useMemo(() => (semanas ? semanaPromedio(semanas) : []), [semanas]);

  const filasVisibles = (s: ReporteAsistenciaResponse) => s.filas.filter((f) => !hiddenRows.has(f.empleado.id));
  const totalesVisibles = totales.filter((t) => !hiddenRows.has(t.empleado.id));
  const promedioVisible = promedio.filter((f) => !hiddenRows.has(f.empleado.id));

  function descargarPDF() {
    if (!semanas || semanas.length === 0 || !rango) return;
    setExporting(true);
    try {
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      semanas.forEach((s, i) => {
        if (i > 0) pdf.addPage();
        hojaSemanaPDF(pdf, s, filasVisibles(s));
      });
      // La semana promedio no entra: el PDF es el documento de nómina.
      if (multi) {
        pdf.addPage();
        hojaTotalesPDF(pdf, totalesVisibles, rango.desde, rango.hasta, semanas.length);
      }
      pdf.save(
        multi
          ? `control-asistencia-${rango.desde}_a_${rango.hasta}.pdf`
          : `control-asistencia-semana-${semanas[0].semana}.pdf`
      );
    } catch (e) {
      console.error("Error generando PDF:", e);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <FiltrosReporte onFilter={handleFilter} loading={loading} employees={employees} />

      {err && (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm font-medium text-rose-700 flex items-center gap-3">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {err}
        </div>
      )}

      {loading && !semanas && (
        <div className="flex flex-col items-center gap-3 py-16 text-k-text-b">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-xs font-bold uppercase tracking-widest">Generando reporte...</span>
        </div>
      )}

      {semanas && semanas.length > 0 && rango && (
        <div className="space-y-4">
          {/* Barra de acciones */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-k-text-b">
              Mostrando <span className="font-bold text-k-text-h">{totalesVisibles.length}</span> de{" "}
              <span className="font-bold text-k-text-h">{totales.length}</span> empleados
              {multi && (
                <>
                  {" · "}
                  <span className="font-bold text-k-text-h">{semanas.length}</span> semanas
                </>
              )}
              {hiddenRows.size > 0 && (
                <button
                  onClick={resetRows}
                  className="ml-3 inline-flex items-center gap-1 text-xs font-bold text-k-text-h hover:text-obsidian transition"
                >
                  <RotateCcw className="h-3 w-3" />
                  Restablecer
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {editMode ? (
                <>
                  <input
                    type="text"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Motivo (ej. Olvidaron marcar)"
                    className="w-56 rounded-xl border border-k-border bg-k-bg-card px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-obsidian/10"
                  />
                  <button
                    onClick={guardarCambios}
                    disabled={saving || cambiosCount === 0}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 text-white px-4 py-2.5 text-sm font-bold hover:bg-emerald-700 transition disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Guardar {cambiosCount} cambio{cambiosCount !== 1 ? "s" : ""}
                  </button>
                  <button
                    onClick={cancelarEdicion}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl border border-k-border bg-k-bg-card px-4 py-2.5 text-sm font-bold text-k-text-b hover:bg-k-bg-card2 transition disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                    Cancelar
                  </button>
                </>
              ) : (
                <>
                  {multi && (
                    <button
                      onClick={() => setVerPromedio((p) => !p)}
                      className={cx(
                        "inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition",
                        verPromedio
                          ? "bg-sky-600 border-sky-600 text-white hover:bg-sky-700"
                          : "border-k-border bg-k-bg-card text-k-text-h hover:bg-k-bg-card2"
                      )}
                      title="Tabla aislada, solo de muestra: no afecta la nómina ni el PDF"
                    >
                      <Sigma className="h-4 w-4" />
                      {verPromedio ? "Ocultar promedio" : "Ver semana promedio"}
                    </button>
                  )}
                  <button
                    onClick={() => setEditMode(true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-k-border bg-k-bg-card px-4 py-2.5 text-sm font-bold text-k-text-h hover:bg-k-bg-card2 transition"
                    title="Corrige entradas y salidas de todo el período en una sola pantalla"
                  >
                    <Pencil className="h-4 w-4" />
                    Editar horas
                  </button>
                </>
              )}
              <button
                onClick={descargarPDF}
                disabled={exporting || editMode}
                className="inline-flex items-center gap-2 rounded-xl bg-k-bg-sidebar text-white px-4 py-2.5 text-sm font-bold hover:bg-obsidian transition disabled:opacity-50"
              >
                {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {exporting ? "Generando PDF..." : "Descargar PDF"}
              </button>
            </div>
          </div>

          {/* Panel: aplicar las mismas horas a toda una semana de un empleado */}
          {editMode && fillRow && (
            <div className="rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4 flex flex-wrap items-end gap-3">
              <div className="min-w-[180px]">
                <div className="text-[10px] font-bold text-sky-700 uppercase tracking-widest">
                  Semana {semanas[fillRow.semanaIdx]?.semana}
                </div>
                <div className="text-sm font-black text-k-text-h">{fillRow.nombre}</div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-k-text-b uppercase tracking-widest mb-1">Entrada</label>
                <input
                  type="time"
                  value={fillRow.entrada}
                  onChange={(e) => setFillRow({ ...fillRow, entrada: e.target.value })}
                  className="rounded-xl border border-k-border bg-white px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-obsidian/10"
                  style={{ color: ENTRADA_COLOR }}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-k-text-b uppercase tracking-widest mb-1">Salida</label>
                <input
                  type="time"
                  value={fillRow.salida}
                  onChange={(e) => setFillRow({ ...fillRow, salida: e.target.value })}
                  className="rounded-xl border border-k-border bg-white px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-obsidian/10"
                  style={{ color: SALIDA_COLOR }}
                />
              </div>
              <label className="flex items-center gap-2 text-xs font-bold text-k-text-b pb-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fillRow.overwrite}
                  onChange={(e) => setFillRow({ ...fillRow, overwrite: e.target.checked })}
                  className="h-4 w-4 rounded border-k-border"
                />
                Sobrescribir las que ya tienen hora
              </label>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={aplicarSemana}
                  disabled={!fillRow.entrada && !fillRow.salida}
                  className="inline-flex items-center gap-2 rounded-xl bg-sky-600 text-white px-4 py-2 text-sm font-bold hover:bg-sky-700 transition disabled:opacity-50"
                >
                  <CalendarRange className="h-4 w-4" />
                  Aplicar a la semana
                </button>
                <button
                  onClick={() => setFillRow(null)}
                  className="rounded-xl border border-k-border bg-white px-3 py-2 text-sm font-bold text-k-text-b hover:bg-k-bg-card2 transition"
                >
                  Cancelar
                </button>
              </div>
              <p className="w-full text-[11px] text-sky-700">
                Se aplica a los días laborables de esa semana hasta hoy (no toca descansos, festivos, vacaciones ni
                incapacidades). Sin "Sobrescribir", solo rellena los días que no tienen esa hora. Los cambios quedan
                pendientes hasta que pulses Guardar.
              </p>
            </div>
          )}

          {/* Reporte */}
          <div className="space-y-4 bg-white p-4 rounded-[28px]">
            {/* Header del reporte */}
            <div className="rounded-[28px] border border-k-border bg-k-bg-card p-6 shadow-k-card">
              <div className="flex items-start justify-between">
                <div className="text-center flex-1">
                  <h2 className="text-xl font-black text-k-text-h tracking-tight uppercase">Control de Asistencia</h2>
                  <p className="text-sm text-k-text-b mt-1">
                    del{" "}
                    <span className="font-bold">
                      {new Date(rango.desde + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "long" })}
                    </span>{" "}
                    al{" "}
                    <span className="font-bold">
                      {new Date(rango.hasta + "T12:00:00").toLocaleDateString("es-MX", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </p>
                </div>
                <div className="text-center shrink-0 ml-4">
                  <div className="text-[10px] font-bold text-k-text-b uppercase tracking-widest">
                    {multi ? "Semanas" : "Semana"}
                  </div>
                  <div className="text-5xl font-black text-k-text-h">
                    {multi ? semanas.length : semanas[0].semana}
                  </div>
                </div>
              </div>
            </div>

            {/* Leyenda */}
            <div className="rounded-[20px] border border-k-border bg-k-bg-card p-4 shadow-k-card">
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                {[...LEYENDA, { label: "FIRMA DE CONFORMIDAD", color: "transparent" }].map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <div
                      className="h-3 w-3 rounded-sm border border-neutral-200 shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-[9px] font-bold uppercase tracking-wider text-k-text-b">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Una matriz por semana */}
            {semanas.map((s, idx) => (
              <MatrizSemana
                key={`${s.anio}-${s.semana}-${s.rango.desde}`}
                semana={s}
                semanaIdx={idx}
                filas={filasVisibles(s)}
                mostrarTitulo={multi}
                editMode={editMode}
                changes={changes}
                hoy={hoy}
                fillRow={fillRow}
                onDraft={setDraft}
                onFill={(semanaIdx, fila) =>
                  setFillRow({
                    semanaIdx,
                    empId: fila.empleado.id,
                    nombre: fila.empleado.nombre,
                    entrada: "",
                    salida: "",
                    overwrite: false,
                  })
                }
                onHideRow={hideRow}
              />
            ))}

            {/* Totales del período */}
            {multi && totalesVisibles.length > 0 && <TablaTotales totales={totalesVisibles} />}
          </div>

          {/* Semana promedio: fuera del contenedor del reporte, solo de muestra */}
          {verPromedio && multi && <SeccionPromedio filas={promedioVisible} semanas={semanas.length} />}
        </div>
      )}
    </div>
  );
}
