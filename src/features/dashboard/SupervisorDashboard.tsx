import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSupervisorDashboard } from "./api";
import type { SupervisorDashData, EmployeeWorkload } from "./types";
import type { Task } from "@/features/tasks/types";
import { assignTask, listTasks, approveAssignment, rejectAssignment, deleteTask } from "@/features/tasks/api";
import { listTemplates, listRoutines, bulkCreateFromCatalog } from "@/features/tasks/catalog/api";
import type { Template, Routine } from "@/features/tasks/catalog/api";
import { misOrdenesGondola } from "@/features/gondolas/api";
import type { GondolaOrden } from "@/features/gondolas/types";
import AssignRoutineModal from "@/features/tasks/catalog/AssignRoutineModal";
import TaskCatalogPanel from "@/features/tasks/TaskCatalogPanel";
import {
  Users, Star, Eye, CheckCircle2, XCircle, Trash2,
  ChevronDown, ChevronUp, ChevronRight, Zap,
  ClipboardList, Plus, Search, LayoutGrid
} from "lucide-react";

function cx(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(" ");
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-rose-100 text-rose-700",
  high:   "bg-orange-100 text-orange-700",
  medium: "bg-amber-100 text-amber-700",
  low:    "bg-neutral-100 text-k-text-b",
};

const PRIORITY_LABELS: Record<string, string> = {
  urgent: "Urgente",
  high:   "Alta",
  medium: "Media",
  low:    "Baja",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Por Asignar",
  in_progress: "En Proceso",
  completed: "Completada",
  overdue: "Vencida",
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
      <div className="text-[11px] font-bold text-k-text-h/40 uppercase tracking-widest animate-pulse">
        Cargando...
      </div>
    </div>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="rounded-[32px] bg-k-bg-card border border-rose-100 p-8 text-center max-w-md mx-auto mt-10">
      <div className="h-16 w-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <XCircle className="h-8 w-8" />
      </div>
      <h2 className="text-xl font-black text-k-text-h mb-2">Error</h2>
      <p className="text-sm text-k-text-b mb-6">{message}</p>
      <button
        onClick={() => window.location.reload()}
        className="h-11 px-6 bg-k-bg-sidebar text-white rounded-xl font-bold text-sm"
      >
        Reintentar
      </button>
    </div>
  );
}

// ─── KPI Card ───────────────────────────────────────────────────────────────

