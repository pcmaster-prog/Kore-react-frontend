//features/tasks/catalog/RoutinesPage.tsx
import { useEffect, useState } from "react";
import { Badge, Button, Pill, Toggle, formatWeekdays } from "./ui";
import RoutineModal from "./RoutineModal";
import type { Routine } from "./api";
import { createRoutine, deleteRoutine, listRoutines, updateRoutine } from "./api";

export default function RoutinesPage({
  onOpenDetail,
}: {
  onOpenDetail: (routineId: string) => void; // lo conectas a tu router
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

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await listRoutines({ page, active: activeOnly });
      setItems(res.data ?? []);
      setLastPage((res as any)?.last_page ?? (res as any)?.meta?.last_page ?? 1);
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
    if (!confirm(`Eliminar rutina "${r.name}"?`)) return;
    try {
      await deleteRoutine(r.id);
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "No pude eliminar");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xl font-semibold">Rutinas</div>
          <div className="text-sm text-black/60">La “mecánica” del sistema. Aquí vive tu automatización operativa.</div>
        </div>
        <Button onClick={openCreate}>+ Nueva Rutina</Button>
      </div>

      <div className="flex items-center justify-between rounded-2xl border bg-white p-4">
        <div className="text-sm text-black/60">Solo activas</div>
        <Toggle checked={activeOnly} onChange={setActiveOnly} />
      </div>

      {err ? <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div> : null}

      <div className="overflow-hidden rounded-2xl border bg-white">
        <div className="grid grid-cols-12 border-b bg-black/[0.02] px-4 py-3 text-xs font-semibold text-black/60">
          <div className="col-span-4">Nombre</div>
          <div className="col-span-2">Recurrencia</div>
          <div className="col-span-3">Días</div>
          <div className="col-span-1">Activa</div>
          <div className="col-span-2 text-right">Acciones</div>
        </div>

        {loading ? (
          <div className="p-4 text-sm text-black/60">Cargando...</div>
        ) : items.length === 0 ? (
          <div className="p-4 text-sm text-black/60">No hay rutinas todavía. Crea una (Apertura/Cierre) y te sube el valor del SaaS solito 😄</div>
        ) : (
          items.map((r) => (
            <div key={r.id} className="grid grid-cols-12 items-center border-b px-4 py-3 text-sm last:border-b-0">
              <div className="col-span-4">
                <div className="font-medium">{r.name}</div>
                {r.description ? <div className="mt-0.5 line-clamp-1 text-xs text-black/60">{r.description}</div> : null}
              </div>
              <div className="col-span-2">
                <Pill>{r.recurrence}</Pill>
              </div>
              <div className="col-span-3">{r.recurrence === "weekly" ? formatWeekdays(r.weekdays) : <span className="text-black/40">—</span>}</div>
              <div className="col-span-1">{r.is_active ? <Badge>Yes</Badge> : <span className="text-black/40">No</span>}</div>
              <div className="col-span-2 flex justify-end gap-2">
                <Button variant="secondary" onClick={() => onOpenDetail(r.id)}>
                  Ver
                </Button>
                <Button variant="secondary" onClick={() => openEdit(r)}>
                  Editar
                </Button>
                <Button variant="danger" onClick={() => handleDelete(r)}>
                  Eliminar
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-black/60">
          Página {page} / {lastPage}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
            ←
          </Button>
          <Button variant="secondary" onClick={() => setPage((p) => Math.min(lastPage, p + 1))} disabled={page >= lastPage}>
            →
          </Button>
        </div>
      </div>

      <RoutineModal open={modalOpen} mode={modalMode} initial={selected} onClose={() => setModalOpen(false)} onSave={handleSave} />
    </div>
  );
}
