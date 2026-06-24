import { useEffect, useState } from "react";
import { Toggle, formatWeekdays } from "./ui";
import RoutineModal from "./RoutineModal";
import RoutineScheduleModal from "@/features/tasks/components/RoutineScheduleModal";
import ActionMenu from "@/components/ActionMenu";
import type { Routine } from "./api";
import {
  createRoutine,
  deleteRoutine,
  listRoutines,
  updateRoutine,
  getRoutine,
  addRoutineItems,
} from "./api";
import { Calendar, Repeat, Eye, Edit2, Trash2, Plus, Zap, CalendarClock, Copy } from "lucide-react";

export default function RoutinesPage({
  onOpenDetail,
}: {
  onOpenDetail?: (routineId: string) => void;
}) {
  const [items, setItems] = useState<Routine[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [activeOnly, setActiveOnly] = useState(true);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selected, setSelected] = useState<Routine | null>(null);

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleRoutine, setScheduleRoutine] = useState<Routine | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await listRoutines({ page, active: activeOnly });
      setItems(res.data ?? []);
      setLastPage(
        (res as any)?.last_page ?? (res as any)?.meta?.last_page ?? 1,
      );
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "No pude cargar rutinas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, activeOnly]);

  function openCreate() {
    setSelected(null);
    setModalMode("create");
    setModalOpen(true);
  }

  function openEdit(r: Routine) {
    setSelected(r);
    setModalMode("edit");
    setModalOpen(true);
  }

  async function handleSave(payload: Partial<Routine>) {
    if (modalMode === "create") await createRoutine(payload);
    else if (selected) await updateRoutine(selected.id, payload);
    await load();
  }

  async function handleDelete(r: Routine) {
    if (!confirm(`¿Eliminar rutina "${r.name}"?`)) return;
    try {
      await deleteRoutine(r.id);
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "No pude eliminar");
    }
  }

  async function handleDuplicate(r: Routine) {
    const payload: Partial<Routine> = {
      name: `Copia de ${r.name}`,
      description: r.description,
      recurrence: r.recurrence,
      weekdays: r.weekdays,
      start_date: r.start_date,
      end_date: r.end_date,
      is_active: true,
      show_in_dashboard: r.show_in_dashboard,
    };
    try {
      const created = await createRoutine(payload);
      if (created?.id) {
        const full = await getRoutine(r.id);
        const templateIds = (full?.items ?? [])
          .map((it) => it.template_id)
          .filter(Boolean);
        if (templateIds.length) {
          await addRoutineItems(created.id, templateIds);
        }
      }
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "No pude duplicar la rutina");
    }
  }

  function openScheduleModal(r: Routine) {
    setScheduleRoutine(r);
    setScheduleModalOpen(true);
  }

  function handleOpenDetail(r: Routine) {
    if (onOpenDetail) {
      onOpenDetail(r.id);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-obsidian tracking-tight">
            Rutinas
          </h2>
          <p className="text-sm text-neutral-400 mt-1">
            La mecánica del sistema. Asigna bloques enteros de tareas a tu
            equipo.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="h-11 px-5 rounded-2xl bg-obsidian text-sm font-bold text-white shadow-sm hover:bg-gold transition-all flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nueva Rutina
        </button>
      </div>

      <div className="flex items-center justify-between rounded-3xl border border-neutral-100 bg-white p-4 shadow-sm">
        <span className="text-[11px] font-bold tracking-widest uppercase text-neutral-400">
          Mostrar solo activas
        </span>
        <Toggle checked={activeOnly} onChange={setActiveOnly} />
      </div>

      {err ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 font-medium">
          {err}
        </div>
      ) : null}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-3xl border border-neutral-100 p-6 h-[220px]"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-neutral-100/50 rounded-[40px] p-20 text-center shadow-sm">
          <div className="inline-flex h-20 w-20 rounded-full bg-neutral-50 text-neutral-400 items-center justify-center mb-6">
            <Zap className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-black text-obsidian tracking-tight mb-2">
            Sin Rutinas
          </h3>
          <p className="text-sm font-medium text-neutral-400">
            Crea rutinas de Apertura o Cierre para estandarizar procesos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-[32px] p-6 border border-neutral-100 shadow-sm hover:shadow-xl hover:shadow-obsidian/5 hover:border-neutral-200 transition-all flex flex-col group relative overflow-hidden"
            >
              <div className="absolute top-4 right-4 z-10">
                <ActionMenu
                  actions={[
                    { label: "Ver rutina", icon: Eye, onClick: () => handleOpenDetail(r) },
                    { label: "Editar", icon: Edit2, onClick: () => openEdit(r) },
                    { label: "Duplicar", icon: Copy, onClick: () => handleDuplicate(r) },
                    { label: "Eliminar", icon: Trash2, onClick: () => handleDelete(r), danger: true },
                  ]}
                />
              </div>

              <div className="flex items-start justify-between gap-4 mb-4 pr-12">
                <div className="flex-1">
                  <h3 className="font-bold text-obsidian line-clamp-2 leading-tight">
                    {r.name}
                  </h3>
                  {r.description && (
                    <p className="text-xs text-neutral-400 mt-2 line-clamp-2">
                      {r.description}
                    </p>
                  )}
                </div>
                {!r.is_active && (
                  <span className="px-2 py-1 rounded-md bg-neutral-100 text-[9px] font-bold uppercase tracking-widest text-neutral-400 shrink-0">
                    Inactiva
                  </span>
                )}
              </div>

              <div className="bg-neutral-50/50 rounded-2xl p-4 mb-4 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
                    <Repeat className="h-3 w-3" /> Frecuencia
                  </span>
                  <span className="font-bold text-obsidian capitalize">
                    {r.recurrence}
                  </span>
                </div>
                {r.recurrence === "weekly" && (
                  <div className="flex justify-between items-start text-xs border-t border-neutral-100 pt-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 flex items-center gap-1.5 mt-0.5">
                      <Calendar className="h-3 w-3" /> Días
                    </span>
                    <span className="font-medium text-obsidian text-right max-w-[120px]">
                      {formatWeekdays(r.weekdays)}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-auto flex items-center justify-between pt-4 border-t border-neutral-50 border-dashed">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenDetail(r)}
                    className="h-11 px-4 rounded-xl bg-neutral-100 text-obsidian text-[10px] font-black uppercase tracking-widest hover:bg-neutral-200 flex items-center gap-2 transition-colors"
                  >
                    <Eye className="h-3 w-3" />
                    Ver Rutina
                  </button>
                  <button
                    onClick={() => openScheduleModal(r)}
                    title="Programar Rutina"
                    className="h-11 px-3 rounded-xl bg-obsidian text-white text-[10px] font-black uppercase tracking-widest hover:bg-gold hover:text-obsidian flex items-center gap-2 transition-colors"
                  >
                    <CalendarClock className="h-3 w-3" />
                    Programar
                  </button>
                </div>

                <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(r)}
                    title="Editar"
                    className="h-11 w-11 rounded-xl bg-neutral-50 border border-neutral-100 text-neutral-400 flex items-center justify-center hover:bg-white hover:text-obsidian hover:border-neutral-200 transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(r)}
                    title="Eliminar"
                    className="h-11 w-11 rounded-xl bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center hover:bg-rose-100 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {lastPage > 1 && (
        <div className="flex items-center justify-between bg-white border border-neutral-100 p-4 rounded-3xl shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">
            Página {page} / {lastPage}
          </div>
          <div className="flex gap-2">
            <button
              className="px-4 py-2 rounded-xl border border-neutral-200 text-xs font-bold text-obsidian hover:bg-neutral-50 transition disabled:opacity-30"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Anterior
            </button>
            <button
              className="px-4 py-2 rounded-xl border border-neutral-200 text-xs font-bold text-obsidian hover:bg-neutral-50 transition disabled:opacity-30"
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              disabled={page >= lastPage}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      <RoutineModal
        open={modalOpen}
        mode={modalMode}
        initial={selected}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />

      <RoutineScheduleModal
        open={scheduleModalOpen}
        onClose={() => {
          setScheduleModalOpen(false);
          setScheduleRoutine(null);
        }}
        routineId={scheduleRoutine?.id}
        routineName={scheduleRoutine?.name}
      />
    </div>
  );
}
