// src/features/tasks/AreaSectionManager.tsx
// ─── CRUD de Áreas y Secciones con reordenamiento ───────────────────────────

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { cx } from "@/lib/utils";
import { useAreasWithSections, useCreateArea, useUpdateArea, useDeleteArea } from "./hooks/useAreas";
import { useCreateSection, useUpdateSection, useDeleteSection } from "./hooks/useSections";
import {
  useTaskAssignmentRules,
  useCreateTaskAssignmentRule,
  useUpdateTaskAssignmentRule,
  useDeleteTaskAssignmentRule,
} from "./hooks/useTaskAssignmentRules";
import { listTemplates } from "./catalog/api";
import { listEmployees } from "./employeeApi";
import { listPositions } from "./areaApi";
import ReglaFormModal from "./components/ReglaFormModal";
import type { Section, TaskAssignmentRule } from "./types";
import {
  Plus,
  GripVertical,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Save,
  X,
  ToggleLeft,
  ToggleRight,
  ClipboardList,
  Clock,
  LogIn,
  User,
  Users,
  Shield,
} from "lucide-react";

export default function AreaSectionManager() {
  const { data: areas, isLoading } = useAreasWithSections();
  const createArea = useCreateArea();
  const updateArea = useUpdateArea();
  const deleteArea = useDeleteArea();
  const createSection = useCreateSection();
  const updateSection = useUpdateSection();
  const deleteSection = useDeleteSection();

  const { data: rules } = useTaskAssignmentRules();
  const createRule = useCreateTaskAssignmentRule();
  const updateRule = useUpdateTaskAssignmentRule();
  const deleteRule = useDeleteTaskAssignmentRule();

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

  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [editingArea, setEditingArea] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [areaForm, setAreaForm] = useState<{ name: string; icon: string }>({ name: "", icon: "Folder" });
  const [sectionForm, setSectionForm] = useState<{ name: string }>({ name: "" });
  const [showNewArea, setShowNewArea] = useState(false);
  const [newSectionAreaId, setNewSectionAreaId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalSection, setModalSection] = useState<Section | null>(null);
  const [editingRule, setEditingRule] = useState<TaskAssignmentRule | null>(null);

  const toggleArea = (id: string) => {
    setExpandedAreas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreateArea = () => {
    if (!areaForm.name.trim()) return;
    createArea.mutate(
      {
        name: areaForm.name.trim(),
        icon: areaForm.icon || "Folder",
        sortOrder: (areas?.length ?? 0) + 1,
        isActive: true,
      },
      {
        onSuccess: () => {
          setAreaForm({ name: "", icon: "Folder" });
          setShowNewArea(false);
        },
      }
    );
  };

  const handleCreateSection = (areaId: string) => {
    if (!sectionForm.name.trim()) return;
    const area = areas?.find((a) => a.id === areaId);
    const nextSort = (area?.sections?.length ?? 0) + 1;
    createSection.mutate(
      {
        areaId,
        name: sectionForm.name.trim(),
        sortOrder: nextSort,
        isActive: true,
      },
      {
        onSuccess: () => {
          setSectionForm({ name: "" });
          setNewSectionAreaId(null);
          setExpandedAreas((prev) => new Set(prev).add(areaId));
        },
      }
    );
  };

  const handleOpenModal = (section: Section, rule?: TaskAssignmentRule) => {
    setModalSection(section);
    setEditingRule(rule ?? null);
    setModalOpen(true);
  };

  const handleSubmitRule = (payload: Parameters<typeof createRule.mutate>[0], id?: string) => {
    if (id) {
      updateRule.mutate(
        { id, payload },
        {
          onSuccess: () => {
            setModalOpen(false);
            setEditingRule(null);
            setModalSection(null);
          },
        }
      );
    } else {
      createRule.mutate(payload, {
        onSuccess: () => {
          setModalOpen(false);
          setEditingRule(null);
          setModalSection(null);
        },
      });
    }
  };

  const handleDeleteRule = (ruleId: string) => {
    if (confirm("¿Eliminar esta regla de asignación?")) {
      deleteRule.mutate(ruleId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-k-text-b text-sm font-medium">Cargando áreas...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black text-k-text-h tracking-tight">Áreas y Secciones</h3>
        <button
          onClick={() => setShowNewArea(true)}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-k-accent-btn text-white text-sm font-bold hover:opacity-90 transition-all"
        >
          <Plus className="h-4 w-4" />
          Nueva área
        </button>
      </div>

      {/* Nueva Área Form */}
      {showNewArea && (
        <div className="rounded-2xl bg-k-bg-card border border-k-border p-4 space-y-3">
          <div className="flex items-center gap-3">
            <input
              autoFocus
              value={areaForm.name}
              onChange={(e) => setAreaForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Nombre del área"
              className="flex-1 h-10 rounded-xl bg-k-bg-card2 border border-k-border px-3 text-sm font-medium text-k-text-h placeholder:text-k-text-b/60 focus:outline-none focus:ring-2 focus:ring-k-bg-sidebar/20"
            />
            <button
              onClick={handleCreateArea}
              disabled={!areaForm.name.trim() || createArea.isPending}
              className="h-10 px-4 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowNewArea(false)}
              className="h-10 px-3 rounded-xl bg-k-bg-card2 text-k-text-b hover:text-k-text-h transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Lista de Áreas */}
      <div className="space-y-2">
        {areas?.map((area) => {
          const isExpanded = expandedAreas.has(area.id);
          const isEditing = editingArea === area.id;

          return (
            <div key={area.id} className="rounded-2xl bg-k-bg-card border border-k-border shadow-k-card overflow-hidden">
              {/* Área Header */}
              <div className="flex items-center gap-2 px-4 py-3">
                <button onClick={() => toggleArea(area.id)} className="shrink-0 text-k-text-b">
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>

                <GripVertical className="h-4 w-4 text-k-text-b/40 shrink-0 cursor-grab" />

                {isEditing ? (
                  <input
                    autoFocus
                    defaultValue={area.name}
                    onBlur={(e) => {
                      if (e.target.value.trim() && e.target.value !== area.name) {
                        updateArea.mutate({ id: area.id, payload: { name: e.target.value.trim() } });
                      }
                      setEditingArea(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                      if (e.key === "Escape") setEditingArea(null);
                    }}
                    className="flex-1 h-9 rounded-lg bg-k-bg-card2 border border-k-border px-2 text-sm font-bold text-k-text-h focus:outline-none focus:ring-2 focus:ring-k-bg-sidebar/20"
                  />
                ) : (
                  <span className="flex-1 text-sm font-bold text-k-text-h">{area.name}</span>
                )}

                {/* Toggle active */}
                <button
                  onClick={() => updateArea.mutate({ id: area.id, payload: { isActive: !area.isActive } })}
                  className={cx("shrink-0", area.isActive ? "text-emerald-500" : "text-neutral-300")}
                  title={area.isActive ? "Activa" : "Inactiva"}
                >
                  {area.isActive ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                </button>

                {!isEditing && (
                  <>
                    <button
                      onClick={() => setEditingArea(area.id)}
                      className="shrink-0 h-7 w-7 rounded-lg bg-k-bg-card2 flex items-center justify-center text-k-text-b hover:text-k-text-h transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar área "${area.name}"? Se eliminarán también sus secciones.`)) {
                          deleteArea.mutate(area.id);
                        }
                      }}
                      className="shrink-0 h-7 w-7 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500 hover:bg-rose-100 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>

              {/* Secciones */}
              {isExpanded && (
                <div className="px-4 pb-3 space-y-1">
                  {area.sections?.map((section) => (
                    <SectionItem
                      key={section.id}
                      section={section}
                      isEditing={editingSection === section.id}
                      isExpanded={expandedSections.has(section.id)}
                      rules={rules?.filter((r) => r.sectionId === section.id) ?? []}
                      templateMap={templateMap}
                      employeeMap={employeeMap}
                      positionMap={positionMap}
                      onEdit={() => setEditingSection(section.id)}
                      onSave={(name) => {
                        updateSection.mutate({ id: section.id, payload: { name } });
                        setEditingSection(null);
                      }}
                      onCancel={() => setEditingSection(null)}
                      onDelete={() => {
                        if (confirm(`¿Eliminar sección "${section.name}"?`)) {
                          deleteSection.mutate(section.id);
                        }
                      }}
                      onToggleActive={() =>
                        updateSection.mutate({ id: section.id, payload: { isActive: !section.isActive } })
                      }
                      onToggleExpand={() => toggleSection(section.id)}
                      onAddRule={() => handleOpenModal(section)}
                      onEditRule={(rule) => handleOpenModal(section, rule)}
                      onDeleteRule={handleDeleteRule}
                    />
                  ))}

                  {/* Nueva sección */}
                  {newSectionAreaId === area.id ? (
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        autoFocus
                        value={sectionForm.name}
                        onChange={(e) => setSectionForm({ name: e.target.value })}
                        placeholder="Nombre de la sección"
                        className="flex-1 h-9 rounded-lg bg-k-bg-card2 border border-k-border px-2 text-sm font-medium text-k-text-h placeholder:text-k-text-b/60 focus:outline-none focus:ring-2 focus:ring-k-bg-sidebar/20"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCreateSection(area.id);
                          if (e.key === "Escape") setNewSectionAreaId(null);
                        }}
                      />
                      <button
                        onClick={() => handleCreateSection(area.id)}
                        disabled={!sectionForm.name.trim()}
                        className="h-9 px-3 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50"
                      >
                        <Save className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setNewSectionAreaId(null)}
                        className="h-9 px-2 rounded-lg bg-k-bg-card2 text-k-text-b hover:text-k-text-h transition-all"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setNewSectionAreaId(area.id)}
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-k-text-b hover:text-k-accent-btn transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Agregar sección
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {(!areas || areas.length === 0) && (
          <div className="text-center py-10 text-k-text-b text-sm bg-k-bg-card rounded-2xl border border-k-border">
            No hay áreas configuradas. Crea la primera arriba.
          </div>
        )}
      </div>

      {/* Modal */}
      <ReglaFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingRule(null);
          setModalSection(null);
        }}
        section={modalSection}
        initialData={editingRule}
        onSubmit={handleSubmitRule}
        isSubmitting={createRule.isPending || updateRule.isPending}
      />
    </div>
  );
}

// ─── Sub-componente: Item de sección con reglas ─────────────────────────────

function SectionItem({
  section,
  isEditing,
  isExpanded,
  rules,
  templateMap,
  employeeMap,
  positionMap,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onToggleActive,
  onToggleExpand,
  onAddRule,
  onEditRule,
  onDeleteRule,
}: {
  section: Section;
  isEditing: boolean;
  isExpanded: boolean;
  rules: TaskAssignmentRule[];
  templateMap: Map<string, string>;
  employeeMap: Map<string, string>;
  positionMap: Map<string, string>;
  onEdit: () => void;
  onSave: (name: string) => void;
  onCancel: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  onToggleExpand: () => void;
  onAddRule: () => void;
  onEditRule: (rule: TaskAssignmentRule) => void;
  onDeleteRule: (ruleId: string) => void;
}) {
  if (isEditing) {
    return (
      <div className="flex items-center gap-2 py-1">
        <GripVertical className="h-4 w-4 text-k-text-b/40 shrink-0 cursor-grab" />
        <input
          autoFocus
          defaultValue={section.name}
          onBlur={(e) => {
            if (e.target.value.trim()) onSave(e.target.value.trim());
            else onCancel();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            if (e.key === "Escape") onCancel();
          }}
          className="flex-1 h-8 rounded-lg bg-k-bg-card2 border border-k-border px-2 text-sm font-medium text-k-text-h focus:outline-none focus:ring-2 focus:ring-k-bg-sidebar/20"
        />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-transparent hover:border-k-border transition-colors">
      {/* Fila de sección */}
      <div className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-k-bg-card2 transition-colors">
        <button onClick={onToggleExpand} className="shrink-0 text-k-text-b">
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        <GripVertical className="h-4 w-4 text-k-text-b/40 shrink-0 cursor-grab" />
        <span className={cx("flex-1 text-sm font-medium", !section.isActive && "opacity-50 line-through")}>
          {section.name}
        </span>
        <button
          onClick={onToggleActive}
          className={cx("shrink-0", section.isActive ? "text-emerald-500" : "text-neutral-300")}
        >
          {section.isActive ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
        </button>
        <button
          onClick={onEdit}
          className="shrink-0 h-6 w-6 rounded-md bg-k-bg-card flex items-center justify-center text-k-text-b hover:text-k-text-h transition-colors"
        >
          <Pencil className="h-3 w-3" />
        </button>
        <button
          onClick={onDelete}
          className="shrink-0 h-6 w-6 rounded-md bg-rose-50 flex items-center justify-center text-rose-500 hover:bg-rose-100 transition-colors"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {/* Reglas */}
      {isExpanded && (
        <div className="ml-7 mr-2 mb-3 mt-1 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-k-text-b uppercase tracking-wider">
            <ClipboardList className="h-3.5 w-3.5" />
            Tareas programadas
          </div>
          <div className="h-px bg-k-border" />

          {rules.length === 0 && (
            <div className="text-xs text-k-text-b/60 py-1">Sin reglas configuradas</div>
          )}

          <div className="space-y-2">
            {rules.map((rule) => (
              <RuleCard
                key={rule.id}
                rule={rule}
                templateMap={templateMap}
                employeeMap={employeeMap}
                positionMap={positionMap}
                onEdit={() => onEditRule(rule)}
                onDelete={() => onDeleteRule(rule.id)}
              />
            ))}
          </div>

          <button
            onClick={onAddRule}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-k-text-b hover:text-k-accent-btn transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Agregar regla
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Sub-componente: Tarjeta de regla ───────────────────────────────────────

function RuleCard({
  rule,
  templateMap,
  employeeMap,
  positionMap,
  onEdit,
  onDelete,
}: {
  rule: TaskAssignmentRule;
  templateMap: Map<string, string>;
  employeeMap: Map<string, string>;
  positionMap: Map<string, string>;
  onEdit: () => void;
  onDelete: () => void;
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
    if (rule.assigneeType === "section_supervisor") {
      return "Supervisor de sección";
    }
    return "Desconocido";
  })();

  const daysText = rule.dayOfWeek
    .sort((a, b) => {
      const order = [1, 2, 3, 4, 5, 6, 0];
      return order.indexOf(a) - order.indexOf(b);
    })
    .map((d) => ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][d])
    .join(", ");

  return (
    <div className="rounded-xl bg-k-bg-card border border-k-border p-3 space-y-2 shadow-k-card group relative">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-k-text-b">
            {typeIcon[rule.assigneeType]}
            <span className="uppercase tracking-wide">{typeLabel[rule.assigneeType]}</span>
            {!rule.isActive && <span className="text-neutral-400 font-medium normal-case">(inactiva)</span>}
          </div>
          <div className="text-xs text-k-text-b truncate">
            {rule.triggerEvent !== "attendance_checkin" && rule.triggerTime && (
              <span className="inline-flex items-center gap-1 mr-2">
                <Clock className="h-3 w-3" />
                {rule.triggerTime}
              </span>
            )}
            {rule.triggerEvent !== "time" && (
              <span className="inline-flex items-center gap-1 mr-2">
                <LogIn className="h-3 w-3" />
                {rule.triggerEvent === "both" ? "Asistencia" : "Por asistencia"}
              </span>
            )}
            <span className="text-k-text-b/70">|</span>
            <span className="ml-2">{daysText}</span>
            <span className="text-k-text-b/70">|</span>
            <span className="ml-2">{rule.items.length} tarea(s)</span>
            <span className="text-k-text-b/70">|</span>
            <span className="ml-2">Asignado: {assigneeName}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={onEdit}
            className="h-6 w-6 rounded-md bg-blue-50 flex items-center justify-center text-blue-500 hover:bg-blue-100 transition-colors"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            onClick={onDelete}
            className="h-6 w-6 rounded-md bg-rose-50 flex items-center justify-center text-rose-500 hover:bg-rose-100 transition-colors"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Chips de templates */}
      <div className="flex flex-wrap gap-1.5">
        {rule.items.map((item) => (
          <span
            key={item.id}
            className="rounded-full bg-k-bg-card2 border border-k-border px-3 py-1 text-xs font-medium text-k-text-h"
          >
            {item.template?.title || templateMap.get(item.templateId) || item.templateId}
          </span>
        ))}
      </div>
    </div>
  );
}
