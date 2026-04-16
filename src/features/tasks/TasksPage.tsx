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
import { getTemplate } from "@/features/tasks/catalog/api";
import type { Task } from "./types";
import TaskCatalogPanel from "./TaskCatalogPanel";
import { listEmployees } from "./employeeApi";
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  ChevronRight,
  Users,
  RotateCcw,
  Trash2,
  Eye,
  MessageSquare,
  Paperclip,
  Download,
  Image as ImageIcon,
  FileText,
  Check,
  X,
  TrendingUp,
  Zap,
} from "lucide-react";

function cx(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(" ");
}


function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; dot: string }> = {
    open: {
      label: "Abierta",
      cls: "bg-blue-50 text-blue-700 border-blue-100",
      dot: "bg-blue-400",
    },
    in_progress: {
      label: "En progreso",
      cls: "bg-amber-50 text-amber-700 border-amber-100",
      dot: "bg-amber-400",
    },
    completed: {
      label: "Completada",
      cls: "bg-emerald-50 text-emerald-700 border-emerald-100",
      dot: "bg-emerald-400",
    },
    assigned: {
      label: "Asignada",
      cls: "bg-neutral-50 text-neutral-600 border-neutral-100",
      dot: "bg-neutral-400",
    },
    done_pending: {
      label: "En revisión",
      cls: "bg-indigo-50 text-indigo-700 border-indigo-100",
      dot: "bg-indigo-400",
    },
    approved: {
      label: "Aprobada",
      cls: "bg-emerald-50 text-emerald-700 border-emerald-100",
      dot: "bg-emerald-400",
    },
    rejected: {
      label: "Rechazada",
      cls: "bg-rose-50 text-rose-700 border-rose-100",
      dot: "bg-rose-400",
    },
  };

  const x = map[status] ?? {
    label: status,
    cls: "bg-neutral-50 text-neutral-600 border-neutral-100",
    dot: "bg-neutral-300",
  };

  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
        x.cls,
      )}
    >
      <span className={cx("h-1.5 w-1.5 rounded-full", x.dot)} />
      {x.label}
    </span>
  );
}

const isImage = (mime?: string | null) =>
  String(mime ?? "")
    .toLowerCase()
    .startsWith("image/");

