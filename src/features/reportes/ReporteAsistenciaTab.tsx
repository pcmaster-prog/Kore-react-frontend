// src/features/reportes/ReporteAsistenciaTab.tsx
import { useState, useCallback, useRef } from "react";
import {
  getReporteAsistenciaSemanal,
  DIAS_ORDEN,
  type FiltrosAsistencia,
  type ReporteAsistenciaResponse,
} from "./api";
import { minutesToHHMM } from "@/features/attendance/api";
import FiltrosReporte from "./FiltrosReporte";
import { Loader2, AlertTriangle, Download, Trash2, RotateCcw } from "lucide-react";
import { cx } from "@/lib/utils";
import jsPDF from "jspdf";
import domtoimage from "dom-to-image-more";

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

function formatHora(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function CeldaDia({ dia }: { dia?: { fecha: string; entrada?: string | null; salida?: string | null; estado: string } }) {
  if (!dia) {
    return <div className="h-full flex items-center justify-center text-[10px] text-neutral-300">—</div>;
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

export default function ReporteAsistenciaTab({ employees }: { employees: EmployeeOption[] }) {
  const [data, setData] = useState<ReporteAsistenciaResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [hiddenRows, setHiddenRows] = useState<Set<string>>(new Set());
  const reportRef = useRef<HTMLDivElement>(null);

  const handleFilter = useCallback(async (filtros: FiltrosAsistencia) => {
    setLoading(true);
    setErr(null);
    setHiddenRows(new Set());
    try {
      const res = await getReporteAsistenciaSemanal(filtros);
      setData(res);
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "Error al generar el reporte");
    } finally {
      setLoading(false);
    }
  }, []);

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

  const visibleFilas = data?.filas.filter((f) => !hiddenRows.has(f.empleado.id)) ?? [];
  const totalFilas = data?.filas.length ?? 0;

  async function descargarPDF() {
    const el = reportRef.current;
    if (!el || !data) return;
    setExporting(true);
    try {
      // Clonar el nodo para limpiar bordes sin afectar la UI visible
      const clone = el.cloneNode(true) as HTMLElement;
      clone.style.position = "fixed";
      clone.style.top = "-99999px";
      clone.style.left = "-99999px";
      clone.style.width = `${el.scrollWidth}px`;
      clone.style.backgroundColor = "#ffffff";
      clone.style.padding = "16px";
      document.body.appendChild(clone);

      // Quitar TODOS los bordes, scrollbars y overflow para capturar TODO el contenido
      const allEls = clone.querySelectorAll("*");
      allEls.forEach((e) => {
        const he = e as HTMLElement;
        he.style.setProperty("border", "none", "important");
        he.style.setProperty("border-top", "none", "important");
        he.style.setProperty("border-bottom", "none", "important");
        he.style.setProperty("border-left", "none", "important");
        he.style.setProperty("border-right", "none", "important");
        he.style.setProperty("box-shadow", "none", "important");
        he.style.setProperty("outline", "none", "important");
        he.style.setProperty("transition", "none", "important");
        he.style.setProperty("animation", "none", "important");
        // Expandir todo: quitar overflow para que nada se corte
        he.style.setProperty("overflow", "visible", "important");
        he.style.setProperty("overflow-x", "visible", "important");
        he.style.setProperty("overflow-y", "visible", "important");
        // Ocultar scrollbars
        he.style.setProperty("scrollbar-width", "none", "important");
        // Quitar position sticky / fixed que causa artefactos
        const pos = getComputedStyle(he).position;
        if (pos === "sticky" || pos === "fixed") {
          he.style.setProperty("position", "static", "important");
        }
      });

      // Inyectar CSS para ocultar scrollbars de WebKit (Chrome) en el clon
      const hideScrollStyle = document.createElement("style");
      hideScrollStyle.textContent = "::-webkit-scrollbar { display: none !important; }";
      clone.appendChild(hideScrollStyle);

      // Forzar que el clon y la tabla usen ancho/altura auto para mostrar todo
      clone.style.setProperty("height", "auto", "important");
      clone.style.setProperty("max-height", "none", "important");
      const table = clone.querySelector("table");
      if (table) {
        (table as HTMLElement).style.setProperty("width", "max-content", "important");
      }

      // Separación visual: fondos alternados en filas
      clone.querySelectorAll("tbody tr").forEach((tr, i) => {
        const he = tr as HTMLElement;
        he.style.backgroundColor = i % 2 === 0 ? "#ffffff" : "#f8f9fa";
      });

      // Header con fondo gris claro
      clone.querySelectorAll("thead th").forEach((th) => {
        const he = th as HTMLElement;
        he.style.backgroundColor = "#f3f4f6";
        he.style.fontWeight = "700";
      });

      // Quitar columna de acciones (botón eliminar) del PDF
      clone.querySelectorAll("th:last-child, td:last-child").forEach((cell) => {
        const he = cell as HTMLElement;
        if (he.querySelector("button") || he.innerHTML.trim() === "") {
          (he as HTMLElement).style.setProperty("display", "none", "important");
        }
      });

      const scale = 2;
      const dataUrl = await domtoimage.toPng(clone, {
        width: clone.scrollWidth * scale,
        height: clone.scrollHeight * scale,
        style: {
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          width: `${clone.scrollWidth}px`,
          height: `${clone.scrollHeight}px`,
          backgroundColor: "#ffffff",
        },
      });

      document.body.removeChild(clone);

      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => { img.onload = resolve; });
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const imgH = (img.height * pdfW) / img.width;
      let yPos = 0;
      while (yPos < imgH) {
        if (yPos > 0) pdf.addPage();
        pdf.addImage(dataUrl, "PNG", 0, -yPos, pdfW, imgH);
        yPos += pdfH;
      }
      pdf.save(`control-asistencia-semana-${data.semana}.pdf`);
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

      {loading && !data && (
        <div className="flex flex-col items-center gap-3 py-16 text-k-text-b">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-xs font-bold uppercase tracking-widest">Generando reporte...</span>
        </div>
      )}

      {data && (
        <div className="space-y-4">
          {/* Barra de acciones */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-k-text-b">
              Mostrando <span className="font-bold text-k-text-h">{visibleFilas.length}</span> de{" "}
              <span className="font-bold text-k-text-h">{totalFilas}</span> empleados
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
            <button
              onClick={descargarPDF}
              disabled={exporting}
              className="inline-flex items-center gap-2 rounded-xl bg-k-bg-sidebar text-white px-4 py-2.5 text-sm font-bold hover:bg-obsidian transition disabled:opacity-50"
            >
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {exporting ? "Generando PDF..." : "Descargar PDF"}
            </button>
          </div>

          {/* Contenedor del reporte (se captura para PDF) */}
          <div ref={reportRef} className="space-y-4 bg-white p-4 rounded-[28px]">
            {/* Header del reporte */}
            <div className="rounded-[28px] border border-k-border bg-k-bg-card p-6 shadow-k-card">
              <div className="flex items-start justify-between">
                <div className="text-center flex-1">
                  <h2 className="text-xl font-black text-k-text-h tracking-tight uppercase">
                    Control de Asistencia
                  </h2>
                  <p className="text-sm text-k-text-b mt-1">
                    del{" "}
                    <span className="font-bold">
                      {new Date(data.rango.desde + "T12:00:00").toLocaleDateString("es-MX", {
                        day: "numeric",
                        month: "long",
                      })}
                    </span>{" "}
                    al{" "}
                    <span className="font-bold">
                      {new Date(data.rango.hasta + "T12:00:00").toLocaleDateString("es-MX", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </p>
                </div>
                <div className="text-center shrink-0 ml-4">
                  <div className="text-[10px] font-bold text-k-text-b uppercase tracking-widest">Semana</div>
                  <div className="text-5xl font-black text-k-text-h">{data.semana}</div>
                </div>
              </div>
            </div>

            {/* Leyenda */}
            <div className="rounded-[20px] border border-k-border bg-k-bg-card p-4 shadow-k-card">
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                {[
                  { label: "COMIDA 30 min", color: COMIDA_COLOR },
                  { label: "ENTRADA", color: ENTRADA_COLOR },
                  { label: "SALIDA", color: SALIDA_COLOR },
                  { label: "FALTA", color: ESTADO_COLORES.falta.bg },
                  { label: "DESCANSO", color: ESTADO_COLORES.descanso.bg },
                  { label: "INCAPACIDAD", color: ESTADO_COLORES.incapacidad.bg },
                  { label: "VACACIONES", color: ESTADO_COLORES.vacaciones.bg },
                  { label: "HORAS TOTAL", color: TOTAL_COLOR },
                  { label: "FIRMA DE CONFORMIDAD", color: "transparent" },
                ].map((item) => (
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

            {/* Tabla matriz */}
            <div className="rounded-[28px] border border-k-border bg-k-bg-card shadow-k-card overflow-hidden">
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
                    {visibleFilas.map((fila) => (
                      <tr key={fila.empleado.id} className="border-t border-k-border hover:bg-k-bg-card2/30 transition group">
                        {/* Nombre */}
                        <td className="px-3 py-2 sticky left-0 bg-k-bg-card border-r border-k-border z-10">
                          <div className="text-sm font-bold text-k-text-h whitespace-nowrap">{fila.empleado.nombre}</div>
                          {fila.empleado.position_title && (
                            <div className="text-[9px] text-k-text-b">{fila.empleado.position_title}</div>
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
                            />
                          </td>
                        ))}

                        {/* Total */}
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
                            onClick={() => hideRow(fila.empleado.id)}
                            className="h-7 w-7 rounded-lg border border-k-border bg-k-bg-card2 flex items-center justify-center hover:bg-rose-50 hover:border-rose-200 hover:text-rose-500 transition opacity-0 group-hover:opacity-100"
                            title="Quitar del reporte"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {visibleFilas.length === 0 && (
                      <tr>
                        <td colSpan={13} className="px-8 py-12 text-center text-k-text-b text-sm">
                          No hay registros para el período seleccionado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

