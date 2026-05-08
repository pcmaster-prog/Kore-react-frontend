import { ClipboardList, AlertTriangle } from "lucide-react";
import { cx } from "@/lib/utils";
import TaskTableRow from "./TaskTableRow";
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
        <div className="p-16 flex flex-col items-center gap-4 text-neutral-400 bg-neutral-50/50">
          <div className="h-10 w-10 border-4 border-neutral-200 border-t-obsidian rounded-full animate-spin" />
          <span className="text-[10px] font-bold uppercase tracking-widest">
            Sincronizando tareas...
          </span>
        </div>
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
        <div className="p-20 text-center bg-neutral-50/30">
          <div className="h-20 w-20 rounded-[24px] bg-white border border-neutral-100 shadow-sm flex items-center justify-center mx-auto mb-6">
            <ClipboardList className="h-8 w-8 text-neutral-300" />
          </div>
          <p className="text-xs font-black text-obsidian uppercase tracking-widest mb-2">
            No hay tareas activas
          </p>
          <p className="text-[11px] font-bold text-neutral-400 capitalize tracking-wide max-w-xs mx-auto text-center leading-relaxed mb-4">
            Prueba cambiando los filtros o crea una nueva tarea.
          </p>
          <button
            className="h-10 px-5 rounded-xl bg-obsidian text-sm font-bold text-white shadow-sm hover:bg-neutral-800 transition-all inline-flex items-center gap-2"
            onClick={() =>
              window.dispatchEvent(new CustomEvent("kore-new-task"))
            }
          >
            + Nueva Tarea
          </button>
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
