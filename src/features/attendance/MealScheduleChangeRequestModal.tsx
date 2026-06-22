import { useState, useEffect, useCallback } from "react";
import {
  createMealScheduleChangeRequest,
  getMyMealScheduleChangeRequests,
  cancelMealScheduleChangeRequest,
  type MealScheduleChangeRequest,
} from "./api";
import { X, Loader2, UtensilsCrossed, CheckCircle2, AlertTriangle, Send, Trash2 } from "lucide-react";
import { cx } from "@/lib/utils";

type Props = {
  onClose: () => void;
  onSaved: () => void;
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending:  { label: "Pendiente", cls: "bg-amber-50 border-amber-200 text-amber-700" },
    approved: { label: "Aprobada",  cls: "bg-emerald-50 border-emerald-200 text-emerald-700" },
    rejected: { label: "Rechazada", cls: "bg-rose-50 border-rose-200 text-rose-700" },
  };
  const s = map[status] ?? { label: status, cls: "bg-neutral-50 border-neutral-200 text-neutral-700" };
  return <span className={cx("rounded-lg border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", s.cls)}>{s.label}</span>;
}

export default function MealScheduleChangeRequestModal({ onClose, onSaved }: Props) {
  const [requests, setRequests] = useState<MealScheduleChangeRequest[]>([]);
  const [requestedTime, setRequestedTime] = useState("14:00");
  const [duration, setDuration] = useState("30");
  const [justification, setJustification] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  function showToast(type: "ok" | "err", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyMealScheduleChangeRequests();
      setRequests(data);
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!requestedTime) { showToast("err", "Selecciona una hora"); return; }
    const d = parseInt(duration);
    if (!d || d < 10 || d > 120) { showToast("err", "Duración entre 10 y 120 minutos"); return; }
    if (!justification.trim() || justification.trim().length < 5) { showToast("err", "Escribe una justificación de al menos 5 caracteres"); return; }

    setSending(true);
    try {
      await createMealScheduleChangeRequest({
        requested_meal_start_time: requestedTime,
        duration_minutes: d,
        justification: justification.trim(),
      });
      showToast("ok", "Solicitud enviada");
      setJustification("");
      setDuration("30");
      loadRequests();
      onSaved();
    } catch (e: any) {
      showToast("err", e?.response?.data?.message ?? "Error al enviar");
    } finally {
      setSending(false);
    }
  }

  async function handleCancel(id: string) {
    setCancellingId(id);
    try {
      await cancelMealScheduleChangeRequest(id);
      showToast("ok", "Solicitud cancelada");
      loadRequests();
    } catch (e: any) {
      showToast("err", e?.response?.data?.message ?? "Error al cancelar");
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-[28px] w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        <div className="px-7 pt-7 pb-5 border-b border-neutral-100 flex items-start justify-between shrink-0">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
              <UtensilsCrossed className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-lg font-black text-obsidian">Cambiar horario de comida</h2>
              <p className="text-sm text-neutral-400 mt-1">Solicita un nuevo horario de comida con aprobación de tu supervisor</p>
            </div>
          </div>
          <button onClick={onClose} className="h-9 w-9 rounded-xl flex items-center justify-center border border-neutral-100 hover:bg-neutral-100 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-7 py-6 space-y-5 overflow-y-auto">
          {toast && (
            <div className={cx("rounded-xl border px-4 py-2.5 text-sm font-bold flex items-center gap-2", toast.type === "ok" ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-rose-50 border-rose-100 text-rose-700")}>
              {toast.type === "ok" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              {toast.msg}
            </div>
          )}

          {err && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-2.5 text-sm text-rose-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />{err}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide">Nueva solicitud</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-1.5 block">Nueva hora de comida</label>
                <input
                  type="time"
                  value={requestedTime}
                  onChange={e => setRequestedTime(e.target.value)}
                  className="w-full h-11 rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:ring-2 focus:ring-obsidian/10"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-1.5 block">Duración (min)</label>
                <input
                  type="number"
                  min={10}
                  max={120}
                  step={5}
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                  className="w-full h-11 rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:ring-2 focus:ring-obsidian/10"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-1.5 block">Justificación</label>
              <textarea
                value={justification}
                onChange={e => setJustification(e.target.value)}
                rows={3}
                placeholder="Ej: Tengo cita médica, necesito salir más tarde..."
                className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-obsidian/10 resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={sending || !requestedTime || !justification.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-obsidian text-white px-5 py-2.5 text-sm font-bold hover:bg-obsidian/90 transition disabled:opacity-50"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Enviar solicitud
            </button>
          </form>

          {/* Historial */}
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-neutral-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-xs font-bold uppercase tracking-widest">Cargando...</span>
            </div>
          ) : requests.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide mb-2">Mis solicitudes</div>
              <div className="space-y-2">
                {requests.map(r => (
                  <div key={r.id} className="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-obsidian truncate">{r.requested_meal_start_time} · {r.duration_minutes} min</div>
                      <div className="text-xs text-neutral-500 truncate">{r.justification}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={r.status} />
                      {r.status === "pending" && (
                        <button
                          onClick={() => handleCancel(r.id)}
                          disabled={cancellingId === r.id}
                          className="h-8 w-8 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100 transition disabled:opacity-50"
                          title="Cancelar"
                        >
                          {cancellingId === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
