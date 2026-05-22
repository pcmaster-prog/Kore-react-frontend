// src/features/tasks/EmployeeTaskExecution.tsx
// ─── Vista de ejecución de tarea para empleado (cronómetro + checklist) ─────

import { useState, useMemo } from "react";
import { cx } from "@/lib/utils";
import type { ChecklistItem } from "./types";
import { useTaskTree, useStartTask, useFinishTask } from "./hooks/useTaskTree";
import { useTaskTimer } from "./hooks/useTaskTimer";
import { useCreateIncident } from "./hooks/useIncidents";
import PriorityBadge from "./components/PriorityBadge";
import TaskBreadcrumbs from "./components/Breadcrumbs";
import Checklist from "./components/Checklist";
import EvidenceGallery from "./components/EvidenceGallery";
import VoiceNoteRecorder from "./VoiceNoteRecorder";
import {
  Play,
  Pause,
  CheckCircle2,
  Timer,
  AlertTriangle,
  Camera,
  Mic,
  FileText,
  ArrowLeft,
  X,
} from "lucide-react";

interface EmployeeTaskExecutionProps {
  taskId: string;
  onBack?: () => void;
}

export default function EmployeeTaskExecution({ taskId, onBack }: EmployeeTaskExecutionProps) {
  const { data: tasks } = useTaskTree();
  const startMutation = useStartTask();
  const finishMutation = useFinishTask();
  const createIncident = useCreateIncident();
  const timer = useTaskTimer();

  const task = useMemo(() => tasks?.find((t) => t.id === taskId) ?? null, [tasks, taskId]);
  const [localChecklist, setLocalChecklist] = useState<ChecklistItem[]>(task?.checklist ?? []);
  const [incidentModalOpen, setIncidentModalOpen] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);

  if (!task) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-k-text-b text-sm font-medium">Tarea no encontrada</div>
      </div>
    );
  }

  const isRunning = timer.isRunning && timer.activeTaskId === task.id;
  const elapsed = isRunning ? timer.elapsedSeconds : 0;

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? `${h}:` : ""}${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const handleToggleChecklist = (id: string, done: boolean) => {
    setLocalChecklist((prev) => prev.map((item) => (item.id === id ? { ...item, done } : item)));
  };

  const handleStart = () => {
    startMutation.mutate(task.id);
    timer.start(task.id);
  };

  const handleFinish = () => {
    const duration = timer.stop();
    finishMutation.mutate(task.id);
    // TODO: enviar duration al backend si es necesario
    console.log("Duración:", duration, "segundos");
  };

  const checklistProgress = useMemo(() => {
    const total = localChecklist.length;
    const done = localChecklist.filter((c) => c.done).length;
    return total > 0 ? Math.round((done / total) * 100) : 0;
  }, [localChecklist]);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="h-10 w-10 rounded-xl bg-k-bg-card border border-k-border flex items-center justify-center text-k-text-b hover:text-k-text-h transition-colors shadow-k-card"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <TaskBreadcrumbs area={task.area} section={task.section} />
          <h2 className="text-xl font-black text-k-text-h tracking-tight truncate">{task.name}</h2>
        </div>
        <PriorityBadge priority={task.priority} />
      </div>

      {/* Timer Card */}
      <div className="rounded-3xl bg-k-bg-card border border-k-border p-6 shadow-k-card text-center space-y-4">
        <div className="inline-flex items-center gap-2 text-k-text-b text-sm font-bold uppercase tracking-widest">
          <Timer className="h-4 w-4" />
          Cronómetro
        </div>

        <div className="text-6xl font-black text-k-text-h tracking-tighter font-mono tabular-nums">
          {formatTime(elapsed)}
        </div>

        <div className="flex justify-center gap-3">
          {task.status === "open" && (
            <button
              onClick={handleStart}
              disabled={startMutation.isPending}
              className="h-14 px-8 rounded-2xl bg-k-accent-btn text-white text-lg font-bold hover:opacity-90 transition-all disabled:opacity-50 inline-flex items-center gap-2 shadow-lg"
            >
              <Play className="h-5 w-5" />
              {startMutation.isPending ? "..." : "Iniciar"}
            </button>
          )}
          {task.status === "in_progress" && (
            <>
              {isRunning ? (
                <button
                  onClick={() => timer.stop()}
                  className="h-14 px-8 rounded-2xl bg-amber-500 text-white text-lg font-bold hover:opacity-90 transition-all inline-flex items-center gap-2 shadow-lg"
                >
                  <Pause className="h-5 w-5" />
                  Pausar
                </button>
              ) : (
                <button
                  onClick={() => timer.start(task.id)}
                  className="h-14 px-8 rounded-2xl bg-k-accent-btn text-white text-lg font-bold hover:opacity-90 transition-all inline-flex items-center gap-2 shadow-lg"
                >
                  <Play className="h-5 w-5" />
                  Reanudar
                </button>
              )}
              <button
                onClick={handleFinish}
                disabled={finishMutation.isPending}
                className="h-14 px-8 rounded-2xl bg-emerald-600 text-white text-lg font-bold hover:opacity-90 transition-all disabled:opacity-50 inline-flex items-center gap-2 shadow-lg"
              >
                <CheckCircle2 className="h-5 w-5" />
                {finishMutation.isPending ? "..." : "Finalizar"}
              </button>
            </>
          )}
          {task.status === "done_pending" && (
            <div className="h-14 px-8 rounded-2xl bg-amber-50 text-amber-700 border border-amber-100 text-lg font-bold inline-flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Por revisar
            </div>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="rounded-2xl bg-k-bg-card border border-k-border p-4 shadow-k-card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-k-text-h">Progreso del checklist</span>
          <span className="text-sm font-black text-k-text-h">{checklistProgress}%</span>
        </div>
        <div className="h-2.5 w-full bg-neutral-100 rounded-full overflow-hidden">
          <div
            className={cx(
              "h-full rounded-full transition-all duration-500",
              checklistProgress === 100 ? "bg-emerald-500" : "bg-k-accent-btn"
            )}
            style={{ width: `${checklistProgress}%` }}
          />
        </div>
      </div>

      {/* Checklist */}
      <div className="rounded-2xl bg-k-bg-card border border-k-border p-5 shadow-k-card">
        <h3 className="text-sm font-black text-k-text-h mb-3">Checklist</h3>
        <Checklist items={localChecklist} onToggle={handleToggleChecklist} />
      </div>

      {/* Tools */}
      <div className="rounded-2xl bg-k-bg-card border border-k-border p-5 shadow-k-card space-y-4">
        <h3 className="text-sm font-black text-k-text-h">Herramientas</h3>
        <div className="flex flex-wrap gap-2">
          <button className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-k-bg-card2 text-k-text-h text-sm font-bold hover:bg-k-border transition-all border border-k-border">
            <Camera className="h-4 w-4" />
            Foto
          </button>
          <button
            onClick={() => setShowVoiceRecorder((s) => !s)}
            className={cx(
              "inline-flex items-center gap-2 h-11 px-5 rounded-xl text-sm font-bold transition-all border border-k-border",
              showVoiceRecorder
                ? "bg-amber-50 text-amber-700 border-amber-100"
                : "bg-k-bg-card2 text-k-text-h hover:bg-k-border"
            )}
          >
            <Mic className="h-4 w-4" />
            {showVoiceRecorder ? "Cerrar audio" : "Nota de voz"}
          </button>
          <button className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-k-bg-card2 text-k-text-h text-sm font-bold hover:bg-k-border transition-all border border-k-border">
            <FileText className="h-4 w-4" />
            Nota texto
          </button>
          <button
            onClick={() => setIncidentModalOpen(true)}
            className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-rose-50 text-rose-700 text-sm font-bold hover:bg-rose-100 transition-all border border-rose-100"
          >
            <AlertTriangle className="h-4 w-4" />
            Incidencia
          </button>
        </div>

        {showVoiceRecorder && (
          <VoiceNoteRecorder
            onRecordComplete={(blob) => {
              console.log("Voice note recorded:", blob);
              setShowVoiceRecorder(false);
            }}
          />
        )}
      </div>

      {/* Evidence */}
      <div className="rounded-2xl bg-k-bg-card border border-k-border p-5 shadow-k-card">
        <h3 className="text-sm font-black text-k-text-h mb-3">Evidencias</h3>
        <EvidenceGallery evidences={task.attachments} />
      </div>

      {/* Incident Modal */}
      {incidentModalOpen && (
        <IncidentModal
          taskId={task.id}
          onClose={() => setIncidentModalOpen(false)}
          onSubmit={(payload) => {
            createIncident.mutate(payload, {
              onSuccess: () => setIncidentModalOpen(false),
            });
          }}
          isSubmitting={createIncident.isPending}
        />
      )}
    </div>
  );
}

// ─── Sub-componente: Modal de incidencia (simplificado) ─────────────────────

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
              className="mt-1 w-full h-10 rounded-xl bg-k-bg-card2 border border-k-border px-3 text-sm font-medium text-k-text-h"
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
              rows={3}
              placeholder="Describe la incidencia..."
              className="mt-1 w-full rounded-xl bg-k-bg-card2 border border-k-border px-3 py-2 text-sm font-medium text-k-text-h placeholder:text-k-text-b/60 resize-none focus:outline-none focus:ring-2 focus:ring-k-bg-sidebar/20"
            />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 h-11 rounded-xl bg-k-bg-card2 text-k-text-h text-sm font-bold hover:bg-k-border transition-all">
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
