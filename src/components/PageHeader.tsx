// src/components/PageHeader.tsx
import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  badge?: { text: string; variant: "success" | "warning" | "info" | "danger" };
  compact?: boolean;
}

const badgeStyles: Record<string, string> = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
  danger: "bg-rose-50 text-rose-700 border-rose-200",
};

export default function PageHeader({
  title,
  subtitle,
  actions,
  badge,
  compact = false,
}: PageHeaderProps) {
  const [mobileActionsOpen, setMobileActionsOpen] = useState(false);

  return (
    <div
      className={`
        flex flex-col sm:flex-row sm:items-center justify-between gap-3
        ${compact ? "py-3" : "py-5"}
      `}
      style={{ maxHeight: compact ? 60 : undefined }}
    >
      {/* Left: Title + badge */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3 flex-wrap">
          <h1
            className={`
              font-black text-k-text-h tracking-tight leading-tight break-words
              ${compact ? "text-xl" : "text-2xl lg:text-3xl"}
            `}
          >
            {title}
          </h1>
          {badge && (
            <span
              className={`
                inline-flex items-center rounded-full border px-3 py-1
                text-xs font-bold uppercase tracking-wider
                ${badgeStyles[badge.variant] ?? badgeStyles.info}
              `}
            >
              {badge.text}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-sm font-medium text-k-text-b mt-1 truncate">
            {subtitle}
          </p>
        )}
      </div>

      {/* Right: Actions */}
      {actions && (
        <>
          {/* Desktop: inline */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            {actions}
          </div>

          {/* Mobile: dropdown */}
          <div className="lg:hidden relative">
            <button
              onClick={() => setMobileActionsOpen(!mobileActionsOpen)}
              className="h-10 px-4 rounded-xl bg-k-bg-card border border-k-border shadow-k-card
                         flex items-center gap-2 text-sm font-bold text-k-text-h
                         hover:bg-k-bg-card2 transition-colors"
            >
              Acciones
              <ChevronDown
                className={`h-4 w-4 text-k-text-b transition-transform duration-200 ${
                  mobileActionsOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {mobileActionsOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMobileActionsOpen(false)}
                />
                {/* Dropdown */}
                <div className="absolute right-0 top-12 z-50 min-w-[200px] rounded-2xl bg-k-bg-card border border-k-border shadow-xl p-3 space-y-2 animate-in-up">
                  {actions}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
