import { useEffect, useState } from "react";
import { getSupervisorDashboard } from "./api";
import type { SupervisorDashData, EmployeeWorkload } from "./types";
import type { Task } from "@/features/tasks/types";
import { assignTask, listTasks, approveAssignment, rejectAssignment } from "@/features/tasks/api";
import {
  Users, Star, Eye, CheckCircle2, XCircle,
  ChevronDown, ChevronUp, ChevronRight, Zap,
  ClipboardList, Plus, Search
} from "lucide-react";

function cx(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(" ");
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-rose-100 text-rose-700",
  high:   "bg-orange-100 text-orange-700",
  medium: "bg-amber-100 text-amber-700",
  low:    "bg-neutral-100 text-neutral-500",
};

const WORKLOAD_BADGE: Record<string, string> = {
  bajo:  "bg-emerald-50 border-emerald-200 text-emerald-700",
  medio: "bg-amber-50 border-amber-200 text-amber-700",
  alto:  "bg-rose-50 border-rose-200 text-rose-700",
};

// ─── Spinner / Error ────────────────────────────────────────────────────────

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
      <button
        onClick={() => window.location.reload()}
        className="h-11 px-6 bg-obsidian text-white rounded-xl font-bold text-sm"
      >
        Reintentar
      </button>
    </div>
  );
}

// ─── KPI Card ───────────────────────────────────────────────────────────────

