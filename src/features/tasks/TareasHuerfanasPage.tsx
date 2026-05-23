// src/features/tasks/TareasHuerfanasPage.tsx
// Página de tareas huérfanas (sin asignar) para Admin/Supervisor

import { useState, useMemo } from "react";
import { cx } from "@/lib/utils";
import PageHeader from "@/components/PageHeader";
import { useUnassignedTasks, useReasignarTarea } from "./hooks/useUnassignedTasks";
import { useAreasWithSections } from "./hooks/useAreas";
import { useEmployees } from "./hooks/useEmployees";
import type { UnassignedTask } from "./types";
import PriorityBadge from "./components/PriorityBadge";
import {
  AlertTriangle,
  ChevronRight,
  UserCheck,
  X,
  Search,
  Check,
  Clock,
  Inbox,
} from "lucide-react";

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return "Hace un momento";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  if (diffHour < 24) return `Hace ${diffHour} hora${diffHour > 1 ? "s" : ""}`;
  if (diffDay < 7) return `Hace ${diffDay} día${diffDay > 1 ? "s" : ""}`;
  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function reasonLabel(reason: string): string {
  const map: Record<string, string> = {
    "empleado_inactivo": "Empleado inactivo",
    "sin_empleados_en_seccion": "Sin empleados en sección",
    "empleado_despedido": "Empleado despedido",
    "sin_asignacion": "Sin asignación",
  };
  return map[reason] ?? reason.replace(/_/g, " ");
}

export default function TareasHuerfanasPage() {
  const { data: tasks, isLoading: loadingTasks } = useUnassignedTasks();
  const { data: areas, isLoading: loadingAreas } = useAreasWithSections();
  const { data: employees, isLoading: loadingEmployees } = useEmployees();
  const reasignar = useReasignarTarea();

  const [areaFilter, setAreaFilter] = useState<string>("");
  const [sectionFilter, setSectionFilter] = useState<string>("");

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<UnassignedTask | null>(null);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const sectionsForArea = useMemo(() => {
    if (!areaFilter) return [];
    const area = areas?.find((a) => a.id === areaFilter);
    return area?.sections ?? [];
  }, [areaFilter, areas]);

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter((t) => {
      if (areaFilter && t.area?.id !== areaFilter) return false;
      if (sectionFilter && t.section?.id !== sectionFilter) return false;
      return true;
    });
  }, [tasks, areaFilter, sectionFilter]);

  const openReassignModal = (task: UnassignedTask) => {
    setSelectedTask(task);
    setSelectedEmployeeIds([]);
    setSearchQuery("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedTask(null);
    setSelectedEmployeeIds([]);
    setSearchQuery("");
  };

  const toggleEmployee = (id: string) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  const handleReassign = () => {
    if (!selectedTask || selectedEmployeeIds.length === 0) return;
    reasignar.mutate(
      { taskId: selectedTask.id, empleadoIds: selectedEmployeeIds },
      {
        onSuccess: () => {
          window.dispatchEvent(
            new CustomEvent("kore-notification", {
              detail: {
                title: "Tarea reasignada",
                body: `Se asignó "${selectedTask.title}" a ${selectedEmployeeIds.length} empleado(s).`,
              },
            })
          );
          closeModal();
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.message ?? "No se pudo reasignar la tarea.";
          window.dispatchEvent(
            new CustomEvent("kore-notification", {
              detail: { title: "Error", body: msg },
            })
          );
        },
      }
    );
  };

  const filteredEmployees = useMemo(() => {
    if (!employees) return [];
    if (!searchQuery.trim()) return employees;
    const q = searchQuery.toLowerCase();
    return employees.filter(
      (e) =>
        (e.full_name ?? e.name ?? "").toLowerCase().includes(q) ||
        (e.position_title ?? "").toLowerCase().includes(q)
    );
  }, [employees, searchQuery]);

  const isLoading = loadingTasks || loadingAreas;

  return (
    <div className="space-y-6 animate-in-up">
      <PageHeader
        title="Tareas sin asignar"
        subtitle="Tareas huérfanas que requieren asignación manual"
        badge={
          tasks && tasks.length > 0
            ? { text: `${tasks.length} pendiente${tasks.length !== 1 ? "s" : ""}`, variant: "warning" }
            : undefined
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="text-[10px] font-bold uppercase tracking-widest text-k-text-b mb-1.5 block">
            Área
          </label>
          <select
            value={areaFilter}
            onChange={(e) => {
              setAreaFilter(e.target.value);
              setSectionFilter("");
            }}
            className="w-full h-11 rounded-xl bg-k-bg-card border border-k-border px-3 text-sm font-medium text-k-text-h focus:outline-none focus:ring-2 focus:ring-k-bg-sidebar/20"
          >
            <option value="">Todas las áreas</option>
            {areas?.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="text-[10px] font-bold uppercase tracking-widest text-k-text-b mb-1.5 block">
            Sección
          </label>
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            disabled={!areaFilter || sectionsForArea.length === 0}
            className="w-full h-11 rounded-xl bg-k-bg-card border border-k-border px-3 text-sm font-medium text-k-text-h focus:outline-none focus:ring-2 focus:ring-k-bg-sidebar/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">Todas las secciones</option>
            {sectionsForArea.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Task List */}
      {isLoading ? (
        <TaskCardSkeleton count={4} />
      ) : filteredTasks.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onReassign={() => openReassignModal(task)}
            />
          ))}
        </div>
      )}

      {/* Reassign Modal */}
      {modalOpen && selectedTask && (
        <ReassignModal
          task={selectedTask}
          employees={filteredEmployees}
          selectedIds={selectedEmployeeIds}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onToggle={toggleEmployee}
          onSelectAll={() =>
            setSelectedEmployeeIds(filteredEmployees.map((e) => e.id))
          }
          onClear={() => setSelectedEmployeeIds([])}
          onClose={closeModal}
          onSubmit={handleReassign}
          isSubmitting={reasignar.isPending}
          loadingEmployees={loadingEmployees}
        />
      )}
    </div>
  );
}

