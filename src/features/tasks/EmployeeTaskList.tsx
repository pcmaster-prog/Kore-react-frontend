// src/features/tasks/EmployeeTaskList.tsx
// ─── Lista de tareas del día para el empleado ───────────────────────────────

import { useMemo, useState } from "react";
import { cx } from "@/lib/utils";
import { useTaskTree } from "./hooks/useTaskTree";
import { useTaskStore } from "./taskStore";
import PriorityBadge from "./components/PriorityBadge";
import {
  ClipboardList,
  Lock,
  Play,
  CheckCircle2,
  Clock,
} from "lucide-react";

type FilterKey = "all" | "pending" | "in_progress";

interface EmployeeTaskListProps {
  /** Si el empleado ya hizo check-in hoy */
  hasCheckedIn?: boolean;
  onExecuteTask?: (taskId: string) => void;
}

export default function EmployeeTaskList({ hasCheckedIn = true, onExecuteTask }: EmployeeTaskListProps) {
  const { data: tasks, isLoading } = useTaskTree();
  const { selectTask } = useTaskStore();
  const [filter, setFilter] = useState<FilterKey>("all");

  const filtered = useMemo(() => {
    if (!tasks) return [];
    let list = tasks.filter((t) => !t.isBlocked || hasCheckedIn);
    if (filter === "pending") list = list.filter((t) => t.status === "open");
    if (filter === "in_progress") list = list.filter((t) => t.status === "in_progress");
    return list;
  }, [tasks, filter, hasCheckedIn]);

  const statusMeta: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    open: { label: "Pendiente", icon: <Clock className="h-3.5 w-3.5" />, color: "text-neutral-500 bg-neutral-50" },
    in_progress: { label: "En progreso", icon: <Play className="h-3.5 w-3.5" />, color: "text-blue-600 bg-blue-50" },
    done_pending: { label: "Por revisar", icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: "text-amber-600 bg-amber-50" },
    approved: { label: "Aprobada", icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: "text-emerald-600 bg-emerald-50" },
    completed: { label: "Completada", icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: "text-emerald-600 bg-emerald-50" },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-k-text-b text-sm font-medium">Cargando tus tareas...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black text-k-text-h tracking-tight">Mis Tareas</h3>
        <div className="flex items-center gap-1 p-1 bg-k-bg-card border border-k-border rounded-[20px]">
          {(["all", "pending", "in_progress"] as FilterKey[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cx(
                "px-3 py-1.5 rounded-[16px] text-xs font-bold transition-all",
                filter === f
                  ? "bg-k-bg-sidebar text-white shadow-sm"
                  : "text-k-text-b hover:text-k-text-h"
              )}
            >
              {f === "all" ? "Todas" : f === "pending" ? "Pendientes" : "En progreso"}
            </button>
          ))}
        </div>
      </div>

      {!hasCheckedIn && (
        <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4 flex items-center gap-3 text-sm text-amber-800 font-medium">
          <Lock className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-bold">Tareas bloqueadas</p>
            <p className="text-xs opacity-80">Registra tu entrada en el módulo de Asistencia para desbloquear tus tareas.</p>
          </div>
        </div>
      )}

      {/* Task Cards */}
      <div className="space-y-2">
        {filtered.map((task) => {
          const meta = statusMeta[task.status] ?? statusMeta.open;
          const isBlocked = task.isBlocked && !hasCheckedIn;
          const checklistDone = task.checklist.filter((c) => c.done).length;

          return (
            <button
              key={task.id}
              type="button"
              disabled={isBlocked}
              onClick={() => {
                selectTask(task.id);
                onExecuteTask?.(task.id);
              }}
              className={cx(
                "w-full text-left rounded-2xl bg-k-bg-card border border-k-border p-4 shadow-k-card transition-all",
                isBlocked ? "opacity-60 cursor-not-allowed" : "hover:shadow-md hover:border-k-bg-sidebar/20 cursor-pointer"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <PriorityBadge priority={task.priority} />
                    <span className={cx("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold", meta.color)}>
                      {meta.icon}
                      {meta.label}
                    </span>
                  </div>
                  <h4 className={cx("text-sm font-bold text-k-text-h truncate", isBlocked && "line-through opacity-60")}>
                    {task.name}
                  </h4>
                  <p className="text-xs text-k-text-b mt-0.5 truncate">{task.description}</p>
                </div>
                {isBlocked && <Lock className="h-5 w-5 text-amber-500 shrink-0" />}
              </div>

              <div className="flex items-center gap-4 mt-3 text-[11px] text-k-text-b">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {task.estimatedTime ?? 0} min
                </span>
                <span className="flex items-center gap-1">
                  <ClipboardList className="h-3 w-3" />
                  {checklistDone}/{task.checklist.length}
                </span>
                {task.area && (
                  <span className="truncate">{task.area.name} › {task.section?.name}</span>
                )}
              </div>
            </button>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 bg-k-bg-card rounded-2xl border border-k-border">
            <ClipboardList className="h-10 w-10 mx-auto text-k-border mb-3" />
            <p className="text-sm font-medium text-k-text-b">No tienes tareas {filter === "all" ? "" : filter === "pending" ? "pendientes" : "en progreso"}</p>
          </div>
        )}
      </div>
    </div>
  );
}
