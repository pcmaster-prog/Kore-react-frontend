import { Clock, AlertTriangle } from "lucide-react";
import EmployeeWorkloadPicker from "../EmployeeWorkloadPicker";
import type { EmployeeWorkload } from "@/features/dashboard/types";

interface StepWhoProps {
  employees: EmployeeWorkload[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
  totalTaskMinutes: number;
}

export default function StepWho({
  employees,
  selectedIds,
  onToggle,
  onSelectAll,
  onClear,
  totalTaskMinutes,
}: StepWhoProps) {
  const totalMinutes =
    selectedIds.length > 0 && totalTaskMinutes > 0
      ? totalTaskMinutes * selectedIds.length
      : 0;

  return (
    <div className="flex flex-col h-full animate-in-fade">
      {employees.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 gap-3">
          <div className="h-12 w-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </div>
          <p className="text-sm font-bold text-k-text-h">
            Cargando empleados...
          </p>
          <p className="text-xs text-k-text-b">
            Si esto persiste, verifica tu conexión.
          </p>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-hidden">
            <EmployeeWorkloadPicker
              employees={employees}
              selectedIds={selectedIds}
              onToggle={onToggle}
              onSelectAll={onSelectAll}
              onClear={onClear}
            />
          </div>

          {totalMinutes > 0 && (
            <div className="mt-4 rounded-2xl bg-k-badge-p-bg border border-k-border p-4 animate-in-fade flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-k-bg-card flex items-center justify-center text-k-badge-p-c shadow-k-card shrink-0">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-k-badge-p-c uppercase tracking-widest">
                  Carga Estimada Total
                </p>
                <p className="text-xs font-medium text-k-text-h mt-0.5">
                  {totalMinutes} min en total ({totalTaskMinutes}m ×{" "}
                  {selectedIds.length} persona
                  {selectedIds.length !== 1 ? "s" : ""})
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
