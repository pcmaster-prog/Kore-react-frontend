import { useState } from "react";
import { bulkCreateFromCatalog } from "@/features/tasks/catalog/api";
import type { Template } from "@/features/tasks/catalog/api";
import type { EmployeeWorkload } from "../types";
import { getApiErrorMessage } from "../utils";
import EmployeeWorkloadPicker from "@/features/tasks/components/EmployeeWorkloadPicker";
import PriorityBadge from "./ui/PriorityBadge";

export interface AssignTemplateModalProps {
  templates: Template[];
  workload: EmployeeWorkload[];
  onClose: () => void;
  onAssigned: () => void;
}

export default function AssignTemplateModal({
  templates,
  workload,
  onClose,
  onAssigned,
}: AssignTemplateModalProps) {
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  function toggleEmployee(id: string) {
    setSelectedEmployees((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  }

  async function handleAssign() {
    if (selectedEmployees.length === 0) return;
    setAssigning(true);
    setError(null);
    try {
      await bulkCreateFromCatalog({
        date: today,
        template_ids: templates.map((t) => t.id),
        empleado_ids: selectedEmployees,
        allow_duplicate: true,
      });
      window.dispatchEvent(
        new CustomEvent("kore-notification", {
          detail: {
            title: "Asignación exitosa",
            body: `${templates.length} plantilla(s) asignada(s) a ${selectedEmployees.length} empleado(s).`,
          },
        })
      );
      onAssigned();
    } catch (e: unknown) {
      const msg = getApiErrorMessage(e, "Error al asignar");
      setError(msg);
      window.dispatchEvent(
        new CustomEvent("kore-notification", {
          detail: { title: "Error", body: msg },
        })
      );
    } finally {
      setAssigning(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-k-bg-card rounded-[32px] w-full max-w-md shadow-2xl max-h-[88vh] flex flex-col">
        <div className="px-7 pt-7 pb-5 border-b border-k-border">
          <h2 className="text-lg font-black text-k-text-h">Asignar Plantilla</h2>
          {templates.length === 1 ? (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm font-bold text-k-text-h truncate">
                {templates[0].title}
              </span>
              {templates[0].priority && (
                <PriorityBadge priority={templates[0].priority} />
              )}
            </div>
          ) : (
            <div className="mt-2">
              <p className="text-sm font-bold text-k-text-h">
                {templates.length} plantillas seleccionadas
              </p>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {templates.slice(0, 4).map((t) => (
                  <span
                    key={t.id}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-k-bg-sidebar/5 text-k-text-h/60 border border-obsidian/10 truncate max-w-[140px]"
                  >
                    {t.title}
                  </span>
                ))}
                {templates.length > 4 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-k-text-b">
                    +{templates.length - 4} más
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-hidden px-7 pb-4">
          <EmployeeWorkloadPicker
            employees={workload}
            selectedIds={selectedEmployees}
            onToggle={toggleEmployee}
            onSelectAll={() => setSelectedEmployees(workload.map((e) => e.empleado_id))}
            onClear={() => setSelectedEmployees([])}
          />
        </div>

        {error && (
          <p className="px-7 pb-2 text-xs text-rose-500 font-bold">{error}</p>
        )}

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
