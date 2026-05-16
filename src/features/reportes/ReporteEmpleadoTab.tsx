// src/features/reportes/ReporteEmpleadoTab.tsx
import { useState, useCallback } from "react";
import {
  getReporteEmpleado,
  type FiltrosAsistencia,
  type ReporteEmpleadoResponse,
} from "./api";
import { minutesToHHMM } from "@/features/attendance/api";
import FiltrosReporte from "./FiltrosReporte";
import { Loader2, AlertTriangle, Clock, Calendar, UserCheck, Coffee, AlertCircle } from "lucide-react";
import { cx } from "@/lib/utils";

type EmployeeOption = { id: string; full_name?: string; name?: string };

const ESTADO_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  presente: { bg: "bg-emerald-50 border-emerald-100 text-emerald-600", text: "", label: "Presente" },
  falta: { bg: "bg-rose-50 border-rose-100 text-rose-600", text: "", label: "Falta" },
  descanso: { bg: "bg-sky-50 border-sky-100 text-sky-600", text: "", label: "Descanso" },
  vacaciones: { bg: "bg-violet-50 border-violet-100 text-violet-600", text: "", label: "Vacaciones" },
  incapacidad: { bg: "bg-blue-50 border-blue-100 text-blue-600", text: "", label: "Incapacidad" },
  festivo: { bg: "bg-purple-50 border-purple-100 text-purple-600", text: "", label: "Festivo" },
  retardo: { bg: "bg-amber-50 border-amber-100 text-amber-600", text: "", label: "Retardo" },
  en_turno: { bg: "bg-yellow-50 border-yellow-100 text-yellow-600", text: "", label: "En turno" },
  ausente: { bg: "bg-neutral-50 border-neutral-100 text-neutral-500", text: "", label: "Ausente" },
};

function formatHora(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export default function ReporteEmpleadoTab({ employees }: { employees: EmployeeOption[] }) {
  const [selectedEmp, setSelectedEmp] = useState<string>("");
  const [data, setData] = useState<ReporteEmpleadoResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleFilter = useCallback(
    async (filtros: FiltrosAsistencia) => {
      if (!selectedEmp) {
        setErr("Selecciona un empleado primero");
        return;
      }
      setLoading(true);
      setErr(null);
      try {
        const res = await getReporteEmpleado(selectedEmp, filtros);
        setData(res);
      } catch (e: any) {
        setErr(e?.response?.data?.message ?? "Error al generar el reporte");
      } finally {
        setLoading(false);
      }
    },
    [selectedEmp]
  );

  return (
    <div className="space-y-6">
      {/* Selector de empleado */}
      <div className="rounded-[28px] border border-k-border bg-k-bg-card p-5 shadow-k-card space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-k-text-h">
          <UserCheck className="h-4 w-4 text-k-text-b" />
          Empleado
        </div>
        <select
          value={selectedEmp}
          onChange={(e) => setSelectedEmp(e.target.value)}
          className="w-full md:w-80 rounded-xl border border-k-border bg-k-bg-card2 px-4 py-3 text-sm font-medium text-k-text-h outline-none focus:ring-2 focus:ring-obsidian/10"
        >
          <option value="">Selecciona un empleado...</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.full_name ?? emp.name ?? "Empleado"}
            </option>
          ))}
        </select>
      </div>

      <FiltrosReporte
        onFilter={handleFilter}
        loading={loading}
        modoEmpleado
        empleadoId={selectedEmp}
      />

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
        <div className="space-y-6">
          {/* Info del empleado */}
          <div className="rounded-[28px] border border-k-border bg-k-bg-card p-6 shadow-k-card">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-k-text-h tracking-tight">{data.empleado.nombre}</h3>
                {data.empleado.position_title && (
                  <p className="text-sm text-k-text-b mt-1">{data.empleado.position_title}</p>
                )}
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold text-k-text-b uppercase tracking-widest">Período</div>
                <div className="text-sm font-bold text-k-text-h">
                  {new Date(data.periodo.desde + "T12:00:00").toLocaleDateString("es-MX")} —{" "}
                  {new Date(data.periodo.hasta + "T12:00:00").toLocaleDateString("es-MX")}
                </div>
              </div>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              {
                label: "Días trabajados",
                val: data.resumen.dias_trabajados,
                icon: Calendar,
              },
              {
                label: "Faltas",
                val: data.resumen.dias_faltas,
                icon: AlertCircle,
              },
              {
                label: "Descansos",
                val: data.resumen.dias_descanso,
                icon: Coffee,
              },
              {
                label: "Horas totales",
                val: minutesToHHMM(data.resumen.total_horas),
                icon: Clock,
              },
              {
                label: "Retardos",
                val: data.resumen.total_retardos,
                icon: AlertCircle,
              },
              {
                label: "Comida promedio",
                val: `${Math.round(data.resumen.promedio_comida_minutos)}m`,
                icon: Coffee,
              },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-[24px] border border-k-border bg-k-bg-card p-4 text-center shadow-k-card"
              >
                <kpi.icon className="h-5 w-5 mx-auto mb-2 text-neutral-200" />
                <div className="text-xl font-black text-k-text-h">{kpi.val}</div>
                <div className="text-[10px] font-bold text-k-text-b uppercase tracking-widest mt-1">
                  {kpi.label}
                </div>
              </div>
            ))}
          </div>

          {/* Tabla detalle */}
          <div className="rounded-[28px] border border-k-border bg-k-bg-card shadow-k-card overflow-hidden">
            <div className="px-6 py-5 border-b border-k-border">
              <h3 className="text-lg font-black text-k-text-h tracking-tight">Detalle diario</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-k-bg-card2/80 border-b border-k-border">
                  <tr>
                    {["Fecha", "Entrada", "Salida", "Estado", "Horas", "Comida", "Retardo"].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-[10px] font-bold text-k-text-b uppercase tracking-[0.1em]"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.detalle.map((row, idx) => {
                    const badge = ESTADO_BADGE[row.estado] ?? ESTADO_BADGE.ausente;
                    return (
                      <tr key={idx} className="border-t border-k-border hover:bg-k-bg-card2/30 transition">
                        <td className="px-4 py-3 text-sm font-bold text-k-text-h whitespace-nowrap">
                          {new Date(row.fecha + "T12:00:00").toLocaleDateString("es-MX", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          })}
                        </td>
                        <td className="px-4 py-3 text-sm text-k-text-h">{formatHora(row.entrada)}</td>
                        <td className="px-4 py-3 text-sm text-k-text-b">{formatHora(row.salida)}</td>
                        <td className="px-4 py-3">
                          <span
                            className={cx(
                              "inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                              badge.bg,
                              badge.text
                            )}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-k-text-h">
                          {minutesToHHMM(row.horas_trabajadas)}
                        </td>
                        <td className="px-4 py-3 text-sm text-k-text-b">
                          {row.tiempo_comida_minutos > 0 ? `${row.tiempo_comida_minutos}m` : "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-k-text-b">
                          {row.retardos_minutos ? `${row.retardos_minutos}m` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                  {data.detalle.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-8 py-12 text-center text-k-text-b text-sm">
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

