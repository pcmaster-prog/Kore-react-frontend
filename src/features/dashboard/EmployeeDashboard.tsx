//features/dashboard/EmployeeDashboard.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/http";
import {
  listMyAssignments,
  updateMyAssignment,
  type MyAssignmentRow,
} from "@/features/tasks/api";
import { misOrdenesGondola } from "@/features/gondolas/api";
import type { GondolaOrden } from "@/features/gondolas/types";
import {
  CalendarCheck, ClipboardList, Flame, CheckCircle2,
  PlayCircle, AlertTriangle, ArrowRight, LayoutGrid, Calendar,
} from "lucide-react";
import { isEnabled } from "@/lib/featureFlags";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import KpiCard from "@/components/KpiCard";
import PageSkeleton from "@/components/PageSkeleton";
import { auth } from "@/features/auth/store";
import TardinessWidget from "@/features/tardiness/TardinessWidget";

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
    s === "in_progress" ? { label: "En progreso", cls: "bg-amber-50 text-amber-800 border-amber-200" }
    : s === "done_pending" ? { label: "En revisión", cls: "bg-indigo-50 text-indigo-800 border-indigo-200" }
    : s === "approved" ? { label: "Aprobada", cls: "bg-emerald-50 text-emerald-800 border-emerald-200" }
    : s === "rejected" ? { label: "Rechazada", cls: "bg-rose-50 text-rose-800 border-rose-200" }
    : s === "assigned" ? { label: "Asignada", cls: "bg-k-bg-card2 text-neutral-700 border-k-border" }
    : { label: status ?? "-", cls: "bg-k-bg-card2 text-neutral-700 border-k-border" };
  return <span className={cx("inline-flex items-center rounded-full border px-2 py-0.5 text-xs", conf.cls)}>{conf.label}</span>;
}

function PriorityPill({ priority }: { priority?: string }) {
  const p = (priority ?? "medium").toLowerCase();
  const conf =
    p === "urgent" ? { label: "Urgente", cls: "bg-rose-50 text-rose-800 border-rose-200" }
    : p === "high" ? { label: "Alta", cls: "bg-orange-50 text-orange-800 border-orange-200" }
    : p === "low" ? { label: "Baja", cls: "bg-sky-50 text-sky-800 border-sky-200" }
    : { label: "Media", cls: "bg-k-bg-card2 text-neutral-700 border-k-border" };
  return <span className={cx("inline-flex items-center rounded-full border px-2 py-0.5 text-xs", conf.cls)}>{conf.label}</span>;
}

