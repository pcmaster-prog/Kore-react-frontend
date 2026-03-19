// src/features/dashboard/ManagerDashboard.tsx
import { useEffect, useMemo, useState } from "react";
import api from "@/lib/http";
import { listPendingApprovals } from "@/features/tasks/api";
import {
  AlertTriangle, CheckCircle2, Clock,
  ClipboardList, Users,
  CalendarCheck, Activity,
  Zap, ChevronRight,
} from "lucide-react";

function cx(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(" ");
}

type AttendanceSnap = {
  date: string;
  employees_total: number;
  checked_in: number;
  open: number;
  closed: number;
  out: number;
};

type ManagerDash = {
  kpi?: { open?: number; in_progress?: number; completed?: number; overdue?: number };
  today?: { open?: number; in_progress?: number; completed?: number };
  activity?: { id: string; action: string; created_at: string; meta?: any }[];
  attendance?: AttendanceSnap;
};

// ─── Acción readable ──────────────────────────────────────────────────────────
function readableAction(action: string, meta?: any): string {
  const m = meta ?? {};
  switch (action) {
    case "task.bulk_created":   return `Tareas creadas${m.task_title ? `: ${m.task_title}` : ""}`;
    case "task.bulk_reused":    return `Rutina reutilizada${m.task_title ? `: ${m.task_title}` : ""}`;
    case "task.status_changed": {
      const s: Record<string,string> = { completed:"Completada", in_progress:"En progreso", open:"Abierta" };
      return m.task_title ? `${m.task_title} → ${s[m.to]??m.to}` : `Estado cambiado → ${s[m.to]??m.to}`;
    }
    case "evidence.uploaded":   return `Evidencia subida${m.task_title ? `: ${m.task_title}` : ""}`;
    case "attendance.check_in": return `Entrada: ${m.employee_name ?? "Empleado"}`;
    case "attendance.check_out":return `Salida: ${m.employee_name ?? "Empleado"}`;
    default: return action.replace(/\./g," · ").replace(/_/g," ");
  }
}

