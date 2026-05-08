import { useState } from "react";
import { CheckCircle2, Eye, XCircle } from "lucide-react";
import {
  approveAssignment,
  rejectAssignment,
} from "@/features/tasks/api";
import type { SupervisorDashData } from "../types";
import { reportError } from "@/lib/utils";
import PriorityBadge from "./ui/PriorityBadge";

export interface PendingReviewCardProps {
  items: SupervisorDashData["pending_review"];
  onRefresh: () => void;
}

export default function PendingReviewCard({
  items,
  onRefresh,
}: PendingReviewCardProps) {
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  async function handleApprove(assignmentId: string) {
    setReviewingId(assignmentId);
    try {
      await approveAssignment(assignmentId);
      onRefresh();
    } catch {
      /* toast */
    } finally {
      setReviewingId(null);
    }
  }

  async function handleReject(assignmentId: string) {
    if (!rejectNote.trim()) return;
    setReviewingId(assignmentId);
    try {
      await rejectAssignment(assignmentId, rejectNote);
      setRejectingId(null);
      setRejectNote("");
      onRefresh();
    } catch (e) {
      reportError("Operación de supervisor", e);
    } finally {
      setReviewingId(null);
    }
  }

  return (
    <div className="bg-k-bg-card rounded-[40px] p-8 shadow-k-card border border-k-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-black text-k-text-h tracking-tight">
            Pendientes de Revisión
          </h2>
          <p className="text-xs text-k-text-b mt-0.5">
            {items.length} tarea{items.length !== 1 ? "s" : ""} esperando
            aprobación
          </p>
        </div>
        <span className="h-7 w-7 rounded-full bg-amber-100 text-amber-700 text-xs font-black flex items-center justify-center">
          {items.length}
        </span>
      </div>
      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
        {items.map((item) => (
          <div
            key={item.assignment_id}
            className="rounded-2xl border border-k-border p-4"
          >
            <div className="flex items-start gap-2 mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <PriorityBadge priority={item.priority} />
                </div>
                <div className="text-sm font-bold text-k-text-h truncate">
                  {item.task_title}
                </div>
                <div className="text-xs text-k-text-b mt-0.5">
                  👤 {item.empleado_name}
                  {item.done_at && (
                    <>
                      {" "}
                      ·{" "}
                      {new Date(item.done_at).toLocaleTimeString("es-MX", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </>
                  )}
                </div>
                {item.note && (
                  <div className="text-xs text-k-text-b mt-1 italic">
                    "{item.note}"
                  </div>
                )}
              </div>
            </div>

            {rejectingId === item.assignment_id ? (
              <div className="space-y-2">
                <textarea
                  className="w-full rounded-xl border border-k-border px-3 py-2 text-xs resize-none outline-none focus:ring-2 focus:ring-black/10"
                  rows={2}
                  placeholder="Motivo del rechazo..."
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setRejectingId(null);
                      setRejectNote("");
                    }}
                    className="flex-1 h-8 rounded-xl border border-k-border text-xs font-bold text-k-text-b hover:bg-k-bg-card2 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleReject(item.assignment_id)}
                    disabled={
                      !rejectNote.trim() || reviewingId === item.assignment_id
                    }
                    className="flex-1 h-8 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 transition disabled:opacity-50"
                  >
                    Confirmar rechazo
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(item.assignment_id)}
                  disabled={reviewingId === item.assignment_id}
                  className="flex-1 h-9 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Aprobar
                </button>
                <button
                  onClick={() => setRejectingId(item.assignment_id)}
                  className="flex-1 h-9 rounded-xl border border-rose-200 text-rose-600 text-xs font-bold hover:bg-rose-50 transition flex items-center justify-center gap-1.5"
                >
                  <XCircle className="h-3.5 w-3.5" /> Rechazar
                </button>
                <a
                  href="/app/manager/tareas"
                  className="h-9 w-9 rounded-xl border border-k-border flex items-center justify-center hover:bg-k-bg-card2 transition"
                  title="Ver detalle"
                >
                  <Eye className="h-3.5 w-3.5 text-k-text-b" />
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
