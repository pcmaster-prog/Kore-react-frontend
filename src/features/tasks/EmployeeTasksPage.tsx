//features/tasks/EmployeeTasksPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  listMyAssignments,
  updateMyAssignment,
  type MyAssignmentRow as EmployeeAssignmentItem,
  uploadEvidence,
  attachEvidenceToMyAssignment,
  updateMyChecklistItem,
  type ChecklistItem,
  type ChecklistState,
} from "./api";

function cx(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(" ");
}

// ✅ Actualizado: incluye approved y rejected
function StatusPill({ s }: { s: string }) {
  const meta =
    s === "assigned"
      ? { label: "Asignada", cls: "bg-neutral-50 text-neutral-700 border-neutral-200" }
      : s === "in_progress"
      ? { label: "En progreso", cls: "bg-blue-50 text-blue-800 border-blue-200" }
      : s === "done_pending"
      ? { label: "En revisión", cls: "bg-amber-50 text-amber-900 border-amber-200" }
      : s === "approved"
      ? { label: "Aprobada", cls: "bg-emerald-50 text-emerald-800 border-emerald-200" }
      : s === "rejected"
      ? { label: "Rechazada", cls: "bg-rose-50 text-rose-800 border-rose-200" }
      : { label: s, cls: "bg-neutral-50 text-neutral-700 border-neutral-200" };

  return <span className={cx("inline-flex items-center rounded-full border px-2.5 py-1 text-xs", meta.cls)}>{meta.label}</span>;
}

function PriorityPill({ p }: { p?: string | null }) {
  const key = (p ?? "medium").toLowerCase();
  const meta =
    key === "urgent"
      ? { label: "Urgente", cls: "bg-rose-50 text-rose-800 border-rose-200" }
      : key === "high"
      ? { label: "Alta", cls: "bg-orange-50 text-orange-800 border-orange-200" }
      : key === "low"
      ? { label: "Baja", cls: "bg-neutral-50 text-neutral-700 border-neutral-200" }
      : { label: "Media", cls: "bg-indigo-50 text-indigo-800 border-indigo-200" };

  return <span className={cx("inline-flex items-center rounded-full border px-2.5 py-1 text-xs", meta.cls)}>{meta.label}</span>;
}

