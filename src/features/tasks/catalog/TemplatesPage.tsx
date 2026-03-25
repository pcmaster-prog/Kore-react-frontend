import { useEffect, useMemo, useState } from "react";
import { Toggle } from "./ui";
import TemplateModal from "./TemplateModal";
import type { Template } from "./api";
import {
  createTemplate,
  deleteTemplate,
  listTemplates,
  updateTemplate,
} from "./api";
import { Clock, Plus, Search, Edit2, Trash2, BookTemplate } from "lucide-react";

function priorityLabel(p: string) {
  return p === "urgent"
    ? "Urgente"
    : p === "high"
      ? "Alta"
      : p === "low"
        ? "Baja"
        : "Media";
}

function PriorityBadge({ p }: { p: string }) {
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

  const params = useMemo(
    () => ({ page, active: activeOnly, search: search.trim() || undefined }),
    [page, activeOnly, search],
  );

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await listTemplates(params);
      setItems(res.data ?? []);
      setLastPage(
        (res as any)?.last_page ?? (res as any)?.meta?.last_page ?? 1,
      );
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "No pude cargar plantillas");
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
    if (!confirm(`¿Eliminar plantilla "${t.title}"?`)) return;
    try {
      await deleteTemplate(t.id);
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "No pude eliminar");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-obsidian tracking-tight">
            Plantillas
          </h2>
          <p className="text-sm text-neutral-400 mt-1">
            El catálogo maestro de tareas recurrentes para tu equipo.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="h-11 px-5 rounded-2xl bg-obsidian text-sm font-bold text-white shadow-sm hover:bg-gold transition-all flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nueva Plantilla
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-neutral-100 p-4 rounded-3xl shadow-sm">
        <div className="flex-1 max-w-sm relative">
          <Search className="h-4 w-4 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-obsidian/10 transition-shadow"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título..."
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold tracking-widest uppercase text-neutral-400">
            Solo activas
          </span>
          <Toggle checked={activeOnly} onChange={setActiveOnly} />
        </div>
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
              className="bg-white rounded-3xl border border-neutral-100 p-6 h-[200px]"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-neutral-100/50 rounded-[40px] p-20 text-center shadow-sm">
          <div className="inline-flex h-20 w-20 rounded-full bg-neutral-50 text-neutral-400 items-center justify-center mb-6">
            <BookTemplate className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-black text-obsidian tracking-tight mb-2">
            Sin plantillas
          </h3>
          <p className="text-sm font-medium text-neutral-400">
            Crea la primera plantilla para agilizar tu operación.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-[32px] p-6 border border-neutral-100 shadow-sm hover:shadow-xl hover:shadow-obsidian/5 hover:border-neutral-200 transition-all flex flex-col group relative overflow-hidden"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-obsidian line-clamp-2 leading-tight">
                    {t.title}
                  </h3>
                  {t.description && (
                    <p className="text-xs text-neutral-400 mt-2 line-clamp-2">
                      {t.description}
                    </p>
                  )}
                </div>
                {!t.is_active && (
                  <span className="px-2 py-1 rounded-md bg-neutral-100 text-[9px] font-bold uppercase tracking-widest text-neutral-400 shrink-0">
                    Inactiva
                  </span>
                )}
              </div>

              <div className="mt-auto flex items-center justify-between pt-4 border-t border-neutral-50">
                <div className="flex items-center gap-3">
                  <PriorityBadge p={t.priority} />
                  <span className="flex items-center gap-1 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                    <Clock className="h-3 w-3" />
                    {t.estimated_minutes ? `${t.estimated_minutes}M` : "N/A"}
                  </span>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(t)}
                    title="Editar"
                    className="h-8 w-8 rounded-xl bg-neutral-50 border border-neutral-100 text-neutral-400 flex items-center justify-center hover:bg-white hover:text-obsidian hover:border-neutral-200 transition-colors"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(t)}
                    title="Eliminar"
                    className="h-8 w-8 rounded-xl bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center hover:bg-rose-100 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
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
