// src/components/ActionMenu.tsx
import { useState, useRef, useEffect } from "react";
import type { LucideIcon } from "lucide-react";
import { MoreVertical } from "lucide-react";
import { cx } from "@/lib/utils";

export interface ActionMenuItem {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

interface ActionMenuProps {
  actions: ActionMenuItem[];
  className?: string;
  align?: "left" | "right";
}

export default function ActionMenu({
  actions,
  className,
  align = "right",
}: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  return (
    <div className={cx("relative", className)} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-xl bg-k-bg-card border border-k-border shadow-k-card
                   flex items-center justify-center text-k-text-b
                   hover:bg-k-bg-card2 hover:text-k-text-h transition-colors"
        aria-label="Acciones"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {open && (
        <div
          className={cx(
            "absolute top-11 z-50 min-w-[180px] rounded-2xl bg-k-bg-card border border-k-border shadow-xl p-2 animate-in-up",
            align === "right" ? "right-0" : "left-0"
          )}
          role="menu"
        >
          {actions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <button
                key={idx}
                type="button"
                disabled={action.disabled}
                onClick={() => {
                  setOpen(false);
                  action.onClick();
                }}
                className={cx(
                  "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-left transition-colors min-h-[44px]",
                  action.danger
                    ? "text-rose-600 hover:bg-rose-50"
                    : "text-k-text-h hover:bg-k-bg-card2",
                  action.disabled && "opacity-40 pointer-events-none"
                )}
                role="menuitem"
              >
                {Icon && <Icon className="h-4 w-4 shrink-0" />}
                <span className="truncate">{action.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
