import { useState, useEffect } from "react";
import type { GratificationType } from "../recibos.types";
import {
  listarTiposGratificacion,
  crearTipoGratificacion,
  actualizarTipoGratificacion,
  eliminarTipoGratificacion,
} from "../api";
import { cx } from "@/lib/utils";
import {
  Gift, Plus, Pencil, Trash2, Loader2, AlertTriangle,
  CheckCircle2, X, Save, ToggleLeft, ToggleRight
} from "lucide-react";

const FRECUENCIAS: Record<string, string> = {
  annual: "Anual",
  biannual: "Semestral",
  quarterly: "Trimestral",
  monthly: "Mensual",
  one_time: "Única vez",
};

export default function TiposGratificacionPage() {
  const [tipos, setTipos] = useState<GratificationType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<GratificationType["frequency"]>("annual");

  function showToast(type: "ok" | "err", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await listarTiposGratificacion();
      setTipos(res.data);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Error cargando tipos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditingId(null);
    setCode("");
    setName("");
    setDescription("");
    setFrequency("annual");
    setModalOpen(true);
  }

  function openEdit(tipo: GratificationType) {
    setEditingId(tipo.id);
    setCode(tipo.code);
    setName(tipo.name);
    setDescription(tipo.description ?? "");
    setFrequency(tipo.frequency);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!code.trim() || !name.trim()) {
      showToast("err", "Código y nombre son requeridos");
      return;
    }
    setSaving(true);
    try {
      const payload = { code: code.trim().toUpperCase(), name: name.trim(), description: description.trim() || null, frequency };
      if (editingId) {
        await actualizarTipoGratificacion(editingId, payload);
        showToast("ok", "Tipo actualizado");
      } else {
        await crearTipoGratificacion(payload);
        showToast("ok", "Tipo creado");
      }
      setModalOpen(false);
      await load();
    } catch (e: any) {
      showToast("err", e?.response?.data?.message ?? "Error guardando");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(tipo: GratificationType) {
    try {
      await actualizarTipoGratificacion(tipo.id, { is_active: !tipo.is_active });
      showToast("ok", tipo.is_active ? "Tipo desactivado" : "Tipo activado");
      await load();
    } catch (e: any) {
      showToast("err", e?.response?.data?.message ?? "Error actualizando");
    }
  }

  async function handleDelete(tipo: GratificationType) {
    if (!confirm(`¿Eliminar el tipo "${tipo.name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await eliminarTipoGratificacion(tipo.id);
      showToast("ok", "Tipo eliminado");
      await load();
    } catch (e: any) {
      showToast("err", e?.response?.data?.message ?? "Error eliminando");
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className={cx(
          "rounded-2xl border px-5 py-3 text-sm font-bold flex items-center gap-3 animate-in-fade",
          toast.type === "ok" ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-rose-50 border-rose-100 text-rose-700"
        )}>
          {toast.type === "ok" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-k-text-h tracking-tight">Tipos de Gratificación</h1>
          <p className="text-xs font-bold text-k-text-b uppercase tracking-widest mt-1">
            Configura los conceptos de pago extraordinario
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-2xl bg-k-bg-sidebar px-5 py-2.5 text-xs font-bold text-white hover:opacity-90 transition shadow-lg shadow-obsidian/20"
        >
          <Plus className="h-4 w-4" />
          Nuevo tipo
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-5 py-3 text-sm font-bold text-rose-700 flex items-center gap-3">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="rounded-[40px] border bg-k-bg-card p-20 flex flex-col items-center gap-4 text-k-text-b">
          <div className="h-10 w-10 border-4 border-k-border border-t-obsidian rounded-full animate-spin" />
          <span className="text-xs font-bold uppercase tracking-widest">Cargando tipos...</span>
        </div>
      ) : tipos.length === 0 ? (
        <div className="rounded-[40px] border bg-k-bg-card p-16 flex flex-col items-center gap-6 text-center">
          <div className="h-20 w-20 rounded-[28px] bg-k-bg-card2 border border-k-border flex items-center justify-center">
            <Gift className="h-10 w-10 text-neutral-200" />
          </div>
          <div>
            <div className="font-black text-2xl text-k-text-h">Sin Tipos Configurados</div>
            <div className="text-sm text-k-text-b mt-2 max-w-xs">
              Crea los tipos de gratificación que maneja tu empresa (aguinaldo, bonos, PTU, etc.)
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {tipos.map((tipo) => (
            <div
              key={tipo.id}
              className={cx(
                "rounded-[28px] border bg-k-bg-card p-5 transition-all",
                tipo.is_active ? "border-k-border" : "border-neutral-100 opacity-60"
              )}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cx(
                    "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                    tipo.is_active ? "bg-amber-50" : "bg-neutral-50"
                  )}>
                    <Gift className={cx("h-5 w-5", tipo.is_active ? "text-amber-600" : "text-neutral-300")} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-k-text-h truncate">{tipo.name}</span>
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider bg-neutral-50 px-2 py-0.5 rounded-lg border border-neutral-100">
                        {tipo.code}
                      </span>
                      {!tipo.is_active && (
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider bg-neutral-50 px-2 py-0.5 rounded-lg border border-neutral-100">
                          Inactivo
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-k-text-b mt-0.5">
                      {tipo.description || "Sin descripción"} ·{" "}
                      <span className="font-bold">{FRECUENCIAS[tipo.frequency] ?? tipo.frequency}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => toggleStatus(tipo)}
                    title={tipo.is_active ? "Desactivar" : "Activar"}
                    className="h-9 w-9 rounded-xl hover:bg-k-bg-card2 flex items-center justify-center transition-colors"
                  >
                    {tipo.is_active ? (
                      <ToggleRight className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <ToggleLeft className="h-5 w-5 text-neutral-300" />
                    )}
                  </button>
                  <button
                    onClick={() => openEdit(tipo)}
                    title="Editar"
                    className="h-9 w-9 rounded-xl hover:bg-k-bg-card2 flex items-center justify-center transition-colors"
                  >
                    <Pencil className="h-4 w-4 text-k-text-b" />
                  </button>
                  <button
                    onClick={() => handleDelete(tipo)}
                    title="Eliminar"
                    className="h-9 w-9 rounded-xl hover:bg-rose-50 flex items-center justify-center transition-colors"
                  >
                    <Trash2 className="h-4 w-4 text-rose-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-obsidian/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-k-bg-card rounded-[32px] border border-k-border shadow-2xl w-full max-w-md overflow-hidden animate-in-fade">
            <div className="px-6 py-5 border-b border-k-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-k-bg-sidebar border border-k-border flex items-center justify-center">
                  <Gift className="h-5 w-5 text-k-sb-active" />
                </div>
                <div>
                  <h3 className="text-base font-black text-k-text-h tracking-tight">
                    {editingId ? "Editar Tipo" : "Nuevo Tipo"}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="h-8 w-8 rounded-xl hover:bg-k-bg-card2 flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4 text-k-text-b" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Código</div>
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="AGUINALDO"
                    maxLength={20}
                    className="w-full rounded-2xl border border-k-border bg-k-bg-card2 px-4 py-3 text-sm font-medium text-k-text-h outline-none focus:ring-2 focus:ring-obsidian/10 uppercase"
                  />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Frecuencia</div>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as GratificationType["frequency"])}
                    className="w-full rounded-2xl border border-k-border bg-k-bg-card2 px-4 py-3 text-sm font-medium text-k-text-h outline-none focus:ring-2 focus:ring-obsidian/10"
                  >
                    {Object.entries(FRECUENCIAS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Nombre</div>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Aguinaldo Anual"
                  className="w-full rounded-2xl border border-k-border bg-k-bg-card2 px-4 py-3 text-sm font-medium text-k-text-h outline-none focus:ring-2 focus:ring-obsidian/10"
                />
              </div>
              <div>
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Descripción</div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descripción del concepto..."
                  rows={3}
                  className="w-full rounded-2xl border border-k-border bg-k-bg-card2 px-4 py-3 text-sm font-medium text-k-text-h outline-none focus:ring-2 focus:ring-obsidian/10 resize-none"
                />
              </div>
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-k-bg-sidebar px-5 py-2.5 text-xs font-bold text-white hover:opacity-90 transition disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
