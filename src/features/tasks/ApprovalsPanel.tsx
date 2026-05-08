import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import ApprovalCard from "./ApprovalCard";
import type { ExtendedPendingApproval } from "./tasks.types";

interface ApprovalsPanelProps {
  loading: boolean;
  error: string | null;
  data: {
    data: ExtendedPendingApproval[];
    total: number;
    last_page: number;
  } | null;
  page: number;
  onPageChange: (page: number) => void;
  onReload: () => void;
  onBack: () => void;
  actionBusy: string | null;
  onApprove: (id: string) => void;
  onOpenEvidences: (assignmentId: string, taskId: string) => void;
}

export default function ApprovalsPanel({
  loading,
  error,
  data,
  page,
  onPageChange,
  onReload,
  onBack,
  actionBusy,
  onApprove,
  onOpenEvidences,
}: ApprovalsPanelProps) {
  return (
    <div className="space-y-6 animate-in-fade">
      <div className="bg-white border border-neutral-100/50 rounded-[32px] p-6 shadow-sm flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="h-10 w-10 rounded-2xl bg-neutral-50 flex items-center justify-center text-neutral-400 hover:text-obsidian hover:bg-neutral-100 transition-colors"
          >
            &larr;
          </button>
          <div className="h-12 w-12 rounded-[20px] bg-amber-50 text-amber-500 flex items-center justify-center">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-obsidian tracking-tight">
              Control de Calidad
            </h2>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
              {data?.total ?? 0} entregas por validar
            </p>
          </div>
        </div>
        <button
          className="h-11 px-6 rounded-2xl bg-obsidian text-white text-[11px] font-bold uppercase tracking-widest hover:bg-gold transition-all shadow-lg shadow-obsidian/10"
          onClick={onReload}
        >
          Recargar Lista
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-sm text-rose-700 flex items-center gap-3 animate-in-shake">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white border border-neutral-100/50 rounded-[40px] p-8 shadow-sm flex flex-col gap-4 animate-pulse border-l-4 border-l-neutral-200"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="h-4 w-24 bg-neutral-200 rounded-md mb-4" />
                  <div className="h-6 w-48 bg-neutral-200 rounded-md mb-2" />
                  <div className="h-4 w-32 bg-neutral-200 rounded-md" />
                </div>
                <div className="h-12 w-12 bg-neutral-200 rounded-2xl" />
              </div>
              <div className="h-20 w-full bg-neutral-100 rounded-[28px] mt-4" />
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="h-12 bg-neutral-200 rounded-2xl" />
                <div className="h-12 bg-neutral-200 rounded-2xl" />
              </div>
            </div>
          ))}
        </div>
      ) : !error && (data?.data?.length ?? 0) === 0 ? (
        <div className="bg-white border border-neutral-100/50 rounded-[40px] p-20 text-center">
          <div className="inline-flex h-20 w-20 rounded-full bg-emerald-50 text-emerald-500 items-center justify-center mb-6">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h3 className="text-2xl font-black text-obsidian mb-2 tracking-tight">
            ¡Todo al día!
          </h3>
          <p className="text-sm text-neutral-400 max-w-xs mx-auto">
            No hay evidencias pendientes de revisión en este momento.
          </p>
        </div>
      ) : null}

      {!error && data?.data?.length ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {data.data.map((approval) => (
            <ApprovalCard
              key={approval.id}
              approval={approval}
              actionBusy={actionBusy}
              onApprove={onApprove}
              onOpenEvidences={onOpenEvidences}
            />
          ))}
        </div>
      ) : null}

      {data && data.last_page > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8 pb-4">
          <button
            className="h-10 px-6 rounded-2xl border border-neutral-100 bg-white text-xs font-bold text-obsidian hover:bg-neutral-50 disabled:opacity-30 transition-all"
            disabled={page <= 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
          >
            Anterior
          </button>
          <span className="text-xs font-black text-neutral-400 uppercase tracking-widest">
            {page} / {data.last_page}
          </span>
          <button
            className="h-10 px-6 rounded-2xl border border-neutral-100 bg-white text-xs font-bold text-obsidian hover:bg-neutral-50 disabled:opacity-30 transition-all"
            disabled={page >= data.last_page}
            onClick={() => onPageChange(Math.min(data.last_page, page + 1))}
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
