import { cx } from "@/lib/utils";

interface ChecklistProgressBarProps {
  done: number;
  total: number;
}

export default function ChecklistProgressBar({
  done,
  total,
}: ChecklistProgressBarProps) {
  if (total === 0) return null;
  const pct = Math.round((done / total) * 100);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-k-text-b">
          Progreso del checklist
        </span>
        <span className="text-[10px] font-black text-k-text-h">
          {done}/{total} ({pct}%)
        </span>
      </div>
      <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
        <div
          className={cx(
            "h-full rounded-full transition-all duration-500",
            pct === 100 ? "bg-emerald-500" : "bg-k-bg-sidebar"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
