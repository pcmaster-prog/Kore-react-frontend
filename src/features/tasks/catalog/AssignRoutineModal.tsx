// src/features/tasks/catalog/AssignRoutineModal.tsx
import { useEffect, useMemo, useState } from "react";
import { Button, Input, Modal, Toggle } from "./ui";
import type { Employee } from "./api";
import { listEmployees } from "./api";

export default function AssignRoutineModal({
  open,
  routineName,
  onClose,
  onAssign,
}: {
  open: boolean;
  routineName: string;
  onClose: () => void;
  onAssign: (payload: {
    date: string;
    empleado_ids: string[];
    due_at?: string | null;
    allow_duplicate?: boolean;
  }) => Promise<void>;
}) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [date, setDate] = useState(today);
  const [dueAt, setDueAt] = useState<string>(""); // datetime-local
  const [allowDup, setAllowDup] = useState(false);

  const [emps, setEmps] = useState<Employee[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  async function loadEmployees() {
    setLoading(true);
    setErr(null);
    try {
      const data = await listEmployees();
      setEmps(data ?? []);
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "No pude cargar empleados");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    setErr(null);
    setDate(today);
    setDueAt("");
    setAllowDup(false);
    setSelected(new Set());
    setFilter("");
    loadEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const filtered = useMemo(() => {
    const s = filter.trim().toLowerCase();
    if (!s) return emps;
    return emps.filter((e) =>
      (e.name ?? e.full_name ?? "").toLowerCase().includes(s),
    );
  }, [emps, filter]);

  function toggleEmp(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  async function handleAssign() {
    if (selected.size === 0) return;
    setSaving(true);
    setErr(null);
    try {
      await onAssign({
        date,
        empleado_ids: Array.from(selected),
        due_at: dueAt ? new Date(dueAt).toISOString() : null,
        allow_duplicate: allowDup,
      });
      onClose();
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "No pude asignar rutina");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      title={`Asignar rutina: ${routineName}`}
      onClose={onClose}
      footer={
        <div className="flex items-center justify-between">
          <div className="text-sm text-black/60">
            Empleados: <span className="font-medium">{selected.size}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button
              onClick={handleAssign}
              disabled={saving || selected.size === 0}
            >
              {saving ? "Asignando..." : "Asignar"}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {err ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {err}
          </div>
        ) : null}

        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <div className="mb-1 text-xs font-medium text-black/60">Fecha</div>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <div className="mb-1 text-xs font-medium text-black/60">
              Due at (opcional)
            </div>
            <Input
              type="datetime-local"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
            />
          </div>
          <div className="flex items-end justify-between rounded-2xl border px-3 py-2">
            <div>
              <div className="text-xs font-medium text-black/60">
                Permitir duplicados
              </div>
              <div className="text-xs text-black/40">
                Si OFF: idempotente por template+fecha
              </div>
            </div>
            <Toggle checked={allowDup} onChange={setAllowDup} />
          </div>
        </div>

        <div className="rounded-2xl border p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="text-sm font-semibold">Empleados</div>
            <div className="w-[min(320px,60vw)]">
              <Input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Buscar empleado..."
              />
            </div>
          </div>

          {loading ? (
            <div className="text-sm text-black/60">Cargando empleados...</div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-black/60">
              No hay empleados para asignar.
            </div>
          ) : (
            <div className="max-h-[340px] overflow-auto rounded-xl border">
              {filtered.map((e) => {
                const label = e.name ?? e.full_name ?? e.id;
                const on = selected.has(e.id);
                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => toggleEmp(e.id)}
                    className="flex w-full items-center justify-between gap-3 border-b px-3 py-2 text-left text-sm hover:bg-black/[0.02] last:border-b-0"
                  >
                    <div className="font-medium">{label}</div>
                    <span
                      className={[
                        "inline-flex h-5 w-5 items-center justify-center rounded-md border text-xs",
                        on ? "bg-black text-white" : "",
                      ].join(" ")}
                    >
                      ✓
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
