import { X } from "lucide-react";
import TaskWizard from "./components/TaskWizard/TaskWizard";

export default function TaskCatalogPanel({
  onAssigned,
  onClose,
}: {
  onAssigned: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-k-bg-sidebar/40 backdrop-blur-sm transition-all"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[520px] bg-k-bg-card h-full shadow-2xl flex flex-col animate-in-slide-left pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-k-border flex items-center justify-between shrink-0 bg-k-bg-card2/50">
          <div>
            <h2 className="text-xl font-black text-k-text-h tracking-tight">
              Nueva Tarea
            </h2>
            <p className="text-xs font-medium text-k-text-b mt-1">
              Configura y asigna trabajo a tu equipo en 3 pasos
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="h-10 w-10 rounded-full bg-k-bg-card border border-k-border flex items-center justify-center text-k-text-b hover:text-k-text-h hover:bg-k-bg-card2 hover:border-neutral-300 transition-colors shadow-k-card"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Wizard */}
        <div className="flex-1 overflow-hidden">
          <TaskWizard onAssigned={onAssigned} onClose={onClose} />
        </div>
      </div>
    </div>
  );
}
