// src/lib/utils.ts
// Utilidades comunes centralizadas para todo el proyecto

/**
 * Une clases CSS condicionalmente.
 * Uso: cx("base", isActive && "active", isOpen || null)
 */
export function cx(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(" ");
}

/**
 * Genera iniciales a partir de un nombre completo.
 * Ej: "Juan Pérez" -> "JP"
 */
export function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Paleta de colores para avatares generados.
 */
export const AVATAR_COLORS = [
  "bg-red-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-green-500",
  "bg-emerald-500",
  "bg-teal-500",
  "bg-cyan-500",
  "bg-sky-500",
  "bg-blue-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-purple-500",
  "bg-fuchsia-500",
  "bg-pink-500",
  "bg-rose-500",
];

/**
 * Devuelve un color determinista para un nombre dado.
 */
export function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

/**
 * Valida un email básico.
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Valida fortaleza básica de contraseña.
 * Requisitos: min 8 caracteres, al menos 1 letra y 1 número.
 */
export function isStrongPassword(password: string): boolean {
  return password.length >= 8 && /[a-zA-Z]/.test(password) && /\d/.test(password);
}

/**
 * Formatea bytes a unidades legibles.
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + " " + sizes[i];
}

/**
 * Reporta un error silenciosamente en producción.
 * En desarrollo loguea a consola; en producción despacha evento global.
 */
export function reportError(context: string, err?: unknown): void {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.error(`[${context}]`, err);
  }
  const message = err instanceof Error ? err.message : typeof err === "string" ? err : "Error desconocido";
  window.dispatchEvent(
    new CustomEvent("kore-error", {
      detail: { message: `${context}: ${message}`, status: 0 },
    })
  );
}

/**
 * Sanitiza un string para prevenir XSS básico en atributos HTML/texto.
 * NOTA: Para HTML complejo usar DOMPurify via SafeHTML.
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
