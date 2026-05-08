import { TrendingUp } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { isEnabled } from "@/lib/featureFlags";
import type { TasksListData } from "./tasks.types";

interface TaskMetricsPanelProps {
  data: TasksListData | null;
}

export default function TaskMetricsPanel({ data }: TaskMetricsPanelProps) {
  const total = data?.total ?? 0;

  if (isEnabled("newAdminTasks") && total === 0) {
    return (
      <div className="pb-10">
        <div className="bg-white rounded-[40px] border border-neutral-100 shadow-sm overflow-hidden h-[280px] flex items-center justify-center">
          <EmptyState
            level={1}
            variant="neutral"
            title="Aún no hay rendimiento para mostrar"
            description="Las estadísticas de tu equipo aparecerán aquí cuando comiencen a completar tareas."
          />
        </div>
      </div>
    );
  }

  const last7 = data?.last_7_days;
  const hasLast7 = last7 && last7.length === 7;
  const max = hasLast7 ? Math.max(...last7, 10) : 10;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-10">
      {/* Left Box */}
      <div className="bg-white rounded-[40px] border border-neutral-100 shadow-sm p-8 flex flex-col justify-between relative overflow-hidden min-h-[280px]">
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <h4 className="text-2xl font-black text-obsidian tracking-tight mb-2">
              Rendimiento
              <br />
              Semanal
            </h4>
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 max-w-[200px] leading-relaxed">
              Tu equipo ha completado{" "}
              <span className="text-obsidian">{total} tareas</span> en los
              últimos 7 días.
            </p>
          </div>
          <div className="h-12 w-12 rounded-[22px] bg-neutral-50 border border-neutral-100 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-neutral-300" />
          </div>
        </div>

        <div className="mt-8 flex items-end justify-between gap-1 h-24 relative z-10 pt-4 px-2 select-none">
          {hasLast7
            ? last7.map((h, i) => {
                const height = Math.max(10, (h / max) * 100);
                return (
                  <div
                    key={i}
                    className="flex-1 max-w-[32px] rounded-t-[10px] bg-neutral-100 relative group transition-colors hover:bg-neutral-200 cursor-default"
                    style={{ height: `${height}%` }}
                  >
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-obsidian text-white text-[10px] font-bold px-2.5 py-1 rounded-lg transition-opacity pointer-events-none">
                      {h}
                    </div>
                  </div>
                );
              })
            : Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 max-w-[32px] rounded-t-[10px] bg-neutral-100 relative group transition-colors hover:bg-neutral-200 cursor-default"
                  style={{ height: `10%` }}
                >
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-obsidian text-white text-[10px] font-bold px-2.5 py-1 rounded-lg transition-opacity pointer-events-none">
                    0
                  </div>
                </div>
              ))}
        </div>
      </div>

      {/* Right Box (Dark) */}
      <div className="bg-obsidian rounded-[40px] p-8 text-white relative overflow-hidden flex flex-col justify-between min-h-[280px] shadow-lg shadow-obsidian/10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/[0.03]" />
          <div className="absolute bottom-[-20%] right-[-10%] h-48 w-48 rounded-full bg-gold/10 blur-[40px]" />
        </div>

        <div className="relative z-10 space-y-5">
          <div>
            <h4 className="text-2xl font-black tracking-tight mb-3">
              Resumen de Turno
            </h4>
            <p className="text-sm font-medium text-white/50 leading-relaxed max-w-[85%]">
              Has gestionado{" "}
              <span className="text-white font-bold">{total} tareas</span> el
              día de hoy. Tu equipo mantiene un{" "}
              <span className="text-emerald-400 font-bold tracking-wide">
                {data?.effectiveness ?? 100}% de efectividad
              </span>{" "}
              en las entregas pautadas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
