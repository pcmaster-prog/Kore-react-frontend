import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { formatWeekdays, Button } from "./ui";
import AddTemplatesToRoutineModal from "./AddTemplatesToRoutineModal";
import AssignRoutineModal from "./AssignRoutineModal";
import RoutineScheduleModal from "@/features/tasks/components/RoutineScheduleModal";
import type { Routine, RoutineItem, Template } from "./api";
import {
  addRoutineItems,
  assignRoutine,
  getRoutine,
  removeRoutineItem,
  listTemplates,
} from "./api";
import {
  useRoutineSchedules,
  useDeleteRoutineSchedule,
  useUpdateRoutineSchedule,
} from "@/features/tasks/hooks/useRoutineSchedules";
import type { RoutineSchedule } from "@/features/tasks/types";
import {
  Calendar,
  Trash2,
  GripVertical,
  Repeat,
  ArrowLeft,
  Plus,
  Clock,
  Bell,
  Bot,
  Edit3,
  CalendarClock,
  User,
  Briefcase,
  MapPin,
  Building2,
} from "lucide-react";

export default function RoutineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [items, setItems] = useState<RoutineItem[]>([]);
  const [templatesMap, setTemplatesMap] = useState<Map<string, Template>>(
    new Map(),
  );

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<RoutineSchedule | null>(null);

  const alreadyTemplateIds = useMemo(
    () => new Set(items.map((i) => i.template_id)),
    [items],
  );

  const { data: allSchedules, isLoading: schedulesLoading } = useRoutineSchedules();
  const deleteSchedule = useDeleteRoutineSchedule();
  const updateSchedule = useUpdateRoutineSchedule();

  const schedules = useMemo(
    () => allSchedules?.filter((s) => s.routineId === id) ?? [],
    [allSchedules, id],
  );

  async function load() {
    if (!id) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await getRoutine(id);
      setRoutine(res.item);
      setItems(res.items ?? []);

      const tplRes = await listTemplates({ active: true, page: 1 });
      const m = new Map<string, Template>();
      for (const t of tplRes.data ?? []) m.set(t.id, t);
      setTemplatesMap(m);
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "No pude cargar la rutina");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleRemove(itemId: string) {
    if (!id) return;
    if (!confirm("¿Quitar esta plantilla de la rutina?")) return;
    try {
      await removeRoutineItem(id, itemId);
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "No pude quitar la plantilla");
    }
  }

  async function handleAddTemplates(templateIds: string[]) {
    if (!id) return;
    await addRoutineItems(id, templateIds);
    await load();
  }

  async function handleAssign(payload: {
    date: string;
    empleado_ids: string[];
    due_at?: string | null;
    allow_duplicate?: boolean;
  }) {
    if (!id) return;
    const out = await assignRoutine(id, payload);
    alert("Rutina asignada ✅");
    return out;
  }

  function handleDeleteSchedule(scheduleId: string) {
    if (!confirm("¿Eliminar esta programación?")) return;
    deleteSchedule.mutate(scheduleId);
  }

  function handleToggleScheduleActive(schedule: RoutineSchedule) {
    updateSchedule.mutate({
      id: schedule.id,
      payload: { isActive: !schedule.isActive },
    });
  }

  function priorityLabel(p?: string) {
    return p === "urgent"
      ? "Urgente"
      : p === "high"
        ? "Alta"
        : p === "low"
          ? "Baja"
          : "Media";
  }

  function PriorityBadge({ p }: { p?: string }) {
    if (!p)
      return <span className="text-[10px] font-bold text-neutral-400">—</span>;
    const lbl = priorityLabel(p);
    const cls =
      p === "urgent"
        ? "bg-rose-50 text-rose-700 border-rose-200"
        : p === "high"
          ? "bg-amber-50 text-amber-700 border-amber-200"
          : p === "low"
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : "bg-neutral-50 text-neutral-700 border-neutral-200";

    return (
      <span
        className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] uppercase font-bold tracking-widest ${cls}`}
      >
        {lbl}
      </span>
    );
  }

  function AssigneeBadge({ schedule }: { schedule: RoutineSchedule }) {
    const type = schedule.assigneeType;
    if (!type) return null;

    const config = {
      empleado: { icon: <User className="h-3 w-3" />, label: "Empleado", color: "bg-blue-50 text-blue-700 border-blue-200" },
      position: { icon: <Briefcase className="h-3 w-3" />, label: "Puesto", color: "bg-purple-50 text-purple-700 border-purple-200" },
      section: { icon: <MapPin className="h-3 w-3" />, label: "Sección", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
      area: { icon: <Building2 className="h-3 w-3" />, label: "Área", color: "bg-amber-50 text-amber-700 border-amber-200" },
    }[type];

    return (
      <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-bold tracking-widest ${config.color}`}>
        {config.icon}
        {config.label}
      </span>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER ROW */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => nav("/app/manager/tareas")}
            className="h-10 w-10 bg-white border border-neutral-200 rounded-full flex items-center justify-center text-neutral-500 hover:text-obsidian hover:bg-neutral-50 hover:border-neutral-300 transition-colors shadow-sm shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h2 className="text-2xl font-black text-obsidian tracking-tight flex items-center gap-3">
              {routine?.name ?? "Cargando Rutina..."}
              {routine && (
                <span
                  className={`text-[10px] uppercase font-black tracking-widest px-2 py-1 rounded-md ${routine.is_active ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-500"}`}
                >
                  {routine.is_active ? "Activa" : "Inactiva"}
                </span>
              )}
            </h2>
            {routine ? (
              <div className="flex items-center gap-3 text-sm text-neutral-400 mt-1.5 font-medium">
                <span className="flex items-center gap-1.5">
                  <Repeat className="h-3.5 w-3.5" />{" "}
                  <span className="capitalize">{routine.recurrence}</span>
                </span>
                {routine.recurrence === "weekly" && (
                  <>
                    <span className="text-neutral-300">•</span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />{" "}
                      {formatWeekdays(routine.weekdays)}
                    </span>
                  </>
                )}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => setAddOpen(true)}
            disabled={!routine}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Añadir Plantillas
          </Button>
          <Button
            onClick={() => setAssignOpen(true)}
            disabled={!routine || items.length === 0}
          >
            Asignar Rutina
          </Button>
        </div>
      </div>

      {err ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 font-medium">
          {err}
        </div>
      ) : null}

      {/* ITEMS LIST */}
      <div className="bg-white rounded-[40px] border border-neutral-100 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-neutral-50 flex items-center justify-between gap-3 bg-neutral-50/30">
          <div>
            <h3 className="text-sm font-black text-obsidian tracking-tight">
              Plantillas de la Rutina
            </h3>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5">
              Orden de ejecución
            </p>
          </div>
          <div className="px-3 py-1 bg-white rounded-full border border-neutral-200 text-[10px] font-black tracking-widest text-neutral-500">
            {items.length} EVENTOS
          </div>
        </div>

        {loading ? (
          <div className="p-16 flex flex-col items-center gap-4 text-neutral-400 bg-neutral-50/50">
            <div className="h-10 w-10 border-4 border-neutral-200 border-t-obsidian rounded-full animate-spin" />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              Cargando...
            </span>
          </div>
        ) : items.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center">
            <div className="h-16 w-16 bg-neutral-50 rounded-full flex items-center justify-center text-neutral-300 mb-4">
              <Repeat className="h-8 w-8" />
            </div>
            <h4 className="text-lg font-black text-obsidian tracking-tight">
              No hay plantillas aquí
            </h4>
            <p className="text-sm font-medium text-neutral-400 mt-1 max-w-sm">
              Esta rutina no tiene tareas dentro. Añade plantillas para poder
              usarla.
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {items
              .slice()
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((it, idx) => {
                const t = templatesMap.get(it.template_id);
                return (
                  <div
                    key={it.id}
                    className="flex items-center gap-4 p-4 rounded-3xl bg-neutral-50 hover:bg-neutral-100 transition-colors border border-neutral-100 group"
                  >
                    <div className="text-neutral-300 group-hover:text-neutral-400 cursor-grab active:cursor-grabbing">
                      <GripVertical className="h-5 w-5" />
                    </div>

                    <div className="h-10 w-10 rounded-xl bg-white border border-neutral-200 shadow-sm flex items-center justify-center shrink-0">
                      <span className="text-xs font-black text-obsidian">
                        {idx + 1}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-obsidian truncate">
                        {t?.title ?? it.template_id}
                      </h4>
                      {t?.description && (
                        <div className="text-xs text-neutral-500 mt-1 truncate">
                          {t.description}
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 w-24 flex items-center justify-center">
                      <PriorityBadge p={t?.priority} />
                    </div>

                    <div className="shrink-0 pr-2">
                      <button
                        onClick={() => handleRemove(it.id)}
                        title="Quitar de rutina"
                        className="h-10 w-10 bg-white hover:bg-rose-50 border border-neutral-200 hover:border-rose-200 rounded-full flex items-center justify-center text-neutral-400 hover:text-rose-500 transition-colors shadow-sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* SCHEDULES SECTION */}
      <div className="bg-white rounded-[40px] border border-neutral-100 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-neutral-50 flex items-center justify-between gap-3 bg-neutral-50/30">
          <div>
            <h3 className="text-sm font-black text-obsidian tracking-tight">
              Programación
            </h3>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5">
              Schedules automáticos de esta rutina
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-white rounded-full border border-neutral-200 text-[10px] font-black tracking-widest text-neutral-500">
              {schedules.length} SCHEDULE{schedules.length !== 1 ? "S" : ""}
            </div>
            <Button
              onClick={() => {
                setEditingSchedule(null);
                setScheduleModalOpen(true);
              }}
              disabled={!routine}
            >
              <CalendarClock className="h-3.5 w-3.5 mr-1" />
              Programar Rutina
            </Button>
          </div>
        </div>

        {schedulesLoading ? (
          <div className="p-16 flex flex-col items-center gap-4 text-neutral-400 bg-neutral-50/50">
            <div className="h-10 w-10 border-4 border-neutral-200 border-t-obsidian rounded-full animate-spin" />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              Cargando schedules...
            </span>
          </div>
        ) : schedules.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center">
            <div className="h-16 w-16 bg-neutral-50 rounded-full flex items-center justify-center text-neutral-300 mb-4">
              <CalendarClock className="h-8 w-8" />
            </div>
            <h4 className="text-lg font-black text-obsidian tracking-tight">
              Sin programación
            </h4>
            <p className="text-sm font-medium text-neutral-400 mt-1 max-w-sm">
              Esta rutina no tiene schedules configurados. Crea uno para automatizar la asignación.
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-3xl border transition-all ${
                  schedule.isActive
                    ? "bg-neutral-50 border-neutral-100 hover:bg-neutral-100"
                    : "bg-neutral-50/50 border-neutral-100 opacity-60"
                }`}
              >
                <div className="h-12 w-12 rounded-2xl bg-white border border-neutral-200 shadow-sm flex items-center justify-center shrink-0">
                  <Calendar className="h-5 w-5 text-obsidian" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-obsidian">
                      {schedule.routineName ?? schedule.routineId}
                    </span>
                    <AssigneeBadge schedule={schedule} />
                    {!schedule.isActive && (
                      <span className="px-2 py-0.5 rounded-md bg-neutral-200 text-[9px] font-bold uppercase tracking-widest text-neutral-500">
                        Inactivo
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-neutral-500">
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="h-3 w-3" /> {schedule.triggerTime}
                    </span>
                    <span className="text-neutral-300">•</span>
                    <span className="font-medium">
                      {schedule.triggerDays.map((d) => {
                        const map = ["D", "L", "M", "X", "J", "V", "S"];
                        return map[d] ?? "?";
                      }).join(" ")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {schedule.autoAssign && (
                    <span
                      title="Auto-asignar activo"
                      className="h-8 w-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-500"
                    >
                      <Bot className="h-4 w-4" />
                    </span>
                  )}
                  {schedule.notifyPush && (
                    <span
                      title="Notificación push activa"
                      className="h-8 w-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-500"
                    >
                      <Bell className="h-4 w-4" />
                    </span>
                  )}
                  <button
                    onClick={() => handleToggleScheduleActive(schedule)}
                    title={schedule.isActive ? "Desactivar" : "Activar"}
                    className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${
                      schedule.isActive
                        ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                        : "bg-neutral-100 text-neutral-400 hover:bg-neutral-200"
                    }`}
                  >
                    <span className="text-[10px] font-black">
                      {schedule.isActive ? "ON" : "OFF"}
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setEditingSchedule(schedule);
                      setScheduleModalOpen(true);
                    }}
                    title="Editar"
                    className="h-8 w-8 rounded-lg bg-white border border-neutral-200 flex items-center justify-center text-neutral-400 hover:text-obsidian hover:border-neutral-300 transition-colors"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteSchedule(schedule.id)}
                    title="Eliminar"
                    className="h-8 w-8 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 hover:bg-rose-100 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddTemplatesToRoutineModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onConfirm={handleAddTemplates}
        alreadyTemplateIds={alreadyTemplateIds}
      />

      <AssignRoutineModal
        open={assignOpen}
        routineName={routine?.name ?? "Rutina"}
        onClose={() => setAssignOpen(false)}
        onAssign={handleAssign}
      />

      <RoutineScheduleModal
        open={scheduleModalOpen}
        onClose={() => {
          setScheduleModalOpen(false);
          setEditingSchedule(null);
        }}
        routineId={id}
        routineName={routine?.name}
        initial={editingSchedule}
      />
    </div>
  );
}
