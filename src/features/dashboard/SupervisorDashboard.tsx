import { useEffect, useState } from "react";

import {
  Star,
  CheckCircle2,
  ClipboardList,
} from "lucide-react";
import { getSupervisorDashboard } from "./api";
import type { SupervisorDashData } from "./types";
import type { Task } from "@/features/tasks/types";
import type { Template, Routine } from "@/features/tasks/catalog/api";
import { misOrdenesGondola } from "@/features/gondolas/api";
import type { GondolaOrden } from "@/features/gondolas/types";
import AssignRoutineModal from "@/features/tasks/catalog/AssignRoutineModal";
import TaskCatalogPanel from "@/features/tasks/TaskCatalogPanel";

import LoadingSpinner from "./components/LoadingSpinner";
import ErrorCard from "./components/ErrorCard";
import KpiCard from "./components/KpiCard";
import DashboardHero from "./components/DashboardHero";
import OpenTasksPanel from "./components/OpenTasksPanel";
import AvailableTasksPanel from "./components/AvailableTasksPanel";
import WorkloadCard from "./components/WorkloadCard";
import PendingReviewCard from "./components/PendingReviewCard";
import GondolaOrdenesPanel from "./components/GondolaOrdenesPanel";
import AssignTaskModal from "./components/AssignTaskModal";
import AssignTemplateModal from "./components/AssignTemplateModal";
import TaskDetailModal from "./components/TaskDetailModal";

export default function SupervisorDashboard({
  userName,
}: {
  userName: string;
}) {
  const [data, setData] = useState<SupervisorDashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [detailModal, setDetailModal] = useState<Task | null>(null);
  const [modal, setModal] = useState<{
    open: boolean;
    tasks: { id: string; title: string }[];
  }>({ open: false, tasks: [] });
  const [templateModal, setTemplateModal] = useState<{
    open: boolean;
    templates: Template[];
  }>({ open: false, templates: [] });
  const [routineModal, setRoutineModal] = useState<{
    open: boolean;
    routine: Routine | null;
  }>({ open: false, routine: null });
  const [showNewTask, setShowNewTask] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [gondolaOrdenes, setGondolaOrdenes] = useState<GondolaOrden[]>([]);

  function reload() {
    setLoading(true);
    getSupervisorDashboard()
      .then((d) => {
        if (d) {
          if (d.workload && !Array.isArray(d.workload))
            d.workload = Object.values(d.workload);
          if (d.pending_review && !Array.isArray(d.pending_review))
            d.pending_review = Object.values(d.pending_review);
          if (!d.workload) d.workload = [];
          if (!d.pending_review) d.pending_review = [];
        }
        setData(d);
      })
      .catch((e: unknown) => {
        const msg =
          e && typeof e === "object" && "response" in e
            ? (e as { response?: { data?: { message?: string } } }).response
                ?.data?.message
            : null;
        setErr(msg ?? "Error al cargar");
      })
      .finally(() => setLoading(false));

    misOrdenesGondola()
      .then(setGondolaOrdenes)
      .catch(() => setGondolaOrdenes([]));
  }

  useEffect(() => {
    reload();
  }, []);

  function openModal(tasks: { id: string; title: string }[]) {
    setModal({ open: true, tasks });
  }

  function handleNewTaskDone() {
    setShowNewTask(false);
    setRefreshKey((k) => k + 1);
    reload();
  }

  if (loading) return <LoadingSpinner />;
  if (err) return <ErrorCard message={err} />;
  if (!data) return null;

  return (
    <div className="space-y-6 animate-in-up">
      <DashboardHero
        userName={userName}
        pendingReview={data.kpi.pending_review}
        activeTasks={data.kpi.active_tasks}
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <KpiCard
          label="En Revisión"
          value={data.kpi.pending_review}
          color="amber"
          icon={<Star className="h-5 w-5" />}
          compact
        />
        <KpiCard
          label="Tareas Activas"
          value={data.kpi.active_tasks}
          color="blue"
          icon={<ClipboardList className="h-5 w-5" />}
          compact
        />
        <KpiCard
          label="Completadas Hoy"
          value={data.kpi.completed_today}
          color="emerald"
          icon={<CheckCircle2 className="h-5 w-5" />}
          compact
        />
      </div>

      <OpenTasksPanel
        onTaskClick={(t) => {
          if (t.assignees && t.assignees.length > 0) {
            setDetailModal(t);
          } else {
            openModal([{ id: t.id, title: t.title }]);
          }
        }}
        onNewTask={() => setShowNewTask(true)}
        refreshKey={refreshKey}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AvailableTasksPanel
          onAssignTemplates={(templates) =>
            setTemplateModal({ open: true, templates })
          }
          onAssignRoutine={(routine) =>
            setRoutineModal({ open: true, routine })
          }
          onNewTask={() => setShowNewTask(true)}
          refreshKey={refreshKey}
        />
        <WorkloadCard workload={data.workload} />
      </div>

      {data.pending_review.length > 0 && (
        <PendingReviewCard items={data.pending_review} onRefresh={reload} />
      )}

      <GondolaOrdenesPanel ordenes={gondolaOrdenes} />

      {detailModal && (
        <TaskDetailModal
          task={detailModal}
          onClose={() => setDetailModal(null)}
          onDeleted={() => {
            setDetailModal(null);
            setRefreshKey((k) => k + 1);
            reload();
          }}
        />
      )}

      {modal.open && (
        <AssignTaskModal
          tasks={modal.tasks}
          workload={data.workload}
          onClose={() => setModal({ open: false, tasks: [] })}
          onAssigned={() => {
            setModal({ open: false, tasks: [] });
            setRefreshKey((k) => k + 1);
            reload();
          }}
        />
      )}

      {routineModal.open && routineModal.routine && (
        <AssignRoutineModal
          open={routineModal.open}
          routineName={routineModal.routine.name}
          onClose={() => setRoutineModal({ open: false, routine: null })}
          onAssign={async (payload) => {
            const { assignRoutine } = await import(
              "@/features/tasks/catalog/api"
            );
            await assignRoutine(routineModal.routine!.id, payload);
            setRoutineModal({ open: false, routine: null });
            setRefreshKey((k) => k + 1);
            reload();
          }}
        />
      )}

      {templateModal.open && (
        <AssignTemplateModal
          templates={templateModal.templates}
          workload={data.workload}
          onClose={() => setTemplateModal({ open: false, templates: [] })}
          onAssigned={() => {
            setTemplateModal({ open: false, templates: [] });
            setRefreshKey((k) => k + 1);
            reload();
          }}
        />
      )}

      {showNewTask && (
        <TaskCatalogPanel
          onAssigned={handleNewTaskDone}
          onClose={() => setShowNewTask(false)}
        />
      )}
    </div>
  );
}

// Re-exports para compatibilidad con ManagerDashboard
export { default as AssignTaskModal } from "./components/AssignTaskModal";
export { default as AssignTemplateModal } from "./components/AssignTemplateModal";
export { default as OpenTasksPanel } from "./components/OpenTasksPanel";
export { default as AvailableTasksPanel } from "./components/AvailableTasksPanel";
export { default as WorkloadCard } from "./components/WorkloadCard";
export { default as TaskDetailModal } from "./components/TaskDetailModal";
