// src/features/tasks/components/TaskTreeAddTaskModal.tsx
// Modal para crear/editar una tarea directamente en una sección del árbol

import { useState, useMemo, useEffect } from "react";
import { X, ClipboardList, Clock, Calendar, Flag, Save, Loader2, Plus, Trash2, ListChecks } from "lucide-react";
import { cx } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { createTask, updateTask } from "@/features/tasks/api";
import type { Area, Section, TaskPriority, TaskV2, ChecklistItem } from "@/features/tasks/types";

const PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: "low", label: "Baja", color: "bg-slate-100 text-slate-600 border-slate-200" },
  { value: "medium", label: "Media", color: "bg-blue-50 text-blue-600 border-blue-200" },
  { value: "high", label: "Alta", color: "bg-amber-50 text-amber-600 border-amber-200" },
  { value: "urgent", label: "Urgente", color: "bg-rose-50 text-rose-600 border-rose-200" },
];

const ESTIMATED_OPTIONS = [
  { value: 15, label: "15m" },
  { value: 30, label: "30m" },
  { value: 60, label: "1h" },
  { value: 120, label: "2h" },
];

interface TaskTreeAddTaskModalProps {
  open: boolean;
  onClose: () => void;
  defaultArea?: Area | null;
  defaultSection?: Section | null;
  taskToEdit?: TaskV2 | null;
}

