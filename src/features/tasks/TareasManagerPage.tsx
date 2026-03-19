// src/features/tasks/TareasManagerPage.tsx
// Página contenedora con tabs: Tareas | Plantillas | Rutinas
import { useState } from "react";
import { ClipboardList, Layers, RefreshCw } from "lucide-react";
import TasksPage from "./TasksPage";
import TemplatesPage from "./catalog/TemplatesPage";
import { useNavigate } from "react-router-dom";
import RoutinesPage from "./catalog/RoutinesPage";

function cx(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(" ");
}

const TABS = [
  { key: "tareas",     label: "Tareas",     icon: <ClipboardList className="h-4 w-4" /> },
  { key: "plantillas", label: "Plantillas", icon: <Layers className="h-4 w-4" /> },
  { key: "rutinas",    label: "Rutinas",    icon: <RefreshCw className="h-4 w-4" /> },
] as const;

type TabKey = typeof TABS[number]["key"];

function RoutinesWrapper() {
  const nav = useNavigate();
  return <RoutinesPage onOpenDetail={(id) => nav(`/app/manager/tareas/rutinas/${id}`)} />;
}

export default function TareasManagerPage() {
  const [tab, setTab] = useState<TabKey>("tareas");

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tareas</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          Gestiona tareas, plantillas y rutinas del equipo.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl border bg-neutral-50 p-1 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cx(
              "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition whitespace-nowrap",
              tab === t.key
                ? "bg-blue-600 text-white shadow"
                : "text-neutral-600 hover:bg-white hover:text-neutral-900"
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div>
        {tab === "tareas"     && <TasksPage />}
        {tab === "plantillas" && <TemplatesPage />}
        {tab === "rutinas"    && <RoutinesWrapper />}
      </div>
    </div>
  );
}