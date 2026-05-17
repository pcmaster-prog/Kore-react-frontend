import {
  Calendar,
  Clock,
  Users,
  Layers,
  RefreshCw,
  ClipboardList,
  AlertTriangle,
} from "lucide-react";
import type { AssignMode } from "./StepWhat";
import type { CatalogResponse } from "../../api";
import type { Routine } from "../../routinesApi";
import type { EmployeeWorkload } from "@/features/dashboard/types";

type CatalogApiItem = CatalogResponse["catalog"][number];

interface StepSummaryProps {
  mode: AssignMode;
  date: string;

  // Ad-hoc
  newTitle: string;
  newDesc: string;
  newPriority: string;
  newEstMin: string;

  // Catalog
  catalog: CatalogApiItem[];
  selectedTemplateIds: string[];

  // Routine
  routines: Routine[];
  routineId: string;

  // Employees
  selectedEmpleadoIds: string[];
  employees: EmployeeWorkload[];

  // Errors
  err: string | null;
}

function PriorityBadge({ p }: { p?: string }) {
  const label = (p ?? "-").toLowerCase();
  const cls =
    label === "urgent" || label === "high"
      ? "bg-k-badge-a-bg text-k-badge-a-c border-k-border"
      : label === "low"
        ? "bg-k-badge-b-bg text-k-badge-b-c border-k-border"
        : "bg-k-bg-card2 text-neutral-700 border-k-border";
  return (
    <span
      className={`inline-flex items-center rounded-[8px] border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${cls}`}
    >
      {p ?? "-"}
    </span>
  );
}

export default function StepSummary({
  mode,
  date,
  newTitle,
  newDesc,
  newPriority,
  newEstMin,
  catalog,
  selectedTemplateIds,
  routines,
  routineId,
  selectedEmpleadoIds,
  employees,
  err,
}: StepSummaryProps) {
  const selectedEmps = employees.filter((e) =>
    selectedEmpleadoIds.includes(e.empleado_id)
  );

  const selectedCatalogItems = catalog.filter((it) =>
    selectedTemplateIds.includes(it.template.id)
  );

  const selectedRoutine = routines.find((r) => r.id === routineId);

  const totalEstMinutes = (() => {
    if (mode === "adhoc") {
      const m = Number(newEstMin) || 0;
      return m * selectedEmpleadoIds.length;
    }
    if (mode === "catalog") {
      return selectedCatalogItems.reduce((sum, it) => {
        const m =
          (it.template as any).estimated_minutes ??
          it.template.meta?.estimated_minutes ??
          0;
        return sum + m * selectedEmpleadoIds.length;
      }, 0);
    }
    // routine: no sabemos los minutos de cada template sin fetch adicional
    return 0;
  })();

  return (
    <div className="space-y-6 animate-in-fade">
      {err && (
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-sm text-rose-700 animate-in-shake flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          {err}
        </div>
      )}

      {/* What card */}
      <div className="p-5 bg-k-bg-card border border-k-border rounded-3xl shadow-k-card space-y-4">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-k-text-b">
          {mode === "adhoc" && <ClipboardList className="h-3.5 w-3.5" />}
          {mode === "catalog" && <Layers className="h-3.5 w-3.5" />}
          {mode === "routine" && <RefreshCw className="h-3.5 w-3.5" />}
          {mode === "adhoc"
            ? "Tarea Rápida"
            : mode === "catalog"
              ? "Del Catálogo"
              : "Rutina Completa"}
        </div>

        {mode === "adhoc" && (
          <div className="space-y-2">
            <p className="text-sm font-black text-k-text-h">{newTitle}</p>
            {newDesc && (
              <p className="text-xs text-k-text-b line-clamp-2">{newDesc}</p>
            )}
            <div className="flex items-center gap-2">
              <PriorityBadge p={newPriority} />
              {newEstMin && (
                <span className="text-[10px] font-bold text-k-text-b flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {newEstMin}m
                </span>
              )}
            </div>
          </div>
        )}

        {mode === "catalog" && (
          <div className="space-y-2">
            <p className="text-sm font-black text-k-text-h">
              {selectedCatalogItems.length} plantilla
              {selectedCatalogItems.length !== 1 ? "s" : ""} seleccionada
              {selectedCatalogItems.length !== 1 ? "s" : ""}
            </p>
            <div className="space-y-1.5 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
              {selectedCatalogItems.map((it) => (
                <div
                  key={it.template.id}
                  className="flex items-center justify-between text-xs py-1.5 px-2 rounded-xl bg-k-bg-card2 border border-k-border"
                >
                  <span className="font-bold text-k-text-h truncate">
                    {it.template.title}
                  </span>
                  <PriorityBadge p={it.template.priority} />
                </div>
              ))}
            </div>
          </div>
        )}

        {mode === "routine" && selectedRoutine && (
          <div className="space-y-2">
            <p className="text-sm font-black text-k-text-h">
              {selectedRoutine.name}
            </p>
            {selectedRoutine.description && (
              <p className="text-xs text-k-text-b">
                {selectedRoutine.description}
              </p>
            )}
            <p className="text-[10px] font-bold text-k-text-b uppercase tracking-widest capitalize">
              Recurrencia: {selectedRoutine.recurrence}
            </p>
          </div>
        )}

        <div className="flex items-center gap-2 text-[10px] font-bold text-k-text-b uppercase tracking-widest pt-2 border-t border-k-border">
          <Calendar className="h-3 w-3" />
          {date}
        </div>
      </div>

      {/* Who card */}
      <div className="p-5 bg-k-bg-card border border-k-border rounded-3xl shadow-k-card space-y-4">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-k-text-b">
          <Users className="h-3.5 w-3.5" />
          {selectedEmps.length} empleado{selectedEmps.length !== 1 ? "s" : ""}{" "}
          seleccionado{selectedEmps.length !== 1 ? "s" : ""}
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedEmps.map((emp) => (
            <div
              key={emp.empleado_id}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-k-border bg-k-bg-card2 text-xs font-bold text-k-text-h"
            >
              <div className="h-5 w-5 rounded-md bg-k-bg-sidebar text-white flex items-center justify-center text-[9px] font-black">
                {emp.full_name.substring(0, 2).toUpperCase()}
              </div>
              {emp.full_name}
            </div>
          ))}
        </div>
      </div>

      {/* Total estimate */}
      {totalEstMinutes > 0 && (
        <div className="rounded-2xl bg-k-badge-p-bg border border-k-border p-4 flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-k-bg-card flex items-center justify-center text-k-badge-p-c shadow-k-card shrink-0">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-k-badge-p-c uppercase tracking-widest">
              Carga Total Estimada
            </p>
            <p className="text-xs font-medium text-k-text-h mt-0.5">
              {totalEstMinutes} minutos en total
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
