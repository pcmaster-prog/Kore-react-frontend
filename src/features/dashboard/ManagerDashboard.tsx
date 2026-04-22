// src/features/dashboard/ManagerDashboard.tsx
import { useEffect, useState } from "react";
import api from "@/lib/http";
import { listPendingApprovals } from "@/features/tasks/api";
import { auth } from "@/features/auth/store";
import { getSupervisorDashboard } from "./api";
import type { EmployeeWorkload } from "./types";
import {
  AssignTaskModal,
  AssignTemplateModal,
  OpenTasksPanel,
  AvailableTasksPanel,
  WorkloadCard,
  TaskDetailModal,
} from "./SupervisorDashboard";
import type { Template, Routine } from "@/features/tasks/catalog/api";
import AssignRoutineModal from "@/features/tasks/catalog/AssignRoutineModal";
import type { Task } from "@/features/tasks/types";
import SupervisorDashboard from "./SupervisorDashboard";
import TaskCatalogPanel from "@/features/tasks/TaskCatalogPanel";
import {
  AlertTriangle, CheckCircle2, Clock, ClipboardList,
  CalendarCheck, PlusCircle, FileText, ArrowRight, ChevronDown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { isEnabled } from "@/lib/featureFlags";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import KpiCard from "@/components/KpiCard";
import PageSkeleton from "@/components/PageSkeleton";

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
  attendance?: AttendanceSnap;
};

// ─── Activity feed types ────────────────────────────────────────────────────────────
type ActivityItem = { id: string | number; text: string; time: string };

// ─── Admin Dashboard (Fase 2 Refactored) ─────────────────────────────────────

