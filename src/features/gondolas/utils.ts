// src/features/gondolas/utils.ts

export const UNIDADES: Record<string, string> = {
  pz: "pz",
  kg: "kg",
  caja: "caja",
  media_caja: "media caja",
};

export const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pendiente: {
    label: "Pendiente",
    color: "bg-amber-100 text-amber-700 border-amber-200",
  },
  en_proceso: {
    label: "En proceso",
    color: "bg-indigo-100 text-indigo-700 border-indigo-200",
  },
  completado: {
    label: "Completado",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  aprobado: {
    label: "Aprobado",
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  rechazado: {
    label: "Rechazado",
    color: "bg-rose-100 text-rose-700 border-rose-200",
  },
};

export function tiempoRelativo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "hace un momento";
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "ayer";
  return `hace ${days} días`;
}
