// src/features/tardiness/TardinessReportTab.tsx
// Admin monthly report of employee tardiness (§3.9)
import { useState, useEffect } from "react";
import {
  getMonthlySummary,
  getEmployeeDetail,
  type TardinessMonthlySummary,
  type EmployeeTardinessDetail,
  type EmployeeLateRecord,
} from "./api";
import {
  Loader2, AlertTriangle, CheckCircle2, Clock,
  ChevronDown, ChevronUp, X,
} from "lucide-react";

function cx(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(" ");
}

function EmployeeDetailModal({
  detail,
  onClose,
}: {
  detail: EmployeeTardinessDetail;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-obsidian/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-k-bg-card rounded-[32px] border border-k-border shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 px-6 py-5 border-b border-k-border bg-k-bg-card2/80 backdrop-blur-sm flex items-center justify-between z-10 rounded-t-[32px]">
          <div>
            <h3 className="text-lg font-black text-k-text-h tracking-tight">{detail.empleado_name}</h3>
            <p className="text-[10px] font-bold text-k-text-b uppercase tracking-widest mt-0.5">
              Detalle de retardos · {detail.period}
            </p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-xl bg-k-bg-card2 border border-k-border flex items-center justify-center hover:bg-neutral-200 transition">
            <X className="h-4 w-4 text-k-text-b" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Lates table */}
          <div>
            <div className="text-[10px] font-bold text-k-text-b uppercase tracking-widest mb-3">Retardos registrados</div>
            {detail.lates.length === 0 ? (
              <div className="text-sm text-k-text-b text-center py-4">Sin retardos en este periodo</div>
            ) : (
              <div className="space-y-2">
                {detail.lates.map((l, i) => (
                  <div key={i} className={cx(
                    "rounded-2xl border p-3 flex items-center justify-between",
                    l.converted_to_absence
                      ? "border-rose-200 bg-rose-50"
                      : "border-k-border bg-k-bg-card"
                  )}>
                    <div className="flex items-center gap-3">
                      <div className={cx(
                        "h-8 w-8 rounded-xl flex items-center justify-center text-xs font-black",
                        l.converted_to_absence
                          ? "bg-rose-100 text-rose-600"
                          : "bg-amber-100 text-amber-600"
                      )}>
                        {l.late_minutes}m
                      </div>
                      <div>
                        <div className="text-sm font-bold text-k-text-h">
                          {new Date(l.date + "T12:00:00").toLocaleDateString("es-MX", {
                            weekday: "long", day: "numeric", month: "short"
                          })}
                        </div>
                      </div>
                    </div>
                    {l.converted_to_absence && (
                      <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">
                        → Falta
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Absences generated */}
          {detail.absences.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-k-text-b uppercase tracking-widest mb-3">Faltas generadas</div>
              <div className="space-y-2">
                {detail.absences.map(a => (
                  <div key={a.id} className="rounded-2xl border border-rose-200 bg-rose-50 p-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-rose-700">
                        {a.type === "late_accumulation" ? "Acumulación de retardos" : a.type}
                      </div>
                      <div className="text-xs text-rose-600 mt-0.5">
                        {a.affects_rest_day_payment ? "⚠️ Afecta pago de descanso" : "Sin penalización en descanso"}
                      </div>
                    </div>
                    <div className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">
                      {new Date(a.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TardinessReportTab() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<TardinessMonthlySummary | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [sortBy, setSortBy] = useState<"name" | "lates" | "minutes">("lates");
  const [sortAsc, setSortAsc] = useState(false);

  // Detail modal
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<EmployeeTardinessDetail | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const data = await getMonthlySummary(month);
        setSummary(data);
      } catch {
        setErr("No se pudo cargar el reporte de retardos");
      } finally {
        setLoading(false);
      }
    })();
  }, [month]);

  async function openDetail(empleadoId: string) {
    setDetailLoading(true);
    try {
      const d = await getEmployeeDetail(empleadoId);
      setDetail(d);
    } catch {
      // silent
    } finally {
      setDetailLoading(false);
    }
  }

  function toggleSort(col: typeof sortBy) {
    if (sortBy === col) setSortAsc(!sortAsc);
    else { setSortBy(col); setSortAsc(false); }
  }

  const sorted = [...(summary?.summary ?? [])].sort((a, b) => {
    let diff = 0;
    if (sortBy === "name") diff = a.empleado_name.localeCompare(b.empleado_name);
    else if (sortBy === "lates") diff = a.total_lates - b.total_lates;
    else diff = a.total_late_minutes - b.total_late_minutes;
    return sortAsc ? diff : -diff;
  });

  const totalLates = sorted.reduce((s, r) => s + r.total_lates, 0);
  const totalMinutes = sorted.reduce((s, r) => s + r.total_late_minutes, 0);
  const withPenalty = sorted.filter(r => r.rest_day_penalized).length;

  if (loading) {
    return (
      <div className="rounded-[40px] border border-k-border bg-k-bg-card p-16 flex flex-col items-center gap-3">
        <Loader2 className="h-10 w-10 text-k-text-h animate-spin" />
        <span className="text-[10px] font-bold text-k-text-b uppercase tracking-widest">Cargando reporte...</span>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-[40px] border border-k-border bg-k-bg-card shadow-k-card overflow-hidden animate-in-up">
        <div className="px-8 py-6 border-b border-k-border bg-k-bg-card2/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-k-text-h tracking-tight">Reporte de Retardos</h2>
            <p className="text-[11px] font-bold text-k-text-b uppercase tracking-widest mt-1">
              Resumen mensual de puntualidad del equipo
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="month"
              value={month}
              onChange={e => setMonth(e.target.value)}
              className="rounded-2xl border border-k-border bg-k-bg-card px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-obsidian/10 transition-all"
            />
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          {err && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5" /> {err}
            </div>
          )}

          {/* Summary KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-[24px] border border-k-border bg-k-bg-card2/50 p-4 text-center">
              <div className="text-2xl font-black text-k-text-h">{sorted.length}</div>
              <div className="text-[10px] font-bold text-k-text-b uppercase tracking-widest mt-1">Empleados</div>
            </div>
            <div className="rounded-[24px] border border-amber-200 bg-amber-50/50 p-4 text-center">
              <div className="text-2xl font-black text-amber-600">{totalLates}</div>
              <div className="text-[10px] font-bold text-k-text-b uppercase tracking-widest mt-1">Total Retardos</div>
            </div>
            <div className="rounded-[24px] border border-k-border bg-k-bg-card2/50 p-4 text-center">
              <div className="text-2xl font-black text-k-text-h">{totalMinutes}m</div>
              <div className="text-[10px] font-bold text-k-text-b uppercase tracking-widest mt-1">Min. Acumulados</div>
            </div>
            <div className="rounded-[24px] border border-rose-200 bg-rose-50/50 p-4 text-center">
              <div className="text-2xl font-black text-rose-600">{withPenalty}</div>
              <div className="text-[10px] font-bold text-k-text-b uppercase tracking-widest mt-1">Penalizados</div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-[28px] border border-k-border">
            <table className="w-full text-left border-collapse">
              <thead className="bg-k-bg-card2/80 border-b border-k-border">
                <tr>
                  <th className="px-5 py-4 text-[10px] font-bold text-k-text-b uppercase tracking-widest">
                    <button onClick={() => toggleSort("name")} className="inline-flex items-center gap-1 hover:text-k-text-h transition">
                      Empleado {sortBy === "name" && (sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                    </button>
                  </th>
                  <th className="px-5 py-4 text-[10px] font-bold text-k-text-b uppercase tracking-widest text-center">
                    <button onClick={() => toggleSort("lates")} className="inline-flex items-center gap-1 hover:text-k-text-h transition">
                      Retardos {sortBy === "lates" && (sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                    </button>
                  </th>
                  <th className="px-5 py-4 text-[10px] font-bold text-k-text-b uppercase tracking-widest text-center">
                    <button onClick={() => toggleSort("minutes")} className="inline-flex items-center gap-1 hover:text-k-text-h transition">
                      Minutos {sortBy === "minutes" && (sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                    </button>
                  </th>
                  <th className="px-5 py-4 text-[10px] font-bold text-k-text-b uppercase tracking-widest text-center">Faltas</th>
                  <th className="px-5 py-4 text-[10px] font-bold text-k-text-b uppercase tracking-widest text-center">Descanso</th>
                  <th className="px-5 py-4 text-[10px] font-bold text-k-text-b uppercase tracking-widest text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(emp => (
                  <tr key={emp.empleado_id} className="border-t border-k-border hover:bg-k-bg-card2/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="text-sm font-black text-k-text-h">{emp.empleado_name}</div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={cx(
                        "inline-flex items-center justify-center h-8 w-8 rounded-xl text-sm font-black",
                        emp.total_lates >= (summary?.config.lates_to_absence ?? 3)
                          ? "bg-rose-100 text-rose-600 border border-rose-200"
                          : emp.total_lates > 0
                            ? "bg-amber-100 text-amber-600 border border-amber-200"
                            : "bg-emerald-100 text-emerald-600 border border-emerald-200"
                      )}>
                        {emp.total_lates}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center text-sm font-bold text-k-text-h">
                      {emp.total_late_minutes}m
                    </td>
                    <td className="px-5 py-4 text-center text-sm font-bold text-k-text-h">
                      {emp.absences_generated}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {emp.rest_day_penalized ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 uppercase tracking-widest">
                          <AlertTriangle className="h-3 w-3" /> Sin pago
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                          <CheckCircle2 className="h-3 w-3" /> Normal
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => openDetail(emp.empleado_id)}
                        disabled={detailLoading}
                        className="text-[10px] font-bold text-k-text-b uppercase tracking-widest hover:text-k-text-h transition px-3 py-1.5 rounded-xl border border-k-border bg-k-bg-card hover:bg-k-bg-card2 disabled:opacity-50"
                      >
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {sorted.length === 0 && (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 text-emerald-200 mx-auto mb-4" />
              <div className="text-sm font-black text-k-text-h tracking-tight">¡Puntualidad perfecta!</div>
              <div className="text-xs text-k-text-b mt-1">No hay retardos registrados este mes</div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {detail && <EmployeeDetailModal detail={detail} onClose={() => setDetail(null)} />}
    </>
  );
}
