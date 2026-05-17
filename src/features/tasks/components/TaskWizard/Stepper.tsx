import { Check } from "lucide-react";
import { cx } from "@/lib/utils";

interface StepperProps {
  step: number;
  steps: { label: string }[];
}

export default function Stepper({ step, steps }: StepperProps) {
  return (
    <div className="flex items-center gap-2 px-8 py-5 border-b border-k-border shrink-0">
      {steps.map((s, idx) => {
        const num = idx + 1;
        const active = num === step;
        const completed = num < step;
        const isLast = idx === steps.length - 1;

        return (
          <div key={num} className="flex items-center gap-2 flex-1">
            <div className="flex items-center gap-2.5">
              <div
                className={cx(
                  "h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-black transition-all border",
                  active
                    ? "bg-k-bg-sidebar text-white border-k-bg-sidebar shadow-md"
                    : completed
                      ? "bg-emerald-500 text-white border-emerald-500"
                      : "bg-k-bg-card2 text-k-text-b border-k-border"
                )}
              >
                {completed ? <Check className="h-4 w-4" /> : num}
              </div>
              <span
                className={cx(
                  "text-[11px] font-bold uppercase tracking-widest hidden sm:block transition-colors",
                  active || completed ? "text-k-text-h" : "text-k-text-b"
                )}
              >
                {s.label}
              </span>
            </div>
            {!isLast && (
              <div className="flex-1 h-px bg-neutral-100 mx-1">
                <div
                  className={cx(
                    "h-full transition-all duration-500",
                    completed ? "bg-emerald-400 w-full" : "w-0"
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
