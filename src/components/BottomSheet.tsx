import { useEffect } from "react";
import { X } from "lucide-react";
import { cx } from "@/lib/utils";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-obsidian/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute bottom-0 left-0 right-0 rounded-t-[28px] bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.15)] pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h3 className="text-base font-black text-k-text-h tracking-tight">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 hover:bg-neutral-200 transition"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 pb-8">
          {children}
        </div>
      </div>
    </div>
  );
}

export function BottomSheetOption({
  icon,
  label,
  sublabel,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "w-full flex items-center gap-4 rounded-2xl border px-4 py-4 text-left transition",
        danger
          ? "border-rose-100 bg-rose-50 hover:bg-rose-100"
          : "border-k-border bg-k-bg-card hover:bg-k-bg-card2"
      )}
    >
      <div className={cx(
        "h-11 w-11 rounded-2xl flex items-center justify-center shrink-0",
        danger ? "bg-rose-100 text-rose-600" : "bg-neutral-100 text-k-text-h"
      )}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className={cx("text-sm font-black tracking-tight", danger ? "text-rose-700" : "text-k-text-h")}>
          {label}
        </div>
        {sublabel && <div className="text-[11px] font-medium text-k-text-b mt-0.5">{sublabel}</div>}
      </div>
    </button>
  );
}
