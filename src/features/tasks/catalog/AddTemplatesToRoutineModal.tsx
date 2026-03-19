//features/tasks/catalog/AddTemplatesToRoutineModal.tsx
import { useEffect, useMemo, useState } from "react";
import { Button, Input, Modal, Pill } from "./ui";
import type { Template } from "./api";
import { listTemplates } from "./api";

export default function AddTemplatesToRoutineModal({
  open,
  onClose,
  onConfirm,
  alreadyTemplateIds,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (templateIds: string[]) => Promise<void>;
  alreadyTemplateIds: Set<string>;
}) {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const selectable = useMemo(
    () => items.filter((t) => !alreadyTemplateIds.has(t.id)),
    [items, alreadyTemplateIds]
  );

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await listTemplates({ active: true, search: search.trim() || undefined, page: 1 });
      setItems(res.data ?? []);
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "No pude cargar templates");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    setSelected(new Set());
    setSearch("");
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function toggle(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  async function handleConfirm() {
    if (selected.size === 0) return;
    setSaving(true);
    try {
      await onConfirm(Array.from(selected));
      onClose();
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "No pude agregar templates");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Agregar templates a rutina"
      onClose={onClose}
      footer={
        <div className="flex items-center justify-between">
          <div className="text-sm text-black/60">
            Seleccionados: <span className="font-medium">{selected.size}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={saving || selected.size === 0}>
              {saving ? "Agregando..." : "Agregar"}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-3">
        {err ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>
        ) : null}

        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar templates..." />

        <div className="rounded-2xl border">
          <div className="border-b bg-black/[0.02] px-4 py-3 text-xs font-semibold text-black/60">Disponibles</div>

          {loading ? (
            <div className="p-4 text-sm text-black/60">Cargando...</div>
          ) : selectable.length === 0 ? (
            <div className="p-4 text-sm text-black/60">
              No hay templates disponibles (o ya todos están en la rutina). Eso es eficiencia… o ya te quedaste sin backlog 😄
            </div>
          ) : (
            selectable.map((t) => {
              const on = selected.has(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggle(t.id)}
                  className={[
                    "flex w-full items-start justify-between gap-3 border-b px-4 py-3 text-left last:border-b-0",
                    "hover:bg-black/[0.02]",
                  ].join(" ")}
                >
                  <div>
                    <div className="font-medium">{t.title}</div>
                    {t.description ? <div className="mt-0.5 line-clamp-1 text-xs text-black/60">{t.description}</div> : null}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Pill>{t.priority}</Pill>
                      {t.estimated_minutes ? <Pill>{t.estimated_minutes} min</Pill> : null}
                    </div>
                  </div>
                  <div className="pt-1">
                    <span
                      className={[
                        "inline-flex h-5 w-5 items-center justify-center rounded-md border text-xs",
                        on ? "bg-black text-white" : "bg-white",
                      ].join(" ")}
                    >
                      ✓
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
}