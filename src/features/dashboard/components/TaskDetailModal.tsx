import { useState } from "react";
import { XCircle, Trash2 } from "lucide-react";
import { deleteTask } from "@/features/tasks/api";
import type { Task } from "@/features/tasks/types";
import { getApiErrorMessage } from "../utils";
import TaskStatusBadge from "./ui/TaskStatusBadge";
import PriorityBadge from "./ui/PriorityBadge";
import ProgressRing from "./ui/ProgressRing";

export interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
  onDeleted?: () => void;
}

interface TaskAssignee {
  id: string;
  empleado?: {
    user?: { name?: string };
    full_name?: string;
  } | null;
  progress?: { pct?: number } | null;
  status: string;
}

export default function TaskDetailModal({
  task,
  onClose,
  onDeleted,
}: TaskDetailModalProps) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (
      !confirm(
        `¿Estás seguro de que deseas eliminar la tarea "${task.title}" y cancelar sus asignaciones? Esta acción no se puede deshacer.`
      )
    )
      return;
    setDeleting(true);
    try {
      await deleteTask(task.id);
      if (onDeleted) onDeleted();
      else onClose();
    } catch (e: unknown) {
      alert(getApiErrorMessage(e, "Error al eliminar la tarea."));
      setDeleting(false);
    }
  }

  const assignees = (task.assignees as TaskAssignee[] | undefined) ?? [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in-fade">
      <div className="bg-k-bg-card rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden animate-in-up">
        <div className="p-6 border-b border-k-border flex items-start justify-between bg-k-bg-card2/50">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TaskStatusBadge status={task.status} />
              {task.priority && <PriorityBadge priority={task.priority} />}
            </div>
            <h2 className="text-xl font-black text-k-text-h leading-tight pr-4">
              {task.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-neutral-100 text-k-text-b flex items-center justify-center hover:bg-neutral-200 transition shrink-0"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <h3 className="text-xs font-black text-k-text-b uppercase tracking-widest mb-3">
              Empleados Asignados
            </h3>
            {assignees.length === 0 ? (
              <p className="text-sm text-k-text-b italic">
                No hay empleados asignados a esta tarea.
              </p>
            ) : (
              <div className="space-y-3">
                {assignees.map((a) => {
                  const empName =
                    a.empleado?.user?.name ||
                    a.empleado?.full_name ||
                    "Desconocido";
                  const pct = a.progress?.pct ?? 0;
                  return (
                    <div
                      key={a.id}
                      className="flex items-center gap-3 p-3 rounded-2xl border border-k-border bg-k-bg-card"
                    >
                      <ProgressRing pct={pct} size={40} strokeWidth={4} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-k-text-h truncate">
                          {empName}
                        </div>
                        <div className="text-[10px] font-bold uppercase text-k-text-b mt-0.5">
                          {a.status === "in_progress"
                            ? "En proceso"
                            : a.status === "done"
                            ? "Terminado"
                            : "Asignado"}
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
