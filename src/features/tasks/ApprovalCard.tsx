import {
  Clock,
  Zap,
  MessageSquare,
  CheckCircle2,
  Eye,
  Paperclip,
} from "lucide-react";
import { cx } from "@/lib/utils";
import type { ExtendedPendingApproval } from "./tasks.types";

interface ApprovalCardProps {
  approval: ExtendedPendingApproval;
  actionBusy: string | null;
  onApprove: (id: string) => void;
  onOpenEvidences: (assignmentId: string, taskId: string) => void;
}

export default function ApprovalCard({
  approval,
  actionBusy,
  onApprove,
  onOpenEvidences,
}: ApprovalCardProps) {
  const when = approval.done_at
    ? new Date(approval.done_at).toLocaleTimeString("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;
  const dateMark = approval.done_at
    ? new Date(approval.done_at).toLocaleDateString("es-MX", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const firstName =
    approval.empleado?.full_name?.split(" ")[0] ??
    approval.empleado?.name?.split(" ")[0] ??
    "Staff";

  return (
    <div className="bg-white border border-neutral-100/50 rounded-[40px] p-8 shadow-sm hover:shadow-xl hover:shadow-obsidian/5 transition-all group border-l-4 border-l-amber-400">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-obsidian text-[10px] font-bold text-white uppercase tracking-widest mb-3">
            <Zap className="h-3 w-3 text-gold-light" />
            Revisión Pendiente
          </div>
          <h3 className="text-xl font-black text-obsidian tracking-tight truncate">
            {approval.task?.title ?? approval.task_id}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-sm text-neutral-400">
            <span className="font-bold text-obsidian">@{firstName}</span>
            <span>·</span>
            <span className="text-xs">
              {dateMark} a las {when}
            </span>
          </div>
        </div>

        <button
          className="h-12 w-12 rounded-2xl bg-neutral-50 text-neutral-400 flex items-center justify-center hover:bg-obsidian hover:text-white transition-all group-hover:scale-110"
          onClick={() => onOpenEvidences(approval.id, approval.task_id)}
        >
          <Paperclip className="h-5 w-5" />
        </button>
      </div>

      <div className="bg-neutral-50/50 rounded-[28px] p-5 mb-8 border border-neutral-100/50">
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="h-3.5 w-3.5 text-neutral-300" />
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
            Feedback del Empleado
          </span>
        </div>
        <p
          className={cx(
            "text-sm text-obsidian/70 leading-relaxed font-medium italic",
            !approval.note && "text-neutral-300",
          )}
        >
          {approval.note ? `"${approval.note}"` : "Sin comentarios adicionales."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          className="h-12 rounded-2xl bg-emerald-500 text-white text-[11px] font-bold uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
          disabled={actionBusy === approval.id}
          onClick={() => onApprove(approval.id)}
        >
          {actionBusy === approval.id ? (
            <Clock className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          Aprobar Entrega
        </button>
        <button
          className="h-12 rounded-2xl bg-white border border-neutral-100 text-obsidian text-[11px] font-bold uppercase tracking-widest hover:bg-neutral-50 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          disabled={actionBusy === approval.id}
          onClick={() => onOpenEvidences(approval.id, approval.task_id)}
        >
          <Eye className="h-4 w-4" />
          Revisar Evidencia
        </button>
      </div>
    </div>
  );
}