export default function TasksPage() {
  // ===== Tabs =====
  const [tab, setTab] = useState<"tareas" | "aprobaciones">("tareas");

  // ===== TAREAS =====
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  // filtros
  const [status, setStatus] = useState<string>("");
  const today = new Date().toISOString().slice(0, 10);
  const [date] = useState<string>(today);
  const [search, setSearch] = useState<string>("");
  const [overdue, setOverdue] = useState(false);
  const [empleadoId, setEmpleadoId] = useState<string>("");

  const [empleados, setEmpleados] = useState<any[]>([]);
  const [showCatalog, setShowCatalog] = useState(false);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<{
    data: Task[];
    total: number;
    last_page: number;
  } | null>(null);

  // Estado para bloquear botones por tarea
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const handleNewTask = () => setShowCatalog((s) => !s);
    window.addEventListener("kore-new-task", handleNewTask);
    listEmployees()
      .then((res) => setEmpleados(Array.isArray(res) ? res : []))
      .catch(() => {});
    return () => window.removeEventListener("kore-new-task", handleNewTask);
  }, []);

  const params = useMemo(() => {
    const p: Record<string, string | number | boolean> = {
      page,
      _r: reloadKey,
    };
    if (status) p.status = status;
    if (date) p.date = date;
    if (empleadoId) p.empleado_id = empleadoId;
    if (search.trim()) p.search = search.trim();
    if (overdue) p.overdue = true;
    return p;
  }, [page, status, date, search, overdue, empleadoId, reloadKey]);

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
    return () => {
      alive = false;
    };
  }, [params]);

  useEffect(() => {
    setPage(1);
  }, [status, date, overdue, search]);

  async function quickSetStatus(
    taskId: string,
    next: "open" | "in_progress" | "completed",
  ) {
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
  const [apData, setApData] = useState<{
    data: any[];
    total: number;
    last_page: number;
  } | null>(null);

  // modal evidencias
  const [evOpen, setEvOpen] = useState(false);
  const [evLoading, setEvLoading] = useState(false);
  const [evErr, setEvErr] = useState<string | null>(null);
  const [evList, setEvList] = useState<any[] | null>(null);
  const [evAssignmentId, setEvAssignmentId] = useState<string | null>(null);
  const [evTaskId, setEvTaskId] = useState<string | null>(null);

  
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

    return () => {
      alive = false;
    };
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
      // Ensure we have an array, whether the API returned the array directly or wrapped in { data: [...] }
      const evidencesArray = Array.isArray(res) ? res : (res.data ?? []);

      const filtered = assignmentId
        ? evidencesArray.filter((x: any) => x.task_assignee_id === assignmentId)
        : evidencesArray;
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
      setEvErr(
        e?.response?.data?.message ?? "No se pudieron cargar evidencias",
      );
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
        setEvList(
          (ev.data ?? []).filter(
            (x: any) => x.task_assignee_id === assignmentId,
          ),
        );
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
      {/* Internal Tabs - Segmented Style */}
      <div className="flex p-1 bg-neutral-100/50 border border-neutral-100 rounded-2xl w-fit">
        <button
          className={cx(
            "flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all",
            tab === "tareas"
              ? "bg-white text-obsidian shadow-sm"
              : "text-neutral-400 hover:text-neutral-600",
          )}
          onClick={() => setTab("tareas")}
        >
          <Zap className="h-3.5 w-3.5" />
          Listado de Tareas
        </button>
        <button
          className={cx(
            "flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all",
            tab === "aprobaciones"
              ? "bg-white text-obsidian shadow-sm"
              : "text-neutral-400 hover:text-neutral-600",
          )}
          onClick={() => setTab("aprobaciones")}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Aprobaciones Pendientes
          {apData?.total ? (
            <span className="ml-1 px-1.5 py-0.5 rounded-md bg-rose-500 text-white text-[10px]">
              {apData.total}
            </span>
          ) : null}
        </button>
      </div>

      {tab === "tareas" ? (
        <div className="space-y-6 animate-in-fade">
          {/* Top Actions & Filters Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-[32px] border border-neutral-100 shadow-sm flex-wrap">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative">
                <select
                  className="h-11 pl-5 pr-10 rounded-2xl bg-neutral-50/50 border border-neutral-100 text-[11px] font-bold uppercase tracking-widest text-obsidian outline-none appearance-none focus:ring-2 focus:ring-obsidian/10"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="">Todos los Estados</option>
                  <option value="open">Abierta</option>
                  <option value="in_progress">En progreso</option>
                  <option value="completed">Completada</option>
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400 rotate-90 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  className="h-11 pl-5 pr-10 rounded-2xl bg-neutral-50/50 border border-neutral-100 text-[11px] font-bold uppercase tracking-widest text-obsidian outline-none appearance-none focus:ring-2 focus:ring-obsidian/10 max-w-[200px]"
                  value={empleadoId}
                  onChange={(e) => setEmpleadoId(e.target.value)}
                >
                  <option value="">Todos los Empleados</option>
                  {empleados.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name ?? emp.name ?? emp.id}
                    </option>
                  ))}
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400 rotate-90 pointer-events-none" />
              </div>

              <div className="relative flex items-center bg-neutral-50/50 h-11 rounded-2xl border border-neutral-100 px-4 min-w-[280px] gap-2 focus-within:ring-2 focus-within:ring-obsidian/10">
                <Search className="h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Buscar tarea..."
                  className="bg-transparent border-none text-xs font-bold text-obsidian outline-none w-full placeholder:text-neutral-400 placeholder:uppercase placeholder:tracking-widest"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setPage(1);
                  }}
                />
              </div>
            </div>

            <div className="flex items-center gap-4 border-t md:border-t-0 border-neutral-100 pt-3 md:pt-0 pl-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div
                  className={cx(
                    "h-5 w-5 rounded-md flex items-center justify-center transition-colors border shadow-sm",
                    overdue
                      ? "bg-rose-500 border-rose-500 text-white"
                      : "border-neutral-200 bg-white group-hover:border-neutral-300",
                  )}
                >
                  {overdue && <Check className="h-3.5 w-3.5" />}
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={overdue}
                    onChange={(e) => setOverdue(e.target.checked)}
                  />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 group-hover:text-obsidian transition-colors">
                  Vencidas
                </span>
              </label>

              <div className="h-8 w-px bg-neutral-100 hidden md:block" />

              <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-100">
                <span className="text-obsidian">{data?.total ?? 0}</span> TAREAS
                TOTALES
              </div>
            </div>
          </div>

          {/* Catalog Panel Toggle */}
          {showCatalog && (
            <div className="fixed inset-0 z-50 animate-in-fade">
              <TaskCatalogPanel
                onAssigned={() => {
                  setPage(1);
                  setReloadKey((k) => k + 1);
                  setShowCatalog(false);
                }}
                onClose={() => setShowCatalog(false)}
              />
            </div>
          )}

          {/* TABLE VIEW */}
          <div className="bg-white rounded-[40px] border border-neutral-100 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-neutral-50 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-neutral-50 rounded-[14px] flex items-center justify-center text-obsidian border border-neutral-100">
                  <ClipboardList className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-obsidian tracking-tight">
                    Listado de Tareas
                  </h3>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5">
                    Asignaciones en curso
                  </p>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="p-16 flex flex-col items-center gap-4 text-neutral-400 bg-neutral-50/50">
                <div className="h-10 w-10 border-4 border-neutral-200 border-t-obsidian rounded-full animate-spin" />
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  Sincronizando tareas...
                </span>
              </div>
            ) : err ? (
              <div className="p-8 m-6 rounded-3xl bg-rose-50 border border-rose-100 flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                  <AlertTriangle className="h-5 w-5 text-rose-500" />
                </div>
                <div>
                  <div className="text-sm font-black text-rose-700">
                    Error de carga
                  </div>
                  <div className="text-[11px] font-bold uppercase tracking-widest text-rose-500 mt-1">
                    {err}
                  </div>
                </div>
              </div>
            ) : data?.data?.length === 0 ? (
              <div className="p-20 text-center bg-neutral-50/30">
                <div className="h-20 w-20 rounded-[24px] bg-white border border-neutral-100 shadow-sm flex items-center justify-center mx-auto mb-6">
                  <ClipboardList className="h-8 w-8 text-neutral-300" />
                </div>
                <p className="text-xs font-black text-obsidian uppercase tracking-widest mb-2">
                  No hay tareas que mostrar
                </p>
                <p className="text-[11px] font-bold text-neutral-400 capitalize tracking-wide max-w-xs mx-auto text-center leading-relaxed">
                  Modifica los filtros de búsqueda o asigna nuevas tareas desde
                  el catálogo.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-neutral-50/80 border-b border-neutral-50">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest whitespace-nowrap">
                        Empleado
                      </th>
                      <th className="px-6 py-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest min-w-[280px]">
                        Misión / Tarea
                      </th>
                      <th className="px-6 py-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                        Estado
                      </th>
                      <th className="px-6 py-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest text-center">
                        Evidencia
                      </th>
                      <th className="px-6 py-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest text-right">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.data.map((t) => (
                      <tr
                        key={t.id}
                        className="border-t border-neutral-50 hover:bg-neutral-50/80 transition-colors group"
                      >
                        <td className="px-6 py-5">
                          {(() => {
                            const assignees = (t as any).assignees ?? [];
                            const firstAssignee =
                              assignees[0]?.empleado ??
                              (t as any).empleado ??
                              null;
                            const empName =
                              firstAssignee?.full_name ??
                              firstAssignee?.name ??
                              (t as any).assignee_name;
                            const empAvatar =
                              firstAssignee?.avatar_url ??
                              (t as any).empleado?.avatar_url;
                            const isAssigned =
                              assignees.length > 0 ||
                              (!!empName &&
                                empName !== "Equipo General" &&
                                empName !== "Sin Asignar");

                            const displayLabel =
                              assignees.length > 1
                                ? `${empName} y ${assignees.length - 1} más`
                                : isAssigned
                                  ? empName
                                  : "Sin Asignar";

                            const initials = isAssigned
                              ? assignees.length > 1
                                ? "M"
                                : empName?.substring(0, 2).toUpperCase() || "SA"
                              : "SA";

                            return (
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-2xl bg-white border border-neutral-100 shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                                  {assignees.length > 1 ? (
                                    <Users className="h-4 w-4 text-neutral-400" />
                                  ) : empAvatar ? (
                                    <img
                                      src={empAvatar}
                                      alt="avatar"
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-[10px] font-black text-neutral-400">
                                      {initials}
                                    </span>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div
                                    className="text-xs font-black text-obsidian truncate max-w-[120px]"
                                    title={displayLabel}
                                  >
                                    {displayLabel}
                                  </div>
                                  <div className="text-[10px] font-bold tracking-wider uppercase text-neutral-400 mt-1 truncate max-w-[120px]">
                                    {assignees.length > 1
                                      ? "Grupal"
                                      : isAssigned
                                        ? "Individual"
                                        : "Pendiente"}
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col justify-center">
                            <div className="text-sm font-black text-obsidian line-clamp-1 mb-1 group-hover:text-gold transition-colors">
                              {t.title}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-neutral-400 uppercase">
                              <span>
                                Asig:{" "}
                                {new Date(t.created_at).toLocaleDateString(
                                  "es-MX",
                                  {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                  },
                                )}
                              </span>
                              <span className="h-1 w-1 rounded-full bg-neutral-200" />
                              <span
                                className={cx(
                                  t.priority === "urgent"
                                    ? "text-rose-500"
                                    : t.priority === "high"
                                      ? "text-rose-400"
                                      : "text-neutral-400",
                                )}
                              >
                                Prio:{" "}
                                {t.priority === "urgent"
                                  ? "Urgente"
                                  : t.priority === "high"
                                    ? "Alta"
                                    : t.priority === "low"
                                      ? "Baja"
                                      : "Normal"}
                              </span>
                            </div>
                            {t.description && (
                              <div className="text-xs font-medium text-neutral-400 mt-2 line-clamp-1 bg-neutral-50 border border-neutral-100 rounded-lg px-2.5 py-1.5 w-fit">
                                {t.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <StatusPill status={t.status} />
                        </td>
                        <td className="px-6 py-5 text-center whitespace-nowrap">
                          {(t as any).has_evidence ||
                          (t as any).evidences?.length > 0 ||
                          (t as any).evidence?.length > 0 ||
                          (t as any).has_evidences ||
                          ((t as any).assignees ?? []).some(
                            (a: any) => a.has_evidence,
                          ) ? (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                openEvidences("", t.id);
                              }}
                              className="inline-flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 shadow-sm px-3 py-1.5 rounded-xl border border-emerald-100 hover:bg-emerald-100 hover:border-emerald-200 transition-colors mx-auto"
                            >
                              <ImageIcon className="h-3.5 w-3.5" /> Ver
                              Evidencia
                            </button>
                          ) : (
                            <span className="inline-flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-neutral-300 bg-neutral-50 px-3 py-1.5 rounded-xl border border-neutral-100 mx-auto">
                              <X className="h-3 w-3" /> Sin Evidencia
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                            <button
                              title="Detener / Abierta"
                              disabled={busyId === t.id || t.status === "open"}
                              onClick={() => quickSetStatus(t.id, "open")}
                              className="h-9 w-9 bg-white border border-neutral-100 shadow-sm rounded-xl flex items-center justify-center text-rose-500 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition disabled:opacity-30 disabled:hover:bg-white disabled:hover:border-neutral-100"
                            >
                              <X className="h-4 w-4" />
                            </button>
                            <button
                              title="Marcar completada"
                              disabled={
                                busyId === t.id || t.status === "completed"
                              }
                              onClick={() => quickSetStatus(t.id, "completed")}
                              className="h-9 w-9 bg-white border border-neutral-100 shadow-sm rounded-xl flex items-center justify-center text-emerald-500 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600 transition disabled:opacity-30 disabled:hover:bg-white disabled:hover:border-neutral-100"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                            <button
                              title="Recargar"
                              disabled={busyId === t.id}
                              onClick={async () => {
                                setBusyId(t.id);
                                // Forzamos recarga de la lista sin perder la página actual
                                setReloadKey((k) => k + 1);
                                // Quitamos el spinner tras un par de segundos o al montar,
                                // pero useEffect actualizará data. Simulamos al menos 800ms para feedback visual
                                await new Promise((r) => setTimeout(r, 800));
                                setBusyId(null);
                              }}
                              className="h-9 px-3 bg-neutral-100 text-obsidian rounded-xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest hover:bg-neutral-200 transition-colors disabled:opacity-50"
                            >
                              <RotateCcw
                                className={cx(
                                  "h-3 w-3",
                                  busyId === t.id && "animate-spin",
                                )}
                              />
                              Recargar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Minimalist Pagination */}
            {data && data.last_page > 1 && (
              <div className="bg-neutral-50/50 border-t border-neutral-50 px-8 py-5 flex items-center justify-between">
                <button
                  className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-obsidian disabled:opacity-30 transition"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  &larr; Anterior
                </button>
                <div className="flex gap-2">
                  {Array.from({ length: data.last_page }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i + 1)}
                      className={cx(
                        "h-7 w-7 rounded-xl flex items-center justify-center text-[11px] font-black transition",
                        page === i + 1
                          ? "bg-obsidian text-white shadow-sm shadow-obsidian/20"
                          : "bg-white text-neutral-400 hover:text-obsidian border border-neutral-100",
                      )}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-obsidian disabled:opacity-30 transition"
                  disabled={page >= data.last_page}
                  onClick={() =>
                    setPage((p) => Math.min(data.last_page, p + 1))
                  }
                >
                  Siguiente &rarr;
                </button>
              </div>
            )}
          </div>

          {/* BOTTOM METRICS (Rendimiento Semanal / Resumen Turno) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-10">
            {/* Left Box */}
            <div className="bg-white rounded-[40px] border border-neutral-100 shadow-sm p-8 flex flex-col justify-between relative overflow-hidden min-h-[280px]">
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <h4 className="text-2xl font-black text-obsidian tracking-tight mb-2">
                    Rendimiento
                    <br />
                    Semanal
                  </h4>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 max-w-[200px] leading-relaxed">
                    Tu equipo ha completado{" "}
                    <span className="text-obsidian">
                      {data?.total ?? 0} tareas
                    </span>{" "}
                    en los últimos 7 días.
                  </p>
                </div>
                <div className="h-12 w-12 rounded-[22px] bg-neutral-50 border border-neutral-100 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-neutral-300" />
                </div>
              </div>

              {/* Dynamic Bar Chart */}
              <div className="mt-8 flex items-end justify-between gap-1 h-24 relative z-10 pt-4 px-2 select-none">
                {/* Asumiendo que el backend enviará un arreglo "last_7_days" en "data.meta" o similar, si no, lo calculamos simulado de momentos */}
                {(data as any)?.last_7_days?.length === 7
                  ? ((data as any).last_7_days as number[]).map((h, i) => {
                      const max = Math.max(
                        ...((data as any).last_7_days as number[]),
                        10,
                      );
                      const height = Math.max(10, (h / max) * 100);
                      return (
                        <div
                          key={i}
                          className="flex-1 max-w-[32px] rounded-t-[10px] bg-neutral-100 relative group transition-colors hover:bg-neutral-200 cursor-default"
                          style={{ height: `${height}%` }}
                        >
                          <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-obsidian text-white text-[10px] font-bold px-2.5 py-1 rounded-lg transition-opacity pointer-events-none">
                            {h}
                          </div>
                        </div>
                      );
                    })
                  : Array.from({ length: 7 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex-1 max-w-[32px] rounded-t-[10px] bg-neutral-100 relative group transition-colors hover:bg-neutral-200 cursor-default"
                        style={{ height: `10%` }}
                      >
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-obsidian text-white text-[10px] font-bold px-2.5 py-1 rounded-lg transition-opacity pointer-events-none">
                          0
                        </div>
                      </div>
                    ))}
              </div>
            </div>

            {/* Right Box (Dark) */}
            <div className="bg-obsidian rounded-[40px] p-8 text-white relative overflow-hidden flex flex-col justify-between min-h-[280px] shadow-lg shadow-obsidian/10">
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/[0.03]" />
                <div className="absolute bottom-[-20%] right-[-10%] h-48 w-48 rounded-full bg-gold/10 blur-[40px]" />
              </div>

              <div className="relative z-10 space-y-5">
                <div>
                  <h4 className="text-2xl font-black tracking-tight mb-3">
                    Resumen de Turno
                  </h4>
                  <p className="text-sm font-medium text-white/50 leading-relaxed max-w-[85%]">
                    Has gestionado{" "}
                    <span className="text-white font-bold">
                      {data?.total ?? 0} tareas
                    </span>{" "}
                    el día de hoy. Tu equipo mantiene un{" "}
                    <span className="text-emerald-400 font-bold tracking-wide">
                      {(data as any)?.effectiveness ?? 100}% de efectividad
                    </span>{" "}
                    en las entregas pautadas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Panel de Aprobaciones
        <div className="space-y-6 animate-in-fade">
          <div className="bg-white border border-neutral-100/50 rounded-[32px] p-6 shadow-sm flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-[20px] bg-amber-50 text-amber-500 flex items-center justify-center">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-obsidian tracking-tight">
                  Control de Calidad
                </h2>
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                  {apData?.total ?? 0} entregas por validar
                </p>
              </div>
            </div>
            <button
              className="h-11 px-6 rounded-2xl bg-obsidian text-white text-[11px] font-bold uppercase tracking-widest hover:bg-gold transition-all shadow-lg shadow-obsidian/10"
              onClick={() => setApPage(1)}
            >
              Recargar Lista
            </button>
          </div>

          {apErr && (
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-sm text-rose-700 flex items-center gap-3 animate-in-shake">
              <AlertTriangle className="h-4 w-4" />
              {apErr}
            </div>
          )}

          {apLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-white border border-neutral-100/50 rounded-[40px] p-8 shadow-sm flex flex-col gap-4 animate-pulse border-l-4 border-l-neutral-200"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="h-4 w-24 bg-neutral-200 rounded-md mb-4" />
                      <div className="h-6 w-48 bg-neutral-200 rounded-md mb-2" />
                      <div className="h-4 w-32 bg-neutral-200 rounded-md" />
                    </div>
                    <div className="h-12 w-12 bg-neutral-200 rounded-2xl" />
                  </div>
                  <div className="h-20 w-full bg-neutral-100 rounded-[28px] mt-4" />
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div className="h-12 bg-neutral-200 rounded-2xl" />
                    <div className="h-12 bg-neutral-200 rounded-2xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : !apErr && (apData?.data?.length ?? 0) === 0 ? (
            <div className="bg-white border border-neutral-100/50 rounded-[40px] p-20 text-center">
              <div className="inline-flex h-20 w-20 rounded-full bg-emerald-50 text-emerald-500 items-center justify-center mb-6">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-black text-obsidian mb-2 tracking-tight">
                ¡Todo al día!
              </h3>
              <p className="text-sm text-neutral-400 max-w-xs mx-auto">
                No hay evidencias pendientes de revisión en este momento.
              </p>
            </div>
          ) : null}

          {!apErr && apData?.data?.length ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {apData.data.map((a: any) => {
                const when = a.done_at
                  ? new Date(a.done_at).toLocaleTimeString("es-MX", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : null;
                const dateMark = a.done_at
                  ? new Date(a.done_at).toLocaleDateString("es-MX", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : null;

                return (
                  <div
                    key={a.id}
                    className="bg-white border border-neutral-100/50 rounded-[40px] p-8 shadow-sm hover:shadow-xl hover:shadow-obsidian/5 transition-all group border-l-4 border-l-amber-400"
                  >
                    <div className="flex items-start justify-between gap-4 mb-6">
                      <div className="min-w-0">
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-obsidian text-[10px] font-bold text-white uppercase tracking-widest mb-3">
                          <Zap className="h-3 w-3 text-gold-light" />
                          Revisión Pendiente
                        </div>
                        <h3 className="text-xl font-black text-obsidian tracking-tight truncate">
                          {a.task?.title ?? a.task_id}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-sm text-neutral-400">
                          <span className="font-bold text-obsidian">
                            @{a.empleado?.full_name?.split(" ")[0] ?? "Staff"}
                          </span>
                          <span>·</span>
                          <span className="text-xs">
                            {dateMark} a las {when}
                          </span>
                        </div>
                      </div>

                      <button
                        className="h-12 w-12 rounded-2xl bg-neutral-50 text-neutral-400 flex items-center justify-center hover:bg-obsidian hover:text-white transition-all group-hover:scale-110"
                        onClick={() => openEvidences(a.id, a.task_id)}
                      >
                        <Paperclip className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="bg-neutral-50/50 rounded-[28px] p-5 mb-8 border border-neutral-100/50">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="h-3.5 w-3.5 text-neutral-300" />
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                          Feedback del Empleado
                        </span>
                      </div>
                      <p
                        className={cx(
                          "text-sm text-obsidian/70 leading-relaxed font-medium italic",
                          !a.note && "text-neutral-300",
                        )}
                      >
                        {a.note
                          ? `"${a.note}"`
                          : "Sin comentarios adicionales."}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        className="h-12 rounded-2xl bg-emerald-500 text-white text-[11px] font-bold uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                        disabled={actionBusy === a.id}
                        onClick={() => doApprove(a.id)}
                      >
                        {actionBusy === a.id ? (
                          <Clock className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        Aprobar Entrega
                      </button>
                      <button
                        className="h-12 rounded-2xl bg-white border border-neutral-100 text-obsidian text-[11px] font-bold uppercase tracking-widest hover:bg-neutral-50 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        disabled={actionBusy === a.id}
                        onClick={() => openEvidences(a.id, a.task_id)}
                      >
                        <Eye className="h-4 w-4" />
                        Revisar Evidencia
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          {apData && apData.last_page > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8 pb-4">
              <button
                className="h-10 px-6 rounded-2xl border border-neutral-100 bg-white text-xs font-bold text-obsidian hover:bg-neutral-50 disabled:opacity-30 transition-all"
                disabled={apPage <= 1}
                onClick={() => setApPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </button>
              <span className="text-xs font-black text-neutral-400 uppercase tracking-widest">
                {apPage} / {apData.last_page}
              </span>
              <button
                className="h-10 px-6 rounded-2xl border border-neutral-100 bg-white text-xs font-bold text-obsidian hover:bg-neutral-50 disabled:opacity-30 transition-all"
                disabled={apPage >= apData.last_page}
                onClick={() =>
                  setApPage((p) => Math.min(apData.last_page, p + 1))
                }
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal de evidencias */}
      {evOpen ? (
        <div className="fixed inset-0 bg-obsidian/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in-fade">
          <div className="w-full max-w-2xl bg-white rounded-[40px] border border-neutral-100 overflow-hidden shadow-2xl animate-in-up">
            <div className="p-8 border-b border-neutral-50 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-obsidian tracking-tight">
                  Evidencias de Entrega
                </h2>
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">
                  Revisión de material cargado
                </p>
              </div>
              <button
                className="h-10 w-10 rounded-2xl border border-neutral-100 bg-white text-neutral-400 flex items-center justify-center hover:bg-neutral-50 hover:text-obsidian transition-all"
                onClick={() => {
                  setEvOpen(false);
                  setEvList(null);
                  setEvErr(null);
                  setEvChecklist(null);
                  setRejectNote("");
                }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {evLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-neutral-400">
                  <div className="h-10 w-10 border-4 border-neutral-100 border-t-obsidian rounded-full animate-spin" />
                  <span className="text-xs font-bold uppercase tracking-widest">
                    Cargando material...
                  </span>
                </div>
              ) : null}

              {evErr && (
                <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-sm text-rose-600 flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4" />
                  {evErr}
                </div>
              )}

              {!evLoading && !evErr && (evList?.length ?? 0) === 0 ? (
                <div className="text-center py-12">
                  <Paperclip className="h-12 w-12 text-neutral-100 mx-auto mb-4" />
                  <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest">
                    Sin evidencias adjuntas
                  </p>
                </div>
              ) : null}

              {!evLoading && !evErr && evList?.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {evList.map((e: any) => (
                    <div
                      key={e.id}
                      className="group relative border border-neutral-100 rounded-[28px] overflow-hidden bg-neutral-50 transition-all hover:bg-white hover:shadow-lg hover:shadow-obsidian/5"
                    >
                      {isImage(e.mime) ? (
                        <div className="aspect-square w-full overflow-hidden bg-neutral-200">
                          <img
                            src={e.url}
                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                            alt="Evidencia"
                            onError={(ev) => {
                              (ev.target as HTMLImageElement).src =
                                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56'%3E%3Crect width='56' height='56' fill='%23f5f5f5'/%3E%3Ctext x='50%25' y='55%25' text-anchor='middle' fill='%23999' font-size='12'%3E📷%3C/text%3E%3C/svg%3E";
                            }}
                          />
                        </div>
                      ) : (
                        <div className="aspect-square w-full flex flex-col items-center justify-center gap-2 bg-neutral-100 text-neutral-400">
                          <FileText className="h-8 w-8" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">
                            Documento
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-obsidian/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <a
                          href={e.url}
                          target="_blank"
                          rel="noreferrer"
                          className="h-10 w-10 rounded-xl bg-white text-obsidian flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                        >
                          <Download className="h-5 w-5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {evChecklist?.state &&
              Object.keys(evChecklist.state).length > 0 ? (
                <div className="mt-8 pt-8 border-t border-neutral-50">
                  <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-4">
                    Checklist del Empleado
                  </h4>
                  <div className="space-y-3">
                    {Object.entries(evChecklist.state).map(
                      ([itemId, val]: [string, any]) => {
                        const defItem = evChecklist.def?.find(
                          (d: any) => d.id === itemId,
                        );
                        const label = defItem?.label ?? itemId;
                        const required = defItem?.required ?? false;

                        return (
                          <div
                            key={itemId}
                            className={cx(
                              "flex items-center gap-4 rounded-2xl border p-4 transition-all",
                              val.done
                                ? "bg-emerald-50/50 border-emerald-100"
                                : "bg-neutral-50/50 border-neutral-100",
                            )}
                          >
                            <div
                              className={cx(
                                "h-6 w-6 rounded-lg flex items-center justify-center shrink-0",
                                val.done
                                  ? "bg-emerald-500 text-white"
                                  : "bg-neutral-200 text-neutral-400 shadow-inner",
                              )}
                            >
                              <Check className="h-3.5 w-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-bold text-obsidian truncate">
                                {label}
                                {required && (
                                  <span className="ml-2 text-[8px] px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-500 border border-rose-100 uppercase tracking-wider">
                                    Required
                                  </span>
                                )}
                              </div>
                              {val.at && (
                                <div className="text-[10px] text-neutral-400 mt-0.5">
                                  Completado el{" "}
                                  {new Date(val.at).toLocaleString()}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="p-8 bg-neutral-50 border-t border-neutral-100 space-y-6">
              <div>
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2 block ml-1">
                  Nota de resolución
                </label>
                <textarea
                  className="w-full h-24 rounded-2xl border border-neutral-200 bg-white p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-obsidian/5 placeholder:text-neutral-300 resize-none"
                  placeholder="Escribe un comentario si vas a rechazar la tarea..."
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                />
              </div>

              <div className="flex gap-4">
                <button
                  className="flex-1 h-14 rounded-2xl bg-obsidian text-white text-[11px] font-bold uppercase tracking-widest hover:bg-gold transition-all shadow-lg shadow-obsidian/10 disabled:opacity-50 flex items-center justify-center gap-2"
                  disabled={!evAssignmentId || actionBusy === evAssignmentId}
                  onClick={() => evAssignmentId && doApprove(evAssignmentId)}
                >
                  <CheckCircle2 className="h-5 w-5" />
                  Aprobar Entrega
                </button>
                <button
                  className="flex-1 h-14 rounded-2xl bg-white border border-rose-100 text-rose-500 text-[11px] font-bold uppercase tracking-widest hover:bg-rose-50 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  disabled={!evAssignmentId || actionBusy === evAssignmentId}
                  onClick={() => evAssignmentId && doReject(evAssignmentId)}
                >
                  <Trash2 className="h-5 w-5" />
                  Rechazar
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
