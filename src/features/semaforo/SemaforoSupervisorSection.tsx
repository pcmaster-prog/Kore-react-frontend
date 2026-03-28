import { useState, useEffect } from 'react';
import type { EmpleadoConEvaluacion } from './types';
import { getPendientesSupervisor } from './api';
import { initials } from './utils';
import SemaforoBadge from './SemaforoBadge';
import EvaluacionFormModal from './EvaluacionFormModal';
import { auth } from '@/features/auth/store';

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

export default function SemaforoSupervisorSection() {
  const [pendientes, setPendientes] = useState<EmpleadoConEvaluacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [evalModal, setEvalModal] = useState<{ id: string; full_name: string; position_title?: string | null } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function refresh() {
    try {
      const data = await getPendientesSupervisor();
      setPendientes(data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  useEffect(() => { refresh(); }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const currentUser = auth.get().user;
  // Supervisors shouldn't evaluate themselves
  const pendientesFiltrados = pendientes.filter(p => 
    String(p.empleado.id) !== String(currentUser?.id) &&
    String(p.empleado.user_id) !== String(currentUser?.id)
  );

  return (
    <>
      {toast && (
        <div className="fixed top-4 right-4 z-[300] rounded-2xl bg-emerald-600 text-white px-5 py-3 shadow-lg text-sm font-bold animate-in-up">
          {toast}
        </div>
      )}

      <div className="rounded-[40px] border border-neutral-100 bg-white shadow-sm overflow-hidden animate-in-up">
        <div className="px-8 py-6 border-b border-neutral-50 bg-neutral-50/50">
          <h2 className="text-2xl font-bold text-[#1E2D4A] tracking-tight">Evaluaciones Pendientes</h2>
          <p className="text-sm font-medium text-neutral-500 mt-1">Empleados que requieren tu evaluación de desempeño</p>
        </div>

        <div className="p-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : pendientesFiltrados.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-neutral-200 bg-neutral-50/50 p-16 text-center">
              <div className="text-4xl mb-3">✅</div>
              <div className="text-lg font-bold text-[#1E2D4A]">Sin evaluaciones pendientes</div>
              <div className="text-sm text-neutral-400 mt-1">No hay empleados esperando tu evaluación en este momento.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendientesFiltrados.map(({ empleado, evaluation }) => (
                <div
                  key={empleado.id}
                  className="rounded-[20px] border border-neutral-100 bg-white p-5 hover:shadow-lg hover:shadow-neutral-200/50 transition-all duration-300"
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

                  <button
                    onClick={() => setEvalModal(empleado)}
                    className="w-full rounded-full bg-[#1E2D4A] text-white text-sm font-bold py-3 hover:bg-[#2a3d5e] transition-colors"
                  >
                    Evaluar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <EvaluacionFormModal
        open={!!evalModal}
        onClose={() => setEvalModal(null)}
        empleado={evalModal ?? { id: '', full_name: '' }}
        onSuccess={() => {
          setToast('✅ Evaluación guardada');
          refresh();
        }}
      />
    </>
  );
}
