import { useEffect, useState } from "react";
import {
  ChevronRight,
  ClipboardList,
  Plus,
  Zap,
} from "lucide-react";
import { cx } from "@/lib/utils";
import { listTasks } from "@/features/tasks/api";
import type { Task } from "@/features/tasks/types";
import CollapsiblePanel from "./ui/CollapsiblePanel";
import PriorityBadge from "./ui/PriorityBadge";

export interface OpenTasksPanelProps {
  onTaskClick: (task: Task) => void;
  onNewTask?: () => void;
  refreshKey?: number;
}

export default function OpenTasksPanel({
  onTaskClick,
  onNewTask,
  refreshKey = 0,
}: OpenTasksPanelProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"in_progress" | "overdue">("in_progress");
  const [panelOpen, setPanelOpen] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params: { page: number; status?: string; overdue?: boolean } = { page: 1 };

    if (tab === "in_progress") {
      params.status = "in_progress";
    } else if (tab === "overdue") {
      params.status = "open,in_progress";
      params.overdue = true;
    }

    listTasks(params)
      .then((res) => {
        const rawData = res.data;
        const arr = Array.isArray(rawData) ? rawData : [];
        const sorted = [...arr].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setTasks(sorted);
      })
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, [refreshKey, tab]);

  return (
    <CollapsiblePanel
      title="Monitoreo de Tareas"
      subtitle="Seguimiento de tareas activas"
      isOpen={panelOpen}
      onToggle={() => setPanelOpen((p) => !p)}
      openClassName="rounded-[32px] lg:rounded-[40px] p-6 lg:p-8 min-h-[500px] lg:min-h-[600px]"
      closedClassName="rounded-[24px] p-4 lg:px-8 lg:py-6"
      headerRight={
        <>
          {!loading && tasks.length > 0 && (
            <span
              className={cx(
                "h-7 px-2.5 rounded-full text-xs font-black flex items-center justify-center border",
                tab === "in_progress"
                  ? "bg-amber-50 text-amber-600 border-amber-100"
                  : "bg-rose-50 text-rose-600 border-rose-100"
              )}
            >
              {tasks.length}
            </span>
          )}
          {onNewTask && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNewTask();
              }}
              className="h-8 px-3 rounded-xl bg-k-accent-btn text-k-accent-btn-text text-xs font-bold hover:opacity-90 transition flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Nueva
            </button>
          )}
        </>
      }
    >
      <div className="flex items-center gap-2 mb-4 p-1 bg-neutral-100/50 rounded-xl inline-flex border border-k-border shrink-0 self-start">
        <button
          onClick={() => setTab("in_progress")}
          className={cx(
            "px-3 py-1.5 text-xs font-bold rounded-lg transition-colors",
            tab === "in_progress"
              ? "bg-k-bg-card shadow-k-card text-amber-600"
              : "text-k-text-b hover:text-amber-500"
          )}
        >
          En Proceso
        </button>
        <button
          onClick={() => setTab("overdue")}
          className={cx(
            "px-3 py-1.5 text-xs font-bold rounded-lg transition-colors",
            tab === "overdue"
              ? "bg-k-bg-card shadow-k-card text-rose-600"
              : "text-k-text-b hover:text-rose-500"
          )}
        >
          Vencidas
        </button>
      </div>

      {loading ? (
        <div className="space-y-2 flex-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-neutral-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <ClipboardList className="h-8 w-8 text-neutral-200 mx-auto mb-3" />
          <p className="text-sm font-bold text-k-text-b">
            {tab === "in_progress"
              ? "No hay tareas en proceso"
              : "No hay tareas vencidas"}
          </p>
          <p className="text-xs text-k-text-b mb-4">Todo está bajo control</p>
        </div>
      ) : (
        <div className="space-y-2 flex-1 overflow-y-auto pr-1 pb-4">
          {tasks.map((t) => (
            <div
              key={t.id}
              onClick={() => onTaskClick(t)}
              className="flex items-center gap-3 p-4 rounded-2xl border border-k-border cursor-pointer hover:border-obsidian/20 hover:bg-k-bg-card2 transition group shrink-0"
            >
              <div
                className={cx(
                  "h-8 w-8 rounded-xl flex items-center justify-center shrink-0",
                  tab === "in_progress"
                    ? "bg-amber-50 text-amber-600"
                    : "bg-rose-50 text-rose-600"
                )}
              >
                {tab === "in_progress" ? (
                  <Zap className="h-4 w-4" />
                ) : (
                  <ClipboardList className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-k-text-h truncate">
                  {t.title}
                </div>
                <div className="text-xs text-k-text-b mt-0.5 truncate">
                  {t.assignees && t.assignees.length > 0
                    ? `Asignada a ${t.assignees.length} empleado(s)`
                    : "Sin asignar"}
                  {t.due_at &&
                    ` · Vence ${new Date(t.due_at).toLocaleTimeString("es-MX", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`}
                </div>
              </div>
              {t.priority && <PriorityBadge priority={t.priority} />}
              <ChevronRight className="h-4 w-4 text-k-text-b group-hover:text-k-text-b transition shrink-0" />
            </div>
          ))}
        </div>
      )}
    </CollapsiblePanel>
  );
}
