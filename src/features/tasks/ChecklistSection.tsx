import { Check } from "lucide-react";
import { cx } from "@/lib/utils";
import type { EvChecklist } from "./tasks.types";

interface ChecklistSectionProps {
  checklist: EvChecklist;
}

export default function ChecklistSection({ checklist }: ChecklistSectionProps) {
  if (!checklist.state || Object.keys(checklist.state).length === 0) {
    return null;
  }

  return (
    <div className="mt-8 pt-8 border-t border-neutral-50">
      <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-4">
        Checklist del Empleado
      </h4>
      <div className="space-y-3">
        {Object.entries(checklist.state).map(([itemId, val]) => {
          const defItem = checklist.def?.find((d) => d.id === itemId);
          const label = defItem?.label ?? itemId;
          const required = defItem?.required ?? false;

          return (
            <div
              key={itemId}
              className={cx(
                "flex items-center gap-4 rounded-2xl border p-4 transition-all",
                val.done
                  ? "bg-emerald-50/50 border-emerald-100"
                  : "bg-neutral-50/50 border-neutral-100",
              )}
            >
              <div
                className={cx(
                  "h-6 w-6 rounded-lg flex items-center justify-center shrink-0",
                  val.done
                    ? "bg-emerald-500 text-white"
                    : "bg-neutral-200 text-neutral-400 shadow-inner",
                )}
              >
                <Check className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-obsidian truncate">
                  {label}
                  {required && (
                    <span className="ml-2 text-[8px] px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-500 border border-rose-100 uppercase tracking-wider">
                      Required
                    </span>
                  )}
                </div>
                {val.at && (
                  <div className="text-[10px] text-neutral-400 mt-0.5">
                    Completado el {new Date(val.at).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
