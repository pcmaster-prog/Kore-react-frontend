// src/features/attendance/AttendanceCorrectionCard.tsx
// Tarjeta del empleado: "¿Olvidaste marcar tu entrada o salida?"
// Envía una solicitud que el admin aprueba con un clic.
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, Loader2, Send } from "lucide-react";
import { getApiErrorMessage } from "@/lib/error";
import { cx } from "@/lib/utils";
import {
  createCorrectionRequest,
  getMyCorrectionRequests,
  type AttendanceCorrectionRequest,
  type AttendanceCorrectionType,
} from "./api";

function todayISO(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function StatusPill({ status }: { status: AttendanceCorrectionRequest["status"] }) {
  const map = {
    pending: { cls: "bg-amber-50 text-amber-700 border-amber-200", label: "En revisión" },
    approved: { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Aplicada" },
    rejected: { cls: "bg-rose-50 text-rose-600 border-rose-200", label: "Rechazada" },
  } as const;
  const m = map[status];
  return (
    <span className={cx("rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", m.cls)}>
      {m.label}
    </span>
  );
}

export default function AttendanceCorrectionCard() {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(todayISO());
  const [type, setType] = useState<AttendanceCorrectionType>("check_in");
  const [time, setTime] = useState("");
  const [motivo, setMotivo] = useState("");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [requests, setRequests] = useState<AttendanceCorrectionRequest[]>([]);

  const load = useCallback(async () => {
    try {
      setRequests(await getMyCorrectionRequests());
    } catch {
      // silencioso: la lista es informativa
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function showToast(t: "ok" | "err", msg: string) {
    setToast({ type: t, msg });
    setTimeout(() => setToast(null), 4000);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!time || motivo.trim().length < 5) return;
    setSending(true);
    try {
      await createCorrectionRequest({ date, type, requested_time: time, motivo: motivo.trim() });
      showToast("ok", "Solicitud enviada. Tu administrador la revisará.");
      setTime("");
      setMotivo("");
      setOpen(false);
      await load();
    } catch (err) {
      showToast("err", getApiErrorMessage(err, "No se pudo enviar la solicitud"));
    } finally {
      setSending(false);
    }
  }

  const recent = requests.slice(0, 5);

  return (
    <div className="rounded-2xl border border-k-border bg-k-bg-card px-5 py-4">
      {toast && (
        <div
          className={cx(
            "mb-3 rounded-xl border px-4 py-2 text-xs font-bold flex items-center gap-2",
            toast.type === "ok"
              ? "bg-emerald-50 border-emerald-100 text-emerald-700"
              : "bg-rose-50 border-rose-100 text-rose-700"
          )}
        >
          {toast.type === "ok" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-10 w-10 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5 text-sky-600" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-black text-k-text-h tracking-tight">¿Olvidaste marcar?</div>
            <p className="text-xs text-k-text-b mt-0.5">
              Si se te pasó marcar tu entrada o salida, indica la hora real y tu administrador la registrará.
            </p>
          </div>
        </div>
        {!open && (
          <button
            onClick={() => setOpen(true)}
            className="shrink-0 rounded-xl bg-sky-50 border border-sky-200 px-3 py-2 text-xs font-bold text-sky-700 hover:bg-sky-100 transition"
          >
            Reportar
          </button>
        )}
      </div>

      {open && (
        <form onSubmit={submit} className="mt-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-k-text-b uppercase tracking-widest mb-1.5">Fecha</label>
              <input
                type="date"
                value={date}
                max={todayISO()}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-k-border bg-white px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-obsidian/10"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-k-text-b uppercase tracking-widest mb-1.5">Qué olvidaste</label>
              <div className="flex rounded-xl border border-k-border overflow-hidden">
                {(["check_in", "check_out"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={cx(
                      "flex-1 py-2 text-xs font-bold transition",
                      type === t ? "bg-k-bg-sidebar text-white" : "bg-white text-k-text-b hover:bg-k-bg-card2"
                    )}
                  >
                    {t === "check_in" ? "Entrada" : "Salida"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-k-text-b uppercase tracking-widest mb-1.5">Hora real</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-xl border border-k-border bg-white px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-obsidian/10"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-k-text-b uppercase tracking-widest mb-1.5">Motivo</label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={2}
              placeholder="Ej. Llegué a tiempo pero se me olvidó abrir la app..."
              className="w-full rounded-xl border border-k-border bg-white px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-obsidian/10 resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={sending || !time || motivo.trim().length < 5}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition disabled:opacity-50"
            >
              {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Enviar solicitud
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={sending}
              className="rounded-xl bg-k-bg-card2 border border-k-border px-4 py-2 text-xs font-bold text-k-text-b hover:bg-neutral-100 transition disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {recent.length > 0 && (
        <div className="mt-4 border-t border-k-border pt-3 space-y-2">
          {recent.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-3 text-xs">
              <div className="min-w-0">
                <span className="font-bold text-k-text-h">
                  {r.type === "check_in" ? "Entrada" : "Salida"} {r.requested_time}
                </span>
                <span className="text-k-text-b">
                  {" · "}
                  {new Date(r.date + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                </span>
                {r.status === "rejected" && r.reviewer_note && (
                  <div className="text-[11px] text-rose-500 italic truncate">"{r.reviewer_note}"</div>
                )}
              </div>
              <StatusPill status={r.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
