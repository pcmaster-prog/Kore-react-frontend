// @ts-nocheck
// src/features/tasks/TaskAssignmentRulesManager.tsx
// ─── Calendario semanal de reglas de asignación automática ──────────────────

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { cx } from "@/lib/utils";
import { useTaskAssignmentRules, useCreateTaskAssignmentRule, useUpdateTaskAssignmentRule, useDeleteTaskAssignmentRule } from "./hooks/useTaskAssignmentRules";
import { usePositions } from "./hooks/usePositions";
import { useSections } from "./hooks/useSections";
import { listTemplates } from "./catalog/api";
import { listEmployees } from "./employeeApi";
import type { TaskAssignmentRule, CreateTaskAssignmentRulePayload } from "./types";
import { Plus, Trash2, Pencil, Clock, User, Users, Shield, X, Save, LogIn } from "lucide-react";

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;
const DAY_VALUES = [1, 2, 3, 4, 5, 6, 0] as const;

export default function TaskAssignmentRulesManager() {
  const { data: rules, isLoading } = useTaskAssignmentRules();
  const { data: positions } = usePositions();
  const { data: sections } = useSections();
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

  const templates = templatesRes?.data ?? [];
  const createRule = useCreateTaskAssignmentRule();
  const updateRule = useUpdateTaskAssignmentRule();
  const deleteRule = useDeleteTaskAssignmentRule();

  // Lookup maps
  const templateMap = useMemo(() => {
    const map = new Map<string, string>();
    templates.forEach((t) => map.set(t.id, t.title));
    return map;
  }, [templates]);

  const employeeMap = useMemo(() => {
    const map = new Map<string, string>();
    employees?.forEach((e) => map.set(e.id, e.full_name || e.name || e.id));
    return map;
  }, [employees]);

  const positionMap = useMemo(() => {
    const map = new Map<string, string>();
    positions?.forEach((p) => map.set(p.id, p.name));
    return map;
  }, [positions]);

  const sectionMap = useMemo(() => {
    const map = new Map<string, string>();
    sections?.forEach((s) => map.set(s.id, s.name));
    return map;
  }, [sections]);

  const [showForm, setShowForm] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateTaskAssignmentRulePayload>({
    taskTemplateId: "",
    assigneeType: "position",
    assigneeId: "",
    sectionId: "",
    dayOfWeek: [1, 2, 3, 4, 5],
    triggerTime: "08:00",
    triggerEvent: "time",
    isActive: true,
  });

  const setAssigneeType = (type: TaskAssignmentRule["assigneeType"]) => {
    setForm((prev) => ({
      ...prev,
      assigneeType: type,
      assigneeId: "",
      sectionId: "",
    }));
  };

  const toggleDay = (day: number) => {
    setForm((prev) => {
      const has = prev.dayOfWeek.includes(day);
      return {
        ...prev,
        dayOfWeek: has ? prev.dayOfWeek.filter((d) => d !== day) : [...prev.dayOfWeek, day],
      };
    });
  };

  const handleSave = () => {
    const isSectionSupervisor = form.assigneeType === "section_supervisor";
    if (!form.taskTemplateId) return;
    if (isSectionSupervisor ? !form.sectionId : !form.assigneeId) return;

    const template = templates.find((t) => t.id === form.taskTemplateId);
    const payload: CreateTaskAssignmentRulePayload = {
      ...form,
      templateTitle: template?.title,
      assigneeId: isSectionSupervisor ? "" : form.assigneeId,
    };

    if (editingRuleId) {
      updateRule.mutate({ id: editingRuleId, payload }, {
        onSuccess: () => {
          setShowForm(false);
          setEditingRuleId(null);
          setForm({
            taskTemplateId: "",
            assigneeType: "position",
            assigneeId: "",
            sectionId: "",
            dayOfWeek: [1, 2, 3, 4, 5],
            triggerTime: "08:00",
            triggerEvent: "time",
            isActive: true,
          });
        },
      });
    } else {
      createRule.mutate(payload, {
        onSuccess: () => {
          setShowForm(false);
          setEditingRuleId(null);
          setForm({
            taskTemplateId: "",
            assigneeType: "position",
            assigneeId: "",
            sectionId: "",
            dayOfWeek: [1, 2, 3, 4, 5],
            triggerTime: "08:00",
            triggerEvent: "time",
            isActive: true,
          });
        },
      });
    }
  };

  const isFormValid = useMemo(() => {
    const isSectionSupervisor = form.assigneeType === "section_supervisor";
    if (!form.taskTemplateId) return false;
    if (isSectionSupervisor) return !!form.sectionId;
    return !!form.assigneeId;
  }, [form]);

  const previewText = useMemo(() => {
    if (!form.taskTemplateId) return null;

    if (form.assigneeType === "empleado" && form.assigneeId) {
      const name = employeeMap.get(form.assigneeId) ?? "el empleado seleccionado";
      return `Esta regla asignará a ${name} (Empleado)`;
    }
    if (form.assigneeType === "position" && form.assigneeId) {
      const name = positionMap.get(form.assigneeId) ?? "el puesto seleccionado";
      return `Esta regla asignará a todos los ${name} (Puesto)`;
    }
    if (form.assigneeType === "section_supervisor" && form.sectionId) {
      const name = sectionMap.get(form.sectionId) ?? "la sección seleccionada";
      return `Esta regla asignará a los supervisores de la sección ${name}`;
    }
    return null;
  }, [form, employeeMap, positionMap, sectionMap]);

  const handleEditRule = (rule: TaskAssignmentRule) => {
    setForm({
      taskTemplateId: rule.taskTemplateId,
      assigneeType: rule.assigneeType,
      assigneeId: rule.assigneeId ?? "",
      sectionId: rule.sectionId ?? "",
      dayOfWeek: rule.dayOfWeek,
      triggerTime: rule.triggerTime ?? "08:00",
      triggerEvent: rule.triggerEvent,
      isActive: rule.isActive,
    });
    setEditingRuleId(rule.id);
    setShowForm(true);
  };

  const rulesByDay = (day: number) => rules?.filter((r) => r.dayOfWeek.includes(day) && r.isActive) ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-k-text-b text-sm font-medium">Cargando reglas...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black text-k-text-h tracking-tight">Reglas de Asignación</h3>
        <button
          onClick={() => {
            setEditingRuleId(null);
            setForm({
              taskTemplateId: "",
              assigneeType: "position",
              assigneeId: "",
              sectionId: "",
              dayOfWeek: [1, 2, 3, 4, 5],
              triggerTime: "08:00",
              triggerEvent: "time",
              isActive: true,
            });
            setShowForm(true);
          }}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-k-accent-btn text-white text-sm font-bold hover:opacity-90 transition-all"
        >
          <Plus className="h-4 w-4" />
          Nueva regla
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-2xl bg-k-bg-card border border-k-border p-5 space-y-4">
          <h4 className="text-sm font-bold text-k-text-h">
            {editingRuleId ? "Editar regla" : "Nueva regla"}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Template */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-k-text-b">Plantilla de tarea</label>
              <select
                value={form.taskTemplateId}
                onChange={(e) => setForm((f) => ({ ...f, taskTemplateId: e.target.value }))}
                className="mt-1 w-full h-10 rounded-xl bg-k-bg-card2 border border-k-border px-3 text-sm font-medium text-k-text-h focus:outline-none focus:ring-2 focus:ring-k-bg-sidebar/20"
              >
                <option value="">Seleccionar plantilla</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Assignee Type */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-k-text-b">Tipo de asignado</label>
              <select
                value={form.assigneeType}
                onChange={(e) => setAssigneeType(e.target.value as TaskAssignmentRule["assigneeType"])}
                className="mt-1 w-full h-10 rounded-xl bg-k-bg-card2 border border-k-border px-3 text-sm font-medium text-k-text-h focus:outline-none focus:ring-2 focus:ring-k-bg-sidebar/20"
              >
                <option value="empleado">Empleado</option>
                <option value="position">Puesto</option>
                <option value="section_supervisor">Supervisor de sección</option>
              </select>
            </div>

            {/* Assignee */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-k-text-b">
                {form.assigneeType === "empleado"
                  ? "Empleado"
                  : form.assigneeType === "position"
                  ? "Puesto"
                  : "Sección"}
              </label>
              {form.assigneeType === "empleado" && (
                <select
                  value={form.assigneeId}
                  onChange={(e) => setForm((f) => ({ ...f, assigneeId: e.target.value }))}
                  className="mt-1 w-full h-10 rounded-xl bg-k-bg-card2 border border-k-border px-3 text-sm font-medium text-k-text-h focus:outline-none focus:ring-2 focus:ring-k-bg-sidebar/20"
                >
                  <option value="">Seleccionar empleado</option>
                  {employees?.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.full_name || e.name || e.id}
                    </option>
                  ))}
                </select>
              )}
              {form.assigneeType === "position" && (
                <select
                  value={form.assigneeId}
                  onChange={(e) => setForm((f) => ({ ...f, assigneeId: e.target.value }))}
                  className="mt-1 w-full h-10 rounded-xl bg-k-bg-card2 border border-k-border px-3 text-sm font-medium text-k-text-h focus:outline-none focus:ring-2 focus:ring-k-bg-sidebar/20"
                >
                  <option value="">Seleccionar puesto</option>
                  {positions?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}
              {form.assigneeType === "section_supervisor" && (
                <select
                  value={form.sectionId}
                  onChange={(e) => setForm((f) => ({ ...f, sectionId: e.target.value }))}
                  className="mt-1 w-full h-10 rounded-xl bg-k-bg-card2 border border-k-border px-3 text-sm font-medium text-k-text-h focus:outline-none focus:ring-2 focus:ring-k-bg-sidebar/20"
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

            {/* Trigger */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-k-text-b">Trigger</label>
              <select
                value={form.triggerEvent}
                onChange={(e) => setForm((f) => ({ ...f, triggerEvent: e.target.value as TaskAssignmentRule["triggerEvent"] }))}
                className="mt-1 w-full h-10 rounded-xl bg-k-bg-card2 border border-k-border px-3 text-sm font-medium text-k-text-h focus:outline-none focus:ring-2 focus:ring-k-bg-sidebar/20"
              >
                <option value="time">Por hora</option>
                <option value="attendance_checkin">Por asistencia</option>
                <option value="both">Ambos</option>
              </select>
            </div>
          </div>

          {/* Time picker / trigger info */}
          {form.triggerEvent !== "attendance_checkin" && (
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-k-text-b">Hora</label>
              <input
                type="time"
                value={form.triggerTime}
                onChange={(e) => setForm((f) => ({ ...f, triggerTime: e.target.value }))}
                className="mt-1 h-10 rounded-xl bg-k-bg-card2 border border-k-border px-3 text-sm font-medium text-k-text-h focus:outline-none focus:ring-2 focus:ring-k-bg-sidebar/20"
              />
            </div>
          )}

          {form.triggerEvent === "attendance_checkin" && (
            <div className="rounded-xl bg-k-bg-card2 border border-k-border p-3 text-xs text-k-text-b flex items-center gap-2">
              <LogIn className="h-4 w-4 text-k-text-b/70 shrink-0" />
              Se asignará automáticamente cuando el empleado marque asistencia
            </div>
          )}

          {form.triggerEvent === "both" && (
            <div className="rounded-xl bg-amber-50/50 border border-amber-200/50 p-3 text-xs text-amber-700 flex items-center gap-2">
              <LogIn className="h-4 w-4 shrink-0" />
              También se asignará al marcar asistencia
            </div>
          )}

          {/* Days */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-k-text-b mb-2 block">Días de la semana</label>
            <div className="flex gap-2">
              {DAY_VALUES.map((day, idx) => {
                const active = form.dayOfWeek.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={cx(
                      "h-10 w-10 rounded-xl text-xs font-bold transition-all",
                      active
                        ? "bg-k-accent-btn text-white shadow-md"
                        : "bg-k-bg-card2 text-k-text-b hover:bg-k-border"
                    )}
                  >
                    {DAYS[idx]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview */}
          {previewText && (
            <div className="text-xs font-medium text-k-text-b bg-k-bg-card2 rounded-xl border border-k-border p-3">
              {previewText}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={!isFormValid || createRule.isPending || updateRule.isPending}
              className="h-10 px-5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50 inline-flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {editingRuleId ? "Actualizar" : "Guardar"}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingRuleId(null);
              }}
              className="h-10 px-4 rounded-xl bg-k-bg-card2 text-k-text-h text-sm font-bold hover:bg-k-border transition-all inline-flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Weekly Grid */}
      <div className="grid grid-cols-7 gap-2">
        {DAY_VALUES.map((day, idx) => (
          <div key={day} className="space-y-2">
            <div className="text-center text-xs font-bold text-k-text-b uppercase tracking-wider py-2 rounded-xl bg-k-bg-card border border-k-border">
              {DAYS[idx]}
            </div>
            <div className="space-y-1.5 min-h-[80px]">
              {rulesByDay(day).map((rule) => (
                <RuleCard
                  key={rule.id}
                  rule={rule}
                  onEdit={() => handleEditRule(rule)}
                  onDelete={() => deleteRule.mutate(rule.id)}
                  templateMap={templateMap}
                  employeeMap={employeeMap}
                  positionMap={positionMap}
                  sectionMap={sectionMap}
                />
              ))}
              {rulesByDay(day).length === 0 && (
                <div className="text-center py-4 text-[10px] text-k-text-b/50">Sin reglas</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Sub-componente: Tarjeta de regla ───────────────────────────────────────

function RuleCard({
  rule,
  onEdit,
  onDelete,
  templateMap,
  employeeMap,
  positionMap,
  sectionMap,
}: {
  rule: TaskAssignmentRule;
  onEdit: () => void;
  onDelete: () => void;
  templateMap: Map<string, string>;
  employeeMap: Map<string, string>;
  positionMap: Map<string, string>;
  sectionMap: Map<string, string>;
}) {
  const typeIcon = {
    empleado: <User className="h-3 w-3" />,
    position: <Users className="h-3 w-3" />,
    section_supervisor: <Shield className="h-3 w-3" />,
  };

  const typeLabel = {
    empleado: "Empleado",
    position: "Puesto",
    section_supervisor: "Supervisor",
  };

  const templateName = rule.templateTitle || templateMap.get(rule.taskTemplateId) || rule.taskTemplateId;

  const assigneeName = (() => {
    if (rule.assigneeType === "empleado" && rule.assigneeId) {
      return employeeMap.get(rule.assigneeId) || rule.assigneeId;
    }
    if (rule.assigneeType === "position" && rule.assigneeId) {
      return positionMap.get(rule.assigneeId) || rule.assigneeId;
    }
    if (rule.assigneeType === "section_supervisor" && rule.sectionId) {
      return sectionMap.get(rule.sectionId) || rule.sectionId;
    }
    return "Desconocido";
  })();

  return (
    <div className="rounded-xl bg-k-bg-card border border-k-border p-2.5 space-y-1 shadow-k-card group relative">
      <div className="flex items-center gap-1.5 text-[10px] font-bold text-k-text-b">
        {typeIcon[rule.assigneeType]}
        <span className="uppercase tracking-wide">{typeLabel[rule.assigneeType]}</span>
      </div>
      <div className="text-xs font-semibold text-k-text-h truncate" title={templateName}>
        {templateName}
      </div>
      <div className="text-[10px] text-k-text-b truncate">
        {assigneeName}
      </div>
      <div className="flex items-center gap-2">
        {rule.triggerEvent !== "attendance_checkin" && rule.triggerTime && (
          <div className="flex items-center gap-1 text-[10px] text-k-text-b">
            <Clock className="h-3 w-3" />
            {rule.triggerTime}
          </div>
        )}
        {rule.triggerEvent !== "time" && (
          <div className="flex items-center gap-1 text-[10px] text-k-text-b">
            <LogIn className="h-3 w-3" />
            {rule.triggerEvent === "both" ? "Asistencia" : "Por asistencia"}
          </div>
        )}
      </div>
      <button
        onClick={onEdit}
        className="absolute top-1.5 right-7 opacity-0 group-hover:opacity-100 h-5 w-5 rounded-md bg-blue-50 flex items-center justify-center text-blue-500 hover:bg-blue-100 transition-all"
      >
        <Pencil className="h-3 w-3" />
      </button>
      <button
        onClick={onDelete}
        className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 h-5 w-5 rounded-md bg-rose-50 flex items-center justify-center text-rose-500 hover:bg-rose-100 transition-all"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}
