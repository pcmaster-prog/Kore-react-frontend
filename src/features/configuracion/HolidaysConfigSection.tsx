// src/features/configuracion/HolidaysConfigSection.tsx
import { useState, useEffect, useCallback } from "react";
import api from "@/lib/http";
import { cx } from "@/lib/utils";
import {
  Calendar,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Clock,
} from "lucide-react";

export type Holiday = {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  is_paid: boolean;
  created_at?: string;
};

function formatHolidayDate(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function isPast(dateStr: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return dateStr < today;
}

export default function HolidaysConfigSection() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formPaid, setFormPaid] = useState(true);

  function showToast(type: "ok" | "err", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  const loadHolidays = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/empresa/festivos");
      const data = (res.data?.data ?? []) as Holiday[];
      // Ordenar por fecha ascendente
      data.sort((a, b) => a.date.localeCompare(b.date));
      setHolidays(data);
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? "No se pudieron cargar los festivos";
      showToast("err", msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHolidays();
  }, [loadHolidays]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim() || !formDate) {
      showToast("err", "Completa el nombre y la fecha del festivo.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/empresa/festivos", {
        name: formName.trim(),
        date: formDate,
        is_paid: formPaid,
      });
      showToast("ok", "Festivo agregado correctamente.");
      setFormName("");
      setFormDate("");
      setFormPaid(true);
      setShowForm(false);
      await loadHolidays();
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? "No se pudo agregar el festivo";
      showToast("err", msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar "${name}"?`)) return;
    setSaving(true);
    try {
      await api.delete(`/empresa/festivos/${id}`);
      showToast("ok", "Festivo eliminado.");
      await loadHolidays();
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? "No se pudo eliminar";
      showToast("err", msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleLoadMexico() {
    if (!confirm("Se cargarán los 7 festivos oficiales de México para el año actual. ¿Continuar?")) return;
    setSaving(true);
    try {
      const res = await api.post("/empresa/festivos/cargar-mexico");
      const created = res.data?.created ?? 0;
      showToast("ok", `${created} festivos cargados correctamente.`);
      await loadHolidays();
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? "No se pudieron cargar los festivos";
      showToast("err", msg);
    } finally {
      setSaving(false);
    }
  }

  const upcoming = holidays.filter((h) => !isPast(h.date));
  const past = holidays.filter((h) => isPast(h.date));

  return (
    <div className="rounded-[28px] border border-k-border bg-k-bg-card2/50 p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 pb-2 border-b border-k-border">
        <Sparkles className="h-5 w-5 text-violet-500" />
        <h3 className="text-sm font-bold text-k-text-h uppercase tracking-widest">
          Excepciones y Festivos
        </h3>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={cx(
            "rounded-2xl border px-5 py-3 text-sm font-bold flex items-center gap-3 animate-in-fade",
            toast.type === "ok"
              ? "bg-emerald-50 border-emerald-100 text-emerald-700"
              : "bg-rose-50 border-rose-100 text-rose-700"
          )}
        >
          {toast.type === "ok" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0" />
          )}
          {toast.msg}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center gap-3 py-6 text-k-text-b">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-xs font-bold uppercase tracking-widest">
            Cargando festivos...
          </span>
        </div>
      ) : (
        <>
          {/* Lista de festivos */}
          <div className="flex items-center gap-4 overflow-x-auto custom-scrollbar pb-2">
            {holidays.length === 0 ? (
              <div className="min-w-[220px] rounded-2xl border border-dashed border-k-border bg-k-bg-card p-5 text-center">
                <Calendar className="h-6 w-6 text-neutral-200 mx-auto mb-2" />
                <div className="text-xs font-bold text-k-text-b uppercase tracking-widest">
                  Sin festivos configurados
                </div>
                <p className="text-[11px] text-k-text-b mt-1">
                  Agrega manualmente o carga los de México.
                </p>
              </div>
            ) : (
              <>
                {/* Próximos festivos */}
                {upcoming.map((h) => (
                  <div
                    key={h.id}
                    className="min-w-[200px] rounded-2xl bg-k-bg-card border border-k-border p-4 shadow-k-card relative group"
                  >
                    <div className="text-[10px] font-bold text-violet-500 uppercase tracking-widest mb-1">
                      Próximo Festivo
                    </div>
                    <div className="text-sm font-black text-k-text-h">{h.name}</div>
                    <div className="text-xs font-medium text-k-text-b mt-1 capitalize">
                      {formatHolidayDate(h.date)}
                    </div>
                    {h.is_paid && (
                      <div className="inline-flex items-center gap-1 mt-2 rounded-lg border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-600">
                        <CheckCircle2 className="h-2.5 w-2.5" /> Pagado
                      </div>
                    )}
                    <button
                      onClick={() => handleDelete(h.id, h.name)}
                      disabled={saving}
                      className="absolute top-2 right-2 h-7 w-7 rounded-xl border border-rose-100 text-rose-500 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-rose-50"
                      title="Eliminar festivo"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}

                {/* Pasados (solo si no hay próximos, o mostrar un resumen colapsable) */}
                {upcoming.length === 0 && past.length > 0 && (
                  <div className="min-w-[200px] rounded-2xl border border-dashed border-k-border bg-k-bg-card p-4 text-center">
                    <Clock className="h-5 w-5 text-neutral-200 mx-auto mb-2" />
                    <div className="text-xs font-bold text-k-text-b">
                      Todos los festivos han pasado
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Add button */}
            <button
              onClick={() => setShowForm((v) => !v)}
              className={cx(
                "min-w-[180px] rounded-2xl border border-dashed p-4 flex items-center justify-center text-k-text-b hover:text-k-text-h hover:bg-k-bg-card2 cursor-pointer transition-colors",
                showForm ? "border-violet-300 bg-violet-50/30" : "border-k-border bg-k-bg-card"
              )}
            >
              <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                {showForm ? (
                  <>
                    <AlertTriangle className="h-4 w-4" /> Cancelar
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" /> Agregar Festivo
                  </>
                )}
              </span>
            </button>
          </div>

          {/* Form inline */}
          {showForm && (
            <form
              onSubmit={handleAdd}
              className="rounded-2xl border border-k-border bg-k-bg-card p-5 space-y-4 animate-in-fade"
            >
              <div className="text-[10px] font-bold text-k-text-b uppercase tracking-widest">
                Nuevo festivo
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-bold text-k-text-b uppercase tracking-widest mb-1.5">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ej. Día de la Independencia"
                    className="w-full rounded-2xl border border-k-border bg-k-bg-card2 px-3 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-obsidian/10 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-k-text-b uppercase tracking-widest mb-1.5">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full rounded-2xl border border-k-border bg-k-bg-card2 px-3 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-obsidian/10 transition-all"
                    required
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <button
                      type="button"
                      onClick={() => setFormPaid((v) => !v)}
                      className={cx(
                        "h-6 w-11 rounded-full transition-all flex items-center px-0.5 border",
                        formPaid
                          ? "bg-emerald-500 border-emerald-600"
                          : "bg-neutral-200 border-neutral-300"
                      )}
                    >
                      <div
                        className={cx(
                          "h-4 w-4 rounded-full bg-k-bg-card shadow transition-transform duration-300",
                          formPaid ? "translate-x-5" : "translate-x-0"
                        )}
                      />
                    </button>
                    <span className="text-sm font-bold text-k-text-h">
                      {formPaid ? "Día pagado" : "No pagado"}
                    </span>
                  </label>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-2xl bg-k-accent-btn px-5 py-2.5 text-sm font-bold text-k-accent-btn-text shadow-md hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Guardar Festivo
                </button>
              </div>
            </form>
          )}

          {/* Bulk load */}
          {holidays.length === 0 && !showForm && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleLoadMexico}
                disabled={saving}
                className="rounded-2xl border border-violet-200 bg-violet-50 px-5 py-2.5 text-sm font-bold text-violet-700 hover:bg-violet-100 transition disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Cargar Festivos de México
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
