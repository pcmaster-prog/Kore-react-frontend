// src/features/tasks/catalog/RoutineModal.tsx
import { useEffect, useMemo, useState } from "react";
import { X, Calendar, Repeat, Clock, Check, LayoutDashboard } from "lucide-react";
import { cx } from "@/lib/utils";
import type { Routine } from "./api";

const REC_OPTIONS = [
  { value: "daily", label: "Diaria" },
  { value: "weekly", label: "Semanal" },
];

const WEEK = [
  { n: 1, label: "Lun" },
  { n: 2, label: "Mar" },
  { n: 3, label: "Mié" },
  { n: 4, label: "Jue" },
  { n: 5, label: "Vie" },
  { n: 6, label: "Sáb" },
  { n: 0, label: "Dom" },
];

export default function RoutineModal({
  open,
  mode,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  mode: "create" | "edit";
  initial?: Routine | null;
  onClose: () => void;
  onSave: (payload: Partial<Routine>) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [recurrence, setRecurrence] = useState<Routine["recurrence"]>("daily");
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [showInDashboard, setShowInDashboard] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setErr(null);
    setName(initial?.name ?? "");
    setDescription(initial?.description ?? "");
    setRecurrence((initial?.recurrence as any) ?? "daily");
    setWeekdays(
      Array.isArray(initial?.weekdays) ? (initial!.weekdays as number[]) : [],
    );
    setStartDate(initial?.start_date ?? "");
    setEndDate(initial?.end_date ?? "");
    setIsActive(initial?.is_active ?? true);
    setShowInDashboard(initial?.show_in_dashboard ?? false);
  }, [open, initial]);

  const canSave = useMemo(() => {
    if (!name.trim()) return false;
    if (recurrence === "weekly" && weekdays.length === 0) return false;
    return true;
  }, [name, recurrence, weekdays]);

  function toggleDay(n: number) {
    setWeekdays((prev) =>
      prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n],
    );
  }

  async function handleSave() {
    setErr(null);
    if (!canSave) return;
    setSaving(true);
    try {
      const payload: Partial<Routine> = {
        name: name.trim(),
        description: description.trim() ? description.trim() : null,
        recurrence,
        weekdays:
          recurrence === "weekly" ? weekdays.sort((a, b) => a - b) : null,
        start_date: startDate || null,
        end_date: endDate || null,
        is_active: isActive,
        show_in_dashboard: showInDashboard,
      };
      await onSave(payload);
      onClose();
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? e?.message ?? "No pude guardar");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-k-bg-sidebar/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-[32px] bg-k-bg-card shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in-fade animate-in-slide-up border border-k-border">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-k-border bg-k-bg-card2/50 px-8 py-6 shrink-0">
          <div>
            <h3 className="text-xl font-black text-k-text-h tracking-tight">
              {mode === "create" ? "Nueva Rutina" : "Editar Rutina"}
            </h3>
            <p className="text-xs font-medium text-k-text-b mt-1">
              {mode === "create"
                ? "Crea un bloque de tareas que se puede asignar en conjunto"
                : "Modifica los datos de la rutina"}
            </p>
          </div>
          <button
            type="button"
            className="h-10 w-10 rounded-full bg-k-bg-card border border-k-border flex items-center justify-center text-k-text-b hover:text-k-text-h hover:bg-k-bg-card2 hover:border-neutral-300 transition-colors shadow-k-card"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar space-y-6">
          {err ? (
            <div className="rounded-2xl bg-rose-50 border border-rose-100 px-4 py-3 text-sm text-rose-700 font-medium">
              {err}
            </div>
          ) : null}

          {/* Nombre + Recurrencia */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-k-text-b">
                Nombre *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Apertura"
                className="w-full h-12 rounded-2xl bg-k-bg-card2 border border-k-border px-4 text-sm font-medium text-k-text-h placeholder:text-k-text-b/40 focus:outline-none focus:ring-2 focus:ring-k-bg-sidebar/20 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-k-text-b flex items-center gap-1.5">
                <Repeat className="h-3.5 w-3.5" /> Recurrencia
              </label>
              <div className="flex gap-2">
                {REC_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRecurrence(opt.value as Routine["recurrence"])}
                    className={cx(
                      "flex-1 h-12 rounded-2xl text-xs font-bold border transition-all",
                      recurrence === opt.value
                        ? "bg-k-accent-btn text-white border-k-accent-btn shadow-sm"
                        : "bg-k-bg-card2 border-k-border text-k-text-b hover:border-neutral-300"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Fechas */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-k-text-b flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> Inicio (opcional)
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-12 rounded-2xl bg-k-bg-card2 border border-k-border px-4 text-sm font-medium text-k-text-h focus:outline-none focus:ring-2 focus:ring-k-bg-sidebar/20 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-k-text-b flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> Fin (opcional)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-12 rounded-2xl bg-k-bg-card2 border border-k-border px-4 text-sm font-medium text-k-text-h focus:outline-none focus:ring-2 focus:ring-k-bg-sidebar/20 transition-all"
              />
            </div>
          </div>

          {/* Activa + Dashboard */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-k-text-b">
                Estado
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsActive(true)}
                  className={cx(
                    "flex-1 h-12 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-2",
                    isActive
                      ? "bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm"
                      : "bg-k-bg-card2 border-k-border text-k-text-b hover:border-neutral-300"
                  )}
                >
                  <Check className={cx("h-3.5 w-3.5", isActive ? "opacity-100" : "opacity-0")} />
                  Activa
                </button>
                <button
                  type="button"
                  onClick={() => setIsActive(false)}
                  className={cx(
                    "flex-1 h-12 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-2",
                    !isActive
                      ? "bg-neutral-100 text-neutral-500 border-neutral-200 shadow-sm"
                      : "bg-k-bg-card2 border-k-border text-k-text-b hover:border-neutral-300"
                  )}
                >
                  <Check className={cx("h-3.5 w-3.5", !isActive ? "opacity-100" : "opacity-0")} />
                  Inactiva
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-k-text-b">
                Visibilidad
              </label>
              <button
                type="button"
                onClick={() => setShowInDashboard(!showInDashboard)}
                className={cx(
                  "w-full h-12 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-2",
                  showInDashboard
                    ? "bg-k-accent-btn/10 text-k-accent-btn border-k-accent-btn/20 shadow-sm"
                    : "bg-k-bg-card2 border-k-border text-k-text-b hover:border-neutral-300"
                )}
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                {showInDashboard ? "Visible en Dashboard" : "No mostrar en Dashboard"}
              </button>
            </div>
          </div>

          {/* Días de la semana */}
          {recurrence === "weekly" ? (
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-k-text-b flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Días activos *
              </label>
              <div className="flex gap-2">
                {WEEK.map((d) => {
                  const on = weekdays.includes(d.n);
                  return (
                    <button
                      key={d.n}
                      type="button"
                      onClick={() => toggleDay(d.n)}
                      className={cx(
                        "h-12 w-12 flex items-center justify-center rounded-2xl text-[11px] font-bold transition-all",
                        on
                          ? "bg-k-accent-btn text-white shadow-sm"
                          : "bg-k-bg-card2 border border-k-border text-k-text-b hover:text-k-text-h hover:border-neutral-300"
                      )}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Descripción */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-k-text-b">
              Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Escribe un breve objetivo para esta rutina..."
              rows={3}
              className="w-full rounded-2xl bg-k-bg-card2 border border-k-border px-4 py-3 text-sm font-medium text-k-text-h placeholder:text-k-text-b/40 focus:outline-none focus:ring-2 focus:ring-k-bg-sidebar/20 transition-all resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-k-border bg-k-bg-card2/50 px-8 py-5 shrink-0">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 h-12 rounded-2xl bg-k-bg-card border border-k-border text-[11px] font-black uppercase tracking-widest text-k-text-b hover:text-k-text-h hover:bg-k-bg-card2 hover:border-neutral-300 transition-all shadow-k-card"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave || saving}
              className="flex-[2] h-12 rounded-2xl bg-k-accent-btn text-[11px] font-black uppercase tracking-widest text-k-accent-btn-text hover:opacity-90 transition-all shadow-k-card disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar Rutina"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
