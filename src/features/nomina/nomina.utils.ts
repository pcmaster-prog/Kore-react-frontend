import type { PaymentType } from "./nomina.types";

export function formatTime12(time24: string): string {
  if (!time24) return "—";
  const [h, m] = time24.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function fmt(n: number | null | undefined): string {
  const val = typeof n === "number" && !isNaN(n) ? n : 0;
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(val);
}

export function fmtUnits(type: PaymentType, units: number): string {
  if (type === "hourly") {
    const h = Math.floor(units);
    const m = Math.round((units - h) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${units} día${units !== 1 ? "s" : ""}`;
}

export function getWeekNumber(dateStr?: string | null): number {
  if (!dateStr) return 0;
  const date = new Date(dateStr + "T12:00:00");
  if (isNaN(date.getTime())) return 0;
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - startOfYear.getTime();
  const oneWeek = 604800000;
  return Math.ceil(diff / oneWeek + 1);
}

export function weekLabel(start?: string | null, end?: string | null): string {
  if (!start || !end) return "Fecha no disponible";
  const s = new Date(start + "T12:00:00");
  const e = new Date(end + "T12:00:00");
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return "Fecha inválida";
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  return `${s.toLocaleDateString("es-MX", opts)} – ${e.toLocaleDateString("es-MX", opts)}`;
}

export function toLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayLocalDate(): string {
  return toLocalDate(new Date());
}
