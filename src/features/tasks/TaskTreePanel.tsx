// src/features/tasks/TaskTreePanel.tsx
// ─── Panel de navegación Árbol de Tareas (Admin/Supervisor) ─────────────────

import { useState, useMemo } from "react";
import { cx } from "@/lib/utils";
import { useTaskStore } from "./taskStore";
import { useAreasWithSections } from "./hooks/useAreas";
import { useTaskTree } from "./hooks/useTaskTree";
import PriorityBadge from "./components/PriorityBadge";
import TaskBreadcrumbs from "./components/Breadcrumbs";
import {
  ChevronRight,
  ChevronDown,
  Search,
  LayoutList,
  FolderOpen,
  Folder,
  ClipboardList,
  CircleDot,
  Plus,
} from "lucide-react";
import TaskTreeAddTaskModal from "./components/TaskTreeAddTaskModal";

export default function TaskTreePanel() {
  const { selectedAreaId, selectedSectionId, selectedTaskId, selectArea, selectSection, selectTask } = useTaskStore();
  const { data: areas, isLoading: areasLoading } = useAreasWithSections();
  const { data: tasks, isLoading: tasksLoading } = useTaskTree();
  const [search, setSearch] = useState("");
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showAddTask, setShowAddTask] = useState(false);

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

  const filteredTasks = useMemo(() => {
    if (!search.trim() || !tasks) return tasks;
    const q = search.toLowerCase();
    return tasks.filter((t) =>
      t.name.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      t.area?.name.toLowerCase().includes(q) ||
      t.section?.name.toLowerCase().includes(q)
    );
  }, [tasks, search]);

  const selectedTask = useMemo(() => {
    return tasks?.find((t) => t.id === selectedTaskId) ?? null;
  }, [tasks, selectedTaskId]);

  const selectedArea = useMemo(() => areas?.find((a) => a.id === selectedAreaId) ?? null, [areas, selectedAreaId]);
  const selectedSection = useMemo(
    () => selectedArea?.sections?.find((s) => s.id === selectedSectionId) ?? null,
    [selectedArea, selectedSectionId]
  );

  const isLoading = areasLoading || tasksLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-k-text-b text-sm font-medium">Cargando tareas...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-180px)] min-h-[500px]">
      {/* ── Panel Izquierdo: Árbol de Navegación ── */}
      <div className="lg:w-80 xl:w-96 flex flex-col gap-4 shrink-0">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-k-text-b" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar tareas..."
            className="w-full h-11 pl-10 pr-4 rounded-2xl bg-k-bg-card border border-k-border text-sm font-medium text-k-text-h placeholder:text-k-text-b/60 focus:outline-none focus:ring-2 focus:ring-k-bg-sidebar/20 transition-all"
          />
        </div>

        {/* Tree */}
        <div className="flex-1 overflow-y-auto rounded-2xl bg-k-bg-card border border-k-border shadow-k-card p-3 space-y-1">
          {areas?.map((area) => {
            const isAreaExpanded = expandedAreas.has(area.id);
            const isAreaSelected = selectedAreaId === area.id;

            return (
              <div key={area.id}>
                {/* Área */}
                <button
                  type="button"
                  onClick={() => {
                    toggleArea(area.id);
                    selectArea(area.id);
                  }}
                  className={cx(
                    "w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-left transition-all",
                    isAreaSelected ? "bg-k-bg-sidebar/10 text-k-text-h" : "text-k-text-b hover:bg-k-bg-card2"
                  )}
                >
                  {isAreaExpanded ? (
                    <ChevronDown className="h-4 w-4 shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0" />
                  )}
                  {isAreaExpanded ? (
                    <FolderOpen className="h-4 w-4 shrink-0 text-k-accent-btn" />
                  ) : (
                    <Folder className="h-4 w-4 shrink-0 text-k-text-b" />
                  )}
                  <span className="text-sm font-bold truncate">{area.name}</span>
                </button>

                {/* Secciones */}
                {isAreaExpanded && area.sections && (
                  <div className="ml-6 space-y-0.5 mt-0.5">
                    {area.sections.map((section) => {
                      const isSecExpanded = expandedSections.has(section.id);
                      const isSecSelected = selectedSectionId === section.id;
                      const sectionTasks = filteredTasks?.filter((t) => t.sectionId === section.id) ?? [];

                      return (
                        <div key={section.id}>
                          <button
                            type="button"
                            onClick={() => {
                              toggleSection(section.id);
                              selectSection(section.id);
                            }}
                            className={cx(
                              "w-full flex items-center gap-2 rounded-xl px-3 py-2 text-left transition-all",
                              isSecSelected ? "bg-k-bg-sidebar/5 text-k-text-h" : "text-k-text-b hover:bg-k-bg-card2"
                            )}
                          >
                            {isSecExpanded ? (
                              <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                            )}
                            <LayoutList className="h-3.5 w-3.5 shrink-0" />
                            <span className="text-xs font-semibold truncate">{section.name}</span>
                            {sectionTasks.length > 0 && (
                              <span className="ml-auto text-[10px] font-bold bg-k-bg-sidebar/10 text-k-text-h px-1.5 py-0.5 rounded-full">
                                {sectionTasks.length}
                              </span>
                            )}
                          </button>

                          {/* Tareas de la sección */}
                          {isSecExpanded && (
                            <div className="ml-5 space-y-0.5">
                              {sectionTasks.map((task) => {
                                const isTaskSelected = selectedTaskId === task.id;
                                return (
                                  <button
                                    key={task.id}
                                    type="button"
                                    onClick={() => selectTask(task.id)}
                                    className={cx(
                                      "w-full flex items-center gap-2 rounded-xl px-3 py-2 text-left transition-all",
                                      isTaskSelected
                                        ? "bg-k-accent-btn text-white shadow-sm"
                                        : "text-k-text-b hover:bg-k-bg-card2"
                                    )}
                                  >
                                    <ClipboardList className="h-3.5 w-3.5 shrink-0" />
                                    <span className="text-xs font-medium truncate">{task.name}</span>
                                    {task.status === "completed" && (
                                      <CircleDot className="h-3 w-3 shrink-0 ml-auto text-emerald-400" />
                                    )}
                                  </button>
                                );
                              })}
                              {sectionTasks.length === 0 && (
                                <div className="px-3 py-2 text-[10px] text-k-text-b/60">
                                  Sin tareas en esta sección
                                </div>
                              )}
                              {/* ── Agregar tarea en esta sección ── */}
                              <button
                                type="button"
                                onClick={() => setShowAddTask(true)}
                                className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-left transition-all text-k-text-b hover:bg-k-bg-card2 hover:text-k-accent-btn mt-0.5"
                              >
                                <Plus className="h-3.5 w-3.5 shrink-0" />
                                <span className="text-[11px] font-semibold">Agregar tarea</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {(!areas || areas.length === 0) && (
            <div className="text-center py-8 text-k-text-b text-sm">
              No hay áreas configuradas
            </div>
          )}
        </div>
      </div>

      {/* ── Panel Derecho: Detalle de Tarea ── */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        {selectedTask ? (
          <TaskPreview task={selectedTask} area={selectedArea} section={selectedSection} />
        ) : (
          <div className="h-full flex items-center justify-center text-k-text-b">
            <div className="text-center space-y-3">
              <ClipboardList className="h-12 w-12 mx-auto text-k-border" />
              <p className="text-sm font-medium">Selecciona una tarea del árbol para ver detalles</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal: Crear tarea en el árbol ── */}
      <TaskTreeAddTaskModal
        open={showAddTask}
        onClose={() => setShowAddTask(false)}
        defaultArea={selectedArea}
        defaultSection={selectedSection}
      />
    </div>
  );
}

// ─── Sub-componente: Preview rápido de tarea en panel derecho ──────────────

function TaskPreview({
  task,
  area,
  section,
}: {
  task: import("./types").TaskV2;
  area: import("./types").Area | null;
  section: import("./types").Section | null;
}) {
  const statusLabel: Record<string, string> = {
    open: "Pendiente",
    in_progress: "En progreso",
    done_pending: "Por revisar",
    approved: "Aprobada",
    rejected: "Rechazada",
    completed: "Completada",
  };

  return (
    <div className="space-y-6">
      <TaskBreadcrumbs area={area} section={section} taskName={task.name} />

      <div className="bg-k-bg-card border border-k-border rounded-3xl shadow-k-card p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-k-text-h tracking-tight">{task.name}</h2>
            <p className="text-sm text-k-text-b mt-1">{task.description}</p>
          </div>
          <PriorityBadge priority={task.priority} />
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="rounded-xl bg-k-bg-card2 px-4 py-2.5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-k-text-b">Estado</div>
            <div className="text-sm font-bold text-k-text-h mt-0.5">{statusLabel[task.status] ?? task.status}</div>
          </div>
          <div className="rounded-xl bg-k-bg-card2 px-4 py-2.5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-k-text-b">Tiempo estimado</div>
            <div className="text-sm font-bold text-k-text-h mt-0.5">{task.estimatedTime ?? 0} min</div>
          </div>
          {task.dueDate && (
            <div className="rounded-xl bg-k-bg-card2 px-4 py-2.5">
              <div className="text-[10px] font-bold uppercase tracking-widest text-k-text-b">Fecha límite</div>
              <div className="text-sm font-bold text-k-text-h mt-0.5">{task.dueDate}</div>
            </div>
          )}
          <div className="rounded-xl bg-k-bg-card2 px-4 py-2.5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-k-text-b">Checklist</div>
            <div className="text-sm font-bold text-k-text-h mt-0.5">
              {task.checklist.filter((c) => c.done).length}/{task.checklist.length}
            </div>
          </div>
        </div>

        {task.isBlocked && (
          <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-800 font-medium">
            🔒 Esta tarea está bloqueada hasta que el empleado registre su entrada.
          </div>
        )}
      </div>
    </div>
  );
}
