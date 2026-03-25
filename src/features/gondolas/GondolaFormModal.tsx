// src/features/gondolas/GondolaFormModal.tsx
import { useState } from "react";
import { X } from "lucide-react";
import { createGondola, updateGondola } from "./api";
import type { Gondola } from "./types";

function cx(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(" ");
}

type Props = {
  gondola?: Gondola | null;
  onClose: () => void;
  onSaved: (g: Gondola) => void;
};

export default function GondolaFormModal({ gondola, onClose, onSaved }: Props) {
  const [nombre, setNombre] = useState(gondola?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(gondola?.descripcion ?? "");
  const [ubicacion, setUbicacion] = useState(gondola?.ubicacion ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) {
      setErr("El nombre es requerido");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const result = gondola
        ? await updateGondola(gondola.id, {
            nombre: nombre.trim(),
            descripcion: descripcion.trim() || undefined,
            ubicacion: ubicacion.trim() || undefined,
          })
        : await createGondola({
            nombre: nombre.trim(),
            descripcion: descripcion.trim() || undefined,
            ubicacion: ubicacion.trim() || undefined,
          });
      onSaved(result);
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "Error al guardar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-obsidian/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-md p-8 animate-in-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-obsidian tracking-tight">
            {gondola ? "Editar Góndola" : "Nueva Góndola"}
          </h2>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-xl bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4 text-neutral-500" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">
              Nombre <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Góndola 1 — Cartones"
              className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-medium text-obsidian outline-none focus:border-obsidian focus:ring-2 focus:ring-obsidian/10 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">
              Descripción <span className="text-neutral-300">(opcional)</span>
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              placeholder="Descripción breve de los productos que contiene..."
              className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-medium text-obsidian outline-none focus:border-obsidian focus:ring-2 focus:ring-obsidian/10 transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">
              Ubicación <span className="text-neutral-300">(opcional)</span>
            </label>
            <input
              type="text"
              value={ubicacion}
              onChange={(e) => setUbicacion(e.target.value)}
              placeholder="Ej. Pasillo 3, lado derecho"
              className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-medium text-obsidian outline-none focus:border-obsidian focus:ring-2 focus:ring-obsidian/10 transition-all"
            />
          </div>

          {err && (
            <div className="rounded-2xl bg-rose-50 border border-rose-100 px-4 py-3 text-sm text-rose-700 font-medium">
              {err}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 rounded-2xl border border-neutral-200 text-sm font-bold text-neutral-500 hover:bg-neutral-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={busy}
              className={cx(
                "flex-1 h-12 rounded-2xl text-sm font-bold text-white transition-all shadow-sm",
                busy
                  ? "bg-obsidian/60 cursor-not-allowed"
                  : "bg-obsidian hover:bg-gold",
              )}
            >
              {busy ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
