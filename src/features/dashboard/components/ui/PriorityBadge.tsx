import { cx } from "@/lib/utils";
import { PRIORITY_COLORS, PRIORITY_LABELS } from "../../constants";

export interface PriorityBadgeProps {
  priority: string;
}

export default function PriorityBadge({ priority }: PriorityBadgeProps) {
  return (
    <span
      className={cx(
        "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
        PRIORITY_COLORS[priority] ?? PRIORITY_COLORS.medium
      )}
    >
      {PRIORITY_LABELS[priority] || priority}
    </span>
  );
}
