// src/features/tardiness/TardinessConfigTab.tsx
// Admin panel to configure tardiness policies (§5.4.1)
import { useState, useEffect } from "react";
import {
  getTardinessConfig,
  updateTardinessConfig,
  type TardinessConfig,
} from "./api";
import {
  Clock, CheckCircle2, AlertTriangle, Loader2, HelpCircle, Save,
} from "lucide-react";

function cx(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(" ");
}

function Toggle({ checked, onChange, disabled }: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cx(
        "h-6 w-11 rounded-full transition-all flex items-center px-0.5 border",
        checked ? "bg-emerald-500 border-emerald-600" : "bg-neutral-200 border-neutral-300",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className={cx(
        "h-4 w-4 rounded-full bg-white shadow transition-transform duration-300",
        checked ? "translate-x-5" : "translate-x-0"
      )} />
    </button>
  );
}

function Tooltip({ text }: { text: string }) {
  return (
    <div className="group relative inline-block">
      <HelpCircle className="h-4 w-4 text-k-text-b hover:text-k-text-h transition-colors cursor-help" />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2.5 bg-k-bg-sidebar text-white text-[10px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-center leading-relaxed shadow-2xl">
        {text}
      </div>
    </div>
  );
}

export default function TardinessConfigTab() {
  const [, setConfig] = useState<TardinessConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Form state
  const [gracePeriod, setGracePeriod] = useState(10);
  const [lateThreshold, setLateThreshold] = useState(1);
  const [latesToAbsence, setLatesToAbsence] = useState(3);
  const [accumulationPeriod, setAccumulationPeriod] = useState<"week" | "biweek" | "month">("month");
  const [penalizeRestDay, setPenalizeRestDay] = useState(true);
  const [notifyEmployee, setNotifyEmployee] = useState(true);
  const [notifyManager, setNotifyManager] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const cfg = await getTardinessConfig();
        setConfig(cfg);
        setGracePeriod(cfg.grace_period_minutes);
        setLateThreshold(cfg.late_threshold_minutes);
        setLatesToAbsence(cfg.lates_to_absence);
        setAccumulationPeriod(cfg.accumulation_period);
        setPenalizeRestDay(cfg.penalize_rest_day);
        setNotifyEmployee(cfg.notify_employee_on_late);
        setNotifyManager(cfg.notify_manager_on_late);
      } catch {
        setErr("No se pudo cargar la configuración de retardos");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleSave() {
    setSaving(true);
    setErr(null);
    try {
      const res = await updateTardinessConfig({
        grace_period_minutes: gracePeriod,
        late_threshold_minutes: lateThreshold,
        lates_to_absence: latesToAbsence,
        accumulation_period: accumulationPeriod,
        penalize_rest_day: penalizeRestDay,
        notify_employee_on_late: notifyEmployee,
        notify_manager_on_late: notifyManager,
      });
      setConfig(res.config);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "Error al guardar configuración");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-[40px] border border-k-border bg-k-bg-card p-16 flex flex-col items-center gap-3">
        <Loader2 className="h-10 w-10 text-k-text-h animate-spin" />
        <span className="text-[10px] font-bold text-k-text-b uppercase tracking-widest">Cargando política...</span>
      </div>
    );
  }

  return (
    <div className="rounded-[40px] border border-k-border bg-k-bg-card shadow-k-card overflow-hidden animate-in-up">
      <div className="px-8 py-6 border-b border-k-border bg-k-bg-card2/50 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-k-text-h tracking-tight">Política de Retardos</h2>
          <p className="text-[11px] font-bold text-k-text-b uppercase tracking-widest mt-1">
            Reglas de puntualidad y penalizaciones
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-2xl bg-k-accent-btn px-6 py-3 text-sm font-bold text-k-accent-btn-text shadow-md hover:opacity-90 hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar Cambios
        </button>
      </div>

      <div className="p-6 md:p-10 space-y-6">
        {/* Success / Error alerts */}
        {saved && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-800 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5" /> Política de retardos actualizada correctamente.
          </div>
        )}
        {err && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5" /> {err}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left column: Timing rules */}
          <div className="rounded-[28px] border border-k-border bg-k-bg-card2/50 p-6 space-y-6">
            <div className="flex items-center gap-3 pb-2 border-b border-k-border">
              <Clock className="h-5 w-5 text-k-text-b" />
              <h3 className="text-sm font-bold text-k-text-h uppercase tracking-widest">Tolerancia y Umbrales</h3>
            </div>

            <div className="space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <label className="text-[11px] font-bold text-k-text-b uppercase tracking-widest">
                    Periodo de gracia (min)
                  </label>
                  <Tooltip text="Minutos después de la hora de entrada que NO cuentan como retardo. Ej: si es 10, un empleado que llegue 8 min tarde no tiene retardo." />
                </div>
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={gracePeriod}
                  onChange={e => setGracePeriod(Number(e.target.value))}
                  className="w-full rounded-2xl border border-k-border bg-k-bg-card px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-obsidian/10 transition-all"
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <label className="text-[11px] font-bold text-k-text-b uppercase tracking-widest">
                    Umbral mínimo para retardo (min)
                  </label>
                  <Tooltip text="Minutos DESPUÉS del periodo de gracia para que cuente como retardo. Si es 1 y la gracia es 10, a los 11 minutos es retardo." />
                </div>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={lateThreshold}
                  onChange={e => setLateThreshold(Number(e.target.value))}
                  className="w-full rounded-2xl border border-k-border bg-k-bg-card px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-obsidian/10 transition-all"
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <label className="text-[11px] font-bold text-k-text-b uppercase tracking-widest">
                    Retardos para generar falta
                  </label>
                  <Tooltip text="Al acumular esta cantidad de retardos en el periodo, se genera una falta automática que penaliza el día de descanso." />
                </div>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={latesToAbsence}
                  onChange={e => setLatesToAbsence(Number(e.target.value))}
                  className="w-full rounded-2xl border border-k-border bg-k-bg-card px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-obsidian/10 transition-all"
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <label className="text-[11px] font-bold text-k-text-b uppercase tracking-widest">
                    Periodo de acumulación
                  </label>
                  <Tooltip text="Cada cuánto tiempo se resetea el contador de retardos." />
                </div>
                <select
                  value={accumulationPeriod}
                  onChange={e => setAccumulationPeriod(e.target.value as any)}
                  className="w-full rounded-2xl border border-k-border bg-k-bg-card px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-obsidian/10 transition-all"
                >
                  <option value="week">Semanal</option>
                  <option value="biweek">Quincenal</option>
                  <option value="month">Mensual</option>
                </select>
              </div>
            </div>
          </div>

          {/* Right column: Penalties & Notifications */}
          <div className="space-y-6">
            <div className="rounded-[28px] border border-k-border bg-k-bg-card2/50 p-6 space-y-5">
              <div className="flex items-center gap-3 pb-2 border-b border-k-border">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <h3 className="text-sm font-bold text-k-text-h uppercase tracking-widest">Penalización</h3>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-k-text-h">Penalizar día de descanso</div>
                  <div className="text-xs font-medium text-k-text-b mt-0.5">
                    Al acumular {latesToAbsence} retardos, el día de descanso no se paga
                  </div>
                </div>
                <Toggle checked={penalizeRestDay} onChange={setPenalizeRestDay} />
              </div>
            </div>

            <div className="rounded-[28px] border border-k-border bg-k-bg-card2/50 p-6 space-y-5">
              <div className="flex items-center gap-3 pb-2 border-b border-k-border">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-k-text-b" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                <h3 className="text-sm font-bold text-k-text-h uppercase tracking-widest">Notificaciones</h3>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-k-text-h">Avisar al empleado</div>
                  <div className="text-xs font-medium text-k-text-b mt-0.5">
                    Push notification cuando llega tarde
                  </div>
                </div>
                <Toggle checked={notifyEmployee} onChange={setNotifyEmployee} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-k-text-h">Avisar al manager</div>
                  <div className="text-xs font-medium text-k-text-b mt-0.5">
                    Push notification cuando un empleado llega tarde
                  </div>
                </div>
                <Toggle checked={notifyManager} onChange={setNotifyManager} />
              </div>
            </div>

            {/* Preview card */}
            <div className="rounded-[28px] border border-blue-100 bg-blue-50/50 p-6">
              <div className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em] mb-3">Vista previa de política</div>
              <div className="space-y-2 text-sm font-medium text-blue-900">
                <p>• Tolerancia de <strong>{gracePeriod} minutos</strong> después de la hora de entrada</p>
                <p>• A partir del minuto <strong>{gracePeriod + lateThreshold}</strong> se marca como retardo</p>
                <p>• Al acumular <strong>{latesToAbsence} retardos</strong> en el periodo <strong>{accumulationPeriod === "month" ? "mensual" : accumulationPeriod === "biweek" ? "quincenal" : "semanal"}</strong>:</p>
                {penalizeRestDay ? (
                  <p className="ml-4 text-rose-700">→ El día de descanso <strong>NO se paga</strong></p>
                ) : (
                  <p className="ml-4 text-emerald-700">→ Sin penalización automática (solo registro)</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Info banner */}
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-medium text-blue-700 flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0">
            <span className="text-sm">💡</span>
          </div>
          Los retardos se calculan automáticamente al registrar entrada. El sistema compara la hora de check-in con la hora de entrada configurada en Horarios + el periodo de gracia definido aquí.
        </div>
      </div>
    </div>
  );
}
