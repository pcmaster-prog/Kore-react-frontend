import { useState, useEffect } from 'react';
import { iniciarComida, terminarComida } from './api';
import { Loader2, UtensilsCrossed, CheckCircle2, AlertTriangle } from 'lucide-react';

type LunchState = {
  lunch_start_at?: string | null;
  lunch_end_at?: string | null;
};

type Props = {
  lunchState: LunchState;
  onUpdate: (newState: LunchState) => void;
};

export default function LunchTimer({ lunchState, onUpdate }: Props) {
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(false);

  const isActive = !!lunchState.lunch_start_at && !lunchState.lunch_end_at;

  const LIMIT = 30 * 60; // 30 minutos en segundos

  // Cronómetro en tiempo real
  useEffect(() => {
    if (!isActive) return;

    const start = new Date(lunchState.lunch_start_at!).getTime();

    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - start) / 1000);
      setElapsed(diff);
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, lunchState.lunch_start_at]);

  function formatTime(seconds: number): string {
    const m = Math.floor(Math.abs(seconds) / 60);
    const s = Math.abs(seconds) % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  const remaining = LIMIT - elapsed;
  const isOvertime = elapsed > LIMIT;
  const pct = Math.min((elapsed / LIMIT) * 100, 100);

  async function handleIniciar() {
    setLoading(true);
    try {
      const res = await iniciarComida();
      onUpdate({ lunch_start_at: res.lunch_start_at, lunch_end_at: null });
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'Error al iniciar comida');
    } finally {
      setLoading(false);
    }
  }

  async function handleTerminar() {
    setLoading(true);
    try {
      const res = await terminarComida();
      onUpdate({
        lunch_start_at: res.lunch_start_at,
        lunch_end_at: res.lunch_end_at,
      });
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'Error al terminar comida');
    } finally {
      setLoading(false);
    }
  }

  // Estado: no iniciado
  if (!lunchState.lunch_start_at) {
    return (
      <div className="rounded-[24px] border border-neutral-100 bg-white p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <UtensilsCrossed className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <div className="font-bold text-obsidian">Tiempo de comida</div>
            <div className="text-xs text-neutral-400">30 minutos</div>
          </div>
        </div>
        <button
          onClick={handleIniciar}
          disabled={loading}
          className="w-full h-12 rounded-2xl bg-obsidian text-white font-bold text-sm hover:bg-obsidian/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UtensilsCrossed className="h-4 w-4" />}
          {loading ? 'Iniciando...' : 'Iniciar tiempo de comida'}
        </button>
      </div>
    );
  }

  // Estado: en curso
  if (isActive) {
    return (
      <div className={`rounded-[24px] border p-5 ${
        isOvertime
          ? 'border-rose-200 bg-rose-50'
          : 'border-amber-200 bg-amber-50'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
              isOvertime ? 'bg-rose-100' : 'bg-amber-100'
            }`}>
              <UtensilsCrossed className={`h-5 w-5 ${isOvertime ? 'text-rose-600' : 'text-amber-600'}`} />
            </div>
            <div>
              <div className="font-bold text-obsidian">En comida</div>
              <div className={`text-xs font-bold ${isOvertime ? 'text-rose-600' : 'text-amber-600'}`}>
                {isOvertime ? 'Tiempo excedido' : 'Tiempo corriendo'}
              </div>
            </div>
          </div>

          {/* Cronómetro */}
          <div className={`text-3xl font-black font-mono ${
            isOvertime ? 'text-rose-600' : 'text-obsidian'
          }`}>
            {isOvertime ? '+' : ''}{formatTime(isOvertime ? elapsed - LIMIT : remaining)}
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="h-2 w-full rounded-full bg-white/60 overflow-hidden mb-4">
          <div
            className={`h-full rounded-full transition-all ${
              isOvertime ? 'bg-rose-500' : 'bg-amber-500'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>

        <button
          onClick={handleTerminar}
          disabled={loading}
          className="w-full h-12 rounded-2xl bg-obsidian text-white font-bold text-sm hover:bg-obsidian/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          {loading ? 'Registrando...' : 'Ya regresé'}
        </button>
      </div>
    );
  }

  // Estado: terminado
  const totalMin = Math.round(
    (new Date(lunchState.lunch_end_at!).getTime() -
     new Date(lunchState.lunch_start_at!).getTime()) / 60000
  );
  const excedio = totalMin > 30;

  return (
    <div className={`rounded-[24px] border p-5 ${
      excedio
        ? 'border-rose-200 bg-rose-50'
        : 'border-emerald-200 bg-emerald-50'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
          excedio ? 'bg-rose-100' : 'bg-emerald-100'
        }`}>
          {excedio
            ? <AlertTriangle className="h-5 w-5 text-rose-600" />
            : <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          }
        </div>
        <div>
          <div className="font-bold text-obsidian">Comida completada</div>
          <div className={`text-sm font-bold ${excedio ? 'text-rose-600' : 'text-emerald-600'}`}>
            {totalMin} minutos {excedio ? `(+${totalMin - 30} min extra)` : ''}
          </div>
        </div>
      </div>
    </div>
  );
}
