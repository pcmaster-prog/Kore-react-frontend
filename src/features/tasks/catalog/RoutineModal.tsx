// src/features/tasks/catalog/RoutineModal.tsx
import { useEffect, useMemo, useState } from "react";
import { Button, Input, Modal, Select, Textarea } from "./ui";
import type { Routine } from "./api";

const REC_OPTIONS = [
  { value: "daily", label: "Diaria" },
  { value: "weekly", label: "Semanal" },
];

const WEEK = [
  { n: 1, label: "L" },
  { n: 2, label: "M" },
  { n: 3, label: "X" },
  { n: 4, label: "J" },
  { n: 5, label: "V" },
  { n: 6, label: "S" },
  { n: 0, label: "D" },
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

  return (
    <Modal
      open={open}
      title={mode === "create" ? "Nueva Rutina" : "Editar Rutina"}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!canSave || saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {err ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {err}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-neutral-400">
              Nombre *
            </div>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Apertura"
              className="bg-neutral-50 border-neutral-200 text-obsidian font-medium"
            />
          </div>

          <div>
            <div className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-neutral-400">
              Recurrencia
            </div>
            <Select
              value={recurrence}
              onChange={(v) => setRecurrence(v as any)}
              options={REC_OPTIONS}
            />
          </div>

          <div>
            <div className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-neutral-400">
              Inicio (Opcional)
            </div>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-neutral-50 border-neutral-200 text-obsidian font-medium"
            />
          </div>

          <div>
            <div className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-neutral-400">
              Fin (Opcional)
            </div>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-neutral-50 border-neutral-200 text-obsidian font-medium"
            />
          </div>

          <div>
            <div className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-neutral-400">
              Activa
            </div>
            <select
              value={isActive ? "1" : "0"}
              onChange={(e) => setIsActive(e.target.value === "1")}
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-obsidian/5"
            >
              <option value="1">Sí</option>
              <option value="0">No</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
          <input
            type="checkbox"
            id="showInDashboardRoutine"
            checked={showInDashboard}
            onChange={(e) => setShowInDashboard(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
          />
          <label htmlFor="showInDashboardRoutine" className="text-sm font-bold text-obsidian cursor-pointer select-none">
            📌 Mostrar rápido en Dashboard
            <span className="block text-xs font-medium text-neutral-500 mt-0.5">
              Si lo marcas, esta rutina aparecerá automáticamente en las Tareas Disponibles del gerente.
            </span>
          </label>
        </div>

        {recurrence === "weekly" ? (
          <div className="pt-2">
            <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-neutral-400">
              Días *
            </div>
            <div className="flex flex-wrap gap-2">
              {WEEK.map((d) => {
                const on = weekdays.includes(d.n);
                return (
                  <button
                    key={d.n}
                    type="button"
                    onClick={() => toggleDay(d.n)}
                    className={[
                      "h-10 w-10 flex items-center justify-center rounded-xl text-[11px] font-black transition-all shadow-sm",
                      on
                        ? "bg-obsidian text-white border-transparent"
                        : "bg-white border border-neutral-200 text-neutral-400 hover:text-obsidian hover:bg-neutral-50 hover:border-neutral-300",
                    ].join(" ")}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
            <div className="mt-2 text-[10px] text-neutral-400 font-medium">
              Tip: El Domingo es D.
            </div>
          </div>
        ) : null}

        <div className="pt-2">
          <div className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-neutral-400">
            Descripción
          </div>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="bg-neutral-50 border-neutral-200 text-obsidian font-medium"
            placeholder="Escribe un breve objetivo para esta rutina..."
          />
        </div>
      </div>
    </Modal>
  );
}
