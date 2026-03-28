import { useState, useEffect } from 'react';
import type { EmpleadoConEvaluacion } from './types';
import { listEmpleadosEvaluacion, activarEvaluacion, desactivarEvaluacion } from './api';
import { initials } from './utils';
import SemaforoBadge from './SemaforoBadge';
import EvaluacionFormModal from './EvaluacionFormModal';
import ResultadoModal from './ResultadoModal';
import { auth } from '@/features/auth/store';

function cx(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(' ');
}

/* ── Skeleton Card ─────────────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="rounded-[20px] border border-neutral-100 bg-white p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-11 w-11 rounded-2xl bg-neutral-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 bg-neutral-200 rounded-lg" />
          <div className="h-3 w-20 bg-neutral-100 rounded-lg" />
        </div>
      </div>
      <div className="h-8 w-full bg-neutral-100 rounded-xl" />
    </div>
  );
}

/* ── Toast ─────────────────────────────────────────────────────────────────── */
function Toast({ msg, type, onDone }: { msg: string; type: 'ok' | 'err'; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 4000); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className={cx(
      'fixed top-4 right-4 z-[300] rounded-2xl px-5 py-3 shadow-lg text-sm font-bold animate-in-up',
      type === 'ok' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
    )}>
      {msg}
    </div>
  );
}

