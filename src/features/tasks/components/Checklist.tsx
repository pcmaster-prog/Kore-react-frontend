// src/features/tasks/components/Checklist.tsx
import { useMemo } from "react";
import { cx } from "@/lib/utils";
import type { ChecklistItem } from "@/features/tasks/types";
import ChecklistProgressBar from "./ChecklistProgressBar";
import { Check } from "lucide-react";

interface ChecklistProps {
  items: ChecklistItem[];
  onToggle: (id: string, done: boolean) => void;
  readOnly?: boolean;
  className?: string;
}

export default function Checklist({ items, onToggle, readOnly = false, className }: ChecklistProps) {
  const doneCount = useMemo(() => items.filter((i) => i.done).length, [items]);

  return (
    <div className={cx("space-y-3", className)}>
      <ChecklistProgressBar done={doneCount} total={items.length} />

      <div className="space-y-1.5">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={readOnly}
            onClick={() => onToggle(item.id, !item.done)}
            className={cx(
              "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200",
              item.done
                ? "bg-emerald-50/60 text-emerald-800"
                : "bg-k-bg-card2 text-k-text-h hover:bg-k-bg-card",
              !readOnly && "cursor-pointer",
              readOnly && "cursor-default opacity-80"
            )}
          >
            <span
              className={cx(
                "shrink-0 h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all duration-200",
                item.done
                  ? "bg-emerald-500 border-emerald-500"
                  : "border-neutral-300 bg-white"
              )}
            >
              {item.done && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
            </span>
            <span
              className={cx(
                "text-sm font-medium leading-snug",
                item.done && "line-through opacity-60"
              )}
            >
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
