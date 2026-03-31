import { useEffect, useState } from "react";
import { getSupervisorDashboard } from "./api";
import type { SupervisorDashData, EmployeeWorkload } from "./types";
import type { Task } from "@/features/tasks/types";
import { assignTask, listTasks, approveAssignment, rejectAssignment } from "@/features/tasks/api";
import {
  Users, Star, Eye, CheckCircle2, XCircle,
  ChevronDown, ChevronUp, ChevronRight, Zap, ClipboardList, Plus
} from "lucide-react";

function cx(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(" ");
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-rose-100 text-rose-700',
  high:   'bg-orange-100 text-orange-700',
  medium: 'bg-amber-100 text-amber-700',
  low:    'bg-neutral-100 text-neutral-500',
};

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
      <div className="h-12 w-12 border-4 border-obsidian/10 border-t-obsidian rounded-full animate-spin" />
      <div className="text-[11px] font-bold text-obsidian/40 uppercase tracking-widest animate-pulse">
        Cargando...
      </div>
    </div>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="rounded-[32px] bg-white border border-rose-100 p-8 text-center max-w-md mx-auto mt-10">
      <div className="h-16 w-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <XCircle className="h-8 w-8" />
      </div>
      <h2 className="text-xl font-black text-obsidian mb-2">Error</h2>
      <p className="text-sm text-neutral-500 mb-6">{message}</p>
      <button onClick={() => window.location.reload()} className="h-11 px-6 bg-obsidian text-white rounded-xl font-bold text-sm">Reintentar</button>
    </div>
  );
}

