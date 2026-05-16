// src/features/reportes/ReporteAsistenciaTab.tsx
import { useState, useCallback } from "react";
import {
  getReporteAsistenciaSemanal,
  DIAS_ORDEN,
  type FiltrosAsistencia,
  type ReporteAsistenciaResponse,
} from "./api";
import { minutesToHHMM } from "@/features/attendance/api";
import FiltrosReporte from "./FiltrosReporte";
import { Loader2, AlertTriangle } from "lucide-react";
import { cx } from "@/lib/utils";

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

  // Si tiene entrada/salida, mostrar horas (fondo blanco o del estado)
  // Si es estado puro sin horas (falta, descanso, etc.), mostrar label del estado con fondo coloreado
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

  const handleFilter = useCallback(async (filtros: FiltrosAsistencia) => {
    setLoading(true);
    setErr(null);
    try {
      const res = await getReporteAsistenciaSemanal(filtros);
      setData(res);
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "Error al generar el reporte");
    } finally {
      setLoading(false);
    }
  }, []);

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
                <div className="text-4xl font-black text-k-text-h">{data.semana}</div>
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
                  </tr>
                </thead>
                <tbody>
                  {data.filas.map((fila) => (
                    <tr key={fila.empleado.id} className="border-t border-k-border hover:bg-k-bg-card2/30 transition">
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
                      <td className="px-3 py-2">
                        <div className="h-8 w-full border-b border-dashed border-neutral-300" />
                      </td>
                    </tr>
                  ))}

                  {data.filas.length === 0 && (
                    <tr>
                      <td colSpan={12} className="px-8 py-12 text-center text-k-text-b text-sm">
                        No hay registros para el período seleccionado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
