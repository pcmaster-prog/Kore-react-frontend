import { Calendar, Clock, Layers, RefreshCw } from "lucide-react";
import { cx } from "@/lib/utils";
import { isEnabled } from "@/lib/featureFlags";
import type { CatalogResponse } from "../../api";
import type { Routine } from "../../routinesApi";

type CatalogApiItem = CatalogResponse["catalog"][number];

export type AssignMode = "adhoc" | "catalog" | "routine";

interface StepWhatProps {
  mode: AssignMode;
  onModeChange: (m: AssignMode) => void;

  // Ad-hoc
  newTitle: string;
  onTitleChange: (v: string) => void;
  newDesc: string;
  onDescChange: (v: string) => void;
  newPriority: string;
  onPriorityChange: (v: string) => void;
  newEstMin: string;
  onEstMinChange: (v: string) => void;

  // Catalog + Routine shared
  date: string;
  onDateChange: (v: string) => void;

  // Catalog
  catalog: CatalogApiItem[];
  selectedTemplateIds: string[];
  onToggleTemplate: (id: string) => void;
  onSelectAllTemplates: () => void;

  // Routine
  routines: Routine[];
  routineId: string;
  onRoutineChange: (id: string) => void;
}

function PriorityBadge({ p }: { p?: string }) {
  const label = (p ?? "-").toLowerCase();
  const cls =
    label === "urgent" || label === "high"
      ? "bg-k-badge-a-bg text-k-badge-a-c border-k-border"
      : label === "low"
        ? "bg-k-badge-b-bg text-k-badge-b-c border-k-border"
        : "bg-k-bg-card2 text-neutral-700 border-k-border";
  return (
    <span
      className={`inline-flex items-center rounded-[8px] border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${cls}`}
    >
      {p ?? "-"}
    </span>
  );
}