export default function SemaforoAdminTab() {
  const [empleados, setEmpleados] = useState<EmpleadoConEvaluacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Modals
  const [evalModal, setEvalModal] = useState<{ id: string; full_name: string; position_title?: string | null } | null>(null);
  const [resultModal, setResultModal] = useState<string | null>(null);

  async function refresh() {
    try {
      const data = await listEmpleadosEvaluacion();
      setEmpleados(data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  useEffect(() => { refresh(); }, []);

  const currentUser = auth.get().user;
  
  // Filter out the current user (Admins shouldn't see themselves or evaluate themselves)
  const empleadosFiltrados = empleados.filter(e => 
    String(e.empleado.id) !== String(currentUser?.id) &&
    String(e.empleado.user_id) !== String(currentUser?.id)
  );
  
  const activos = empleadosFiltrados.filter(e => e.evaluation?.is_active);
  const inactivos = empleadosFiltrados.filter(e => !e.evaluation?.is_active);

  async function activar(empleadoId: string) {
    setBusyId(empleadoId);
    try {
      await activarEvaluacion(empleadoId);
      setToast({ msg: '✅ Evaluación activada', type: 'ok' });
      await refresh();
    } catch (e: any) {
      setToast({ msg: e?.response?.data?.message ?? 'Error activando', type: 'err' });
    } finally { setBusyId(null); }
  }

  async function desactivar(empleadoId: string) {
    if (!confirm('¿Desactivar evaluación de este empleado?')) return;
    setBusyId(empleadoId);
    try {
      await desactivarEvaluacion(empleadoId);
      setToast({ msg: '✅ Evaluación desactivada', type: 'ok' });
      await refresh();
    } catch (e: any) {
      setToast({ msg: e?.response?.data?.message ?? 'Error desactivando', type: 'err' });
    } finally { setBusyId(null); }
  }

  return (
    <>
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      <div className="rounded-[40px] border border-neutral-100 bg-white shadow-sm overflow-hidden animate-in-up">
        <div className="px-8 py-6 border-b border-neutral-50 bg-neutral-50/50">
          <h2 className="text-2xl font-bold text-[#1E2D4A] tracking-tight">Semáforo de Desempeño</h2>
          <p className="text-sm font-medium text-neutral-500 mt-1">Evaluaciones de empleados nuevos</p>
        </div>

        <div className="p-8 space-y-8">
          {/* ── En evaluación activa ── */}
          <div>
            <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-[0.08em] mb-4">
              En Evaluación Activa
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
              </div>
            ) : activos.length === 0 ? (
              <div className="rounded-[20px] border border-dashed border-neutral-200 bg-neutral-50/50 p-10 text-center">
                <div className="text-3xl mb-2">📋</div>
                <div className="text-sm font-bold text-neutral-400">No hay empleados en evaluación activa</div>
                <div className="text-xs text-neutral-400 mt-1">Activa la evaluación de un empleado desde la lista de abajo.</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activos.map(({ empleado, evaluation }) => (
                  <div
                    key={empleado.id}
                    className="rounded-[20px] border border-neutral-100 bg-white p-5 hover:shadow-lg hover:shadow-neutral-200/50 transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-11 w-11 rounded-2xl bg-[#1E2D4A] flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {initials(empleado.full_name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-[#1E2D4A] truncate">{empleado.full_name}</div>
                        {empleado.position_title && (
                          <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5 truncate">{empleado.position_title}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <SemaforoBadge status={evaluation?.semaforo ?? null} showDot />
                      <span className="text-xs font-medium text-neutral-400">
                        {evaluation?.evaluaciones_count ?? 0} eval. recibidas
                      </span>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => setEvalModal(empleado)}
                        className="flex-1 rounded-full border border-[#1E2D4A] bg-[#1E2D4A] text-white text-xs font-bold py-2.5 px-4 hover:bg-[#2a3d5e] transition-colors"
                      >
                        Evaluar
                      </button>
                      <button
                        onClick={() => setResultModal(empleado.id)}
                        className="flex-1 rounded-full border border-neutral-200 bg-white text-xs font-bold text-neutral-600 py-2.5 px-4 hover:bg-neutral-50 transition-colors"
                      >
                        Ver resultado
                      </button>
                      <button
                        onClick={() => desactivar(empleado.id)}
                        disabled={busyId === empleado.id}
                        className="rounded-full border border-red-200 bg-white text-xs font-bold text-red-500 py-2.5 px-3 hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        {busyId === empleado.id ? '...' : '✕'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Todos los empleados ── */}
          <div>
            <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-[0.08em] mb-4">
              Empleados sin Evaluación Activa
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 rounded-2xl bg-neutral-100 animate-pulse" />
                ))}
              </div>
            ) : inactivos.length === 0 ? (
              <div className="rounded-[16px] border border-dashed border-neutral-200 bg-neutral-50/50 py-8 text-center">
                <div className="text-sm font-medium text-neutral-400">Todos los empleados están en evaluación activa.</div>
              </div>
            ) : (
              <div className="space-y-2">
                {inactivos.map(({ empleado }) => (
                  <div
                    key={empleado.id}
                    className="flex items-center gap-3 rounded-2xl border border-neutral-100 bg-white px-5 py-3 hover:bg-neutral-50/50 transition-colors"
                  >
                    <div className="h-9 w-9 rounded-xl bg-neutral-200 flex items-center justify-center text-neutral-500 text-xs font-bold shrink-0">
                      {initials(empleado.full_name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-[#1E2D4A] truncate">{empleado.full_name}</div>
                      {empleado.position_title && (
                        <div className="text-[10px] text-neutral-400 uppercase tracking-widest truncate">{empleado.position_title}</div>
                      )}
                    </div>
                    <button
                      onClick={() => activar(empleado.id)}
                      disabled={busyId === empleado.id}
                      className="rounded-full border border-dashed border-[#1E2D4A] text-[#1E2D4A] text-xs font-bold px-4 py-2 hover:bg-[#1E2D4A] hover:text-white transition-all disabled:opacity-50 shrink-0"
                    >
                      {busyId === empleado.id ? 'Activando...' : 'Activar evaluación'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <EvaluacionFormModal
        open={!!evalModal}
        onClose={() => setEvalModal(null)}
        empleado={evalModal ?? { id: '', full_name: '' }}
        onSuccess={refresh}
      />
      <ResultadoModal
        open={!!resultModal}
        onClose={() => setResultModal(null)}
        empleadoId={resultModal ?? ''}
        onDeactivated={refresh}
      />
    </>
  );
}
