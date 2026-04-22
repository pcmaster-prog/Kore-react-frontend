// src/components/KpiCard.tsx
import {
  ArrowUpRight,
  ArrowDownRight,
  type LucideIcon,
} from "lucide-react";

type KpiColor = "blue" | "yellow" | "red" | "green" | "purple";

interface KpiCardProps {
  label: string;
  value: number;
  icon?: LucideIcon;
  color?: KpiColor;
  hideIfZero?: boolean;
  forceShow?: boolean;
  trend?: { value: number; direction: "up" | "down" };
  sub?: string;
}

const colorTokens: Record<
  KpiColor,
  { bg: string; text: string; border: string; iconBg: string }
> = {
  blue: {
    bg: "bg-blue-50/50",
    text: "text-blue-700",
    border: "border-blue-100",
    iconBg: "bg-blue-50 text-blue-600",
  },
  yellow: {
    bg: "bg-amber-50/50",
    text: "text-amber-700",
    border: "border-amber-100",
    iconBg: "bg-amber-50 text-amber-600",
  },
  red: {
    bg: "bg-rose-50/50",
    text: "text-rose-700",
    border: "border-rose-100",
    iconBg: "bg-rose-50 text-rose-600",
  },
  green: {
    bg: "bg-emerald-50/50",
    text: "text-emerald-700",
    border: "border-emerald-100",
    iconBg: "bg-emerald-50 text-emerald-600",
  },
  purple: {
    bg: "bg-purple-50/50",
    text: "text-purple-700",
    border: "border-purple-100",
    iconBg: "bg-purple-50 text-purple-600",
  },
};

export default function KpiCard({
  label,
  value,
  icon: Icon,
  color = "blue",
  hideIfZero = true,
  forceShow = false,
  trend,
  sub,
}: KpiCardProps) {
  // Hide when value is 0 and not forced to show
  if (hideIfZero && value === 0 && !forceShow) {
    return null;
  }

  const tokens = colorTokens[color];

  return (
    <div
      className={`
        rounded-[28px] border p-5 shadow-sm transition-all duration-300
        hover:shadow-md group
        ${tokens.bg} ${tokens.border}
      `}
    >
      <div className="flex items-start justify-between mb-3">
        {Icon && (
          <div
            className={`h-10 w-10 rounded-xl flex items-center justify-center
                        transition-transform duration-300 group-hover:scale-110
                        ${tokens.iconBg}`}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
        {trend && (
          <div
            className={`
              flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold
              ${
                trend.direction === "up"
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-rose-50 text-rose-600"
              }
            `}
          >
            {trend.direction === "up" ? (
              <ArrowUpRight className="h-2.5 w-2.5" />
            ) : (
              <ArrowDownRight className="h-2.5 w-2.5" />
            )}
            {trend.direction === "up" ? "+" : ""}
            {trend.value}%
          </div>
        )}
      </div>

      <div>
        <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.15em] mb-0.5">
          {label}
        </div>
        <div className={`text-2xl font-black tracking-tighter ${tokens.text}`}>
          {value}
        </div>
        {sub && (
          <div className="text-[10px] font-medium text-neutral-400 mt-0.5">
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}
