// src/features/tasks/catalog/TemplatesPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Input, Pill, Toggle } from "./ui";
import TemplateModal from "./TemplateModal";
import type { Template } from "./api";
import { createTemplate, deleteTemplate, listTemplates, updateTemplate } from "./api";

function priorityLabel(p: string) {
  return p === "urgent" ? "Urgent" : p === "high" ? "High" : p === "low" ? "Low" : "Medium";
}

export default function TemplatesPage() {
  const [items, setItems] = useState<Template[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [activeOnly, setActiveOnly] = useState(true);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selected, setSelected] = useState<Template | null>(null);

  const params = useMemo(() => ({ page, active: activeOnly, search: search.trim() || undefined }), [page, activeOnly, search]);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await listTemplates(params);
      setItems(res.data ?? []);
      setLastPage((res as any)?.last_page ?? (res as any)?.meta?.last_page ?? 1);
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "No pude cargar templates");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, activeOnly]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load();
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function openCreate() {
    setSelected(null);
    setModalMode("create");
    setModalOpen(true);
  }

  function openEdit(t: Template) {
    setSelected(t);
    setModalMode("edit");
    setModalOpen(true);
  }

  async function handleSave(payload: Partial<Template>) {
    if (modalMode === "create") {
      await createTemplate(payload);
    } else if (selected) {
      await updateTemplate(selected.id, payload);
    }
    await load();
  }

  async function handleDelete(t: Template) {
    if (!confirm(`Eliminar template "${t.title}"?`)) return;
    try {
      await deleteTemplate(t.id);
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "No pude eliminar");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xl font-semibold">Templates</div>
          <div className="text-sm text-black/60">Tu “catálogo maestro” de tareas. Aquí nace todo.</div>
        </div>
        <Button onClick={openCreate}>+ Nuevo Template</Button>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border bg-white p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por título..." />
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-black/60">Solo activos</div>
          <Toggle checked={activeOnly} onChange={(v) => setActiveOnly(v)} />
        </div>
      </div>

      {err ? <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div> : null}

      <div className="overflow-hidden rounded-2xl border bg-white">
        <div className="grid grid-cols-12 border-b bg-black/[0.02] px-4 py-3 text-xs font-semibold text-black/60">
          <div className="col-span-5">Título</div>
          <div className="col-span-2">Prioridad</div>
          <div className="col-span-2">Min</div>
          <div className="col-span-1">Activo</div>
          <div className="col-span-2 text-right">Acciones</div>
        </div>

        {loading ? (
          <div className="p-4 text-sm text-black/60">Cargando...</div>
        ) : items.length === 0 ? (
          <div className="p-4 text-sm text-black/60">No hay templates (todavía). Crea el primero y empezamos a escalar 😄</div>
        ) : (
          items.map((t) => (
            <div key={t.id} className="grid grid-cols-12 items-center border-b px-4 py-3 text-sm last:border-b-0">
              <div className="col-span-5">
                <div className="font-medium">{t.title}</div>
                {t.description ? <div className="mt-0.5 line-clamp-1 text-xs text-black/60">{t.description}</div> : null}
              </div>
              <div className="col-span-2">
                <Pill>{priorityLabel(t.priority)}</Pill>
              </div>
              <div className="col-span-2">{t.estimated_minutes ?? <span className="text-black/40">—</span>}</div>
              <div className="col-span-1">{t.is_active ? <Badge>Yes</Badge> : <span className="text-black/40">No</span>}</div>
              <div className="col-span-2 flex justify-end gap-2">
                <Button variant="secondary" onClick={() => openEdit(t)}>
                  Editar
                </Button>
                <Button variant="danger" onClick={() => handleDelete(t)}>
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

      <TemplateModal
        open={modalOpen}
        mode={modalMode}
        initial={selected}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
