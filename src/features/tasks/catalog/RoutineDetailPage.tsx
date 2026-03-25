import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { formatWeekdays, Button } from "./ui";
import AddTemplatesToRoutineModal from "./AddTemplatesToRoutineModal";
import AssignRoutineModal from "./AssignRoutineModal";
import type { Routine, RoutineItem, Template } from "./api";
import {
  addRoutineItems,
  assignRoutine,
  getRoutine,
  removeRoutineItem,
  listTemplates,
} from "./api";
import {
  Calendar,
  Trash2,
  GripVertical,
  Repeat,
  ArrowLeft,
  Plus,
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

  const alreadyTemplateIds = useMemo(
    () => new Set(items.map((i) => i.template_id)),
    [items],
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
    </div>
  );
}
