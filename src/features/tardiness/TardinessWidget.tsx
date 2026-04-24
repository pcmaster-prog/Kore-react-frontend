// src/features/tardiness/TardinessWidget.tsx
// Widget for the employee dashboard showing tardiness count and progress (§5.4.3)
import { useEffect, useState } from "react";
import { getMyLateInfo, type LateInfo } from "@/features/attendance/api";
import { Clock, AlertTriangle } from "lucide-react";

function cx(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(" ");
}

// Max lates before penalty — this should ideally come from config
// but for now we hardcode 3 (matches the default spec)
const MAX_LATES = 3;

export default function TardinessWidget() {
  const [info, setInfo] = useState<LateInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyLateInfo()
      .then(setInfo)
      .catch(() => { /* silent — don't break dashboard */ })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null; // Don't take space while loading
  if (!info) return null; // API not available yet — don't show widget

  const { late_count, penalty_active, today_late_minutes } = info;
  const progress = Math.min(1, late_count / MAX_LATES);
  const remaining = MAX_LATES - late_count;

  // Don't show widget if no lates at all (clean record)
  if (late_count === 0 && !today_late_minutes) return null;

  return (
    <div className={cx(
      "rounded-[28px] border p-5 shadow-k-card transition-all",
      penalty_active
        ? "border-rose-200 bg-rose-50/80"
        : late_count >= MAX_LATES - 1
          ? "border-amber-200 bg-amber-50/50"
          : "border-k-border bg-k-bg-card"
    )}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className={cx(
            "h-9 w-9 rounded-xl flex items-center justify-center",
            penalty_active ? "bg-rose-100" : "bg-amber-100"
          )}>
            {penalty_active
              ? <AlertTriangle className="h-4 w-4 text-rose-600" />
              : <Clock className="h-4 w-4 text-amber-600" />
            }
          </div>
          <div>
            <div className="text-sm font-black text-k-text-h tracking-tight">
              {penalty_active ? "Penalización activa" : "Retardos del mes"}
            </div>
            <div className="text-[10px] font-bold text-k-text-b uppercase tracking-widest">
              {info.month}
            </div>
          </div>
        </div>
        <div className={cx(
          "text-2xl font-black",
          penalty_active ? "text-rose-600" : late_count > 0 ? "text-amber-600" : "text-emerald-600"
        )}>
          {late_count}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-2">
        <div className="w-full bg-neutral-100 rounded-full h-2.5 overflow-hidden">
          <div
            className={cx(
              "h-full rounded-full transition-all duration-500",
              penalty_active ? "bg-rose-500" : progress >= 0.66 ? "bg-amber-500" : "bg-emerald-500"
            )}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      <div className="text-xs font-medium text-k-text-b">
        {penalty_active ? (
          <span className="text-rose-600 font-bold">
            ⚠️ Tu día de descanso no será pagado este periodo
          </span>
        ) : remaining === 1 ? (
          <span className="text-amber-600 font-bold">
            ⚡ A 1 retardo de penalización
          </span>
        ) : remaining <= 0 ? (
          <span className="text-rose-600 font-bold">
            Límite alcanzado
          </span>
        ) : (
          <span>
            {remaining} retardo{remaining !== 1 ? "s" : ""} más antes de penalización
          </span>
        )}
      </div>

      {/* Today's late */}
      {today_late_minutes && today_late_minutes > 0 && (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 flex items-center gap-2">
          <Clock className="h-3.5 w-3.5" />
          Hoy llegaste {today_late_minutes} min tarde
        </div>
      )}
    </div>
  );
}