export default function EmployeeDashboard() {
  const nav = useNavigate();
  const useNew = isEnabled("newEmployeeDashboard");
  const { user } = auth.get();
  const userName = user?.name?.split(" ")[0] ?? "Usuario";

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [dash, setDash] = useState<EmployeeDash | null>(null);
  const [rows, setRows] = useState<MyAssignmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "ok" | "warn" | "err"; msg: string } | null>(null);
  const [gondolaOrdenes, setGondolaOrdenes] = useState<GondolaOrden[]>([]);

  async function loadAll() {
    setLoading(true);
    setErr(null);
    try {
      const d = await api.get("/dashboard/employee");
      setDash(d.data?.data ?? d.data);
      const a = await listMyAssignments({ page: 1, date: today });
      setRows(a.data ?? []);
      misOrdenesGondola().then(setGondolaOrdenes).catch(() => setGondolaOrdenes([]));
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "No pude cargar tu dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let alive = true;
    (async () => { if (alive) await loadAll(); })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today]);

  const counts = useMemo(() => {
    const open = rows.filter((r) => r.assignment.status === "assigned").length;
    const in_progress = rows.filter((r) => r.assignment.status === "in_progress").length;
    const completed = rows.filter((r) => r.assignment.status === "approved").length;
    const pending = rows.filter((r) => r.assignment.status === "done_pending").length;
    return { open, in_progress, completed, pending };
  }, [rows]);

  const allZero = counts.open === 0 && counts.in_progress === 0 && counts.completed === 0 && counts.pending === 0;
  const gondolasActivas = gondolaOrdenes.filter(o => ['pendiente','en_proceso','rechazado'].includes(o.status));

  const attendanceState = (dash?.attendance?.state ?? "-").toLowerCase();
  const attendanceNice =
    attendanceState === "checked_in" ? { label: "En turno", cls: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", icon: <CalendarCheck className="h-4 w-4" /> }
    : attendanceState === "on_break" ? { label: "En pausa", cls: "bg-amber-500/20 text-amber-300 border-amber-500/30", icon: <Flame className="h-4 w-4" /> }
    : attendanceState === "checked_out" ? { label: "Salida registrada", cls: "bg-k-bg-card/10 text-white/80 border-white/20", icon: <CheckCircle2 className="h-4 w-4" /> }
    : { label: dash?.attendance?.state ?? "-", cls: "bg-k-bg-card/5 text-white/50 border-white/10", icon: <AlertTriangle className="h-4 w-4" /> };

  // 2.8 — Contextual status text
  const shiftText =
    attendanceState === "checked_in" ? "Estás en turno activo"
    : attendanceState === "on_break" ? "Estás en tu descanso"
    : attendanceState === "checked_out" ? "Tu turno ha finalizado"
    : "Hoy es tu día de descanso";

  async function doStart(assignmentId: string) {
    setBusyId(assignmentId); setToast(null);
    try {
      await updateMyAssignment(assignmentId, { status: "in_progress" });
      setToast({ type: "ok", msg: "Tarea iniciada ✅" }); await loadAll();
    } catch (e: any) {
      setToast({ type: "err", msg: e?.response?.data?.message ?? "No se pudo iniciar" });
    } finally { setBusyId(null); }
  }

  async function doSubmit(assignmentId: string) {
    setBusyId(assignmentId); setToast(null);
    try {
      await updateMyAssignment(assignmentId, { status: "done_pending" });
      setToast({ type: "ok", msg: "Enviada a revisión ✅" }); await loadAll();
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? "No se pudo enviar";
      if (e?.response?.status === 422) setToast({ type: "warn", msg: msg + " (sube evidencia en Mis tareas)" });
      else setToast({ type: "err", msg });
    } finally { setBusyId(null); }
  }

  // ─── Loading ────────────────────────────────────────────────────────────────
  if (loading) return <PageSkeleton />;

  // ─── Error ──────────────────────────────────────────────────────────────────
  if (err) {
    return (
      <EmptyState
        variant="action"
        icon={AlertTriangle}
        title="No pudimos cargar tu dashboard"
        description={err}
        action={{ label: "Reintentar", onClick: () => window.location.reload() }}
      />
    );
  }

  return (
    <div className="space-y-6">

      {/* ── 2.7 · Header compacto personalizado ──────────────────── */}
      {useNew ? (
        <PageHeader
          compact
          title={`Buenos días, ${userName}`}
          subtitle={shiftText}
          badge={
            attendanceState === "checked_in"
              ? { text: "En turno", variant: "success" }
              : attendanceState === "on_break"
              ? { text: "En pausa", variant: "warning" }
              : undefined
          }
        />
      ) : (
        <div className="relative rounded-[32px] sm:rounded-[40px] bg-k-bg-sidebar overflow-hidden px-6 py-8 sm:px-8 sm:py-10 text-white shadow-lg">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-k-bg-card/[0.03]" />
            <div className="absolute bottom-0 left-1/4 h-24 w-48 rounded-full bg-gold/10" />
          </div>
          <div className="relative flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-1">Tu Agenda</p>
              <h1 className="text-3xl font-black tracking-tight">Mi día</h1>
            </div>
            <span className={cx("inline-flex items-center gap-2 rounded-2xl border px-5 py-2.5 text-xs font-bold uppercase tracking-widest shadow-k-card backdrop-blur-md", attendanceNice.cls)}>
              {attendanceNice.icon}{attendanceNice.label}
            </span>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={cx(
          "rounded-2xl border px-5 py-4 text-sm font-bold flex items-center gap-3 animate-in-fade",
          toast.type === "ok" && "border-emerald-200 bg-emerald-50 text-emerald-800",
          toast.type === "warn" && "border-amber-200 bg-amber-50 text-amber-800",
          toast.type === "err" && "border-rose-200 bg-rose-50 text-rose-800"
        )}>
          {toast.type === "ok" ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
          {toast.msg}
        </div>
      )}

      {/* ── 2.9 · KPIs: si todos son 0, EmptyState celebration ──── */}
      {useNew && allZero && rows.length === 0 ? (
        <EmptyState
          variant="celebration"
          title="¡Hoy estás libre!"
          description="Disfruta tu día · No tienes tareas pendientes"
        />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {useNew ? (
            <>
              <KpiCard label="Asignadas"   value={counts.open}        icon={ClipboardList} color="blue"   sub="Listas para iniciar" compact />
              <KpiCard label="En progreso" value={counts.in_progress} icon={PlayCircle}    color="yellow" sub="Trabajándose" compact />
              <KpiCard label="En revisión" value={counts.pending}     icon={AlertTriangle} color="purple" sub="Esperando aprobación" compact />
              <KpiCard label="Góndolas"    value={gondolasActivas.length} icon={LayoutGrid} color="yellow" sub="Por rellenar" compact />
            </>
          ) : (
            <>
              <LegacyStat title="Asignadas" value={counts.open} icon={<ClipboardList className="h-5 w-5" />} colorCls="text-blue-600" bgCls="bg-blue-50/50 border-blue-100" hint="Listas para iniciar" />
              <LegacyStat title="En progreso" value={counts.in_progress} icon={<PlayCircle className="h-5 w-5" />} colorCls="text-amber-600" bgCls="bg-amber-50/50 border-amber-100" hint="Trabajándose" />
              <LegacyStat title="En revisión" value={counts.pending} icon={<AlertTriangle className="h-5 w-5" />} colorCls="text-indigo-600" bgCls="bg-indigo-50/50 border-indigo-100" hint="Esperando aprobación" />
              <LegacyStat title="Góndolas" value={gondolasActivas.length} icon={<LayoutGrid className="h-5 w-5" />} colorCls="text-amber-600" bgCls="bg-amber-50/50 border-amber-100" hint="Por rellenar" />
            </>
          )}
        </div>
      )}

      {/* ── 3.7 · Widget de retardos ─────────────────────────────── */}
      <TardinessWidget />

      {/* ── Tasks list ─────────────────────────────────────────────── */}
      <div className="rounded-[40px] border border-k-border bg-k-bg-card shadow-k-card overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-k-border bg-k-bg-card2/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xl font-black text-k-text-h tracking-tight">Tareas de hoy</div>
            {/* 3.8 — Badge conteo solo si > 0 */}
            {rows.length > 0 && (
              <div className="text-[11px] font-bold text-k-text-b uppercase tracking-widest mt-1">
                {rows.length} asignadas
              </div>
            )}
          </div>
          {/* 2.12 — No mostrar "Ir a mis tareas" si no hay tareas */}
          {rows.length > 0 && (
            <button
              className="w-full sm:w-auto rounded-2xl border border-k-border bg-k-bg-card px-5 py-2.5 text-xs font-bold text-k-text-h hover:bg-k-bg-card2 transition-colors shadow-k-card flex items-center justify-center sm:inline-flex uppercase tracking-widest"
              onClick={() => nav("/app/employee/mis-tareas/asignaciones")}
            >
              Ir a Mis tareas <ArrowRight className="h-4 w-4 ml-2 text-k-text-b" />
            </button>
          )}
          {rows.length === 0 && useNew && (
            <button
              className="w-full sm:w-auto rounded-2xl border border-k-border bg-k-bg-card px-5 py-2.5 text-xs font-bold text-k-text-h hover:bg-k-bg-card2 transition-colors shadow-k-card flex items-center justify-center sm:inline-flex uppercase tracking-widest"
              onClick={() => nav("/app/employee/asistencia")}
            >
              <Calendar className="h-4 w-4 mr-2 text-k-text-b" />
              Ver mi horario
            </button>
          )}
        </div>

        {rows.length ? (
          <div className="divide-y divide-neutral-100">
            {rows.map((r, idx) => {
              const a = r.assignment;
              const t = r.task;
              const canStart = a.status === "assigned";
              const canSubmit = a.status === "in_progress";
              return (
                <div key={a.id} className={cx("p-5 sm:p-8 transition-colors", idx % 2 === 0 ? "bg-k-bg-card" : "bg-k-bg-card2 hover:bg-k-bg-card2")}>
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="min-w-0 flex-1">
                      <div className="text-lg font-black text-k-text-h tracking-tight truncate">{t.title}</div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <StatusPill status={a.status} />
                        <PriorityPill priority={t.priority ?? undefined} />
                        {t.due_at && (
                          <span className="inline-flex items-center rounded-full border border-k-border bg-k-bg-card px-2.5 py-1 text-[10px] font-bold text-k-text-b uppercase tracking-widest shadow-k-card">
                            ⏰ {new Date(t.due_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        )}
                      </div>
                      {t.description && <div className="mt-3 text-sm font-medium text-k-text-b line-clamp-2 leading-relaxed">{t.description}</div>}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 mt-2 lg:mt-0 shrink-0">
                      <button className="w-full sm:w-auto rounded-2xl border border-k-border bg-k-bg-card px-6 py-3 text-xs font-bold text-k-text-h hover:bg-k-bg-card2 transition-colors shadow-k-card disabled:opacity-50 uppercase tracking-widest sm:min-w-[120px]" disabled={!canStart || busyId === a.id} onClick={() => doStart(a.id)}>
                        {busyId === a.id ? "Aguarde..." : "▶ Iniciar"}
                      </button>
                      <button className="w-full sm:w-auto rounded-2xl bg-k-accent-btn text-k-accent-btn-text px-6 py-3 text-xs font-bold shadow-md hover:opacity-90 hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-widest sm:min-w-[140px]" disabled={!canSubmit || busyId === a.id} onClick={() => doSubmit(a.id)}>
                        {busyId === a.id ? "Aguarde..." : "📤 Entregar"}
                      </button>
                    </div>
                  </div>
                  {a.status === "in_progress" && (
                    <div className="mt-4 rounded-xl bg-amber-50/50 border border-amber-100 p-3 text-xs font-medium text-amber-700 flex items-center gap-2">
                      <span className="text-amber-500">💡</span>
                      Para entregar, asegúrate de subir evidencia en <b>Mis tareas</b>.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            variant="celebration"
            title="Hoy estás libre"
            description="¡Disfruta tu día! No tienes tareas pendientes"
            className="py-16"
          />
        )}
      </div>

      {/* ── Gondolas ───────────────────────────────────────────────── */}
      {gondolasActivas.length > 0 && (
        <div className="rounded-[40px] border border-k-border bg-k-bg-card shadow-k-card overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-k-border bg-k-bg-card2/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xl font-black text-k-text-h tracking-tight">Góndolas por rellenar</div>
              <div className="text-[11px] font-bold text-k-text-b uppercase tracking-widest mt-1">{gondolasActivas.length} orden(es) activa(s)</div>
            </div>
          </div>
          <div className="divide-y divide-neutral-100">
            {gondolasActivas.map(o => (
              <div key={o.id} className="p-5 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">🛒</span>
                    <div className="text-lg font-black text-k-text-h tracking-tight truncate">{o.gondola?.nombre}</div>
                    <span className={cx("inline-flex items-center rounded-full border px-2 py-0.5 text-xs",
                      o.status === 'rechazado' ? "bg-rose-50 text-rose-800 border-rose-200" :
                      o.status === 'en_proceso' ? "bg-amber-50 text-amber-800 border-amber-200" :
                      "bg-k-bg-card2 text-neutral-700 border-k-border"
                    )}>
                      {o.status === 'rechazado' ? 'Rechazado' : o.status === 'en_proceso' ? 'En proceso' : 'Pendiente'}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-k-text-b">{o.items?.length ?? 0} productos</div>
                  {o.status === 'rechazado' && o.notas_rechazo && (
                    <div className="mt-2 rounded-xl bg-rose-50 border border-rose-100 px-3 py-2 text-xs text-rose-700 font-medium">Motivo: {o.notas_rechazo}</div>
                  )}
                </div>
                <button onClick={() => nav(`/app/employee/gondola-relleno/${o.id}`)} className="w-full lg:w-auto rounded-2xl bg-k-accent-btn text-k-accent-btn-text px-6 py-3 text-xs font-bold shadow-md hover:opacity-90 transition-all flex items-center justify-center gap-2 uppercase tracking-widest">
                  {o.status === 'en_proceso' ? '→ Continuar' : o.status === 'rechazado' ? '↩ Volver a completar' : '▶ Iniciar relleno'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Legacy stat card for feature flag fallback
function LegacyStat({ title, value, icon, hint, colorCls = "text-k-text-h", bgCls = "bg-k-bg-card" }: any) {
  return (
    <div className={cx("rounded-[28px] border p-6 shadow-k-card transition-all hover:shadow-md", bgCls)}>
      <div className="flex items-center justify-between mb-4">
        <div className={cx("text-4xl font-black tracking-tight", colorCls)}>{value}</div>
        <div className="h-10 w-10 rounded-2xl bg-k-bg-card/60 flex items-center justify-center text-k-text-b shadow-k-card border border-k-border">{icon}</div>
      </div>
      <div className="text-[10px] font-bold text-k-text-b uppercase tracking-widest">{title}</div>
      {hint && <div className="mt-1 text-xs font-medium text-k-text-b opacity-80">{hint}</div>}
    </div>
  );
}
