// src/features/tasks/catalog/TemplateModal.tsx
import { useEffect, useMemo, useState } from "react";
import { Button, Input, Modal, Select, Textarea } from "./ui";
import type { Template } from "./api";

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

// ─── Tipos internos del checklist ────────────────────────────────────────────
type ChecklistItemDraft = {
  id: string;       // item_1, item_2, etc. (se genera automático)
  label: string;    // lo que escribe el admin
  required: boolean;
};

type InstructionMode = "none" | "checklist" | "text";

// ─── Pequeño helper para generar IDs únicos ───────────────────────────────
function makeItemId(index: number) {
  return `item_${index + 1}`;
}

// ─── Componente visual del constructor de checklist ───────────────────────
function ChecklistBuilder({
  items,
  onChange,
}: {
  items: ChecklistItemDraft[];
  onChange: (items: ChecklistItemDraft[]) => void;
}) {
  function addItem() {
    onChange([
      ...items,
      { id: makeItemId(items.length), label: "", required: true },
    ]);
  }

  function removeItem(index: number) {
    const next = items.filter((_, i) => i !== index);
    // Recalcula los IDs para mantener secuencia limpia
    onChange(next.map((it, i) => ({ ...it, id: makeItemId(i) })));
  }

  function updateLabel(index: number, label: string) {
    onChange(items.map((it, i) => (i === index ? { ...it, label } : it)));
  }

  function toggleRequired(index: number) {
    onChange(
      items.map((it, i) =>
        i === index ? { ...it, required: !it.required } : it
      )
    );
  }

  function moveUp(index: number) {
    if (index === 0) return;
    const next = [...items];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onChange(next.map((it, i) => ({ ...it, id: makeItemId(i) })));
  }

  function moveDown(index: number) {
    if (index === items.length - 1) return;
    const next = [...items];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    onChange(next.map((it, i) => ({ ...it, id: makeItemId(i) })));
  }

  return (
    <div className="space-y-2">
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-4 text-center text-sm text-neutral-500">
          Sin items todavía. Agrega el primero 👇
        </div>
      ) : (
        items.map((it, i) => (
          <div
            key={it.id}
            className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white p-2 shadow-sm"
          >
            {/* Orden */}
            <div className="flex flex-col gap-0.5 shrink-0">
              <button
                type="button"
                onClick={() => moveUp(i)}
                disabled={i === 0}
                className="rounded px-1 text-xs text-neutral-400 hover:text-neutral-700 disabled:opacity-30"
                title="Subir"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => moveDown(i)}
                disabled={i === items.length - 1}
                className="rounded px-1 text-xs text-neutral-400 hover:text-neutral-700 disabled:opacity-30"
                title="Bajar"
              >
                ▼
              </button>
            </div>

            {/* Número */}
            <span className="shrink-0 w-5 text-center text-xs font-semibold text-neutral-400">
              {i + 1}
            </span>

            {/* Label */}
            <input
              className="flex-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-black/10 min-w-0"
              placeholder={`Ej. Puertas cerradas`}
              value={it.label}
              onChange={(e) => updateLabel(i, e.target.value)}
            />

            {/* Toggle requerido */}
            <button
              type="button"
              onClick={() => toggleRequired(i)}
              className={[
                "shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium transition",
                it.required
                  ? "bg-rose-50 text-rose-700 border-rose-200"
                  : "bg-neutral-50 text-neutral-500 border-neutral-200",
              ].join(" ")}
              title="Click para cambiar si es requerido u opcional"
            >
              {it.required ? "Requerido" : "Opcional"}
            </button>

            {/* Eliminar */}
            <button
              type="button"
              onClick={() => removeItem(i)}
              className="shrink-0 rounded-lg border border-neutral-200 px-2 py-1.5 text-xs text-rose-600 hover:bg-rose-50 transition"
              title="Eliminar item"
            >
              ✕
            </button>
          </div>
        ))
      )}

      <button
        type="button"
        onClick={addItem}
        className="w-full rounded-xl border border-dashed border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50 hover:border-neutral-400 transition"
      >
        + Agregar item
      </button>

      {items.length > 0 && (
        <div className="text-xs text-neutral-400 pt-1">
          {items.filter((it) => it.required).length} requeridos ·{" "}
          {items.filter((it) => !it.required).length} opcionales ·{" "}
          {items.length} total
        </div>
      )}
    </div>
  );
}

