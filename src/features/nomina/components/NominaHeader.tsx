import { CheckCircle2, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { cx } from "@/lib/utils";
import type { Period } from "../nomina.types";
import { getWeekNumber, weekLabel } from "../nomina.utils";

export type NominaHeaderProps = {
  period: Period | null;
  approved: boolean;
  weekStart: string;
  weekEnd: string;
  onPrevWeek: () => void;
  onNextWeek: () => void;
};

export default function NominaHeader({
  period,
  approved,
  weekStart,
  weekEnd,
  onPrevWeek,
  onNextWeek,
}: NominaHeaderProps) {
  return (
    <div className="relative rounded-[40px] bg-k-bg-sidebar overflow-hidden px-8 py-8 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-k-bg-card/[0.03]" />
        <div className="absolute top-8 right-32 h-32 w-32 rounded-full bg-k-bg-card/[0.04]" />
        <div className="absolute bottom-0 left-1/3 h-20 w-40 rounded-full bg-gold/10" />
      </div>

      <div className="relative flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-1">
            Recursos Humanos
          </p>
          <h1 className="text-3xl font-black tracking-tight">
            Nómina Semanal
            {period && (
              <span className="ml-3 inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-1 text-base font-black">
                Sem. {getWeekNumber(period.week_start)}
              </span>
            )}
          </h1>
          <p className="text-white/50 text-sm mt-1">
            Genera, revisa y aprueba el pago semanal.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {period && (
            <span
              className={cx(
                "inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-xs font-bold uppercase tracking-widest",
                approved
                  ? "bg-emerald-500/15 border-emerald-400/30 text-emerald-300"
                  : "bg-amber-500/15 border-amber-400/30 text-amber-300"
              )}
            >
              {approved ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              {approved ? "Aprobada" : "Borrador"}
            </span>
          )}

          <div className="flex items-center gap-2 bg-k-bg-card/10 rounded-2xl p-1">
            <button
              onClick={onPrevWeek}
              className="h-9 w-9 rounded-xl bg-k-bg-card/10 hover:bg-k-bg-card/20 flex items-center justify-center transition"
            >
              <ChevronLeft className="h-4 w-4 text-white" />
            </button>
            <span className="px-3 text-sm font-semibold text-white whitespace-nowrap">
              {weekLabel(weekStart, weekEnd)}
            </span>
            <button
              onClick={onNextWeek}
              className="h-9 w-9 rounded-xl bg-k-bg-card/10 hover:bg-k-bg-card/20 flex items-center justify-center transition"
            >
              <ChevronRight className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
