import { useEffect, useState } from "react";
import {
  X,
  AlertTriangle,
  Paperclip,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { listTaskEvidences } from "./api";
import type { EvidenceItem } from "./api";
import type { EvChecklist } from "./tasks.types";
import EvidenceGridItem from "./EvidenceGridItem";
import ChecklistSection from "./ChecklistSection";

interface EvidenceModalProps {
  assignmentId: string | null;
  taskId: string | null;
  open: boolean;
  actionBusy: string | null;
  checklist?: EvChecklist | null;
  onClose: () => void;
  onApprove: (assignmentId: string) => void;
  onReject: (assignmentId: string, note: string) => void;
}

export default function EvidenceModal({
  assignmentId,
  taskId,
  open,
  actionBusy,
  checklist,
  onClose,
  onApprove,
  onReject,
}: EvidenceModalProps) {
  const [evLoading, setEvLoading] = useState(false);
  const [evErr, setEvErr] = useState<string | null>(null);
  const [evList, setEvList] = useState<EvidenceItem[] | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  useEffect(() => {
    if (!open || !taskId) return;
    let alive = true;

    setEvLoading(true);
    setEvErr(null);
    setEvList(null);
    setRejectNote("");

    (async () => {
      try {
        const res = await listTaskEvidences(taskId);
        const evidencesArray = Array.isArray(res)
          ? res
          : (res.data ?? []);
        const filtered = assignmentId
          ? (evidencesArray as EvidenceItem[]).filter(
              (x) => x.task_assignee_id === assignmentId,
            )
          : (evidencesArray as EvidenceItem[]);
        if (!alive) return;
        setEvList(filtered);
      } catch (e: unknown) {
        if (!alive) return;
        const msg =
          (e as { response?: { data?: { message?: string } } })?.response?.data
            ?.message ?? "No se pudieron cargar evidencias";
        setEvErr(msg);
      } finally {
        if (alive) setEvLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [open, taskId, assignmentId]);

  if (!open) return null;

  const isBusy = actionBusy === assignmentId;

  return (
    <div className="fixed inset-0 bg-obsidian/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in-fade">
      <div className="w-full max-w-2xl bg-white rounded-[40px] border border-neutral-100 overflow-hidden shadow-2xl animate-in-up">
        <div className="p-8 border-b border-neutral-50 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-obsidian tracking-tight">
              Evidencias de Entrega
            </h2>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">
              Revisión de material cargado
            </p>
          </div>
          <button
            className="h-10 w-10 rounded-2xl border border-neutral-100 bg-white text-neutral-400 flex items-center justify-center hover:bg-neutral-50 hover:text-obsidian transition-all"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {evLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-neutral-400">
              <div className="h-10 w-10 border-4 border-neutral-100 border-t-obsidian rounded-full animate-spin" />
              <span className="text-xs font-bold uppercase tracking-widest">
                Cargando material...
              </span>
            </div>
          ) : null}

          {evErr && (
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-sm text-rose-600 flex items-center gap-3">
              <AlertTriangle className="h-4 w-4" />
              {evErr}
            </div>
          )}

          {!evLoading && !evErr && (evList?.length ?? 0) === 0 ? (
            <div className="text-center py-12">
              <Paperclip className="h-12 w-12 text-neutral-100 mx-auto mb-4" />
              <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest">
                Sin evidencias adjuntas
              </p>
            </div>
          ) : null}

          {!evLoading && !evErr && evList?.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {evList.map((item) => (
                <EvidenceGridItem key={item.id} item={item} />
              ))}
            </div>
          ) : null}

          {checklist && <ChecklistSection checklist={checklist} />}
        </div>

        <div className="p-8 bg-neutral-50 border-t border-neutral-100 space-y-6">
          <div>
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2 block ml-1">
              Nota de resolución
            </label>
            <textarea
              className="w-full h-24 rounded-2xl border border-neutral-200 bg-white p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-obsidian/5 placeholder:text-neutral-300 resize-none"
              placeholder="Escribe un comentario si vas a rechazar la tarea..."
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
            />
          </div>

          <div className="flex gap-4">
            <button
              className="flex-1 h-14 rounded-2xl bg-obsidian text-white text-[11px] font-bold uppercase tracking-widest hover:bg-gold transition-all shadow-lg shadow-obsidian/10 disabled:opacity-50 flex items-center justify-center gap-2"
              disabled={!assignmentId || isBusy}
              onClick={() => assignmentId && onApprove(assignmentId)}
            >
              <CheckCircle2 className="h-5 w-5" />
              Aprobar Entrega
            </button>
            <button
              className="flex-1 h-14 rounded-2xl bg-white border border-rose-100 text-rose-500 text-[11px] font-bold uppercase tracking-widest hover:bg-rose-50 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              disabled={!assignmentId || isBusy}
              onClick={() => assignmentId && onReject(assignmentId, rejectNote)}
            >
              <Trash2 className="h-5 w-5" />
              Rechazar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
