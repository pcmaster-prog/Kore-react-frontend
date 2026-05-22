// src/features/tasks/TaskAreasPage.tsx
// ─── Página contenedora del módulo de Áreas/Secciones (Admin/Supervisor) ────

import { useState } from "react";
import { cx } from "@/lib/utils";
import PageHeader from "@/components/PageHeader";
import TaskTreePanel from "./TaskTreePanel";
import TaskDetailPanel from "./TaskDetailPanel";
import AreaSectionManager from "./AreaSectionManager";
import TaskAssignmentRulesManager from "./TaskAssignmentRulesManager";
import RoutineScheduleConfig from "./RoutineScheduleConfig";
import { useTaskTree } from "./hooks/useTaskTree";
import { useTaskStore } from "./taskStore";
import {
  TreePine,
  Settings,
  CalendarClock,
  ListChecks,
} from "lucide-react";

type TabKey = "tree" | "manager" | "rules" | "schedules";

const TABS = [
  { key: "tree" as TabKey, label: "Árbol de tareas", icon: <TreePine className="h-4 w-4" /> },
  { key: "manager" as TabKey, label: "Áreas y secciones", icon: <Settings className="h-4 w-4" /> },
  { key: "rules" as TabKey, label: "Reglas de asignación", icon: <ListChecks className="h-4 w-4" /> },
  { key: "schedules" as TabKey, label: "Programación", icon: <CalendarClock className="h-4 w-4" /> },
] as const;

export default function TaskAreasPage() {
  const [tab, setTab] = useState<TabKey>("tree");
  const { data: tasks } = useTaskTree();
  const { selectedTaskId } = useTaskStore();

  const selectedTask = tasks?.find((t) => t.id === selectedTaskId) ?? null;

  return (
    <div className="space-y-6 animate-in-up">
      <PageHeader
        title="Gestión por Áreas"
        subtitle="Organiza tareas por área, sección y supervisor"
      />

      {/* Tabs */}
      <div className="w-full overflow-x-auto pb-2 -mb-2" style={{ scrollbarWidth: "none" }}>
        <div className="flex p-1.5 bg-k-bg-card border border-k-border rounded-[28px] shadow-k-card w-max">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cx(
                "flex whitespace-nowrap items-center gap-2 px-5 py-2.5 rounded-[22px] text-sm font-bold transition-all duration-300 shrink-0",
                tab === t.key
                  ? "bg-k-bg-sidebar text-white shadow-lg shadow-obsidian/20"
                  : "text-k-text-b hover:text-k-text-h hover:bg-k-bg-card2"
              )}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {tab === "tree" && (
          <div className="space-y-4">
            <TaskTreePanel />
            {selectedTask && (
              <div className="mt-6">
                <TaskDetailPanel
                  task={selectedTask}
                  area={selectedTask.area}
                  section={selectedTask.section}
                  onClose={() => useTaskStore.getState().clearSelection()}
                />
              </div>
            )}
          </div>
        )}
        {tab === "manager" && <AreaSectionManager />}
        {tab === "rules" && <TaskAssignmentRulesManager />}
        {tab === "schedules" && <RoutineScheduleConfig />}
      </div>
    </div>
  );
}
