import { Check, Play, Paperclip, Send, ClipboardList } from "lucide-react";
import { cx } from "@/lib/utils";

interface TaskProgressTrackerProps {
  status: string;
  hasEvidence: boolean;
  checklistOk: boolean;
}

export default function TaskProgressTracker({
  status,
  hasEvidence,
  checklistOk,
}: TaskProgressTrackerProps) {
  // Map status to step (1-4)
  const currentStep = (() => {
    if (status === "assigned") return 1;
    if (status === "in_progress") {
      // If ready to submit (has evidence + checklist), show step 3
      if (hasEvidence && checklistOk) return 3;
      return 2;
    }
    if (status === "done_pending" || status === "approved") return 4;
    if (status === "rejected") return 1; // Back to start
    return 1;
  })();

  const steps = [
    { num: 1, label: "Asignada", icon: ClipboardList },
    { num: 2, label: "En progreso", icon: Play },
    { num: 3, label: "Evidencia", icon: Paperclip },
    { num: 4, label: "Entregada", icon: Send },
  ];

  return (
    <div className="flex items-center gap-1 sm:gap-2 mt-4 p-3 sm:p-4 rounded-2xl bg-k-bg-card2 border border-k-border">
      {steps.map((step, idx) => {
        const isCompleted = currentStep > step.num;
        const isCurrent = currentStep === step.num;
        const isLast = idx === steps.length - 1;

        return (
          <div key={step.num} className="flex items-center gap-1 sm:gap-2 flex-1">
            <div className="flex flex-col items-center gap-1.5 flex-1">
              <div
                className={cx(
                  "h-8 w-8 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center transition-all border",
                  isCompleted
                    ? "bg-emerald-500 border-emerald-500 text-white shadow-sm"
                    : isCurrent
                      ? "bg-k-bg-sidebar border-k-bg-sidebar text-white shadow-md"
                      : "bg-k-bg-card border-k-border text-neutral-300"
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <step.icon className="h-4 w-4" />
                )}
              </div>
              <span
                className={cx(
                  "text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-center leading-tight",
                  isCompleted
                    ? "text-emerald-600"
                    : isCurrent
                      ? "text-k-text-h"
                      : "text-neutral-300"
                )}
              >
                {step.label}
              </span>
            </div>

            {!isLast && (
              <div className="w-4 sm:w-6 h-px bg-neutral-100 relative">
                <div
                  className={cx(
                    "absolute inset-y-0 left-0 transition-all duration-500",
                    isCompleted ? "bg-emerald-400 w-full" : "w-0"
                  )}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
