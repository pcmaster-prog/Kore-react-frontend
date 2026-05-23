// src/features/tasks/catalog/TemplateModal.tsx
// Modal profesional para crear/editar plantillas de tareas

import { useEffect, useMemo, useState } from "react";
import { X, Loader2, GripVertical, Plus, Trash2, Pin } from "lucide-react";
import { cx } from "@/lib/utils";
import type { Template } from "./api";

const PRIORITY_OPTIONS = [
  { value: "low", label: "Baja", color: "bg-slate-100 text-slate-600 border-slate-200" },
  { value: "medium", label: "Media", color: "bg-blue-50 text-blue-600 border-blue-200" },
  { value: "high", label: "Alta", color: "bg-amber-50 text-amber-600 border-amber-200" },
  { value: "urgent", label: "Urgente", color: "bg-rose-50 text-rose-600 border-rose-200" },
];

// ─── Tipos internos del checklist ────────────────────────────────────────────
type ChecklistItemDraft = {
  id: string;
  label: string;
  required: boolean;
};

type InstructionMode = "none" | "checklist" | "text";

function makeItemId(index: number) {
  return `item_${index + 1}`;
}

// ─── Constructor de checklist con estilo k- ─────────────────────────────────
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
    onChange(next.map((it, i) => ({ ...it, id: makeItemId(i) })));
  }

  function updateLabel(index: number, label: string) {
    onChange(items.map((it, i) => (i === index ? { ...it, label } : it)));
  }

  function toggleRequired(index: number) {
    onChange(
      items.map((it, i) =>
        i === index ? { ...it, required: !it.required } : it,
      ),
    );
  }

  function moveItem(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= items.length) return;
    const next = [...items];
    [next[index], next[newIndex]] = [next[newIndex], next[index]];
    onChange(next.map((it, i) => ({ ...it, id: makeItemId(i) })));
  }

  return (
    <div className="space-y-2">
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-k-border bg-k-bg-card2 p-6 text-center text-sm font-medium text-k-text-b">
          Sin instrucciones detalladas todavía. Agrega el primer paso 👇
        </div>
      ) : (
        items.map((it, i) => (
          <div
            key={it.id}
            className="flex items-center gap-2 rounded-2xl border border-k-border bg-k-bg-card p-2.5 shadow-k-card hover:shadow-md transition-shadow"
          >
            {/* Handle de reordenamiento */}
            <div className="flex flex-col gap-0.5 shrink-0">
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); moveItem(i, -1); }}
                disabled={i === 0}
                className="h-5 w-5 rounded flex items-center justify-center text-k-text-b/40 hover:text-k-text-h disabled:opacity-20 transition-colors"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); moveItem(i, 1); }}
                disabled={i === items.length - 1}
                className="h-5 w-5 rounded flex items-center justify-center text-k-text-b/40 hover:text-k-text-h disabled:opacity-20 transition-colors"
              >
                ▼
              </button>
            </div>

            {/* Número */}
            <span className="shrink-0 w-6 text-center text-[11px] font-black uppercase text-k-text-b/50">
              {i + 1}
            </span>

            {/* Label */}
            <input
              className="flex-1 rounded-xl border border-k-border bg-k-bg-card2 px-3 py-2 text-sm font-medium text-k-text-h placeholder:text-k-text-b/50 outline-none focus:ring-2 focus:ring-k-bg-sidebar/20 focus:bg-k-bg-card transition-all min-w-0"
              placeholder={`Ej. Limpiar área de trabajo`}
              value={it.label}
              onChange={(e) => updateLabel(i, e.target.value)}
            />

            {/* Toggle requerido */}
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); toggleRequired(i); }}
              className={cx(
                "shrink-0 rounded-[10px] border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all",
                it.required
                  ? "bg-rose-50 text-rose-700 border-rose-200 shadow-sm"
                  : "bg-k-bg-card text-k-text-b border-k-border hover:bg-k-bg-card2"
              )}
            >
              {it.required ? "Requerido" : "Opcional"}
            </button>

            {/* Eliminar */}
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); removeItem(i); }}
              className="shrink-0 h-8 w-8 rounded-xl border border-k-border flex items-center justify-center text-rose-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))
      )}

      <button
        type="button"
        onClick={(e) => { e.preventDefault(); addItem(); }}
        className="w-full mt-3 rounded-2xl border-2 border-dashed border-k-border bg-k-bg-card px-4 py-4 text-sm font-bold text-k-text-b hover:bg-k-bg-card2 hover:border-neutral-300 hover:text-k-text-h transition-all flex items-center justify-center gap-2"
      >
        <Plus className="h-4 w-4" />
        Añadir paso
      </button>

      {items.length > 0 && (
        <div className="text-[10px] uppercase font-black tracking-widest text-k-text-b/50 pt-3 text-center">
          {items.filter((it) => it.required).length} obligatorios ·{" "}
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
  const [showInDashboard, setShowInDashboard] = useState(false);
  const [section, setSection] = useState<string>("");
  const [department, setDepartment] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [instructionMode, setInstructionMode] = useState<InstructionMode>("none");
  const [checklistItems, setChecklistItems] = useState<ChecklistItemDraft[]>([]);
  const [textInstructions, setTextInstructions] = useState("");

  useEffect(() => {
    if (!open) return;
    setErr(null);
    setTitle(initial?.title ?? "");
    setDescription(initial?.description ?? "");
    setPriority((initial?.priority as any) ?? "medium");
    setEstimated(initial?.estimated_minutes ? String(initial.estimated_minutes) : "");
    setTags(initial?.tags ? JSON.stringify(initial.tags) : "");
    setIsActive(initial?.is_active ?? true);
    setShowInDashboard(initial?.show_in_dashboard ?? false);
    setSection(initial?.section ?? "");
    setDepartment(initial?.department ?? "");

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
        })),
      );
      setTextInstructions("");
    } else {
      setInstructionMode("text");
      setChecklistItems([]);
      setTextInstructions(typeof ins === "string" ? ins : JSON.stringify(ins, null, 2));
    }
  }, [open, initial]);

  const canSave = useMemo(() => {
    if (!title.trim()) return false;
    if (instructionMode === "checklist") {
      return checklistItems.every((it) => it.label.trim().length > 0);
    }
    return true;
  }, [title, instructionMode, checklistItems]);

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
        show_in_dashboard: showInDashboard,
        section: section.trim() ? section.trim() : null,
        department: department.trim() ? department.trim() : null,
      };

      await onSave(payload);
      onClose();
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? e?.message ?? "No se pudo guardar");
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
      <div className="relative w-full max-w-2xl rounded-[32px] bg-k-bg-card shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in-fade animate-in-slide-up border border-k-border">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-k-border bg-k-bg-card2/50 px-8 py-6 shrink-0">
          <div>
            <h3 className="text-xl font-black text-k-text-h tracking-tight">
              {mode === "create" ? "Nueva plantilla" : "Editar plantilla"}
            </h3>
            <p className="text-xs font-medium text-k-text-b mt-1">
              {mode === "create"
                ? "Crea una nueva plantilla de tarea para tu equipo"
                : "Modifica los detalles de la plantilla"}
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
          {err && (
            <div className="rounded-2xl bg-rose-50 border border-rose-100 px-4 py-3 text-sm text-rose-700 font-medium">
              {err}
            </div>
          )}

          {/* ── Campos base ── */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Título */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-k-text-b">
                Título *
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Verificar candados"
                className="w-full h-12 rounded-2xl bg-k-bg-card2 border border-k-border px-4 text-sm font-medium text-k-text-h placeholder:text-k-text-b/50 outline-none focus:ring-2 focus:ring-k-bg-sidebar/20 transition-all"
              />
            </div>

            {/* Prioridad */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-k-text-b">
                Prioridad
              </label>
              <div className="flex gap-2">
                {PRIORITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPriority(opt.value as any)}
                    className={cx(
                      "flex-1 h-12 rounded-2xl text-[11px] font-bold border transition-all",
                      priority === opt.value
                        ? opt.color + " shadow-sm"
                        : "bg-k-bg-card2 border-k-border text-k-text-b hover:border-neutral-300"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tiempo estimado */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-k-text-b">
                Tiempo estimado (min)
              </label>
              <input
                type="number"
                value={estimated}
                onChange={(e) => setEstimated(e.target.value)}
                placeholder="Ej. 15"
                className="w-full h-12 rounded-2xl bg-k-bg-card2 border border-k-border px-4 text-sm font-medium text-k-text-h placeholder:text-k-text-b/50 outline-none focus:ring-2 focus:ring-k-bg-sidebar/20 transition-all"
              />
            </div>

            {/* Departamento */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-k-text-b">
                Departamento
              </label>
              <input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Ej. Operaciones"
                className="w-full h-12 rounded-2xl bg-k-bg-card2 border border-k-border px-4 text-sm font-medium text-k-text-h placeholder:text-k-text-b/50 outline-none focus:ring-2 focus:ring-k-bg-sidebar/20 transition-all"
              />
            </div>

            {/* Sección */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-k-text-b">
                Sección
              </label>
              <input
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="Ej. Carnicería"
                className="w-full h-12 rounded-2xl bg-k-bg-card2 border border-k-border px-4 text-sm font-medium text-k-text-h placeholder:text-k-text-b/50 outline-none focus:ring-2 focus:ring-k-bg-sidebar/20 transition-all"
              />
            </div>

            {/* Activo */}
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
                  <span className={cx("h-2 w-2 rounded-full", isActive ? "bg-emerald-500" : "bg-neutral-300")} />
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
                  <span className={cx("h-2 w-2 rounded-full", !isActive ? "bg-neutral-500" : "bg-neutral-300")} />
                  Inactiva
                </button>
              </div>
            </div>
          </div>

          {/* Mostrar en dashboard */}
          <div className="flex items-start gap-3 rounded-2xl bg-k-bg-card2/50 border border-k-border p-4">
            <div className="shrink-0 mt-0.5">
              <button
                type="button"
                onClick={() => setShowInDashboard(!showInDashboard)}
                className={cx(
                  "h-5 w-5 rounded-md border flex items-center justify-center transition-all",
                  showInDashboard
                    ? "bg-k-accent-btn border-k-accent-btn text-white"
                    : "border-k-border bg-k-bg-card"
                )}
              >
                {showInDashboard && <Pin className="h-3 w-3" />}
              </button>
            </div>
            <div>
              <label
                onClick={() => setShowInDashboard(!showInDashboard)}
                className="text-sm font-bold text-k-text-h cursor-pointer select-none"
              >
                Mostrar rápido en Dashboard
              </label>
              <p className="text-xs font-medium text-k-text-b mt-0.5">
                Si lo marcas, esta plantilla aparecerá automáticamente en las Tareas Disponibles del gerente.
              </p>
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-k-text-b">
              Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Instrucciones generales de la tarea..."
              className="w-full rounded-2xl bg-k-bg-card2 border border-k-border px-4 py-3 text-sm font-medium text-k-text-h placeholder:text-k-text-b/50 outline-none focus:ring-2 focus:ring-k-bg-sidebar/20 transition-all resize-none"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-k-text-b">
              Etiquetas (opcional)
            </label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder='Ej. ["cierre","limpieza"]'
              className="w-full h-12 rounded-2xl bg-k-bg-card2 border border-k-border px-4 text-sm font-medium text-k-text-h placeholder:text-k-text-b/50 outline-none focus:ring-2 focus:ring-k-bg-sidebar/20 transition-all"
            />
          </div>

          {/* ── Instrucciones / Checklist ── */}
          <div className="border-t border-k-border pt-6">
            <label className="text-[10px] font-bold uppercase tracking-widest text-k-text-b mb-3 block">
              Detalle operativo
            </label>

            {/* Selector de modo */}
            <div className="flex p-1.5 bg-k-bg-card border border-k-border rounded-[28px] shadow-k-card gap-1 mb-5">
              {[
                { value: "none" as const, label: "Ninguna" },
                { value: "checklist" as const, label: "Checklist" },
                { value: "text" as const, label: "Texto libre" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setInstructionMode(opt.value);
                  }}
                  className={cx(
                    "flex-1 rounded-[22px] px-3 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all",
                    instructionMode === opt.value
                      ? "bg-k-bg-sidebar text-white shadow-lg shadow-obsidian/20"
                      : "text-k-text-b hover:text-k-text-h hover:bg-k-bg-card2"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Modo: ninguna */}
            {instructionMode === "none" && (
              <div className="rounded-2xl bg-k-bg-card2 border border-k-border p-6 text-center text-sm font-medium text-k-text-b">
                <Pin className="h-5 w-5 mx-auto mb-2 text-k-text-b/40" />
                Tarea simplificada: el empleado solo verá el título y la descripción general.
              </div>
            )}

            {/* Modo: checklist */}
            {instructionMode === "checklist" && (
              <div className="space-y-3">
                <ChecklistBuilder items={checklistItems} onChange={setChecklistItems} />

                {checklistItems.some((it) => !it.label.trim()) && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-[11px] font-bold text-rose-700 flex items-center gap-2">
                    <span className="text-sm">⚠️</span> Todos los pasos deben tener un nombre antes de guardar.
                  </div>
                )}
              </div>
            )}

            {/* Modo: texto libre */}
            {instructionMode === "text" && (
              <textarea
                value={textInstructions}
                onChange={(e) => setTextInstructions(e.target.value)}
                rows={6}
                placeholder="Escribe las instrucciones detalladas en texto plano, o inserta un JSON estructurado..."
                className="w-full rounded-2xl bg-k-bg-card2 border border-k-border px-4 py-3 text-sm font-medium text-k-text-h placeholder:text-k-text-b/50 outline-none focus:ring-2 focus:ring-k-bg-sidebar/20 transition-all resize-none font-mono"
              />
            )}
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
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>Guardar plantilla</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
