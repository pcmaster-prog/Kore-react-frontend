// src/features/attendance/ManagerAttendancePage.tsx
import { useEffect, useState, useCallback } from "react";
import { getApiErrorMessage } from "@/lib/error";
import { formatDateShort } from "@/lib/date";
import PageHeader from "@/components/PageHeader";
import ActionMenu from "@/components/ActionMenu";
import {
  getByDate,
  getWeeklySummary,
  getPendingAbsences,
  reviewAbsence,
  getPendingOvertimeRequests,
  reviewOvertimeRequest,
  getPendingLateArrivalRequests,
  reviewLateArrivalRequest,
  getEnComida,
  getPendingMealScheduleChangeRequests,
  reviewMealScheduleChangeRequest,
  minutesToHHMM,
  formatTime,
  type ByDateItem,
  type WeeklySummary,
  type AbsenceRequest,
  type OvertimeRequest,
  type LateArrivalRequest,
  type EnComidaRow,
  type MealScheduleChangeRequest,
  getAbsenceRequesterName,
} from "./api";
import {
  Users, UserX, Clock, RefreshCw, Calendar,
  CheckCircle2, AlertTriangle, Timer, Loader2, Pencil,
  FileText, ThumbsUp, ThumbsDown, MessageSquare, Lock,
  UtensilsCrossed,
} from "lucide-react";
import AjustarAsistenciaModal from "./AjustarAsistenciaModal";
import DiaDescansoAdminModal from "./DiaDescansoAdminModal";
import CerrarJornadaModal from "./CerrarJornadaModal";
import { isEnabled } from "@/lib/featureFlags";
import EmptyState from "@/components/EmptyState";

import { cx } from "@/lib/utils";
type Employee = { id: string; full_name?: string; name?: string; position_title?: string };

// ─── Badge de solicitud ───────────────────────────────────────────────────────
function AbsenceStatusBadge({ status }: { status: string }) {
  if (status === "approved")
    return <span className="inline-flex items-center gap-1 rounded-xl border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600"><CheckCircle2 className="h-2.5 w-2.5" />Aprobada</span>;
  if (status === "rejected")
    return <span className="inline-flex items-center gap-1 rounded-xl border border-rose-100 bg-rose-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-500">✕ Rechazada</span>;
  return <span className="inline-flex items-center gap-1 rounded-xl border border-amber-100 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-600"><span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />Pendiente</span>;
}

