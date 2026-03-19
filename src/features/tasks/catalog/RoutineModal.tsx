// src/features/tasks/catalog/RoutineModal.tsx
import { useEffect, useMemo, useState } from "react";
import { Button, Input, Modal, Select, Textarea } from "./ui";
import type { Routine } from "./api";

const REC_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
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
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setErr(null);
    setName(initial?.name ?? "");
    setDescription(initial?.description ?? "");
    setRecurrence((initial?.recurrence as any) ?? "daily");
    setWeekdays(Array.isArray(initial?.weekdays) ? (initial!.weekdays as number[]) : []);
    setStartDate(initial?.start_date ?? "");
    setEndDate(initial?.end_date ?? "");
    setIsActive(initial?.is_active ?? true);
  }, [open, initial]);

  const canSave = useMemo(() => {
    if (!name.trim()) return false;
    if (recurrence === "weekly" && weekdays.length === 0) return false;
    return true;
  }, [name, recurrence, weekdays]);

  function toggleDay(n: number) {
    setWeekdays((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]));
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
        weekdays: recurrence === "weekly" ? weekdays.sort((a, b) => a - b) : null,
        start_date: startDate || null,
        end_date: endDate || null,
        is_active: isActive,
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
        {err ? <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div> : null}

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <div className="mb-1 text-xs font-medium text-black/60">Nombre *</div>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Apertura" />
          </div>

          <div>
            <div className="mb-1 text-xs font-medium text-black/60">Recurrencia</div>
            <Select value={recurrence} onChange={(v) => setRecurrence(v as any)} options={REC_OPTIONS} />
          </div>

          <div>
            <div className="mb-1 text-xs font-medium text-black/60">Start date (opcional)</div>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>

          <div>
            <div className="mb-1 text-xs font-medium text-black/60">End date (opcional)</div>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>

          <div>
            <div className="mb-1 text-xs font-medium text-black/60">Activa</div>
            <select
              value={isActive ? "1" : "0"}
              onChange={(e) => setIsActive(e.target.value === "1")}
              className="w-full rounded-xl border px-3 py-2 text-sm"
            >
              <option value="1">Sí</option>
              <option value="0">No</option>
            </select>
          </div>
        </div>

        {recurrence === "weekly" ? (
          <div>
            <div className="mb-2 text-xs font-medium text-black/60">Días *</div>
            <div className="flex flex-wrap gap-2">
              {WEEK.map((d) => {
                const on = weekdays.includes(d.n);
                return (
                  <button
                    key={d.n}
                    type="button"
                    onClick={() => toggleDay(d.n)}
                    className={[
                      "rounded-xl border px-3 py-2 text-sm",
                      on ? "bg-black text-white" : "bg-white hover:bg-black/5",
                    ].join(" ")}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
            <div className="mt-2 text-xs text-black/50">Tip: Carbon usa 0=Domingo…6=Sábado.</div>
          </div>
        ) : null}

        <div>
          <div className="mb-1 text-xs font-medium text-black/60">Descripción</div>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </div>
      </div>
    </Modal>
  );
}
