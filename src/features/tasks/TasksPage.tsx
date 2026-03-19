// features/tasks/TasksPage.tsx
import { useEffect, useMemo, useState } from "react";
import {
  listTasks,
  updateTaskStatus,
  listPendingApprovals,
  approveAssignment,
  rejectAssignment,
  listTaskEvidences,
} from "./api";
// ✅ 1. Importar getTemplate
import { getTemplate } from "@/features/tasks/catalog/api";
import type { Task } from "./types";
import TaskCatalogPanel from "./TaskCatalogPanel";

// 🔥 2.1 StatusPill mejorado
function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    open: { label: "Open", cls: "bg-slate-50 text-slate-700 border-slate-200" },
    in_progress: { label: "In progress", cls: "bg-amber-50 text-amber-800 border-amber-200" },
    completed: { label: "Completed", cls: "bg-emerald-50 text-emerald-800 border-emerald-200" },

    assigned: { label: "Assigned", cls: "bg-slate-50 text-slate-700 border-slate-200" },
    done_pending: { label: "En revisión", cls: "bg-indigo-50 text-indigo-800 border-indigo-200" },
    approved: { label: "Aprobada", cls: "bg-emerald-50 text-emerald-800 border-emerald-200" },
    rejected: { label: "Rechazada", cls: "bg-rose-50 text-rose-800 border-rose-200" },
  };

  const x = map[status] ?? { label: status, cls: "bg-neutral-50 text-neutral-700 border-neutral-200" };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${x.cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
      {x.label}
    </span>
  );
}

// ✅ 1) isImage corregido: maneja null, mayúsculas, espacios
const isImage = (mime?: string | null) =>
  String(mime ?? "").toLowerCase().startsWith("image/");

