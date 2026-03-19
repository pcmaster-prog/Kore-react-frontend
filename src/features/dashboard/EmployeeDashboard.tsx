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
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-3xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-xs text-neutral-500">{title}</div>
        <div className="text-neutral-400">{icon}</div>
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
      {hint ? <div className="mt-1 text-xs text-neutral-500">{hint}</div> : null}
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
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mi día</h1>
          <div className="text-sm text-neutral-500 capitalize">{todayLabel}</div>
        </div>

        <span className={cx("inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm", attendanceNice.cls)}>
          {attendanceNice.icon}
          {attendanceNice.label}
        </span>
      </div>

      {/* Toast */}
      {toast ? (
        <div
          className={cx(
            "rounded-2xl border px-4 py-3 text-sm",
            toast.type === "ok" && "border-emerald-200 bg-emerald-50 text-emerald-800",
            toast.type === "warn" && "border-amber-200 bg-amber-50 text-amber-800",
            toast.type === "err" && "border-rose-200 bg-rose-50 text-rose-800"
          )}
        >
          {toast.msg}
        </div>
      ) : null}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <StatCard title="Asignadas" value={counts.open} icon={<ClipboardList className="h-4 w-4" />} hint="Listas para iniciar" />
        <StatCard title="En progreso" value={counts.in_progress} icon={<PlayCircle className="h-4 w-4" />} hint="Trabajándose" />
        <StatCard title="En revisión" value={counts.pending} icon={<AlertTriangle className="h-4 w-4" />} hint="Esperando aprobación" />
        <StatCard title="Aprobadas" value={counts.completed} icon={<CheckCircle2 className="h-4 w-4" />} hint="Cerradas hoy" />
      </div>

      {/* List */}
      <div className="rounded-3xl border bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <div className="font-semibold">Tareas de hoy</div>
            <div className="text-xs text-neutral-500">
              {rows.length ? `${rows.length} asignadas` : "Sin tareas por ahora"}
            </div>
          </div>

          <button
            className="rounded-xl border px-3 py-2 text-sm hover:bg-neutral-100"
            onClick={() => nav("/app/employee/mis-tareas/asignaciones")}
          >
            Ir a Mis tareas <ArrowRight className="inline-block h-4 w-4 ml-1" />
          </button>
        </div>

        {rows.length ? (
          <div className="divide-y">
            {rows.map((r) => {
              const a = r.assignment;
              const t = r.task;

              const canStart = a.status === "assigned";
              const canSubmit = a.status === "in_progress";

              return (
                <div key={a.id} className="p-4 hover:bg-neutral-50 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{t.title}</div>

                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <StatusPill status={a.status} />
                        <PriorityPill priority={t.priority ?? undefined} />
                        {t.due_at ? (
                          <span className="text-xs text-neutral-500">
                            Due: {new Date(t.due_at).toLocaleString()}
                          </span>
                        ) : null}
                      </div>

                      {t.description ? (
                        <div className="mt-2 text-sm text-neutral-600 line-clamp-2">{t.description}</div>
                      ) : null}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                      <button
                        className="rounded-xl border px-3 py-2 text-sm hover:bg-neutral-100 disabled:opacity-50"
                        disabled={!canStart || busyId === a.id}
                        onClick={() => doStart(a.id)}
                        title="Iniciar"
                      >
                        {busyId === a.id ? "..." : "▶ Iniciar"}
                      </button>

                      <button
                        className="rounded-xl bg-neutral-900 text-white px-3 py-2 text-sm hover:bg-neutral-800 disabled:opacity-50"
                        disabled={!canSubmit || busyId === a.id}
                        onClick={() => doSubmit(a.id)}
                        title="Enviar a revisión (requiere evidencia)"
                      >
                        {busyId === a.id ? "..." : "📤 Entregar"}
                      </button>
                    </div>
                  </div>

                  {/* Small hint */}
                  {a.status === "in_progress" ? (
                    <div className="mt-2 text-xs text-neutral-500">
                      Tip: para entregar, asegúrate de subir evidencia en <b>Mis tareas</b>.
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 text-sm text-neutral-500">
            Hoy estás libre… o tu admin anda haciendo “asignaciones en su mente” 😄
          </div>
        )}
      </div>
    </div>
  );
}
