import { useState, useEffect } from "react";
import { Coffee, AlertTriangle } from "lucide-react";

type Props = {
  durationMinutes: number;
};

export default function BreakTimer({ durationMinutes }: Props) {
  const [elapsed, setElapsed] = useState(0);
  const limitSeconds = durationMinutes * 60;

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  function fmt(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  const remaining = limitSeconds - elapsed;
  const isOvertime = elapsed > limitSeconds;
  const pct = Math.min((elapsed / limitSeconds) * 100, 100);

  return (
    <div
      className={`mt-4 rounded-[24px] border p-4 ${
        isOvertime
          ? "border-rose-200 bg-rose-50"
          : "border-sky-200 bg-sky-50"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className={`h-10 w-10 rounded-xl flex items-center justify-center ${
              isOvertime ? "bg-rose-100" : "bg-sky-100"
            }`}
          >
            {isOvertime ? (
              <AlertTriangle className="h-5 w-5 text-rose-600" />
            ) : (
              <Coffee className="h-5 w-5 text-sky-600" />
            )}
          </div>
          <div>
            <div className="font-bold text-obsidian">Descanso en curso</div>
            <div
              className={`text-xs font-bold ${
                isOvertime ? "text-rose-600" : "text-sky-600"
              }`}
            >
              {isOvertime
                ? "Tiempo excedido"
                : `${durationMinutes} minutos permitidos`}
            </div>
          </div>
        </div>

        <div
          className={`text-3xl font-black font-mono ${
            isOvertime ? "text-rose-600" : "text-obsidian"
          }`}
        >
          {isOvertime ? `+${fmt(elapsed - limitSeconds)}` : fmt(remaining)}
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="h-2 w-full rounded-full bg-white/60 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isOvertime ? "bg-rose-500" : "bg-sky-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {isOvertime && (
        <p className="mt-2 text-xs font-bold text-rose-600">
          Exceso de descanso registrado como incidencia.
        </p>
      )}
    </div>
  );
}
