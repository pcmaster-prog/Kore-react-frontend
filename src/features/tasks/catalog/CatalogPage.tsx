// src/features/tasks/catalog/CatalogPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Button, Input, Pill, toDateInputValue } from "./ui";
import type { CatalogItem } from "./api";
import { bulkCreateFromCatalog, getCatalog } from "./api";
import BulkAssignModal from "./BulkAssignModal";

export default function CatalogPage() {
  const [date, setDate] = useState(() => toDateInputValue(new Date()));
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set()); // template_id
  const [bulkOpen, setBulkOpen] = useState(false);

  const templateIds = useMemo(() => catalog.map((c) => c.template.id), [catalog]);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await getCatalog(date);
      setCatalog(res.catalog ?? []);
      // preselect todo (modo “default pro”)
      setSelected(new Set((res.catalog ?? []).map((c: any) => c.template.id)));
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "No pude cargar catálogo");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  function toggle(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function selectAll() {
    setSelected(new Set(templateIds));
  }
  function clearAll() {
    setSelected(new Set());
  }

  async function handleBulk(payload: { empleado_ids: string[]; due_at?: string | null; allow_duplicate?: boolean }) {
    const template_ids = Array.from(selected);
    const out = await bulkCreateFromCatalog({
      date,
      template_ids,
      empleado_ids: payload.empleado_ids,
      due_at: payload.due_at ?? null,
      allow_duplicate: payload.allow_duplicate ?? false,
    });
    alert("Tareas creadas / reutilizadas ✅");
    return out;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xl font-semibold">Catálogo del día</div>
          <div className="text-sm text-black/60">Selecciona tareas sugeridas por rutinas y asigna en bulk. Aquí es donde tu SaaS se ve caro 😄</div>
        </div>

        <div className="flex items-center gap-2">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-[170px]" />
          <Button onClick={() => setBulkOpen(true)} disabled={selected.size === 0}>
            Crear tareas ({selected.size})
          </Button>
        </div>
      </div>

      {err ? <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div> : null}

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border bg-white p-4">
        <div className="text-sm text-black/60">
          Seleccionadas: <span className="font-medium">{selected.size}</span> / {catalog.length}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={selectAll} disabled={catalog.length === 0}>
            Seleccionar todo
          </Button>
          <Button variant="secondary" onClick={clearAll} disabled={selected.size === 0}>
            Limpiar
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white">
        <div className="grid grid-cols-12 border-b bg-black/[0.02] px-4 py-3 text-xs font-semibold text-black/60">
          <div className="col-span-1">Sel</div>
          <div className="col-span-7">Template</div>
          <div className="col-span-2">Priority</div>
          <div className="col-span-2">Min</div>
        </div>

        {loading ? (
          <div className="p-4 text-sm text-black/60">Cargando...</div>
        ) : catalog.length === 0 ? (
          <div className="p-4 text-sm text-black/60">
            No hay catálogo para este día. Probablemente no hay rutinas activas aplicables o no tienen items.
          </div>
        ) : (
          catalog
            .slice()
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((c) => {
              const id = c.template.id;
              const on = selected.has(id);
              return (
                <button
                  key={c.routine_item_id}
                  type="button"
                  onClick={() => toggle(id)}
                  className="grid w-full grid-cols-12 items-center border-b px-4 py-3 text-left text-sm hover:bg-black/[0.02] last:border-b-0"
                >
                  <div className="col-span-1">
                    <span className={["inline-flex h-5 w-5 items-center justify-center rounded-md border text-xs", on ? "bg-black text-white" : ""].join(" ")}>
                      ✓
                    </span>
                  </div>
                  <div className="col-span-7">
                    <div className="font-medium">{c.template.title}</div>
                    {c.template.description ? <div className="mt-0.5 line-clamp-1 text-xs text-black/60">{c.template.description}</div> : null}
                  </div>
                  <div className="col-span-2">
                    <Pill>{c.template.priority}</Pill>
                  </div>
                  <div className="col-span-2">{c.template.estimated_minutes ?? <span className="text-black/40">—</span>}</div>
                </button>
              );
            })
        )}
      </div>

      <BulkAssignModal
        open={bulkOpen}
        date={date}
        templateCount={selected.size}
        onClose={() => setBulkOpen(false)}
        onConfirm={handleBulk}
      />
    </div>
  );
}
