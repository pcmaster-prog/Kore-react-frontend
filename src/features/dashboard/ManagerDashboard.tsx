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
} from "./SupervisorDashboard";
import type { Template } from "@/features/tasks/catalog/api";
import SupervisorDashboard from "./SupervisorDashboard";
import TaskCatalogPanel from "@/features/tasks/TaskCatalogPanel";
import {
  AlertTriangle, CheckCircle2, Clock, ClipboardList,
  Activity, Zap, ChevronRight, ArrowUpRight, ArrowDownRight,
  TrendingUp,
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

function readableAction(action: string, meta?: any): string {
  const m = meta ?? {};
  switch (action) {
    case "task.bulk_created":   return `Tareas creadas${m.task_title ? `: ${m.task_title}` : ""}`;
    case "task.bulk_reused":    return `Rutina reutilizada${m.task_title ? `: ${m.task_title}` : ""}`;
    case "task.status_changed": {
      const s: Record<string, string> = { completed: "Completada", in_progress: "En progreso", open: "Abierta" };
      return m.task_title ? `${m.task_title} → ${s[m.to] ?? m.to}` : `Estado cambiado → ${s[m.to] ?? m.to}`;
    }
    case "evidence.uploaded":   return `Evidencia subida${m.task_title ? `: ${m.task_title}` : ""}`;
    case "attendance.check_in": return `Entrada: ${m.employee_name ?? "Empleado"}`;
    case "attendance.check_out":return `Salida: ${m.employee_name ?? "Empleado"}`;
    default: return action.replace(/\./g, " · ").replace(/_/g, " ");
  }
}

function actionIcon(action: string): React.ReactNode {
  if (action.startsWith("attendance.check_in"))  return <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><ArrowUpRight className="h-4 w-4" /></div>;
  if (action.startsWith("attendance.check_out")) return <div className="h-9 w-9 rounded-xl bg-neutral-50 text-neutral-400 flex items-center justify-center"><ArrowDownRight className="h-4 w-4" /></div>;
  if (action.includes("completed"))              return <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><CheckCircle2 className="h-4 w-4" /></div>;
  if (action.includes("evidence"))               return <div className="h-9 w-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center"><Activity className="h-4 w-4" /></div>;
  if (action.includes("bulk_created"))           return <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><ClipboardList className="h-4 w-4" /></div>;
  if (action.includes("reused"))                 return <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><Zap className="h-4 w-4" /></div>;
  return <div className="h-9 w-9 rounded-xl bg-neutral-50 text-neutral-400 flex items-center justify-center"><Activity className="h-4 w-4" /></div>;
}

function StatCard({ label, value, trend, trendType, icon: Icon, colorClass, sub }: any) {
  return (
    <div className="bg-white rounded-[28px] p-5 shadow-sm border border-neutral-100/50 flex flex-col justify-between group hover:shadow-lg transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div className={cx("h-10 w-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110", colorClass)}>
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <div className={cx(
            "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold",
            trendType === "up" ? "bg-emerald-50 text-emerald-600" : trendType === "down" ? "bg-rose-50 text-rose-600" : "bg-neutral-50 text-neutral-500"
          )}>
            {trendType === "up" ? <ArrowUpRight className="h-2.5 w-2.5" /> : trendType === "down" ? <ArrowDownRight className="h-2.5 w-2.5" /> : null}
            {trend}
          </div>
        )}
      </div>
      <div>
        <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.15em] mb-0.5">{label}</div>
        <div className="text-2xl font-black text-obsidian tracking-tighter">{value}</div>
        {sub && <div className="text-[10px] font-medium text-neutral-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

// ─── Admin Dashboard ─────────────────────────────────────────────────────────

function AdminDashboard() {
  const { user } = auth.get();
  const userName = user?.name?.split(" ")[0] ?? "Usuario";

  const [data, setData] = useState<ManagerDash | null>(null);
  const [pending, setPending] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [workload, setWorkload] = useState<EmployeeWorkload[]>([]);
  const [modal, setModal] = useState<{ open: boolean; tasks: { id: string; title: string }[] }>({
    open: false, tasks: [],
  });
  const [templateModal, setTemplateModal] = useState<{ open: boolean; templates: Template[] }>({
    open: false, templates: [],
  });
  const [showNewTask, setShowNewTask] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

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
      try {
        const wl = await getSupervisorDashboard();
        if (alive) setWorkload(wl.workload ?? []);
      } catch { if (alive) setWorkload([]); }
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
  const t = data?.today ?? {};
  const todayFull = new Date().toLocaleDateString("es-MX", {
    weekday: "long", day: "numeric", month: "long",
  });

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4 animate-in-fade">
      <div className="h-12 w-12 border-4 border-obsidian/10 border-t-obsidian rounded-full animate-spin" />
      <div className="text-[11px] font-bold text-obsidian/40 uppercase tracking-widest animate-pulse">Cargando...</div>
    </div>
  );

  if (err) return (
    <div className="rounded-[32px] bg-white border border-rose-100 p-8 text-center max-w-md mx-auto mt-10">
      <div className="h-16 w-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h2 className="text-xl font-black text-obsidian mb-2">Error de Conexión</h2>
      <p className="text-sm text-neutral-500 mb-6">{err}</p>
      <button onClick={() => window.location.reload()} className="h-11 px-6 bg-obsidian text-white rounded-xl font-bold text-sm">Reintentar</button>
    </div>
  );

  return (
    <div className="space-y-6 animate-in-up">

      {/* 1 · Hero */}
      <div className="relative overflow-hidden bg-obsidian rounded-[40px] p-8 lg:p-12 text-white shadow-2xl shadow-obsidian/20">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[10px] font-bold tracking-[0.2em] uppercase mb-5">
            <TrendingUp className="h-3 w-3 text-gold-light" />
            Control Operativo · {todayFull}
          </div>
          <h1 className="text-4xl lg:text-5xl font-black tracking-tight mb-3 leading-[1.1]">
            Hola, <span className="text-gold-light italic">{userName}</span>.
          </h1>
          <p className="text-white/60 text-base font-medium leading-relaxed max-w-lg">
            <span className="text-white font-bold">{pending} aprobaciones</span> pendientes · cumplimiento al{" "}
            <span className="text-white font-bold">
              {Math.round(((t.completed ?? 0) / ((t.open ?? 0) + (t.in_progress ?? 0) + (t.completed ?? 0) || 1)) * 100)}%
            </span> hoy
          </p>
        </div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/5 to-transparent pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-gold/10 rounded-full blur-[100px]" />
      </div>

      {/* 2 · KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Abiertas"   value={k.open ?? 0}        trend="Estable" trendType="none" icon={ClipboardList}  colorClass="bg-blue-50 text-blue-600"    sub="Tareas pendientes" />
        <StatCard label="En Proceso" value={k.in_progress ?? 0} trend="+2"      trendType="up"   icon={Clock}          colorClass="bg-amber-50 text-amber-600"  sub="Ejecutándose ahora" />
        <StatCard label="Completadas" value={k.completed ?? 0}  trend="+12%"    trendType="up"   icon={CheckCircle2}   colorClass="bg-emerald-50 text-emerald-600" sub="Total este mes" />
        <StatCard label="Vencidas"   value={k.overdue ?? 0}     trend="-3"      trendType="down" icon={AlertTriangle}  colorClass="bg-rose-50 text-rose-600"    sub="Urgente atención" />
      </div>

      {/* 3 · Tareas Abiertas (full width) */}
      <OpenTasksPanel
        onTaskClick={t => openModal([t])}
        onNewTask={() => setShowNewTask(true)}
        refreshKey={refreshKey}
      />

      {/* 4 · Disponibles + Carga */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AvailableTasksPanel
          onAssignTemplates={templates => setTemplateModal({ open: true, templates })}
          onNewTask={() => setShowNewTask(true)}
        />
        <WorkloadCard workload={workload} />
      </div>

      {/* 5 · Actividad + Asistencia */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity */}
        <div className="lg:col-span-2 bg-white rounded-[40px] p-8 shadow-sm border border-neutral-100/50">
          <div className="mb-6">
            <h2 className="text-xl font-black text-obsidian tracking-tight">Actividad del Turno</h2>
            <p className="text-[11px] font-bold text-neutral-400 mt-1 uppercase tracking-widest">Tiempo Real</p>
          </div>
          <div className="divide-y divide-neutral-50">
            {data?.activity?.length ? (
              data.activity.slice(0, showAllActivity ? undefined : 5).map(a => (
                <div key={a.id} className="flex items-center gap-4 py-3.5 group cursor-pointer">
                  {actionIcon(a.action)}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-obsidian truncate group-hover:text-gold transition-colors">
                      {readableAction(a.action, a.meta)}
                    </div>
                    <div className="text-[11px] font-medium text-neutral-400 mt-0.5">
                      {new Date(a.created_at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-neutral-200 group-hover:text-neutral-400 transition-colors" />
                </div>
              ))
            ) : (
              <div className="py-10 text-center">
                <Zap className="h-8 w-8 text-neutral-100 mx-auto mb-2" />
                <p className="text-xs font-bold text-neutral-300 uppercase tracking-widest">Sin actividad reciente</p>
              </div>
            )}
          </div>
          {data?.activity && data.activity.length > 5 && (
            <button
              onClick={() => setShowAllActivity(!showAllActivity)}
              className="w-full mt-6 h-12 rounded-2xl bg-neutral-50 text-obsidian font-bold text-sm hover:bg-neutral-100 transition-all"
            >
              {showAllActivity ? "Ver Menos" : "Ver Todo el Registro"}
            </button>
          )}
        </div>

        {/* Attendance */}
        <div className="space-y-6">
          {data?.attendance && (
            <div className="bg-white rounded-[40px] p-8 shadow-sm border border-neutral-100/50">
              <h3 className="text-lg font-black text-obsidian tracking-tight mb-5">Asistencia Hoy</h3>
              <div className="flex items-end justify-between mb-3">
                <div className="text-4xl font-black text-obsidian">{data.attendance.checked_in}</div>
                <div className="text-xs font-bold text-neutral-400 uppercase pb-1">de {data.attendance.employees_total} Staff</div>
              </div>
              <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden flex gap-0.5 mb-5">
                <div className="h-full bg-emerald-400" style={{ width: `${(data.attendance.open / data.attendance.employees_total) * 100}%` }} />
                <div className="h-full bg-neutral-300" style={{ width: `${(data.attendance.closed / data.attendance.employees_total) * 100}%` }} />
                <div className="h-full bg-rose-300"    style={{ width: `${(data.attendance.out / data.attendance.employees_total) * 100}%` }} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <div className="text-sm font-bold text-emerald-600">{data.attendance.open}</div>
                  <div className="text-[10px] font-medium text-neutral-400 uppercase">Turno</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-neutral-400">{data.attendance.closed}</div>
                  <div className="text-[10px] font-medium text-neutral-400 uppercase">Fuera</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-rose-400">{data.attendance.out}</div>
                  <div className="text-[10px] font-medium text-neutral-400 uppercase">Sin-E</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal asignar empleado */}
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

      {/* Modal asignar plantilla(s) */}
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

      {/* Modal nueva tarea */}
      {showNewTask && (
        <TaskCatalogPanel
          onAssigned={handleNewTaskDone}
          onClose={() => setShowNewTask(false)}
        />
      )}
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
