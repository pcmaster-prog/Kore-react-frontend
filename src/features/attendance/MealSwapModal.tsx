import { useState, useEffect, useCallback } from "react";
import {
  createMealSwap,
  getMyMealSwaps,
  acceptMealSwap,
  type MealSwapRequest,
} from "./api";
import { X, Loader2, UtensilsCrossed, CheckCircle2, AlertTriangle, Send, UserCheck } from "lucide-react";
import { cx } from "@/lib/utils";

type Props = {
  onClose: () => void;
  onSaved: () => void;
};

type Employee = { id: string; name: string };

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending:   { label: "Pendiente", cls: "bg-amber-50 border-amber-200 text-amber-700" },
    accepted:  { label: "Aceptada",  cls: "bg-sky-50 border-sky-200 text-sky-700" },
    approved:  { label: "Aprobada",  cls: "bg-emerald-50 border-emerald-200 text-emerald-700" },
    rejected:  { label: "Rechazada", cls: "bg-rose-50 border-rose-200 text-rose-700" },
  };
  const s = map[status] ?? { label: status, cls: "bg-neutral-50 border-neutral-200 text-neutral-700" };
  return <span className={cx("rounded-lg border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", s.cls)}>{s.label}</span>;
}

export default function MealSwapModal({ onClose, onSaved }: Props) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [swaps, setSwaps] = useState<MealSwapRequest[]>([]);
  const [receptorId, setReceptorId] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  function showToast(type: "ok" | "err", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  const loadSwaps = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, swapRes] = await Promise.all([
        import("@/features/tasks/employeeApi").then(m => m.listEmployees()),
        getMyMealSwaps(),
      ]);
      const empArr = Array.isArray(empRes) ? empRes : [];
      setEmployees(empArr.map((e: any) => ({ id: String(e.id), name: e.name ?? e.full_name ?? "—" })));
      setSwaps(swapRes);
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSwaps(); }, [loadSwaps]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!receptorId) { showToast("err", "Selecciona un compañero"); return; }
    setSending(true);
    try {
      await createMealSwap(receptorId, fecha);
      showToast("ok", "Solicitud enviada");
      setReceptorId("");
      loadSwaps();
      onSaved();
    } catch (e: any) {
      showToast("err", e?.response?.data?.message ?? "Error al enviar");
    } finally {
      setSending(false);
    }
  }

  async function handleAccept(id: string) {
    setLoading(true);
    try {
      await acceptMealSwap(id);
      showToast("ok", "Solicitud aceptada");
      loadSwaps();
      onSaved();
    } catch (e: any) {
      showToast("err", e?.response?.data?.message ?? "Error");
    } finally {
      setLoading(false);
    }
  }

  const received = swaps.filter(s => s.status === "pending");
  const history = swaps.filter(s => s.status !== "pending");

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
              <h2 className="text-lg font-black text-obsidian">Cambio de comida</h2>
              <p className="text-sm text-neutral-400 mt-1">Solicita cambiar tu horario con un compañero</p>
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

          {/* Nueva solicitud */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide">Nueva solicitud</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-1.5 block">Compañero</label>
                <select
                  value={receptorId}
                  onChange={e => setReceptorId(e.target.value)}
                  className="w-full h-11 rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:ring-2 focus:ring-obsidian/10 bg-white"
                >
                  <option value="">Seleccionar...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-1.5 block">Fecha</label>
                <input
                  type="date"
                  value={fecha}
                  onChange={e => setFecha(e.target.value)}
                  className="w-full h-11 rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:ring-2 focus:ring-obsidian/10"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={sending || !receptorId}
              className="inline-flex items-center gap-2 rounded-xl bg-obsidian text-white px-5 py-2.5 text-sm font-bold hover:bg-obsidian/90 transition disabled:opacity-50"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Enviar solicitud
            </button>
          </form>

          {/* Solicitudes recibidas */}
          {received.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide mb-2">Solicitudes recibidas</div>
              <div className="space-y-2">
                {received.map(s => (
                  <div key={s.id} className="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-obsidian truncate">{s.solicitante_name}</div>
                      <div className="text-xs text-neutral-500">{new Date(s.fecha + "T12:00:00").toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "short" })}</div>
                    </div>
                    <button
                      onClick={() => handleAccept(s.id)}
                      disabled={loading}
                      className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition disabled:opacity-50"
                    >
                      <UserCheck className="h-3.5 w-3.5" /> Aceptar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Historial */}
          {history.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide mb-2">Historial</div>
              <div className="space-y-2">
                {history.map(s => (
                  <div key={s.id} className="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-obsidian truncate">
                        {s.solicitante_id === s.receptor_id ? s.solicitante_name : `${s.solicitante_name} ↔ ${s.receptor_name}`}
                      </div>
                      <div className="text-xs text-neutral-500">{new Date(s.fecha + "T12:00:00").toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "short" })}</div>
                    </div>
                    <StatusBadge status={s.status} />
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
