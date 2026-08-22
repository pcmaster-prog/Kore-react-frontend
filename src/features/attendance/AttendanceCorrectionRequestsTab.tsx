// src/features/attendance/AttendanceCorrectionRequestsTab.tsx
// Bandeja del admin/supervisor: solicitudes "olvidé marcar entrada/salida".
// Aprobar aplica la hora al día del empleado; "Aprobar todas" resuelve el sábado en un clic.
import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCheck,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  MessageSquare,
  RefreshCw,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { getApiErrorMessage } from "@/lib/error";
import { cx } from "@/lib/utils";
import {
  approveAllCorrectionRequests,
  getPendingCorrectionRequests,
  reviewCorrectionRequest,
  type AttendanceCorrectionRequest,
} from "./api";

function StatusBadge({ status }: { status: AttendanceCorrectionRequest["status"] }) {
  const map = {
    pending: { cls: "bg-amber-50 text-amber-700 border-amber-200", label: "Pendiente" },
    approved: { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Aplicada" },
    rejected: { cls: "bg-rose-50 text-rose-600 border-rose-200", label: "Rechazada" },
  } as const;
  const m = map[status];
  return (
    <span className={cx("shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider", m.cls)}>
      {m.label}
    </span>
  );
}

function fmtDate(date: string) {
  return new Date(date + "T12:00:00").toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default function AttendanceCorrectionRequestsTab() {
  const [requests, setRequests] = useState<AttendanceCorrectionRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [reviewLoading, setReviewLoading] = useState<string | null>(null);
  const [approvingAll, setApprovingAll] = useState(false);
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  function showToast(type: "ok" | "err", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRequests(await getPendingCorrectionRequests());
    } catch (e) {
      showToast("err", getApiErrorMessage(e, "No se pudieron cargar las solicitudes"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleReview(id: string, status: "approved" | "rejected") {
    setReviewLoading(id + status);
    try {
      const updated = await reviewCorrectionRequest(id, status, noteInputs[id] ?? "");
      setRequests((prev) => prev.map((r) => (r.id === id ? updated : r)));
      showToast("ok", status === "approved" ? "Corrección aplicada al día del empleado" : "Solicitud rechazada");
    } catch (e) {
      showToast("err", getApiErrorMessage(e, "No se pudo procesar la solicitud"));
    } finally {
      setReviewLoading(null);
    }
  }

  async function handleApproveAll() {
    const count = pending.length;
    if (count === 0) return;
    if (!window.confirm(`¿Aprobar las ${count} solicitudes pendientes? Se registrarán las horas indicadas por cada empleado.`)) return;
    setApprovingAll(true);
    try {
      const res = await approveAllCorrectionRequests();
      showToast("ok", res.message);
    } catch (e) {
      showToast("err", getApiErrorMessage(e, "No se pudieron aprobar las solicitudes"));
    } finally {
      setApprovingAll(false);
      await load(); // refleja lo que el backend sí resolvió, aun si falló a medias
    }
  }

  const pending = requests.filter((r) => r.status === "pending");
  const reviewed = requests.filter((r) => r.status !== "pending");

  return (
    <div className="space-y-4">
      {toast && (
        <div
          className={cx(
            "rounded-2xl border px-5 py-3 text-sm font-bold flex items-center gap-3",
            toast.type === "ok"
              ? "bg-emerald-50 border-emerald-100 text-emerald-700"
              : "bg-rose-50 border-rose-100 text-rose-700"
          )}
        >
          {toast.type === "ok" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      <div className="rounded-[40px] border border-k-border bg-k-bg-card shadow-k-card overflow-hidden">
        <div className="px-8 py-6 border-b border-k-border flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-lg font-black text-k-text-h tracking-tight">Correcciones de Asistencia</h3>
            <p className="text-[10px] font-bold text-k-text-b uppercase tracking-widest mt-1">
              {pending.length} pendiente{pending.length !== 1 ? "s" : ""} · entradas y salidas olvidadas
            </p>
          </div>
          <div className="flex items-center gap-2">
            {pending.length > 1 && (
              <button
                onClick={handleApproveAll}
                disabled={approvingAll || loading}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition disabled:opacity-50"
              >
                {approvingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
                Aprobar todas ({pending.length})
              </button>
            )}
            <button
              onClick={load}
              disabled={loading}
              className="h-9 w-9 rounded-xl border border-k-border flex items-center justify-center hover:bg-k-bg-card2 transition"
            >
              <RefreshCw className={cx("h-4 w-4 text-k-text-b", loading && "animate-spin")} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-3 py-16 text-k-text-b">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="text-xs font-bold uppercase tracking-widest">Cargando...</span>
          </div>
        ) : pending.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="h-10 w-10 text-neutral-100 mx-auto mb-3" />
            <p className="text-xs font-bold text-k-text-b uppercase tracking-widest">Sin solicitudes pendientes</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-50">
            {pending.map((req) => (
              <div key={req.id} className="px-8 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0">
                      <Clock className="h-5 w-5 text-sky-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-black text-k-text-h">{req.empleado_name}</div>
                      <div className="text-xs font-bold text-k-text-b mt-0.5">
                        {fmtDate(req.date)} ·{" "}
                        <span className="text-k-text-h">
                          {req.type === "check_in" ? "Entrada" : "Salida"} a las {req.requested_time}
                        </span>
                      </div>
                      <p className="text-xs text-k-text-b mt-1.5 line-clamp-3">{req.motivo}</p>
                    </div>
                  </div>
                  <StatusBadge status={req.status} />
                </div>
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-3.5 w-3.5 text-k-text-b shrink-0" />
                    <input
                      type="text"
                      placeholder="Nota opcional para el empleado..."
                      value={noteInputs[req.id] ?? ""}
                      onChange={(e) => setNoteInputs((prev) => ({ ...prev, [req.id]: e.target.value }))}
                      className="flex-1 rounded-xl border border-k-border bg-k-bg-card2 px-3 py-1.5 text-xs font-medium outline-none focus:ring-2 focus:ring-obsidian/10 transition"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReview(req.id, "approved")}
                      disabled={reviewLoading === req.id + "approved"}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition disabled:opacity-50"
                    >
                      {reviewLoading === req.id + "approved" ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ThumbsUp className="h-3.5 w-3.5" />
                      )}
                      Aprobar y registrar
                    </button>
                    <button
                      onClick={() => handleReview(req.id, "rejected")}
                      disabled={reviewLoading === req.id + "rejected"}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 border border-rose-200 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100 transition disabled:opacity-50"
                    >
                      {reviewLoading === req.id + "rejected" ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ThumbsDown className="h-3.5 w-3.5" />
                      )}
                      Rechazar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {reviewed.length > 0 && (
        <div className="rounded-[40px] border border-k-border bg-k-bg-card shadow-k-card overflow-hidden">
          <div className="px-8 py-6 border-b border-k-border">
            <h3 className="text-sm font-black text-k-text-h tracking-tight">Revisadas Recientemente</h3>
          </div>
          <div className="divide-y divide-neutral-50">
            {reviewed.slice(0, 15).map((req) => (
              <div key={req.id} className="px-8 py-4 flex items-start gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-k-text-h">{req.empleado_name}</span>
                    <span className="text-k-text-b">·</span>
                    <span className="text-xs text-k-text-b">
                      {req.type === "check_in" ? "Entrada" : "Salida"} {req.requested_time} ·{" "}
                      {new Date(req.date + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                  {req.reviewer_note && <p className="text-xs text-k-text-b mt-0.5 italic">"{req.reviewer_note}"</p>}
                </div>
                <StatusBadge status={req.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
