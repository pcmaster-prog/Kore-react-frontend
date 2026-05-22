// src/features/tasks/TaskAssignmentRulesManager.tsx
// ─── Calendario semanal de reglas de asignación automática ──────────────────

import { useState } from "react";
import { cx } from "@/lib/utils";
import { useTaskAssignmentRules, useCreateTaskAssignmentRule, useDeleteTaskAssignmentRule } from "./hooks/useTaskAssignmentRules";
import { usePositions } from "./hooks/usePositions";
import type { TaskAssignmentRule, CreateTaskAssignmentRulePayload } from "./types";
import { Plus, Trash2, Clock, User, Users, Shield, X, Save } from "lucide-react";

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;
const DAY_VALUES = [1, 2, 3, 4, 5, 6, 0] as const;

export default function TaskAssignmentRulesManager() {
  const { data: rules, isLoading } = useTaskAssignmentRules();
  usePositions(); // prefetch positions for future use
  const createRule = useCreateTaskAssignmentRule();
  const deleteRule = useDeleteTaskAssignmentRule();

  const [showForm, setShowForm] = useState(false);
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
    if (!form.taskTemplateId || !form.assigneeId) return;
    createRule.mutate(form, {
      onSuccess: () => {
        setShowForm(false);
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
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-k-accent-btn text-white text-sm font-bold hover:opacity-90 transition-all"
        >
          <Plus className="h-4 w-4" />
          Nueva regla
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-2xl bg-k-bg-card border border-k-border p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-k-text-b">Plantilla de tarea</label>
              <input
                value={form.taskTemplateId}
                onChange={(e) => setForm((f) => ({ ...f, taskTemplateId: e.target.value }))}
                placeholder="ID de plantilla"
                className="mt-1 w-full h-10 rounded-xl bg-k-bg-card2 border border-k-border px-3 text-sm font-medium text-k-text-h placeholder:text-k-text-b/60 focus:outline-none focus:ring-2 focus:ring-k-bg-sidebar/20"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-k-text-b">Tipo de asignado</label>
              <select
                value={form.assigneeType}
                onChange={(e) => setForm((f) => ({ ...f, assigneeType: e.target.value as TaskAssignmentRule["assigneeType"] }))}
                className="mt-1 w-full h-10 rounded-xl bg-k-bg-card2 border border-k-border px-3 text-sm font-medium text-k-text-h focus:outline-none focus:ring-2 focus:ring-k-bg-sidebar/20"
              >
                <option value="empleado">Empleado</option>
                <option value="position">Posición</option>
                <option value="section_supervisor">Supervisor de sección</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-k-text-b">ID del asignado</label>
              <input
                value={form.assigneeId}
                onChange={(e) => setForm((f) => ({ ...f, assigneeId: e.target.value }))}
                placeholder="ID"
                className="mt-1 w-full h-10 rounded-xl bg-k-bg-card2 border border-k-border px-3 text-sm font-medium text-k-text-h placeholder:text-k-text-b/60 focus:outline-none focus:ring-2 focus:ring-k-bg-sidebar/20"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-k-text-b">Trigger</label>
              <select
                value={form.triggerEvent}
                onChange={(e) => setForm((f) => ({ ...f, triggerEvent: e.target.value as TaskAssignmentRule["triggerEvent"] }))}
                className="mt-1 w-full h-10 rounded-xl bg-k-bg-card2 border border-k-border px-3 text-sm font-medium text-k-text-h focus:outline-none focus:ring-2 focus:ring-k-bg-sidebar/20"
              >
                <option value="time">Por hora</option>
                <option value="attendance_checkin">Al marcar entrada</option>
                <option value="both">Ambos</option>
              </select>
            </div>
          </div>

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

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={!form.taskTemplateId || !form.assigneeId || createRule.isPending}
              className="h-10 px-5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50 inline-flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Guardar
            </button>
            <button
              onClick={() => setShowForm(false)}
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
                <RuleCard key={rule.id} rule={rule} onDelete={() => deleteRule.mutate(rule.id)} />
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

function RuleCard({ rule, onDelete }: { rule: TaskAssignmentRule; onDelete: () => void }) {
  const typeIcon = {
    empleado: <User className="h-3 w-3" />,
    position: <Users className="h-3 w-3" />,
    section_supervisor: <Shield className="h-3 w-3" />,
  };

  return (
    <div className="rounded-xl bg-k-bg-card border border-k-border p-2.5 space-y-1.5 shadow-k-card group relative">
      <div className="flex items-center gap-1.5 text-[10px] font-bold text-k-text-b">
        {typeIcon[rule.assigneeType]}
        <span className="uppercase tracking-wide">{rule.assigneeType}</span>
      </div>
      <div className="text-xs font-semibold text-k-text-h truncate">{rule.taskTemplateId}</div>
      {rule.triggerTime && (
        <div className="flex items-center gap-1 text-[10px] text-k-text-b">
          <Clock className="h-3 w-3" />
          {rule.triggerTime}
        </div>
      )}
      <button
        onClick={onDelete}
        className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 h-5 w-5 rounded-md bg-rose-50 flex items-center justify-center text-rose-500 hover:bg-rose-100 transition-all"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}
