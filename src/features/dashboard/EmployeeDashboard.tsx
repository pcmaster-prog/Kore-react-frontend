//features/dashboard/EmployeeDashboard.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/http";
import {
  listMyAssignments,
  updateMyAssignment,
  type MyAssignmentRow,
} from "@/features/tasks/api";
import {
  CalendarCheck,
  ClipboardList,
  Flame,
  CheckCircle2,
  PlayCircle,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

type EmployeeDash = {
  date: string;
  attendance?: { state?: string; day_id?: string | null };
};

function cx(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(" ");
}

function StatusPill({ status }: { status?: string }) {
  const s = (status ?? "-").toLowerCase();
  const conf =
    s === "in_progress"
      ? { label: "En progreso", cls: "bg-amber-50 text-amber-800 border-amber-200" }
      : s === "done_pending"
      ? { label: "En revisión", cls: "bg-indigo-50 text-indigo-800 border-indigo-200" }
      : s === "approved"
      ? { label: "Aprobada", cls: "bg-emerald-50 text-emerald-800 border-emerald-200" }
      : s === "rejected"
      ? { label: "Rechazada", cls: "bg-rose-50 text-rose-800 border-rose-200" }
      : s === "assigned"
      ? { label: "Asignada", cls: "bg-neutral-50 text-neutral-700 border-neutral-200" }
      : { label: status ?? "-", cls: "bg-neutral-50 text-neutral-700 border-neutral-200" };

  return (
    <span className={cx("inline-flex items-center rounded-full border px-2 py-0.5 text-xs", conf.cls)}>
      {conf.label}
    </span>
  );
}

function PriorityPill({ priority }: { priority?: string }) {
  const p = (priority ?? "medium").toLowerCase();
  const conf =
    p === "urgent"
      ? { label: "Urgente", cls: "bg-rose-50 text-rose-800 border-rose-200" }
      : p === "high"
      ? { label: "Alta", cls: "bg-orange-50 text-orange-800 border-orange-200" }
      : p === "low"
      ? { label: "Baja", cls: "bg-sky-50 text-sky-800 border-sky-200" }
      : { label: "Media", cls: "bg-neutral-50 text-neutral-700 border-neutral-200" };

  return (
    <span className={cx("inline-flex items-center rounded-full border px-2 py-0.5 text-xs", conf.cls)}>
      {conf.label}
    </span>
  );
}

function StatCard({
  title,
  value,
  icon,
  hint,
  colorCls = "text-obsidian",
  bgCls = "bg-white",
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  hint?: string;
  colorCls?: string;
  bgCls?: string;
}) {
  return (
    <div className={cx("rounded-[28px] border p-6 shadow-sm transition-all hover:shadow-md", bgCls)}>
      <div className="flex items-center justify-between mb-4">
        <div className={cx("text-4xl font-black tracking-tight", colorCls)}>{value}</div>
        <div className="h-10 w-10 rounded-2xl bg-white/60 flex items-center justify-center text-neutral-500 shadow-sm border border-neutral-100/50 backdrop-blur-sm">
          {icon}
        </div>
      </div>
      <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{title}</div>
      {hint ? <div className="mt-1 text-xs font-medium text-neutral-400 opacity-80">{hint}</div> : null}
    </div>
  );
}

export default function EmployeeDashboard() {
  const nav = useNavigate();

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [dash, setDash] = useState<EmployeeDash | null>(null);

  const [rows, setRows] = useState<MyAssignmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "ok" | "warn" | "err"; msg: string } | null>(null);

  async function loadAll() {
    setLoading(true);
    setErr(null);
    try {
      const d = await api.get("/dashboard/employee");
      setDash(d.data?.data ?? d.data);

      const a = await listMyAssignments({ page: 1, date: today });
      setRows(a.data ?? []);
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "No pude cargar tu dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!alive) return;
      await loadAll();
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today]);

  const counts = useMemo(() => {
    const open = rows.filter((r) => r.assignment.status === "assigned").length;
    const in_progress = rows.filter((r) => r.assignment.status === "in_progress").length;
    const completed = rows.filter((r) => r.assignment.status === "approved").length;
    const pending = rows.filter((r) => r.assignment.status === "done_pending").length;
    return { open, in_progress, completed, pending };
  }, [rows]);

  const todayLabel = useMemo(() => {
    const d = dash?.date ? new Date(dash.date) : new Date();
    return d.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, [dash?.date]);

  const attendanceState = (dash?.attendance?.state ?? "-").toLowerCase();
  const attendanceNice =
    attendanceState === "checked_in"
      ? { label: "En turno", cls: "bg-emerald-50 text-emerald-800 border-emerald-200", icon: <CalendarCheck className="h-4 w-4" /> }
      : attendanceState === "on_break"
      ? { label: "En pausa", cls: "bg-amber-50 text-amber-800 border-amber-200", icon: <Flame className="h-4 w-4" /> }
      : attendanceState === "checked_out"
      ? { label: "Salida registrada", cls: "bg-neutral-50 text-neutral-700 border-neutral-200", icon: <CheckCircle2 className="h-4 w-4" /> }
      : { label: dash?.attendance?.state ?? "-", cls: "bg-neutral-50 text-neutral-700 border-neutral-200", icon: <AlertTriangle className="h-4 w-4" /> };

  async function doStart(assignmentId: string) {
    setBusyId(assignmentId);
    setToast(null);
    try {
      await updateMyAssignment(assignmentId, { status: "in_progress" });
      setToast({ type: "ok", msg: "Tarea iniciada ✅" });
      await loadAll();
    } catch (e: any) {
      setToast({ type: "err", msg: e?.response?.data?.message ?? "No se pudo iniciar" });
    } finally {
      setBusyId(null);
    }
  }

  async function doSubmit(assignmentId: string) {
    setBusyId(assignmentId);
    setToast(null);
    try {
      await updateMyAssignment(assignmentId, { status: "done_pending" });
      setToast({ type: "ok", msg: "Enviada a revisión ✅" });
      await loadAll();
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? "No se pudo enviar";
      // Tu backend puede devolver 422 si falta evidencia
      if (e?.response?.status === 422) {
        setToast({ type: "warn", msg: msg + " (sube evidencia en Mis tareas)" });
      } else {
        setToast({ type: "err", msg });
      }
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <div className="rounded-3xl border bg-white p-4">Cargando tu día...</div>;

  if (err) {
    return (
      <div className="rounded-3xl border bg-white p-4">
        <div className="font-semibold">Mi día</div>
        <div className="mt-2 text-sm text-rose-600">{err}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Hero Header ─────────────────────────────────────────────── */}
      <div className="relative rounded-[32px] sm:rounded-[40px] bg-obsidian overflow-hidden px-6 py-8 sm:px-8 sm:py-10 text-white shadow-lg">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/[0.03]" />
          <div className="absolute top-8 right-32 h-32 w-32 rounded-full bg-white/[0.04]" />
          <div className="absolute bottom-0 left-1/4 h-24 w-48 rounded-full bg-gold/10" />
        </div>
        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-1">Tu Agenda</p>
            <h1 className="text-3xl font-black tracking-tight">Mi día</h1>
            <p className="text-white/50 text-sm font-medium mt-1 capitalize">{todayLabel}</p>
          </div>
          <span className={cx(
            "inline-flex items-center gap-2 rounded-2xl border px-5 py-2.5 text-xs font-bold uppercase tracking-widest shadow-sm backdrop-blur-md",
            attendanceState === "checked_in" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" :
            attendanceState === "on_break" ? "bg-amber-500/20 text-amber-300 border-amber-500/30" :
            attendanceState === "checked_out" ? "bg-white/10 text-white/80 border-white/20" :
            "bg-white/5 text-white/50 border-white/10"
          )}>
            {attendanceNice.icon}
            {attendanceNice.label}
          </span>
        </div>
      </div>

      {/* Toast */}
      {toast ? (
        <div className={cx(
          "rounded-2xl border px-5 py-4 text-sm font-bold flex items-center gap-3 animate-in-fade",
          toast.type === "ok" && "border-emerald-200 bg-emerald-50 text-emerald-800",
          toast.type === "warn" && "border-amber-200 bg-amber-50 text-amber-800",
          toast.type === "err" && "border-rose-200 bg-rose-50 text-rose-800"
        )}>
          {toast.type === "ok" ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
          {toast.msg}
        </div>
      ) : null}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Asignadas" value={counts.open} icon={<ClipboardList className="h-5 w-5" />} hint="Listas para iniciar" colorCls="text-blue-600" bgCls="bg-blue-50/50 border-blue-100" />
        <StatCard title="En progreso" value={counts.in_progress} icon={<PlayCircle className="h-5 w-5" />} hint="Trabajándose" colorCls="text-amber-600" bgCls="bg-amber-50/50 border-amber-100" />
        <StatCard title="En revisión" value={counts.pending} icon={<AlertTriangle className="h-5 w-5" />} hint="Esperando aprobación" colorCls="text-indigo-600" bgCls="bg-indigo-50/50 border-indigo-100" />
        <StatCard title="Aprobadas" value={counts.completed} icon={<CheckCircle2 className="h-5 w-5" />} hint="Cerradas hoy" colorCls="text-emerald-600" bgCls="bg-emerald-50/50 border-emerald-100" />
      </div>

      {/* List */}
      <div className="rounded-[40px] border border-neutral-100 bg-white shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-neutral-50 bg-neutral-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xl font-black text-obsidian tracking-tight">Tareas de hoy</div>
            <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mt-1">
              {rows.length ? `${rows.length} asignadas` : "Sin tareas por ahora"}
            </div>
          </div>

          <button
            className="w-full sm:w-auto rounded-2xl border border-neutral-200 bg-white px-5 py-2.5 text-xs font-bold text-obsidian hover:bg-neutral-50 transition-colors shadow-sm flex items-center justify-center sm:inline-flex uppercase tracking-widest"
            onClick={() => nav("/app/employee/mis-tareas/asignaciones")}
          >
            Ir a Mis tareas <ArrowRight className="h-4 w-4 ml-2 text-neutral-400" />
          </button>
        </div>

        {rows.length ? (
          <div className="divide-y divide-neutral-100">
            {rows.map((r, idx) => {
              const a = r.assignment;
              const t = r.task;

              const canStart = a.status === "assigned";
              const canSubmit = a.status === "in_progress";

              return (
                <div key={a.id} className={cx("p-5 sm:p-8 transition-colors", idx % 2 === 0 ? "bg-white" : "bg-neutral-50/30 hover:bg-neutral-50")}>
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="min-w-0 flex-1">
                      <div className="text-lg font-black text-obsidian tracking-tight truncate">{t.title}</div>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <StatusPill status={a.status} />
                        <PriorityPill priority={t.priority ?? undefined} />
                        {t.due_at ? (
                          <span className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[10px] font-bold text-neutral-500 uppercase tracking-widest shadow-sm">
                            ⏰ {new Date(t.due_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        ) : null}
                      </div>

                      {t.description ? (
                        <div className="mt-3 text-sm font-medium text-neutral-500 line-clamp-2 leading-relaxed">{t.description}</div>
                      ) : null}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 mt-2 lg:mt-0 shrink-0">
                      <button
                        className="w-full sm:w-auto rounded-2xl border border-neutral-200 bg-white px-6 py-3 text-xs font-bold text-obsidian hover:bg-neutral-50 transition-colors shadow-sm disabled:opacity-50 uppercase tracking-widest sm:min-w-[120px]"
                        disabled={!canStart || busyId === a.id}
                        onClick={() => doStart(a.id)}
                      >
                        {busyId === a.id ? "Aguarde..." : "▶ Iniciar"}
                      </button>

                      <button
                        className="w-full sm:w-auto rounded-2xl bg-obsidian text-white px-6 py-3 text-xs font-bold shadow-md hover:bg-neutral-800 hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-widest sm:min-w-[140px]"
                        disabled={!canSubmit || busyId === a.id}
                        onClick={() => doSubmit(a.id)}
                      >
                        {busyId === a.id ? "Aguarde..." : "📤 Entregar"}
                      </button>
                    </div>
                  </div>

                  {/* Small hint */}
                  {a.status === "in_progress" ? (
                    <div className="mt-4 rounded-xl bg-amber-50/50 border border-amber-100 p-3 text-xs font-medium text-amber-700 flex items-center gap-2">
                      <span className="text-amber-500">💡</span>
                      Para entregar, asegúrate de subir evidencia en <b>Mis tareas</b>.
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-16 text-center">
            <div className="text-4xl mb-4">🎉</div>
            <div className="text-sm font-bold text-neutral-500 uppercase tracking-widest">
              Hoy estás libre
            </div>
            <div className="text-xs font-medium text-neutral-400 mt-1">¡Disfruta tu día! 😄</div>
          </div>
        )}
      </div>
    </div>
  );
}
