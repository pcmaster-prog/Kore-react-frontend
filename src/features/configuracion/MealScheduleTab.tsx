// src/features/configuracion/MealScheduleTab.tsx
import { useState, useEffect } from "react";
import api from "@/lib/http";
import {
  UtensilsCrossed, Loader2, CheckCircle2, AlertTriangle,
  Search, Save, Clock
} from "lucide-react";

function cx(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(" ");
}

type Employee = {
  id: string;
  name: string;
  role?: string | null;
};

type MealSchedule = {
  employee_id: string;
  meal_start_time: string; // "HH:mm"
  duration_minutes: number;
};

const DURATION_OPTIONS = [15, 20, 30, 45, 60];

function initials(name: string): string {
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700", "bg-emerald-100 text-emerald-700",
  "bg-violet-100 text-violet-700", "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700", "bg-teal-100 text-teal-700",
];

function avatarColor(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function formatTime12(time24: string): string {
  if (!time24) return "—";
  const [h, m] = time24.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export default function MealScheduleTab() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [schedules, setSchedules] = useState<MealSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [search, setSearch] = useState("");
  const [dirty, setDirty] = useState(false);

  // Default meal time and duration
  const [defaultTime, setDefaultTime] = useState("14:00");
  const [defaultDuration, setDefaultDuration] = useState(30);

  function showToast(type: "ok" | "err", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [empRes, schedRes] = await Promise.all([
          api.get("/empleados"),
          api.get("/meal-schedules"),
        ]);
        const empList = empRes.data?.data ?? empRes.data ?? [];
        setEmployees(empList.map((e: any) => ({
          id: String(e.id),
          name: e.name ?? e.full_name ?? "—",
          role: e.role ?? e.position_title ?? null,
        })));
        const schedList = schedRes.data?.data ?? schedRes.data ?? [];
        setSchedules(schedList);
      } catch {
        // Employees may load, schedules may not exist yet
        try {
          const empRes = await api.get("/empleados");
          const fallbackList = empRes.data?.data ?? empRes.data ?? [];
          setEmployees(fallbackList.map((e: any) => ({
            id: String(e.id),
            name: e.name ?? e.full_name ?? "—",
            role: e.role ?? e.position_title ?? null,
          })));
        } catch {
          showToast("err", "No se pudieron cargar los empleados");
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function getSchedule(empId: string): MealSchedule | undefined {
    return schedules.find(s => s.employee_id === empId);
  }

  function updateSchedule(empId: string, field: "meal_start_time" | "duration_minutes", value: string | number) {
    setDirty(true);
    setSchedules(prev => {
      const existing = prev.find(s => s.employee_id === empId);
      if (existing) {
        return prev.map(s => s.employee_id === empId ? { ...s, [field]: value } : s);
      }
      return [...prev, {
        employee_id: empId,
        meal_start_time: field === "meal_start_time" ? (value as string) : defaultTime,
        duration_minutes: field === "duration_minutes" ? (value as number) : defaultDuration,
      }];
    });
  }

  function removeSchedule(empId: string) {
    setDirty(true);
    setSchedules(prev => prev.filter(s => s.employee_id !== empId));
  }

  function applyDefaultToAll() {
    setDirty(true);
    setSchedules(
      employees.map(emp => ({
        employee_id: emp.id,
        meal_start_time: defaultTime,
        duration_minutes: defaultDuration,
      }))
    );
  }

  async function handleSaveAll() {
    setSaving(true);
    try {
      await api.post("/meal-schedules/bulk", { schedules });
      showToast("ok", "Horarios de comida guardados correctamente");
      setDirty(false);
    } catch {
      showToast("err", "Error al guardar los horarios de comida");
    } finally {
      setSaving(false);
    }
  }

  const filtered = employees.filter(e =>
    (e.name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const assignedCount = schedules.filter(s => s.meal_start_time).length;

  if (loading) return (
    <div className="rounded-[40px] border border-k-border bg-k-bg-card p-16 flex flex-col items-center gap-3">
      <Loader2 className="h-10 w-10 text-k-text-h animate-spin" />
      <span className="text-[10px] font-bold text-k-text-b uppercase tracking-widest">Cargando horarios de comida...</span>
    </div>
  );

  return (
    <div className="space-y-6 animate-in-up">
      {/* Toast */}
      {toast && (
        <div className={cx(
          "rounded-2xl border px-5 py-3 text-sm font-bold flex items-center gap-3",
          toast.type === "ok" ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-rose-50 border-rose-100 text-rose-700"
        )}>
          {toast.type === "ok" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      {/* Main Card */}
      <div className="rounded-[40px] border border-k-border bg-k-bg-card shadow-k-card overflow-hidden">
        <div className="px-8 py-6 border-b border-k-border bg-k-bg-card2/50 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-black text-k-text-h tracking-tight flex items-center gap-3">
              <UtensilsCrossed className="h-5 w-5 text-amber-500" />
              Horarios de Comida
            </h2>
            <p className="text-[11px] font-bold text-k-text-b uppercase tracking-widest mt-1">
              Asigna el horario de comida de cada empleado · {assignedCount}/{employees.length} asignados
            </p>
          </div>
          <button
            onClick={handleSaveAll}
            disabled={saving || !dirty}
            className="rounded-2xl bg-k-accent-btn px-6 py-3 text-sm font-bold text-k-accent-btn-text shadow-md hover:opacity-90 hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar Todo
          </button>
        </div>

        <div className="p-6 md:p-10 space-y-6">
          {/* Default config + search */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-[28px] border border-k-border bg-k-bg-card2/50 p-6 space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-k-border">
                <Clock className="h-5 w-5 text-amber-500" />
                <h3 className="text-sm font-bold text-k-text-h uppercase tracking-widest">Horario Predeterminado</h3>
              </div>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-k-text-b uppercase tracking-widest mb-1.5">Hora inicio</label>
                  <input
                    type="time"
                    value={defaultTime}
                    onChange={e => setDefaultTime(e.target.value)}
                    className="w-full rounded-2xl border border-k-border bg-k-bg-card px-3 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-obsidian/10 transition-all"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-k-text-b uppercase tracking-widest mb-1.5">Duración</label>
                  <select
                    value={defaultDuration}
                    onChange={e => setDefaultDuration(Number(e.target.value))}
                    className="w-full rounded-2xl border border-k-border bg-k-bg-card px-3 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-obsidian/10 transition-all"
                  >
                    {DURATION_OPTIONS.map(d => (
                      <option key={d} value={d}>{d} min</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={applyDefaultToAll}
                  className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-700 hover:bg-amber-100 transition whitespace-nowrap"
                >
                  Aplicar a todos
                </button>
              </div>
            </div>

            <div className="rounded-[28px] border border-k-border bg-k-bg-card2/50 p-6 flex flex-col justify-center">
              <label className="block text-[11px] font-bold text-k-text-b uppercase tracking-widest mb-1.5">Buscar empleado</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-k-text-b" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Nombre del empleado..."
                  className="w-full rounded-2xl border border-k-border bg-k-bg-card pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-obsidian/10 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Employee list */}
          <div className="rounded-[28px] border border-k-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-k-bg-card2/80 border-b border-k-border">
                <tr>
                  {["Empleado", "Hora de comida", "Duración", "Fin estimado", ""].map((h, i) => (
                    <th key={i} className="text-left px-5 py-4 text-[10px] font-bold text-k-text-b uppercase tracking-[0.1em]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center">
                      <UtensilsCrossed className="h-8 w-8 text-neutral-200 mx-auto mb-3" />
                      <p className="text-sm font-bold text-k-text-b">No se encontraron empleados</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map(emp => {
                    const sched = getSchedule(emp.id);
                    const mealTime = sched?.meal_start_time ?? "";
                    const duration = sched?.duration_minutes ?? defaultDuration;

                    // Calculate end time
                    let endTime = "";
                    if (mealTime) {
                      const [h, m] = mealTime.split(":").map(Number);
                      const totalMin = h * 60 + m + duration;
                      const endH = Math.floor(totalMin / 60) % 24;
                      const endM = totalMin % 60;
                      endTime = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
                    }

                    return (
                      <tr key={emp.id} className="border-t border-k-border hover:bg-k-bg-card2/50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={cx("h-9 w-9 rounded-2xl flex items-center justify-center text-xs font-bold shrink-0", avatarColor(emp.name))}>
                              {initials(emp.name)}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-k-text-h">{emp.name}</div>
                              {emp.role && <div className="text-[10px] text-k-text-b uppercase tracking-wider">{emp.role}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <input
                            type="time"
                            value={mealTime}
                            onChange={e => updateSchedule(emp.id, "meal_start_time", e.target.value)}
                            className="rounded-xl border border-k-border bg-k-bg-card px-2.5 py-1.5 text-sm font-medium outline-none focus:ring-2 focus:ring-obsidian/10 transition w-28"
                          />
                        </td>
                        <td className="px-5 py-4">
                          <select
                            value={duration}
                            onChange={e => updateSchedule(emp.id, "duration_minutes", Number(e.target.value))}
                            className="rounded-xl border border-k-border bg-k-bg-card px-2.5 py-1.5 text-sm font-medium outline-none focus:ring-2 focus:ring-obsidian/10 transition w-24"
                          >
                            {DURATION_OPTIONS.map(d => (
                              <option key={d} value={d}>{d} min</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-5 py-4">
                          {endTime ? (
                            <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
                              <Clock className="h-3 w-3" />
                              {formatTime12(endTime)}
                            </span>
                          ) : (
                            <span className="text-k-text-b text-xs">Sin asignar</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          {mealTime && (
                            <button
                              onClick={() => removeSchedule(emp.id)}
                              className="text-[10px] font-bold text-rose-500 hover:text-rose-700 transition uppercase tracking-wider"
                            >
                              Quitar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Info note */}
          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-medium text-blue-700 flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0">
              <span className="text-sm">💡</span>
            </div>
            Cuando llegue la hora asignada, el empleado recibirá una notificación push avisándole que es momento de su comida. El horario también aparecerá en la nómina semanal.
          </div>
        </div>
      </div>
    </div>
  );
}
