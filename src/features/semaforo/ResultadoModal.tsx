import { useState, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import type { ResultadoCompleto, DesempenoEvaluacion, PeerEvaluacion } from './types';
import { getResultado, desactivarEvaluacion } from './api';
import { CRITERIOS_ADMIN, ACCIONES_CONFIG, initials } from './utils';
import StarRating from './StarRating';
import SemaforoBadge from './SemaforoBadge';

type ResultadoModalProps = {
  open: boolean;
  onClose: () => void;
  empleadoId: string;
  onDeactivated?: () => void;
};

function EvalAdminCard({ ev }: { ev: DesempenoEvaluacion }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-[16px] border border-[#E8E6E0] bg-white overflow-hidden">
      <div 
        className="p-4 cursor-pointer hover:bg-neutral-50/50 transition-colors flex items-center justify-between gap-3 select-none"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-[#1E2D4A] flex items-center justify-center text-white text-xs font-bold shrink-0">
            {initials(ev.evaluador?.full_name ?? '?')}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-[#1E2D4A] truncate">{ev.evaluador?.full_name ?? 'Desconocido'}</div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-500 uppercase">
                {ev.evaluador_rol}
              </span>
              <span className="text-xs text-neutral-400 hidden sm:block">{new Date(ev.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <div className="text-right">
            <div className="text-sm font-bold text-[#1E2D4A] leading-none">{ev.total}/40 <span className="text-neutral-400 text-xs font-normal hidden sm:inline">({ev.porcentaje?.toFixed(0) ?? '0'}%)</span></div>
          </div>
          <SemaforoBadge status={ev.porcentaje >= 80 ? 'verde' : ev.porcentaje >= 60 ? 'amarillo' : 'rojo'} size="sm" />
          <div className={`h-8 w-8 rounded-full bg-neutral-50 flex items-center justify-center transition-transform ${open ? 'rotate-180' : ''}`}>
             <ChevronDown className="h-4 w-4 text-neutral-500" />
          </div>
        </div>
      </div>

      {open && (
        <div className="px-4 pb-4 pt-2 border-t border-neutral-100 animate-in fade-in slide-in-from-top-2">
          <div className="space-y-0 divide-y divide-[#F0EFE8] mt-2">
            {CRITERIOS_ADMIN.map(c => (
              <div key={c.key} className="flex items-center justify-between py-2 gap-2">
                <span className="text-xs font-medium text-neutral-500">{c.label}</span>
                <div className="flex items-center gap-2">
                  <StarRating value={ev[c.key as keyof typeof ev] as number} readOnly size="sm" />
                  <span className="text-xs font-bold text-[#1E2D4A] w-6 text-right tabular-nums">
                    {ev[c.key as keyof typeof ev] as number}/5
                  </span>
                </div>
              </div>
            ))}
          </div>

          {ev.acciones && ev.acciones.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {ev.acciones.map(a => (
                <span key={a} className="rounded-full px-2.5 py-1 text-[10px] font-bold text-white"
                  style={{ background: ACCIONES_CONFIG[a]?.color ?? '#6b7280' }}>
                  {ACCIONES_CONFIG[a]?.label ?? a}
                </span>
              ))}
            </div>
          )}

          {ev.observaciones && (
            <div className="mt-3 rounded-xl bg-neutral-50 border border-neutral-100 px-4 py-3 text-sm text-neutral-600 italic">
              "{ev.observaciones}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EvalPeerCard({ pe }: { pe: PeerEvaluacion }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-[16px] border border-[#E8E6E0] bg-white overflow-hidden">
       <div 
        className="p-4 cursor-pointer hover:bg-neutral-50/50 transition-colors flex items-center justify-between gap-3 select-none"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-500 text-xs font-bold shrink-0">
            {pe.evaluador ? initials(pe.evaluador.full_name) : '?'}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-[#1E2D4A] truncate">
              {pe.evaluador ? pe.evaluador.full_name : 'Anónimo'}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-500 uppercase">
                Compañero
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <div className="text-right">
            <div className="text-sm font-bold text-[#1E2D4A] leading-none">{pe.promedio.toFixed(1)}/5 <span className="text-neutral-400 text-xs font-normal hidden sm:inline">({pe.porcentaje.toFixed(0)}%)</span></div>
          </div>
          <SemaforoBadge status={pe.porcentaje >= 80 ? 'verde' : pe.porcentaje >= 60 ? 'amarillo' : 'rojo'} size="sm" />
          <div className={`h-8 w-8 rounded-full bg-neutral-50 flex items-center justify-center transition-transform ${open ? 'rotate-180' : ''}`}>
             <ChevronDown className="h-4 w-4 text-neutral-500" />
          </div>
        </div>
      </div>

      {open && (
        <div className="px-4 pb-4 pt-2 border-t border-neutral-100 animate-in fade-in slide-in-from-top-2">
          <div className="space-y-0 divide-y divide-[#F0EFE8] mt-2">
            {[
              { key: 'colaboracion', label: 'Colaboración' },
              { key: 'puntualidad', label: 'Puntualidad' },
              { key: 'actitud', label: 'Actitud' },
              { key: 'comunicacion', label: 'Comunicación' }
            ].map(c => (
              <div key={c.key} className="flex items-center justify-between py-2 gap-2">
                <span className="text-xs font-medium text-neutral-500">{c.label}</span>
                <div className="flex items-center gap-2">
                  <StarRating value={pe[c.key as keyof typeof pe] as number} readOnly size="sm" />
                  <span className="text-xs font-bold text-[#1E2D4A] w-6 text-right tabular-nums">
                    {pe[c.key as keyof typeof pe] as number}/5
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ResultadoModal({ open, onClose, empleadoId, onDeactivated }: ResultadoModalProps) {
  const [data, setData] = useState<ResultadoCompleto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  useEffect(() => {
    if (!open || !empleadoId) return;
    setLoading(true);
    setError(null);
    getResultado(empleadoId)
      .then(setData)
      .catch((e: any) => setError(e?.response?.data?.message ?? 'Error cargando resultado'))
      .finally(() => setLoading(false));
  }, [open, empleadoId]);

  async function handleDeactivate() {
    if (!confirm('¿Desactivar evaluación de este empleado? Ya no aparecerá en evaluación activa.')) return;
    setDeactivating(true);
    try {
      await desactivarEvaluacion(empleadoId);
      onDeactivated?.();
      onClose();
    } catch { /* silent */ }
    finally { setDeactivating(false); }
  }

  if (!open) return null;



  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-[24px] shadow-2xl w-full max-w-[680px] max-h-[90vh] flex flex-col overflow-hidden animate-in-up">
        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-100 flex items-center gap-4">
          {data && (
            <>
              <div className="h-14 w-14 rounded-2xl bg-[#1E2D4A] flex items-center justify-center text-white font-bold text-xl shrink-0">
                {initials(data.empleado.full_name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xl font-bold text-[#1E2D4A] tracking-tight truncate">{data.empleado.full_name}</div>
                {data.empleado.position_title && (
                  <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5">{data.empleado.position_title}</div>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <SemaforoBadge status={data.semaforo} showDot size="md" />
                {data.final_score !== null && (
                  <span className="text-[32px] font-bold text-[#1E2D4A] tabular-nums leading-none">
                    {data.final_score.toFixed(1)}%
                  </span>
                )}
              </div>
            </>
          )}
          <button onClick={onClose} className="shrink-0 h-9 w-9 rounded-xl bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors">
            <X className="h-4 w-4 text-neutral-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="py-16 flex flex-col items-center gap-3">
              <div className="h-10 w-10 border-4 border-neutral-100 border-t-[#1E2D4A] rounded-full animate-spin" />
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Cargando resultado...</span>
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm font-medium text-red-700">{error}</div>
          )}

          {data && !loading && (
            <>
              {/* Score cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-[16px] bg-[#F9F8F5] border border-[#E8E6E0] p-5">
                  <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-[0.08em]">Evaluaciones (Admin/Supervisor)</div>
                  <div className="text-3xl font-bold text-[#1E2D4A] mt-1 tabular-nums">
                    {data.eval_score !== null ? `${data.eval_score.toFixed(1)}%` : '—'}
                  </div>
                  <div className="text-[11px] font-medium text-neutral-500 mt-1">Peso: 70%</div>
                </div>
                <div className="rounded-[16px] bg-[#F9F8F5] border border-[#E8E6E0] p-5">
                  <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-[0.08em]">Evaluaciones Compañeros</div>
                  <div className="text-3xl font-bold text-[#1E2D4A] mt-1 tabular-nums">
                    {data.peer_score !== null ? `${data.peer_score.toFixed(1)}%` : '—'}
                  </div>
                  <div className="text-[11px] font-medium text-neutral-500 mt-1">Peso: 30% · {data.peer_count} compañeros</div>
                </div>
              </div>

              <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-sm font-medium text-blue-700 text-center">
                Fórmula: (70% × eval) + (30% × peers) = <strong>{data.final_score?.toFixed(1) ?? '—'}%</strong>
              </div>

              {/* Evaluaciones recibidas */}
              {data.evaluaciones?.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-[0.08em] mb-4">
                    Evaluaciones Recibidas
                  </div>
                  <div className="space-y-4">
                    {data.evaluaciones.map(ev => (
                      <EvalAdminCard key={ev.id} ev={ev} />
                    ))}
                  </div>
                </div>
              )}

              {/* Peer evaluaciones */}
              {data.peer_evaluaciones?.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-[0.08em] mb-4">
                    Opinión de Compañeros · {data.peer_count} evaluaron
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    {(['colaboracion', 'puntualidad', 'actitud', 'comunicacion'] as const).map(key => {
                      const avg = data.peer_evaluaciones.reduce((s, p) => s + p[key], 0) / data.peer_evaluaciones.length;
                      return (
                        <div key={key} className="rounded-[12px] bg-[#F9F8F5] border border-[#E8E6E0] p-3 text-center">
                          <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{key}</div>
                          <div className="text-xl font-bold text-[#1E2D4A] mt-0.5 tabular-nums">{avg.toFixed(1)}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="space-y-4">
                    {data.peer_evaluaciones.map(pe => (
                      <EvalPeerCard key={pe.id} pe={pe} />
                    ))}
                  </div>
                </div>
              )}

              {/* Deactivate button */}
              {data.is_active && (
                <div className="pt-2">
                  <button
                    onClick={handleDeactivate}
                    disabled={deactivating}
                    className="w-full rounded-full border-2 border-red-300 bg-white text-red-600 font-bold text-sm py-3 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {deactivating ? 'Desactivando...' : 'Desactivar Evaluación'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
