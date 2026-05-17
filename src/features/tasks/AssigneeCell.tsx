import { Users } from "lucide-react";
import type { ExtendedTask } from "./tasks.types";

interface AssigneeCellProps {
  task: ExtendedTask;
}

function Avatar({
  url,
  initials,
  index,
}: {
  url?: string | null;
  initials: string;
  index: number;
}) {
  return (
    <div
      className="h-8 w-8 rounded-xl bg-white border-2 border-white shadow-sm flex items-center justify-center overflow-hidden shrink-0"
      style={{ marginLeft: index > 0 ? "-10px" : "0", zIndex: 10 - index }}
    >
      {url ? (
        <img
          src={url}
          alt="avatar"
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <span className="text-[10px] font-black text-neutral-500">
          {initials}
        </span>
      )}
    </div>
  );
}

export default function AssigneeCell({ task }: AssigneeCellProps) {
  const assignees = task.assignees ?? [];
  const firstAssignee = assignees[0]?.empleado ?? task.empleado ?? null;
  const empName =
    firstAssignee?.full_name ?? firstAssignee?.name ?? task.assignee_name;

  const isAssigned =
    assignees.length > 0 ||
    (!!empName && empName !== "Equipo General" && empName !== "Sin Asignar");

  const displayLabel =
    assignees.length > 1
      ? `${empName} y ${assignees.length - 1} más`
      : isAssigned
        ? empName
        : "Sin Asignar";

  // Build avatar list from assignees
  const avatarList = assignees
    .filter((a) => a.empleado)
    .map((a) => ({
      url: a.empleado?.avatar_url,
      name: a.empleado?.full_name ?? a.empleado?.name ?? "?",
    }));

  const showStack = avatarList.length > 1;
  const visibleAvatars = avatarList.slice(0, 3);
  const remaining = avatarList.length - visibleAvatars.length;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center">
        {showStack ? (
          <>
            {visibleAvatars.map((av, idx) => (
              <Avatar
                key={idx}
                url={av.url}
                initials={av.name.substring(0, 2).toUpperCase()}
                index={idx}
              />
            ))}
            {remaining > 0 && (
              <div
                className="h-8 w-8 rounded-xl bg-neutral-100 border-2 border-white shadow-sm flex items-center justify-center shrink-0"
                style={{ marginLeft: "-10px", zIndex: 0 }}
              >
                <span className="text-[9px] font-black text-neutral-500">
                  +{remaining}
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="h-9 w-9 rounded-2xl bg-white border border-neutral-100 shadow-sm flex items-center justify-center overflow-hidden shrink-0">
            {assignees.length > 1 ? (
              <Users className="h-4 w-4 text-neutral-400" />
            ) : firstAssignee?.avatar_url ? (
              <img
                src={firstAssignee.avatar_url}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-[10px] font-black text-neutral-400">
                {isAssigned
                  ? empName?.substring(0, 2).toUpperCase() || "SA"
                  : "SA"}
              </span>
            )}
          </div>
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
