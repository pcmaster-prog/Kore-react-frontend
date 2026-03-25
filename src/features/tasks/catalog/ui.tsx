// src/features/tasks/catalog/ui.tsx
import React from "react";

export function Pill({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">{children}</span>;
}

export function Badge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center rounded-md bg-black/5 px-2 py-1 text-xs">{children}</span>;
}

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-obsidian/40 backdrop-blur-sm transition-opacity" 
        onClick={(e) => { e.preventDefault(); onClose(); }} 
      />
      <div className="relative w-full max-w-2xl rounded-[32px] bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in-fade animate-in-slide-up">
        <div className="flex items-center justify-between border-b border-neutral-100 bg-neutral-50/50 px-8 py-5 shrink-0">
          <h3 className="text-xl font-black text-obsidian tracking-tight">{title}</h3>
          <button 
            type="button"
            className="h-10 w-10 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-neutral-400 hover:text-obsidian hover:bg-neutral-50 hover:border-neutral-300 transition-colors shadow-sm" 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar text-neutral-600">
          {children}
        </div>
        {footer ? <div className="border-t border-neutral-100 bg-neutral-50/50 px-8 py-5 shrink-0">{footer}</div> : null}
      </div>
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "w-full rounded-xl border px-3 py-2 text-sm outline-none",
        "focus:ring-2 focus:ring-black/10",
        props.className ?? "",
      ].join(" ")}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={[
        "w-full rounded-xl border px-3 py-2 text-sm outline-none",
        "focus:ring-2 focus:ring-black/10",
        props.className ?? "",
      ].join(" ")}
    />
  );
}

export function Button({
  variant = "primary",
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" }) {
  const base = "inline-flex items-center justify-center rounded-2xl px-5 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all shadow-sm";
  const styles =
    variant === "primary"
      ? "bg-obsidian text-white hover:bg-gold hover:text-obsidian shadow-obsidian/20"
      : variant === "danger"
      ? "bg-rose-600 text-white hover:bg-rose-700 shadow-rose-600/20"
      : "border border-neutral-200 bg-white text-neutral-500 hover:text-obsidian hover:bg-neutral-50 hover:border-neutral-300";
  return <button type={type} {...props} className={[base, styles, props.className ?? ""].join(" ")} />;
}

export function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={[
        "relative inline-flex h-6 w-11 items-center rounded-full border transition",
        checked ? "bg-black" : "bg-white",
      ].join(" ")}
    >
      <span
        className={[
          "inline-block h-5 w-5 rounded-full bg-white shadow transition",
          checked ? "translate-x-5" : "translate-x-1",
        ].join(" ")}
      />
    </button>
  );
}

export function formatWeekdays(d?: number[] | null) {
  if (!d || d.length === 0) return "-";
  const map = ["D", "L", "M", "X", "J", "V", "S"]; // 0..6
  return d.map((n) => map[n] ?? "?").join(" ");
}

export function toDateInputValue(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function toDatetimeLocalValue(iso?: string | null) {
  if (!iso) return "";
  const dt = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}
