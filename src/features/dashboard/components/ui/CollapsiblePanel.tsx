import { cx } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";

export interface CollapsiblePanelProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  openClassName?: string;
  closedClassName?: string;
}

export default function CollapsiblePanel({
  title,
  subtitle,
  children,
  headerRight,
  isOpen,
  onToggle,
  openClassName = "rounded-[32px] lg:rounded-[40px] p-6 lg:p-8",
  closedClassName = "rounded-[24px] p-4 lg:px-8 lg:py-6",
}: CollapsiblePanelProps) {
  return (
    <div
      className={cx(
        "bg-k-bg-card shadow-k-card border border-k-border flex flex-col transition-all overflow-hidden",
        isOpen ? openClassName : closedClassName
      )}
    >
      <div
        className={cx(
          "flex items-center justify-between",
          isOpen ? "mb-4" : ""
        )}
      >
        <div
          className="flex-1 cursor-pointer flex items-center gap-3"
          onClick={onToggle}
        >
          <div>
            <h2 className="text-lg lg:text-xl font-black text-k-text-h tracking-tight">
              {title}
            </h2>
            {isOpen && subtitle && (
              <p className="text-xs text-k-text-b mt-0.5">{subtitle}</p>
            )}
          </div>
          {isOpen ? (
            <ChevronUp className="h-5 w-5 text-k-text-b" />
          ) : (
            <ChevronDown className="h-5 w-5 text-k-text-b" />
          )}
        </div>
        <div className="flex items-center gap-2">{headerRight}</div>
      </div>
      {isOpen && children}
    </div>
  );
}
