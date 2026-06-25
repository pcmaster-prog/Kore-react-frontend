import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cx } from "@/lib/utils";

interface CollapsibleCardProps {
  title: string;
  icon?: React.ReactNode;
  value?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function CollapsibleCard({
  title,
  icon,
  value,
  children,
  defaultOpen = false,
}: CollapsibleCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-[24px] border border-k-border bg-k-bg-card shadow-k-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-k-bg-card2/60 transition"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3 min-w-0">
          {icon && (
            <div className="h-10 w-10 rounded-2xl bg-obsidian/5 flex items-center justify-center shrink-0">
              {icon}
            </div>
          )}
          <div className="text-left min-w-0">
            <div className="text-sm font-black text-k-text-h tracking-tight truncate">{title}</div>
            {value && (
              <div className="text-[11px] font-bold text-emerald-600 mt-0.5 truncate">{value}</div>
            )}
          </div>
        </div>
        <ChevronDown
          className={cx(
            "h-5 w-5 text-k-text-b shrink-0 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="border-t border-k-border px-5 pb-5 pt-2">
          {children}
        </div>
      )}
    </div>
  );
}