// ─── Modal principal ──────────────────────────────────────────────────────────
export default function TemplateModal({
  open,
  mode,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  mode: "create" | "edit";
  initial?: Template | null;
  onClose: () => void;
  onSave: (payload: Partial<Template>) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Template["priority"]>("medium");
  const [estimated, setEstimated] = useState<string>("");
  const [tags, setTags] = useState<string>("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // ── Instrucciones ──
  const [instructionMode, setInstructionMode] = useState<InstructionMode>("none");
  const [checklistItems, setChecklistItems] = useState<ChecklistItemDraft[]>([]);
  const [textInstructions, setTextInstructions] = useState("");

  // ── Parseo inicial al abrir ──
  useEffect(() => {
    if (!open) return;
    setErr(null);
    setTitle(initial?.title ?? "");
    setDescription(initial?.description ?? "");
    setPriority((initial?.priority as any) ?? "medium");
    setEstimated(initial?.estimated_minutes ? String(initial.estimated_minutes) : "");
    setTags(initial?.tags ? JSON.stringify(initial.tags) : "");
    setIsActive(initial?.is_active ?? true);

    // Detectar tipo de instructions
    const ins = initial?.instructions;
    if (!ins) {
      setInstructionMode("none");
      setChecklistItems([]);
      setTextInstructions("");
    } else if (
      typeof ins === "object" &&
      ins !== null &&
      (ins as any).type === "checklist"
    ) {
      setInstructionMode("checklist");
      const rawItems: any[] = (ins as any).items ?? [];
      setChecklistItems(
        rawItems.map((it: any, i: number) => ({
          id: it.id ?? makeItemId(i),
          label: it.label ?? "",
          required: it.required ?? false,
        }))
      );
      setTextInstructions("");
    } else {
      setInstructionMode("text");
      setChecklistItems([]);
      setTextInstructions(
        typeof ins === "string" ? ins : JSON.stringify(ins, null, 2)
      );
    }
  }, [open, initial]);

  const canSave = useMemo(() => {
    if (!title.trim()) return false;
    if (instructionMode === "checklist") {
      // Al menos 1 item con label no vacío
      return checklistItems.every((it) => it.label.trim().length > 0);
    }
    return true;
  }, [title, instructionMode, checklistItems]);

  // ── Preview del JSON que se enviará ──
  const instructionsPreview = useMemo(() => {
    if (instructionMode === "none") return null;
    if (instructionMode === "checklist") {
      if (checklistItems.length === 0) return null;
      return {
        type: "checklist",
        items: checklistItems.map((it) => ({
          id: it.id,
          label: it.label,
          required: it.required,
        })),
      };
    }
    if (instructionMode === "text" && textInstructions.trim()) {
      try {
        return JSON.parse(textInstructions);
      } catch {
        return textInstructions.trim();
      }
    }
    return null;
  }, [instructionMode, checklistItems, textInstructions]);

  async function handleSave() {
    setErr(null);
    if (!canSave) return;
    setSaving(true);
    try {
      let parsedTags: any = undefined;
      if (tags.trim()) {
        try {
          parsedTags = JSON.parse(tags);
        } catch {
          parsedTags = tags.trim();
        }
      }

      const payload: Partial<Template> = {
        title: title.trim(),
        description: description.trim() ? description.trim() : null,
        priority,
        estimated_minutes: estimated ? Number(estimated) : null,
        tags: parsedTags ?? null,
        instructions: instructionsPreview ?? null,
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
      title={mode === "create" ? "Nuevo Template" : "Editar Template"}
      onClose={onClose}
      footer={
        <div className="flex items-center justify-end gap-2">
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

        {/* ── Campos base ── */}
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <div className="mb-1 text-xs font-medium text-black/60">Título *</div>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Verificar candados"
            />
          </div>

          <div>
            <div className="mb-1 text-xs font-medium text-black/60">Prioridad</div>
            <Select
              value={priority}
              onChange={(v) => setPriority(v as any)}
              options={PRIORITY_OPTIONS}
            />
          </div>

          <div>
            <div className="mb-1 text-xs font-medium text-black/60">
              Tiempo estimado (min)
            </div>
            <Input
              value={estimated}
              onChange={(e) => setEstimated(e.target.value)}
              placeholder="Ej. 15"
            />
          </div>

          <div>
            <div className="mb-1 text-xs font-medium text-black/60">Activo</div>
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

        <div>
          <div className="mb-1 text-xs font-medium text-black/60">Descripción</div>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Instrucciones generales de la tarea..."
          />
        </div>

        <div>
          <div className="mb-1 text-xs font-medium text-black/60">
            Tags (opcional)
          </div>
          <Input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder='Ej. ["cierre","limpieza"]'
          />
        </div>

        {/* ── Instrucciones / Checklist ── */}
        <div>
          <div className="mb-2 text-xs font-medium text-black/60">
            Instrucciones
          </div>

          {/* Selector de modo */}
          <div className="inline-flex rounded-xl border bg-neutral-50 p-1 gap-1 mb-3">
            {(
              [
                { value: "none", label: "Ninguna" },
                { value: "checklist", label: "☑️ Checklist" },
                { value: "text", label: "📝 Texto libre" },
              ] as { value: InstructionMode; label: string }[]
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setInstructionMode(opt.value)}
                className={[
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition",
                  instructionMode === opt.value
                    ? "bg-white shadow text-neutral-900 border"
                    : "text-neutral-500 hover:text-neutral-800",
                ].join(" ")}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Modo: ninguna */}
          {instructionMode === "none" && (
            <div className="text-xs text-neutral-400">
              Sin instrucciones adicionales. El empleado solo verá el título y descripción.
            </div>
          )}

          {/* Modo: checklist visual */}
          {instructionMode === "checklist" && (
            <div className="space-y-3">
              <ChecklistBuilder
                items={checklistItems}
                onChange={setChecklistItems}
              />

              {/* Validación */}
              {checklistItems.some((it) => !it.label.trim()) && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  ⚠️ Todos los items deben tener un label antes de guardar.
                </div>
              )}
            </div>
          )}

          {/* Modo: texto libre / JSON manual */}
          {instructionMode === "text" && (
            <Textarea
              value={textInstructions}
              onChange={(e) => setTextInstructions(e.target.value)}
              rows={5}
              placeholder="Escribe las instrucciones en texto plano, o pega un JSON si lo necesitas."
            />
          )}
        </div>

       
      </div>
    </Modal>
  );
}