// ✅ Componente inline para subir evidencia (ahora llama a refresh tras subir)
function EvidenceInlineUploader({
  assignmentId,
  taskId,
  onUploadSuccess,
}: {
  assignmentId: string;
  taskId: string;
  onUploadSuccess?: () => void;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function pick() {
    setErr(null);
    setMsg(null);
    fileRef.current?.click();
  }

  async function onFileChange(f: File | null) {
    if (!f) return;

    setBusy(true);
    setErr(null);
    setMsg(null);

    try {
      const up = await uploadEvidence(f, {
        source: "employee_tasks",
        task_id: taskId,
        assignment_id: assignmentId,
      });

      await attachEvidenceToMyAssignment(assignmentId, up.item.id);

      setMsg("Evidencia subida ✅");
      onUploadSuccess?.();
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "No se pudo subir la evidencia");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        accept="image/*,application/pdf"
        onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
      />

      <button
        type="button"
        onClick={pick}
        disabled={busy}
        className={cx(
          "rounded-2xl px-3 py-2 text-sm font-medium border transition",
          busy ? "opacity-60 cursor-not-allowed" : "hover:bg-neutral-50",
          "bg-white"
        )}
      >
        {busy ? "Subiendo..." : "📎 Evidencia"}
      </button>

      {err ? <div className="text-xs text-rose-600">{err}</div> : null}
      {msg ? <div className="text-xs text-emerald-700">{msg}</div> : null}
    </div>
  );
}

// ✅ NUEVO: Componente Checklist Inline (versión completa)
function ChecklistInline({
  items,
  state,
  disabled,
  onChange,
}: {
  assignmentId: string;
  items: ChecklistItem[];
  state: ChecklistState | null | undefined;
  disabled?: boolean;
  onChange: (itemId: string, done: boolean) => void;
}) {
  if (!items?.length) return null;

  return (
    <div className="space-y-2">
      {items.map((it) => {
        const done = !!state?.[it.id]?.done;
        const updatedAt = state?.[it.id]?.at;

        return (
          <label
            key={it.id}
            className={cx(
              "flex items-start gap-3 rounded-2xl border p-3 transition",
              disabled ? "opacity-70" : "hover:bg-neutral-50",
              done ? "bg-emerald-50 border-emerald-200" : "bg-white"
            )}
          >
            <input
              type="checkbox"
              className="mt-1 h-4 w-4"
              checked={done}
              disabled={disabled}
              onChange={(e) => onChange(it.id, e.target.checked)}
            />

            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-neutral-900">
                {it.label}{" "}
                {it.required ? (
                  <span className="ml-1 text-xs text-rose-600">(requerido)</span>
                ) : (
                  <span className="ml-1 text-xs text-neutral-400">(opcional)</span>
                )}
              </div>

              {updatedAt ? (
                <div className="text-xs text-neutral-500 mt-1">
                  Actualizado: {new Date(updatedAt).toLocaleString()}
                </div>
              ) : null}
            </div>

            <span
              className={cx(
                "text-xs rounded-full px-2.5 py-1 border",
                done
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-neutral-50 text-neutral-700 border-neutral-200"
              )}
            >
              {done ? "Hecho" : "Pendiente"}
            </span>
          </label>
        );
      })}
    </div>
  );
}

// ✅ NUEVO: Componente Acordeón para Checklist (CORREGIDO - sin assignmentId)
function ChecklistAccordion({
  titleRight,
  isOpen,
  onToggle,
  children,
}: {
  titleRight?: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4 rounded-3xl border bg-white overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 p-4 hover:bg-neutral-50 transition"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">Checklist</span>
          <span className="text-xs text-neutral-500">(palomea y listo)</span>
        </div>

        <div className="flex items-center gap-2">
          {titleRight}
          <span className="text-xs text-neutral-600">{isOpen ? "▲" : "▼"}</span>
        </div>
      </button>

      {isOpen ? <div className="px-4 pb-4">{children}</div> : null}
    </div>
  );
}

export default function EmployeeTasksPage() {
  const today = new Date().toISOString().slice(0, 10);

  const [page, setPage] = useState(1);
  const [date, setDate] = useState(today);
  const [status, setStatus] = useState<string>("assigned,in_progress,done_pending");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<{ data: EmployeeAssignmentItem[]; total: number; last_page: number } | null>(null);

  const [busyId, setBusyId] = useState<string | null>(null);
  
  // ✅ NUEVO: Estado para abrir/cerrar checklist por asignación
  const [openChecklist, setOpenChecklist] = useState<Record<string, boolean>>({});
  const toggleOpen = (assignmentId: string) =>
    setOpenChecklist((p) => ({ ...p, [assignmentId]: !p[assignmentId] }));
  
  // ✅ NUEVO: Estado local para optimistic UI del checklist
  const [checklistLocal, setChecklistLocal] = useState<Record<string, any>>({});

  const params = useMemo(() => {
    const p: any = { page, date };
    if (status) p.status = status;
    if (search.trim()) p.search = search.trim();
    return p;
  }, [page, date, status, search]);

  async function refresh() {
    setLoading(true);
    setErr(null);
    try {
      const res = await listMyAssignments(params);
      setData(res);
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "Error cargando mis tareas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await listMyAssignments(params);
        if (!alive) return;
        setData(res);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.response?.data?.message ?? "Error cargando mis tareas");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [params]);

  // ✅ KPI actualizado
  const kpi = useMemo(() => {
    const list = data?.data ?? [];
    const counts = { assigned: 0, in_progress: 0, done_pending: 0, approved: 0, rejected: 0 };
    for (const it of list) {
      const s = it.assignment.status as keyof typeof counts;
      if (counts[s] !== undefined) counts[s] += 1;
    }
    return counts;
  }, [data]);

  async function setAssignmentStatus(item: EmployeeAssignmentItem, next: "assigned" | "in_progress" | "done_pending") {
    setErr(null);
    setBusyId(item.assignment.id);
    try {
      await updateMyAssignment(item.assignment.id, { status: next });
      await refresh();
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "No se pudo actualizar la tarea");
    } finally {
      setBusyId(null);
    }
  }

  // ✅ NUEVO: Toggle checklist con optimistic UI
  async function toggleChecklist(assignmentId: string, itemId: string, done: boolean) {
    setErr(null);

    // Optimistic update
    setChecklistLocal((prev) => ({
      ...prev,
      [assignmentId]: {
        ...(prev[assignmentId] ?? {}),
        [itemId]: { done, at: new Date().toISOString() },
      },
    }));

    try {
      await updateMyChecklistItem(assignmentId, { item_id: itemId, done });
      await refresh();
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "No se pudo actualizar el checklist");
      await refresh();
    }
  }

  // ✅ ACTUALIZADO: Valida evidencia + checklist requerido
  const canSubmit = (it: EmployeeAssignmentItem) => {
    const a = it.assignment;

    const hasEvidence = !!a.has_evidence;

    const progress = it.checklist_progress;
    const checklistOk = progress ? progress.required_done >= progress.required_total : true;

    return hasEvidence && checklistOk;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mis tareas</h1>
          <div className="text-sm text-neutral-500 mt-1">
            Gestiona tu día: checklist → evidencia → envío a revisión → aprobación.
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-2xl border bg-white px-3 py-2 text-sm">
            <span className="text-neutral-500">Total:</span>{" "}
            <span className="font-semibold">{data?.total ?? 0}</span>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="rounded-3xl border bg-white p-4">
          <div className="text-xs text-neutral-500">Asignadas</div>
          <div className="text-2xl font-semibold">{kpi.assigned}</div>
        </div>
        <div className="rounded-3xl border bg-white p-4">
          <div className="text-xs text-neutral-500">En progreso</div>
          <div className="text-2xl font-semibold">{kpi.in_progress}</div>
        </div>
        <div className="rounded-3xl border bg-white p-4">
          <div className="text-xs text-neutral-500">En revisión</div>
          <div className="text-2xl font-semibold">{kpi.done_pending}</div>
        </div>
        <div className="rounded-3xl border bg-white p-4">
          <div className="text-xs text-neutral-500">Aprobadas</div>
          <div className="text-2xl font-semibold">{kpi.approved}</div>
        </div>
        <div className="rounded-3xl border bg-white p-4">
          <div className="text-xs text-neutral-500">Rechazadas</div>
          <div className="text-2xl font-semibold">{kpi.rejected}</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="rounded-3xl border bg-white p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <label className="block">
            <span className="text-xs text-neutral-500">Fecha</span>
            <input
              className="mt-1 w-full rounded-2xl border p-2.5"
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setPage(1);
              }}
            />
          </label>

          <label className="block">
            <span className="text-xs text-neutral-500">Estado</span>
            <select
              className="mt-1 w-full rounded-2xl border p-2.5"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="assigned,in_progress,done_pending">Pendientes</option>
              <option value="done_pending">Solo en revisión</option>
              <option value="approved">Aprobadas</option>
              <option value="assigned,in_progress,done_pending,approved,rejected">Todas</option>
            </select>
          </label>

          <label className="block md:col-span-2">
            <span className="text-xs text-neutral-500">Buscar</span>
            <input
              className="mt-1 w-full rounded-2xl border p-2.5"
              placeholder="Ej. Limpieza mostrador"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setPage(1);
              }}
            />
          </label>
        </div>
      </div>

      {/* Lista */}
      <div className="rounded-3xl border bg-white overflow-hidden">
        <div className="p-4 border-b text-sm text-neutral-600">
          {loading ? "Cargando..." : err ? "Error" : "Resultados"}
        </div>

        {err && <div className="p-4 text-sm text-rose-600">{err}</div>}

        {!err && !loading && (data?.data?.length ?? 0) === 0 && (
          <div className="p-6 text-sm text-neutral-500">No tienes tareas para esta fecha.</div>
        )}

        {!err && data?.data?.length ? (
          <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
            {data.data.map((it) => {
              const a = it.assignment;
              const t = it.task;

              const isBusy = busyId === a.id;

              const canStart = a.status === "assigned";
              const canReopen = a.status === "in_progress" || a.status === "done_pending";
              const canSubmitToReview = a.status !== "done_pending" && a.status !== "approved" && a.status !== "rejected";

              // ✅ Usa el campo del backend
              const hasEvidence = !!a.has_evidence;
              const evidenceUrl = a.latest_evidence_url ?? null;

              // ✅ CHECKLIST DATA
              const checklistDef = it.checklist_def;
              const checklistStateBackend = it.checklist_state;
              const checklistProgress = it.checklist_progress;

              // Local overrides (optimistic), pero backend manda la verdad al refresh
              const checklistState = {
                ...(checklistStateBackend ?? {}),
                ...((checklistLocal[a.id] ?? {}) as any),
              };

              // KPI chip
              const hasChecklist = !!(checklistDef && checklistDef.length);
              const checklistOk = checklistProgress 
                ? checklistProgress.required_done >= checklistProgress.required_total 
                : true;

              const checklistChip = hasChecklist ? (
                <span
                  className={cx(
                    "rounded-full border px-2.5 py-1 text-xs",
                    checklistOk
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-amber-50 text-amber-900 border-amber-200"
                  )}
                >
                  Checklist: {checklistProgress ? `${checklistProgress.required_done}/${checklistProgress.required_total}` : "—"}
                </span>
              ) : null;

              // ✅ BONUS: Auto abrir checklist si falta algo requerido
              const shouldNudgeOpen =
                hasChecklist && !checklistOk && (a.status === "assigned" || a.status === "in_progress");

              if (shouldNudgeOpen && !openChecklist[a.id]) {
                setOpenChecklist((p) => ({ ...p, [a.id]: true }));
              }

              return (
                <div key={a.id} className="rounded-3xl border bg-white p-4 hover:shadow-sm transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="font-semibold truncate">{t.title}</div>
                        <StatusPill s={a.status} />
                        <PriorityPill p={t.priority} />
                      </div>

                      {t.description ? (
                        <div className="text-sm text-neutral-600 mt-2 line-clamp-2">{t.description}</div>
                      ) : (
                        <div className="text-sm text-neutral-400 mt-2">Sin descripción.</div>
                      )}

                      <div className="mt-3 text-xs text-neutral-500 flex flex-wrap gap-2">
                        <span className="rounded-full border px-2.5 py-1 bg-neutral-50">
                          Catálogo: {t.meta?.catalog_date ?? "-"}
                        </span>
                        <span className="rounded-full border px-2.5 py-1 bg-neutral-50">
                          Due: {t.due_at ? new Date(t.due_at).toLocaleString() : "-"}
                        </span>
                        {hasEvidence ? (
                          <span className="rounded-full border px-2.5 py-1 bg-emerald-50 text-emerald-800 border-emerald-200">
                            Evidencia subida
                          </span>
                        ) : (
                          <span className="rounded-full border px-2.5 py-1 bg-amber-50 text-amber-900 border-amber-200">
                            Falta evidencia
                          </span>
                        )}
                        {checklistChip}
                      </div>
                    </div>

                    {/* Uploader: ahora refresca al subir */}
                    <EvidenceInlineUploader
                      assignmentId={a.id}
                      taskId={t.id}
                      onUploadSuccess={refresh}
                    />
                  </div>

                  {/* ✅ CHECKLIST ACORDEÓN (solo si tiene checklist) - CORREGIDO: sin assignmentId */}
                  {hasChecklist ? (
                    <ChecklistAccordion
                      isOpen={!!openChecklist[a.id]}
                      onToggle={() => toggleOpen(a.id)}
                      titleRight={checklistChip}
                    >
                      <ChecklistInline
                        assignmentId={a.id}
                        items={checklistDef ?? []}
                        state={checklistState}
                        disabled={a.status === "approved" || a.status === "done_pending"}
                        onChange={(itemId, done) => toggleChecklist(a.id, itemId, done)}
                      />
                    </ChecklistAccordion>
                  ) : null}

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                      className="rounded-2xl border px-3 py-2 text-sm hover:bg-neutral-50 disabled:opacity-50"
                      disabled={!canStart || isBusy}
                      onClick={() => setAssignmentStatus(it, "in_progress")}
                    >
                      {isBusy ? "..." : "▶ Iniciar"}
                    </button>

                    <button
                      className="rounded-2xl bg-neutral-900 text-white px-3 py-2 text-sm hover:bg-neutral-800 disabled:opacity-50"
                      disabled={!canSubmitToReview || isBusy || !canSubmit(it)}
                      title={!canSubmit(it) ? "Completa evidencia y checklist antes de entregar" : "Enviar a revisión"}
                      onClick={() => {
                        if (!canSubmit(it)) {
                          // ✅ UX PREMIUM: abre el acordeón si no puede entregar
                          setOpenChecklist((p) => ({ ...p, [a.id]: true }));
                          return;
                        }
                        setAssignmentStatus(it, "done_pending");
                      }}
                    >
                      {isBusy ? "..." : "✅ Entregar (a revisión)"}
                    </button>

                    <button
                      className="rounded-2xl border px-3 py-2 text-sm hover:bg-neutral-50 disabled:opacity-50"
                      disabled={!canReopen || isBusy}
                      onClick={() => setAssignmentStatus(it, "assigned")}
                      title="Regresar a asignada"
                    >
                      {isBusy ? "..." : "↩ Reabrir"}
                    </button>

                    {/* ✅ Usa latest_evidence_url del backend */}
                    {evidenceUrl ? (
                      <a
                        href={evidenceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-blue-600 hover:underline ml-auto"
                      >
                        Ver evidencia
                      </a>
                    ) : null}
                  </div>

                  {/* ✅ ACTUALIZADO: Mensaje de bloqueo con checklist + evidencia */}
                  {!canSubmit(it) && canSubmitToReview ? (
                    <div className="mt-3 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-2xl p-3 space-y-1">
                      {!hasEvidence ? (
                        <div>📎 Falta evidencia: sube al menos una foto o PDF.</div>
                      ) : null}
                      {(() => {
                        const prog = it.checklist_progress;
                        if (!prog) return null;
                        const ok = prog.required_done >= prog.required_total;
                        return ok
                          ? null
                          : <div>☑️ Falta checklist: completa los puntos requeridos para poder entregar.</div>;
                      })()}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}

        {data && data.last_page > 1 && (
          <div className="p-4 border-t flex items-center justify-between">
            <button
              className="rounded-2xl border px-3 py-2 text-sm disabled:opacity-50 hover:bg-neutral-50"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </button>
            <div className="text-sm text-neutral-600">
              Página {page} de {data.last_page}
            </div>
            <button
              className="rounded-2xl border px-3 py-2 text-sm disabled:opacity-50 hover:bg-neutral-50"
              disabled={page >= data.last_page}
              onClick={() => setPage((p) => Math.min(data.last_page, p + 1))}
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