// ─── Panel de solicitudes de ausencia (Admin/Supervisor) ─────────────────────
function AbsenceRequestsTab() {
  const [requests, setRequests] = useState<AbsenceRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [reviewLoading, setReviewLoading] = useState<string | null>(null);
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  function showToast(type: "ok" | "err", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPendingAbsences();
      setRequests(data);
    } catch (e) {
      showToast("err", getApiErrorMessage(e, "No se pudieron cargar las solicitudes"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  async function handleReview(id: string, status: "approved" | "rejected") {
    setReviewLoading(id + status);
    try {
      const updated = await reviewAbsence(id, status, noteInputs[id] ?? "");
      setRequests(prev => prev.map(r => r.id === id ? updated : r));
      showToast("ok", status === "approved" ? "Solicitud aprobada" : "Solicitud rechazada");
    } catch (e) {
      showToast("err", getApiErrorMessage(e, "No se pudo procesar la solicitud"));
    } finally {
      setReviewLoading(null);
    }
  }

  const pending = requests.filter(r => r.status === "pending");
  const reviewed = requests.filter(r => r.status !== "pending");

  return (
    <div className="space-y-4">
      {toast && (
        <div className={cx(
          "rounded-2xl border px-5 py-3 text-sm font-bold flex items-center gap-3",
          toast.type === "ok" ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-rose-50 border-rose-100 text-rose-700"
        )}>
          {toast.type === "ok" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      {/* Pendientes */}
      <div className="rounded-[40px] border border-k-border bg-k-bg-card shadow-k-card overflow-hidden">
        <div className="px-8 py-6 border-b border-k-border flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-k-text-h tracking-tight">Solicitudes de Ausencia</h3>
            <p className="text-[10px] font-bold text-k-text-b uppercase tracking-widest mt-1">
              {pending.length} pendiente{pending.length !== 1 ? "s" : ""} de revisión
            </p>
          </div>
          <button
            onClick={loadRequests}
            disabled={loading}
            className="h-9 w-9 rounded-xl border border-k-border flex items-center justify-center hover:bg-k-bg-card2 transition"
          >
            <RefreshCw className={cx("h-4 w-4 text-k-text-b", loading && "animate-spin")} />
          </button>
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
            {pending.map(req => (
              <div key={req.id} className="px-8 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                      <Calendar className="h-5 w-5 text-amber-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-black text-k-text-h">{getAbsenceRequesterName(req)}</div>
                      <div className="text-xs font-bold text-k-text-b mt-0.5">
                        {new Date((req.date ?? "") + "T12:00:00").toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                      </div>
                      <p className="text-xs text-k-text-b mt-1.5 line-clamp-3">{req.motivo}</p>
                    </div>
                  </div>
                  <AbsenceStatusBadge status={req.status} />
                </div>

                {/* Nota del revisor + botones */}
                <div className="mt-4 ml-13 pl-0 sm:pl-13">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-3.5 w-3.5 text-k-text-b shrink-0" />
                    <input
                      type="text"
                      placeholder="Nota opcional para el empleado..."
                      value={noteInputs[req.id] ?? ""}
                      onChange={e => setNoteInputs(prev => ({ ...prev, [req.id]: e.target.value }))}
                      className="flex-1 rounded-xl border border-k-border bg-k-bg-card2 px-3 py-1.5 text-xs font-medium outline-none focus:ring-2 focus:ring-obsidian/10 transition"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReview(req.id, "approved")}
                      disabled={reviewLoading === req.id + "approved"}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition disabled:opacity-50"
                    >
                      {reviewLoading === req.id + "approved" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ThumbsUp className="h-3.5 w-3.5" />}
                      Aprobar
                    </button>
                    <button
                      onClick={() => handleReview(req.id, "rejected")}
                      disabled={reviewLoading === req.id + "rejected"}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 border border-rose-200 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100 transition disabled:opacity-50"
                    >
                      {reviewLoading === req.id + "rejected" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ThumbsDown className="h-3.5 w-3.5" />}
                      Rechazar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Revisadas recientemente */}
      {reviewed.length > 0 && (
        <div className="rounded-[40px] border border-k-border bg-k-bg-card shadow-k-card overflow-hidden">
          <div className="px-8 py-6 border-b border-k-border">
            <h3 className="text-sm font-black text-k-text-h tracking-tight">Revisadas Recientemente</h3>
          </div>
          <div className="divide-y divide-neutral-50">
            {reviewed.slice(0, 10).map(req => (
              <div key={req.id} className="px-8 py-4 flex items-start gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-k-text-h">{getAbsenceRequesterName(req)}</span>
                    <span className="text-k-text-b">·</span>
                    <span className="text-xs text-k-text-b">
                      {new Date((req.date ?? "") + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                  {req.reviewer_note && <p className="text-xs text-k-text-b mt-0.5 italic">"{req.reviewer_note}"</p>}
                </div>
                <AbsenceStatusBadge status={req.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Panel de cambios de comida (Admin) ────────────────────────────────────
function MealScheduleChangeRequestsTab() {
  const [requests, setRequests] = useState<MealScheduleChangeRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [reviewLoading, setReviewLoading] = useState<string | null>(null);
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  function showToast(type: "ok" | "err", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPendingMealScheduleChangeRequests();
      setRequests(data);
    } catch (e) {
      showToast("err", getApiErrorMessage(e, "No se pudieron cargar las solicitudes"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  async function handleReview(id: string, status: "approved" | "rejected") {
    setReviewLoading(id + status);
    try {
      const updated = await reviewMealScheduleChangeRequest(id, status, noteInputs[id] ?? "");
      setRequests(prev => prev.map(r => r.id === id ? updated : r));
      showToast("ok", status === "approved" ? "Solicitud aprobada" : "Solicitud rechazada");
    } catch (e) {
      showToast("err", getApiErrorMessage(e, "No se pudo procesar la solicitud"));
    } finally {
      setReviewLoading(null);
    }
  }

  const pending = requests.filter(r => r.status === "pending");
  const reviewed = requests.filter(r => r.status !== "pending");

  return (
    <div className="space-y-4">
      {toast && (
        <div className={cx("rounded-2xl border px-5 py-3 text-sm font-bold flex items-center gap-3", toast.type === "ok" ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-rose-50 border-rose-100 text-rose-700")}>
          {toast.type === "ok" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      <div className="rounded-[40px] border border-k-border bg-k-bg-card shadow-k-card overflow-hidden">
        <div className="px-8 py-6 border-b border-k-border flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-k-text-h tracking-tight">Cambios de Horario de Comida</h3>
            <p className="text-[10px] font-bold text-k-text-b uppercase tracking-widest mt-1">{pending.length} pendiente{pending.length !== 1 ? "s" : ""} de revisión</p>
          </div>
          <button onClick={loadRequests} disabled={loading} className="h-9 w-9 rounded-xl border border-k-border flex items-center justify-center hover:bg-k-bg-card2 transition">
            <RefreshCw className={cx("h-4 w-4 text-k-text-b", loading && "animate-spin")} />
          </button>
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
            {pending.map(req => (
              <div key={req.id} className="px-8 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                      <UtensilsCrossed className="h-5 w-5 text-amber-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-black text-k-text-h">{req.empleado_name ?? "—"}</div>
                      <div className="text-xs font-bold text-k-text-b mt-0.5">
                        {req.current_meal_start_time ? `Hora actual: ${req.current_meal_start_time} → ` : ""}Solicita: {req.requested_meal_start_time} · {req.duration_minutes} min
                      </div>
                    </div>
                  </div>
                  <AbsenceStatusBadge status={req.status} />
                </div>
                <div className="mt-3 text-sm text-k-text-b bg-neutral-50 rounded-xl px-4 py-2.5">
                  <span className="font-bold">Justificación:</span> {req.justification}
                </div>
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-3.5 w-3.5 text-k-text-b shrink-0" />
                    <input type="text" placeholder="Nota opcional..." value={noteInputs[req.id] ?? ""} onChange={e => setNoteInputs(prev => ({ ...prev, [req.id]: e.target.value }))} className="flex-1 rounded-xl border border-k-border bg-k-bg-card2 px-3 py-1.5 text-xs font-medium outline-none focus:ring-2 focus:ring-obsidian/10 transition" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleReview(req.id, "approved")} disabled={reviewLoading === req.id + "approved"} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition disabled:opacity-50">
                      {reviewLoading === req.id + "approved" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ThumbsUp className="h-3.5 w-3.5" />}Aprobar
                    </button>
                    <button onClick={() => handleReview(req.id, "rejected")} disabled={reviewLoading === req.id + "rejected"} className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 border border-rose-200 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100 transition disabled:opacity-50">
                      {reviewLoading === req.id + "rejected" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ThumbsDown className="h-3.5 w-3.5" />}Rechazar
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
            {reviewed.slice(0, 10).map(req => (
              <div key={req.id} className="px-8 py-4 flex items-start gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-k-text-h">{req.empleado_name ?? "—"}</span>
                    <span className="text-k-text-b">·</span>
                    <span className="text-xs text-k-text-b">{req.requested_meal_start_time} · {req.duration_minutes} min</span>
                  </div>
                </div>
                <AbsenceStatusBadge status={req.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EnComidaTab() {
  const [rows, setRows] = useState<EnComidaRow[]>([]);
  const [meta, setMeta] = useState<{ current_server_time: string; meal_duration_minutes: number; count: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getEnComida();
      setRows(res.data);
      setMeta(res.meta);
      setErr(null);
    } catch (e) {
      setErr(getApiErrorMessage(e, "No se pudo cargar el estado de comidas"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    const i = setInterval(load, 60000);
    return () => clearInterval(i);
  }, [load]);

  return (
    <div className="space-y-4">
      {err && (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm font-medium text-rose-700 flex items-center gap-3">
          <AlertTriangle className="h-4 w-4 shrink-0" />{err}
        </div>
      )}

      <div className="rounded-[40px] border border-k-border bg-k-bg-card shadow-k-card overflow-hidden">
        <div className="px-8 py-6 border-b border-k-border flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-k-text-h tracking-tight">En comida</h3>
            <p className="text-[10px] font-bold text-k-text-b uppercase tracking-widest mt-1">
              {rows.length} empleado{rows.length !== 1 ? "s" : ""} · Duración configurada: {meta?.meal_duration_minutes ?? 30} min
            </p>
          </div>
          <button onClick={load} disabled={loading} className="h-9 w-9 rounded-xl border border-k-border flex items-center justify-center hover:bg-k-bg-card2 transition">
            <RefreshCw className={cx("h-4 w-4 text-k-text-b", loading && "animate-spin")} />
          </button>
        </div>

        {loading && rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-k-text-b">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="text-xs font-bold uppercase tracking-widest">Cargando...</span>
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center">
            <UtensilsCrossed className="h-10 w-10 text-neutral-100 mx-auto mb-3" />
            <p className="text-xs font-bold text-k-text-b uppercase tracking-widest">Nadie está en comida ahora</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-50">
            {rows.map(row => {
              const start = new Date(row.lunch_start_at);
              const elapsed = Math.max(0, Math.floor((now.getTime() - start.getTime()) / 60000));
              const overtime = Math.max(0, elapsed - (meta?.meal_duration_minutes ?? 30));
              return (
                <div key={row.attendance_day_id} className={cx("px-8 py-5 flex items-center justify-between gap-4", row.is_overtime && "bg-rose-50/40")}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cx("h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 border", row.is_overtime ? "bg-rose-50 border-rose-100 text-rose-500" : "bg-emerald-50 border-emerald-100 text-emerald-500")}>
                      <UtensilsCrossed className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-black text-k-text-h truncate">{row.employee_name}</div>
                      <div className="text-xs text-k-text-b">Inició a las {start.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={cx("text-lg font-black tabular-nums", row.is_overtime ? "text-rose-600" : "text-k-text-h")}>
                      {minutesToHHMM(elapsed)}
                    </div>
                    {overtime > 0 && (
                      <div className="text-xs font-bold text-rose-500">+{minutesToHHMM(overtime)} excedido</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Panel de horas extras (Admin) ───────────────────────────────────────────
function OvertimeRequestsTab() {
  const [requests, setRequests] = useState<OvertimeRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [reviewLoading, setReviewLoading] = useState<string | null>(null);
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  function showToast(type: "ok" | "err", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPendingOvertimeRequests();
      setRequests(data);
    } catch (e) {
      showToast("err", getApiErrorMessage(e, "No se pudieron cargar"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  async function handleReview(id: string, status: "approved" | "rejected") {
    setReviewLoading(id + status);
    try {
      const updated = await reviewOvertimeRequest(id, status, noteInputs[id] ?? "");
      setRequests(prev => prev.map(r => r.id === id ? updated : r));
      showToast("ok", status === "approved" ? "Horas extras aprobadas" : "Horas extras rechazadas");
    } catch (e) {
      showToast("err", getApiErrorMessage(e, "No se pudo procesar"));
    } finally {
      setReviewLoading(null);
    }
  }

  const pending = requests.filter(r => r.status === "pending");
  const reviewed = requests.filter(r => r.status !== "pending");

  return (
    <div className="space-y-4">
      {toast && (
        <div className={cx("rounded-2xl border px-5 py-3 text-sm font-bold flex items-center gap-3", toast.type === "ok" ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-rose-50 border-rose-100 text-rose-700")}>
          {toast.type === "ok" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      <div className="rounded-[40px] border border-k-border bg-k-bg-card shadow-k-card overflow-hidden">
        <div className="px-8 py-6 border-b border-k-border flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-k-text-h tracking-tight">Solicitudes de Horas Extras</h3>
            <p className="text-[10px] font-bold text-k-text-b uppercase tracking-widest mt-1">{pending.length} pendiente{pending.length !== 1 ? "s" : ""} de revisión</p>
          </div>
          <button onClick={loadRequests} disabled={loading} className="h-9 w-9 rounded-xl border border-k-border flex items-center justify-center hover:bg-k-bg-card2 transition">
            <RefreshCw className={cx("h-4 w-4 text-k-text-b", loading && "animate-spin")} />
          </button>
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
            {pending.map(req => (
              <div key={req.id} className="px-8 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
                      <Clock className="h-5 w-5 text-violet-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-black text-k-text-h">{req.empleado_name ?? "Empleado"}</div>
                      <div className="text-xs font-bold text-k-text-b mt-0.5">
                        {new Date((req.fecha ?? "") + "T12:00:00").toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                      </div>
                      <p className="text-xs text-k-text-b mt-1.5 line-clamp-3">{req.motivo}</p>
                      <div className="text-[10px] font-bold text-violet-600 mt-1">{req.minutos_solicitados} min solicitados</div>
                    </div>
                  </div>
                  <AbsenceStatusBadge status={req.status} />
                </div>
                <div className="mt-4 ml-13 pl-0 sm:pl-13">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-3.5 w-3.5 text-k-text-b shrink-0" />
                    <input type="text" placeholder="Nota opcional..." value={noteInputs[req.id] ?? ""} onChange={e => setNoteInputs(prev => ({ ...prev, [req.id]: e.target.value }))} className="flex-1 rounded-xl border border-k-border bg-k-bg-card2 px-3 py-1.5 text-xs font-medium outline-none focus:ring-2 focus:ring-obsidian/10 transition" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleReview(req.id, "approved")} disabled={reviewLoading === req.id + "approved"} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition disabled:opacity-50">
                      {reviewLoading === req.id + "approved" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ThumbsUp className="h-3.5 w-3.5" />}Aprobar
                    </button>
                    <button onClick={() => handleReview(req.id, "rejected")} disabled={reviewLoading === req.id + "rejected"} className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 border border-rose-200 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100 transition disabled:opacity-50">
                      {reviewLoading === req.id + "rejected" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ThumbsDown className="h-3.5 w-3.5" />}Rechazar
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
            {reviewed.slice(0, 10).map(req => (
              <div key={req.id} className="px-8 py-4 flex items-start gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-k-text-h">{req.empleado_name ?? "Empleado"}</span>
                    <span className="text-k-text-b">·</span>
                    <span className="text-xs text-k-text-b">{new Date((req.fecha ?? "") + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short" })}</span>
                  </div>
                  {req.reviewer_note && <p className="text-xs text-k-text-b mt-0.5 italic">"{req.reviewer_note}"</p>}
                </div>
                <AbsenceStatusBadge status={req.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Panel de oportunidades de llegada tarde (Admin) ─────────────────────────
function LateArrivalRequestsTab() {
  const [requests, setRequests] = useState<LateArrivalRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [reviewLoading, setReviewLoading] = useState<string | null>(null);
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  function showToast(type: "ok" | "err", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPendingLateArrivalRequests();
      setRequests(data);
    } catch (e) {
      showToast("err", getApiErrorMessage(e, "No se pudieron cargar las solicitudes"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  async function handleReview(id: string, status: "approved" | "rejected") {
    setReviewLoading(id + status);
    try {
      const updated = await reviewLateArrivalRequest(id, status, noteInputs[id] ?? "");
      setRequests(prev => prev.map(r => r.id === id ? updated : r));
      showToast("ok", status === "approved" ? "Oportunidad aprobada" : "Oportunidad rechazada");
    } catch (e) {
      showToast("err", getApiErrorMessage(e, "No se pudo procesar la solicitud"));
    } finally {
      setReviewLoading(null);
    }
  }

  const pending = requests.filter(r => r.status === "pending");
  const reviewed = requests.filter(r => r.status !== "pending");

  return (
    <div className="space-y-4">
      {toast && (
        <div className={cx("rounded-2xl border px-5 py-3 text-sm font-bold flex items-center gap-3", toast.type === "ok" ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-rose-50 border-rose-100 text-rose-700")}>
          {toast.type === "ok" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      <div className="rounded-[40px] border border-k-border bg-k-bg-card shadow-k-card overflow-hidden">
        <div className="px-8 py-6 border-b border-k-border flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-k-text-h tracking-tight">Oportunidades de Llegada Tarde</h3>
            <p className="text-[10px] font-bold text-k-text-b uppercase tracking-widest mt-1">{pending.length} pendiente{pending.length !== 1 ? "s" : ""} de revisión</p>
          </div>
          <button onClick={loadRequests} disabled={loading} className="h-9 w-9 rounded-xl border border-k-border flex items-center justify-center hover:bg-k-bg-card2 transition">
            <RefreshCw className={cx("h-4 w-4 text-k-text-b", loading && "animate-spin")} />
          </button>
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
            {pending.map(req => (
              <div key={req.id} className="px-8 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                      <Clock className="h-5 w-5 text-amber-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-black text-k-text-h">{req.empleado_name}</div>
                      <div className="text-xs font-bold text-k-text-b mt-0.5">
                        {new Date((req.date ?? "") + "T12:00:00").toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                      </div>
                      <p className="text-xs text-k-text-b mt-1.5 line-clamp-3">{req.motivo}</p>
                    </div>
                  </div>
                  <AbsenceStatusBadge status={req.status} />
                </div>
                <div className="mt-4 ml-13 pl-0 sm:pl-13">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-3.5 w-3.5 text-k-text-b shrink-0" />
                    <input type="text" placeholder="Nota opcional para el empleado..." value={noteInputs[req.id] ?? ""} onChange={e => setNoteInputs(prev => ({ ...prev, [req.id]: e.target.value }))} className="flex-1 rounded-xl border border-k-border bg-k-bg-card2 px-3 py-1.5 text-xs font-medium outline-none focus:ring-2 focus:ring-obsidian/10 transition" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleReview(req.id, "approved")} disabled={reviewLoading === req.id + "approved"} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition disabled:opacity-50">
                      {reviewLoading === req.id + "approved" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ThumbsUp className="h-3.5 w-3.5" />}Aprobar
                    </button>
                    <button onClick={() => handleReview(req.id, "rejected")} disabled={reviewLoading === req.id + "rejected"} className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 border border-rose-200 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100 transition disabled:opacity-50">
                      {reviewLoading === req.id + "rejected" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ThumbsDown className="h-3.5 w-3.5" />}Rechazar
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
            {reviewed.slice(0, 10).map(req => (
              <div key={req.id} className="px-8 py-4 flex items-start gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-k-text-h">{req.empleado_name}</span>
                    <span className="text-k-text-b">·</span>
                    <span className="text-xs text-k-text-b">{new Date((req.date ?? "") + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short" })}</span>
                  </div>
                  {req.reviewer_note && <p className="text-xs text-k-text-b mt-0.5 italic">"{req.reviewer_note}"</p>}
                </div>
                <AbsenceStatusBadge status={req.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
  const colors = ["bg-blue-100 text-blue-700","bg-violet-100 text-violet-700","bg-emerald-100 text-emerald-700","bg-amber-100 text-amber-700","bg-rose-100 text-rose-700","bg-sky-100 text-sky-700"];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={cx("h-10 w-10 rounded-2xl flex items-center justify-center text-xs font-bold shrink-0", color)}>
      {initials}
    </div>
  );
}

type BadgeTone = "emerald" | "rose" | "amber" | "sky" | "violet" | "orange" | "neutral";

function Badge({
  children,
  tone,
  dot,
  pulse,
}: {
  children: React.ReactNode;
  tone: BadgeTone;
  dot?: boolean;
  pulse?: boolean;
}) {
  const toneStyles: Record<BadgeTone, string> = {
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-600",
    rose: "border-rose-100 bg-rose-50 text-rose-600",
    amber: "border-amber-100 bg-amber-50 text-amber-600",
    sky: "border-sky-100 bg-sky-50 text-sky-600",
    violet: "border-violet-100 bg-violet-50 text-violet-600",
    orange: "border-orange-200 bg-orange-50 text-orange-700",
    neutral: "border-k-border bg-k-bg-card2 text-k-text-b",
  };
  const dotColor: Record<BadgeTone, string> = {
    emerald: "bg-emerald-500",
    rose: "bg-rose-500",
    amber: "bg-amber-400",
    sky: "bg-sky-500",
    violet: "bg-violet-500",
    orange: "bg-orange-500",
    neutral: "bg-neutral-400",
  };
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider", toneStyles[tone])}>
      {dot && <span className={cx("h-1.5 w-1.5 rounded-full", dotColor[tone], pulse && "animate-pulse")} />}
      {children}
    </span>
  );
}

function StatusBadge({ item, isAbsent }: { item?: ByDateItem; isAbsent?: boolean }) {
  // Sin registro alguno → Ausente
  if (!item || isAbsent) {
    return <Badge tone="rose" dot>Ausente</Badge>;
  }

  const checkedIn = !!item.first_check_in_at;
  const closed = item.status === "closed" || !!item.last_check_out_at;

  if (item.status === "holiday") return <Badge tone="violet" dot>Festivo</Badge>;

  if ((item as any).is_rest_day || (item as any).state === "rest")
    return <Badge tone="sky">Descanso</Badge>;

  // Retardo: llegó, pero el backend lo marcó como "late"
  if (item.status === "late") return <Badge tone="amber" dot>Retardo</Badge>;

  if (!checkedIn) return <Badge tone="neutral" dot>Ausente</Badge>;

  if (closed) {
    // Salida anticipada: cerró pero no completó sus horas
    if (item.early_departure_minutes && item.early_departure_minutes > 0) {
      return <Badge tone="orange" dot>Salida anticipada</Badge>;
    }
    return <Badge tone="emerald" dot>Presente</Badge>;
  }

  return <Badge tone="amber" dot pulse>En turno</Badge>;
}

function WeeklyPanel({ employees, date }: { employees: Employee[]; date: string }) {
  const [selectedEmp, setSelectedEmp] = useState<string>("");
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (employees.length > 0 && !selectedEmp) setSelectedEmp(employees[0].id);
  }, [employees, selectedEmp]);

  useEffect(() => {
    if (!selectedEmp) return;
    let alive = true;
    setLoading(true);
    setErr(null);
    setSummary(null);
    getWeeklySummary(selectedEmp, date)
      .then((res) => { if (alive) setSummary(res); })
      .catch((e: any) => { if (alive) setErr(getApiErrorMessage(e, "Error")); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [selectedEmp, date]);

  return (
    <div className="rounded-[40px] border border-k-border bg-k-bg-card shadow-k-card overflow-hidden">
      <div className="px-8 py-6 border-b border-k-border flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-k-text-h tracking-tight">Resumen Semanal</h3>
          <p className="text-[10px] font-bold text-k-text-b uppercase tracking-widest mt-1">Horas trabajadas, pausas y horas pagables</p>
        </div>
        <select
          className="rounded-2xl border border-k-border px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-obsidian/10"
          value={selectedEmp}
          onChange={(e) => setSelectedEmp(e.target.value)}
        >
          {employees.map((e) => (
            <option key={e.id} value={e.id}>{e.full_name ?? e.name ?? e.id}</option>
          ))}
        </select>
      </div>
      <div className="p-8">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-8 text-k-text-b">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-xs font-bold uppercase tracking-widest">Cargando...</span>
          </div>
        ) : err ? (
          <div className="text-sm font-medium text-rose-500 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />{err}
          </div>
        ) : summary ? (
          <div className="space-y-5">
            <div className="text-xs font-bold text-k-text-b uppercase tracking-widest">
              Semana: <span className="text-k-text-h">{summary.week.from} → {summary.week.to}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Trabajadas", val: minutesToHHMM(summary.totals.worked_minutes), icon: Clock },
                { label: "Pausas", val: minutesToHHMM(summary.totals.break_minutes), icon: Timer },
                { label: "Descanso pagado", val: minutesToHHMM(summary.totals.paid_rest_minutes), icon: Calendar },
                { label: "Horas pagables", val: minutesToHHMM(summary.totals.payable_minutes), icon: CheckCircle2, highlight: true },
              ].map((kpi) => (
                <div key={kpi.label} className={cx(
                  "rounded-[28px] border p-5 text-center",
                  kpi.highlight ? "bg-k-bg-sidebar text-white border-obsidian" : "bg-k-bg-card2/50 border-k-border"
                )}>
                  <kpi.icon className={cx("h-5 w-5 mx-auto mb-2", kpi.highlight ? "text-white/40" : "text-neutral-200")} />
                  <div className={cx("text-2xl font-black", kpi.highlight ? "" : "text-k-text-h")}>{kpi.val}</div>
                  <div className={cx("text-[10px] font-bold uppercase tracking-widest mt-1", kpi.highlight ? "text-white/40" : "text-k-text-b")}>{kpi.label}</div>
                </div>
              ))}
            </div>
            <div className="text-xs font-bold text-k-text-b uppercase tracking-widest">
              Jornada: <span className="text-k-text-h">{summary.empleado.daily_hours}h/día</span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function ManagerAttendancePage() {
  const [tab, setTab] = useState<"daily" | "weekly" | "requests" | "meal-schedule" | "en-comida" | "overtime" | "late-arrivals">("daily");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [items, setItems] = useState<ByDateItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ajustando, setAjustando] = useState<{empleadoId:string;empleadoNombre:string;checkIn?:string;checkOut?:string}|null>(null);
  const [descansoAdmin, setDescansoAdmin] = useState<{empleadoId:string;empleadoNombre:string;tieneDiaDescanso:boolean}|null>(null);
  const [cerrarMasivo, setCerrarMasivo] = useState(false);

  const loadDay = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const { listEmployees } = await import("@/features/tasks/employeeApi");
      const [dayRes, empRes] = await Promise.all([getByDate(date), listEmployees()]);
      setItems(dayRes.items ?? []);
      const empArr = Array.isArray(empRes) ? empRes : [];
      setEmployees(empArr);
    } catch (e) {
      setErr(getApiErrorMessage(e, "No se pudo cargar asistencia"));
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { loadDay(); }, [loadDay]);

  const checkedIn = items.filter((i) => !!i.first_check_in_at).length;
  const closed = items.filter((i) => !!i.last_check_out_at).length;
  const onShift = items.filter((i) => !!i.first_check_in_at && !i.last_check_out_at).length;
  const absent = Math.max(0, employees.length - checkedIn);
  const totalEmps = employees.length || 1;

  const dateLabel = formatDateShort(date + "T12:00:00");

  return (
    <div className="space-y-6">
      <PageHeader
        compact
        title={`Control de Asistencia · ${dateLabel}`}
        actions={
          <>
            <input
              type="date"
              className="rounded-xl border border-k-border bg-k-bg-card2 px-3 py-2 text-xs font-bold text-k-text-h outline-none focus:ring-2 focus:ring-obsidian/10"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            {onShift > 0 && (
              <button
                onClick={() => setCerrarMasivo(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100 transition"
                title="Cerrar jornada de todos los empleados en turno"
              >
                <Lock className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Cerrar jornada masiva</span>
                <span className="sm:hidden">Cerrar</span>
              </button>
            )}
            <button
              onClick={loadDay}
              className="h-9 w-9 rounded-xl border border-k-border bg-k-bg-card hover:bg-k-bg-card2 flex items-center justify-center transition"
            >
              <RefreshCw className={cx("h-4 w-4 text-k-text-b", loading && "animate-spin")} />
            </button>
          </>
        }
      />

      <div className="flex items-center gap-1 bg-neutral-100/80 rounded-2xl p-1">
        {([
          { key: "daily",          label: "Por Día" },
          { key: "weekly",         label: "Por Semana" },
          { key: "requests",       label: "Ausencias" },
          { key: "meal-schedule",  label: "Horarios de Comida" },
          { key: "en-comida",      label: "En Comida" },
          { key: "overtime",       label: "Horas Extras" },
          { key: "late-arrivals",  label: "Oportunidades" },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cx(
              "px-4 py-1.5 rounded-xl text-xs font-bold transition",
              tab === t.key ? "bg-k-bg-card shadow-k-card text-k-text-h" : "text-k-text-b hover:text-neutral-600"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {err && (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm font-medium text-rose-700 flex items-center gap-3">
          <AlertTriangle className="h-4 w-4 shrink-0" />{err}
        </div>
      )}

      {tab === "daily" ? (
        <>
            {isEnabled("newManagementAdmin") && checkedIn === 0 && onShift === 0 && closed === 0 ? (
              <EmptyState
                variant="neutral"
                title="Esperando registros del día"
                description="El equipo aún no marca entrada."
              />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* KPIs Asistencia */}
                <div className="rounded-[24px] border border-k-border bg-k-bg-card p-4 shadow-k-card flex items-stretch">
                  {[
                    { label: "Presentes", val: checkedIn, pct: Math.round((checkedIn / totalEmps) * 100), icon: Users, numCls: "text-emerald-500", labelCls: "text-emerald-600" },
                    { label: "Ausentes", val: absent, pct: Math.round((absent / totalEmps) * 100), icon: UserX, numCls: "text-rose-500", labelCls: "text-rose-600" },
                    { label: "En turno", val: onShift, pct: Math.round((onShift / totalEmps) * 100), icon: Clock, numCls: "text-sky-500", labelCls: "text-sky-600" },
                  ].map(k => (
                    <div key={k.label} className="flex-1 flex flex-col items-center justify-center text-center border-r border-k-border last:border-0 px-2 py-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <k.icon className={cx("h-4 w-4", k.numCls)} />
                        <span className={cx("text-[10px] font-bold uppercase tracking-wider", k.labelCls)}>{k.label}</span>
                      </div>
                      <div className="text-2xl font-black text-k-text-h leading-none">{k.val}</div>
                      <div className="text-[9px] font-bold text-k-text-b mt-0.5">{k.pct}%</div>
                    </div>
                  ))}
                </div>

                {/* Resumen del día */}
                <div className="rounded-[24px] border border-k-border bg-k-bg-card p-4 shadow-k-card flex flex-col justify-center gap-2">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-k-text-b">Turnos cerrados</div>
                      <div className="text-base font-black text-k-text-h">{closed}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-k-text-b">En turno activo</div>
                      <div className="text-base font-black text-k-text-h">{onShift}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-k-text-b">Sin entrada</div>
                      <div className="text-base font-black text-k-text-h">{absent}</div>
                    </div>
                  </div>
                  <div className="mt-1">
                    <div className="flex items-center justify-between text-[10px] font-bold text-k-text-b uppercase tracking-widest mb-1">
                      <span>Asistencia</span>
                      <span className="text-k-text-h">{Math.round((checkedIn / totalEmps) * 100)}%</span>
                    </div>
                    <div className="h-1 w-full bg-neutral-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.round((checkedIn / totalEmps) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Table */}
            <div className="rounded-[40px] border border-k-border bg-k-bg-card shadow-k-card overflow-hidden mt-6">
              <div className="px-8 py-6 border-b border-k-border">
                <h3 className="text-lg font-black text-k-text-h tracking-tight">Registro de Asistencia</h3>
                <p className="text-[10px] font-bold text-k-text-b uppercase tracking-widest mt-1">
                  {items.length} registros · {employees.length} empleados
                </p>
              </div>
              {loading ? (
                <div className="p-16 flex flex-col items-center gap-3 text-k-text-b">
                  <div className="h-10 w-10 border-4 border-k-border border-t-obsidian rounded-full animate-spin" />
                  <span className="text-xs font-bold uppercase tracking-widest">Cargando registros...</span>
                </div>
              ) : employees.length === 0 ? (
                <div className="p-16 flex flex-col items-center gap-4 text-center">
                  <Users className="h-12 w-12 text-neutral-100" />
                  <p className="text-xs font-bold text-k-text-b uppercase tracking-widest">Sin nómina (no hay empleados activos)</p>
                </div>
              ) : (isEnabled("newManagementAdmin") && checkedIn === 0 && onShift === 0 && closed === 0) ? (
                <EmptyState
                  variant="action"
                  title="Aún no hay asistencias"
                  description="Todos los empleados están pendientes de marcar entrada."
                  action={{
                    label: "Registrar entrada manual",
                    onClick: () => {
                      if (employees.length > 0) {
                        const firstEmp = employees[0];
                        setAjustando({
                          empleadoId: firstEmp.id,
                          empleadoNombre: firstEmp.full_name ?? firstEmp.name ?? "Empleado",
                        });
                      }
                    }
                  }}
                />
              ) : (
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-k-bg-card2/80 border-b border-k-border">
                      <tr>
                        {["Empleado", "Entrada", "Salida", "Estado", "Horas", ""].map((h) => (
                          <th key={h} className="text-left px-5 py-4 text-[10px] font-bold text-k-text-b uppercase tracking-[0.1em]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map((emp) => {
                        const item = items.find((i) => i.empleado_id === emp.id);
                        const empName = emp.full_name ?? emp.name ?? "Empleado";
                        const tieneDiaDescanso = item?.status === 'day_off' || (item as any)?.is_rest_day;

                        return (
                          <tr key={emp.id} className="group border-t border-k-border hover:bg-k-bg-card2/50 transition">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <Avatar name={empName} />
                                <div>
                                  <div className="text-sm font-bold text-k-text-h">{empName}</div>
                                  {emp.position_title && <div className="text-[10px] text-k-text-b mt-0.5">{emp.position_title}</div>}
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 font-bold text-sm text-k-text-h">
                              {item?.first_check_in_at ? formatTime(item.first_check_in_at) : "—"}
                              {item?.late_minutes && item.late_minutes > 0 && (
                                <span className="ml-1.5 text-[10px] font-bold text-amber-500">+{item.late_minutes}min</span>
                              )}
                            </td>
                            <td className="px-5 py-4 text-sm text-k-text-b">
                              {item?.last_check_out_at ? formatTime(item.last_check_out_at) : "—"}
                              {item?.early_departure_minutes && item.early_departure_minutes > 0 && (
                                <div className="text-[10px] text-orange-500 font-bold mt-0.5">
                                  -{item.early_departure_minutes}min de jornada
                                </div>
                              )}
                              {item?.required_exit_time && !item?.last_check_out_at && (
                                <div className="text-[10px] text-amber-500 font-bold mt-0.5">
                                  Hasta {formatTime(item.required_exit_time)}
                                </div>
                              )}
                            </td>
                            <td className="px-5 py-4">
                              <StatusBadge item={item} isAbsent={!item} />
                            </td>
                            <td className="px-5 py-4 font-black text-sm text-k-text-h">
                              {item?.totals ? minutesToHHMM(item.totals.worked_minutes) : "—"}
                            </td>
                            <td className="px-5 py-4">
                              {/* Mobile: ActionMenu always visible */}
                              <div className="md:hidden">
                                <ActionMenu
                                  actions={[
                                    {
                                      label: item?.first_check_in_at ? "Ajustar horario" : "Registrar entrada",
                                      icon: Pencil,
                                      onClick: () => setAjustando({
                                        empleadoId: emp.id,
                                        empleadoNombre: empName,
                                        checkIn: item?.first_check_in_at
                                          ? new Date(item.first_check_in_at).toTimeString().slice(0, 5)
                                          : undefined,
                                        checkOut: item?.last_check_out_at
                                          ? new Date(item.last_check_out_at).toTimeString().slice(0, 5)
                                          : undefined,
                                      }),
                                    },
                                    {
                                      label: tieneDiaDescanso ? "Quitar descanso" : "Marcar descanso",
                                      icon: Calendar,
                                      onClick: () => setDescansoAdmin({
                                        empleadoId: emp.id,
                                        empleadoNombre: empName,
                                        tieneDiaDescanso,
                                      }),
                                    },
                                  ]}
                                />
                              </div>
                              {/* Desktop: visible buttons */}
                              <div className="hidden md:flex gap-1">
                                <button
                                  onClick={() => setAjustando({
                                    empleadoId: emp.id,
                                    empleadoNombre: empName,
                                    checkIn: item?.first_check_in_at
                                      ? new Date(item.first_check_in_at).toTimeString().slice(0, 5)
                                      : undefined,
                                    checkOut: item?.last_check_out_at
                                      ? new Date(item.last_check_out_at).toTimeString().slice(0, 5)
                                      : undefined,
                                  })}
                                  className="h-8 w-8 shrink-0 rounded-xl bg-k-bg-card2 border border-k-border flex items-center justify-center hover:bg-k-bg-card hover:border-k-border transition"
                                  title="Ajustar horario"
                                >
                                  <Pencil className="h-3.5 w-3.5 text-k-text-b" />
                                </button>
                                <button
                                  onClick={() => setDescansoAdmin({
                                    empleadoId: emp.id,
                                    empleadoNombre: empName,
                                    tieneDiaDescanso,
                                  })}
                                  className="h-8 w-8 shrink-0 rounded-xl bg-k-bg-card2 border border-k-border flex items-center justify-center hover:bg-k-bg-card hover:border-k-border transition text-sm"
                                  title="Gestionar día de descanso"
                                >
                                  🛋️
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>


        </>
      ) : tab === "weekly" ? (
        <WeeklyPanel employees={employees} date={date} />
      ) : tab === "meal-schedule" ? (
        <MealScheduleChangeRequestsTab />
      ) : tab === "en-comida" ? (
        <EnComidaTab />
      ) : tab === "overtime" ? (
        <OvertimeRequestsTab />
      ) : tab === "late-arrivals" ? (
        <LateArrivalRequestsTab />
      ) : (
        <AbsenceRequestsTab />
      )}

      {ajustando && (
        <AjustarAsistenciaModal
          empleadoId={ajustando.empleadoId}
          empleadoNombre={ajustando.empleadoNombre}
          fecha={date}
          checkInActual={ajustando.checkIn}
          checkOutActual={ajustando.checkOut}
          onClose={() => setAjustando(null)}
          onSaved={() => {
            setAjustando(null);
            loadDay();
          }}
        />
      )}

      {descansoAdmin && (
        <DiaDescansoAdminModal
          empleadoId={descansoAdmin.empleadoId}
          empleadoNombre={descansoAdmin.empleadoNombre}
          fecha={date}
          tieneDiaDescanso={descansoAdmin.tieneDiaDescanso}
          onClose={() => setDescansoAdmin(null)}
          onSaved={() => {
            setDescansoAdmin(null);
            loadDay();
          }}
        />
      )}

      {cerrarMasivo && (
        <CerrarJornadaModal
          date={date}
          employees={employees
            .filter((emp) => {
              const item = items.find((i) => i.empleado_id === emp.id);
              return !!item?.first_check_in_at && !item?.last_check_out_at;
            })
            .map((emp) => ({
              id: emp.id,
              name: emp.full_name ?? emp.name ?? "Empleado",
            }))}
          onClose={() => setCerrarMasivo(false)}
          onSaved={() => {
            setCerrarMasivo(false);
            loadDay();
          }}
        />
      )}
    </div>
  );
}
