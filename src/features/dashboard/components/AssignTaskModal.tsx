import { useState } from "react";
import { assignTask } from "@/features/tasks/api";
import type { EmployeeWorkload } from "../types";
import { reportError } from "@/lib/utils";
import EmployeePicker from "./ui/EmployeePicker";

export interface AssignTaskModalProps {
  tasks: { id: string; title: string }[];
  workload: EmployeeWorkload[];
  onClose: () => void;
  onAssigned: () => void;
}

export default function AssignTaskModal({
  tasks,
  workload,
  onClose,
  onAssigned,
}: AssignTaskModalProps) {
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);

  const isSingle = tasks.length === 1;

  function toggleEmployee(id: string) {
    setSelectedEmployees((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  }

  async function handleAssign() {
    if (selectedEmployees.length === 0) return;
    setAssigning(true);
    try {
      await Promise.all(
        tasks.map((t) => assignTask(t.id, { empleado_ids: selectedEmployees }))
      );
      onAssigned();
    } catch (e) {
      reportError("Operación de supervisor", e);
    } finally {
      setAssigning(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-k-bg-card rounded-[32px] w-full max-w-md shadow-2xl max-h-[88vh] flex flex-col">
        <div className="px-7 pt-7 pb-5 border-b border-k-border">
          <h2 className="text-lg font-black text-k-text-h">Asignar Tarea</h2>
          {isSingle ? (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm font-bold text-k-text-h truncate">
                {tasks[0].title}
              </span>
            </div>
          ) : (
            <div className="mt-2">
              <p className="text-sm font-bold text-k-text-h">
                {tasks.length} tareas seleccionadas
              </p>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {tasks.slice(0, 4).map((t) => (
                  <span
                    key={t.id}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-k-bg-sidebar/5 text-k-text-h/60 border border-obsidian/10 truncate max-w-[140px]"
                  >
                    {t.title}
                  </span>
                ))}
                {tasks.length > 4 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-k-text-b">
                    +{tasks.length - 4} más
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <EmployeePicker
          workload={workload}
          selectedIds={selectedEmployees}
          onToggle={toggleEmployee}
        />

        <div className="px-7 pb-7 pt-4 border-t border-k-border flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-12 rounded-2xl border border-k-border text-sm font-bold text-neutral-600 hover:bg-k-bg-card2 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleAssign}
            disabled={selectedEmployees.length === 0 || assigning}
            className="flex-1 h-12 rounded-2xl bg-k-accent-btn text-k-accent-btn-text text-sm font-bold hover:opacity-90 transition disabled:opacity-40"
          >
            {assigning
              ? "Asignando..."
              : `Asignar a ${selectedEmployees.length || ""} empleado${
                  selectedEmployees.length !== 1 ? "s" : ""
                }`}
          </button>
        </div>
      </div>
    </div>
  );
}
