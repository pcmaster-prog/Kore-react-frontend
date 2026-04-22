// src/features/tasks/TareasManagerPage.tsx
// Página contenedora con tabs: Tareas | Plantillas | Rutinas | Góndolas
import { useState } from "react";
import {
  ClipboardList,
  Layers,
  RefreshCw,
  Plus,
  LayoutGrid,
} from "lucide-react";
import TasksPage from "./TasksPage";
import TemplatesPage from "./catalog/TemplatesPage";
import { useNavigate } from "react-router-dom";
import RoutinesPage from "./catalog/RoutinesPage";
import GondolasManagerTab from "@/features/gondolas/GondolasManagerTab";

function cx(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(" ");
}

const TABS = [
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
  { key: "rutinas", label: "Rutinas", icon: <RefreshCw className="h-4 w-4" /> },
  {
    key: "gondolas",
    label: "Góndolas",
    icon: <LayoutGrid className="h-4 w-4" />,
  },
] as const;

type TabKey = (typeof TABS)[number]["key"];

import { isEnabled } from "@/lib/featureFlags";
import PageHeader from "@/components/PageHeader";

function RoutinesWrapper() {
  const nav = useNavigate();
  return (
    <RoutinesPage
      onOpenDetail={(id) => nav(`/app/manager/tareas/rutinas/${id}`)}
    />
  );
}

export default function TareasManagerPage() {
  const [tab, setTab] = useState<TabKey>("tareas");
  const useNewLayout = isEnabled("newAdminTasks");

  return (
    <div className="space-y-6 animate-in-up">
      {/* Header */}
      {useNewLayout ? (
        <PageHeader
          title="Gestión de Tareas"
          subtitle="Supervisa la ejecución, configura plantillas y programa rutinas automáticas."
          actions={
            tab === "tareas" && (
              <button
                className="h-10 px-5 rounded-xl bg-obsidian text-sm font-bold text-white shadow-sm hover:bg-neutral-800 transition-all flex items-center gap-2"
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-obsidian/5 text-[10px] font-bold tracking-widest uppercase text-obsidian/40 mb-2">
              Operations Module
            </div>
            <h1 className="text-3xl font-black text-obsidian tracking-tight">
              Gestión de Tareas
            </h1>
            <p className="text-sm text-neutral-400 mt-1 max-w-lg">
              Supervisa la ejecución, configura plantillas y programa rutinas
              automáticas para tu equipo.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Tabs - Organic Segmented Style */}
        <div className="w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 -mb-2 sm:mb-0" style={{ scrollbarWidth: "none" }}>
          <div className="flex p-1.5 bg-white border border-neutral-100 rounded-[28px] shadow-sm w-max">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cx(
                  "flex whitespace-nowrap items-center gap-2 px-6 py-2.5 rounded-[22px] text-sm font-bold transition-all duration-300 shrink-0",
                  tab === t.key
                    ? "bg-obsidian text-white shadow-lg shadow-obsidian/20"
                    : "text-neutral-400 hover:text-obsidian hover:bg-neutral-50",
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
                className="h-11 px-5 rounded-2xl bg-obsidian text-sm font-bold text-white shadow-sm hover:bg-gold transition-all flex items-center gap-2"
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
        {tab === "rutinas" && <RoutinesWrapper />}
        {tab === "gondolas" && <GondolasManagerTab />}
      </div>
    </div>
  );
}
