import { ChevronRight, Search, Check, CheckCircle2, Calendar, Flag, Layers } from "lucide-react";
import { cx } from "@/lib/utils";
import type { EmployeeOption, ExtendedTask } from "./tasks.types";

interface TaskFiltersBarProps {
  status: string;
  onStatusChange: (v: string) => void;
  empleadoId: string;
  onEmpleadoIdChange: (v: string) => void;
  empleados: EmployeeOption[];
  search: string;
  onSearchChange: (v: string) => void;
  overdue: boolean;
  onOverdueChange: (v: boolean) => void;
  date: string;
  onDateChange: (v: string) => void;
  priority: string;
  onPriorityChange: (v: string) => void;
  section: string;
  onSectionChange: (v: string) => void;
  tasks: ExtendedTask[];
  loading: boolean;
  totalTasks: number;
  pendingApprovalsCount: number;
  showApprovals: boolean;
  onToggleApprovals: () => void;
}

export default function TaskFiltersBar({
  status,
  onStatusChange,
  empleadoId,
  onEmpleadoIdChange,
  empleados,
  search,
  onSearchChange,
  overdue,
  onOverdueChange,
  date,
  onDateChange,
  priority,
  onPriorityChange,
  section,
  onSectionChange,
  tasks,
  loading,
  totalTasks,
  pendingApprovalsCount,
  showApprovals,
  onToggleApprovals,
}: TaskFiltersBarProps) {
  const filtersDisabled = tasks.length === 0 && !loading;
  const disabledClass = "opacity-50 pointer-events-none";

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-[32px] border border-neutral-100 shadow-sm flex-wrap">
      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        <div className={cx("relative", filtersDisabled && disabledClass)}>
          <select
            className="h-11 pl-5 pr-10 rounded-2xl bg-neutral-50/50 border border-neutral-100 text-[11px] font-bold uppercase tracking-widest text-obsidian outline-none appearance-none focus:ring-2 focus:ring-obsidian/10"
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="open">Abierta</option>
            <option value="in_progress">En progreso</option>
            <option value="completed">Completada</option>
          </select>
          <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400 rotate-90 pointer-events-none" />
        </div>

        <div className={cx("relative", filtersDisabled && disabledClass)}>
          <select
            className="h-11 pl-5 pr-10 rounded-2xl bg-neutral-50/50 border border-neutral-100 text-[11px] font-bold uppercase tracking-widest text-obsidian outline-none appearance-none focus:ring-2 focus:ring-obsidian/10 max-w-[200px]"
            value={empleadoId}
            onChange={(e) => onEmpleadoIdChange(e.target.value)}
          >
            <option value="">Todos los empleados</option>
            {empleados.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.full_name ?? emp.name ?? emp.id}
              </option>
            ))}
          </select>
          <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400 rotate-90 pointer-events-none" />
        </div>

        <div className={cx("relative", filtersDisabled && disabledClass)}>
          <input
            type="date"
            className="h-11 pl-4 pr-3 rounded-2xl bg-neutral-50/50 border border-neutral-100 text-[11px] font-bold uppercase tracking-widest text-obsidian outline-none appearance-none focus:ring-2 focus:ring-obsidian/10 cursor-pointer"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
          />
          <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400 pointer-events-none" />
        </div>

        <div className={cx("relative", filtersDisabled && disabledClass)}>
          <select
            className="h-11 pl-5 pr-10 rounded-2xl bg-neutral-50/50 border border-neutral-100 text-[11px] font-bold uppercase tracking-widest text-obsidian outline-none appearance-none focus:ring-2 focus:ring-obsidian/10"
            value={priority}
            onChange={(e) => onPriorityChange(e.target.value)}
          >
            <option value="">Todas las prioridades</option>
            <option value="urgent">Urgente</option>
            <option value="high">Alta</option>
            <option value="medium">Media</option>
            <option value="low">Baja</option>
          </select>
          <Flag className="absolute right-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400 rotate-90 pointer-events-none" />
        </div>

        <div className={cx("relative flex items-center bg-neutral-50/50 h-11 rounded-2xl border border-neutral-100 px-4 min-w-[200px] gap-2 focus-within:ring-2 focus-within:ring-obsidian/10", filtersDisabled && disabledClass)}>
          <Layers className="h-4 w-4 text-neutral-400 shrink-0" />
          <input
            type="text"
            placeholder="Sección..."
            className="bg-transparent border-none text-xs font-bold text-obsidian outline-none w-full placeholder:text-neutral-400 placeholder:uppercase placeholder:tracking-widest"
            value={section}
            onChange={(e) => onSectionChange(e.target.value)}
          />
        </div>

        <div className="relative flex items-center bg-neutral-50/50 h-11 rounded-2xl border border-neutral-100 px-4 min-w-[280px] gap-2 focus-within:ring-2 focus-within:ring-obsidian/10">
          <Search className="h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar tarea..."
            className="bg-transparent border-none text-xs font-bold text-obsidian outline-none w-full placeholder:text-neutral-400 placeholder:uppercase placeholder:tracking-widest"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {pendingApprovalsCount > 0 && (
          <button
            onClick={onToggleApprovals}
            className={cx(
              "h-11 px-4 rounded-2xl border text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 transition-colors",
              showApprovals
                ? "bg-obsidian text-white border-obsidian shadow-sm"
                : "bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100",
            )}
          >
            <CheckCircle2 className="h-4 w-4" />
            Aprobaciones ({pendingApprovalsCount})
          </button>
        )}
      </div>

      <div className="flex items-center gap-4 border-t md:border-t-0 border-neutral-100 pt-3 md:pt-0 pl-2">
        <label className="flex items-center gap-2 cursor-pointer group">
          <div
            className={cx(
              "h-5 w-5 rounded-md flex items-center justify-center transition-colors border shadow-sm",
              overdue
                ? "bg-rose-500 border-rose-500 text-white"
                : "border-neutral-200 bg-white group-hover:border-neutral-300",
            )}
          >
            {overdue && <Check className="h-3.5 w-3.5" />}
            <input
              type="checkbox"
              className="hidden"
              checked={overdue}
              onChange={(e) => onOverdueChange(e.target.checked)}
            />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 group-hover:text-obsidian transition-colors">
            Vencidas
          </span>
        </label>

        <div className="h-8 w-px bg-neutral-100 hidden md:block" />

        {totalTasks > 0 ? (
          <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
            <span className="text-obsidian">{totalTasks}</span> tareas totales
          </div>
        ) : null}
      </div>
    </div>
  );
}
