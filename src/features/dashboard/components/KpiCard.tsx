import { cx } from "@/lib/utils";

export interface KpiCardProps {
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
  compact?: boolean;
}

const COLORS: Record<string, string> = {
  amber: "bg-amber-50 text-amber-600",
  blue: "bg-blue-50 text-blue-600",
  emerald: "bg-emerald-50 text-emerald-600",
  rose: "bg-rose-50 text-rose-600",
};

export default function KpiCard({
  label,
  value,
  color,
  icon,
  compact = false,
}: KpiCardProps) {
  if (compact) {
    return (
      <div className="bg-k-bg-card rounded-[24px] p-4 shadow-k-card border border-k-border flex flex-col justify-center">
        <div className="flex items-center gap-3">
          <div
            className={cx(
              "h-10 w-10 rounded-[14px] flex items-center justify-center shrink-0",
              COLORS[color]
            )}
          >
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-2xl font-black text-k-text-h leading-none">
              {value}
            </div>
            <div className="text-[10px] font-bold text-k-text-b uppercase tracking-[0.1em] truncate mt-1">
              {label}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-k-bg-card rounded-[28px] p-6 shadow-k-card border border-k-border">
      <div
        className={cx(
          "h-10 w-10 rounded-xl flex items-center justify-center mb-4",
          COLORS[color]
        )}
      >
        {icon}
      </div>
      <div className="text-2xl font-black text-k-text-h">{value}</div>
      <div className="text-[11px] font-bold text-k-text-b uppercase tracking-wide mt-1">
        {label}
      </div>
    </div>
  );
}
