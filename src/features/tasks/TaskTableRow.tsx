import { CheckCircle2, RotateCcw, X, Image as ImageIcon } from "lucide-react";
import { cx } from "@/lib/utils";
import StatusPill from "./StatusPill";
import AssigneeCell from "./AssigneeCell";
import type { ExtendedTask } from "./tasks.types";

interface TaskTableRowProps {
  task: ExtendedTask;
  busyId: string | null;
  onQuickSetStatus: (
    taskId: string,
    next: "open" | "in_progress" | "completed",
  ) => void;
  onReload: (taskId: string) => Promise<void>;
  onOpenEvidences: (taskId: string) => void;
}

export default function TaskTableRow({
  task,
  busyId,
  onQuickSetStatus,
  onReload,
  onOpenEvidences,
}: TaskTableRowProps) {
  const hasEvidence =
    task.has_evidence ||
    (task.evidences ?? []).length > 0 ||
    (task.evidence ?? []).length > 0 ||
    task.has_evidences ||
    (task.assignees ?? []).some((a) => a.has_evidence);

  const priorityBorder =
    task.priority === "urgent"
      ? "border-l-rose-500"
      : task.priority === "high"
        ? "border-l-orange-400"
        : task.priority === "low"
          ? "border-l-neutral-300"
          : "border-l-transparent";

  return (
    <tr
      className={cx(
        "border-t border-neutral-50 hover:bg-neutral-50/80 transition-colors group border-l-[3px]",
        priorityBorder,
      )}
    >
      <td className="px-6 py-5">
        <AssigneeCell task={task} />
      </td>
      <td className="px-6 py-5">
        <div className="flex flex-col justify-center">
          <div className="text-sm font-black text-obsidian line-clamp-1 mb-1 group-hover:text-gold transition-colors">
            {task.title}
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-neutral-400 uppercase">
            <span>
              Asig:{" "}
              {new Date(task.created_at).toLocaleDateString("es-MX", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </span>
            <span className="h-1 w-1 rounded-full bg-neutral-200" />
            <span
              className={cx(
                task.priority === "urgent"
                  ? "text-rose-500"
                  : task.priority === "high"
                    ? "text-rose-400"
                    : "text-neutral-400",
              )}
            >
              Prio:{" "}
              {task.priority === "urgent"
                ? "Urgente"
                : task.priority === "high"
                  ? "Alta"
                  : task.priority === "low"
                    ? "Baja"
                    : "Normal"}
            </span>
          </div>
          {task.description && (
            <div className="text-xs font-medium text-neutral-400 mt-2 line-clamp-1 bg-neutral-50 border border-neutral-100 rounded-lg px-2.5 py-1.5 w-fit">
              {task.description}
            </div>
          )}
        </div>
      </td>
      <td className="px-6 py-5 whitespace-nowrap">
        <StatusPill status={task.status} />
      </td>
      <td className="px-6 py-5 text-center whitespace-nowrap">
        {hasEvidence ? (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onOpenEvidences(task.id);
            }}
            className="inline-flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 shadow-sm px-3 py-1.5 rounded-xl border border-emerald-100 hover:bg-emerald-100 hover:border-emerald-200 transition-colors mx-auto"
          >
            <ImageIcon className="h-3.5 w-3.5" /> Ver Evidencia
          </button>
        ) : (
          <span className="inline-flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-neutral-300 bg-neutral-50 px-3 py-1.5 rounded-xl border border-neutral-100 mx-auto">
            <X className="h-3 w-3" /> Sin Evidencia
          </span>
        )}
      </td>
      <td className="px-6 py-5 text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
          <button
            title="Detener / Abierta"
            disabled={busyId === task.id || task.status === "open"}
            onClick={() => onQuickSetStatus(task.id, "open")}
            className="h-9 w-9 bg-white border border-neutral-100 shadow-sm rounded-xl flex items-center justify-center text-rose-500 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition disabled:opacity-30 disabled:hover:bg-white disabled:hover:border-neutral-100"
          >
            <X className="h-4 w-4" />
          </button>
          <button
            title="Marcar completada"
            disabled={busyId === task.id || task.status === "completed"}
            onClick={() => onQuickSetStatus(task.id, "completed")}
            className="h-9 w-9 bg-white border border-neutral-100 shadow-sm rounded-xl flex items-center justify-center text-emerald-500 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600 transition disabled:opacity-30 disabled:hover:bg-white disabled:hover:border-neutral-100"
          >
            <CheckCircle2 className="h-4 w-4" />
          </button>
          <button
            title="Recargar"
            disabled={busyId === task.id}
            onClick={() => onReload(task.id)}
            className="h-9 px-3 bg-neutral-100 text-obsidian rounded-xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest hover:bg-neutral-200 transition-colors disabled:opacity-50"
          >
            <RotateCcw
              className={cx("h-3 w-3", busyId === task.id && "animate-spin")}
            />
            Recargar
          </button>
        </div>
      </td>
    </tr>
  );
}
