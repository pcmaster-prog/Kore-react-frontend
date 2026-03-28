import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { CompaneroParaEvaluar } from './types';
import { CRITERIOS_PEER, initials } from './utils';
import { enviarPeerEvaluacion } from './api';
import StarRating from './StarRating';

function cx(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(' ');
}

type PeerEvaluacionModalProps = {
  open: boolean;
  onClose: () => void;
  companero: CompaneroParaEvaluar;
  onSuccess?: (allDone: boolean) => void;
  totalPending: number;
};

export default function PeerEvaluacionModal({
  open, onClose, companero, onSuccess, totalPending,
}: PeerEvaluacionModalProps) {
  const [scores, setScores] = useState<Record<string, number>>({
    colaboracion: 0, puntualidad: 0, actitud: 0, comunicacion: 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allFilled = Object.values(scores).every(v => v > 0);

  async function handleSubmit() {
    if (!allFilled) return;
    setError(null);
    setSaving(true);
    try {
      await enviarPeerEvaluacion({
        employee_evaluation_id: companero.evaluation_id,
        evaluado_empleado_id: companero.empleado.id,
        colaboracion: scores.colaboracion,
        puntualidad: scores.puntualidad,
        actitud: scores.actitud,
        comunicacion: scores.comunicacion,
      });
      const allDone = totalPending <= 1;
      onSuccess?.(allDone);
      onClose();
      setScores({ colaboracion: 0, puntualidad: 0, actitud: 0, comunicacion: 0 });
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'No se pudo enviar la evaluación');
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-white sm:bg-transparent sm:items-center sm:justify-center sm:p-4">
      {/* Backdrop desktop */}
      <div className="hidden sm:block absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex-1 sm:flex-initial bg-white sm:rounded-[24px] sm:shadow-2xl sm:w-full sm:max-w-[480px] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in-up">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center gap-3">
          <button onClick={onClose} className="h-10 w-10 rounded-xl bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors shrink-0">
            <ArrowLeft className="h-5 w-5 text-neutral-600" />
          </button>
          <span className="rounded-full bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
            👁 Tu evaluación es anónima
          </span>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Perfil evaluado */}
          <div className="text-center">
            <div className="mx-auto h-[72px] w-[72px] rounded-2xl bg-[#1E2D4A] flex items-center justify-center text-white font-bold text-2xl">
              {initials(companero.empleado.full_name)}
            </div>
            <div className="text-2xl font-bold text-[#1E2D4A] tracking-tight mt-3">{companero.empleado.full_name}</div>
            <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mt-1">
              Evaluación de Compañero
            </div>
          </div>

          {/* Criterios */}
          <div className="space-y-3">
            {CRITERIOS_PEER.map(c => {
              const val = scores[c.key] ?? 0;
              return (
                <div
                  key={c.key}
                  className={cx(
                    'rounded-[20px] shadow-sm border p-5 transition-all duration-300',
                    val > 0 ? 'bg-emerald-50/40 border-emerald-200' : 'bg-white border-neutral-100'
                  )}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{c.icon}</span>
                    <span className="text-base font-bold text-[#1E2D4A]">{c.label}</span>
                  </div>
                  <StarRating
                    value={val}
                    onChange={(v) => setScores(p => ({ ...p, [c.key]: v }))}
                    size="lg"
                  />
                </div>
              );
            })}
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* CTA sticky */}
        <div className="p-4 border-t border-neutral-100 bg-white">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!allFilled || saving}
            className="w-full rounded-full bg-[#1E2D4A] text-white font-bold text-base py-4 flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg hover:bg-[#2a3d5e]"
            style={{ height: 56 }}
          >
            {saving && <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
            Enviar Evaluación ►
          </button>
        </div>
      </div>
    </div>
  );
}
