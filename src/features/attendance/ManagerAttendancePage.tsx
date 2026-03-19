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

function cx(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(" ");
}

type Employee = { id: string; full_name?: string; name?: string; position_title?: string };

function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
  const colors = ["bg-blue-100 text-blue-700","bg-violet-100 text-violet-700","bg-emerald-100 text-emerald-700","bg-amber-100 text-amber-700","bg-rose-100 text-rose-700","bg-sky-100 text-sky-700"];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={cx("h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0", color)}>
      {initials}
    </div>
  );
}

function StatusBadge({ item }: { item: ByDateItem }) {
  const checkedIn = !!item.first_check_in_at;
  const closed = item.status === "closed" || !!item.last_check_out_at;
  if ((item as any).is_rest_day || (item as any).state === "rest")
    return <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">🛋️ Descanso</span>;
  if (!checkedIn)
    return <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700">Ausente</span>;
  if (closed)
    return <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">Presente</span>;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />En curso
    </span>
  );
}

function WeeklyBarChart({ items }: { items: ByDateItem[] }) {
  const days = ["L","M","M","J","V","S","D"];
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const bars = days.map((label, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayItems = items.filter((it) => it.date === dateStr);
    const present = dayItems.filter((it) => !!it.first_check_in_at).length;
    const total = Math.max(dayItems.length, 1);
    const pct = Math.round((present / total) * 100);
    const isToday = dateStr === now.toISOString().slice(0, 10);
    return { label, pct, isToday };
  });
  const max = Math.max(...bars.map((b) => b.pct), 1);
  return (
    <div className="flex items-end justify-between gap-1 h-24 pt-2">
      {bars.map((bar, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-1">
          <div className="w-full flex items-end justify-center" style={{ height: "72px" }}>
            <div
              className={cx("w-full rounded-t-lg transition-all", bar.isToday ? "bg-blue-500" : "bg-blue-200")}
              style={{ height: `${(bar.pct / max) * 64}px`, minHeight: "4px" }}
            />
          </div>
          <span className={cx("text-xs", bar.isToday ? "font-bold text-blue-600" : "text-neutral-500")}>{bar.label}</span>
        </div>
      ))}
    </div>
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
    <div className="rounded-3xl border bg-white shadow-sm overflow-hidden">
      <div className="p-4 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="font-semibold">Resumen semanal por empleado</div>
          <div className="text-xs text-neutral-500 mt-0.5">Horas trabajadas, pausas y horas pagables</div>
        </div>
        <select
          className="rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
          value={selectedEmp}
          onChange={(e) => setSelectedEmp(e.target.value)}
        >
          {employees.map((e) => (
            <option key={e.id} value={e.id}>{e.full_name ?? e.name ?? e.id}</option>
          ))}
        </select>
      </div>
      <div className="p-5">
        {loading ? <div className="text-sm text-neutral-500">Cargando...</div>
          : err ? <div className="text-sm text-rose-600">{err}</div>
          : summary ? (
            <div className="space-y-4">
              <div className="text-xs text-neutral-500">
                Semana: <span className="font-medium text-neutral-800">{summary.week.from} → {summary.week.to}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Trabajadas", val: minutesToHHMM(summary.totals.worked_minutes), cls: "bg-neutral-50" },
                  { label: "Pausas", val: minutesToHHMM(summary.totals.break_minutes), cls: "bg-neutral-50" },
                  { label: "Descanso pagado", val: minutesToHHMM(summary.totals.paid_rest_minutes), cls: "bg-neutral-50" },
                  { label: "Horas pagables", val: minutesToHHMM(summary.totals.payable_minutes), cls: "bg-emerald-50 border-emerald-100" },
                ].map((kpi) => (
                  <div key={kpi.label} className={cx("rounded-2xl border p-4 text-center", kpi.cls)}>
                    <div className="text-xs text-neutral-500">{kpi.label}</div>
                    <div className="text-xl font-semibold mt-1">{kpi.val}</div>
                  </div>
                ))}
              </div>
              <div className="text-xs text-neutral-400">
                Jornada configurada: <span className="font-medium text-neutral-600">{summary.empleado.daily_hours}h/día</span>
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Control de Asistencia</h1>
          <p className="text-sm text-neutral-500 capitalize">{dateLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            className="rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <button onClick={loadDay} className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm hover:bg-neutral-50 transition">
            ↻ Refrescar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="inline-flex rounded-2xl border bg-white p-1 shadow-sm gap-1">
        {(["daily", "weekly"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cx("rounded-xl px-4 py-2 text-sm font-medium transition",
              tab === t ? "bg-neutral-900 text-white shadow" : "text-neutral-600 hover:bg-neutral-50")}
          >
            {t === "daily" ? "Vista del día" : "Resumen semanal"}
          </button>
        ))}
      </div>

      {err && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{err}</div>}

      {tab === "daily" ? (
        <>
          {/* KPI cards de colores */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-3xl bg-emerald-600 p-5 text-white shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center text-lg">👥</div>
                <span className="font-medium">Presentes</span>
              </div>
              <div className="text-5xl font-bold">{checkedIn}</div>
              <div className="text-sm text-white/70 mt-1">{Math.round((checkedIn / totalEmps) * 100)}% del personal</div>
            </div>
            <div className="rounded-3xl bg-rose-600 p-5 text-white shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center text-lg">🚫</div>
                <span className="font-medium">Ausentes</span>
              </div>
              <div className="text-5xl font-bold">{absent}</div>
              <div className="text-sm text-white/70 mt-1">{Math.round((absent / totalEmps) * 100)}% del personal</div>
            </div>
            <div className="rounded-3xl bg-amber-500 p-5 text-white shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center text-lg">⏱️</div>
                <span className="font-medium">En turno ahora</span>
              </div>
              <div className="text-5xl font-bold">{onShift}</div>
              <div className="text-sm text-white/70 mt-1">{Math.round((onShift / totalEmps) * 100)}% del personal</div>
            </div>
          </div>

          {/* Tabla */}
          <div className="rounded-3xl border bg-white shadow-sm overflow-hidden">
            <div className="p-4 border-b">
              <div className="font-semibold">Registro de Asistencia</div>
              <div className="text-xs text-neutral-500 mt-0.5">{items.length} registros · {employees.length} empleados</div>
            </div>
            {loading ? (
              <div className="p-8 text-sm text-neutral-500 text-center">Cargando registros...</div>
            ) : items.length === 0 ? (
              <div className="p-8 text-sm text-neutral-500 text-center">Sin registros para esta fecha.</div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wide">
                    <tr>
                      <th className="text-left p-3 pl-5">Empleado</th>
                      <th className="text-left p-3">Hora de Entrada</th>
                      <th className="text-left p-3">Hora de Salida</th>
                      <th className="text-left p-3">Estado</th>
                      <th className="text-left p-3">Horas Trabajadas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => {
                      const emp = employees.find((e) => e.id === item.empleado_id);
                      const name = emp?.full_name ?? emp?.name ?? "Empleado";
                      return (
                        <tr key={item.id} className="border-t hover:bg-neutral-50/70 transition">
                          <td className="p-3 pl-5">
                            <div className="flex items-center gap-3">
                              <Avatar name={name} />
                              <div>
                                <div className="font-medium">{name}</div>
                                {emp?.position_title && <div className="text-xs text-neutral-500">{emp.position_title}</div>}
                              </div>
                            </div>
                          </td>
                          <td className="p-3 font-medium">{formatTime(item.first_check_in_at)}</td>
                          <td className="p-3 text-neutral-600">{formatTime(item.last_check_out_at)}</td>
                          <td className="p-3"><StatusBadge item={item} /></td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              <span className="text-blue-500 text-xs">↗</span>
                              <span className="font-semibold">{item.totals ? minutesToHHMM(item.totals.worked_minutes) : "—"}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-3xl border bg-white p-5 shadow-sm">
              <div className="font-semibold mb-1">Tendencia Semanal</div>
              <div className="text-xs text-neutral-500 mb-3">Presencia por día</div>
              <WeeklyBarChart items={items} />
            </div>
            <div className="rounded-3xl border bg-white p-5 shadow-sm">
              <div className="font-semibold mb-4">Resumen del Día</div>
              <div className="space-y-2">
                {[
                  { label: "Turnos cerrados", val: closed, color: "text-emerald-600", bg: "bg-emerald-50" },
                  { label: "En turno activo", val: onShift, color: "text-amber-600", bg: "bg-amber-50" },
                  { label: "Sin entrada registrada", val: absent, color: "text-rose-600", bg: "bg-rose-50" },
                  { label: "Porcentaje de asistencia", val: `${Math.round((checkedIn / totalEmps) * 100)}%`, color: "text-blue-600", bg: "bg-blue-50" },
                ].map((row) => (
                  <div key={row.label} className={cx("flex items-center justify-between rounded-xl px-4 py-3", row.bg)}>
                    <span className="text-sm text-neutral-700">{row.label}</span>
                    <span className={cx("font-bold text-base", row.color)}>{row.val}</span>
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