// ─── Sub-componente: Tarjeta de tarea huérfana ──────────────────────────────

function TaskCard({
  task,
  onReassign,
}: {
  task: UnassignedTask;
  onReassign: () => void;
}) {
  return (
    <div className="rounded-2xl bg-k-bg-card border border-k-border shadow-k-card p-5 space-y-4 transition-all hover:shadow-lg">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-black text-k-text-h tracking-tight leading-snug">
            {task.title}
          </h3>
          {task.description && (
            <p className="text-sm text-k-text-b mt-1 line-clamp-2">{task.description}</p>
          )}
        </div>
        <PriorityBadge
          priority={(task.priority as any) ?? "low"}
          className="shrink-0"
        />
      </div>

      {/* Breadcrumbs + Reason */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 text-xs text-k-text-b font-medium">
          <span>{task.area?.name ?? "Sin área"}</span>
          <ChevronRight className="h-3 w-3" />
          <span>{task.section?.name ?? "Sin sección"}</span>
        </div>
        <span className="text-neutral-300">·</span>
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-100 rounded-full px-2 py-0.5">
          <AlertTriangle className="h-3 w-3" />
          {reasonLabel(task.unassigned_reason)}
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-k-border">
        <div className="flex items-center gap-1.5 text-xs text-k-text-b">
          <Clock className="h-3.5 w-3.5" />
          <span>{formatRelativeTime(task.created_at)}</span>
        </div>
        <button
          onClick={onReassign}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-k-accent-btn text-white text-xs font-bold hover:opacity-90 transition-all"
        >
          <UserCheck className="h-3.5 w-3.5" />
          Reasignar
        </button>
      </div>
    </div>
  );
}

// ─── Sub-componente: Skeleton de tarjetas ───────────────────────────────────

function TaskCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl bg-k-bg-card border border-k-border shadow-k-card p-5 space-y-4 animate-pulse"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-neutral-100 rounded" />
              <div className="h-3 w-1/2 bg-neutral-100 rounded" />
            </div>
            <div className="h-6 w-16 bg-neutral-100 rounded-full" />
          </div>
          <div className="flex gap-2">
            <div className="h-4 w-24 bg-neutral-100 rounded" />
            <div className="h-4 w-32 bg-neutral-100 rounded" />
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-k-border">
            <div className="h-3 w-20 bg-neutral-100 rounded" />
            <div className="h-9 w-24 bg-neutral-100 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Sub-componente: Estado vacío ───────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-16 w-16 rounded-2xl bg-k-bg-card border border-k-border shadow-k-card flex items-center justify-center mb-4">
        <Inbox className="h-7 w-7 text-k-text-b" />
      </div>
      <h3 className="text-lg font-black text-k-text-h tracking-tight">
        No hay tareas huérfanas
      </h3>
      <p className="text-sm text-k-text-b mt-1 max-w-xs">
        Todas las tareas están correctamente asignadas. ¡Buen trabajo!
      </p>
    </div>
  );
}

