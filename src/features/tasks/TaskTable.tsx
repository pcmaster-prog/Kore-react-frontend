import { ClipboardList, AlertTriangle } from "lucide-react";
import { cx } from "@/lib/utils";
import EmptyState from "@/components/EmptyState";
import TaskTableRow from "./TaskTableRow";
import TaskTableSkeleton from "./TaskTableSkeleton";
import type { TasksListData, ExtendedTask } from "./tasks.types";

interface TaskTableProps {
  loading: boolean;
  error: string | null;
  data: TasksListData | null;
  busyId: string | null;
  onQuickSetStatus: (
    taskId: string,
    next: "open" | "in_progress" | "completed",
  ) => void;
  onReload: (taskId: string) => Promise<void>;
  onOpenEvidences: (taskId: string) => void;
  page: number;
  onPageChange: (page: number) => void;
}

export default function TaskTable({
  loading,
  error,
  data,
  busyId,
  onQuickSetStatus,
  onReload,
  onOpenEvidences,
  page,
  onPageChange,
}: TaskTableProps) {
  return (
    <div className="bg-white rounded-[40px] border border-neutral-100 shadow-sm overflow-hidden">
      <div className="px-8 py-6 border-b border-neutral-50 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-neutral-50 rounded-[14px] flex items-center justify-center text-obsidian border border-neutral-100">
            <ClipboardList className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-obsidian tracking-tight">
              Listado de Tareas
            </h3>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5">
              Asignaciones en curso
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <TaskTableSkeleton rows={5} />
      ) : error ? (
        <div className="p-8 m-6 rounded-3xl bg-rose-50 border border-rose-100 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
            <AlertTriangle className="h-5 w-5 text-rose-500" />
          </div>
          <div>
            <div className="text-sm font-black text-rose-700">
              Error de carga
            </div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-rose-500 mt-1">
              {error}
            </div>
          </div>
        </div>
      ) : data?.data?.length === 0 ? (
        <div className="p-8 bg-neutral-50/30">
          <EmptyState
            variant="neutral"
            title="No hay tareas activas"
            description="Prueba cambiando los filtros o crea una nueva tarea para empezar."
            action={{
              label: "+ Nueva Tarea",
              onClick: () =>
                window.dispatchEvent(new CustomEvent("kore-new-task")),
            }}
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-neutral-50/80 border-b border-neutral-50">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest whitespace-nowrap">
                  Empleado
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest min-w-[280px]">
                  Misión / Tarea
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                  Estado
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest text-center">
                  Evidencia
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {data?.data.map((task: ExtendedTask) => (
                <TaskTableRow
                  key={task.id}
                  task={task}
                  busyId={busyId}
                  onQuickSetStatus={onQuickSetStatus}
                  onReload={onReload}
                  onOpenEvidences={onOpenEvidences}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.last_page > 1 && (
        <div className="bg-neutral-50/50 border-t border-neutral-50 px-8 py-5 flex items-center justify-between">
          <button
            className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-obsidian disabled:opacity-30 transition"
            disabled={page <= 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
          >
            &larr; Anterior
          </button>
          <div className="flex gap-2">
            {Array.from({ length: data.last_page }).map((_, i) => (
              <button
                key={i}
                onClick={() => onPageChange(i + 1)}
                className={cx(
                  "h-7 w-7 rounded-xl flex items-center justify-center text-[11px] font-black transition",
                  page === i + 1
                    ? "bg-obsidian text-white shadow-sm shadow-obsidian/20"
                    : "bg-white text-neutral-400 hover:text-obsidian border border-neutral-100",
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-obsidian disabled:opacity-30 transition"
            disabled={page >= data.last_page}
            onClick={() =>
              onPageChange(Math.min(data.last_page, page + 1))
            }
          >
            Siguiente &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
