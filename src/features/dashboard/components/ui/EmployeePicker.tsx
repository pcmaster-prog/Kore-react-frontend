import { useState } from "react";
import { CheckCircle2, Search } from "lucide-react";
import { cx } from "@/lib/utils";
import type { EmployeeWorkload } from "../../types";
import { WORKLOAD_BADGE } from "../../constants";
import UserAvatar from "./UserAvatar";

export interface EmployeePickerProps {
  workload: EmployeeWorkload[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  searchPlaceholder?: string;
}

export default function EmployeePicker({
  workload,
  selectedIds,
  onToggle,
  searchPlaceholder = "Buscar empleado...",
}: EmployeePickerProps) {
  const [search, setSearch] = useState("");

  const filtered = workload
    .filter((e) => e.full_name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.total_minutes - b.total_minutes);

  return (
    <>
      <div className="px-7 pt-5 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-k-text-b" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-k-border text-sm outline-none focus:ring-2 focus:ring-obsidian/10 bg-k-bg-card2/50"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-7 pb-4 space-y-2">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-sm text-k-text-b font-bold">
            Sin empleados disponibles
          </div>
        ) : (
          filtered.map((emp) => (
            <div
              key={emp.empleado_id}
              onClick={() => onToggle(emp.empleado_id)}
              className={cx(
                "flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition",
                selectedIds.includes(emp.empleado_id)
                  ? "border-obsidian bg-k-bg-sidebar/5"
                  : "border-k-border hover:border-k-border hover:bg-k-bg-card2"
              )}
            >
              <div
                className={cx(
                  "h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition",
                  selectedIds.includes(emp.empleado_id)
                    ? "bg-k-bg-sidebar border-obsidian"
                    : "border-neutral-300"
                )}
              >
                {selectedIds.includes(emp.empleado_id) && (
                  <CheckCircle2 className="h-3 w-3 text-white" />
                )}
              </div>
              <UserAvatar name={emp.full_name} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-k-text-h truncate">
                  {emp.full_name}
                </div>
                <div className="text-xs text-k-text-b">
                  {emp.task_count} tarea{emp.task_count !== 1 ? "s" : ""} ·{" "}
                  {emp.total_hours}h asignadas
                </div>
              </div>
              <span
                className={cx(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0",
                  WORKLOAD_BADGE[emp.workload_level]
                )}
              >
                {emp.workload_level}
              </span>
            </div>
          ))
        )}
      </div>
    </>
  );
}
