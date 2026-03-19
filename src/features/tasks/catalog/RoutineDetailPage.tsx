// src/features/tasks/catalog/RoutineDetailPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Badge, Button, Pill, formatWeekdays } from "./ui";
import AddTemplatesToRoutineModal from "./AddTemplatesToRoutineModal";
import AssignRoutineModal from "./AssignRoutineModal";
import type { Routine, RoutineItem, Template } from "./api";
import { addRoutineItems, assignRoutine, getRoutine, removeRoutineItem, listTemplates } from "./api";

export default function RoutineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [items, setItems] = useState<RoutineItem[]>([]);
  const [templatesMap, setTemplatesMap] = useState<Map<string, Template>>(new Map());

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  const alreadyTemplateIds = useMemo(() => new Set(items.map((i) => i.template_id)), [items]);

  async function load() {
    if (!id) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await getRoutine(id);
      setRoutine(res.item);
      setItems(res.items ?? []);

      // para mostrar títulos, cargamos templates activos (rápido: page 1 + search vacío)
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
    if (!confirm("¿Quitar este template de la rutina?")) return;
    try {
      await removeRoutineItem(id, itemId);
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "No pude quitar el item");
    }
  }

  async function handleAddTemplates(templateIds: string[]) {
    if (!id) return;
    await addRoutineItems(id, templateIds);
    await load();
  }

  async function handleAssign(payload: { date: string; empleado_ids: string[]; due_at?: string | null; allow_duplicate?: boolean }) {
    if (!id) return;
    const out = await assignRoutine(id, payload);
    // MVP feedback
    alert("Rutina asignada ✅");
    return out;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => nav("/app/manager/tareas")}>
            ← Rutinas
          </Button>
          <div>
            <div className="text-xl font-semibold">{routine?.name ?? "Rutina"}</div>
            <div className="text-sm text-black/60">
              {routine ? (
                <>
                  <Pill>{routine.recurrence}</Pill>{" "}
                  {routine.recurrence === "weekly" ? <span className="ml-2">{formatWeekdays(routine.weekdays)}</span> : null}
                  <span className="ml-2">{routine.is_active ? <Badge>Activa</Badge> : <span className="text-black/40">Inactiva</span>}</span>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setAddOpen(true)} disabled={!routine}>
            + Agregar templates
          </Button>
          <Button onClick={() => setAssignOpen(true)} disabled={!routine || items.length === 0}>
            Asignar rutina
          </Button>
        </div>
      </div>

      {err ? <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div> : null}

      <div className="overflow-hidden rounded-2xl border bg-white">
        <div className="grid grid-cols-12 border-b bg-black/[0.02] px-4 py-3 text-xs font-semibold text-black/60">
          <div className="col-span-1">Orden</div>
          <div className="col-span-7">Template</div>
          <div className="col-span-2">Priority</div>
          <div className="col-span-2 text-right">Acciones</div>
        </div>

        {loading ? (
          <div className="p-4 text-sm text-black/60">Cargando...</div>
        ) : items.length === 0 ? (
          <div className="p-4 text-sm text-black/60">
            Esta rutina no tiene templates. Agrégale unos y ya tienes “operación en piloto automático” (casi) 😄
          </div>
        ) : (
          items
            .slice()
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((it) => {
              const t = templatesMap.get(it.template_id);
              return (
                <div key={it.id} className="grid grid-cols-12 items-center border-b px-4 py-3 text-sm last:border-b-0">
                  <div className="col-span-1 text-black/60">{it.sort_order}</div>
                  <div className="col-span-7">
                    <div className="font-medium">{t?.title ?? it.template_id}</div>
                    {t?.description ? <div className="mt-0.5 line-clamp-1 text-xs text-black/60">{t.description}</div> : null}
                  </div>
                  <div className="col-span-2">{t?.priority ? <Pill>{t.priority}</Pill> : <span className="text-black/40">—</span>}</div>
                  <div className="col-span-2 flex justify-end">
                    <Button variant="danger" onClick={() => handleRemove(it.id)}>
                      Quitar
                    </Button>
                  </div>
                </div>
              );
            })
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
