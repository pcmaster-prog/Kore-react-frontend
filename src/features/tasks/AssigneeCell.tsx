import { Users } from "lucide-react";
import type { ExtendedTask } from "./tasks.types";

interface AssigneeCellProps {
  task: ExtendedTask;
}

export default function AssigneeCell({ task }: AssigneeCellProps) {
  const assignees = task.assignees ?? [];
  const firstAssignee = assignees[0]?.empleado ?? task.empleado ?? null;
  const empName =
    firstAssignee?.full_name ?? firstAssignee?.name ?? task.assignee_name;
  const empAvatar =
    firstAssignee?.avatar_url ?? task.empleado?.avatar_url;
  const isAssigned =
    assignees.length > 0 ||
    (!!empName && empName !== "Equipo General" && empName !== "Sin Asignar");

  const displayLabel =
    assignees.length > 1
      ? `${empName} y ${assignees.length - 1} más`
      : isAssigned
        ? empName
        : "Sin Asignar";

  const initials = isAssigned
    ? assignees.length > 1
      ? "M"
      : empName?.substring(0, 2).toUpperCase() || "SA"
    : "SA";

  return (
    <div className="flex items-center gap-3">
      <div className="h-9 w-9 rounded-2xl bg-white border border-neutral-100 shadow-sm flex items-center justify-center overflow-hidden shrink-0">
        {assignees.length > 1 ? (
          <Users className="h-4 w-4 text-neutral-400" />
        ) : empAvatar ? (
          <img
            src={empAvatar}
            alt="avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-[10px] font-black text-neutral-400">
            {initials}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <div
          className="text-xs font-black text-obsidian truncate max-w-[120px]"
          title={displayLabel ?? undefined}
        >
          {displayLabel}
        </div>
        <div className="text-[10px] font-bold tracking-wider uppercase text-neutral-400 mt-1 truncate max-w-[120px]">
          {assignees.length > 1
            ? "Grupal"
            : isAssigned
              ? "Individual"
              : "Pendiente"}
        </div>
      </div>
    </div>
  );
}
