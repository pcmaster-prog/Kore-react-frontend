import { cx } from "@/lib/utils";

interface StatusPillProps {
  status: string;
  size?: "sm" | "md";
}

const MAP: Record<string, { label: string; cls: string; dot: string }> = {
  open: {
    label: "Abierta",
    cls: "bg-blue-50 text-blue-700 border-blue-100",
    dot: "bg-blue-400",
  },
  in_progress: {
    label: "En progreso",
    cls: "bg-amber-50 text-amber-700 border-amber-100",
    dot: "bg-amber-400",
  },
  completed: {
    label: "Completada",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-100",
    dot: "bg-emerald-400",
  },
  assigned: {
    label: "Asignada",
    cls: "bg-neutral-50 text-neutral-600 border-neutral-100",
    dot: "bg-neutral-400",
  },
  done_pending: {
    label: "En revisión",
    cls: "bg-indigo-50 text-indigo-700 border-indigo-100",
    dot: "bg-indigo-400",
  },
  approved: {
    label: "Aprobada",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-100",
    dot: "bg-emerald-400",
  },
  rejected: {
    label: "Rechazada",
    cls: "bg-rose-50 text-rose-700 border-rose-100",
    dot: "bg-rose-400",
  },
};

export default function StatusPill({ status, size = "sm" }: StatusPillProps) {
  const x = MAP[status] ?? {
    label: status,
    cls: "bg-neutral-50 text-neutral-600 border-neutral-100",
    dot: "bg-neutral-300",
  };

  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border font-bold uppercase tracking-wider",
        size === "md" ? "px-2.5 py-1 text-xs" : "px-2.5 py-1 text-[10px]",
        x.cls,
      )}
    >
      <span className={cx("h-1.5 w-1.5 rounded-full", x.dot)} />
      {x.label}
    </span>
  );
}