export default function TaskTreeAddTaskModal({
  open,
  onClose,
  defaultArea,
  defaultSection,
  taskToEdit,
}: TaskTreeAddTaskModalProps) {
  const queryClient = useQueryClient();
  const isEditMode = !!taskToEdit;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(30);
  const [dueDate, setDueDate] = useState("");
  const [checklistItems, setChecklistItems] = useState<string[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Load task data when editing
  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.name);
      setDescription(taskToEdit.description);
      setPriority(taskToEdit.priority);
      setEstimatedMinutes(taskToEdit.estimatedTime ?? 30);
      setDueDate(taskToEdit.dueDate ?? "");
      setChecklistItems(taskToEdit.checklist.map((c) => c.label));
    } else {
      setTitle("");
      setDescription("");
      setPriority("medium");
      setEstimatedMinutes(30);
      setDueDate("");
      setChecklistItems([]);
    }
    setErr(null);
  }, [taskToEdit, open]);

  const canSave = useMemo(() => title.trim().length >= 3, [title]);

  const handleSubmit = async () => {
    if (!canSave) return;
    setErr(null);
    setSubmitting(true);
    try {
      const checklist: ChecklistItem[] = checklistItems
        .filter((l) => l.trim())
        .map((label, i) => ({
          id: taskToEdit?.checklist[i]?.id ?? `chk-${Date.now()}-${i}`,
          label: label.trim(),
          done: taskToEdit?.checklist[i]?.done ?? false,
        }));

      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        due_at: dueDate || null,
        estimated_minutes: estimatedMinutes,
        meta: { checklist },
      };

      if (isEditMode && taskToEdit) {
        await updateTask(taskToEdit.id, payload);
        window.dispatchEvent(
          new CustomEvent("kore-notification", {
            detail: { title: "Tarea actualizada", body: `La tarea "${title.trim()}" se actualizó correctamente.` },
          })
        );
      } else {
        await createTask(payload);
        window.dispatchEvent(
          new CustomEvent("kore-notification", {
            detail: { title: "Tarea creada", body: `La tarea "${title.trim()}" se creó correctamente.` },
          })
        );
      }
      queryClient.invalidateQueries({ queryKey: ["tareas", "tree"] });
      queryClient.invalidateQueries({ queryKey: ["tareas", "by-section"] });
      handleClose();
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? `Error al ${isEditMode ? "actualizar" : "crear"} la tarea.`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setPriority("medium");
    setEstimatedMinutes(30);
    setDueDate("");
    setChecklistItems([]);
    setNewChecklistItem("");
    setErr(null);
    onClose();
  };

  const addChecklistItem = () => {
    const trimmed = newChecklistItem.trim();
    if (!trimmed) return;
    setChecklistItems((prev) => [...prev, trimmed]);
    setNewChecklistItem("");
  };

  const removeChecklistItem = (idx: number) => {
    setChecklistItems((prev) => prev.filter((_, i) => i !== idx));
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-k-bg-sidebar/40 backdrop-blur-sm transition-all"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-[520px] bg-k-bg-card h-full shadow-2xl flex flex-col animate-in-slide-left pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-k-border flex items-center justify-between shrink-0 bg-k-bg-card2/50">
          <div>
            <h2 className="text-xl font-black text-k-text-h tracking-tight">
              {isEditMode ? "Editar Tarea" : "Nueva Tarea en el Árbol"}
            </h2>
            <p className="text-xs font-medium text-k-text-b mt-1">
              {isEditMode
                ? "Modifica los datos de la tarea"
                : `Crea una tarea directamente en ${defaultSection?.name ?? "la sección"}${defaultArea ? ` · ${defaultArea.name}` : ""}`}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="h-10 w-10 rounded-full bg-k-bg-card border border-k-border flex items-center justify-center text-k-text-b hover:text-k-text-h hover:bg-k-bg-card2 hover:border-neutral-300 transition-colors shadow-k-card"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-6 custom-scrollbar">
          {err && (
            <div className="rounded-2xl bg-rose-50 border border-rose-100 px-4 py-3 text-sm text-rose-700 font-medium">
              {err}
            </div>
          )}

          {/* Título */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-k-text-b">
              Título de la tarea *
            </label>
            <div className="relative">
              <ClipboardList className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-k-text-b/50" />
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Limpiar el congelador N°3"
                className="w-full h-12 pl-11 pr-4 rounded-2xl bg-k-bg-card2 border border-k-border text-sm font-medium text-k-text-h placeholder:text-k-text-b/40 focus:outline-none focus:ring-2 focus:ring-k-bg-sidebar/20 transition-all"
              />
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-k-text-b">
              Descripción (opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Instrucciones breves..."
              rows={3}
              className="w-full rounded-2xl bg-k-bg-card2 border border-k-border px-4 py-3 text-sm font-medium text-k-text-h placeholder:text-k-text-b/40 focus:outline-none focus:ring-2 focus:ring-k-bg-sidebar/20 transition-all resize-none"
            />
          </div>

          {/* Prioridad */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-k-text-b flex items-center gap-1.5">
              <Flag className="h-3.5 w-3.5" /> Prioridad
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  className={cx(
                    "h-11 rounded-2xl text-xs font-bold border transition-all",
                    priority === p.value
                      ? `${p.color} ring-2 ring-offset-1 ring-k-bg-sidebar/20 shadow-sm`
                      : "bg-k-bg-card2 border-k-border text-k-text-b hover:border-neutral-300"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tiempo estimado */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-k-text-b flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Minutos estimados
            </label>
            <div className="flex gap-2">
              {ESTIMATED_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setEstimatedMinutes(opt.value)}
                  className={cx(
                    "h-11 w-16 rounded-2xl text-xs font-bold border transition-all",
                    estimatedMinutes === opt.value
                      ? "bg-k-accent-btn text-white border-k-accent-btn shadow-sm"
                      : "bg-k-bg-card2 border-k-border text-k-text-b hover:border-neutral-300"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Fecha límite */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-k-text-b flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> Fecha límite (opcional)
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full h-12 px-4 rounded-2xl bg-k-bg-card2 border border-k-border text-sm font-medium text-k-text-h focus:outline-none focus:ring-2 focus:ring-k-bg-sidebar/20 transition-all"
            />
          </div>

          {/* Checklist */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-k-text-b flex items-center gap-1.5">
              <ListChecks className="h-3.5 w-3.5" /> Checklist
            </label>
            <div className="space-y-2">
              {checklistItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="flex-1 rounded-xl bg-k-bg-card2 border border-k-border px-3 py-2 text-sm font-medium text-k-text-h">
                    {item}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeChecklistItem(idx)}
                    className="h-8 w-8 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 hover:bg-rose-100 transition-colors shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addChecklistItem()}
                  placeholder="Nuevo item del checklist..."
                  className="flex-1 h-10 px-4 rounded-2xl bg-k-bg-card2 border border-k-border text-sm font-medium text-k-text-h placeholder:text-k-text-b/40 focus:outline-none focus:ring-2 focus:ring-k-bg-sidebar/20 transition-all"
                />
                <button
                  type="button"
                  onClick={addChecklistItem}
                  disabled={!newChecklistItem.trim()}
                  className="h-10 px-4 rounded-2xl bg-k-accent-btn text-white text-xs font-bold hover:opacity-90 transition-all disabled:opacity-40 shrink-0 flex items-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Agregar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-k-border bg-k-bg-card2/50 shrink-0">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-4 bg-k-bg-card border border-k-border rounded-2xl text-[11px] font-black uppercase tracking-widest text-k-text-b hover:text-k-text-h hover:bg-k-bg-card2 hover:border-neutral-300 transition-all shadow-k-card"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={!canSave || submitting}
              onClick={handleSubmit}
              className="flex-[2] flex items-center justify-center gap-2 py-4 bg-k-accent-btn rounded-2xl text-[11px] font-black uppercase tracking-widest text-k-accent-btn-text hover:opacity-90 transition-all shadow-k-card disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {isEditMode ? "Guardar Cambios" : "Crear Tarea"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