function KpiCard({ label, value, color, icon, compact = false }: {
  label: string; value: number; color: string; icon: React.ReactNode; compact?: boolean;
}) {
  const colors: Record<string, string> = {
    amber:   "bg-amber-50 text-amber-600",
    blue:    "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    rose:    "bg-rose-50 text-rose-600",
  };

  if (compact) {
    return (
      <div className="bg-k-bg-card rounded-[24px] p-4 shadow-k-card border border-k-border flex flex-col justify-center">
        <div className="flex items-center gap-3">
          <div className={cx("h-10 w-10 rounded-[14px] flex items-center justify-center shrink-0", colors[color])}>
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-2xl font-black text-k-text-h leading-none">{value}</div>
            <div className="text-[10px] font-bold text-k-text-b uppercase tracking-[0.1em] truncate mt-1">{label}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-k-bg-card rounded-[28px] p-6 shadow-k-card border border-k-border">
      <div className={cx("h-10 w-10 rounded-xl flex items-center justify-center mb-4", colors[color])}>
        {icon}
      </div>
      <div className="text-2xl font-black text-k-text-h">{value}</div>
      <div className="text-[11px] font-bold text-k-text-b uppercase tracking-wide mt-1">{label}</div>
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
      <div className="bg-k-bg-card rounded-[32px] w-full max-w-md shadow-2xl max-h-[88vh] flex flex-col">

        {/* Header */}
        <div className="px-7 pt-7 pb-5 border-b border-k-border">
          <h2 className="text-lg font-black text-k-text-h">Asignar Tarea</h2>
          {isSingle ? (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm font-bold text-k-text-h truncate">{tasks[0].title}</span>
            </div>
          ) : (
            <div className="mt-2">
              <p className="text-sm font-bold text-k-text-h">
                {tasks.length} tareas seleccionadas
              </p>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {tasks.slice(0, 4).map(t => (
                  <span
                    key={t.id}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-k-bg-sidebar/5 text-k-text-h/60 border border-obsidian/10 truncate max-w-[140px]"
                  >
                    {t.title}
                  </span>
                ))}
                {tasks.length > 4 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-k-text-b">
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-k-text-b" />
            <input
              type="text"
              placeholder="Buscar empleado..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-k-border text-sm outline-none focus:ring-2 focus:ring-obsidian/10 bg-k-bg-card2/50"
            />
          </div>
        </div>

        {/* Employee list */}
        <div className="flex-1 overflow-y-auto px-7 pb-4 space-y-2">
          {filteredWorkload.length === 0 ? (
            <div className="py-8 text-center text-sm text-k-text-b font-bold">
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
                    ? "border-obsidian bg-k-bg-sidebar/5"
                    : "border-k-border hover:border-k-border hover:bg-k-bg-card2"
                )}
              >
                {/* Checkbox */}
                <div className={cx(
                  "h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition",
                  selectedEmployees.includes(emp.empleado_id)
                    ? "bg-k-bg-sidebar border-obsidian"
                    : "border-neutral-300"
                )}>
                  {selectedEmployees.includes(emp.empleado_id) && (
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  )}
                </div>
                {/* Avatar */}
                <div className="h-9 w-9 rounded-xl bg-k-bg-sidebar text-white flex items-center justify-center text-xs font-black shrink-0">
                  {emp.full_name.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase()}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-k-text-h truncate">{emp.full_name}</div>
                  <div className="text-xs text-k-text-b">
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
        <div className="px-7 pb-7 pt-4 border-t border-k-border flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-12 rounded-2xl border border-k-border text-sm font-bold text-neutral-600 hover:bg-k-bg-card2 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleAssign}
            disabled={selectedEmployees.length === 0 || assigning}
            className="flex-1 h-12 rounded-2xl bg-k-accent-btn text-k-accent-btn-text text-sm font-bold hover:opacity-90 transition disabled:opacity-40"
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

// ─── Assign Template Modal ───────────────────────────────────────────────────
// Crea tareas desde plantillas y las asigna con bulkCreateFromCatalog

export function AssignTemplateModal({
  templates,
  workload,
  onClose,
  onAssigned,
}: {
  templates: Template[];
  workload: EmployeeWorkload[];
  onClose: () => void;
  onAssigned: () => void;
}) {
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

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
    setError(null);
    try {
      await bulkCreateFromCatalog({
        date: today,
        template_ids: templates.map(t => t.id),
        empleado_ids: selectedEmployees,
        allow_duplicate: true,
      });
      onAssigned();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Error al asignar");
    } finally {
      setAssigning(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-k-bg-card rounded-[32px] w-full max-w-md shadow-2xl max-h-[88vh] flex flex-col">

        {/* Header */}
        <div className="px-7 pt-7 pb-5 border-b border-k-border">
          <h2 className="text-lg font-black text-k-text-h">Asignar Plantilla</h2>
          {templates.length === 1 ? (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm font-bold text-k-text-h truncate">{templates[0].title}</span>
              {templates[0].priority && (
                <span className={cx(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full",
                  PRIORITY_COLORS[templates[0].priority] ?? PRIORITY_COLORS.medium
                )}>
                  {PRIORITY_LABELS[templates[0].priority] || templates[0].priority}
                </span>
              )}
            </div>
          ) : (
            <div className="mt-2">
              <p className="text-sm font-bold text-k-text-h">{templates.length} plantillas seleccionadas</p>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {templates.slice(0, 4).map(t => (
                  <span key={t.id} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-k-bg-sidebar/5 text-k-text-h/60 border border-obsidian/10 truncate max-w-[140px]">
                    {t.title}
                  </span>
                ))}
                {templates.length > 4 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-k-text-b">
                    +{templates.length - 4} más
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="px-7 pt-5 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-k-text-b" />
            <input
              type="text"
              placeholder="Buscar empleado..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-k-border text-sm outline-none focus:ring-2 focus:ring-obsidian/10 bg-k-bg-card2/50"
            />
          </div>
        </div>

        {/* Employee list */}
        <div className="flex-1 overflow-y-auto px-7 pb-4 space-y-2">
          {filteredWorkload.length === 0 ? (
            <div className="py-8 text-center text-sm text-k-text-b font-bold">Sin empleados disponibles</div>
          ) : (
            filteredWorkload.map(emp => (
              <div
                key={emp.empleado_id}
                onClick={() => toggleEmployee(emp.empleado_id)}
                className={cx(
                  "flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition",
                  selectedEmployees.includes(emp.empleado_id)
                    ? "border-obsidian bg-k-bg-sidebar/5"
                    : "border-k-border hover:border-k-border hover:bg-k-bg-card2"
                )}
              >
                <div className={cx(
                  "h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition",
                  selectedEmployees.includes(emp.empleado_id) ? "bg-k-bg-sidebar border-obsidian" : "border-neutral-300"
                )}>
                  {selectedEmployees.includes(emp.empleado_id) && <CheckCircle2 className="h-3 w-3 text-white" />}
                </div>
                <div className="h-9 w-9 rounded-xl bg-k-bg-sidebar text-white flex items-center justify-center text-xs font-black shrink-0">
                  {emp.full_name.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-k-text-h truncate">{emp.full_name}</div>
                  <div className="text-xs text-k-text-b">
                    {emp.task_count} tarea{emp.task_count !== 1 ? "s" : ""} · {emp.total_hours}h asignadas
                  </div>
                </div>
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

        {error && (
          <p className="px-7 pb-2 text-xs text-rose-500 font-bold">{error}</p>
        )}

        {/* Footer */}
        <div className="px-7 pb-7 pt-4 border-t border-k-border flex gap-3">
          <button onClick={onClose} className="flex-1 h-12 rounded-2xl border border-k-border text-sm font-bold text-neutral-600 hover:bg-k-bg-card2 transition">
            Cancelar
          </button>
          <button
            onClick={handleAssign}
            disabled={selectedEmployees.length === 0 || assigning}
            className="flex-1 h-12 rounded-2xl bg-k-accent-btn text-k-accent-btn-text text-sm font-bold hover:opacity-90 transition disabled:opacity-40"
          >
            {assigning ? "Asignando..." : `Asignar a ${selectedEmployees.length || ""} empleado${selectedEmployees.length !== 1 ? "s" : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Task Detail Modal ───────────────────────────────────────────────────────
export function TaskDetailModal({
  task,
  onClose,
  onDeleted,
}: {
  task: Task;
  onClose: () => void;
  onDeleted?: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`¿Estás seguro de que deseas eliminar la tarea "${task.title}" y cancelar sus asignaciones? Esta acción no se puede deshacer.`)) return;
    setDeleting(true);
    try {
      await deleteTask(task.id);
      if (onDeleted) onDeleted();
      else onClose();
    } catch (e: any) {
      alert(e?.response?.data?.message || "Error al eliminar la tarea.");
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in-fade">
      <div className="bg-k-bg-card rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden animate-in-up">
        <div className="p-6 border-b border-k-border flex items-start justify-between bg-k-bg-card2/50">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 uppercase">
                {STATUS_LABELS[task.status] || task.status}
              </span>
              {task.priority && (
                <span className={cx(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                  PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS.medium
                )}>
                  {PRIORITY_LABELS[task.priority] || task.priority}
                </span>
              )}
            </div>
            <h2 className="text-xl font-black text-k-text-h leading-tight pr-4">{task.title}</h2>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-full bg-neutral-100 text-k-text-b flex items-center justify-center hover:bg-neutral-200 transition shrink-0">
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <h3 className="text-xs font-black text-k-text-b uppercase tracking-widest mb-3">Empleados Asignados</h3>
            {(!task.assignees || task.assignees.length === 0) ? (
              <p className="text-sm text-k-text-b italic">No hay empleados asignados a esta tarea.</p>
            ) : (
              <div className="space-y-3">
                {task.assignees.map(a => {
                  const empName = a.empleado?.user?.name || a.empleado?.full_name || "Desconocido";
                  const pct = a.progress?.pct ?? 0;
                  return (
                    <div key={a.id} className="flex items-center gap-3 p-3 rounded-2xl border border-k-border bg-k-bg-card">
                       <div className="h-10 w-10 relative shrink-0">
                         <svg className="h-10 w-10 -rotate-90" viewBox="0 0 40 40">
                           <circle cx="20" cy="20" r="16" fill="none" stroke="#f3f4f6" strokeWidth="4" />
                           <circle
                             cx="20" cy="20" r="16" fill="none"
                             stroke={pct >= 100 ? "#10b981" : "#6366f1"}
                             strokeWidth="4"
                             strokeDasharray={`${(pct / 100) * 100.5} 100.5`}
                           />
                         </svg>
                         <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-k-text-h">
                           {pct}%
                         </span>
                       </div>
                       <div className="flex-1 min-w-0">
                         <div className="text-sm font-bold text-k-text-h truncate">{empName}</div>
                         <div className="text-[10px] font-bold uppercase text-k-text-b mt-0.5">
                           {a.status === 'in_progress' ? 'En proceso' : a.status === 'done' ? 'Terminado' : 'Asignado'}
                         </div>
                       </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 pt-0">
           <button
             onClick={handleDelete}
             disabled={deleting}
             className="w-full h-11 rounded-xl border border-rose-200 text-rose-500 text-sm font-bold flex items-center justify-center gap-2 hover:bg-rose-50 transition disabled:opacity-50"
           >
             <Trash2 className="h-4 w-4" />
             {deleting ? "Eliminando..." : "Eliminar Tarea"}
           </button>
        </div>
      </div>
    </div>
  );
}

// ─── Open Tasks Panel ────────────────────────────────────────────────────────

export function OpenTasksPanel({
  onTaskClick,
  onNewTask,
  refreshKey = 0,
}: {
  onTaskClick: (task: Task) => void;
  onNewTask?: () => void;
  refreshKey?: number;
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"in_progress" | "overdue">("in_progress");
  const [panelOpen, setPanelOpen] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params: any = { page: 1 };
    
    if (tab === "in_progress") {
      params.status = "in_progress";
    } else if (tab === "overdue") {
      params.status = "open,in_progress";
      params.overdue = true;
    }

    listTasks(params)
      .then(res => {
        const rawData = res.data;
        const arr = Array.isArray(rawData) ? rawData : [];
        const sorted = [...arr].sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setTasks(sorted);
      })
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, [refreshKey, tab]);

  return (
    <div className={cx(
      "bg-k-bg-card shadow-k-card border border-k-border flex flex-col transition-all overflow-hidden",
      panelOpen ? "rounded-[32px] lg:rounded-[40px] p-6 lg:p-8 min-h-[500px] lg:min-h-[600px]" : "rounded-[24px] p-4 lg:px-8 lg:py-6"
    )}>
      <div className={cx("flex items-center justify-between", panelOpen ? "mb-4" : "")}>
        <div 
          className="flex-1 cursor-pointer flex items-center gap-3" 
          onClick={() => setPanelOpen(!panelOpen)}
        >
          <div>
            <h2 className="text-lg lg:text-xl font-black text-k-text-h tracking-tight">Monitoreo de Tareas</h2>
            {panelOpen && <p className="text-xs text-k-text-b mt-0.5">Seguimiento de tareas activas</p>}
          </div>
          {panelOpen ? <ChevronUp className="h-5 w-5 text-k-text-b" /> : <ChevronDown className="h-5 w-5 text-k-text-b" />}
        </div>
        <div className="flex items-center gap-2">
          {!loading && tasks.length > 0 && (
            <span className={cx(
              "h-7 px-2.5 rounded-full text-xs font-black flex items-center justify-center border",
              tab === "in_progress" ? "bg-amber-50 text-amber-600 border-amber-100" :
              "bg-rose-50 text-rose-600 border-rose-100"
            )}>
              {tasks.length}
            </span>
          )}
          {onNewTask && (
            <button
              onClick={onNewTask}
              className="h-8 px-3 rounded-xl bg-k-accent-btn text-k-accent-btn-text text-xs font-bold hover:opacity-90 transition flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Nueva
            </button>
          )}
        </div>
      </div>

      {panelOpen && (
        <>
          <div className="flex items-center gap-2 mb-4 p-1 bg-neutral-100/50 rounded-xl inline-flex border border-k-border shrink-0 self-start">
            <button onClick={() => setTab("in_progress")} className={cx("px-3 py-1.5 text-xs font-bold rounded-lg transition-colors", tab === "in_progress" ? "bg-k-bg-card shadow-k-card text-amber-600" : "text-k-text-b hover:text-amber-500")}>En Proceso</button>
        <button onClick={() => setTab("overdue")} className={cx("px-3 py-1.5 text-xs font-bold rounded-lg transition-colors", tab === "overdue" ? "bg-k-bg-card shadow-k-card text-rose-600" : "text-k-text-b hover:text-rose-500")}>Vencidas</button>
      </div>

      {loading ? (
        <div className="space-y-2 flex-1">
          {[1, 2, 3].map(i => <div key={i} className="h-14 bg-neutral-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <ClipboardList className="h-8 w-8 text-neutral-200 mx-auto mb-3" />
          <p className="text-sm font-bold text-k-text-b">
             {tab === "in_progress" ? "No hay tareas en proceso" : "No hay tareas vencidas"}
          </p>
          <p className="text-xs text-k-text-b mb-4">Todo está bajo control</p>
        </div>
      ) : (
        <div className="space-y-2 flex-1 overflow-y-auto pr-1 pb-4">
          {tasks.map(t => (
            <div
              key={t.id}
              onClick={() => onTaskClick(t)}
              className="flex items-center gap-3 p-4 rounded-2xl border border-k-border cursor-pointer hover:border-obsidian/20 hover:bg-k-bg-card2 transition group shrink-0"
            >
              <div className={cx(
                "h-8 w-8 rounded-xl flex items-center justify-center shrink-0",
                tab === "in_progress" ? "bg-amber-50 text-amber-600" :
                "bg-rose-50 text-rose-600"
              )}>
                {tab === "in_progress" ? <Zap className="h-4 w-4" /> : <ClipboardList className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-k-text-h truncate">{t.title}</div>
                <div className="text-xs text-k-text-b mt-0.5 truncate">
                  {t.assignees && t.assignees.length > 0 
                     ? `Asignada a ${t.assignees.length} empleado(s)` 
                     : "Sin asignar"}
                  {t.due_at && ` · Vence ${new Date(t.due_at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}`}
                </div>
              </div>
              {t.priority && (
                <span className={cx(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 uppercase",
                  PRIORITY_COLORS[t.priority] ?? PRIORITY_COLORS.medium
                )}>
                  {PRIORITY_LABELS[t.priority] || t.priority}
                </span>
              )}
              <ChevronRight className="h-4 w-4 text-k-text-b group-hover:text-k-text-b transition shrink-0" />
            </div>
          ))}
        </div>
      )}
        </>
      )}
    </div>
  );
}

// ─── Available Tasks Panel (checkboxes) ─────────────────────────────────────

// Muestra PLANTILLAS y RUTINAS destacadas
export function AvailableTasksPanel({
  onAssignTemplates,
  onAssignRoutine,
  onNewTask,
  refreshKey = 0,
}: {
  onAssignTemplates: (templates: Template[]) => void;
  onAssignRoutine: (routine: Routine) => void;
  onNewTask?: () => void;
  refreshKey?: number;
}) {
  const [tab, setTab] = useState<"templates" | "routines">("templates");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [assignedTitles, setAssignedTitles] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    setSelected(new Set());
    const today = new Date().toISOString().slice(0, 10);
    Promise.all([
      listTemplates({ active: true, show_in_dashboard: true }).catch(() => ({ data: [] })),
      listRoutines({ active: true, show_in_dashboard: true }).catch(() => ({ data: [] })),
      listTasks({ date: today } as any).catch(() => ({ data: [] }))
    ])
      .then(([tplRes, rtnRes, taskRes]) => {
        setTemplates(tplRes.data ?? []);
        setRoutines(rtnRes.data ?? []);
        
        const assigned = new Set<string>();
        // Guardamos los títulos de las tareas asignadas hoy para filtrarlas en el panel
        const taskArr = Array.isArray(taskRes.data) ? taskRes.data : [];
        taskArr.forEach((t: Task) => {
          if (t.title) assigned.add(t.title.trim().toLowerCase());
        });
        setAssignedTitles(assigned);
      })
      .finally(() => setLoading(false));
  }, [refreshKey]);

  function toggleItem(id: string) {
    if (tab === "routines") {
      setSelected(new Set([id])); // Solo 1 rutina a la vez
      return;
    }
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleAssign() {
    if (tab === "templates") {
      const sel = templates.filter(t => selected.has(t.id));
      if (sel.length > 0) onAssignTemplates(sel);
    } else {
      const sel = routines.find(r => selected.has(r.id));
      if (sel) onAssignRoutine(sel);
    }
  }

  const items = tab === "templates" ? templates : routines;
  const filtered = items.filter((item: any) => {
    const title = (item.title || item.name || "").trim().toLowerCase();
    // Excluir si ya fue asignada hoy
    if (assignedTitles.has(title)) return false;
    // Aplicar búsqueda
    return title.includes(search.toLowerCase());
  });

  return (
    <div className={cx(
      "bg-k-bg-card shadow-k-card border border-k-border flex flex-col transition-all overflow-hidden h-full",
      panelOpen ? "rounded-[40px] p-8 min-h-[400px]" : "rounded-[24px] p-4 lg:px-8 lg:py-6 min-h-0"
    )}>
      {/* Header */}
      <div className={cx("flex items-center justify-between", panelOpen ? "mb-5" : "")}>
        <div 
          className="flex-1 cursor-pointer flex items-center gap-3" 
          onClick={() => setPanelOpen(!panelOpen)}
        >
          <div>
            <h2 className="text-xl font-black text-k-text-h tracking-tight">Tareas Disponibles</h2>
            {panelOpen && (
              <div className="flex items-center gap-2 mt-2 p-1 bg-neutral-100/50 rounded-xl inline-flex border border-k-border">
                <button 
                  onClick={(e) => { e.stopPropagation(); setTab("templates"); setSelected(new Set()); }}
                  className={cx("px-3 py-1.5 text-xs font-bold rounded-lg transition-colors", tab === "templates" ? "bg-k-bg-card shadow-k-card text-k-text-h" : "text-k-text-b hover:text-k-text-h")}
                >
                  Plantillas
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setTab("routines"); setSelected(new Set()); }}
                  className={cx("px-3 py-1.5 text-xs font-bold rounded-lg transition-colors", tab === "routines" ? "bg-k-bg-card shadow-k-card text-k-text-h" : "text-k-text-b hover:text-k-text-h")}
                >
                  Rutinas
                </button>
              </div>
            )}
          </div>
          {panelOpen ? <ChevronUp className="h-5 w-5 text-k-text-b" /> : <ChevronDown className="h-5 w-5 text-k-text-b" />}
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <button
              onClick={handleAssign}
              className="h-9 px-4 rounded-2xl bg-k-accent-btn text-k-accent-btn-text text-xs font-bold hover:opacity-90 transition flex items-center gap-2"
            >
              <Plus className="h-3.5 w-3.5" />
              Asignar {tab === "templates" ? `(${selected.size})` : ''}
            </button>
          )}
          {onNewTask && (
            <button
              onClick={onNewTask}
              className="h-8 px-3 rounded-xl border border-k-border text-k-text-h text-xs font-bold hover:bg-k-bg-card2 transition flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Nueva
            </button>
          )}
        </div>
      </div>

      {panelOpen && (
        <>
      {/* Search */}
      {!loading && items.length > 3 && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-k-text-b" />
          <input
            type="text"
            placeholder={`Buscar ${tab === "templates" ? "plantilla" : "rutina"}...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-9 pl-8 pr-3 rounded-xl border border-k-border text-xs outline-none focus:ring-2 focus:ring-obsidian/10 bg-k-bg-card2/50"
          />
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-12 bg-neutral-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="py-8 text-center">
          <ClipboardList className="h-10 w-10 text-neutral-200 mx-auto mb-3" />
          <p className="text-sm font-bold text-k-text-b mb-1">Sin {tab === "templates" ? "plantillas" : "rutinas"} configuradas</p>
          <p className="text-xs text-k-text-b mb-4">Ve a Catálogo para crear plantillas de tareas</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-sm font-bold text-k-text-b">¡Al día!</p>
          <p className="text-xs text-k-text-b mt-1">Ya se asignaron todas las tareas de este tipo o no hay resultados.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {filtered.map((t: any) => {
            const id = t.id;
            const title = t.title || t.name;
            return (
            <div
              key={id}
              onClick={() => toggleItem(id)}
              className={cx(
                "flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition",
                selected.has(id)
                  ? "border-obsidian bg-k-bg-sidebar/5"
                  : "border-k-border hover:border-k-border hover:bg-k-bg-card2"
              )}
            >
              {/* Checkbox */}
              <div className={cx(
                "h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition",
                selected.has(id) ? "bg-k-bg-sidebar border-obsidian" : "border-neutral-300"
              )}>
                {selected.has(id) && <CheckCircle2 className="h-3 w-3 text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-k-text-h truncate">{title}</div>
                {t.estimated_minutes && (
                  <div className="text-xs text-k-text-b">⏱ {t.estimated_minutes} min</div>
                )}
                {t.recurrence && (
                   <div className="text-xs text-k-text-b capitalize">Recurrencia {t.recurrence}</div>
                )}
              </div>
              {t.priority && (
                <span className={cx(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 uppercase",
                  PRIORITY_COLORS[t.priority] ?? PRIORITY_COLORS.medium
                )}>
                  {PRIORITY_LABELS[t.priority] || t.priority}
                </span>
              )}
            </div>
            );
          })}
        </div>
      )}
        </>
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
    <div className="bg-k-bg-card rounded-[40px] p-8 shadow-k-card border border-k-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-black text-k-text-h tracking-tight">Pendientes de Revisión</h2>
          <p className="text-xs text-k-text-b mt-0.5">
            {items.length} tarea{items.length !== 1 ? "s" : ""} esperando aprobación
          </p>
        </div>
        <span className="h-7 w-7 rounded-full bg-amber-100 text-amber-700 text-xs font-black flex items-center justify-center">
          {items.length}
        </span>
      </div>
      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
        {items.map(item => (
          <div key={item.assignment_id} className="rounded-2xl border border-k-border p-4">
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
                <div className="text-sm font-bold text-k-text-h truncate">{item.task_title}</div>
                <div className="text-xs text-k-text-b mt-0.5">
                  👤 {item.empleado_name}
                  {item.done_at && (
                    <> · {new Date(item.done_at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}</>
                  )}
                </div>
                {item.note && <div className="text-xs text-k-text-b mt-1 italic">"{item.note}"</div>}
              </div>
            </div>

            {rejectingId === item.assignment_id ? (
              <div className="space-y-2">
                <textarea
                  className="w-full rounded-xl border border-k-border px-3 py-2 text-xs resize-none outline-none focus:ring-2 focus:ring-black/10"
                  rows={2}
                  placeholder="Motivo del rechazo..."
                  value={rejectNote}
                  onChange={e => setRejectNote(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => { setRejectingId(null); setRejectNote(""); }}
                    className="flex-1 h-8 rounded-xl border border-k-border text-xs font-bold text-k-text-b hover:bg-k-bg-card2 transition"
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
                  className="h-9 w-9 rounded-xl border border-k-border flex items-center justify-center hover:bg-k-bg-card2 transition"
                  title="Ver detalle"
                >
                  <Eye className="h-3.5 w-3.5 text-k-text-b" />
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

  const [panelOpen, setPanelOpen] = useState(false);

  return (
    <div className={cx(
      "bg-k-bg-card shadow-k-card border border-k-border flex flex-col transition-all overflow-hidden h-full",
      panelOpen ? "rounded-[40px] p-8 min-h-[400px]" : "rounded-[24px] p-4 lg:px-8 lg:py-6 min-h-0"
    )}>
      <div className={cx("flex items-center justify-between", panelOpen ? "mb-6" : "")}>
        <div 
          className="flex-1 cursor-pointer flex items-center gap-3" 
          onClick={() => setPanelOpen(!panelOpen)}
        >
          <div>
            <h2 className="text-xl font-black text-k-text-h tracking-tight">Carga del Equipo</h2>
            {panelOpen && <p className="text-xs text-k-text-b mt-0.5">Minutos asignados en tareas activas</p>}
          </div>
          {panelOpen ? <ChevronUp className="h-5 w-5 text-k-text-b" /> : <ChevronDown className="h-5 w-5 text-k-text-b" />}
        </div>
        <Users className="h-5 w-5 text-k-text-b hidden md:block" />
      </div>

      {panelOpen && (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 flex-1">
        {workload.length === 0 ? (
          <div className="py-8 text-center text-sm text-k-text-b">No hay empleados activos</div>
        ) : (
          workload
            .sort((a, b) => a.total_minutes - b.total_minutes)
            .map(emp => (
              <div key={emp.empleado_id} className="rounded-2xl border border-k-border overflow-hidden">
                <div
                  className="flex items-center gap-3 p-3 cursor-pointer hover:bg-k-bg-card2 transition"
                  onClick={() => setExpanded(expanded === emp.empleado_id ? null : emp.empleado_id)}
                >
                  <div className="h-9 w-9 rounded-xl bg-k-bg-sidebar text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {emp.full_name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-k-text-h truncate">{emp.full_name}</span>
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
                      <span className="text-[11px] font-bold text-k-text-b shrink-0">
                        {fmt(emp.total_minutes)} · {emp.task_count} t
                      </span>
                    </div>
                  </div>
                  {emp.assignments.length > 0 && (
                    expanded === emp.empleado_id
                      ? <ChevronUp className="h-4 w-4 text-k-text-b shrink-0" />
                      : <ChevronDown className="h-4 w-4 text-k-text-b shrink-0" />
                  )}
                </div>

                {expanded === emp.empleado_id && emp.assignments.length > 0 && (
                  <div className="border-t border-k-border divide-y divide-neutral-50">
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
                          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-k-text-h">
                            {a.progress.pct}%
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-k-text-h truncate">{a.task_title}</div>
                          <div className="text-[10px] text-k-text-b">
                            {fmt(a.estimated_minutes)}
                            {a.progress.type === "checklist" && ` · ${a.progress.done}/${a.progress.total} pasos`}
                          </div>
                        </div>
                        <span className={cx(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0",
                          a.status === "in_progress"
                            ? "bg-blue-50 text-blue-600 border-blue-100"
                            : "bg-k-bg-card2 text-k-text-b border-k-border"
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
      )}
    </div>
  );
}

// ─── Supervisor Dashboard ────────────────────────────────────────────────────

export default function SupervisorDashboard({ userName }: { userName: string }) {
  const [data, setData] = useState<SupervisorDashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [detailModal, setDetailModal] = useState<Task | null>(null);
  const [modal, setModal] = useState<{ open: boolean; tasks: { id: string; title: string }[] }>({
    open: false, tasks: [],
  });
  const [templateModal, setTemplateModal] = useState<{ open: boolean; templates: Template[] }>({
    open: false, templates: [],
  });
  const [routineModal, setRoutineModal] = useState<{ open: boolean; routine: Routine | null }>({
    open: false, routine: null,
  });
  const [showNewTask, setShowNewTask] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [gondolaOrdenes, setGondolaOrdenes] = useState<GondolaOrden[]>([]);
  const nav = useNavigate();

  function reload() {
    setLoading(true);
    getSupervisorDashboard()
      .then((d) => {
        if (d) {
          if (d.workload && !Array.isArray(d.workload)) d.workload = Object.values(d.workload);
          if (d.pending_review && !Array.isArray(d.pending_review)) d.pending_review = Object.values(d.pending_review);
          if (!d.workload) d.workload = [];
          if (!d.pending_review) d.pending_review = [];
        }
        setData(d);
      })
      .catch(e => setErr(e?.response?.data?.message ?? "Error al cargar"))
      .finally(() => setLoading(false));

    // Cargar órdenes de góndola propias del supervisor
    misOrdenesGondola()
      .then(setGondolaOrdenes)
      .catch(() => setGondolaOrdenes([]));
  }

  useEffect(() => { reload(); }, []);

  function openModal(tasks: { id: string; title: string }[]) {
    setModal({ open: true, tasks });
  }

  function handleNewTaskDone() {
    setShowNewTask(false);
    setRefreshKey(k => k + 1);
    reload();
  }

  if (loading) return <LoadingSpinner />;
  if (err)     return <ErrorCard message={err} />;
  if (!data)   return null;

  return (
    <div className="space-y-6 animate-in-up">

      {/* 1 · Hero */}
      <div className="relative overflow-hidden bg-k-bg-sidebar rounded-[40px] p-8 lg:p-10 text-white shadow-2xl shadow-obsidian/20">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-k-bg-card/10 text-[10px] font-bold tracking-[0.2em] uppercase mb-4">
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
        <div className="absolute -top-16 -right-16 w-72 h-72 bg-k-bg-card/5 rounded-full blur-[80px]" />
      </div>

      {/* 2 · KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <KpiCard label="En Revisión"   value={data.kpi.pending_review}   color="amber"   icon={<Star className="h-5 w-5" />} compact />
        <KpiCard label="Tareas Activas" value={data.kpi.active_tasks}    color="blue"    icon={<ClipboardList className="h-5 w-5" />} compact />
        <KpiCard label="Completadas Hoy" value={data.kpi.completed_today} color="emerald" icon={<CheckCircle2 className="h-5 w-5" />} compact />
      </div>

      {/* 3 · Tareas Abiertas (full width) */}
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

      {/* 4 · Disponibles + Carga */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AvailableTasksPanel
          onAssignTemplates={templates => setTemplateModal({ open: true, templates })}
          onAssignRoutine={routine => setRoutineModal({ open: true, routine })}
          onNewTask={() => setShowNewTask(true)}
          refreshKey={refreshKey}
        />
        <WorkloadCard workload={data.workload} />
      </div>

      {/* 5 · Pendientes revisión (supervisor only, si hay items) */}
      {data.pending_review.length > 0 && (
        <PendingReviewCard items={data.pending_review} onRefresh={reload} />
      )}

      {/* 6 · Mis Góndolas (si el supervisor tiene órdenes asignadas) */}
      {gondolaOrdenes.filter(o => ['pendiente','en_proceso','rechazado'].includes(o.status)).length > 0 && (
        <div className="rounded-[40px] border border-k-border bg-k-bg-card shadow-k-card overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-k-border bg-k-bg-card2/50 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <LayoutGrid className="h-5 w-5 text-amber-500" />
                <div className="text-xl font-black text-k-text-h tracking-tight">Mis Góndolas por rellenar</div>
              </div>
              <div className="text-[11px] font-bold text-k-text-b uppercase tracking-widest mt-1">
                {gondolaOrdenes.filter(o => ['pendiente','en_proceso','rechazado'].includes(o.status)).length} orden(es) activa(s)
              </div>
            </div>
          </div>
          <div className="divide-y divide-neutral-100">
            {gondolaOrdenes.filter(o => ['pendiente','en_proceso','rechazado'].includes(o.status)).map(o => (
              <div key={o.id} className="p-5 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">🛒</span>
                    <div className="text-lg font-black text-k-text-h tracking-tight truncate">{o.gondola?.nombre}</div>
                    <span className={cx(
                      "inline-flex items-center rounded-full border px-2 py-0.5 text-xs",
                      o.status === 'rechazado' ? "bg-rose-50 text-rose-800 border-rose-200" :
                      o.status === 'en_proceso' ? "bg-amber-50 text-amber-800 border-amber-200" :
                      "bg-k-bg-card2 text-neutral-700 border-k-border"
                    )}>
                      {o.status === 'rechazado' ? 'Rechazado' : o.status === 'en_proceso' ? 'En proceso' : 'Pendiente'}
                    </span>
                  </div>
                  <div className="text-sm text-k-text-b">{o.items?.length ?? 0} productos</div>
                  {o.status === 'rechazado' && o.notas_rechazo && (
                    <div className="mt-2 rounded-xl bg-rose-50 border border-rose-100 px-3 py-2 text-xs text-rose-700 font-medium">
                      Motivo: {o.notas_rechazo}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => nav(`/app/employee/gondola-relleno/${o.id}`)}
                  className="w-full lg:w-auto rounded-2xl bg-k-accent-btn text-k-accent-btn-text px-6 py-3 text-xs font-bold shadow-md hover:opacity-90 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
                >
                  {o.status === 'en_proceso' ? '→ Continuar' : o.status === 'rechazado' ? '↩ Volver a completar' : '▶ Iniciar relleno'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Mostrar Detalles de Tarea Ya Asignada */}
      {detailModal && (
        <TaskDetailModal 
          task={detailModal} 
          onClose={() => setDetailModal(null)} 
          onDeleted={() => {
            setDetailModal(null);
            setRefreshKey(k => k + 1);
            reload();
          }}
        />
      )}

      {/* Modal asignar empleado */}
      {modal.open && (
        <AssignTaskModal
          tasks={modal.tasks}
          workload={data.workload}
          onClose={() => setModal({ open: false, tasks: [] })}
          onAssigned={() => {
            setModal({ open: false, tasks: [] });
            setRefreshKey(k => k + 1);
            reload();
          }}
        />
      )}

      {/* Modal asignar rutina */}
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
            reload();
          }}
        />
      )}

      {/* Modal asignar plantilla(s) */}
      {templateModal.open && (
        <AssignTemplateModal
          templates={templateModal.templates}
          workload={data.workload}
          onClose={() => setTemplateModal({ open: false, templates: [] })}
          onAssigned={() => {
            setTemplateModal({ open: false, templates: [] });
            setRefreshKey(k => k + 1);
            reload();
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
