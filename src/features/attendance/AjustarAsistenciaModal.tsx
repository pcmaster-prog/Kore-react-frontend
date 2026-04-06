import { useState } from 'react';
import { ajustarAsistencia } from './api';
import { X, Loader2 } from 'lucide-react';

type Props = {
  empleadoId: string;
  empleadoNombre: string;
  fecha: string;
  checkInActual?: string | null;
  checkOutActual?: string | null;
  onClose: () => void;
  onSaved: () => void;
};

export default function AjustarAsistenciaModal({
  empleadoId, empleadoNombre, fecha,
  checkInActual, checkOutActual,
  onClose, onSaved,
}: Props) {
  const [checkIn, setCheckIn]   = useState(checkInActual ?? '');
  const [checkOut, setCheckOut] = useState(checkOutActual ?? '');
  const [motivo, setMotivo]     = useState('');
  const [saving, setSaving]     = useState(false);
  const [err, setErr]           = useState<string | null>(null);

  async function handleSave() {
    if (!motivo.trim()) {
      setErr('El motivo del ajuste es requerido');
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      await ajustarAsistencia(empleadoId, fecha, {
        first_check_in_at:  checkIn || undefined,
        last_check_out_at:  checkOut || undefined,
        motivo,
      });
      onSaved();
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-[28px] w-full max-w-md shadow-2xl">

        <div className="px-7 pt-7 pb-5 border-b border-neutral-100 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-black text-obsidian">Ajustar Asistencia</h2>
            <p className="text-sm text-neutral-400 mt-1">
              {empleadoNombre} · {new Date(fecha + 'T12:00:00').toLocaleDateString('es-MX', {
                weekday: 'long', day: 'numeric', month: 'long'
              })}
            </p>
          </div>
          <button onClick={onClose} className="h-9 w-9 rounded-xl flex items-center justify-center border border-neutral-100 hover:bg-neutral-100 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-7 py-6 space-y-4">
          {err && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-2.5 text-sm text-rose-700">
              {err}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-1.5 block">
                Hora de entrada
              </label>
              <input
                type="time"
                value={checkIn}
                onChange={e => setCheckIn(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-obsidian/10"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-1.5 block">
                Hora de salida
              </label>
              <input
                type="time"
                value={checkOut}
                onChange={e => setCheckOut(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-obsidian/10"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-1.5 block">
              Motivo del ajuste *
            </label>
            <textarea
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              placeholder="Ej: El empleado olvidó marcar entrada al llegar..."
              rows={3}
              className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-obsidian/10 resize-none"
            />
          </div>

          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-xs text-amber-800">
            Este ajuste quedará registrado en el historial de actividad con tu nombre y el motivo.
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
            onClick={handleSave}
            disabled={saving || (!checkIn && !checkOut)}
            className="flex-1 h-11 rounded-2xl bg-obsidian text-white text-sm font-bold hover:bg-obsidian/90 transition disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? 'Guardando...' : 'Guardar ajuste'}
          </button>
        </div>
      </div>
    </div>
  );
}