function KpiCard({ label, value, color, icon }: {
  label: string; value: number; color: string; icon: React.ReactNode;
}) {
  const colors: Record<string, string> = {
    amber:   "bg-amber-50 text-amber-600",
    blue:    "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    rose:    "bg-rose-50 text-rose-600",
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

// ─── Assign Task Modal ───────────────────────────────────────────────────────
// tasks: array of 1 (single click) or many (multi-checkbox)

export function AssignTaskModal({
  tasks,
  workload,
  onClose,
  onAssigned,
}: {
  tasks: { id: string; title: string }[];
  workload: EmployeeWorkload[];
  onClose: () => void;
  onAssigned: () => void;
}) {
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [assigning, setAssigning] = useState(false);

  const isSingle = tasks.length === 1;

  const filteredWorkload = workload
    .filter(e => e.full_name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.total_minutes - b.total_minutes);

  function toggleEmployee(id: string) {
    setSelectedEmployees(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  }

  async function handleAssign() {
    if (selectedEmployees.length === 0) return;
    setAssigning(true);
    try {
      await Promise.all(
        tasks.map(t => assignTask(t.id, { empleado_ids: selectedEmployees }))
      );
      onAssigned();
    } catch { /* toast */ }
    finally { setAssigning(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl max-h-[88vh] flex flex-col">

        {/* Header */}
        <div className="px-7 pt-7 pb-5 border-b border-neutral-100">
          <h2 className="text-lg font-black text-obsidian">Asignar Tarea</h2>
          {isSingle ? (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm font-bold text-obsidian truncate">{tasks[0].title}</span>
            </div>
          ) : (
            <div className="mt-2">
              <p className="text-sm font-bold text-obsidian">
                {tasks.length} tareas seleccionadas
              </p>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {tasks.slice(0, 4).map(t => (
                  <span
                    key={t.id}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-obsidian/5 text-obsidian/60 border border-obsidian/10 truncate max-w-[140px]"
                  >
                    {t.title}
                  </span>
                ))}
                {tasks.length > 4 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-400">
                    +{tasks.length - 4} más
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="px-7 pt-5 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-300" />
            <input
              type="text"
              placeholder="Buscar empleado..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-neutral-200 text-sm outline-none focus:ring-2 focus:ring-obsidian/10 bg-neutral-50/50"
            />
          </div>
        </div>

        {/* Employee list */}
        <div className="flex-1 overflow-y-auto px-7 pb-4 space-y-2">
          {filteredWorkload.length === 0 ? (
            <div className="py-8 text-center text-sm text-neutral-300 font-bold">
              Sin empleados disponibles
            </div>
          ) : (
            filteredWorkload.map(emp => (
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
                {/* Checkbox */}
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
                {/* Avatar */}
                <div className="h-9 w-9 rounded-xl bg-obsidian text-white flex items-center justify-center text-xs font-black shrink-0">
                  {emp.full_name.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase()}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-obsidian truncate">{emp.full_name}</div>
                  <div className="text-xs text-neutral-400">
                    {emp.task_count} tarea{emp.task_count !== 1 ? "s" : ""} · {emp.total_hours}h asignadas
                  </div>
                </div>
                {/* Workload badge */}
                <span className={cx(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0",
                  WORKLOAD_BADGE[emp.workload_level]
                )}>
                  {emp.workload_level}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-7 pb-7 pt-4 border-t border-neutral-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-12 rounded-2xl border border-neutral-200 text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleAssign}
            disabled={selectedEmployees.length === 0 || assigning}
            className="flex-1 h-12 rounded-2xl bg-obsidian text-white text-sm font-bold hover:bg-gold transition disabled:opacity-40"
          >
            {assigning
              ? "Asignando..."
              : `Asignar a ${selectedEmployees.length || ""} empleado${selectedEmployees.length !== 1 ? "s" : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Open Tasks Panel ────────────────────────────────────────────────────────

export function OpenTasksPanel({
  onTaskClick,
}: {
  onTaskClick: (task: { id: string; title: string }) => void;
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listTasks({ status: "open", page: 1 })
      .then(res => setTasks(res.data ?? []))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white rounded-[40px] p-8 shadow-sm border border-neutral-100/50">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-black text-obsidian tracking-tight">Tareas Abiertas</h2>
          <p className="text-xs text-neutral-400 mt-0.5">Clic en una tarea para asignarla</p>
        </div>
        {!loading && tasks.length > 0 && (
          <span className="h-7 px-2.5 rounded-full bg-blue-50 text-blue-600 text-xs font-black flex items-center justify-center">
            {tasks.length}
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-14 bg-neutral-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : tasks.length === 0 ? (
        <div className="py-10 text-center">
          <CheckCircle2 className="h-8 w-8 text-emerald-200 mx-auto mb-2" />
          <p className="text-sm font-bold text-neutral-300">No hay tareas abiertas</p>
          <p className="text-xs text-neutral-300">Todas las tareas están asignadas o completadas</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {tasks.map(t => (
            <div
              key={t.id}
              onClick={() => onTaskClick({ id: t.id, title: t.title })}
              className="flex items-center gap-3 p-4 rounded-2xl border border-neutral-100 cursor-pointer hover:border-obsidian/20 hover:bg-neutral-50 transition group"
            >
              <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <ClipboardList className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-obsidian truncate">{t.title}</div>
                {t.due_at && (
                  <div className="text-xs text-neutral-400 mt-0.5">
                    Vence:{" "}
                    {new Date(t.due_at).toLocaleDateString("es-MX", {
                      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                    })}
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

// ─── Available Tasks Panel (checkboxes) ─────────────────────────────────────

export function AvailableTasksPanel({
  onAssign,
}: {
  onAssign: (tasks: { id: string; title: string }[]) => void;
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    listTasks({ status: "open", page: 1 })
      .then(res => setTasks(res.data ?? []))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, []);

  function toggleTask(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleAssign() {
    const selectedTasks = tasks
      .filter(t => selected.has(t.id))
      .map(t => ({ id: t.id, title: t.title }));
    if (selectedTasks.length > 0) onAssign(selectedTasks);
  }

  return (
    <div className="bg-white rounded-[40px] p-8 shadow-sm border border-neutral-100/50 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-black text-obsidian tracking-tight">Tareas Disponibles</h2>
          <p className="text-xs text-neutral-400 mt-0.5">Selecciona una o varias para asignar</p>
        </div>
        {selected.size > 0 && (
          <button
            onClick={handleAssign}
            className="h-9 px-4 rounded-2xl bg-obsidian text-white text-xs font-bold hover:bg-gold transition flex items-center gap-2"
          >
            <Plus className="h-3.5 w-3.5" />
            Asignar ({selected.size})
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-12 bg-neutral-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : tasks.length === 0 ? (
        <div className="py-8 text-center">
          <CheckCircle2 className="h-8 w-8 text-emerald-200 mx-auto mb-2" />
          <p className="text-sm font-bold text-neutral-300">Sin tareas disponibles</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {tasks.map(t => (
            <div
              key={t.id}
              onClick={() => toggleTask(t.id)}
              className={cx(
                "flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition",
                selected.has(t.id)
                  ? "border-obsidian bg-obsidian/5"
                  : "border-neutral-100 hover:border-neutral-200 hover:bg-neutral-50"
              )}
            >
              {/* Checkbox */}
              <div className={cx(
                "h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition",
                selected.has(t.id) ? "bg-obsidian border-obsidian" : "border-neutral-300"
              )}>
                {selected.has(t.id) && <CheckCircle2 className="h-3 w-3 text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-obsidian truncate">{t.title}</div>
                {t.due_at && (
                  <div className="text-xs text-neutral-400">
                    Vence:{" "}
                    {new Date(t.due_at).toLocaleDateString("es-MX", {
                      day: "numeric", month: "short",
                    })}
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Pending Review Card (supervisor) ───────────────────────────────────────

function PendingReviewCard({
  items,
  onRefresh,
}: {
  items: SupervisorDashData["pending_review"];
  onRefresh: () => void;
}) {
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  async function handleApprove(assignmentId: string) {
    setReviewingId(assignmentId);
    try { await approveAssignment(assignmentId); onRefresh(); }
    catch { /* toast */ }
    finally { setReviewingId(null); }
  }

  async function handleReject(assignmentId: string) {
    if (!rejectNote.trim()) return;
    setReviewingId(assignmentId);
    try {
      await rejectAssignment(assignmentId, rejectNote);
      setRejectingId(null); setRejectNote(""); onRefresh();
    } catch { /* toast */ }
    finally { setReviewingId(null); }
  }

  return (
    <div className="bg-white rounded-[40px] p-8 shadow-sm border border-neutral-100/50">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-black text-obsidian tracking-tight">Pendientes de Revisión</h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            {items.length} tarea{items.length !== 1 ? "s" : ""} esperando aprobación
          </p>
        </div>
        <span className="h-7 w-7 rounded-full bg-amber-100 text-amber-700 text-xs font-black flex items-center justify-center">
          {items.length}
        </span>
      </div>
      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
        {items.map(item => (
          <div key={item.assignment_id} className="rounded-2xl border border-neutral-100 p-4">
            <div className="flex items-start gap-2 mb-3">
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
                    <> · {new Date(item.done_at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}</>
                  )}
                </div>
                {item.note && <div className="text-xs text-neutral-500 mt-1 italic">"{item.note}"</div>}
              </div>
            </div>

            {rejectingId === item.assignment_id ? (
              <div className="space-y-2">
                <textarea
                  className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-xs resize-none outline-none focus:ring-2 focus:ring-black/10"
                  rows={2}
                  placeholder="Motivo del rechazo..."
                  value={rejectNote}
                  onChange={e => setRejectNote(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => { setRejectingId(null); setRejectNote(""); }}
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
                  <CheckCircle2 className="h-3.5 w-3.5" /> Aprobar
                </button>
                <button
                  onClick={() => setRejectingId(item.assignment_id)}
                  className="flex-1 h-9 rounded-xl border border-rose-200 text-rose-600 text-xs font-bold hover:bg-rose-50 transition flex items-center justify-center gap-1.5"
                >
                  <XCircle className="h-3.5 w-3.5" /> Rechazar
                </button>
                <a
                  href="/app/manager/tareas"
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
    </div>
  );
}

// ─── Workload Card ───────────────────────────────────────────────────────────

export function WorkloadCard({ workload }: { workload: EmployeeWorkload[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const WORKLOAD_COLORS: Record<string, string> = {
    bajo:  "bg-emerald-100 text-emerald-700 border-emerald-200",
    medio: "bg-amber-100 text-amber-700 border-amber-200",
    alto:  "bg-rose-100 text-rose-700 border-rose-200",
  };
  const WORKLOAD_BAR: Record<string, string> = {
    bajo: "bg-emerald-400", medio: "bg-amber-400", alto: "bg-rose-400",
  };

  function fmt(mins: number) {
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60), m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }

  return (
    <div className="bg-white rounded-[40px] p-8 shadow-sm border border-neutral-100/50">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-black text-obsidian tracking-tight">Carga del Equipo</h2>
          <p className="text-xs text-neutral-400 mt-0.5">Minutos asignados en tareas activas</p>
        </div>
        <Users className="h-5 w-5 text-neutral-300" />
      </div>

      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
        {workload.length === 0 ? (
          <div className="py-8 text-center text-sm text-neutral-400">No hay empleados activos</div>
        ) : (
          workload
            .sort((a, b) => a.total_minutes - b.total_minutes)
            .map(emp => (
              <div key={emp.empleado_id} className="rounded-2xl border border-neutral-100 overflow-hidden">
                <div
                  className="flex items-center gap-3 p-3 cursor-pointer hover:bg-neutral-50 transition"
                  onClick={() => setExpanded(expanded === emp.empleado_id ? null : emp.empleado_id)}
                >
                  <div className="h-9 w-9 rounded-xl bg-obsidian text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {emp.full_name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()}
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
                          style={{ width: `${Math.min((emp.total_minutes / 480) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-neutral-400 shrink-0">
                        {fmt(emp.total_minutes)} · {emp.task_count} t
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
                    {emp.assignments.map(a => (
                      <div key={a.assignment_id} className="px-4 py-2.5 flex items-center gap-3">
                        <div className="shrink-0 relative h-8 w-8">
                          <svg className="h-8 w-8 -rotate-90" viewBox="0 0 32 32">
                            <circle cx="16" cy="16" r="12" fill="none" stroke="#f3f4f6" strokeWidth="3" />
                            <circle
                              cx="16" cy="16" r="12" fill="none"
                              stroke={a.progress.pct >= 100 ? "#10b981" : "#6366f1"}
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
                            {fmt(a.estimated_minutes)}
                            {a.progress.type === "checklist" && ` · ${a.progress.done}/${a.progress.total} pasos`}
                          </div>
                        </div>
                        <span className={cx(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0",
                          a.status === "in_progress"
                            ? "bg-blue-50 text-blue-600 border-blue-100"
                            : "bg-neutral-50 text-neutral-500 border-neutral-100"
                        )}>
                          {a.status === "in_progress" ? "En proceso" : "Asignada"}
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

// ─── Supervisor Dashboard ────────────────────────────────────────────────────

export default function SupervisorDashboard({ userName }: { userName: string }) {
  const [data, setData] = useState<SupervisorDashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [modal, setModal] = useState<{ open: boolean; tasks: { id: string; title: string }[] }>({
    open: false, tasks: [],
  });

  function reload() {
    setLoading(true);
    getSupervisorDashboard()
      .then(setData)
      .catch(e => setErr(e?.response?.data?.message ?? "Error al cargar"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { reload(); }, []);

  function openModal(tasks: { id: string; title: string }[]) {
    setModal({ open: true, tasks });
  }

  if (loading) return <LoadingSpinner />;
  if (err)     return <ErrorCard message={err} />;
  if (!data)   return null;

  return (
    <div className="space-y-6 animate-in-up">

      {/* 1 · Hero */}
      <div className="relative overflow-hidden bg-obsidian rounded-[40px] p-8 lg:p-10 text-white shadow-2xl shadow-obsidian/20">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-[10px] font-bold tracking-[0.2em] uppercase mb-4">
            <Zap className="h-3 w-3" />
            Panel de Supervisión
          </div>
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight mb-2">
            Hola, <span className="italic">{userName}</span>.
          </h1>
          <p className="text-white/60 text-base">
            <span className="text-white font-bold">{data.kpi.pending_review}</span> en revisión ·{" "}
            <span className="text-white font-bold">{data.kpi.active_tasks}</span> activas ahora
          </p>
        </div>
        <div className="absolute -top-16 -right-16 w-72 h-72 bg-white/5 rounded-full blur-[80px]" />
      </div>

      {/* 2 · KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="En Revisión"   value={data.kpi.pending_review}   color="amber"   icon={<Star className="h-5 w-5" />} />
        <KpiCard label="Tareas Activas" value={data.kpi.active_tasks}    color="blue"    icon={<ClipboardList className="h-5 w-5" />} />
        <KpiCard label="Completadas Hoy" value={data.kpi.completed_today} color="emerald" icon={<CheckCircle2 className="h-5 w-5" />} />
      </div>

      {/* 3 · Tareas Abiertas (full width) */}
      <OpenTasksPanel onTaskClick={t => openModal([t])} />

      {/* 4 · Disponibles + Carga */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AvailableTasksPanel onAssign={tasks => openModal(tasks)} />
        <WorkloadCard workload={data.workload} />
      </div>

      {/* 5 · Pendientes revisión (supervisor only, si hay items) */}
      {data.pending_review.length > 0 && (
        <PendingReviewCard items={data.pending_review} onRefresh={reload} />
      )}

      {/* Modal */}
      {modal.open && (
        <AssignTaskModal
          tasks={modal.tasks}
          workload={data.workload}
          onClose={() => setModal({ open: false, tasks: [] })}
          onAssigned={() => {
            setModal({ open: false, tasks: [] });
            reload();
          }}
        />
      )}
    </div>
  );
}