function AdminDashboard() {
  const nav = useNavigate();
  const { user } = auth.get();
  const userName = user?.name?.split(" ")[0] ?? "Usuario";

  const [data, setData] = useState<ManagerDash | null>(null);
  const [pending, setPending] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [workload, setWorkload] = useState<EmployeeWorkload[]>([]);
  const [modal, setModal] = useState<{ open: boolean; tasks: { id: string; title: string }[] }>({
    open: false, tasks: [],
  });
  const [templateModal, setTemplateModal] = useState<{ open: boolean; templates: Template[] }>({
    open: false, templates: [],
  });
  const [detailModal, setDetailModal] = useState<Task | null>(null);
  const [routineModal, setRoutineModal] = useState<{ open: boolean; routine: Routine | null }>({
    open: false, routine: null,
  });
  const [showNewTask, setShowNewTask] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activityOpen, setActivityOpen] = useState(false);
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr(null);
    (async () => {
      try {
        const res = await api.get("/dashboard/manager");
        if (alive) setData(res.data?.data ?? res.data ?? {});
      } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        if (alive) { setErr(e?.response?.data?.message ?? "No se pudo cargar el dashboard"); setData({}); }
      }
      try {
        const res = await listPendingApprovals({ page: 1 });
        if (alive) setPending(res?.total ?? res?.data?.length ?? 0);
      } catch { if (alive) setPending(0); }
      try {
        const wl = await getSupervisorDashboard();
        if (alive && wl) {
          const w = wl.workload;
          setWorkload(Array.isArray(w) ? w : w ? Object.values(w) : []);
        }
      } catch { if (alive) setWorkload([]); }
      try {
        const res = await api.get("/activity-logs", { params: { per_page: 5 } });
        if (alive) {
          const raw = res.data?.data ?? res.data ?? [];
          const adapted = raw.map((i: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
             let text = i.action;
             if (i.action.startsWith("task.bulk_created")) text = `Tareas creadas: ${i.meta?.task_title ?? i.meta?.template_title ?? "plantilla"}`;
             else if (i.action.startsWith("task.bulk_reused")) text = `Rutina reutilizada: ${i.meta?.task_title ?? i.meta?.template_title ?? "rutina"}`;
             else if (i.action.startsWith("task.status_changed")) text = `Estado cambiado: ${i.meta?.task_title ?? "tarea"}`;
             else if (i.action.startsWith("task.approved")) text = `Tarea aprobada: ${i.meta?.task_title ?? "tarea"}`;
             else if (i.action.startsWith("task.rejected")) text = `Tarea rechazada: ${i.meta?.task_title ?? "tarea"}`;
             else if (i.action.startsWith("evidence.uploaded")) text = `Evidencia subida: ${i.meta?.task_title ?? "tarea"}`;
             else if (i.action.startsWith("checklist.updated")) text = `Checklist actualizado: ${i.meta?.task_title ?? "tarea"}`;
             else if (i.action.startsWith("attendance.check_in")) text = `Entrada registrada: ${i.meta?.employee_name ?? "Empleado"}`;
             else if (i.action.startsWith("attendance.check_out")) text = `Salida registrada: ${i.meta?.employee_name ?? "Empleado"}`;
             else if (i.action.startsWith("attendance.break_start")) text = `Pausa iniciada: ${i.meta?.employee_name ?? "Empleado"}`;
             else if (i.action.startsWith("attendance.break_end")) text = `Pausa reanudada: ${i.meta?.employee_name ?? "Empleado"}`;
             else if (i.action.startsWith("user.created")) text = `Usuario creado: ${i.meta?.user_name ?? "Nuevo"}`;
             else text = i.action.replace(/\./g, " ").replace(/_/g, " ");
  
             const timeStr = new Date(i.created_at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
             
             return { id: i.id, text, time: `a las ${timeStr}` };
          });
          setActivityFeed(adapted);
        }
      } catch { /* silent */ }
      if (alive) setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  function openModal(tasks: { id: string; title: string }[]) {
    setModal({ open: true, tasks });
  }

  function handleNewTaskDone() {
    setShowNewTask(false);
    setRefreshKey(k => k + 1);
  }

  const k = data?.kpi ?? {};

  const useNewLayout = isEnabled("newAdminDashboard");

  // ─── Loading State (skeleton) ───────────────────────────────────────────────
  if (loading) {
    return <PageSkeleton />;
  }

  // ─── Error State ────────────────────────────────────────────────────────────
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

  // ─── Compute header badge ───────────────────────────────────────────────────
  // const headerBadge = pending === 0
  //   ? { text: "Todo bajo control ✓", variant: "success" as const }
  //   : { text: `${pending} pendientes`, variant: "danger" as const };

  const todayFull = new Date().toLocaleDateString("es-MX", {
    weekday: "long", day: "numeric", month: "long",
  });

  // ─── Activity feed is now fetched in the useEffect above ───────────────────

  return (
    <div className="space-y-6 animate-in-up">

      {/* ── 2.1 · Header Unificado Inteligente ─────────────────────── */}
      {useNewLayout ? (
        <PageHeader
          title={`Buenos días, ${userName} · ${todayFull}`}
          actions={
            <>
              {/* 2.4 Acciones Rápidas */}
              <button
                onClick={() => setShowNewTask(true)}
                className="h-10 px-5 rounded-xl bg-k-accent-btn text-k-accent-btn-text text-sm font-bold
                           hover:opacity-90 transition-all shadow-k-card
                           flex items-center gap-2"
              >
                <PlusCircle className="h-4 w-4" />
                Nueva Tarea
              </button>
              <button
                onClick={() => nav("/app/manager/asistencia")}
                className="h-10 px-5 rounded-xl bg-k-bg-card border border-k-border text-sm font-bold text-k-text-h
                           hover:bg-k-bg-card2 transition-colors shadow-k-card
                           flex items-center gap-2"
              >
                <CalendarCheck className="h-4 w-4 text-k-text-b" />
                Ver Asistencia
              </button>
              <button
                onClick={() => nav("/app/manager/nomina")}
                className="h-10 px-5 rounded-xl bg-k-bg-card border border-k-border text-sm font-bold text-k-text-h
                           hover:bg-k-bg-card2 transition-colors shadow-k-card
                           flex items-center gap-2"
              >
                <FileText className="h-4 w-4 text-k-text-b" />
                Generar Nómina
              </button>
            </>
          }
        />
      ) : (
        /* Legacy hero — kept behind feature flag */
        <div className="relative overflow-hidden bg-k-bg-sidebar rounded-[40px] p-8 lg:p-12 text-k-text-h shadow-2xl shadow-obsidian/20">
          <div className="relative z-10 max-w-2xl">
            <h1 className="text-4xl lg:text-5xl font-black tracking-tight mb-3 leading-[1.1]">
              Hola, <span className="text-gold-light italic">{userName}</span>.
            </h1>
            <p className="text-k-text-h/60 text-base font-medium leading-relaxed max-w-lg">
              <span className="text-k-text-h font-bold">{pending} aprobaciones</span> pendientes
            </p>
          </div>
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/5 to-transparent pointer-events-none" />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-gold/10 rounded-full blur-[100px]" />
        </div>
      )}

      {/* ── Fila de Métricas Rápidas (Completadas + Asistencia) ───── */}
      {useNewLayout && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-k-bg-card border border-k-border shadow-k-card shrink-0">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <span className="text-sm font-bold text-k-text-h">
              Completadas hoy: {data?.today?.completed ?? 0}
            </span>
          </div>

          {data?.attendance && (
            <button
              onClick={() => nav("/app/manager/asistencia")}
              className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-k-bg-card border border-k-border shadow-k-card
                         hover:shadow-md hover:bg-k-bg-card2 transition-all group shrink-0 text-left"
            >
              <CalendarCheck className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-bold text-k-text-h">
                {data.attendance.checked_in}/{data.attendance.employees_total} presentes hoy
              </span>
              <ArrowRight className="h-4 w-4 text-k-text-b group-hover:text-k-text-b group-hover:translate-x-0.5 transition-all ml-1" />
            </button>
          )}
        </div>
      )}

      {/* ── 2.2 · KPIs (ocultos en 0) ──────────────────────────────── */}
      {useNewLayout ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <KpiCard label="Abiertas"    value={k.open ?? 0}        icon={ClipboardList} color="blue"   sub="Tareas pendientes"  compact />
          <KpiCard label="En Proceso"  value={k.in_progress ?? 0} icon={Clock}         color="yellow" sub="Ejecutándose ahora"  compact />
          <KpiCard label="Vencidas"    value={k.overdue ?? 0}     icon={AlertTriangle} color="red"    sub="Urgente atención"    compact />
        </div>
      ) : (
        /* Legacy full grid */
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <LegacyStatCard label="Abiertas"    value={k.open ?? 0}        icon={ClipboardList} colorClass="bg-blue-50 text-blue-600"      sub="Tareas pendientes" />
          <LegacyStatCard label="En Proceso"  value={k.in_progress ?? 0} icon={Clock}         colorClass="bg-amber-50 text-amber-600"    sub="Ejecutándose ahora" />
          <LegacyStatCard label="Completadas" value={k.completed ?? 0}   icon={CheckCircle2}  colorClass="bg-emerald-50 text-emerald-600" sub="Total este mes" />
          <LegacyStatCard label="Vencidas"    value={k.overdue ?? 0}     icon={AlertTriangle} colorClass="bg-rose-50 text-rose-600"      sub="Urgente atención" />
        </div>
      )}

      {/* ── 3 · Tareas Abiertas (full width) ──────────────────────── */}
      <OpenTasksPanel
        onTaskClick={t => {
          if (t.assignees && t.assignees.length > 0) {
            setDetailModal(t);
          } else {
            openModal([{ id: t.id, title: t.title }]);
          }
        }}
        onNewTask={() => setShowNewTask(true)}
        refreshKey={refreshKey}
      />

      {/* ── 4 · Disponibles + Carga ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AvailableTasksPanel
          onAssignTemplates={templates => setTemplateModal({ open: true, templates })}
          onAssignRoutine={routine => setRoutineModal({ open: true, routine })}
          onNewTask={() => setShowNewTask(true)}
          refreshKey={refreshKey}
        />
        <WorkloadCard workload={workload} />
      </div>

      {/* ── 2.5 · Feed de Actividad Reciente (PENDIENTE BACKEND) ── */}
      {useNewLayout && (
        <div className="bg-k-bg-card rounded-[28px] shadow-k-card border border-k-border overflow-hidden">
          <button 
            onClick={() => setActivityOpen(!activityOpen)}
            className="w-full p-6 flex items-center justify-between hover:bg-k-bg-card2 transition-colors"
          >
            <h3 className="text-lg font-black text-k-text-h tracking-tight">
              Actividad Reciente
            </h3>
            <ChevronDown className={cx("h-5 w-5 text-k-text-b transition-transform duration-300", activityOpen ? "rotate-180" : "rotate-0")} />
          </button>
          
          {activityOpen && (
            <div className="p-6 pt-0 space-y-3 border-t border-neutral-50 animate-in-fade">
              {activityFeed.length > 0 ? (
                activityFeed.map(item => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-3 rounded-2xl hover:bg-k-bg-card2 transition-colors group"
                  >
                    <div className="h-8 w-8 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0 group-hover:bg-neutral-200 transition-colors">
                      <ClipboardList className="h-4 w-4 text-k-text-b" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="text-sm font-medium text-neutral-700 truncate">{item.text}</div>
                      <div className="text-[10px] font-bold text-k-text-b uppercase tracking-wider mt-0.5">{item.time}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-k-text-b text-center py-4">No hay actividad reciente</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── 2.3 · Asistencia: Link en vez de card (cuando newLayout) ─ */}
      {!useNewLayout && (
        /* Legacy attendance card */
        data?.attendance && (
          <div className="bg-k-bg-card rounded-[40px] p-8 shadow-k-card border border-k-border max-w-sm">
            <h3 className="text-lg font-black text-k-text-h tracking-tight mb-5">Asistencia Hoy</h3>
            <div className="flex items-end justify-between mb-3">
              <div className="text-4xl font-black text-k-text-h">{data.attendance.checked_in}</div>
              <div className="text-xs font-bold text-k-text-b uppercase pb-1">de {data.attendance.employees_total} Staff</div>
            </div>
            <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden flex gap-0.5 mb-5">
              <div className="h-full bg-emerald-400" style={{ width: `${(data.attendance.open / (data.attendance.employees_total || 1)) * 100}%` }} />
              <div className="h-full bg-neutral-300" style={{ width: `${(data.attendance.closed / (data.attendance.employees_total || 1)) * 100}%` }} />
              <div className="h-full bg-rose-300"    style={{ width: `${(data.attendance.out / (data.attendance.employees_total || 1)) * 100}%` }} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <div className="text-sm font-bold text-emerald-600">{data.attendance.open}</div>
                <div className="text-[10px] font-medium text-k-text-b uppercase">Turno</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-k-text-b">{data.attendance.closed}</div>
                <div className="text-[10px] font-medium text-k-text-b uppercase">Fuera</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-rose-400">{data.attendance.out}</div>
                <div className="text-[10px] font-medium text-k-text-b uppercase">Sin-E</div>
              </div>
            </div>
          </div>
        )
      )}

      {/* ── Modals ─────────────────────────────────────────────────── */}
      {detailModal && (
        <TaskDetailModal 
          task={detailModal} 
          onClose={() => setDetailModal(null)} 
          onDeleted={() => {
            setDetailModal(null);
            setRefreshKey(k => k + 1);
            getSupervisorDashboard().then(r => setWorkload(r.workload ?? []));
          }}
        />
      )}

      {modal.open && (
        <AssignTaskModal
          tasks={modal.tasks}
          workload={workload}
          onClose={() => setModal({ open: false, tasks: [] })}
          onAssigned={() => {
            setModal({ open: false, tasks: [] });
            setRefreshKey(k => k + 1);
            getSupervisorDashboard().then(r => setWorkload(r.workload ?? []));
          }}
        />
      )}

      {routineModal.open && routineModal.routine && (
        <AssignRoutineModal
          open={routineModal.open}
          routineName={routineModal.routine.name}
          onClose={() => setRoutineModal({ open: false, routine: null })}
          onAssign={async (payload) => {
            const { assignRoutine } = await import("@/features/tasks/catalog/api");
            await assignRoutine(routineModal.routine!.id, payload);
            setRoutineModal({ open: false, routine: null });
            setRefreshKey(k => k + 1);
            getSupervisorDashboard().then(r => setWorkload(r.workload ?? []));
          }}
        />
      )}

      {templateModal.open && (
        <AssignTemplateModal
          templates={templateModal.templates}
          workload={workload}
          onClose={() => setTemplateModal({ open: false, templates: [] })}
          onAssigned={() => {
            setTemplateModal({ open: false, templates: [] });
            setRefreshKey(k => k + 1);
            getSupervisorDashboard().then(r => setWorkload(r.workload ?? []));
          }}
        />
      )}

      {showNewTask && (
        <TaskCatalogPanel
          onAssigned={handleNewTaskDone}
          onClose={() => setShowNewTask(false)}
        />
      )}
    </div>
  );
}

// ─── Legacy StatCard (for feature flag fallback) ─────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function LegacyStatCard({ label, value, icon: Icon, colorClass, sub }: any) {
  return (
    <div className="bg-k-bg-card rounded-[28px] p-5 shadow-k-card border border-k-border flex flex-col justify-between group hover:shadow-lg transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div className={cx("h-10 w-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110", colorClass)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div>
        <div className="text-[10px] font-bold text-k-text-b uppercase tracking-[0.15em] mb-0.5">{label}</div>
        <div className="text-2xl font-black text-k-text-h tracking-tighter">{value}</div>
        {sub && <div className="text-[10px] font-medium text-k-text-b mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

// ─── Router ──────────────────────────────────────────────────────────────────

export default function ManagerDashboard() {
  const { user } = auth.get();
  const isSupervisor = user?.role === "supervisor";
  const userName = user?.name?.split(" ")[0] ?? "Usuario";

  if (isSupervisor) return <SupervisorDashboard userName={userName} />;
  return <AdminDashboard />;
}
