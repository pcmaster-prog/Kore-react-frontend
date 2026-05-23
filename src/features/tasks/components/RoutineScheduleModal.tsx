// src/features/tasks/components/RoutineScheduleModal.tsx
// Modal para crear/editar programación de rutinas

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { cx } from "@/lib/utils";
import { Modal, Input, Button } from "@/features/tasks/catalog/ui";
import type { RoutineSchedule, CreateRoutineSchedulePayload, UpdateRoutineSchedulePayload, RoutineScheduleAssigneeType } from "@/features/tasks/types";
import {
  useCreateRoutineSchedule,
  useUpdateRoutineSchedule,
} from "@/features/tasks/hooks/useRoutineSchedules";
import { listEmployees } from "@/features/tasks/employeeApi";
import { listPositions, listSections, listAreas } from "@/features/tasks/areaApi";
import { listRoutines } from "@/features/tasks/catalog/api";
import {
  Clock,
  Calendar,
  Bell,
  Bot,
  Save,
  AlertTriangle,
  User,
  Briefcase,
  MapPin,
  Building2,
} from "lucide-react";

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;
const DAY_VALUES = [1, 2, 3, 4, 5, 6, 0] as const;

const ASSIGNEE_TYPES: { value: NonNullable<RoutineScheduleAssigneeType>; label: string; icon: React.ReactNode }[] = [
  { value: "empleado", label: "Empleado específico", icon: <User className="h-3.5 w-3.5" /> },
  { value: "position", label: "Puesto", icon: <Briefcase className="h-3.5 w-3.5" /> },
  { value: "section", label: "Sección", icon: <MapPin className="h-3.5 w-3.5" /> },
  { value: "area", label: "Área", icon: <Building2 className="h-3.5 w-3.5" /> },
];

interface RoutineScheduleModalProps {
  open: boolean;
  onClose: () => void;
  routineId?: string;
  routineName?: string;
  initial?: RoutineSchedule | null;
}

