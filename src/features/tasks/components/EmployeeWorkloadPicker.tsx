import { useState } from "react";
import { CheckCircle2, Search, Users } from "lucide-react";
import { cx } from "@/lib/utils";
import type { EmployeeWorkload } from "@/features/dashboard/types";
import { WORKLOAD_BADGE } from "@/features/dashboard/constants";
import UserAvatar from "@/features/dashboard/components/ui/UserAvatar";

interface EmployeeWorkloadPickerProps {
  employees: EmployeeWorkload[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
}

export default function EmployeeWorkloadPicker({
  employees,
  selectedIds,
  onToggle,
  onSelectAll,
  onClear,
}: EmployeeWorkloadPickerProps) {
  const [search, setSearch] = useState("");

  const filtered = employees
    .filter((e) => e.full_name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.total_minutes - b.total_minutes);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <span className="block text-[11px] font-bold uppercase tracking-widest text-k-text-b">
          Asignar a...
        </span>
        <div className="flex gap-2">
          <button
            className="text-[9px] font-bold uppercase tracking-widest text-k-text-h bg-neutral-100 hover:bg-neutral-200 px-2 py-1 rounded-md transition"
            onClick={onSelectAll}
          >
            Todos
          </button>
          <button
            className="text-[9px] font-bold uppercase tracking-widest text-rose-600 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded-md transition"
            onClick={onClear}
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-k-text-b" />
        <input
          className="w-full bg-k-bg-card2 border border-k-border rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-obsidian/10 transition-shadow"
          placeholder="Buscar empleado..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Selection chips */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {selectedIds.map((id) => {
            const emp = employees.find((e) => e.empleado_id === id);
            if (!emp) return null;
            return (
              <button
                key={id}
                onClick={() => onToggle(id)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-k-bg-sidebar/5 border border-obsidian/10 text-[11px] font-bold text-k-text-h hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition"
              >
                {emp.full_name}
                <span className="text-neutral-400">×</span>
              </button>
            );
          })}
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-sm text-k-text-b font-bold">
            Sin empleados disponibles
          </div>
        ) : (
          filtered.map((emp) => {
            const selected = selectedIds.includes(emp.empleado_id);
            return (
              <div
                key={emp.empleado_id}
                onClick={() => onToggle(emp.empleado_id)}
                className={cx(
                  "flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition",
                  selected
                    ? "border-obsidian bg-k-bg-sidebar/5"
                    : "border-k-border hover:border-k-border hover:bg-k-bg-card2"
                )}
              >
                <div
                  className={cx(
                    "h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition",
                    selected
                      ? "bg-k-bg-sidebar border-obsidian"
                      : "border-neutral-300"
                  )}
                >
                  {selected && <CheckCircle2 className="h-3 w-3 text-white" />}
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
            );
          })
        )}
      </div>

      {/* Footer stats */}
      <div className="mt-3 pt-3 border-t border-k-border flex items-center justify-between text-[10px] font-bold text-k-text-b uppercase tracking-widest">
        <span className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />
          {selectedIds.length} de {employees.length} seleccionados
        </span>
      </div>
    </div>
  );
}