// ─── Sub-componente: Modal de reasignación ──────────────────────────────────

function ReassignModal({
  task,
  employees,
  selectedIds,
  searchQuery,
  onSearchChange,
  onToggle,
  onSelectAll,
  onClear,
  onClose,
  onSubmit,
  isSubmitting,
  loadingEmployees,
}: {
  task: UnassignedTask;
  employees: { id: string; full_name?: string; name?: string; position_title?: string }[];
  selectedIds: string[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  loadingEmployees: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-obsidian/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-k-bg-card rounded-3xl shadow-2xl w-full max-w-md max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-k-border shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-k-text-h">Reasignar tarea</h3>
              <p className="text-sm text-k-text-b mt-0.5 truncate max-w-[260px]">{task.title}</p>
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-xl bg-k-bg-card2 flex items-center justify-center text-k-text-b hover:text-k-text-h transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-6 pt-4 pb-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-k-text-b" />
            <input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar empleado..."
              className="w-full h-10 rounded-xl bg-k-bg-card2 border border-k-border pl-9 pr-3 text-sm font-medium text-k-text-h placeholder:text-k-text-b/60 focus:outline-none focus:ring-2 focus:ring-k-bg-sidebar/20"
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-k-text-b">
              {selectedIds.length} seleccionado{selectedIds.length !== 1 ? "s" : ""}
            </span>
            <div className="flex gap-2">
              <button
                onClick={onSelectAll}
                className="text-[10px] font-bold text-k-accent-btn hover:underline"
              >
                Seleccionar todos
              </button>
              <span className="text-k-text-b/30">·</span>
              <button
                onClick={onClear}
                className="text-[10px] font-bold text-k-text-b hover:text-k-text-h"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-6 py-2 min-h-[200px]">
          {loadingEmployees ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 bg-neutral-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-6 text-sm text-k-text-b">
              No se encontraron empleados
            </div>
          ) : (
            <div className="space-y-1.5">
              {employees.map((emp) => {
                const isSelected = selectedIds.includes(emp.id);
                return (
                  <button
                    key={emp.id}
                    onClick={() => onToggle(emp.id)}
                    className={cx(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all border",
                      isSelected
                        ? "bg-k-bg-sidebar/5 border-k-bg-sidebar/20"
                        : "bg-k-bg-card2 border-transparent hover:border-k-border"
                    )}
                  >
                    <div
                      className={cx(
                        "h-5 w-5 rounded-md border flex items-center justify-center shrink-0 transition-colors",
                        isSelected
                          ? "bg-k-accent-btn border-k-accent-btn"
                          : "border-k-border bg-k-bg-card"
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-k-text-h truncate">
                        {emp.full_name ?? emp.name ?? "Sin nombre"}
                      </div>
                      {emp.position_title && (
                        <div className="text-[11px] text-k-text-b truncate">{emp.position_title}</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-4 border-t border-k-border shrink-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-xl bg-k-bg-card2 text-k-text-h text-sm font-bold hover:bg-k-border transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={onSubmit}
            disabled={selectedIds.length === 0 || isSubmitting}
            className="flex-1 h-11 rounded-xl bg-k-accent-btn text-white text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50"
          >
            {isSubmitting ? "Reasignando..." : "Reasignar y notificar"}
          </button>
        </div>
      </div>
    </div>
  );
}