function KpiCard({ label, value, color, icon }: {
  label: string; value: number; color: string; icon: React.ReactNode;
}) {
  const colors: Record<string, string> = {
    amber:   'bg-amber-50 text-amber-600',
    blue:    'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  };
  return (
    <div className="bg-white rounded-[28px] p-6 shadow-sm border border-neutral-100/50">
      <div className={cx("h-10 w-10 rounded-xl flex items-center justify-center mb-4", colors[color])}>
        {icon}
      </div>
      <div className="text-2xl font-black text-obsidian">{value}</div>
      <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wide mt-1">{label}</div>
    </div>
  );
}

export function AssignTaskModal({
  workload,
  onClose,
  onAssigned,
  preselectedTask,
}: {
  workload: EmployeeWorkload[];
  onClose: () => void;
  onAssigned: () => void;
  preselectedTask?: { id: string; title: string };
}) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState<string>(preselectedTask?.id ?? '');
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [loading, setLoading] = useState(!preselectedTask);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (preselectedTask) return;
    listTasks({ status: 'open', page: 1 })
      .then(res => setTasks(res.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  const WORKLOAD_COLORS: Record<string, string> = {
    bajo:  'bg-emerald-50 border-emerald-200 text-emerald-700',
    medio: 'bg-amber-50 border-amber-200 text-amber-700',
    alto:  'bg-rose-50 border-rose-200 text-rose-700',
  };

  function toggleEmployee(id: string) {
    setSelectedEmployees(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  }

  async function handleAssign() {
    if (!selectedTask || selectedEmployees.length === 0) return;
    setAssigning(true);
    try {
      await assignTask(selectedTask, { empleado_ids: selectedEmployees });
      onAssigned();
    } catch { /* toast error */ }
    finally { setAssigning(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        <div className="px-8 pt-8 pb-6 border-b border-neutral-100">
          <h2 className="text-xl font-black text-obsidian">Asignar Tarea</h2>
          <p className="text-sm text-neutral-400 mt-1">
            {preselectedTask
              ? "Elige quién recibe esta tarea"
              : "Selecciona la tarea y elige al empleado con menos carga"}
          </p>
        </div>
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          <div>
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-2 block">
              Tarea a asignar
            </label>
            {preselectedTask ? (
              <div className="rounded-xl border border-neutral-100 p-3 bg-neutral-50">
                <div className="text-sm font-bold text-obsidian">{preselectedTask.title}</div>
              </div>
            ) : loading ? (
              <div className="h-10 bg-neutral-100 rounded-xl animate-pulse" />
            ) : (
              <select
                className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black/10"
                value={selectedTask}
                onChange={(e) => setSelectedTask(e.target.value)}
              >
                <option value="">Seleccionar tarea...</option>
                {tasks.map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-2 block">
              Seleccionar empleado(s)
            </label>
            <div className="space-y-2">
              {workload
                .sort((a, b) => a.total_minutes - b.total_minutes)
                .map((emp) => (
                  <div
                    key={emp.empleado_id}
                    onClick={() => toggleEmployee(emp.empleado_id)}
                    className={cx(
                      "flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition",
                      selectedEmployees.includes(emp.empleado_id)
                        ? "border-obsidian bg-obsidian/5"
                        : "border-neutral-100 hover:border-neutral-200 hover:bg-neutral-50"
                    )}
                  >
                    <div className={cx(
                      "h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition",
                      selectedEmployees.includes(emp.empleado_id)
                        ? "bg-obsidian border-obsidian"
                        : "border-neutral-300"
                    )}>
                      {selectedEmployees.includes(emp.empleado_id) && (
                        <CheckCircle2 className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <div className="h-8 w-8 rounded-xl bg-obsidian text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {emp.full_name.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-obsidian">{emp.full_name}</div>
                      <div className="text-xs text-neutral-400">
                        {emp.task_count} tarea{emp.task_count !== 1 ? 's' : ''} · {emp.total_hours}h asignadas
                      </div>
                    </div>
                    <span className={cx(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0",
                      WORKLOAD_COLORS[emp.workload_level]
                    )}>
                      {emp.workload_level}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
        <div className="px-8 pb-8 pt-4 border-t border-neutral-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-12 rounded-2xl border border-neutral-200 text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedTask || selectedEmployees.length === 0 || assigning}
            className="flex-1 h-12 rounded-2xl bg-obsidian text-white text-sm font-bold hover:bg-gold transition disabled:opacity-40"
          >
            {assigning ? 'Asignando...' : `Asignar a ${selectedEmployees.length > 0 ? selectedEmployees.length : ''} empleado${selectedEmployees.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export function OpenTasksPanel({
  onTaskClick,
}: {
  onTaskClick: (task: { id: string; title: string; priority?: string | null }) => void;
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listTasks({ status: 'open', page: 1 })
      .then(res => setTasks(res.data ?? []))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white rounded-[40px] p-8 shadow-sm border border-neutral-100/50">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-black text-obsidian tracking-tight">Tareas Abiertas</h2>
          <p className="text-xs text-neutral-400 mt-0.5">Selecciona una tarea para asignarla</p>
        </div>
        {!loading && tasks.length > 0 && (
          <span className="h-7 px-2.5 rounded-full bg-amber-100 text-amber-700 text-xs font-black flex items-center justify-center">
            {tasks.length}
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-14 bg-neutral-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="py-10 text-center">
          <CheckCircle2 className="h-8 w-8 text-emerald-200 mx-auto mb-2" />
          <p className="text-sm font-bold text-neutral-300">No hay tareas abiertas</p>
          <p className="text-xs text-neutral-300">Todas las tareas están en proceso o completadas</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {tasks.map((t) => (
            <div
              key={t.id}
              onClick={() => onTaskClick({ id: t.id, title: t.title, priority: t.priority })}
              className="flex items-center gap-3 p-4 rounded-2xl border border-neutral-100 cursor-pointer hover:border-obsidian/20 hover:bg-neutral-50 transition group"
            >
              <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <ClipboardList className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-obsidian truncate group-hover:text-obsidian">
                  {t.title}
                </div>
                {t.due_at && (
                  <div className="text-xs text-neutral-400 mt-0.5">
                    Vence: {new Date(t.due_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
              {t.priority && (
                <span className={cx(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0",
                  PRIORITY_COLORS[t.priority] ?? PRIORITY_COLORS.medium
                )}>
                  {t.priority}
                </span>
              )}
              <ChevronRight className="h-4 w-4 text-neutral-300 group-hover:text-neutral-500 transition shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PendingReviewCard({
  items,
  onRefresh,
}: {
  items: SupervisorDashData['pending_review'];
  onRefresh: () => void;
}) {
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  async function handleApprove(assignmentId: string) {
    setReviewingId(assignmentId);
    try {
      await approveAssignment(assignmentId);
      onRefresh();
    } catch { /* toast error */ }
    finally { setReviewingId(null); }
  }

  async function handleReject(assignmentId: string) {
    if (!rejectNote.trim()) return;
    setReviewingId(assignmentId);
    try {
      await rejectAssignment(assignmentId, rejectNote);
      setRejectingId(null);
      setRejectNote('');
      onRefresh();
    } catch { /* toast error */ }
    finally { setReviewingId(null); }
  }

  return (
    <div className="bg-white rounded-[40px] p-8 shadow-sm border border-neutral-100/50">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-black text-obsidian tracking-tight">
            Pendientes de Revisión
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            {items.length} tarea{items.length !== 1 ? 's' : ''} esperando aprobación
          </p>
        </div>
        {items.length > 0 && (
          <span className="h-7 w-7 rounded-full bg-amber-100 text-amber-700 text-xs font-black flex items-center justify-center">
            {items.length}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="py-10 text-center">
          <CheckCircle2 className="h-8 w-8 text-emerald-200 mx-auto mb-2" />
          <p className="text-sm font-bold text-neutral-300">Todo al día ✨</p>
          <p className="text-xs text-neutral-300">No hay tareas pendientes de revisión</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {items.map((item) => (
            <div
              key={item.assignment_id}
              className="rounded-2xl border border-neutral-100 p-4"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cx(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full",
                      PRIORITY_COLORS[item.priority] ?? PRIORITY_COLORS.medium
                    )}>
                      {item.priority}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-obsidian truncate">{item.task_title}</div>
                  <div className="text-xs text-neutral-400 mt-0.5">
                    👤 {item.empleado_name}
                    {item.done_at && (
                      <> · {new Date(item.done_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</>
                    )}
                  </div>
                  {item.note && (
                    <div className="text-xs text-neutral-500 mt-1 italic">"{item.note}"</div>
                  )}
                </div>
              </div>

              {rejectingId === item.assignment_id ? (
                <div className="space-y-2">
                  <textarea
                    className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-xs resize-none outline-none focus:ring-2 focus:ring-black/10"
                    rows={2}
                    placeholder="Motivo del rechazo..."
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setRejectingId(null); setRejectNote(''); }}
                      className="flex-1 h-8 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-500 hover:bg-neutral-50 transition"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleReject(item.assignment_id)}
                      disabled={!rejectNote.trim() || reviewingId === item.assignment_id}
                      className="flex-1 h-8 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 transition disabled:opacity-50"
                    >
                      Confirmar rechazo
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(item.assignment_id)}
                    disabled={reviewingId === item.assignment_id}
                    className="flex-1 h-9 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Aprobar
                  </button>
                  <button
                    onClick={() => setRejectingId(item.assignment_id)}
                    className="flex-1 h-9 rounded-xl border border-rose-200 text-rose-600 text-xs font-bold hover:bg-rose-50 transition flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Rechazar
                  </button>
                  <a
                    href={`/app/manager/tareas`}
                    className="h-9 w-9 rounded-xl border border-neutral-200 flex items-center justify-center hover:bg-neutral-50 transition"
                    title="Ver detalle"
                  >
                    <Eye className="h-3.5 w-3.5 text-neutral-400" />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WorkloadCard({
  workload,
}: {
  workload: EmployeeWorkload[];
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const WORKLOAD_COLORS: Record<string, string> = {
    bajo:  'bg-emerald-100 text-emerald-700 border-emerald-200',
    medio: 'bg-amber-100 text-amber-700 border-amber-200',
    alto:  'bg-rose-100 text-rose-700 border-rose-200',
  };

  const WORKLOAD_BAR: Record<string, string> = {
    bajo:  'bg-emerald-400',
    medio: 'bg-amber-400',
    alto:  'bg-rose-400',
  };

  function formatMinutes(mins: number): string {
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }

  const MAX_MINUTES = 480;

  return (
    <div className="bg-white rounded-[40px] p-8 shadow-sm border border-neutral-100/50">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-black text-obsidian tracking-tight">
            Carga del Equipo
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">Minutos asignados en tareas activas</p>
        </div>
        <Users className="h-5 w-5 text-neutral-300" />
      </div>

      <div className="space-y-3">
        {workload.length === 0 ? (
          <div className="py-8 text-center text-sm text-neutral-400">
            No hay empleados activos
          </div>
        ) : (
          workload
            .sort((a, b) => a.total_minutes - b.total_minutes)
            .map((emp) => (
              <div key={emp.empleado_id} className="rounded-2xl border border-neutral-100 overflow-hidden">
                <div
                  className="flex items-center gap-3 p-3 cursor-pointer hover:bg-neutral-50 transition"
                  onClick={() => setExpanded(expanded === emp.empleado_id ? null : emp.empleado_id)}
                >
                  <div className="h-9 w-9 rounded-xl bg-obsidian text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {emp.full_name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-obsidian truncate">{emp.full_name}</span>
                      <span className={cx(
                        "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide shrink-0",
                        WORKLOAD_COLORS[emp.workload_level]
                      )}>
                        {emp.workload_level}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className={cx("h-full rounded-full transition-all", WORKLOAD_BAR[emp.workload_level])}
                          style={{ width: `${Math.min((emp.total_minutes / MAX_MINUTES) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-neutral-400 shrink-0">
                        {formatMinutes(emp.total_minutes)} · {emp.task_count} tarea{emp.task_count !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {emp.assignments.length > 0 && (
                    expanded === emp.empleado_id
                      ? <ChevronUp className="h-4 w-4 text-neutral-300 shrink-0" />
                      : <ChevronDown className="h-4 w-4 text-neutral-300 shrink-0" />
                  )}
                </div>

                {expanded === emp.empleado_id && emp.assignments.length > 0 && (
                  <div className="border-t border-neutral-100 divide-y divide-neutral-50">
                    {emp.assignments.map((a) => (
                      <div key={a.assignment_id} className="px-4 py-2.5 flex items-center gap-3">
                        <div className="shrink-0 relative h-8 w-8">
                          <svg className="h-8 w-8 -rotate-90" viewBox="0 0 32 32">
                            <circle cx="16" cy="16" r="12" fill="none" stroke="#f3f4f6" strokeWidth="3" />
                            <circle
                              cx="16" cy="16" r="12" fill="none"
                              stroke={a.progress.pct >= 100 ? '#10b981' : '#6366f1'}
                              strokeWidth="3"
                              strokeDasharray={`${(a.progress.pct / 100) * 75.4} 75.4`}
                            />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-obsidian">
                            {a.progress.pct}%
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-obsidian truncate">{a.task_title}</div>
                          <div className="text-[10px] text-neutral-400">
                            {formatMinutes(a.estimated_minutes)}
                            {a.progress.type === 'checklist' && ` · ${a.progress.done}/${a.progress.total} pasos`}
                          </div>
                        </div>

                        <span className={cx(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0",
                          a.status === 'in_progress'
                            ? 'bg-blue-50 text-blue-600 border-blue-100'
                            : 'bg-neutral-50 text-neutral-500 border-neutral-100'
                        )}>
                          {a.status === 'in_progress' ? 'En proceso' : 'Asignada'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
        )}
      </div>
    </div>
  );
}

export default function SupervisorDashboard({ userName }: { userName: string }) {
  const [data, setData] = useState<SupervisorDashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [assignModal, setAssignModal] = useState<{
    open: boolean;
    taskId?: string;
    taskTitle?: string;
  }>({ open: false });

  useEffect(() => {
    getSupervisorDashboard()
      .then(setData)
      .catch(e => setErr(e?.response?.data?.message ?? 'Error al cargar'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (err) return <ErrorCard message={err} />;
  if (!data) return null;

  return (
    <div className="space-y-8 animate-in-up">
      {/* Header */}
      <div className="relative overflow-hidden bg-obsidian rounded-[40px] p-8 lg:p-10 text-white shadow-2xl shadow-obsidian/20">
        <div className="relative z-10">
          <div className="flex justify-between items-start">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-[10px] font-bold tracking-[0.2em] uppercase mb-4">
                <Zap className="h-3 w-3" />
                Panel de Supervisión
              </div>
              <h1 className="text-3xl lg:text-4xl font-black tracking-tight mb-3">
                Hola, <span className="italic">{userName}</span>.
                <br />Tu equipo en un vistazo.
              </h1>
              <p className="text-white/60 text-base">
                <span className="text-white font-bold">{data.kpi.pending_review}</span> tareas esperan tu revisión
                · <span className="text-white font-bold">{data.kpi.active_tasks}</span> activas ahora
              </p>
            </div>
            <button
              onClick={() => setAssignModal({ open: true })}
              className="h-10 px-5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold transition flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Asignar tarea
            </button>
          </div>
        </div>
        <div className="absolute -top-16 -right-16 w-72 h-72 bg-white/5 rounded-full blur-[80px]" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          label="Pendientes revisión"
          value={data.kpi.pending_review}
          color="amber"
          icon={<Star className="h-5 w-5" />}
        />
        <KpiCard
          label="Tareas activas"
          value={data.kpi.active_tasks}
          color="blue"
          icon={<ClipboardList className="h-5 w-5" />}
        />
        <KpiCard
          label="Completadas hoy"
          value={data.kpi.completed_today}
          color="emerald"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
      </div>

      {/* Open Tasks Panel */}
      <OpenTasksPanel
        onTaskClick={(task) => setAssignModal({ open: true, taskId: task.id, taskTitle: task.title })}
      />

      {/* Pending Review + Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <PendingReviewCard
          items={data.pending_review}
          onRefresh={() => {
            setLoading(true);
            getSupervisorDashboard().then(setData).finally(() => setLoading(false));
          }}
        />
        <WorkloadCard
          workload={data.workload}
        />
      </div>

      {assignModal.open && data && (
        <AssignTaskModal
          workload={data.workload}
          preselectedTask={
            assignModal.taskId
              ? { id: assignModal.taskId, title: assignModal.taskTitle! }
              : undefined
          }
          onClose={() => setAssignModal({ open: false })}
          onAssigned={() => {
            setAssignModal({ open: false });
            getSupervisorDashboard().then(setData);
          }}
        />
      )}
    </div>
  );
}
