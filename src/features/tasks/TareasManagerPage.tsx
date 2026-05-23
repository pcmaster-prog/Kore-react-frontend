// src/features/tasks/TareasManagerPage.tsx
// Página contenedora con tabs: Tareas | Plantillas | Góndolas
import { useState } from "react";
import {
  ClipboardList,
  Layers,
  Plus,
  LayoutGrid,
  TreePine,
} from "lucide-react";
import TasksPage from "./TasksPage";
import TemplatesPage from "./catalog/TemplatesPage";
import GondolasManagerTab from "@/features/gondolas/GondolasManagerTab";
import TaskAreasPage from "./TaskAreasPage";

import { cx } from "@/lib/utils";
const BASE_TABS = [
  {
    key: "tareas",
    label: "Tareas",
    icon: <ClipboardList className="h-4 w-4" />,
  },
  {
    key: "plantillas",
    label: "Plantillas",
    icon: <Layers className="h-4 w-4" />,
  },
  {
    key: "gondolas",
    label: "Góndolas",
    icon: <LayoutGrid className="h-4 w-4" />,
  },
] as const;

import { isEnabled } from "@/lib/featureFlags";
import PageHeader from "@/components/PageHeader";

type BaseTabKey = (typeof BASE_TABS)[number]["key"];
type TabKey = BaseTabKey | "areas";

export default function TareasManagerPage() {
  const showAreasTab = isEnabled("newTaskModule");
  const TABS = showAreasTab
    ? ([...BASE_TABS, { key: "areas" as const, label: "Áreas", icon: <TreePine className="h-4 w-4" /> }] as const)
    : BASE_TABS;

  const [tab, setTab] = useState<TabKey>("tareas");
  const useNewLayout = isEnabled("newAdminTasks");

  return (
    <div className="space-y-6 animate-in-up">
      {/* Header */}
      {useNewLayout ? (
        <PageHeader
          title="Gestión de Tareas"
          actions={
            tab === "tareas" && (
              <button
                className="h-10 px-5 rounded-xl bg-k-accent-btn text-sm font-bold text-k-accent-btn-text shadow-k-card hover:opacity-90 transition-all flex items-center gap-2"
                onClick={() => window.dispatchEvent(new CustomEvent("kore-new-task"))}
              >
                <Plus className="h-4 w-4" />
                Nueva Tarea
              </button>
            )
          }
        />
      ) : (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-k-bg-sidebar/5 text-[10px] font-bold tracking-widest uppercase text-k-text-h/40 mb-2">
              Operations Module
            </div>
            <h1 className="text-3xl font-black text-k-text-h tracking-tight mb-4">
              Gestión de Tareas
            </h1>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Tabs - Organic Segmented Style */}
        <div className="w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 -mb-2 sm:mb-0" style={{ scrollbarWidth: "none" }}>
          <div className="flex p-1.5 bg-k-bg-card border border-k-border rounded-[28px] shadow-k-card w-max">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cx(
                  "flex whitespace-nowrap items-center gap-2 px-6 py-2.5 rounded-[22px] text-sm font-bold transition-all duration-300 shrink-0",
                  tab === t.key
                    ? "bg-k-bg-sidebar text-white shadow-lg shadow-obsidian/20"
                    : "text-k-text-b hover:text-k-text-h hover:bg-k-bg-card2",
                )}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Global Actions */}
        {!useNewLayout && (
          <div className="flex items-center gap-3">
            {tab === "tareas" && (
              <button
                className="h-11 px-5 rounded-2xl bg-k-accent-btn text-sm font-bold text-k-accent-btn-text shadow-k-card hover:opacity-90 transition-all flex items-center gap-2"
                onClick={() =>
                  window.dispatchEvent(new CustomEvent("kore-new-task"))
                }
              >
                <Plus className="h-4 w-4" />
                Nueva Tarea
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="animate-in-fade">
        {tab === "tareas" && <TasksPage />}
        {tab === "plantillas" && <TemplatesPage />}
        {tab === "gondolas" && <GondolasManagerTab />}
        {tab === "areas" && <TaskAreasPage />}
      </div>
    </div>
  );
}
