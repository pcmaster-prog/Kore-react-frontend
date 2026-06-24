// src/components/ThemeModeToggle.tsx
import { Monitor, Sun, Moon } from "lucide-react";
import { cx } from "@/lib/utils";
import { type ThemeMode, useThemeMode } from "@/hooks/useThemeMode";

const MODES: { value: ThemeMode; label: string; icon: typeof Monitor }[] = [
  { value: "system", label: "Sistema", icon: Monitor },
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Oscuro", icon: Moon },
];

interface ThemeModeToggleProps {
  value?: ThemeMode;
  onChange?: (mode: ThemeMode) => void;
  className?: string;
}

export default function ThemeModeToggle({
  value,
  onChange,
  className,
}: ThemeModeToggleProps) {
  const { mode: contextMode, setMode: contextSetMode } = useThemeMode();
  const active = value ?? contextMode;
  const setActive = onChange ?? contextSetMode;

  return (
    <div
      className={cx(
        "inline-flex items-center p-1 bg-k-bg-card2 border border-k-border rounded-2xl",
        className
      )}
    >
      {MODES.map(({ value: m, label, icon: Icon }) => {
        const isActive = active === m;
        return (
          <button
            key={m}
            type="button"
            onClick={() => setActive(m)}
            className={cx(
              "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all min-h-[36px]",
              isActive
                ? "bg-k-bg-card text-k-text-h shadow-sm"
                : "text-k-text-b hover:text-k-text-h"
            )}
            aria-pressed={isActive}
            title={label}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