function actionIcon(action: string): { icon: string; color: string } {
  if (action.startsWith("attendance.check_in"))  return { icon: "🟢", color: "bg-emerald-100" };
  if (action.startsWith("attendance.check_out")) return { icon: "🔴", color: "bg-neutral-100" };
  if (action.includes("completed"))              return { icon: "✅", color: "bg-emerald-100" };
  if (action.includes("evidence"))               return { icon: "📎", color: "bg-violet-100" };
  if (action.includes("bulk_created"))           return { icon: "📋", color: "bg-blue-100" };
  if (action.includes("reused"))                 return { icon: "🔄", color: "bg-indigo-100" };
  return { icon: "⚙️", color: "bg-neutral-100" };
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-32 rounded-3xl bg-neutral-900/5" />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[...Array(5)].map((_,i) => <div key={i} className="h-28 rounded-3xl bg-neutral-100" />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-52 rounded-3xl bg-neutral-100" />
        <div className="h-52 rounded-3xl bg-neutral-100" />
      </div>
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, icon, accent = false, warn = false, dark = false,
}: {
  label: string; value: number | string; sub?: string;
  icon: React.ReactNode; accent?: boolean; warn?: boolean; dark?: boolean;
}) {
  return (
    <div className={cx(
      "relative rounded-3xl border p-5 overflow-hidden transition group",
      dark  ? "bg-neutral-900 border-neutral-800 text-white"
           : warn  ? "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200"
           : accent ? "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200"
           : "bg-white border-neutral-200 hover:border-neutral-300 hover:shadow-sm"
    )}>
      {/* Decorative circle */}
      <div className={cx(
        "absolute -top-4 -right-4 h-20 w-20 rounded-full opacity-10",
        dark ? "bg-white" : warn ? "bg-amber-400" : accent ? "bg-emerald-400" : "bg-neutral-900"
      )} />
      <div className="relative">
        <div className={cx(
          "inline-flex items-center justify-center h-8 w-8 rounded-xl mb-3",
          dark ? "bg-white/10 text-white" : warn ? "bg-amber-100 text-amber-600" : accent ? "bg-emerald-100 text-emerald-600" : "bg-neutral-100 text-neutral-500"
        )}>
          {icon}
        </div>
        <div className={cx(
          "text-3xl font-bold tracking-tight",
          dark ? "text-white" : warn ? "text-amber-700" : accent ? "text-emerald-700" : "text-neutral-900"
        )}>
          {value}
        </div>
        <div className={cx(
          "text-xs font-medium mt-1",
          dark ? "text-white/60" : warn ? "text-amber-600" : accent ? "text-emerald-600" : "text-neutral-500"
        )}>
          {label}
        </div>
        {sub && (
          <div className={cx(
            "text-xs mt-0.5",
            dark ? "text-white/40" : "text-neutral-400"
          )}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Attendance Block ─────────────────────────────────────────────────────────
function AttendanceBlock({ snap }: { snap: AttendanceSnap }) {
  const total = snap.employees_total || 1;
  const pct = Math.round((snap.checked_in / total) * 100);
  const dateStr = new Date(snap.date + "T12:00:00").toLocaleDateString("es-MX", {
    weekday: "long", day: "numeric", month: "long",
  });

  const segments = [
    { label: "En turno",    val: snap.open,   color: "bg-emerald-400", light: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { label: "Cerrados",    val: snap.closed, color: "bg-neutral-300", light: "bg-neutral-50 text-neutral-600 border-neutral-200" },
    { label: "Sin entrada", val: snap.out,    color: "bg-rose-300",    light: "bg-rose-50 text-rose-700 border-rose-200" },
  ];

  return (
    <div className="rounded-3xl border bg-white shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b bg-gradient-to-br from-neutral-50 to-white">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
              <CalendarCheck className="h-4 w-4 text-neutral-400" />
              Asistencia hoy
            </div>
            <div className="text-xs text-neutral-500 mt-1 capitalize">{dateStr}</div>
          </div>
          <div className={cx(
            "flex flex-col items-end",
          )}>
            <span className="text-3xl font-bold text-neutral-900">{snap.checked_in}</span>
            <span className="text-xs text-neutral-400">de {snap.employees_total}</span>
          </div>
        </div>

        {/* Barra segmentada */}
        <div className="mt-4 h-3 w-full rounded-full bg-neutral-100 overflow-hidden flex gap-0.5">
          {segments.map((s) => (
            <div
              key={s.label}
              className={cx("h-full rounded-full transition-all", s.color)}
              style={{ width: `${Math.round((s.val / total) * 100)}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-xs text-neutral-400">{pct}% presentes</span>
          <span className={cx(
            "text-xs font-medium",
            pct >= 80 ? "text-emerald-600" : pct >= 50 ? "text-amber-600" : "text-rose-600"
          )}>
            {pct >= 80 ? "✓ Buena asistencia" : pct >= 50 ? "⚠ Asistencia parcial" : "↓ Baja asistencia"}
          </span>
        </div>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-3 divide-x flex-1">
        {segments.map((s) => (
          <div key={s.label} className="flex flex-col items-center justify-center py-4 gap-1">
            <span className="text-2xl font-bold text-neutral-800">{s.val}</span>
            <span className="text-xs text-neutral-500">{s.label}</span>
            <span className={cx("h-1.5 w-6 rounded-full", s.color)} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tareas hoy ───────────────────────────────────────────────────────────────
function TareasHoy({ t }: { t: { open?: number; in_progress?: number; completed?: number } }) {
  const open = t.open ?? 0;
  const inProg = t.in_progress ?? 0;
  const done = t.completed ?? 0;
  const total = open + inProg + done || 1;
  const donePct = Math.round((done / total) * 100);

  const bars = [
    { label: "Completadas", val: done,   color: "bg-emerald-500", text: "text-emerald-600" },
    { label: "En progreso", val: inProg, color: "bg-amber-400",   text: "text-amber-600"   },
    { label: "Sin iniciar", val: open,   color: "bg-neutral-200", text: "text-neutral-500"  },
  ];

  return (
    <div className="rounded-3xl border bg-white shadow-sm overflow-hidden flex flex-col">
      <div className="px-5 pt-5 pb-4 border-b bg-gradient-to-br from-neutral-50 to-white">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
              <ClipboardList className="h-4 w-4 text-neutral-400" />
              Tareas de hoy
            </div>
            <div className="text-xs text-neutral-500 mt-1">Progreso del día actual</div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-3xl font-bold text-neutral-900">{donePct}%</span>
            <span className="text-xs text-neutral-400">completado</span>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="mt-4 h-3 w-full rounded-full bg-neutral-100 overflow-hidden flex gap-0.5">
          {bars.map((b) => (
            <div
              key={b.label}
              className={cx("h-full transition-all", b.color)}
              style={{ width: `${Math.round((b.val / total) * 100)}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-xs text-neutral-400">{done + inProg + open} tareas en total</span>
          <span className={cx("text-xs font-medium", donePct >= 80 ? "text-emerald-600" : donePct >= 40 ? "text-amber-600" : "text-neutral-500")}>
            {donePct >= 80 ? "✓ Gran avance" : donePct >= 40 ? "↗ Buen ritmo" : "→ En marcha"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x flex-1">
        {bars.map((b) => (
          <div key={b.label} className="flex flex-col items-center justify-center py-4 gap-1">
            <span className="text-2xl font-bold text-neutral-800">{b.val}</span>
            <span className="text-xs text-neutral-500">{b.label}</span>
            <span className={cx("h-1.5 w-6 rounded-full", b.color)} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Dashboard principal ──────────────────────────────────────────────────────
export default function ManagerDashboard() {
  const [data, setData] = useState<ManagerDash | null>(null);
  const [pending, setPending] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr(null);
    (async () => {
      try {
        const res = await api.get("/dashboard/manager");
        if (alive) setData(res.data?.data ?? res.data ?? {});
      } catch (e: any) {
        if (alive) { setErr(e?.response?.data?.message ?? "No se pudo cargar el dashboard"); setData({}); }
      }
      try {
        const res = await listPendingApprovals({ page: 1 });
        if (alive) setPending(res?.total ?? res?.data?.length ?? 0);
      } catch { if (alive) setPending(0); }
      if (alive) setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  const k = data?.kpi ?? {};
  const t = data?.today ?? {};
  const overdue = k.overdue ?? 0;

  const health = useMemo(() => {
    if (overdue >= 10) return { label: "Riesgo alto",       ok: false, cls: "bg-rose-100 text-rose-700 border-rose-200" };
    if (overdue >= 1)  return { label: "Bajo observación",  ok: false, cls: "bg-amber-100 text-amber-700 border-amber-200" };
    return               { label: "Operación estable",      ok: true,  cls: "bg-emerald-100 text-emerald-700 border-emerald-200" };
  }, [overdue]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
  const todayFull = new Date().toLocaleDateString("es-MX", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  if (loading) return <Skeleton />;

  if (err) return (
    <div className="rounded-3xl border bg-white p-6">
      <div className="font-semibold text-lg">Dashboard</div>
      <div className="mt-2 text-sm text-rose-600">{err}</div>
    </div>
  );

  return (
    <div className="space-y-5">

      {/* ── Hero header ──────────────────────────────────────────────────── */}
      <div className="relative rounded-3xl bg-neutral-900 overflow-hidden px-6 py-6 text-white">
        {/* Decoración de fondo */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/[0.03]" />
          <div className="absolute top-8 right-32 h-32 w-32 rounded-full bg-white/[0.04]" />
          <div className="absolute -bottom-8 left-1/3 h-40 w-40 rounded-full bg-white/[0.02]" />
        </div>

        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-white/50 text-sm font-medium capitalize">{todayFull}</p>
            <h1 className="text-2xl font-bold mt-0.5 tracking-tight">{greeting} 👋</h1>
            <p className="text-white/50 text-sm mt-1">Panorama operativo del día.</p>
          </div>

          <div className="flex items-center gap-3">
            {pending > 0 && (
              <div className="flex items-center gap-2 rounded-2xl bg-amber-400/20 border border-amber-400/30 px-4 py-2.5">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-amber-300 text-sm font-medium">{pending} por revisar</span>
              </div>
            )}
            <div className={cx(
              "flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-medium",
              health.ok
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                : "bg-amber-500/15 border-amber-500/30 text-amber-300"
            )}>
              {health.ok
                ? <CheckCircle2 className="h-4 w-4" />
                : <AlertTriangle className="h-4 w-4" />}
              {health.label}
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard
          label="Sin iniciar"
          value={k.open ?? 0}
          sub="Tareas abiertas"
          icon={<ClipboardList className="h-4 w-4" />}
        />
        <KpiCard
          label="En progreso"
          value={k.in_progress ?? 0}
          sub="En ejecución"
          icon={<Clock className="h-4 w-4" />}
        />
        <KpiCard
          label="Completadas"
          value={k.completed ?? 0}
          sub="Total cerradas"
          icon={<CheckCircle2 className="h-4 w-4" />}
          accent
        />
        <KpiCard
          label="Vencidas"
          value={overdue}
          sub="Requieren atención"
          icon={<AlertTriangle className="h-4 w-4" />}
          warn={overdue > 0}
        />
        <KpiCard
          label="Por revisar"
          value={pending}
          sub="Aprobaciones"
          icon={<Users className="h-4 w-4" />}
          dark
        />
      </div>

      {/* ── Tareas hoy + Asistencia ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TareasHoy t={t} />
        {data?.attendance
          ? <AttendanceBlock snap={data.attendance} />
          : (
            <div className="rounded-3xl border border-dashed bg-neutral-50 p-6 flex flex-col items-center justify-center text-center gap-2">
              <CalendarCheck className="h-8 w-8 text-neutral-300" />
              <div className="text-sm text-neutral-500">Sin datos de asistencia para hoy</div>
            </div>
          )}
      </div>

      {/* ── Actividad reciente ────────────────────────────────────────────── */}
      <div className="rounded-3xl border bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold">Actividad reciente</div>
              <div className="text-xs text-neutral-500">Últimos movimientos del sistema</div>
            </div>
          </div>
          <span className="text-xs text-neutral-400 inline-flex items-center gap-1 hover:text-neutral-700 cursor-pointer transition">
            Ver todo <ChevronRight className="h-3 w-3" />
          </span>
        </div>

        <div className="divide-y">
          {data?.activity?.length ? (
            data.activity.slice(0, 6).map((a, i) => {
              const { icon, color } = actionIcon(a.action);
              const label = readableAction(a.action, a.meta);
              const time = new Date(a.created_at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
              return (
                <div
                  key={a.id}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-neutral-50/60 transition group"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div className={cx("h-9 w-9 rounded-xl flex items-center justify-center text-base shrink-0", color)}>
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-neutral-800 truncate font-medium">{label}</div>
                  </div>
                  <div className="text-xs text-neutral-400 shrink-0 tabular-nums">{time}</div>
                  <ChevronRight className="h-3.5 w-3.5 text-neutral-200 group-hover:text-neutral-400 transition shrink-0" />
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center py-10 gap-2 text-neutral-400">
              <Zap className="h-6 w-6" />
              <span className="text-sm">Sin actividad registrada aún</span>
            </div>
          )}
        </div>

        {(data?.activity?.length ?? 0) > 0 && (
          <div className="px-5 py-3 border-t bg-neutral-50/50 text-xs text-neutral-400 text-center">
            Ver historial completo en <span className="font-medium text-neutral-600">Configuración → Actividad</span>
          </div>
        )}
      </div>
    </div>
  );
}