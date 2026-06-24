import { useState } from "react";
import { ChevronDown, ChevronUp, Users } from "lucide-react";
import { cx } from "@/lib/utils";
import type { EmployeeWorkload } from "../types";
import { formatDuration } from "../utils";
import CollapsiblePanel from "./ui/CollapsiblePanel";
import UserAvatar from "./ui/UserAvatar";
import ProgressRing from "./ui/ProgressRing";

export interface WorkloadCardProps {
  workload: EmployeeWorkload[];
}

const WORKLOAD_COLORS: Record<string, string> = {
  bajo: "bg-emerald-100 text-emerald-700 border-emerald-200",
  medio: "bg-amber-100 text-amber-700 border-amber-200",
  alto: "bg-rose-100 text-rose-700 border-rose-200",
};

const WORKLOAD_BAR: Record<string, string> = {
  bajo: "bg-emerald-400",
  medio: "bg-amber-400",
  alto: "bg-rose-400",
};

export default function WorkloadCard({ workload }: WorkloadCardProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  return (
    <CollapsiblePanel
      title="Carga del Equipo"
      subtitle="Minutos asignados en tareas activas"
      isOpen={panelOpen}
      onToggle={() => setPanelOpen((p) => !p)}
      openClassName="rounded-[40px] p-8 min-h-[320px]"
      closedClassName="rounded-[24px] p-4 lg:px-8 lg:py-6 min-h-0"
      headerRight={
        <Users className="h-5 w-5 text-k-text-b hidden md:block" />
      }
    >
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 flex-1">
        {workload.length === 0 ? (
          <div className="py-8 text-center text-sm text-k-text-b">
            No hay empleados activos
          </div>
        ) : (
          workload
            .sort((a, b) => a.total_minutes - b.total_minutes)
            .map((emp) => (
              <div
                key={emp.empleado_id}
                className="rounded-2xl border border-k-border overflow-hidden"
              >
                <div
                  className="flex items-center gap-3 p-3 cursor-pointer hover:bg-k-bg-card2 transition"
                  onClick={() =>
                    setExpanded(
                      expanded === emp.empleado_id ? null : emp.empleado_id
                    )
                  }
                >
                  <UserAvatar name={emp.full_name} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-k-text-h truncate">
                        {emp.full_name}
                      </span>
                      <span
                        className={cx(
                          "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide shrink-0",
                          WORKLOAD_COLORS[emp.workload_level]
                        )}
                      >
                        {emp.workload_level}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className={cx(
                            "h-full rounded-full transition-all",
                            WORKLOAD_BAR[emp.workload_level]
                          )}
                          style={{
                            width: `${Math.min(
                              (emp.total_minutes / 480) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-k-text-b shrink-0">
                        {formatDuration(emp.total_minutes)} · {emp.task_count}{" "}
                        t
                      </span>
                    </div>
                  </div>
                  {emp.assignments.length > 0 &&
                    (expanded === emp.empleado_id ? (
                      <ChevronUp className="h-4 w-4 text-k-text-b shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-k-text-b shrink-0" />
                    ))}
                </div>

                {expanded === emp.empleado_id && emp.assignments.length > 0 && (
                  <div className="border-t border-k-border divide-y divide-neutral-50">
                    {emp.assignments.map((a) => (
                      <div
                        key={a.assignment_id}
                        className="px-4 py-2.5 flex items-center gap-3"
                      >
                        <ProgressRing
                          pct={a.progress.pct}
                          size={32}
                          strokeWidth={3}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-k-text-h truncate">
                            {a.task_title}
                          </div>
                          <div className="text-[10px] text-k-text-b">
                            {formatDuration(a.estimated_minutes)}
                            {a.progress.type === "checklist" &&
                              ` · ${a.progress.done}/${a.progress.total} pasos`}
                          </div>
                        </div>
                        <span
                          className={cx(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0",
                            a.status === "in_progress"
                              ? "bg-blue-50 text-blue-600 border-blue-100"
                              : "bg-k-bg-card2 text-k-text-b border-k-border"
                          )}
                        >
                          {a.status === "in_progress"
                            ? "En proceso"
                            : "Asignada"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
        )}
      </div>
    </CollapsiblePanel>
  );
}
