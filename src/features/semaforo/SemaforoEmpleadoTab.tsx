import { useState, useEffect } from 'react';
import type { CompaneroParaEvaluar } from './types';
import { getCompanerosParaEvaluar } from './api';
import { initials } from './utils';
import PeerEvaluacionModal from './PeerEvaluacionModal';
import { auth } from '@/features/auth/store';

function cx(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(' ');
}

function SkeletonCard() {
  return (
    <div className="rounded-[16px] border border-neutral-100 bg-white p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-2xl bg-neutral-200 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-28 bg-neutral-200 rounded-lg" />
          <div className="h-3 w-16 bg-neutral-100 rounded-lg" />
        </div>
        <div className="h-9 w-20 bg-neutral-200 rounded-full" />
      </div>
    </div>
  );
}

export default function SemaforoEmpleadoTab() {
  const [companeros, setCompaneros] = useState<CompaneroParaEvaluar[]>([]);
  const [progress, setProgress] = useState<{ evaluated: number; total: number }>({ evaluated: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [peerModal, setPeerModal] = useState<CompaneroParaEvaluar | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function refresh() {
    try {
      const data = await getCompanerosParaEvaluar();
      setCompaneros(data.companeros);
      setProgress(data.progress);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  useEffect(() => { refresh(); }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  function handlePeerSuccess(allDone: boolean) {
    // Optimistic UI: mark as evaluated without refetch
    if (peerModal) {
      setCompaneros(prev =>
        prev.map(c =>
          c.empleado.id === peerModal.empleado.id
            ? { ...c, already_evaluated: true }
            : c
        )
      );
      setProgress(prev => ({ ...prev, evaluated: prev.evaluated + 1 }));
    }
    setToast(allDone ? '🎉 ¡Evaluaste a todos tus compañeros!' : '✅ Evaluación enviada');
  }

  const currentUser = auth.get().user;
  const companerosFiltrados = companeros.filter(c => 
    String(c.empleado.id) !== String(currentUser?.id) &&
    String(c.empleado.user_id) !== String(currentUser?.id)
  );

  const pendingCount = companerosFiltrados.filter(c => !c.already_evaluated).length;
  const pct = progress.total > 0 ? (progress.evaluated / progress.total) * 100 : 0;

  return (
    <>
      {toast && (
        <div className="fixed top-4 right-4 z-[300] rounded-2xl bg-emerald-600 text-white px-5 py-3 shadow-lg text-sm font-bold animate-in-up">
          {toast}
        </div>
      )}

      <div className="space-y-4 pb-24">
        {/* Header */}
        <div className="text-center pt-2">
          <h2 className="text-xl font-bold text-[#1E2D4A] tracking-tight">Evaluar Compañeros</h2>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1 text-[11px] font-bold uppercase tracking-wider mt-2">
            🔒 Anónimo
          </span>
        </div>

        {/* Info banner */}
        <div className="rounded-[16px] bg-blue-50 border border-blue-100 px-4 py-3 flex items-center gap-3">
          <span className="text-lg">ℹ️</span>
          <span className="text-sm font-medium text-blue-700">Tu evaluación es completamente anónima.</span>
        </div>

        {/* Label */}
        <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-[0.08em]">
          Compañeros en evaluación
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : companerosFiltrados.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-neutral-200 bg-neutral-50/50 p-10 text-center">
            <div className="text-3xl mb-2">👥</div>
            <div className="text-sm font-bold text-neutral-400">No hay compañeros en evaluación activa en este momento.</div>
          </div>
        ) : (
          <div className="space-y-3">
            {companerosFiltrados.map(c => (
              <div
                key={c.empleado.id}
                className={cx(
                  'rounded-[16px] border bg-white px-4 py-3 flex items-center gap-3 transition-all',
                  c.already_evaluated ? 'border-emerald-100 bg-emerald-50/30' : 'border-[#F0EFE8] hover:shadow-md'
                )}
              >
                <div className="h-11 w-11 rounded-2xl bg-[#1E2D4A] flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {initials(c.empleado.full_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-[#1E2D4A] truncate">{c.empleado.full_name}</div>
                  {c.empleado.position_title && (
                    <div className="text-[10px] text-neutral-400 uppercase tracking-widest truncate">{c.empleado.position_title}</div>
                  )}
                </div>

                {c.already_evaluated ? (
                  <span className="text-sm font-bold text-emerald-600 shrink-0">✅ Evaluado</span>
                ) : (
                  <button
                    onClick={() => setPeerModal(c)}
                    className="rounded-full border border-dashed border-[#1E2D4A] text-[#1E2D4A] text-xs font-bold px-4 py-2 hover:bg-[#1E2D4A] hover:text-white transition-all shrink-0"
                  >
                    Evaluar →
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sticky bottom bar */}
      {!loading && companerosFiltrados.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-[100] bg-[#1E2D4A] text-white px-5 py-4 shadow-2xl lg:ml-72">
          <div className="flex items-center justify-between gap-3 mb-2">
            <span className="text-sm font-bold">Progreso: {progress.evaluated} de {progress.total} compañeros</span>
            <span className="text-xs text-white/60 tabular-nums">{pct.toFixed(0)}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-400 transition-all duration-500 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Peer modal */}
      {peerModal && (
        <PeerEvaluacionModal
          open={!!peerModal}
          onClose={() => setPeerModal(null)}
          companero={peerModal}
          totalPending={pendingCount}
          onSuccess={handlePeerSuccess}
        />
      )}
    </>
  );
}
