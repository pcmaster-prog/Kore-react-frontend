import { Check } from "lucide-react";
import { cx } from "@/lib/utils";
import type { ModuloDisponible } from "../types";

type Props = {
  modulosDisponibles: ModuloDisponible[];
  selectedSlugs: string[];
  onChange: (slugs: string[]) => void;
  disabled?: boolean;
};

export function ModulosSelector({ modulosDisponibles, selectedSlugs, onChange, disabled }: Props) {
  if (modulosDisponibles.length === 0) {
    return <div className="text-sm text-k-text-b py-4">No hay módulos disponibles.</div>;
  }

  return (
    <div className="space-y-3">
      {modulosDisponibles.map((modulo) => {
        const isSelected = selectedSlugs.includes(modulo.slug);
        return (
          <label
            key={modulo.slug}
            onClick={() => {
              if (disabled) return;
              if (isSelected) {
                onChange(selectedSlugs.filter((s) => s !== modulo.slug));
              } else {
                onChange([...selectedSlugs, modulo.slug]);
              }
            }}
            className={cx(
              "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors",
              isSelected
                ? "bg-k-bg-card2 border-k-border"
                : "bg-k-bg-card border-k-border hover:bg-k-bg-card2",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <div
              className={cx(
                "h-5 w-5 rounded flex items-center justify-center shrink-0 border transition-colors",
                isSelected
                  ? "bg-violet-500 border-violet-500 text-white"
                  : "bg-white border-k-border"
              )}
            >
              {isSelected && <Check className="h-3.5 w-3.5" />}
            </div>
            <div>
              <div className="text-sm font-bold text-k-text-h">{modulo.nombre}</div>
              <div className="text-xs text-k-text-b font-mono mt-0.5">{modulo.slug}</div>
            </div>
          </label>
        );
      })}
    </div>
  );
}
