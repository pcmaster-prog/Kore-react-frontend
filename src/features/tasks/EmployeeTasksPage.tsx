//features/tasks/EmployeeTasksPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { ClipboardList, LayoutGrid, Star } from "lucide-react";
import GondolasEmpleadoTab from "@/features/gondolas/GondolasEmpleadoTab";
import SemaforoEmpleadoTab from "@/features/semaforo/SemaforoEmpleadoTab";
import { getCompanerosParaEvaluar } from "@/features/semaforo/api";
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
      ? {
          label: "Asignada",
          cls: "bg-neutral-50 text-neutral-700 border-neutral-200",
        }
      : s === "in_progress"
        ? {
            label: "En progreso",
            cls: "bg-blue-50 text-blue-800 border-blue-200",
          }
        : s === "done_pending"
          ? {
              label: "En revisión",
              cls: "bg-amber-50 text-amber-900 border-amber-200",
            }
          : s === "approved"
            ? {
                label: "Aprobada",
                cls: "bg-emerald-50 text-emerald-800 border-emerald-200",
              }
            : s === "rejected"
              ? {
                  label: "Rechazada",
                  cls: "bg-rose-50 text-rose-800 border-rose-200",
                }
              : {
                  label: s,
                  cls: "bg-neutral-50 text-neutral-700 border-neutral-200",
                };

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs",
        meta.cls,
      )}
    >
      {meta.label}
    </span>
  );
}

