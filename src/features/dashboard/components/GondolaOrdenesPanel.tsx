import { useNavigate } from "react-router-dom";
import { LayoutGrid } from "lucide-react";
import { cx } from "@/lib/utils";
import type { GondolaOrden } from "@/features/gondolas/types";

export interface GondolaOrdenesPanelProps {
  ordenes: GondolaOrden[];
}

export default function GondolaOrdenesPanel({
  ordenes,
}: GondolaOrdenesPanelProps) {
  const nav = useNavigate();

  const activas = ordenes.filter((o) =>
    ["pendiente", "en_proceso", "rechazado"].includes(o.status)
  );

  if (activas.length === 0) return null;

  return (
    <div className="rounded-[40px] border border-k-border bg-k-bg-card shadow-k-card overflow-hidden">
      <div className="p-6 sm:p-8 border-b border-k-border bg-k-bg-card2/50 flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-amber-500" />
            <div className="text-xl font-black text-k-text-h tracking-tight">
              Mis Góndolas por rellenar
            </div>
          </div>
          <div className="text-[11px] font-bold text-k-text-b uppercase tracking-widest mt-1">
            {activas.length} orden(es) activa(s)
          </div>
        </div>
      </div>
      <div className="divide-y divide-neutral-100">
        {activas.map((o) => (
          <div
            key={o.id}
            className="p-5 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">🛒</span>
                <div className="text-lg font-black text-k-text-h tracking-tight truncate">
                  {o.gondola?.nombre}
                </div>
                <span
                  className={cx(
                    "inline-flex items-center rounded-full border px-2 py-0.5 text-xs",
                    o.status === "rechazado"
                      ? "bg-rose-50 text-rose-800 border-rose-200"
                      : o.status === "en_proceso"
                      ? "bg-amber-50 text-amber-800 border-amber-200"
                      : "bg-k-bg-card2 text-neutral-700 border-k-border"
                  )}
                >
                  {o.status === "rechazado"
                    ? "Rechazado"
                    : o.status === "en_proceso"
                    ? "En proceso"
                    : "Pendiente"}
                </span>
              </div>
              <div className="text-sm text-k-text-b">
                {o.items?.length ?? 0} productos
              </div>
              {o.status === "rechazado" && o.notas_rechazo && (
                <div className="mt-2 rounded-xl bg-rose-50 border border-rose-100 px-3 py-2 text-xs text-rose-700 font-medium">
                  Motivo: {o.notas_rechazo}
                </div>
              )}
            </div>
            <button
              onClick={() => nav(`/app/employee/gondola-relleno/${o.id}`)}
              className="w-full lg:w-auto rounded-2xl bg-k-accent-btn text-k-accent-btn-text px-6 py-3 text-xs font-bold shadow-md hover:opacity-90 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
            >
              {o.status === "en_proceso"
                ? "→ Continuar"
                : o.status === "rechazado"
                ? "↩ Volver a completar"
                : "▶ Iniciar relleno"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
