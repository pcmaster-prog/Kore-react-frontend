import { useEffect, useState } from "react";
import { CheckCircle2, ClipboardList, Plus, Search } from "lucide-react";
import { cx } from "@/lib/utils";
import { listTasks } from "@/features/tasks/api";
import type { Task } from "@/features/tasks/types";
import {
  listTemplates,
  listRoutines,
} from "@/features/tasks/catalog/api";
import type { Template, Routine } from "@/features/tasks/catalog/api";
import CollapsiblePanel from "./ui/CollapsiblePanel";
import PriorityBadge from "./ui/PriorityBadge";

export interface AvailableTasksPanelProps {
  onAssignTemplates: (templates: Template[]) => void;
  onAssignRoutine: (routine: Routine) => void;
  onNewTask?: () => void;
  refreshKey?: number;
}

type CatalogItem = Template | Routine;

function isTemplate(item: CatalogItem): item is Template {
  return "title" in item;
}

function getItemTitle(item: CatalogItem): string {
  return (isTemplate(item) ? item.title : item.name) || "";
}

export default function AvailableTasksPanel({
  onAssignTemplates,
  onAssignRoutine,
  onNewTask,
  refreshKey = 0,
}: AvailableTasksPanelProps) {
  const [tab, setTab] = useState<"templates" | "routines">("templates");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [assignedTitles, setAssignedTitles] = useState<Set<string>>(
    new Set()
  );
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    setSelected(new Set());
    const today = new Date().toISOString().slice(0, 10);
    Promise.all([
      listTemplates({ active: true, show_in_dashboard: true }).catch(() => ({
        data: [] as Template[],
      })),
      listRoutines({ active: true, show_in_dashboard: true }).catch(() => ({
        data: [] as Routine[],
      })),
      listTasks({ date: today }).catch(() => ({
        data: [] as Task[],
      })),
    ])
      .then(([tplRes, rtnRes, taskRes]) => {
        setTemplates(tplRes.data ?? []);
        setRoutines(rtnRes.data ?? []);

        const assigned = new Set<string>();
        const taskArr = Array.isArray(taskRes.data) ? taskRes.data : [];
        taskArr.forEach((t: Task) => {
          if (t.title) assigned.add(t.title.trim().toLowerCase());
        });
        setAssignedTitles(assigned);
      })
      .finally(() => setLoading(false));
  }, [refreshKey]);

  function toggleItem(id: string) {
    if (tab === "routines") {
      setSelected(new Set([id]));
      return;
    }
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleAssign() {
    if (tab === "templates") {
      const sel = templates.filter((t) => selected.has(t.id));
      if (sel.length > 0) onAssignTemplates(sel);
    } else {
      const sel = routines.find((r) => selected.has(r.id));
      if (sel) onAssignRoutine(sel);
    }
  }

  const items = tab === "templates" ? templates : routines;
  const filtered = items.filter((item) => {
    const title = getItemTitle(item).trim().toLowerCase();
    if (assignedTitles.has(title)) return false;
    return title.includes(search.toLowerCase());
  });

  return (
    <CollapsiblePanel
      title="Tareas Disponibles"
      isOpen={panelOpen}
      onToggle={() => setPanelOpen((p) => !p)}
      openClassName="rounded-[40px] p-8 min-h-[400px]"
      closedClassName="rounded-[24px] p-4 lg:px-8 lg:py-6 min-h-0"
      headerRight={
        <>
          {selected.size > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAssign();
              }}
              className="h-9 px-4 rounded-2xl bg-k-accent-btn text-k-accent-btn-text text-xs font-bold hover:opacity-90 transition flex items-center gap-2"
            >
              <Plus className="h-3.5 w-3.5" />
              Asignar {tab === "templates" ? `(${selected.size})` : ""}
            </button>
          )}
          {onNewTask && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNewTask();
              }}
              className="h-8 px-3 rounded-xl border border-k-border text-k-text-h text-xs font-bold hover:bg-k-bg-card2 transition flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Nueva
            </button>
          )}
        </>
      }
    >
      <div className="flex items-center gap-2 mb-5 p-1 bg-neutral-100/50 rounded-xl inline-flex border border-k-border">
        <button
          onClick={() => {
            setTab("templates");
            setSelected(new Set());
          }}
          className={cx(
            "px-3 py-1.5 text-xs font-bold rounded-lg transition-colors",
            tab === "templates"
              ? "bg-k-bg-card shadow-k-card text-k-text-h"
              : "text-k-text-b hover:text-k-text-h"
          )}
        >
          Plantillas
        </button>
        <button
          onClick={() => {
            setTab("routines");
            setSelected(new Set());
          }}
          className={cx(
            "px-3 py-1.5 text-xs font-bold rounded-lg transition-colors",
            tab === "routines"
              ? "bg-k-bg-card shadow-k-card text-k-text-h"
              : "text-k-text-b hover:text-k-text-h"
          )}
        >
          Rutinas
        </button>
      </div>

      {!loading && items.length > 3 && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-k-text-b" />
          <input
            type="text"
            placeholder={`Buscar ${tab === "templates" ? "plantilla" : "rutina"}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-8 pr-3 rounded-xl border border-k-border text-xs outline-none focus:ring-2 focus:ring-obsidian/10 bg-k-bg-card2/50"
          />
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-neutral-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="py-8 text-center">
          <ClipboardList className="h-10 w-10 text-neutral-200 mx-auto mb-3" />
          <p className="text-sm font-bold text-k-text-b mb-1">
            Sin {tab === "templates" ? "plantillas" : "rutinas"} configuradas
          </p>
          <p className="text-xs text-k-text-b mb-4">
            Ve a Catálogo para crear plantillas de tareas
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-sm font-bold text-k-text-b">¡Al día!</p>
          <p className="text-xs text-k-text-b mt-1">
            Ya se asignaron todas las tareas de este tipo o no hay resultados.
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {filtered.map((t) => {
            const id = t.id;
            const title = getItemTitle(t);
            return (
              <div
                key={id}
                onClick={() => toggleItem(id)}
                className={cx(
                  "flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition",
                  selected.has(id)
                    ? "border-obsidian bg-k-bg-sidebar/5"
                    : "border-k-border hover:border-k-border hover:bg-k-bg-card2"
                )}
              >
                <div
                  className={cx(
                    "h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition",
                    selected.has(id)
                      ? "bg-k-bg-sidebar border-obsidian"
                      : "border-neutral-300"
                  )}
                >
                  {selected.has(id) && (
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-k-text-h truncate">
                    {title}
                  </div>
                  {isTemplate(t) && t.estimated_minutes && (
                    <div className="text-xs text-k-text-b">
                      ⏱ {t.estimated_minutes} min
                    </div>
                  )}
                  {!isTemplate(t) && t.recurrence && (
                    <div className="text-xs text-k-text-b capitalize">
                      Recurrencia {t.recurrence}
                    </div>
                  )}
                </div>
                {isTemplate(t) && t.priority && (
                  <PriorityBadge priority={t.priority} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </CollapsiblePanel>
  );
}
