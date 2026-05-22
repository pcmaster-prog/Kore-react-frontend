// src/features/tasks/TaskDetailPanel.tsx
// ─── Panel de detalle completo de tarea con tabs (Admin/Supervisor) ─────────

import { useState } from "react";
import { cx } from "@/lib/utils";
import type { TaskV2, Area, Section, ChecklistItem } from "@/features/tasks/types";
import { useStartTask, useFinishTask } from "./hooks/useTaskTree";
import { useCreateIncident } from "./hooks/useIncidents";
import { useTaskStore } from "./taskStore";
import PriorityBadge from "./components/PriorityBadge";
import TaskBreadcrumbs from "./components/Breadcrumbs";
import Checklist from "./components/Checklist";
import EvidenceGallery from "./components/EvidenceGallery";
import {
  Play,
  CheckCircle2,
  AlertTriangle,
  ClipboardList,
  Paperclip,
  MessageSquareWarning,
  Clock,
  X,
} from "lucide-react";

type TabKey = "detail" | "checklist" | "evidence" | "incidents";

interface TaskDetailPanelProps {
  task: TaskV2;
  area?: Area | null;
  section?: Section | null;
  onClose?: () => void;
}

export default function TaskDetailPanel({ task, area, section, onClose }: TaskDetailPanelProps) {
  const [tab, setTab] = useState<TabKey>("detail");
  const [localChecklist, setLocalChecklist] = useState<ChecklistItem[]>(task.checklist);
  const [incidentModalOpen, setIncidentModalOpen] = useState(false);

  const startMutation = useStartTask();
  const finishMutation = useFinishTask();
  const createIncidentMutation = useCreateIncident();

  const { clearSelection } = useTaskStore();

  const handleToggleChecklist = (id: string, done: boolean) => {
    setLocalChecklist((prev) => prev.map((item) => (item.id === id ? { ...item, done } : item)));
  };

  const handleStart = () => startMutation.mutate(task.id);
  const handleFinish = () => finishMutation.mutate(task.id);

  const statusConfig: Record<string, { label: string; color: string }> = {
    open: { label: "Pendiente", color: "text-neutral-500" },
    in_progress: { label: "En progreso", color: "text-blue-600" },
    done_pending: { label: "Por revisar", color: "text-amber-600" },
    approved: { label: "Aprobada", color: "text-emerald-600" },
    rejected: { label: "Rechazada", color: "text-rose-600" },
    completed: { label: "Completada", color: "text-emerald-600" },
  };

  const cfg = statusConfig[task.status] ?? statusConfig.open;

  const tabs: { key: TabKey; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: "detail", label: "Detalle", icon: <ClipboardList className="h-4 w-4" /> },
    { key: "checklist", label: "Checklist", icon: <CheckCircle2 className="h-4 w-4" />, count: task.checklist.length },
    { key: "evidence", label: "Evidencias", icon: <Paperclip className="h-4 w-4" />, count: task.attachments.length },
    { key: "incidents", label: "Incidencias", icon: <MessageSquareWarning className="h-4 w-4" />, count: task.incidents.length },
  ];

  return (
    <div className="bg-k-bg-card border border-k-border rounded-3xl shadow-k-card overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-k-border">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <TaskBreadcrumbs
              area={area}
              section={section}
              onAreaClick={() => clearSelection()}
              className="mb-2"
            />
            <h2 className="text-xl font-black text-k-text-h tracking-tight truncate">{task.name}</h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <PriorityBadge priority={task.priority} />
            {onClose && (
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-xl bg-k-bg-card2 flex items-center justify-center text-k-text-b hover:text-k-text-h transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap gap-4 mt-4">
          <div className="flex items-center gap-1.5 text-sm text-k-text-b">
            <Clock className="h-3.5 w-3.5" />
            <span className="font-medium">{task.estimatedTime ?? 0} min estimados</span>
          </div>
          <div className={cx("flex items-center gap-1.5 text-sm font-bold", cfg.color)}>
            <CircleDot className="h-3.5 w-3.5" />
            <span>{cfg.label}</span>
          </div>
          {task.dueDate && (
            <div className="text-sm text-k-text-b font-medium">Vence: {task.dueDate}</div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-4">
          {task.status === "open" && (
            <button
              onClick={handleStart}
              disabled={startMutation.isPending}
              className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-k-accent-btn text-white text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50"
            >
              <Play className="h-4 w-4" />
              {startMutation.isPending ? "Iniciando..." : "Iniciar tarea"}
            </button>
          )}
          {task.status === "in_progress" && (
            <>
              <button
                onClick={handleFinish}
                disabled={finishMutation.isPending}
                className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                {finishMutation.isPending ? "Finalizando..." : "Finalizar tarea"}
              </button>
            </>
          )}
          <button
            onClick={() => setIncidentModalOpen(true)}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-rose-50 text-rose-700 border border-rose-100 text-sm font-bold hover:bg-rose-100 transition-all"
          >
            <AlertTriangle className="h-4 w-4" />
            Reportar incidencia
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-k-border px-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cx(
              "flex items-center gap-2 px-4 py-3 text-sm font-bold transition-all border-b-2 -mb-px",
              tab === t.key
                ? "border-k-accent-btn text-k-accent-btn"
                : "border-transparent text-k-text-b hover:text-k-text-h"
            )}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
            {typeof t.count === "number" && t.count > 0 && (
              <span className="ml-1 text-[10px] bg-k-bg-card2 text-k-text-h px-1.5 py-0.5 rounded-full">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6">
        {tab === "detail" && (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-k-text-b">Descripción</label>
              <p className="text-sm text-k-text-h mt-1 leading-relaxed">{task.description || "Sin descripción"}</p>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-k-text-b">Notas</label>
              <p className="text-sm text-k-text-h mt-1 leading-relaxed">{task.notes || "Sin notas"}</p>
            </div>
            {task.assignedTo && task.assignedTo.length > 0 && (
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-k-text-b">Asignado a</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {task.assignedTo.map((empId) => (
                    <span
                      key={empId}
                      className="inline-flex items-center rounded-lg bg-k-bg-card2 px-3 py-1.5 text-xs font-semibold text-k-text-h"
                    >
                      {empId}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {task.isBlocked && (
              <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-800 font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Esta tarea está bloqueada hasta que el empleado registre su entrada.
              </div>
            )}
          </div>
        )}

        {tab === "checklist" && (
          <Checklist items={localChecklist} onToggle={handleToggleChecklist} />
        )}

        {tab === "evidence" && (
          <EvidenceGallery evidences={task.attachments} onAdd={() => { /* TODO: abrir uploader */ }} />
        )}

        {tab === "incidents" && (
          <div className="space-y-3">
            {task.incidents.length === 0 ? (
              <div className="text-center py-8 text-k-text-b text-sm">
                Sin incidencias reportadas
              </div>
            ) : (
              task.incidents.map((inc) => (
                <div
                  key={inc.id}
                  className="rounded-xl border border-k-border bg-k-bg-card2 p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className={cx(
                      "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full",
                      inc.status === "open" ? "bg-rose-50 text-rose-600" :
                      inc.status === "resolved" ? "bg-emerald-50 text-emerald-600" :
                      "bg-gray-50 text-gray-600"
                    )}>
                      {inc.status}
                    </span>
                    <span className="text-[10px] text-k-text-b">{inc.createdAt}</span>
                  </div>
                  <p className="text-sm font-medium text-k-text-h">{inc.description}</p>
                  <div className="text-[10px] text-k-text-b">Reportado por: {inc.reportedBy}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Incident Modal */}
      {incidentModalOpen && (
        <IncidentModal
          taskId={task.id}
          onClose={() => setIncidentModalOpen(false)}
          onSubmit={(payload) => {
            createIncidentMutation.mutate(payload, {
              onSuccess: () => setIncidentModalOpen(false),
            });
          }}
          isSubmitting={createIncidentMutation.isPending}
        />
      )}
    </div>
  );
}

// ─── Sub-componente: Modal de reporte de incidencia ─────────────────────────

function IncidentModal({
  taskId,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  taskId: string;
  onClose: () => void;
  onSubmit: (payload: { taskId: string; type: "missing_material" | "broken_equipment" | "other"; description: string; reportedBy: string }) => void;
  isSubmitting: boolean;
}) {
  const [type, setType] = useState<"missing_material" | "broken_equipment" | "other">("other");
  const [description, setDescription] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-obsidian/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-k-bg-card rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-k-text-h">Reportar incidencia</h3>
          <button onClick={onClose} className="h-8 w-8 rounded-xl bg-k-bg-card2 flex items-center justify-center text-k-text-b hover:text-k-text-h">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-k-text-b">Tipo</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as typeof type)}
              className="mt-1 w-full h-11 rounded-xl bg-k-bg-card2 border border-k-border px-3 text-sm font-medium text-k-text-h focus:outline-none focus:ring-2 focus:ring-k-bg-sidebar/20"
            >
              <option value="missing_material">Falta de material</option>
              <option value="broken_equipment">Equipo dañado</option>
              <option value="other">Otro</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-k-text-b">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe la incidencia..."
              className="mt-1 w-full rounded-xl bg-k-bg-card2 border border-k-border px-3 py-2 text-sm font-medium text-k-text-h placeholder:text-k-text-b/60 focus:outline-none focus:ring-2 focus:ring-k-bg-sidebar/20 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-xl bg-k-bg-card2 text-k-text-h text-sm font-bold hover:bg-k-border transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSubmit({ taskId, type, description, reportedBy: "current-user" })}
            disabled={!description.trim() || isSubmitting}
            className="flex-1 h-11 rounded-xl bg-k-accent-btn text-white text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50"
          >
            {isSubmitting ? "Enviando..." : "Reportar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Icon helper ────────────────────────────────────────────────────────────

function CircleDot({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="4" fill="currentColor" />
    </svg>
  );
}