export default function StepWhat({
  mode,
  onModeChange,
  newTitle,
  onTitleChange,
  newDesc,
  onDescChange,
  newPriority,
  onPriorityChange,
  newEstMin,
  onEstMinChange,
  date,
  onDateChange,
  catalog,
  selectedTemplateIds,
  onToggleTemplate,
  onSelectAllTemplates,
  routines,
  routineId,
  onRoutineChange,
}: StepWhatProps) {
  const modes: { key: AssignMode; label: string; icon: React.ReactNode }[] = [
    { key: "adhoc", label: "Tarea Rápida", icon: <Clock className="h-4 w-4" /> },
    { key: "catalog", label: "Del Catálogo", icon: <Layers className="h-4 w-4" /> },
    { key: "routine", label: "Rutina Completa", icon: <RefreshCw className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6 animate-in-fade">
      {/* Mode selector */}
      <div className="flex bg-neutral-100 p-1.5 rounded-[20px]">
        {modes.map((m) => (
          <button
            key={m.key}
            onClick={() => onModeChange(m.key)}
            className={cx(
              "flex-1 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2",
              mode === m.key
                ? "bg-k-bg-card text-k-text-h shadow-k-card shadow-black/5"
                : "text-k-text-b hover:text-k-text-h"
            )}
          >
            {m.icon}
            {m.label}
          </button>
        ))}
      </div>

      {/* Shared date for catalog/routine */}
      {mode !== "adhoc" && (
        <label className="block animate-in-fade">
          <span className="block text-[11px] font-bold uppercase tracking-widest text-k-text-b mb-2 flex items-center gap-2">
            <Calendar className="h-3 w-3" /> Fecha de Asignación
          </span>
          <input
            type="date"
            className="w-full bg-k-bg-card2 border border-k-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-obsidian/10 transition-shadow appearance-none cursor-pointer"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
          />
        </label>
      )}

      {/* Ad-hoc form */}
      {mode === "adhoc" && (
        <div className="space-y-5 animate-in-fade">
          <label className="block">
            <span className="block text-[11px] font-bold uppercase tracking-widest text-k-text-b mb-2">
              Título de la tarea *
            </span>
            <input
              className="w-full bg-k-bg-card2 border border-k-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-obsidian/10 transition-shadow"
              placeholder="Ej. Limpiar el congelador N°3"
              value={newTitle}
              onChange={(e) => onTitleChange(e.target.value)}
            />
            {newTitle.trim().length > 0 && newTitle.trim().length < 3 && (
              <p className="text-[11px] text-rose-500 mt-1.5 font-medium">
                El título debe tener al menos 3 caracteres.
              </p>
            )}
          </label>

          <label className="block">
            <span className="block text-[11px] font-bold uppercase tracking-widest text-k-text-b mb-2">
              Descripción (Opcional)
            </span>
            <textarea
              rows={2}
              className="w-full bg-k-bg-card2 border border-k-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-obsidian/10 transition-shadow resize-none"
              placeholder="Instrucciones breves..."
              value={newDesc}
              onChange={(e) => onDescChange(e.target.value)}
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-[11px] font-bold uppercase tracking-widest text-k-text-b mb-2">
                Prioridad
              </span>
              <select
                className="w-full bg-k-bg-card2 border border-k-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-obsidian/10 transition-shadow appearance-none cursor-pointer"
                value={newPriority}
                onChange={(e) => onPriorityChange(e.target.value)}
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </label>
            <label className="block">
              <span className="block text-[11px] font-bold uppercase tracking-widest text-k-text-b mb-2">
                Minutos Est.
              </span>
              {isEnabled("newTaskModal") ? (
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { val: "15", label: "15m" },
                    { val: "30", label: "30m" },
                    { val: "60", label: "1h" },
                    { val: "120", label: "2h" },
                  ].map((t) => (
                    <button
                      key={t.val}
                      type="button"
                      onClick={() => onEstMinChange(t.val)}
                      className={cx(
                        "py-3 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all",
                        newEstMin === t.val
                          ? "bg-k-accent-btn text-k-accent-btn-text shadow-k-card"
                          : "bg-k-bg-card2 border border-k-border text-k-text-b hover:border-k-border hover:bg-k-bg-card"
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  type="number"
                  className="w-full bg-k-bg-card2 border border-k-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-obsidian/10 transition-shadow"
                  placeholder="Ej. 15"
                  value={newEstMin}
                  onChange={(e) => onEstMinChange(e.target.value)}
                />
              )}
            </label>
          </div>
        </div>
      )}

      {/* Catalog list */}
      {mode === "catalog" && (
        <div className="space-y-4 animate-in-fade">
          <div className="p-5 bg-k-bg-card border border-k-border rounded-3xl shadow-k-card flex flex-col h-[320px]">
            <div className="flex items-center justify-between mb-4">
              <span className="block text-[11px] font-bold uppercase tracking-widest text-k-text-b">
                Catálogo del día
              </span>
              <div className="flex items-center gap-2">
                {selectedTemplateIds.length > 0 && (
                  <span className="text-[10px] font-bold text-k-text-h bg-k-bg-sidebar/5 px-2 py-1 rounded-md">
                    {selectedTemplateIds.length} seleccionadas
                  </span>
                )}
                {catalog.length > 0 && (
                  <button
                    className="text-[9px] font-bold uppercase tracking-widest text-k-text-h bg-neutral-100 hover:bg-neutral-200 px-2 py-1 rounded-md transition"
                    onClick={onSelectAllTemplates}
                  >
                    Seleccionar Todo
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
              {catalog.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-xs text-k-text-b font-medium pb-4 gap-2">
                  <Layers className="h-6 w-6 text-neutral-300" />
                  No hay tareas para esta fecha.
                </div>
              ) : (
                catalog.map((it) => {
                  const t = it.template;
                  const reactKey =
                    it.routine_item_id ?? `${it.routine_id}-${t.id}`;
                  const selected = selectedTemplateIds.includes(t.id);
                  const est =
                    (t as any).estimated_minutes ??
                    t.meta?.estimated_minutes ??
                    null;
                  return (
                    <label
                      key={reactKey}
                      className={cx(
                        "flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-colors",
                        selected
                          ? "bg-k-bg-sidebar/5 border-obsidian/20"
                          : "bg-k-bg-card border-k-border hover:border-k-border"
                      )}
                    >
                      <input
                        type="checkbox"
                        className="mt-1 accent-obsidian"
                        checked={selected}
                        onChange={() => onToggleTemplate(t.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-bold text-k-text-h line-clamp-2 leading-tight">
                            {t.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <PriorityBadge p={t.priority} />
                          {est !== null && (
                            <span className="text-[10px] font-bold text-k-text-b flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {est}m
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Routine selector */}
      {mode === "routine" && (
        <div className="space-y-4 animate-in-fade">
          <div className="p-5 bg-k-bg-card border border-k-border rounded-3xl shadow-k-card space-y-4">
            <span className="block text-[11px] font-bold uppercase tracking-widest text-k-text-b">
              Seleccionar Rutina
            </span>
            <select
              className="w-full bg-k-bg-card2 border border-k-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-obsidian/10 transition-shadow appearance-none cursor-pointer disabled:opacity-50"
              value={routineId}
              onChange={(e) => onRoutineChange(e.target.value)}
              disabled={routines.length === 0}
            >
              {routines.length === 0 ? (
                <option value="">Sin rutinas activas</option>
              ) : (
                routines.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))
              )}
            </select>

            {routineId && (
              <div className="rounded-2xl bg-k-badge-p-bg border border-k-border p-4 animate-in-fade">
                <p className="text-[10px] font-bold text-k-badge-p-c uppercase tracking-widest mb-1">
                  Detalle de la rutina
                </p>
                {(() => {
                  const rut = routines.find((r) => r.id === routineId);
                  if (!rut) return null;
                  return (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-k-text-h">
                        {rut.name}
                      </p>
                      {rut.description && (
                        <p className="text-xs text-k-text-b">
                          {rut.description}
                        </p>
                      )}
                      <p className="text-[10px] text-k-text-b capitalize">
                        Recurrencia: {rut.recurrence}
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
