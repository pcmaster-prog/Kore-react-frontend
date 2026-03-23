// src/features/attendance/ManagerAttendancePage.tsx
import { useEffect, useState, useCallback } from "react";
import {
  getByDate,
  getWeeklySummary,
  minutesToHHMM,
  formatTime,
  type ByDateItem,
  type WeeklySummary,
} from "./api";
import {
  Users, UserX, Clock, RefreshCw, Calendar,
  CheckCircle2, AlertTriangle, Timer, Loader2,
} from "lucide-react";

function cx(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(" ");
}

type Employee = { id: string; full_name?: string; name?: string; position_title?: string };

function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
  const colors = ["bg-blue-100 text-blue-700","bg-violet-100 text-violet-700","bg-emerald-100 text-emerald-700","bg-amber-100 text-amber-700","bg-rose-100 text-rose-700","bg-sky-100 text-sky-700"];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={cx("h-10 w-10 rounded-2xl flex items-center justify-center text-xs font-bold shrink-0", color)}>
      {initials}
    </div>
  );
}

function StatusBadge({ item }: { item: ByDateItem }) {
  const checkedIn = !!item.first_check_in_at;
  const closed = item.status === "closed" || !!item.last_check_out_at;
  if ((item as any).is_rest_day || (item as any).state === "rest")
    return <span className="inline-flex items-center gap-1.5 rounded-xl border border-sky-100 bg-sky-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-600">Descanso</span>;
  if (!checkedIn)
    return <span className="inline-flex items-center gap-1.5 rounded-xl border border-rose-100 bg-rose-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-500"><span className="h-1.5 w-1.5 rounded-full bg-rose-400" />Ausente</span>;
  if (closed)
    return <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Presente</span>;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-100 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-600">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />En curso
    </span>
  );
}