export default function RoutineScheduleModal({
  open,
  onClose,
  routineId: preselectedRoutineId,
  routineName: preselectedRoutineName,
  initial,
}: RoutineScheduleModalProps) {
  const isEdit = !!initial;

  const [selectedRoutineId, setSelectedRoutineId] = useState(preselectedRoutineId ?? "");
  const [assigneeType, setAssigneeType] = useState<RoutineScheduleAssigneeType>("empleado");
  const [assigneeId, setAssigneeId] = useState("");
  const [areaId, setAreaId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [triggerTime, setTriggerTime] = useState("07:00");
  const [triggerDays, setTriggerDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [autoAssign, setAutoAssign] = useState(true);
  const [notifyPush, setNotifyPush] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const createSchedule = useCreateRoutineSchedule();
  const updateSchedule = useUpdateRoutineSchedule();

  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: listEmployees,
    staleTime: 5 * 60 * 1000,
    enabled: open,
  });

  const { data: positions } = useQuery({
    queryKey: ["positions"],
    queryFn: listPositions,
    staleTime: 5 * 60 * 1000,
    enabled: open,
  });

  const { data: sections } = useQuery({
    queryKey: ["sections"],
    queryFn: listSections,
    staleTime: 5 * 60 * 1000,
    enabled: open,
  });

  const { data: areas } = useQuery({
    queryKey: ["areas"],
    queryFn: listAreas,
    staleTime: 5 * 60 * 1000,
    enabled: open,
  });

  const { data: routinesData } = useQuery({
    queryKey: ["routines", "all"],
    queryFn: () => listRoutines({ active: true, page: 1 }),
    staleTime: 5 * 60 * 1000,
    enabled: open && !preselectedRoutineId,
  });

  const routines = routinesData?.data ?? [];

  useEffect(() => {
    if (!open) return;
    setErr(null);

    if (initial) {
      setSelectedRoutineId(initial.routineId);
      setAssigneeType(initial.assigneeType ?? "empleado");
      setAssigneeId(initial.assigneeId ?? "");
      setAreaId(initial.areaId ?? "");
      setSectionId(initial.sectionId ?? "");
      setTriggerTime(initial.triggerTime);
      setTriggerDays(initial.triggerDays);
      setAutoAssign(initial.autoAssign);
      setNotifyPush(initial.notifyPush);
      setIsActive(initial.isActive);
    } else {
      setSelectedRoutineId(preselectedRoutineId ?? "");
      setAssigneeType("empleado");
      setAssigneeId("");
      setAreaId("");
      setSectionId("");
      setTriggerTime("07:00");
      setTriggerDays([1, 2, 3, 4, 5]);
      setAutoAssign(true);
      setNotifyPush(true);
      setIsActive(true);
    }
  }, [open, initial, preselectedRoutineId]);

  const toggleDay = (day: number) => {
    setTriggerDays((prev) => {
      const has = prev.includes(day);
      return has ? prev.filter((d) => d !== day) : [...prev, day];
    });
  };

  const assigneeLabel = useMemo(() => {
    if (!assigneeType || !assigneeId) return null;
    switch (assigneeType) {
      case "empleado":
        return employees?.find((e) => e.id === assigneeId)?.full_name ?? assigneeId;
      case "position":
        return positions?.find((p) => p.id === assigneeId)?.name ?? assigneeId;
      case "section":
        return sections?.find((s) => s.id === assigneeId)?.name ?? assigneeId;
      case "area":
        return areas?.find((a) => a.id === assigneeId)?.name ?? assigneeId;
      default:
        return assigneeId;
    }
  }, [assigneeType, assigneeId, employees, positions, sections, areas]);

  const canSave = useMemo(() => {
    if (!selectedRoutineId) return false;
    if (triggerDays.length === 0) return false;
    if (!triggerTime) return false;
    if (assigneeType && !assigneeId) return false;
    return true;
  }, [selectedRoutineId, triggerDays, triggerTime, assigneeType, assigneeId]);

  async function handleSave() {
    setErr(null);
    if (!canSave) return;

    const payload: CreateRoutineSchedulePayload = {
      routineId: selectedRoutineId,
      triggerTime,
      triggerDays,
      autoAssign,
      notifyPush,
      isActive,
      assigneeType,
      assigneeId: assigneeId || null,
      areaId: areaId || null,
      sectionId: sectionId || null,
    };

    try {
      if (isEdit && initial) {
        const updatePayload: UpdateRoutineSchedulePayload = {
          routineId: selectedRoutineId,
          triggerTime,
          triggerDays,
          autoAssign,
          notifyPush,
          isActive,
          assigneeType,
          assigneeId: assigneeId || null,
          areaId: areaId || null,
          sectionId: sectionId || null,
        };
        await updateSchedule.mutateAsync({ id: initial.id, payload: updatePayload });
      } else {
        await createSchedule.mutateAsync(payload);
      }
      onClose();
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? e?.message ?? "No pude guardar el schedule");
    }
  }

  const renderAssigneeSelect = () => {
    switch (assigneeType) {
      case "empleado":
        return (
          <select
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-obsidian/5"
          >
            <option value="">Selecciona un empleado</option>
            {employees?.map((e) => (
              <option key={e.id} value={e.id}>
                {e.full_name ?? e.name ?? e.id}
              </option>
            ))}
          </select>
        );
      case "position":
        return (
          <select
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-obsidian/5"
          >
            <option value="">Selecciona un puesto</option>
            {positions?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        );
      case "section":
        return (
          <select
            value={assigneeId}
            onChange={(e) => {
              setAssigneeId(e.target.value);
              setSectionId(e.target.value);
            }}
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-obsidian/5"
          >
            <option value="">Selecciona una sección</option>
            {sections?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        );
      case "area":
        return (
          <select
            value={assigneeId}
            onChange={(e) => {
              setAssigneeId(e.target.value);
              setAreaId(e.target.value);
            }}
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-obsidian/5"
          >
            <option value="">Selecciona un área</option>
            {areas?.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      open={open}
      title={isEdit ? "Editar Programación" : "Programar Rutina"}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!canSave || createSchedule.isPending || updateSchedule.isPending}>
            {createSchedule.isPending || updateSchedule.isPending ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {err ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {err}
          </div>
        ) : null}

        {/* Selector de Rutina */}
        {preselectedRoutineId ? (
          <div>
            <div className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-neutral-400">
              Rutina
            </div>
            <div className="w-full rounded-xl border border-neutral-200 bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-600">
              {preselectedRoutineName ?? selectedRoutineId}
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-neutral-400">
              Rutina *
            </div>
            <select
              value={selectedRoutineId}
              onChange={(e) => setSelectedRoutineId(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-obsidian/5"
            >
              <option value="">Selecciona una rutina</option>
              {routines.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Bloque de asignación */}
        <div className="rounded-2xl border border-neutral-100 bg-neutral-50/50 p-4 space-y-4">
          <div className="text-[10px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
            <User className="h-3.5 w-3.5" />
            Asignación
          </div>

          <div>
            <div className="mb-2 text-[11px] font-bold text-neutral-500">Tipo de asignación</div>
            <div className="flex flex-wrap gap-2">
              {ASSIGNEE_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => {
                    setAssigneeType(t.value);
                    setAssigneeId("");
                    setAreaId("");
                    setSectionId("");
                  }}
                  className={cx(
                    "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all border",
                    assigneeType === t.value
                      ? "bg-obsidian text-white border-obsidian shadow-sm"
                      : "bg-white text-neutral-500 border-neutral-200 hover:border-neutral-300 hover:text-obsidian"
                  )}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1.5 text-[11px] font-bold text-neutral-500">
              {ASSIGNEE_TYPES.find((t) => t.value === assigneeType)?.label}
            </div>
            {renderAssigneeSelect()}
          </div>

          {assigneeId && assigneeLabel && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100 text-[11px] font-bold text-blue-700">
              {ASSIGNEE_TYPES.find((t) => t.value === assigneeType)?.icon}
              {assigneeLabel}
            </div>
          )}
        </div>

        {/* Días y hora */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Hora de activación
            </div>
            <Input
              type="time"
              value={triggerTime}
              onChange={(e) => setTriggerTime(e.target.value)}
              className="bg-neutral-50 border-neutral-200 text-obsidian font-medium"
            />
          </div>
        </div>

        <div>
          <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Días activos
          </div>
          <div className="flex flex-wrap gap-2">
            {DAY_VALUES.map((day, idx) => {
              const active = triggerDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={cx(
                    "h-10 w-10 flex items-center justify-center rounded-xl text-[11px] font-black transition-all shadow-sm",
                    active
                      ? "bg-obsidian text-white border-transparent"
                      : "bg-white border border-neutral-200 text-neutral-400 hover:text-obsidian hover:bg-neutral-50 hover:border-neutral-300"
                  )}
                >
                  {DAYS[idx]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Opciones */}
        <div className="flex flex-col sm:flex-row gap-4">
          <label className="flex items-center gap-3 cursor-pointer bg-neutral-50 rounded-xl border border-neutral-100 px-4 py-3 flex-1">
            <input
              type="checkbox"
              checked={autoAssign}
              onChange={(e) => setAutoAssign(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300 accent-obsidian"
            />
            <span className="text-sm font-bold text-obsidian flex items-center gap-1.5">
              <Bot className="h-4 w-4 text-neutral-400" /> Auto-asignar
            </span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer bg-neutral-50 rounded-xl border border-neutral-100 px-4 py-3 flex-1">
            <input
              type="checkbox"
              checked={notifyPush}
              onChange={(e) => setNotifyPush(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300 accent-obsidian"
            />
            <span className="text-sm font-bold text-obsidian flex items-center gap-1.5">
              <Bell className="h-4 w-4 text-neutral-400" /> Notificación push
            </span>
          </label>
        </div>

        {!autoAssign && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <span className="font-bold">Atención:</span> La rutina se disparará pero no se crearán
              tareas automáticamente. Deberás asignarla manualmente.
            </div>
          </div>
        )}

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-neutral-300 accent-obsidian"
          />
          <span className="text-sm font-bold text-obsidian">Activo</span>
        </label>
      </div>
    </Modal>
  );
}
