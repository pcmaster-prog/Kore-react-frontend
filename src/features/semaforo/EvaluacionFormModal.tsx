import { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import type { EvaluacionCriterios, Accion } from './types';
import { CRITERIOS_ADMIN, ACCIONES_CONFIG, calcSemaforo, SEMAFORO_CONFIG, initials } from './utils';
import { evaluarEmpleado } from './api';
import StarRating from './StarRating';
import SemaforoBadge from './SemaforoBadge';

type EvaluacionFormModalProps = {
  open: boolean;
  onClose: () => void;
  empleado: { id: string; full_name: string; position_title?: string | null };
  onSuccess?: () => void;
};

const EMPTY_CRITERIOS: EvaluacionCriterios = {
  puntualidad: 0, responsabilidad: 0, actitud_trabajo: 0, orden_limpieza: 0,
  atencion_cliente: 0, trabajo_equipo: 0, iniciativa: 0, aprendizaje_adaptacion: 0,
};

export default function EvaluacionFormModal({
  open, onClose, empleado, onSuccess,
}: EvaluacionFormModalProps) {
  const [criterios, setCriterios] = useState<EvaluacionCriterios>({ ...EMPTY_CRITERIOS });
  const [acciones, setAcciones] = useState<Accion[]>([]);
  const [observaciones, setObservaciones] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = useMemo(() => Object.values(criterios).reduce((a, b) => a + b, 0), [criterios]);
  const porcentaje = useMemo(() => (total / 40) * 100, [total]);
  const semaforo = useMemo(() => calcSemaforo(porcentaje), [porcentaje]);
  const semaforoCfg = semaforo ? SEMAFORO_CONFIG[semaforo] : null;

  function setCriterio(key: string, val: number) {
    setCriterios(prev => ({ ...prev, [key]: val }));
  }

  function toggleAccion(a: Accion) {
    setAcciones(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  }

  async function handleSubmit() {
    setError(null);
    setSaving(true);
    try {
      await evaluarEmpleado({
        empleado_id: empleado.id,
        ...criterios,
        acciones: acciones.length ? acciones : undefined,
        observaciones: observaciones.trim() || undefined,
      });
      onSuccess?.();
      onClose();
      setCriterios({ ...EMPTY_CRITERIOS });
      setAcciones([]);
      setObservaciones('');
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'No se pudo guardar la evaluación');
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-[24px] shadow-2xl w-full max-w-[560px] max-h-[90vh] flex flex-col overflow-hidden animate-in-up">
        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-100 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-[#1E2D4A] flex items-center justify-center text-white font-bold text-lg shrink-0">
            {initials(empleado.full_name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[22px] font-bold text-[#1E2D4A] tracking-tight truncate">{empleado.full_name}</div>
            {empleado.position_title && (
              <div className="text-[12px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5">{empleado.position_title}</div>
            )}
          </div>
          <span className="shrink-0 rounded-full bg-[#1E2D4A] text-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider hidden sm:inline-flex">
            Evaluación de Desempeño
          </span>
          <button onClick={onClose} className="shrink-0 h-9 w-9 rounded-xl bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors">
            <X className="h-4 w-4 text-neutral-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Criterios */}
          <div>
            <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-[0.08em] mb-4">
              Criterios de Evaluación
            </div>
            <div className="space-y-0 divide-y divide-[#F0EFE8]">
              {CRITERIOS_ADMIN.map((c) => (
                <div key={c.key} className="flex items-center justify-between py-3.5 gap-3">
                  <span className="text-sm font-medium text-[#374151] min-w-0">{c.label}</span>
                  <div className="flex items-center gap-3 shrink-0">
                    <StarRating
                      value={criterios[c.key as keyof EvaluacionCriterios]}
                      onChange={(v) => setCriterio(c.key, v)}
                      size="md"
                    />
                    <span className="text-sm font-bold text-[#1E2D4A] w-8 text-right tabular-nums">
                      {criterios[c.key as keyof EvaluacionCriterios]}/5
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Score card */}
          <div className="rounded-[16px] bg-[#F9F8F5] p-5">
            <div className="flex items-center justify-between gap-4 mb-3">
              <div>
                <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-[0.08em]">Puntaje Total</div>
                <div className="text-[28px] font-bold text-[#1E2D4A] tracking-tight leading-none mt-1 tabular-nums">
                  {total} <span className="text-lg text-neutral-400 font-medium">/ 40</span>
                </div>
              </div>
              <SemaforoBadge status={total > 0 ? semaforo : null} showDot size="md" />
            </div>
            <div className="h-2 rounded-full bg-neutral-200 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${porcentaje}%`,
                  background: semaforoCfg?.progressColor ?? '#d1d5db',
                }}
              />
            </div>
            {total > 0 && (
              <div className="text-xs font-medium text-neutral-500 mt-2 tabular-nums">
                {porcentaje.toFixed(1)}% — {semaforoCfg?.descripcion}
              </div>
            )}
          </div>

          {/* Acciones */}
          <div>
            <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-[0.08em] mb-3">
              Acciones Recomendadas
            </div>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(ACCIONES_CONFIG) as [Accion, { label: string; color: string }][]).map(([key, cfg]) => {
                const active = acciones.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleAccion(key)}
                    className="rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 border"
                    style={{
                      background: active ? cfg.color : '#F3F4F6',
                      color: active ? '#fff' : '#374151',
                      borderColor: active ? cfg.color : '#E5E7EB',
                    }}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-[0.08em] mb-2">
              Observaciones
            </div>
            <textarea
              placeholder="Observaciones adicionales..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={3}
              className="w-full rounded-[12px] border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#374151] outline-none resize-none focus:ring-2 focus:ring-[#1E2D4A]/10 transition-all placeholder:text-neutral-400"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-neutral-200 bg-white px-6 py-3 text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || total === 0}
            className="rounded-full bg-[#1E2D4A] px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-[#2a3d5e] transition-all disabled:opacity-50 flex items-center gap-2"
            style={{ height: 48 }}
          >
            {saving && <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
            Guardar Evaluación
          </button>
        </div>
      </div>
    </div>
  );
}
