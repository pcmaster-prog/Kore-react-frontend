export const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-rose-100 text-rose-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-neutral-100 text-k-text-b",
};

export const PRIORITY_LABELS: Record<string, string> = {
  urgent: "Urgente",
  high: "Alta",
  medium: "Media",
  low: "Baja",
};

export const STATUS_LABELS: Record<string, string> = {
  open: "Por Asignar",
  in_progress: "En Proceso",
  completed: "Completada",
  overdue: "Vencida",
};

export const WORKLOAD_BADGE: Record<string, string> = {
  bajo: "bg-emerald-50 border-emerald-200 text-emerald-700",
  medio: "bg-amber-50 border-amber-200 text-amber-700",
  alto: "bg-rose-50 border-rose-200 text-rose-700",
};