function WeeklyPanel({ employees, date }: { employees: Employee[]; date: string }) {
  const [selectedEmp, setSelectedEmp] = useState<string>("");
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (employees.length > 0 && !selectedEmp) setSelectedEmp(employees[0].id);
  }, [employees, selectedEmp]);

  useEffect(() => {
    if (!selectedEmp) return;
    let alive = true;
    setLoading(true);
    setErr(null);
    setSummary(null);
    getWeeklySummary(selectedEmp, date)
      .then((res) => { if (alive) setSummary(res); })
      .catch((e: any) => { if (alive) setErr(e?.response?.data?.message ?? "Error"); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [selectedEmp, date]);

  return (
    <div className="rounded-[40px] border border-neutral-100 bg-white shadow-sm overflow-hidden">
      <div className="px-8 py-6 border-b border-neutral-50 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-obsidian tracking-tight">Resumen Semanal</h3>
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">Horas trabajadas, pausas y horas pagables</p>
        </div>
        <select
          className="rounded-2xl border border-neutral-100 px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-obsidian/10"
          value={selectedEmp}
          onChange={(e) => setSelectedEmp(e.target.value)}
        >
          {employees.map((e) => (
            <option key={e.id} value={e.id}>{e.full_name ?? e.name ?? e.id}</option>
          ))}
        </select>
      </div>
      <div className="p-8">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-8 text-neutral-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-xs font-bold uppercase tracking-widest">Cargando...</span>
          </div>
        ) : err ? (
          <div className="text-sm font-medium text-rose-500 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />{err}
          </div>
        ) : summary ? (
          <div className="space-y-5">
            <div className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
              Semana: <span className="text-obsidian">{summary.week.from} → {summary.week.to}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Trabajadas", val: minutesToHHMM(summary.totals.worked_minutes), icon: Clock },
                { label: "Pausas", val: minutesToHHMM(summary.totals.break_minutes), icon: Timer },
                { label: "Descanso pagado", val: minutesToHHMM(summary.totals.paid_rest_minutes), icon: Calendar },
                { label: "Horas pagables", val: minutesToHHMM(summary.totals.payable_minutes), icon: CheckCircle2, highlight: true },
              ].map((kpi) => (
                <div key={kpi.label} className={cx(
                  "rounded-[28px] border p-5 text-center",
                  kpi.highlight ? "bg-obsidian text-white border-obsidian" : "bg-neutral-50/50 border-neutral-100"
                )}>
                  <kpi.icon className={cx("h-5 w-5 mx-auto mb-2", kpi.highlight ? "text-white/40" : "text-neutral-200")} />
                  <div className={cx("text-2xl font-black", kpi.highlight ? "" : "text-obsidian")}>{kpi.val}</div>
                  <div className={cx("text-[10px] font-bold uppercase tracking-widest mt-1", kpi.highlight ? "text-white/40" : "text-neutral-400")}>{kpi.label}</div>
                </div>
              ))}
            </div>
            <div className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
              Jornada: <span className="text-obsidian">{summary.empleado.daily_hours}h/día</span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function ManagerAttendancePage() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [items, setItems] = useState<ByDateItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<"daily" | "weekly">("daily");

  const loadDay = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const { listEmployees } = await import("@/features/tasks/employeeApi");
      const [dayRes, empRes] = await Promise.all([getByDate(date), listEmployees()]);
      setItems(dayRes.items ?? []);
      const empArr = Array.isArray(empRes) ? empRes : (empRes?.data ?? []);
      setEmployees(empArr);
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "No se pudo cargar asistencia");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { loadDay(); }, [loadDay]);

  const checkedIn = items.filter((i) => !!i.first_check_in_at).length;
  const closed = items.filter((i) => !!i.last_check_out_at).length;
  const onShift = items.filter((i) => !!i.first_check_in_at && !i.last_check_out_at).length;
  const absent = Math.max(0, employees.length - checkedIn);
  const totalEmps = employees.length || 1;

  const dateLabel = new Date(date + "T12:00:00").toLocaleDateString("es-MX", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* ── Hero Header ── */}
      <div className="relative rounded-[40px] bg-obsidian overflow-hidden px-8 py-8 text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/[0.03]" />
          <div className="absolute top-8 right-32 h-32 w-32 rounded-full bg-white/[0.04]" />
          <div className="absolute bottom-0 left-1/3 h-20 w-40 rounded-full bg-gold/10" />
        </div>
        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-1">Gestión de Personal</p>
            <h1 className="text-3xl font-black tracking-tight">Control de Asistencia</h1>
            <p className="text-white/50 text-sm mt-1 capitalize">{dateLabel}</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="date"
              className="rounded-2xl bg-white/10 border border-white/20 px-4 py-2.5 text-sm font-medium text-white outline-none focus:ring-2 focus:ring-white/20 [color-scheme:dark]"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <button
              onClick={loadDay}
              className="h-10 w-10 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 flex items-center justify-center transition"
            >
              <RefreshCw className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="inline-flex rounded-2xl bg-white border border-neutral-100 p-1 shadow-sm gap-1">
        {(["daily", "weekly"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cx("rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-widest transition",
              tab === t ? "bg-obsidian text-white shadow" : "text-neutral-400 hover:text-obsidian hover:bg-neutral-50")}
          >
            {t === "daily" ? "Vista del día" : "Resumen semanal"}
          </button>
        ))}
      </div>

      {err && (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm font-medium text-rose-700 flex items-center gap-3">
          <AlertTriangle className="h-4 w-4 shrink-0" />{err}
        </div>
      )}

      {tab === "daily" ? (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "Presentes", val: checkedIn, pct: Math.round((checkedIn / totalEmps) * 100), icon: Users, iconBg: "bg-emerald-100 text-emerald-600", numCls: "text-emerald-600" },
              { label: "Ausentes", val: absent, pct: Math.round((absent / totalEmps) * 100), icon: UserX, iconBg: "bg-rose-50 text-rose-400", numCls: "text-rose-500" },
              { label: "En turno", val: onShift, pct: Math.round((onShift / totalEmps) * 100), icon: Clock, iconBg: "bg-amber-100 text-amber-600", numCls: "text-amber-600" },
            ].map((k) => (
              <div key={k.label} className="rounded-[32px] border border-neutral-100 bg-white p-6 shadow-sm">
                <div className={cx("h-10 w-10 rounded-2xl flex items-center justify-center mb-4", k.iconBg)}>
                  <k.icon className="h-5 w-5" />
                </div>
                <div className={cx("text-4xl font-black tracking-tight", k.numCls)}>{k.val}</div>
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">{k.label}</div>
                <div className="text-xs font-bold text-neutral-300 mt-0.5">{k.pct}% del personal</div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="rounded-[40px] border border-neutral-100 bg-white shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-neutral-50">
              <h3 className="text-lg font-black text-obsidian tracking-tight">Registro de Asistencia</h3>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">
                {items.length} registros · {employees.length} empleados
              </p>
            </div>
            {loading ? (
              <div className="p-16 flex flex-col items-center gap-3 text-neutral-400">
                <div className="h-10 w-10 border-4 border-neutral-100 border-t-obsidian rounded-full animate-spin" />
                <span className="text-xs font-bold uppercase tracking-widest">Cargando registros...</span>
              </div>
            ) : items.length === 0 ? (
              <div className="p-16 flex flex-col items-center gap-4 text-center">
                <Users className="h-12 w-12 text-neutral-100" />
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Sin registros para esta fecha</p>
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50/80 border-b border-neutral-50">
                    <tr>
                      {["Empleado", "Entrada", "Salida", "Estado", "Horas"].map((h) => (
                        <th key={h} className="text-left px-5 py-4 text-[10px] font-bold text-neutral-400 uppercase tracking-[0.1em]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => {
                      const emp = employees.find((e) => e.id === item.empleado_id);
                      const empName = emp?.full_name ?? emp?.name ?? "Empleado";
                      return (
                        <tr key={item.id} className="border-t border-neutral-50 hover:bg-neutral-50/50 transition">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar name={empName} />
                              <div>
                                <div className="text-sm font-bold text-obsidian">{empName}</div>
                                {emp?.position_title && <div className="text-[10px] text-neutral-400 mt-0.5">{emp.position_title}</div>}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 font-bold text-sm text-obsidian">{formatTime(item.first_check_in_at)}</td>
                          <td className="px-5 py-4 text-sm text-neutral-400">{formatTime(item.last_check_out_at)}</td>
                          <td className="px-5 py-4"><StatusBadge item={item} /></td>
                          <td className="px-5 py-4 font-black text-sm text-obsidian">
                            {item.totals ? minutesToHHMM(item.totals.worked_minutes) : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Bottom summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-[32px] border border-neutral-100 bg-white p-6 shadow-sm">
              <h4 className="text-sm font-black text-obsidian tracking-tight mb-5">Resumen del Día</h4>
              <div className="space-y-2">
                {[
                  { label: "Turnos cerrados", val: closed, cls: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" },
                  { label: "En turno activo", val: onShift, cls: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
                  { label: "Sin entrada", val: absent, cls: "text-rose-500", bg: "bg-rose-50 border-rose-100" },
                  { label: "Asistencia", val: `${Math.round((checkedIn / totalEmps) * 100)}%`, cls: "text-obsidian", bg: "bg-obsidian/5 border-neutral-100" },
                ].map((row) => (
                  <div key={row.label} className={cx("flex items-center justify-between rounded-2xl border px-4 py-3", row.bg)}>
                    <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">{row.label}</span>
                    <span className={cx("text-lg font-black", row.cls)}>{row.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <WeeklyPanel employees={employees} date={date} />
      )}
    </div>
  );
}