import { useState } from "react";
import { X, Calendar, AlertTriangle, Loader2 } from "lucide-react";
import api from "@/lib/http";

type Props = {
  empleadoId: string;
  empleadoNombre: string;
  fecha: string;
  tieneDiaDescanso: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export default function DiaDescansoAdminModal({
  empleadoId,
  empleadoNombre,
  fecha,
  tieneDiaDescanso,
  onClose,
  onSaved,
}: Props) {
  const [modalFecha, setModalFecha] = useState(fecha);
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleMarcar() {
    setLoading(true);
    setErr(null);
    try {
      await api.post("/asistencia/dia-descanso", {
        empleado_id: empleadoId,
        fecha: modalFecha,
        motivo,
      });
      onSaved();
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "Error al registrar día de descanso");
    } finally {
      setLoading(false);
    }
  }

  async function handleQuitar() {
    setLoading(true);
    setErr(null);
    try {
      await api.delete("/asistencia/dia-descanso", {
        data: {
          empleado_id: empleadoId,
          fecha: modalFecha,
        },
      });
      onSaved();
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "Error al eliminar día de descanso");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div className="absolute inset-0 bg-obsidian/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md overflow-hidden rounded-[32px] bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-obsidian tracking-tight">Gestionar Descanso</h2>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5">{empleadoNombre}</p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full border border-neutral-200 flex items-center justify-center hover:bg-neutral-50 transition"
          >
            <X className="h-4 w-4 text-neutral-400" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {err && (
            <div className="rounded-2xl bg-rose-50 border border-rose-100 p-4 text-sm text-rose-600 font-medium flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              {err}
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 block">Fecha seleccionada</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="date"
                value={modalFecha}
                onChange={(e) => setModalFecha(e.target.value)}
                className="w-full rounded-2xl border border-neutral-200 bg-white pl-10 pr-4 py-2.5 text-sm font-medium text-obsidian outline-none focus:ring-2 focus:ring-obsidian/10"
              />
            </div>
          </div>

          {!tieneDiaDescanso && (
            <div>
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 block">Motivo (opcional)</label>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ej. Por acuerdo previo, cambio de guardia..."
                rows={3}
                className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-obsidian outline-none focus:ring-2 focus:ring-obsidian/10"
              />
              <p className="text-[10px] text-neutral-400 mt-2">
                Si el empleado ya registró asistencia este día, el sistema no te dejará marcarlo como descanso. Usa "Ajustar Asistencia" en su lugar.
              </p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-neutral-50 bg-neutral-50/50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-neutral-500 hover:text-obsidian hover:bg-neutral-100 transition"
          >
            Cancelar
          </button>
          {tieneDiaDescanso ? (
            <button
              onClick={handleQuitar}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold uppercase tracking-widest hover:bg-rose-100 transition shadow-sm disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Quitar Día de Descanso
            </button>
          ) : (
            <button
              onClick={handleMarcar}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-obsidian text-white text-xs font-bold uppercase tracking-widest hover:bg-gold transition shadow-md shadow-obsidian/20 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Marcar Día de Descanso
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
