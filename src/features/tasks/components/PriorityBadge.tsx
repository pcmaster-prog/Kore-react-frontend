// src/features/tasks/components/PriorityBadge.tsx
import { cx } from "@/lib/utils";
import type { TaskPriority } from "@/features/tasks/types";

interface PriorityBadgeProps {
  priority: TaskPriority;
  className?: string;
}

const config: Record<TaskPriority, { label: string; bg: string; text: string; dot: string }> = {
  low: {
    label: "Baja",
    bg: "bg-gray-100",
    text: "text-gray-600",
    dot: "bg-gray-400",
  },
  medium: {
    label: "Media",
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  high: {
    label: "Alta",
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  urgent: {
    label: "Urgente",
    bg: "bg-rose-50",
    text: "text-rose-700",
    dot: "bg-rose-500",
  },
};

export default function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const c = config[priority] ?? config.low;
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide",
        c.bg,
        c.text,
        className
      )}
    >
      <span className={cx("h-1.5 w-1.5 rounded-full", c.dot)} />
      {c.label}
    </span>
  );
}
