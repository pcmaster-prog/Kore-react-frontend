// src/lib/date.ts

const formatter = new Intl.RelativeTimeFormat("es", { numeric: "auto" });

export function timeAgo(input?: string | Date | number | null): string {
  if (!input) return "";
  const date = input instanceof Date ? input : new Date(input);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (Number.isNaN(seconds)) return "";

  const intervals: { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
    { unit: "year", seconds: 31536000 },
    { unit: "month", seconds: 2592000 },
    { unit: "week", seconds: 604800 },
    { unit: "day", seconds: 86400 },
    { unit: "hour", seconds: 3600 },
    { unit: "minute", seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return formatter.format(-count, interval.unit);
    }
  }

  return "hace un momento";
}

export function formatDateLong(date?: string | Date | number | null): string {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

export function formatDateShort(date?: string | Date | number | null): string {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(d);
}
