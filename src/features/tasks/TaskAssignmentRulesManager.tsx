// src/features/tasks/TaskAssignmentRulesManager.tsx
// ─── Calendario semanal de reglas de asignación automática ──────────────────

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTaskAssignmentRules, useCreateTaskAssignmentRule, useUpdateTaskAssignmentRule, useDeleteTaskAssignmentRule } from "./hooks/useTaskAssignmentRules";
import { usePositions } from "./hooks/usePositions";
import { useSections } from "./hooks/useSections";
import { listTemplates } from "./catalog/api";
import { listEmployees } from "./employeeApi";
import ReglaFormModal from "./components/ReglaFormModal";
import type { TaskAssignmentRule, CreateTaskAssignmentRulePayload } from "./types";
import { Plus, Trash2, Pencil, Clock, User, Users, Shield, LogIn } from "lucide-react";

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

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<TaskAssignmentRule | null>(null);

  const handleOpenModal = (rule?: TaskAssignmentRule) => {
    setEditingRule(rule ?? null);
    setModalOpen(true);
  };

  const handleSubmitRule = (payload: CreateTaskAssignmentRulePayload, id?: string) => {
    if (id) {
      updateRule.mutate(
        { id, payload },
        {
          onSuccess: () => {
            setModalOpen(false);
            setEditingRule(null);
          },
        }
      );
    } else {
      createRule.mutate(payload, {
        onSuccess: () => {
          setModalOpen(false);
          setEditingRule(null);
        },
      });
    }
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
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-k-accent-btn text-white text-sm font-bold hover:opacity-90 transition-all"
        >
          <Plus className="h-4 w-4" />
          Nueva regla
        </button>
      </div>

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
                  onEdit={() => handleOpenModal(rule)}
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

      <ReglaFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingRule(null);
        }}
        sections={sections ?? []}
        initialData={editingRule}
        onSubmit={handleSubmitRule}
        isSubmitting={createRule.isPending || updateRule.isPending}
      />
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
    <div
      onClick={onEdit}
      className="rounded-xl bg-k-bg-card border border-k-border p-2.5 space-y-1.5 shadow-k-card group relative cursor-pointer hover:border-k-accent-btn/30 transition-colors"
    >
      <div className="flex items-center gap-1.5 text-[10px] font-bold text-k-text-b">
        {typeIcon[rule.assigneeType]}
        <span className="uppercase tracking-wide">{typeLabel[rule.assigneeType]}</span>
      </div>

      <div className="text-xs font-semibold text-k-text-h">
        {rule.items.length} tarea{rule.items.length !== 1 ? "s" : ""}
      </div>

      {/* Chips de templates */}
      {rule.items.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {rule.items.map((item) => (
            <span
              key={item.id}
              className="inline-block rounded-md bg-k-bg-card2 border border-k-border px-1.5 py-0.5 text-[10px] font-medium text-k-text-b truncate max-w-full"
              title={item.template?.title || templateMap.get(item.templateId) || item.templateId}
            >
              {item.template?.title || templateMap.get(item.templateId) || item.templateId}
            </span>
          ))}
        </div>
      )}

      <div className="text-[10px] text-k-text-b truncate">{assigneeName}</div>

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

      <div className="absolute top-1.5 right-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="h-6 w-6 rounded-md bg-blue-50 flex items-center justify-center text-blue-500 hover:bg-blue-100 transition-all"
          title="Editar"
        >
          <Pencil className="h-3 w-3" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="h-6 w-6 rounded-md bg-rose-50 flex items-center justify-center text-rose-500 hover:bg-rose-100 transition-all"
          title="Eliminar"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
