// src/components/EmptyState.tsx
import {
  PartyPopper,
  Inbox,
  PlusCircle,
  type LucideIcon,
} from "lucide-react";

type Variant = "celebration" | "neutral" | "action";

interface EmptyStateProps {
  level?: 1 | 2 | 3;
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void; variant?: string };
  variant?: Variant;
  className?: string;
}

const variantConfig: Record<
  Variant,
  { defaultIcon: LucideIcon; iconBg: string; iconColor: string; btnClass: string }
> = {
  celebration: {
    defaultIcon: PartyPopper,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-500",
    btnClass:
      "bg-amber-500 text-white hover:bg-amber-600 shadow-amber-200/50",
  },
  neutral: {
    defaultIcon: Inbox,
    iconBg: "bg-neutral-100",
    iconColor: "text-neutral-400",
    btnClass:
      "bg-neutral-800 text-white hover:bg-neutral-700 shadow-neutral-300/30",
  },
  action: {
    defaultIcon: PlusCircle,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-500",
    btnClass:
      "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200/50",
  },
};

export default function EmptyState({
  level = 1,
  icon,
  title,
  description,
  action,
  variant = "neutral",
  className = "",
}: EmptyStateProps) {
  const conf = variantConfig[variant];
  const IconComponent = icon ?? conf.defaultIcon;

  // Nivel 1: 64px icon · Nivel 2: 120px · Nivel 3: 200px
  const iconSize = level === 1 ? 64 : level === 2 ? 120 : 200;
  const innerSize = level === 1 ? "h-8 w-8" : level === 2 ? "h-14 w-14" : "h-24 w-24";

  return (
    <div
      className={`flex flex-col items-center justify-center text-center py-12 px-6 ${className}`}
    >
      {/* Icon container */}
      <div
        className={`rounded-3xl flex items-center justify-center mb-5 ${conf.iconBg}`}
        style={{ width: iconSize, height: iconSize }}
      >
        <IconComponent className={`${innerSize} ${conf.iconColor}`} />
      </div>

      {/* Title */}
      <h3 className="text-lg font-black text-obsidian tracking-tight mb-1">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-sm font-medium text-neutral-400 max-w-xs leading-relaxed">
          {description}
        </p>
      )}

      {/* CTA button */}
      {action && (
        <button
          onClick={action.onClick}
          className={`
            mt-6 h-11 px-6 rounded-xl text-sm font-bold
            shadow-md transition-all duration-200 hover:shadow-lg
            active:scale-[0.97]
            ${conf.btnClass}
          `}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