function PriorityPill({ p }: { p?: string | null }) {
  const key = (p ?? "medium").toLowerCase();
  const meta =
    key === "urgent"
      ? { label: "Urgente", cls: "bg-rose-50 text-rose-800 border-rose-200" }
      : key === "high"
        ? {
            label: "Alta",
            cls: "bg-orange-50 text-orange-800 border-orange-200",
          }
        : key === "low"
          ? {
              label: "Baja",
              cls: "bg-neutral-50 text-neutral-700 border-neutral-200",
            }
          : {
              label: "Media",
              cls: "bg-indigo-50 text-indigo-800 border-indigo-200",
            };

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs",
        meta.cls,
      )}
    >
      {meta.label}
    </span>
  );
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
          "bg-white",
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
              done ? "bg-emerald-50 border-emerald-200" : "bg-white",
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
                  <span className="ml-1 text-xs text-rose-600">
                    (requerido)
                  </span>
                ) : (
                  <span className="ml-1 text-xs text-neutral-400">
                    (opcional)
                  </span>
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
                  : "bg-neutral-50 text-neutral-700 border-neutral-200",
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

type MainTab = "asignaciones" | "gondolas" | "evaluar";

export default function EmployeeTasksPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [mainTab, setMainTab] = useState<MainTab>("asignaciones");

  // Semáforo: check once on mount if there are peers to evaluate
  const [hasEvalPending, setHasEvalPending] = useState(false);
  useEffect(() => {
    getCompanerosParaEvaluar()
      .then(data => { if (data?.companeros?.length > 0) setHasEvalPending(true); })
      .catch(() => { /* silent — don't show tab if fetch fails */ });
  }, []);

  const [page, setPage] = useState(1);
  const [date, setDate] = useState(today);
  const [status, setStatus] = useState<string>(
    "assigned,in_progress,done_pending",
  );
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<{
    data: EmployeeAssignmentItem[];
    total: number;
    last_page: number;
  } | null>(null);

  const [busyId, setBusyId] = useState<string | null>(null);

  // ✅ NUEVO: Estado para abrir/cerrar checklist por asignación
  const [openChecklist, setOpenChecklist] = useState<Record<string, boolean>>(
    {},
  );
  const toggleOpen = (assignmentId: string) =>
    setOpenChecklist((p) => ({ ...p, [assignmentId]: !p[assignmentId] }));

  // ✅ NUEVO: Estado local para optimistic UI del checklist
  const [checklistLocal, setChecklistLocal] = useState<Record<string, any>>({});

  const params = useMemo(() => {
    const p: any = { page };
    // Si date está vacío no filtramos por fecha → muestra todas las tareas
    if (date) p.date = date;
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
    const counts = {
      assigned: 0,
      in_progress: 0,
      done_pending: 0,
      approved: 0,
      rejected: 0,
    };
    for (const it of list) {
      const s = it.assignment.status as keyof typeof counts;
      if (counts[s] !== undefined) counts[s] += 1;
    }
    return counts;
  }, [data]);

  async function setAssignmentStatus(
    item: EmployeeAssignmentItem,
    next: "assigned" | "in_progress" | "done_pending",
  ) {
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
  async function toggleChecklist(
    assignmentId: string,
    itemId: string,
    done: boolean,
  ) {
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
      setErr(
        e?.response?.data?.message ?? "No se pudo actualizar el checklist",
      );
      await refresh();
    }
  }

  // ✅ ACTUALIZADO: Valida evidencia + checklist requerido
  const canSubmit = (it: EmployeeAssignmentItem) => {
    const a = it.assignment;

    const hasEvidence = !!a.has_evidence;

    const progress = it.checklist_progress;
    const checklistOk = progress
      ? progress.required_done >= progress.required_total
      : true;

    return hasEvidence && checklistOk;
  };

  return (
    <div className="space-y-6">
      {/* ── Tabs principales ─────────────────────────────────────────────── */}
      <div className="w-full overflow-x-auto pb-2 -mb-2" style={{ scrollbarWidth: "none" }}>
        <div className="flex p-1.5 bg-white border border-neutral-100 rounded-[28px] shadow-sm w-max">
          {(
            [
              {
                key: "asignaciones",
                label: "Asignaciones",
                icon: <ClipboardList className="h-4 w-4" />,
              },
              {
                key: "gondolas",
                label: "Góndolas",
                icon: <LayoutGrid className="h-4 w-4" />,
              },
              ...(hasEvalPending ? [{
                key: "evaluar" as MainTab,
                label: "Evaluar",
                icon: <Star className="h-4 w-4" />,
              }] : []),
            ] as { key: MainTab; label: string; icon: React.ReactNode }[]
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setMainTab(t.key)}
              className={cx(
                "flex whitespace-nowrap items-center gap-2 px-5 py-2.5 rounded-[22px] text-sm font-bold transition-all duration-300 shrink-0",
                mainTab === t.key
                  ? "bg-obsidian text-white shadow-lg shadow-obsidian/20"
                  : "text-neutral-400 hover:text-obsidian hover:bg-neutral-50",
              )}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Góndolas ───────────────────────────────────────────────────────── */}
      {mainTab === "gondolas" && <GondolasEmpleadoTab />}

      {/* ── Tab Evaluar (Semáforo) ───────────────────────────────────────────── */}
      {mainTab === "evaluar" && <SemaforoEmpleadoTab />}

      {/* ── Tab Asignaciones (contenido original) ────────────────────────── */}
      {mainTab === "asignaciones" && (
        <>
          {/* ── Hero Header ─────────────────────────────────────────────── */}
          <div className="relative rounded-[32px] sm:rounded-[40px] bg-obsidian overflow-hidden px-6 py-8 sm:px-8 sm:py-10 text-white shadow-lg">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/[0.03]" />
              <div className="absolute top-8 right-32 h-32 w-32 rounded-full bg-white/[0.04]" />
              <div className="absolute bottom-0 left-1/4 h-24 w-48 rounded-full bg-gold/10" />
            </div>
            <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-1">
                  Operaciones
                </p>
                <h1 className="text-3xl font-black tracking-tight">
                  Mis tareas
                </h1>
                <p className="text-white/50 text-sm font-medium mt-1">
                  Gestiona tu día: checklist → evidencia → envío a revisión →
                  aprobación.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-bold uppercase tracking-widest shadow-sm backdrop-blur-md">
                <span className="text-white/50">Total Tareas:</span>
                <span className="text-white text-base">{data?.total ?? 0}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
            {[
              {
                label: "Asignadas",
                val: kpi.assigned,
                cls: "text-blue-600",
                bg: "bg-blue-50/50 border-blue-100",
              },
              {
                label: "En progreso",
                val: kpi.in_progress,
                cls: "text-amber-600",
                bg: "bg-amber-50/50 border-amber-100",
              },
              {
                label: "En revisión",
                val: kpi.done_pending,
                cls: "text-indigo-600",
                bg: "bg-indigo-50/50 border-indigo-100",
              },
              {
                label: "Aprobadas",
                val: kpi.approved,
                cls: "text-emerald-600",
                bg: "bg-emerald-50/50 border-emerald-100",
              },
              {
                label: "Rechazadas",
                val: kpi.rejected,
                cls: "text-rose-600",
                bg: "bg-rose-50/50 border-rose-100",
              },
            ].map((k) => (
              <div
                key={k.label}
                className={cx(
                  "rounded-[24px] sm:rounded-[28px] border p-4 sm:p-5 shadow-sm transition-all hover:shadow-md overflow-hidden",
                  k.bg,
                )}
              >
                <div
                  className={cx(
                    "text-2xl sm:text-3xl font-black tracking-tight mb-1 sm:mb-2",
                    k.cls,
                  )}
                >
                  {k.val}
                </div>
                <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest truncate">
                  {k.label}
                </div>
              </div>
            ))}
          </div>

          {/* Filtros Toolbar */}
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between rounded-[24px] sm:rounded-[28px] border border-neutral-100 bg-white p-3 shadow-sm w-full mx-auto overflow-hidden text-clip">
            {/* BUSCADOR */}
            <div className="flex items-center gap-2 px-3 py-2 w-full lg:w-auto flex-1 bg-neutral-50 lg:bg-transparent rounded-xl lg:rounded-none border border-neutral-100 lg:border-transparent">
              <span className="text-neutral-400 text-sm shrink-0">🔍</span>
              <input
                className="w-full min-w-0 text-sm outline-none bg-transparent placeholder:text-neutral-400 font-medium"
                placeholder="Buscar tarea..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setPage(1);
                }}
              />
            </div>

            <div className="hidden lg:block w-px h-8 bg-neutral-100 shrink-0" />

            {/* FECHA */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto px-1 sm:px-0">
              <div className="flex items-center gap-2 rounded-xl bg-neutral-50 px-3 py-2 border border-neutral-100 flex-1 min-w-0">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest shrink-0">
                  Fecha
                </span>
                <input
                  type="date"
                  className="w-full text-sm flex-1 font-medium outline-none bg-transparent text-neutral-600 focus:outline-none min-w-0"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <button
                type="button"
                title={date ? "Ver todas las fechas" : "Filtro de fecha activo"}
                onClick={() => {
                  setDate(date ? "" : today);
                  setPage(1);
                }}
                className={cx(
                  "rounded-xl border px-5 py-2 text-xs font-bold uppercase tracking-widest transition-colors shadow-sm shrink-0 whitespace-nowrap",
                  !date
                    ? "bg-obsidian text-white border-obsidian"
                    : "bg-white text-neutral-500 border-neutral-200 hover:bg-neutral-50",
                )}
              >
                {date ? "Hoy" : "Todas"}
              </button>
            </div>

            <div className="hidden lg:block w-px h-8 bg-neutral-100 shrink-0" />

            {/* ESTADO */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto px-1 sm:px-0 lg:pl-2">
              <div className="flex items-center gap-2 rounded-xl bg-neutral-50 px-3 py-2 border border-neutral-100 flex-1 min-w-0">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest shrink-0">
                  Estado
                </span>
                <select
                  className="flex-1 w-full bg-transparent text-sm font-bold text-neutral-600 outline-none min-w-0"
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="assigned,in_progress,done_pending">
                    Pendientes
                  </option>
                  <option value="done_pending">En revisión</option>
                  <option value="approved">Aprobadas</option>
                  <option value="assigned,in_progress,done_pending,approved,rejected">
                    Todas
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* Lista */}
          <div className="rounded-[32px] sm:rounded-[40px] border border-neutral-100 bg-white shadow-sm overflow-hidden mt-6">
            <div className="p-6 sm:p-8 border-b border-neutral-50 bg-neutral-50/50 flex flex-wrap items-center justify-between gap-4">
              <div className="text-xl font-black text-obsidian tracking-tight">
                Resultados
              </div>
              {loading && (
                <div className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-neutral-200 border-t-obsidian rounded-full animate-spin" />{" "}
                  Buscando tareas...
                </div>
              )}
              {err && (
                <div className="text-xs font-bold text-rose-500 uppercase tracking-widest">
                  Error
                </div>
              )}
            </div>

            {err && (
              <div className="p-8 text-sm font-medium text-rose-600 bg-rose-50/50">
                {err}
              </div>
            )}

            {!err && !loading && (data?.data?.length ?? 0) === 0 && (
              <div className="p-16 text-center text-sm font-bold text-neutral-400 uppercase tracking-widest">
                No tienes tareas para esta fecha.
              </div>
            )}

            {!err && data?.data?.length ? (
              <div className="p-6 grid grid-cols-1 gap-4">
                {data.data.map((it) => {
                  const a = it.assignment;
                  const t = it.task;

                  const isBusy = busyId === a.id;
                  const canStart = a.status === "assigned";
                  const canReopen =
                    a.status === "in_progress" || a.status === "done_pending";
                  const canSubmitToReview =
                    a.status !== "done_pending" &&
                    a.status !== "approved" &&
                    a.status !== "rejected";

                  const hasEvidence = !!a.has_evidence;
                  const evidenceUrl = a.latest_evidence_url ?? null;

                  const checklistDef = it.checklist_def;
                  const checklistStateBackend = it.checklist_state;
                  const checklistProgress = it.checklist_progress;
                  const checklistState = {
                    ...(checklistStateBackend ?? {}),
                    ...((checklistLocal[a.id] ?? {}) as any),
                  };

                  const hasChecklist = !!(checklistDef && checklistDef.length);
                  const checklistOk = checklistProgress
                    ? checklistProgress.required_done >=
                      checklistProgress.required_total
                    : true;

                  const checklistChip = hasChecklist ? (
                    <span
                      className={cx(
                        "rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest",
                        checklistOk
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-amber-50 text-amber-900 border-amber-200",
                      )}
                    >
                      Checklist:{" "}
                      {checklistProgress
                        ? `${checklistProgress.required_done}/${checklistProgress.required_total}`
                        : "—"}
                    </span>
                  ) : null;

                  const shouldNudgeOpen =
                    hasChecklist &&
                    !checklistOk &&
                    (a.status === "assigned" || a.status === "in_progress");
                  if (shouldNudgeOpen && !openChecklist[a.id]) {
                    setOpenChecklist((p) => ({ ...p, [a.id]: true }));
                  }

                  return (
                    <div
                      key={a.id}
                      className="rounded-[24px] sm:rounded-[32px] border border-neutral-100 bg-white p-5 sm:p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <div className="text-lg font-black text-obsidian tracking-tight truncate mr-2">
                              {t.title}
                            </div>
                            <StatusPill s={a.status} />
                            <PriorityPill p={t.priority} />
                          </div>

                          {t.description ? (
                            <div className="text-sm font-medium text-neutral-500 mt-2 line-clamp-2 leading-relaxed">
                              {t.description}
                            </div>
                          ) : (
                            <div className="text-sm font-medium text-neutral-400 mt-2 italic">
                              Sin descripción.
                            </div>
                          )}

                          <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-neutral-500 uppercase tracking-widest">
                            <span className="rounded-full border border-neutral-100 px-3 py-1 shadow-sm">
                              Catálogo: {t.meta?.catalog_date ?? "-"}
                            </span>
                            <span className="rounded-full border border-neutral-100 px-3 py-1 shadow-sm">
                              Vence:{" "}
                              {t.due_at
                                ? new Date(t.due_at).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "-"}
                            </span>
                            {hasEvidence ? (
                              <span className="rounded-full border px-3 py-1 bg-emerald-50 text-emerald-800 border-emerald-200 shadow-sm transition">
                                Evidencia Lista
                              </span>
                            ) : (
                              <span className="rounded-full border px-3 py-1 bg-amber-50 text-amber-900 border-amber-200 shadow-sm transition">
                                Falta evidencia
                              </span>
                            )}
                            {checklistChip}
                          </div>
                        </div>

                        <div className="shrink-0 pt-2 lg:pt-0">
                          <EvidenceInlineUploader
                            assignmentId={a.id}
                            taskId={t.id}
                            onUploadSuccess={refresh}
                          />
                        </div>
                      </div>

                      {hasChecklist ? (
                        <ChecklistAccordion
                          isOpen={!!openChecklist[a.id]}
                          onToggle={() => toggleOpen(a.id)}
                          titleRight={checklistChip}
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <ChecklistInline
                              assignmentId={a.id}
                              items={checklistDef ?? []}
                              state={checklistState}
                              disabled={
                                a.status === "approved" ||
                                a.status === "done_pending"
                              }
                              onChange={(itemId, done) =>
                                toggleChecklist(a.id, itemId, done)
                              }
                            />
                          </div>
                        </ChecklistAccordion>
                      ) : null}

                      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:flex md:flex-wrap items-center gap-3 border-t border-neutral-100 pt-5">
                        <button
                          className="w-full md:w-auto rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-xs font-bold text-obsidian hover:bg-neutral-50 transition-colors uppercase tracking-widest disabled:opacity-50 min-w-0 md:min-w-[120px]"
                          disabled={!canStart || isBusy}
                          onClick={() => setAssignmentStatus(it, "in_progress")}
                        >
                          {isBusy ? "..." : "▶ Iniciar"}
                        </button>

                        <button
                          className="w-full md:w-auto rounded-2xl bg-obsidian text-white px-5 py-3 text-xs font-bold shadow-md hover:bg-neutral-800 hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-widest min-w-0 md:min-w-[120px]"
                          disabled={
                            !canSubmitToReview || isBusy || !canSubmit(it)
                          }
                          title={
                            !canSubmit(it)
                              ? "Completa evidencia y checklist antes de entregar"
                              : "Enviar a revisión"
                          }
                          onClick={() => {
                            if (!canSubmit(it)) {
                              setOpenChecklist((p) => ({ ...p, [a.id]: true }));
                              return;
                            }
                            setAssignmentStatus(it, "done_pending");
                          }}
                        >
                          {isBusy ? "..." : "✅ Entregar"}
                        </button>

                        <button
                          className="w-full md:w-auto rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-xs font-bold text-neutral-500 hover:bg-neutral-50 transition-colors uppercase tracking-widest disabled:opacity-50 min-w-0 md:min-w-[120px]"
                          disabled={!canReopen || isBusy}
                          onClick={() => setAssignmentStatus(it, "assigned")}
                          title="Regresar a asignada"
                        >
                          {isBusy ? "..." : "↩ Reabrir"}
                        </button>

                        {evidenceUrl ? (
                          <a
                            href={evidenceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full md:w-auto text-center rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors uppercase tracking-widest md:ml-auto"
                          >
                            Ver evidencia
                          </a>
                        ) : null}
                      </div>

                      {!canSubmit(it) && canSubmitToReview ? (
                        <div className="mt-4 rounded-xl bg-amber-50 border border-amber-100 p-4 text-xs font-medium text-amber-800 space-y-2">
                          {!hasEvidence ? (
                            <div className="flex items-center gap-2">
                              <span>📎</span> Falta evidencia: sube al menos una
                              foto o PDF.
                            </div>
                          ) : null}
                          {(() => {
                            const prog = it.checklist_progress;
                            if (!prog) return null;
                            const ok =
                              prog.required_done >= prog.required_total;
                            return ok ? null : (
                              <div className="flex items-center gap-2">
                                <span>☑️</span> Falta checklist: completa los
                                puntos requeridos para poder entregar.
                              </div>
                            );
                          })()}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}

            {data && data.last_page > 1 && (
              <div className="p-6 border-t border-neutral-50 bg-neutral-50/50 flex flex-wrap items-center justify-between gap-4">
                <button
                  className="rounded-2xl border border-neutral-200 bg-white px-5 py-2.5 text-xs font-bold text-obsidian hover:bg-neutral-50 transition-colors uppercase tracking-widest disabled:opacity-50 inline-flex items-center"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </button>
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                  Página {page} de {data.last_page}
                </div>
                <button
                  className="rounded-2xl border border-neutral-200 bg-white px-5 py-2.5 text-xs font-bold text-obsidian hover:bg-neutral-50 transition-colors uppercase tracking-widest disabled:opacity-50 inline-flex items-center"
                  disabled={page >= data.last_page}
                  onClick={() =>
                    setPage((p) => Math.min(data.last_page, p + 1))
                  }
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
