// src/features/tasks/components/Breadcrumbs.tsx
// ─── Breadcrumbs específico para navegación Área > Sección ──────────────────

import { cx } from "@/lib/utils";
import type { Area, Section } from "@/features/tasks/types";
import { ChevronRight, MapPin } from "lucide-react";

interface TaskBreadcrumbsProps {
  area?: Area | null;
  section?: Section | null;
  taskName?: string | null;
  onAreaClick?: () => void;
  onSectionClick?: () => void;
  className?: string;
}

export default function TaskBreadcrumbs({
  area,
  section,
  taskName,
  onAreaClick,
  onSectionClick,
  className,
}: TaskBreadcrumbsProps) {
  if (!area) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cx("flex items-center gap-1.5 text-sm", className)}
    >
      <MapPin className="h-3.5 w-3.5 text-k-text-b shrink-0" />

      <button
        type="button"
        onClick={onAreaClick}
        disabled={!onAreaClick}
        className={cx(
          "font-semibold transition-colors",
          onAreaClick ? "text-k-text-h hover:text-k-accent-btn cursor-pointer" : "text-k-text-h cursor-default"
        )}
      >
        {area.name}
      </button>

      {section && (
        <>
          <ChevronRight className="h-3.5 w-3.5 text-neutral-300 shrink-0" />
          <button
            type="button"
            onClick={onSectionClick}
            disabled={!onSectionClick}
            className={cx(
              "font-medium transition-colors",
              onSectionClick ? "text-k-text-b hover:text-k-text-h cursor-pointer" : "text-k-text-b cursor-default"
            )}
          >
            {section.name}
          </button>
        </>
      )}

      {taskName && (
        <>
          <ChevronRight className="h-3.5 w-3.5 text-neutral-300 shrink-0" />
          <span className="font-bold text-k-text-h truncate max-w-[200px]">{taskName}</span>
        </>
      )}
    </nav>
  );
}
