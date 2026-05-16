import { useState } from "react";
import { cerrarJornadaMasiva } from "./api";
import { X, Loader2, AlertTriangle, Lock } from "lucide-react";

type Props = {
  date: string;
  employees: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSaved: () => void;
};

export default function CerrarJornadaModal({ date, employees, onClose, onSaved }: Props) {
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const dateLabel = new Date(date + "T12:00:00").toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  async function handleConfirm() {
    if (!motivo.trim()) {
      setErr("El motivo del cierre es requerido");
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      await cerrarJornadaMasiva(date, motivo.trim());
      onSaved();
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "Error al cerrar las jornadas");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-[28px] w-full max-w-md shadow-2xl">
        <div className="px-7 pt-7 pb-5 border-b border-neutral-100 flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
              <Lock className="h-5 w-5 text-rose-500" />
            </div>
            <div>
              <h2 className="text-lg font-black text-obsidian">Cerrar jornada masiva</h2>
              <p className="text-sm text-neutral-400 mt-1">{dateLabel}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-xl flex items-center justify-center border border-neutral-100 hover:bg-neutral-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-7 py-6 space-y-4">
          {err && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-2.5 text-sm text-rose-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {err}
            </div>
          )}

          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Advertencia:</span> Esta acción cerrará la jornada de{" "}
              <span className="font-bold">{employees.length}</span> empleado
              {employees.length !== 1 ? "s" : ""} que aún no han marcado salida. Esta acción no se
              puede deshacer.
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-1.5 block">
              Motivo del cierre *
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: Cierre de turno por fin de jornada laboral..."
              rows={3}
              className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-obsidian/10 resize-none"
            />
          </div>

          <div>
            <div className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-2">
              Empleados afectados
            </div>
            <div className="max-h-32 overflow-y-auto rounded-xl border border-neutral-100 bg-neutral-50 divide-y divide-neutral-100">
              {employees.map((emp) => (
                <div key={emp.id} className="px-3 py-2 text-sm text-neutral-700">
                  {emp.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-7 pb-7 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-2xl border border-neutral-200 text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || !motivo.trim()}
            className="flex-1 h-11 rounded-2xl bg-rose-600 text-white text-sm font-bold hover:bg-rose-700 transition disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Cerrando..." : `Cerrar ${employees.length} jornada${employees.length !== 1 ? "s" : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}

