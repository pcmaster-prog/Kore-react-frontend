import { Users, RefreshCw } from "lucide-react";
import { cx } from "@/lib/utils";
import { isEnabled } from "@/lib/featureFlags";
import type { Entry, Period, MealScheduleItem } from "../nomina.types";
import { fmt, weekLabel } from "../nomina.utils";
import EntryRow from "../EntryRow";

export type NominaTableProps = {
  period: Period;
  approved: boolean;
  mealSchedules: MealScheduleItem[];
  globalPatches: Record<string, Partial<Entry>>;
  generating: boolean;
  totalEmp: number;
  onSave: (id: string, patch: Partial<Entry>) => Promise<void>;
  onToggleExclude: (empleadoId: string, excluir: boolean) => Promise<void>;
  onPatch: (id: string, patch: Partial<Entry>) => void;
  onRecalculate: () => void;
};

export default function NominaTable({
  period,
  approved,
  mealSchedules,
  globalPatches,
  generating,
  totalEmp,
  onSave,
  onToggleExclude,
  onPatch,
  onRecalculate,
}: NominaTableProps) {
  const excludedIds = period.excluded_employee_ids ?? [];
  const visibleEntries = period.entries.filter((e) => !excludedIds.includes(e.empleado_id));

  return (
    <div className="rounded-[40px] border border-k-border bg-k-bg-card shadow-k-card overflow-hidden">
      <div className="px-8 py-6 border-b border-k-border flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-k-text-h tracking-tight">Detalle por Empleado</h2>
          <p className="text-[10px] font-bold text-k-text-b uppercase tracking-widest mt-1">
            Semana {weekLabel(period.week_start, period.week_end)}
          </p>
        </div>
        {!approved && (
          <button
            onClick={() => {
              if (
                Object.keys(globalPatches).length > 0 &&
                !confirm("Hay cambios sin guardar. ¿Recalcular nómina de todos modos y perder los cambios?")
              )
                return;
              onRecalculate();
            }}
            disabled={generating}
            title="Vuelve a calcular la nómina tomando la última información de asistencia"
            className="inline-flex items-center gap-1.5 rounded-2xl border border-k-border bg-k-bg-card px-4 py-2 text-xs font-bold text-k-text-b hover:bg-k-bg-card2 transition"
          >
            <RefreshCw className={cx("h-3.5 w-3.5", generating && "animate-spin")} />
            {isEnabled("newManagementAdmin") ? "Recalcular nómina del mes" : "Recalcular"}
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-k-bg-card2/80 border-b border-k-border">
            <tr>
              {["Empleado", "Comida", "Horas/Días", "Tarifa", "Subtotal", "Ajuste", "Total"].map(
                (h, i) => (
                  <th
                    key={i}
                    className="text-left px-5 py-4 text-[10px] font-bold text-k-text-b uppercase tracking-[0.1em]"
                  >
                    {h}
                  </th>
                )
              )}
              {!approved && (
                <th className="px-5 py-4 text-[10px] font-bold text-k-text-b uppercase tracking-[0.1em]">
                  Guardar
                </th>
              )}
              {!approved && <th className="px-5 py-4"></th>}
            </tr>
          </thead>
          <tbody>
            {period.entries.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-16 text-center">
                  <Users className="h-10 w-10 text-neutral-100 mx-auto mb-3" />
                  <p className="text-sm font-bold text-k-text-b uppercase tracking-widest">
                    Sin empleados en este periodo
                  </p>
                </td>
              </tr>
            ) : (
              visibleEntries.map((entry) => (
                <EntryRow
                  key={entry.id}
                  entry={entry}
                  period={period}
                  approved={approved}
                  mealSchedule={mealSchedules.find((ms) => ms.employee_id === entry.empleado_id)}
                  onSave={onSave}
                  onToggleExclude={onToggleExclude}
                  pendingPatch={globalPatches[entry.id]}
                  onPatch={onPatch}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-8 py-5 border-t border-k-border bg-k-bg-card2/50 flex items-center justify-between">
        <span className="text-xs font-bold text-k-text-b uppercase tracking-widest">
          {totalEmp} empleado{totalEmp !== 1 ? "s" : ""} (pagables)
        </span>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-k-text-b uppercase tracking-widest">Total semana</span>
          <span className="text-2xl font-black text-k-text-h">{fmt(period.total_amount)}</span>
        </div>
      </div>
    </div>
  );
}
