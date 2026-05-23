// src/features/tasks/components/ReglaFormModal.tsx
// ─── Modal profesional para crear/editar reglas de asignación multitemplate ─

import { useEffect, useMemo, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { cx } from "@/lib/utils";
import { X, Clock, LogIn, GripVertical, Plus, Trash2, Save, Loader2 } from "lucide-react";
import { listTemplates } from "@/features/tasks/catalog/api";
import { listEmployees } from "@/features/tasks/employeeApi";
import { listPositions } from "@/features/tasks/areaApi";
import type { TaskAssignmentRule, CreateTaskAssignmentRulePayload, Section } from "@/features/tasks/types";

const DAYS = [
  { n: 1, label: "Lun" },
  { n: 2, label: "Mar" },
  { n: 3, label: "Mié" },
  { n: 4, label: "Jue" },
  { n: 5, label: "Vie" },
  { n: 6, label: "Sáb" },
  { n: 0, label: "Dom" },
];

const ASSIGNEE_TYPES = [
  { value: "empleado" as const, label: "Empleado" },
  { value: "position" as const, label: "Puesto" },
  { value: "section_supervisor" as const, label: "Supervisor de sección" },
];

const TRIGGER_OPTIONS = [
  { value: "time" as const, label: "Por hora" },
  { value: "attendance_checkin" as const, label: "Por asistencia" },
  { value: "both" as const, label: "Ambos" },
];

interface ReglaFormModalProps {
  open: boolean;
  onClose: () => void;
  section?: Section | null;
  sections?: Section[];
  initialData?: TaskAssignmentRule | null;
  onSubmit: (payload: CreateTaskAssignmentRulePayload, id?: string) => void;
  isSubmitting?: boolean;
}

export default function ReglaFormModal({
  open,
  onClose,
  section,
  sections,
  initialData,
  onSubmit,
  isSubmitting = false,
}: ReglaFormModalProps) {
  const { data: templatesRes } = useQuery({
    queryKey: ["task-templates"],
    queryFn: () => listTemplates(),
    staleTime: 5 * 60 * 1000,
  });
  const { data: employees } = useQuery({
    queryKey: ["empleados"],
    queryFn: listEmployees,
    staleTime: 5 * 60 * 1000,
  });
  const { data: positions } = useQuery({
    queryKey: ["positions"],
    queryFn: listPositions,
    staleTime: 5 * 60 * 1000,
  });

  const templates = templatesRes?.data ?? [];

  const [templateIds, setTemplateIds] = useState<string[]>([]);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [assigneeType, setAssigneeType] = useState<TaskAssignmentRule["assigneeType"]>("position");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [sectionId, setSectionId] = useState<string>("");
  const [triggerEvent, setTriggerEvent] = useState<TaskAssignmentRule["triggerEvent"]>("time");
  const [triggerTime, setTriggerTime] = useState<string>("08:00");
  const [dayOfWeek, setDayOfWeek] = useState<number[]>([1, 2, 3, 4, 5]);
  const [isActive, setIsActive] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const isEditMode = !!initialData;
  const hasFixedSection = !!section;

  useEffect(() => {
    if (!open) return;
    setErr(null);
    if (initialData) {
      setTemplateIds(initialData.items.map((i) => i.templateId));
      setAssigneeType(initialData.assigneeType);
      setAssigneeId(initialData.assigneeId ?? "");
      setSectionId(initialData.sectionId ?? "");
      setTriggerEvent(initialData.triggerEvent);
      setTriggerTime(initialData.triggerTime ?? "08:00");
      setDayOfWeek(initialData.dayOfWeek);
      setIsActive(initialData.isActive);
    } else {
      setTemplateIds([]);
      setAssigneeType("position");
      setAssigneeId("");
      setSectionId(section?.id ?? "");
      setTriggerEvent("time");
      setTriggerTime("08:00");
      setDayOfWeek([1, 2, 3, 4, 5]);
      setIsActive(true);
    }
  }, [open, initialData, section]);

  const toggleTemplate = (id: string) => {
    setTemplateIds((prev) => {
      const has = prev.includes(id);
      return has ? prev.filter((x) => x !== id) : [...prev, id];
    });
  };

  const removeTemplate = (id: string) => {
    setTemplateIds((prev) => prev.filter((x) => x !== id));
  };

  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
      e.preventDefault();
      if (dragIndex === null || dragIndex === dropIndex) return;
      setTemplateIds((prev) => {
        const next = [...prev];
        const [moved] = next.splice(dragIndex, 1);
        next.splice(dropIndex, 0, moved);
        return next;
      });
      setDragIndex(null);
    },
    [dragIndex]
  );

  const toggleDay = (n: number) => {
    setDayOfWeek((prev) => {
      const has = prev.includes(n);
      return has ? prev.filter((x) => x !== n) : [...prev, n];
    });
  };

  const handleAssigneeTypeChange = (type: TaskAssignmentRule["assigneeType"]) => {
    setAssigneeType(type);
    setAssigneeId("");
  };

  const canSave = useMemo(() => {
    if (templateIds.length === 0) return false;
    if (dayOfWeek.length === 0) return false;
    if (!hasFixedSection && !sectionId) return false;
    if (assigneeType === "section_supervisor") return true;
    return !!assigneeId;
  }, [templateIds, dayOfWeek, hasFixedSection, sectionId, assigneeType, assigneeId]);

  const selectedTemplates = useMemo(() => {
    return templateIds
      .map((id) => templates.find((t) => t.id === id))
      .filter(Boolean) as { id: string; title: string }[];
  }, [templateIds, templates]);

  const handleSave = () => {
    setErr(null);
    if (!canSave) return;
    if (!hasFixedSection && !sectionId) {
      setErr("Selecciona una sección");
      return;
    }

    const payload: CreateTaskAssignmentRulePayload = {
      template_ids: templateIds,
      assignee_type: assigneeType,
      assignee_id: assigneeType === "section_supervisor" ? null : assigneeId || null,
      section_id: hasFixedSection ? section!.id : sectionId,
      day_of_week: dayOfWeek,
      trigger_time: triggerEvent === "attendance_checkin" ? undefined : triggerTime,
      trigger_event: triggerEvent,
      is_active: isActive,
    };

    onSubmit(payload, initialData?.id);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-k-bg-sidebar/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-3xl rounded-[32px] bg-k-bg-card shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in-fade animate-in-slide-up border border-k-border">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-k-border bg-k-bg-card2/50 px-8 py-6 shrink-0">
          <div>
            <h3 className="text-xl font-black text-k-text-h tracking-tight">
              {isEditMode ? "Editar Regla" : "Nueva Regla"}
            </h3>
            <p className="text-xs font-medium text-k-text-b mt-1">
              {isEditMode
                ? "Modifica la regla de asignación"
                : hasFixedSection
                ? `Crea una regla para la sección ${section!.name}`
                : "Crea una regla de asignación automática"}
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
        <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar">
          {err && (
            <div className="rounded-2xl bg-rose-50 border border-rose-100 px-4 py-3 text-sm text-rose-700 font-medium mb-6">
              {err}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ─── Columna izquierda: Tareas ─── */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-k-text-b">
                  Tareas de la regla *
                </label>

                {/* Chips ordenados con drag & drop */}
                {selectedTemplates.length > 0 && (
                  <div className="space-y-2">
                    {selectedTemplates.map((t, idx) => (
                      <div
                        key={t.id}
                        draggable
                        onDragStart={() => handleDragStart(idx)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, idx)}
                        className="flex items-center gap-2 rounded-full bg-k-bg-card2 border border-k-border px-3 py-1.5 cursor-grab active:cursor-grabbing"
                      >
                        <GripVertical className="h-3.5 w-3.5 text-k-text-b/50 shrink-0" />
                        <span className="flex-1 text-xs font-medium text-k-text-h truncate">{t.title}</span>
                        <button
                          type="button"
                          onClick={() => removeTemplate(t.id)}
                          className="h-6 w-6 rounded-full flex items-center justify-center text-rose-500 hover:bg-rose-50 transition-colors shrink-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {selectedTemplates.length === 0 && (
                  <div className="text-xs text-k-text-b/60 py-2">Agrega al menos una tarea</div>
                )}

                {/* Template picker toggle */}
                <button
                  type="button"
                  onClick={() => setShowTemplatePicker((v) => !v)}
                  className={cx(
                    "inline-flex items-center gap-1.5 text-xs font-bold transition-colors",
                    showTemplatePicker ? "text-k-accent-btn" : "text-k-text-b hover:text-k-accent-btn"
                  )}
                >
                  <Plus className="h-3.5 w-3.5" />
                  {showTemplatePicker ? "Ocultar plantillas" : "Agregar tarea"}
                </button>

                {/* Checkbox list */}
                {showTemplatePicker && (
                  <div className="rounded-2xl bg-k-bg-card2 border border-k-border p-3 space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                    {templates.length === 0 && (
                      <div className="text-xs text-k-text-b py-2">No hay plantillas disponibles</div>
                    )}
                    {templates.map((t) => {
                      const checked = templateIds.includes(t.id);
                      return (
                        <label
                          key={t.id}
                          className={cx(
                            "flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer transition-colors",
                            checked ? "bg-k-accent-btn/10" : "hover:bg-k-bg-card"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleTemplate(t.id)}
                            className="h-4 w-4 rounded border-k-border text-k-accent-btn focus:ring-k-accent-btn shrink-0"
                          />
                          <span className="text-sm font-medium text-k-text-h">{t.title}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ─── Columna derecha: Configuración ─── */}
            <div className="space-y-5">
              {/* Sección */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-k-text-b">Sección</label>
                {hasFixedSection ? (
                  <div className="w-full h-12 rounded-2xl bg-k-bg-card2 border border-k-border px-4 flex items-center text-sm font-medium text-k-text-h">
                    {section!.name}
                  </div>
                ) : (
                  <select
                    value={sectionId}
                    onChange={(e) => setSectionId(e.target.value)}
                    className="w-full h-12 rounded-2xl bg-k-bg-card2 border border-k-border px-4 text-sm font-medium text-k-text-h focus:outline-none focus:ring-2 focus:ring-k-bg-sidebar/20 transition-all"
                  >
                    <option value="">Seleccionar sección</option>
                    {sections?.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Asignado */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-k-text-b">Asignado *</label>

                {/* Tipo */}
                <div className="flex gap-2">
                  {ASSIGNEE_TYPES.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleAssigneeTypeChange(opt.value)}
                      className={cx(
                        "flex-1 h-12 rounded-2xl text-xs font-bold border transition-all",
                        assigneeType === opt.value
                          ? "bg-k-accent-btn text-white border-k-accent-btn shadow-sm"
                          : "bg-k-bg-card2 border-k-border text-k-text-b hover:border-neutral-300"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Select según tipo */}
                {assigneeType === "empleado" && (
                  <select
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className="w-full h-12 rounded-2xl bg-k-bg-card2 border border-k-border px-4 text-sm font-medium text-k-text-h focus:outline-none focus:ring-2 focus:ring-k-bg-sidebar/20 transition-all"
                  >
                    <option value="">Seleccionar empleado</option>
                    {employees?.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.full_name || e.name || e.id}
                      </option>
                    ))}
                  </select>
                )}

                {assigneeType === "position" && (
                  <select
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className="w-full h-12 rounded-2xl bg-k-bg-card2 border border-k-border px-4 text-sm font-medium text-k-text-h focus:outline-none focus:ring-2 focus:ring-k-bg-sidebar/20 transition-all"
                  >
                    <option value="">Seleccionar puesto</option>
                    {positions?.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                )}

                {assigneeType === "section_supervisor" && (
                  <div className="rounded-2xl bg-k-bg-card2 border border-k-border px-4 py-3 text-sm font-medium text-k-text-b flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                    Se asignará al supervisor de la sección
                  </div>
                )}
              </div>

              {/* Trigger */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-k-text-b">Trigger</label>
                <div className="flex gap-2">
                  {TRIGGER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setTriggerEvent(opt.value)}
                      className={cx(
                        "flex-1 h-12 rounded-2xl text-xs font-bold border transition-all",
                        triggerEvent === opt.value
                          ? "bg-k-accent-btn text-white border-k-accent-btn shadow-sm"
                          : "bg-k-bg-card2 border-k-border text-k-text-b hover:border-neutral-300"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {triggerEvent !== "attendance_checkin" && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-k-text-b flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" /> Hora
                    </label>
                    <input
                      type="time"
                      value={triggerTime}
                      onChange={(e) => setTriggerTime(e.target.value)}
                      className="w-full h-12 rounded-2xl bg-k-bg-card2 border border-k-border px-4 text-sm font-medium text-k-text-h focus:outline-none focus:ring-2 focus:ring-k-bg-sidebar/20 transition-all"
                    />
                  </div>
                )}

                {triggerEvent === "attendance_checkin" && (
                  <div className="rounded-2xl bg-k-bg-card2 border border-k-border p-3 text-xs text-k-text-b flex items-center gap-2">
                    <LogIn className="h-4 w-4 text-k-text-b/70 shrink-0" />
                    Se asignará automáticamente cuando el empleado marque asistencia
                  </div>
                )}

                {triggerEvent === "both" && (
                  <div className="rounded-2xl bg-amber-50/50 border border-amber-200/50 p-3 text-xs text-amber-700 flex items-center gap-2">
                    <LogIn className="h-4 w-4 shrink-0" />
                    También se asignará al marcar asistencia
                  </div>
                )}
              </div>

              {/* Días */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-k-text-b">
                  Días de la semana *
                </label>
                <div className="flex gap-2">
                  {DAYS.map((d) => {
                    const on = dayOfWeek.includes(d.n);
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

              {/* Activo */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-k-text-b">Estado</label>
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
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-k-border bg-k-bg-card2/50 px-8 py-5 shrink-0">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 h-12 rounded-2xl bg-k-bg-card border border-k-border text-[11px] font-black uppercase tracking-widest text-k-text-b hover:text-k-text-h hover:bg-k-bg-card2 hover:border-neutral-300 transition-all shadow-k-card"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave || isSubmitting}
              className="flex-[2] h-12 rounded-2xl bg-k-accent-btn text-[11px] font-black uppercase tracking-widest text-k-accent-btn-text hover:opacity-90 transition-all shadow-k-card disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {isEditMode ? "Guardar Cambios" : "Crear Regla"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
