// src/features/tasks/RoutineScheduleConfig.tsx
// ─── Configuración de auto-asignación de rutinas ────────────────────────────

import { useState } from "react";
import { cx } from "@/lib/utils";
import { useRoutineSchedules, useCreateRoutineSchedule, useUpdateRoutineSchedule, useDeleteRoutineSchedule } from "./hooks/useRoutineSchedules";
import type { CreateRoutineSchedulePayload } from "./types";
import { Plus, Trash2, Clock, Calendar, Bell, Bot, ToggleLeft, ToggleRight, X, Save } from "lucide-react";

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;
const DAY_VALUES = [1, 2, 3, 4, 5, 6, 0] as const;

export default function RoutineScheduleConfig() {
  const { data: schedules, isLoading } = useRoutineSchedules();
  const createSchedule = useCreateRoutineSchedule();
  const updateSchedule = useUpdateRoutineSchedule();
  const deleteSchedule = useDeleteRoutineSchedule();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateRoutineSchedulePayload>({
    routineId: "",
    triggerTime: "07:00",
    triggerDays: [1, 2, 3, 4, 5],
    autoAssign: true,
    notifyPush: true,
    isActive: true,
  });

  const toggleDay = (day: number) => {
    setForm((prev) => {
      const has = prev.triggerDays.includes(day);
      return {
        ...prev,
        triggerDays: has ? prev.triggerDays.filter((d) => d !== day) : [...prev.triggerDays, day],
      };
    });
  };

  const handleSave = () => {
    if (!form.routineId) return;
    createSchedule.mutate(form, {
      onSuccess: () => {
        setShowForm(false);
        setForm({
          routineId: "",
          triggerTime: "07:00",
          triggerDays: [1, 2, 3, 4, 5],
          autoAssign: true,
          notifyPush: true,
          isActive: true,
        });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-k-text-b text-sm font-medium">Cargando schedules...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black text-k-text-h tracking-tight">Programación de Rutinas</h3>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-k-accent-btn text-white text-sm font-bold hover:opacity-90 transition-all"
        >
          <Plus className="h-4 w-4" />
          Nuevo schedule
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-2xl bg-k-bg-card border border-k-border p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-k-text-b">Rutina</label>
              <input
                value={form.routineId}
                onChange={(e) => setForm((f) => ({ ...f, routineId: e.target.value }))}
                placeholder="ID de rutina"
                className="mt-1 w-full h-10 rounded-xl bg-k-bg-card2 border border-k-border px-3 text-sm font-medium text-k-text-h placeholder:text-k-text-b/60 focus:outline-none focus:ring-2 focus:ring-k-bg-sidebar/20"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-k-text-b">Hora de activación</label>
              <input
                type="time"
                value={form.triggerTime}
                onChange={(e) => setForm((f) => ({ ...f, triggerTime: e.target.value }))}
                className="mt-1 w-full h-10 rounded-xl bg-k-bg-card2 border border-k-border px-3 text-sm font-medium text-k-text-h focus:outline-none focus:ring-2 focus:ring-k-bg-sidebar/20"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-k-text-b mb-2 block">Días activos</label>
            <div className="flex gap-2">
              {DAY_VALUES.map((day, idx) => {
                const active = form.triggerDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={cx(
                      "h-10 w-10 rounded-xl text-xs font-bold transition-all",
                      active
                        ? "bg-k-accent-btn text-white shadow-md"
                        : "bg-k-bg-card2 text-k-text-b hover:bg-k-border"
                    )}
                  >
                    {DAYS[idx]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.autoAssign}
                onChange={(e) => setForm((f) => ({ ...f, autoAssign: e.target.checked }))}
                className="h-4 w-4 rounded border-k-border accent-k-accent-btn"
              />
              <span className="text-sm font-medium text-k-text-h flex items-center gap-1.5">
                <Bot className="h-3.5 w-3.5" /> Auto-asignar
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.notifyPush}
                onChange={(e) => setForm((f) => ({ ...f, notifyPush: e.target.checked }))}
                className="h-4 w-4 rounded border-k-border accent-k-accent-btn"
              />
              <span className="text-sm font-medium text-k-text-h flex items-center gap-1.5">
                <Bell className="h-3.5 w-3.5" /> Notificación push
              </span>
            </label>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={!form.routineId || createSchedule.isPending}
              className="h-10 px-5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50 inline-flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Guardar
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="h-10 px-4 rounded-xl bg-k-bg-card2 text-k-text-h text-sm font-bold hover:bg-k-border transition-all inline-flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="space-y-2">
        {schedules?.map((schedule) => (
          <div
            key={schedule.id}
            className={cx(
              "flex items-center gap-4 rounded-2xl bg-k-bg-card border border-k-border p-4 shadow-k-card transition-all",
              !schedule.isActive && "opacity-60"
            )}
          >
            <div className="h-10 w-10 rounded-xl bg-k-bg-sidebar/10 flex items-center justify-center text-k-accent-btn shrink-0">
              <Calendar className="h-5 w-5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-k-text-h truncate">{schedule.routineId}</div>
              <div className="flex items-center gap-3 mt-1 text-xs text-k-text-b">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {schedule.triggerTime}
                </span>
                <span className="flex items-center gap-1">
                  {schedule.triggerDays.map((d) => DAYS[DAY_VALUES.indexOf(d as 0 | 1 | 2 | 3 | 4 | 5 | 6)]).join(", ")}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {schedule.autoAssign && <span title="Auto-asignar"><Bot className="h-4 w-4 text-k-text-b" /></span>}
              {schedule.notifyPush && <span title="Push"><Bell className="h-4 w-4 text-k-text-b" /></span>}
              <button
                onClick={() => updateSchedule.mutate({ id: schedule.id, payload: { isActive: !schedule.isActive } })}
                className={cx(schedule.isActive ? "text-emerald-500" : "text-neutral-300")}
              >
                {schedule.isActive ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
              </button>
              <button
                onClick={() => {
                  if (confirm("¿Eliminar este schedule?")) deleteSchedule.mutate(schedule.id);
                }}
                className="h-7 w-7 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500 hover:bg-rose-100 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}

        {(!schedules || schedules.length === 0) && (
          <div className="text-center py-10 text-k-text-b text-sm bg-k-bg-card rounded-2xl border border-k-border">
            No hay schedules configurados
          </div>
        )}
      </div>
    </div>
  );
}
