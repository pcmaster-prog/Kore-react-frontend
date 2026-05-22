// src/features/tasks/EmployeeTaskAreasPage.tsx
// ─── Página de tareas del empleado con el nuevo módulo v2 ───────────────────

import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import EmployeeTaskList from "./EmployeeTaskList";
import EmployeeTaskExecution from "./EmployeeTaskExecution";
import { ArrowLeft } from "lucide-react";

export default function EmployeeTaskAreasPage() {
  const [executingTaskId, setExecutingTaskId] = useState<string | null>(null);

  // TODO: integrar con attendance real para obtener hasCheckedIn
  const hasCheckedIn = true;

  if (executingTaskId) {
    return (
      <div className="space-y-4 animate-in-up">
        <button
          onClick={() => setExecutingTaskId(null)}
          className="inline-flex items-center gap-2 text-sm font-bold text-k-text-b hover:text-k-text-h transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a mis tareas
        </button>
        <EmployeeTaskExecution
          taskId={executingTaskId}
          onBack={() => setExecutingTaskId(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in-up">
      <PageHeader
        title="Mis Tareas"
        subtitle={hasCheckedIn ? "Tareas asignadas para hoy" : "Registra tu entrada para ver tus tareas"}
      />
      <EmployeeTaskList
        hasCheckedIn={hasCheckedIn}
        onExecuteTask={(taskId) => setExecutingTaskId(taskId)}
      />
    </div>
  );
}
