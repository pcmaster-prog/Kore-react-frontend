import { useState, useEffect, useCallback } from "react";
import {
  createOvertimeRequest,
  getMyOvertimeRequests,
  type OvertimeRequest,
} from "./api";
import { X, Loader2, Clock, CheckCircle2, AlertTriangle, Send } from "lucide-react";
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

export default function OvertimeRequestModal({ onClose, onSaved }: Props) {
  const [requests, setRequests] = useState<OvertimeRequest[]>([]);
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [motivo, setMotivo] = useState("");
  const [minutos, setMinutos] = useState("60");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  function showToast(type: "ok" | "err", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyOvertimeRequests();
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
    if (!motivo.trim() || motivo.trim().length < 5) { showToast("err", "Escribe un motivo de al menos 5 caracteres"); return; }
    const m = parseInt(minutos);
    if (!m || m < 15) { showToast("err", "Mínimo 15 minutos"); return; }
    setSending(true);
    try {
      await createOvertimeRequest({ fecha, motivo: motivo.trim(), minutos_solicitados: m });
      showToast("ok", "Solicitud enviada");
      setMotivo("");
      setMinutos("60");
      loadRequests();
      onSaved();
    } catch (e: any) {
      showToast("err", e?.response?.data?.message ?? "Error al enviar");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-[28px] w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        <div className="px-7 pt-7 pb-5 border-b border-neutral-100 flex items-start justify-between shrink-0">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5 text-violet-500" />
            </div>
            <div>
              <h2 className="text-lg font-black text-obsidian">Horas extras</h2>
              <p className="text-sm text-neutral-400 mt-1">Solicita tiempo adicional con aprobación de tu supervisor</p>
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
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-1.5 block">Fecha</label>
                <input
                  type="date"
                  value={fecha}
                  onChange={e => setFecha(e.target.value)}
                  className="w-full h-11 rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:ring-2 focus:ring-obsidian/10"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-1.5 block">Minutos estimados</label>
                <input
                  type="number"
                  min={15}
                  step={15}
                  value={minutos}
                  onChange={e => setMinutos(e.target.value)}
                  className="w-full h-11 rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:ring-2 focus:ring-obsidian/10"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-1.5 block">Motivo</label>
              <textarea
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
                rows={3}
                placeholder="Ej: Inventario mensual, cierre de proyecto..."
                className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-obsidian/10 resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={sending || !motivo.trim()}
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
                      <div className="text-sm font-bold text-obsidian truncate">{r.motivo}</div>
                      <div className="text-xs text-neutral-500">{new Date(r.fecha + "T12:00:00").toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "short" })} · {r.minutos_solicitados} min</div>
                    </div>
                    <StatusBadge status={r.status} />
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