export default function TasksPage() {
  // ===== Tabs =====
  const [tab, setTab] = useState<"tareas" | "aprobaciones">("tareas");

  // ===== TAREAS =====
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  // filtros
  const [status, setStatus] = useState<string>("");
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState<string>(today);
  const [search, setSearch] = useState<string>("");
  const [overdue, setOverdue] = useState(false);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<{ data: Task[]; total: number; last_page: number } | null>(null);

  // Estado para bloquear botones por tarea
  const [busyId, setBusyId] = useState<string | null>(null);

  const params = useMemo(() => {
    const p: Record<string, string | number | boolean> = { page, _r: reloadKey };
    if (status) p.status = status;
    if (date) p.date = date;
    if (search.trim()) p.search = search.trim();
    if (overdue) p.overdue = true;
    return p;
  }, [page, status, date, search, overdue, reloadKey]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await listTasks(params);
        if (!alive) return;
        setData({ data: res.data, total: res.total, last_page: res.last_page });
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.response?.data?.message ?? "Error cargando tareas");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [params]);

  useEffect(() => {
    setPage(1);
  }, [status, date, overdue, search]);

  async function quickSetStatus(taskId: string, next: "open" | "in_progress" | "completed") {
    setErr(null);
    setBusyId(taskId);
    try {
      await updateTaskStatus(taskId, next);
      const res = await listTasks(params);
      setData({ data: res.data, total: res.total, last_page: res.last_page });
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "No se pudo actualizar el status");
    } finally {
      setBusyId(null);
    }
  }

  // ===== APROBACIONES =====
  const [apPage, setApPage] = useState(1);
  const [apLoading, setApLoading] = useState(false);
  const [apErr, setApErr] = useState<string | null>(null);
  const [apData, setApData] = useState<{ data: any[]; total: number; last_page: number } | null>(null);

  // modal evidencias
  const [evOpen, setEvOpen] = useState(false);
  const [evLoading, setEvLoading] = useState(false);
  const [evErr, setEvErr] = useState<string | null>(null);
  const [evList, setEvList] = useState<any[] | null>(null);
  const [evAssignmentId, setEvAssignmentId] = useState<string | null>(null);
  const [evTaskId, setEvTaskId] = useState<string | null>(null);

  // ✅ Bug 3 — estado para el checklist del empleado
  const [evChecklist, setEvChecklist] = useState<{
    def: any[] | null;
    state: Record<string, { done: boolean; at?: string }> | null;
  } | null>(null);

  // 🔥 Estado global para nota de rechazo
  const [rejectNote, setRejectNote] = useState<string>("");
  const [actionBusy, setActionBusy] = useState<string | null>(null);

  // Cargar aprobaciones cuando cambia la pestaña o la página
  useEffect(() => {
    let alive = true;
    if (tab !== "aprobaciones") return;

    (async () => {
      setApLoading(true);
      setApErr(null);
      try {
        const res = await listPendingApprovals({ page: apPage });
        if (!alive) return;
        setApData(res);
      } catch (e: any) {
        if (!alive) return;
        setApErr(e?.response?.data?.message ?? "Error cargando aprobaciones");
      } finally {
        if (alive) setApLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [tab, apPage]);

  // ===== Helpers =====

  // ✅ 2. Función openEvidences modificada: carga template y construye checklist con labels
  async function openEvidences(assignmentId: string, taskId: string) {
    setEvOpen(true);
    setEvAssignmentId(assignmentId);
    setEvTaskId(taskId);
    setEvLoading(true);
    setEvErr(null);
    setEvList(null);
    setEvChecklist(null);
    setRejectNote("");

    try {
      const res = await listTaskEvidences(taskId);
      const filtered = (res.data ?? []).filter(
        (x: any) => x.task_assignee_id === assignmentId
      );
      setEvList(filtered);

      // Busca la asignación actual en la lista de aprobaciones
      const assignment = apData?.data?.find((a: any) => a.id === assignmentId);
      const checklistState = assignment?.meta?.checklist ?? null;
      const templateId = assignment?.task?.meta?.template_id;

      // ✅ Si hay template y estado de checklist, carga las definiciones con labels
      if (templateId && checklistState) {
        try {
          const tpl = await getTemplate(templateId);
          const instructions = tpl?.instructions;
          const def =
            instructions?.type === "checklist"
              ? (instructions.items ?? [])
              : [];

          setEvChecklist({ def, state: checklistState });
        } catch {
          // Fallback: muestra el checklist sin labels si falla la carga del template
          setEvChecklist({ def: [], state: checklistState });
        }
      }
    } catch (e: any) {
      setEvErr(e?.response?.data?.message ?? "No se pudieron cargar evidencias");
    } finally {
      setEvLoading(false);
    }
  }

  async function doApprove(assignmentId: string) {
    setActionBusy(assignmentId);
    setApErr(null);
    try {
      await approveAssignment(assignmentId);
      const res = await listPendingApprovals({ page: apPage });
      setApData(res);
      // Si el modal está abierto en esa asignación, refresca también
      if (evOpen && evAssignmentId === assignmentId && evTaskId) {
        const ev = await listTaskEvidences(evTaskId);
        setEvList((ev.data ?? []).filter((x: any) => x.task_assignee_id === assignmentId));
      }
      // Cierra modal si se aprueba desde ahí
      if (evOpen && evAssignmentId === assignmentId) {
        setEvOpen(false);
      }
    } catch (e: any) {
      setApErr(e?.response?.data?.message ?? "No se pudo aprobar");
    } finally {
      setActionBusy(null);
    }
  }

  async function doReject(assignmentId: string) {
    const note = rejectNote.trim();
    if (!note) {
      setApErr("Escribe una nota para rechazar.");
      return;
    }

    setActionBusy(assignmentId);
    setApErr(null);
    try {
      await rejectAssignment(assignmentId, note);
      setRejectNote(""); // limpia nota tras rechazo
      const res = await listPendingApprovals({ page: apPage });
      setApData(res);
      // Cierra modal si se rechaza desde ahí
      if (evOpen && evAssignmentId === assignmentId) {
        setEvOpen(false);
      }
    } catch (e: any) {
      setApErr(e?.response?.data?.message ?? "No se pudo rechazar");
    } finally {
      setActionBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* 🔥 2.3 Header tipo toolbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Tareas</h1>
          <p className="text-sm text-neutral-500">
            {tab === "tareas"
              ? "Gestiona tareas, catálogo y asignaciones."
              : "Revisa evidencias y aprueba entregas."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-2xl border bg-white px-3 py-2 text-sm text-neutral-600 shadow-sm">
            {tab === "tareas" ? (data?.total ?? 0) : (apData?.total ?? 0)}{" "}
            <span className="text-neutral-400">items</span>
          </div>
        </div>
      </div>

      {/* 🔥 2.2 Tabs tipo segmented */}
      <div className="inline-flex rounded-2xl border bg-white p-1 shadow-sm">
        <button
          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
            tab === "tareas" ? "bg-neutral-900 text-white shadow" : "text-neutral-700 hover:bg-neutral-50"
          }`}
          onClick={() => setTab("tareas")}
        >
          Tareas
        </button>
        <button
          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
            tab === "aprobaciones" ? "bg-neutral-900 text-white shadow" : "text-neutral-700 hover:bg-neutral-50"
          }`}
          onClick={() => setTab("aprobaciones")}
        >
          Aprobaciones
        </button>
      </div>

      {tab === "tareas" ? (
        <>
          <TaskCatalogPanel
            onAssigned={() => {
              setPage(1);
              setReloadKey((k) => k + 1);
            }}
          />

          {/* 🔥 2.4 Filtros premium */}
          <div className="bg-white border rounded-2xl p-4 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <label className="block">
                <span className="text-xs text-neutral-500">Status</span>
                <select
                  className="mt-1 w-full rounded-xl border bg-white p-2 focus:outline-none focus:ring-2 focus:ring-neutral-200"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="">Todos</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In progress</option>
                  <option value="completed">Completed</option>
                </select>
              </label>

              <label className="block">
                <span className="text-xs text-neutral-500">Fecha (catálogo)</span>
                <input
                  className="mt-1 w-full rounded-xl border bg-white p-2 focus:outline-none focus:ring-2 focus:ring-neutral-200"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </label>

              <label className="block md:col-span-2">
                <span className="text-xs text-neutral-500">Buscar (título)</span>
                <input
                  className="mt-1 w-full rounded-xl border bg-white p-2 focus:outline-none focus:ring-2 focus:ring-neutral-200"
                  placeholder="Ej. Limpieza mostrador"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setPage(1);
                  }}
                />
              </label>

              <label className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={overdue}
                  onChange={(e) => setOverdue(e.target.checked)}
                />
                <span className="text-sm">Solo vencidas</span>
              </label>
            </div>

            <div className="mt-3 flex gap-2">
              <button
                className="rounded-xl border px-3 py-2 text-sm hover:bg-neutral-100"
                onClick={() => {
                  setStatus("");
                  setDate(today);
                  setSearch("");
                  setOverdue(false);
                  setPage(1);
                }}
              >
                Limpiar filtros
              </button>
            </div>
          </div>

          {/* tabla */}
          <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="text-sm text-neutral-600">
                {loading ? "Cargando..." : err ? "Error" : "Resultados"}
              </div>
            </div>

            {err && <div className="p-4 text-sm text-red-600">{err}</div>}

            {!err && !loading && data?.data?.length === 0 && (
              <div className="p-6 text-sm text-neutral-500">No hay tareas con esos filtros.</div>
            )}

            {!err && data?.data?.length ? (
              <div className="w-full overflow-auto">
                <table className="w-full text-sm">
                  {/* 🔥 2.5 Encabezado sticky */}
                  <thead className="bg-neutral-50 text-neutral-600 sticky top-0 z-10">
                    <tr>
                      <th className="text-left p-3">Título</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Prioridad</th>
                      <th className="text-left p-3">Fecha catálogo</th>
                      <th className="text-left p-3">Due</th>
                      <th className="text-left p-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.map((t) => (
                      <tr key={t.id} className="border-t hover:bg-neutral-50/60 transition">
                        <td className="p-3">
                          <div className="font-medium">{t.title}</div>
                          {t.description ? (
                            <div className="text-xs text-neutral-500 line-clamp-1">{t.description}</div>
                          ) : null}
                        </td>
                        <td className="p-3"><StatusPill status={t.status} /></td>
                        <td className="p-3">{t.priority ?? "-"}</td>
                        <td className="p-3">{t.meta?.catalog_date ?? "-"}</td>
                        <td className="p-3">{t.due_at ? new Date(t.due_at).toLocaleString() : "-"}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <button
                              className="rounded-xl border bg-white px-3 py-2 text-xs font-medium hover:bg-neutral-50 disabled:opacity-50"
                              disabled={busyId === t.id || t.status === "in_progress"}
                              onClick={() => quickSetStatus(t.id, "in_progress")}
                            >
                              {busyId === t.id ? "..." : "▶ Iniciar"}
                            </button>

                            <button
                              className="rounded-xl border bg-white px-3 py-2 text-xs font-medium hover:bg-neutral-50 disabled:opacity-50"
                              disabled={busyId === t.id || t.status === "completed"}
                              onClick={() => quickSetStatus(t.id, "completed")}
                            >
                              {busyId === t.id ? "..." : "✅ Completar"}
                            </button>

                            <button
                              className="rounded-xl border bg-white px-3 py-2 text-xs font-medium hover:bg-neutral-50 disabled:opacity-50"
                              disabled={busyId === t.id || t.status === "open"}
                              onClick={() => quickSetStatus(t.id, "open")}
                              title="Reabrir"
                            >
                              {busyId === t.id ? "..." : "↩ Open"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            {/* paginación */}
            {data && data.last_page > 1 && (
              <div className="p-4 border-t flex items-center justify-between">
                <button
                  className="rounded-xl border px-3 py-2 text-sm disabled:opacity-50"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </button>
                <div className="text-sm text-neutral-600">
                  Página {page} de {data.last_page}
                </div>
                <button
                  className="rounded-xl border px-3 py-2 text-sm disabled:opacity-50"
                  disabled={page >= data.last_page}
                  onClick={() => setPage((p) => Math.min(data.last_page, p + 1))}
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        // Panel de Aprobaciones
        <div className="rounded-3xl border bg-white overflow-hidden">
          <div className="p-4 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <div className="text-sm text-neutral-600">
                {apLoading ? "Cargando aprobaciones..." : apErr ? "Error" : "Pendientes de aprobación"}
              </div>
              <div className="text-xs text-neutral-500 mt-1">
                Revisa evidencia y valida que esté bien antes de aprobar.
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="rounded-2xl border bg-white px-3 py-2 text-sm">
                <span className="text-neutral-500">Total:</span>{" "}
                <span className="font-semibold">{apData?.total ?? 0}</span>
              </div>

              <button
                className="rounded-2xl border px-3 py-2 text-sm hover:bg-neutral-50"
                onClick={() => setApPage(1)}
              >
                ↻ Refrescar
              </button>
            </div>
          </div>

          {apErr ? (
            <div className="p-4">
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                {apErr}
              </div>
            </div>
          ) : null}

          {!apErr && !apLoading && (apData?.data?.length ?? 0) === 0 ? (
            <div className="p-8 text-sm text-neutral-500">
              No hay tareas por aprobar. (Momento perfecto para un café ☕)
            </div>
          ) : null}

          {!apErr && apData?.data?.length ? (
            <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
              {apData.data.map((a: any) => {
                const when = a.done_at ? new Date(a.done_at).toLocaleString() : null;

                return (
                  <div key={a.id} className="rounded-3xl border bg-white p-4 hover:shadow-sm transition">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="font-semibold truncate">
                            {a.task?.title ?? a.task_id}
                          </div>
                          <span className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs bg-amber-50 text-amber-900 border-amber-200">
                            En revisión
                          </span>
                        </div>

                        <div className="text-xs text-neutral-500 mt-2">
                          Empleado:{" "}
                          <span className="font-medium text-neutral-700">
                            {a.empleado?.full_name ?? a.empleado?.nombre ?? a.empleado_id}
                          </span>
                          {when ? <span className="text-neutral-400"> · Entregada: {when}</span> : null}
                        </div>

                        {a.note ? (
                          <div className="mt-3 rounded-2xl border bg-neutral-50 p-3 text-sm text-neutral-700">
                            <div className="text-xs text-neutral-500 mb-1">Nota del empleado</div>
                            <div className="whitespace-pre-wrap">{a.note}</div>
                          </div>
                        ) : (
                          <div className="mt-3 text-sm text-neutral-400">Sin nota del empleado.</div>
                        )}
                      </div>

                      <button
                        className="rounded-2xl border px-3 py-2 text-sm hover:bg-neutral-50"
                        onClick={() => openEvidences(a.id, a.task_id)}
                      >
                        📎 Evidencias
                      </button>
                    </div>

                    <div className="mt-4 flex flex-col md:flex-row gap-2">
                      <button
                        className="rounded-2xl bg-neutral-900 text-white px-3 py-2 text-sm hover:bg-neutral-800 disabled:opacity-50"
                        disabled={actionBusy === a.id}
                        onClick={() => doApprove(a.id)}
                      >
                        {actionBusy === a.id ? "Aprobando..." : "✅ Aprobar"}
                      </button>

                      <button
                        className="rounded-2xl border px-3 py-2 text-sm hover:bg-neutral-50 disabled:opacity-50"
                        disabled={actionBusy === a.id}
                        onClick={() => {
                          openEvidences(a.id, a.task_id);
                          setRejectNote("");
                        }}
                      >
                        👀 Revisar antes
                      </button>

                      <button
                        className="rounded-2xl border px-3 py-2 text-sm hover:bg-neutral-50 disabled:opacity-50"
                        disabled={actionBusy === a.id}
                        onClick={() => openEvidences(a.id, a.task_id)}
                      >
                        ✍️ Rechazar (ver evidencias)
                      </button>
                    </div>

                    <div className="mt-3 text-xs text-neutral-400">
                      Tip: Revisa evidencia y que el trabajo esté OK antes de aprobar (cero "operación con fe").
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          {apData && apData.last_page > 1 ? (
            <div className="p-4 border-t flex items-center justify-between">
              <button
                className="rounded-2xl border px-3 py-2 text-sm disabled:opacity-50 hover:bg-neutral-50"
                disabled={apPage <= 1}
                onClick={() => setApPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </button>
              <div className="text-sm text-neutral-600">
                Página {apPage} de {apData.last_page}
              </div>
              <button
                className="rounded-2xl border px-3 py-2 text-sm disabled:opacity-50 hover:bg-neutral-50"
                disabled={apPage >= apData.last_page}
                onClick={() => setApPage((p) => Math.min(apData.last_page, p + 1))}
              >
                Siguiente
              </button>
            </div>
          ) : null}
        </div>
      )}

      {/* Modal de evidencias */}
      {evOpen ? (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl bg-white rounded-2xl border overflow-hidden shadow-xl">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="font-medium">Evidencias</div>
              <button
                className="rounded-xl border bg-white px-3 py-2 text-sm font-medium hover:bg-neutral-50"
                onClick={() => {
                  setEvOpen(false);
                  setEvList(null);
                  setEvErr(null);
                  setEvChecklist(null);
                  setRejectNote("");
                }}
              >
                Cerrar
              </button>
            </div>

            <div className="p-4">
              {evLoading ? <div className="text-sm text-neutral-600">Cargando...</div> : null}
              {evErr ? <div className="text-sm text-red-600">{evErr}</div> : null}

              {!evLoading && !evErr && (evList?.length ?? 0) === 0 ? (
                <div className="text-sm text-neutral-500">No hay evidencias ligadas a esta asignación.</div>
              ) : null}

              {!evLoading && !evErr && evList?.length ? (
                <div className="space-y-3">
                  {evList.map((e: any) => (
                    <div key={e.id} className="flex items-start gap-3 border rounded-xl p-3">
                      {e.url ? (
                        <div className="flex items-center gap-2">
                          <a
                            className="text-sm text-blue-600 hover:underline"
                            href={e.url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(ev) => ev.stopPropagation()}
                          >
                            Abrir
                          </a>

                          {isImage(e.mime) ? (
                            <a
                              href={e.url}
                              target="_blank"
                              rel="noreferrer"
                              className="block"
                              onClick={(ev) => ev.stopPropagation()}
                            >
                              <img
                                src={e.url}
                                alt={e.original_name ?? "evidence"}
                                className="h-14 w-14 rounded-xl border object-cover"
                                onError={(ev) => {
                                  (ev.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56'%3E%3Crect width='56' height='56' fill='%23f5f5f5'/%3E%3Ctext x='50%25' y='55%25' text-anchor='middle' fill='%23999' font-size='12'%3E📷%3C/text%3E%3C/svg%3E";
                                  (ev.target as HTMLImageElement).alt = "Imagen no disponible";
                                }}
                              />
                            </a>
                          ) : String(e.mime ?? "").includes("pdf") ? (
                            <a
                              href={e.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs rounded-xl border px-2 py-1 hover:bg-neutral-50"
                            >
                              Ver PDF
                            </a>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-xs text-neutral-400">Sin URL</span>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{e.original_name ?? e.id}</div>
                        <div className="text-xs text-neutral-500">
                          {e.mime ?? "-"} ·{" "}
                          {e.created_at ? new Date(e.created_at).toLocaleString() : ""}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {/* ✅ 3. Render del checklist con labels, required/optional y timestamp */}
              {evChecklist?.state && Object.keys(evChecklist.state).length > 0 ? (
                <div className="mt-4 border-t pt-4">
                  <div className="text-sm font-medium mb-2">Checklist del empleado</div>
                  <div className="space-y-2">
                    {Object.entries(evChecklist.state).map(([itemId, val]: [string, any]) => {
                      // ✅ Busca la definición en el template para obtener label y required
                      const defItem = evChecklist.def?.find((d: any) => d.id === itemId);
                      const label = defItem?.label ?? itemId; // fallback al ID si no hay label
                      const required = defItem?.required ?? false;

                      return (
                        <div
                          key={itemId}
                          className={`flex items-center gap-3 rounded-xl border p-3 ${
                            val.done
                              ? "bg-emerald-50 border-emerald-200"
                              : "bg-neutral-50 border-neutral-200"
                          }`}
                        >
                          <span className="text-lg">{val.done ? "✅" : "⬜"}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {label}
                              {required ? (
                                <span className="ml-2 text-xs text-rose-500">(requerido)</span>
                              ) : (
                                <span className="ml-2 text-xs text-neutral-400">(opcional)</span>
                              )}
                            </div>
                            {val.at ? (
                              <div className="text-xs text-neutral-500">
                                {new Date(val.at).toLocaleString()}
                              </div>
                            ) : null}
                          </div>
                          <span className={`text-xs rounded-full px-2 py-1 border flex-shrink-0 ${
                            val.done
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-neutral-100 text-neutral-600 border-neutral-300"
                          }`}>
                            {val.done ? "Hecho" : "Pendiente"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {/* 🔥 Decisión dentro del modal */}
              <div className="mt-4 border-t pt-4">
                <div className="text-sm font-medium">Decisión</div>
                <div className="text-xs text-neutral-500 mt-1">
                  Aprueba si la evidencia es correcta. Rechaza con motivo si falta algo.
                </div>

                <div className="mt-3 flex flex-col md:flex-row gap-2">
                  <button
                    className="rounded-2xl bg-neutral-900 text-white px-3 py-2 text-sm hover:bg-neutral-800 disabled:opacity-50"
                    disabled={!evAssignmentId || actionBusy === evAssignmentId}
                    onClick={() => evAssignmentId && doApprove(evAssignmentId)}
                  >
                    {evAssignmentId && actionBusy === evAssignmentId ? "Aprobando..." : "✅ Aprobar"}
                  </button>

                  <input
                    className="rounded-2xl border px-3 py-2 text-sm w-full"
                    placeholder="Motivo del rechazo..."
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                  />

                  <button
                    className="rounded-2xl border px-3 py-2 text-sm hover:bg-neutral-50 disabled:opacity-50"
                    disabled={!evAssignmentId || actionBusy === evAssignmentId}
                    onClick={() => evAssignmentId && doReject(evAssignmentId)}
                  >
                    {evAssignmentId && actionBusy === evAssignmentId ? "Rechazando..." : "❌ Rechazar"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}