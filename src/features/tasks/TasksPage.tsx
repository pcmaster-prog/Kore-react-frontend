import { useEffect, useMemo, useState } from "react";
import {
  listTasks,
  updateTaskStatus,
  listPendingApprovals,
  approveAssignment,
  rejectAssignment,
} from "./api";
import { getTemplate } from "@/features/tasks/catalog/api";
import type { Employee } from "./employeeApi";
import { listEmployees } from "./employeeApi";
import TaskCatalogPanel from "./TaskCatalogPanel";
import TaskFiltersBar from "./TaskFiltersBar";
import TaskTable from "./TaskTable";
import TaskMetricsPanel from "./TaskMetricsPanel";
import ApprovalsPanel from "./ApprovalsPanel";
import EvidenceModal from "./EvidenceModal";
import type {
  EmployeeOption,
  EvChecklist,
  ExtendedPendingApproval,
  ExtendedTask,
  TasksListData,
  ChecklistItemState,
} from "./tasks.types";

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
  const [empleadoId, setEmpleadoId] = useState<string>("");
  const [priority, setPriority] = useState<string>("");

  const [empleados, setEmpleados] = useState<EmployeeOption[]>([]);
  const [showCatalog, setShowCatalog] = useState(false);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<TasksListData | null>(null);

  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const handleNewTask = () => setShowCatalog((s) => !s);
    window.addEventListener("kore-new-task", handleNewTask);
    listEmployees()
      .then((res) => {
        const arr: Employee[] = Array.isArray(res) ? res : [];
        setEmpleados(
          arr.map((e) => ({ id: e.id, full_name: e.full_name, name: e.name })),
        );
      })
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
    if (priority) p.priority = priority;
    return p;
  }, [page, status, date, search, overdue, empleadoId, priority, reloadKey]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await listTasks(params);
        if (!alive) return;
        setData({
          data: res.data as ExtendedTask[],
          total: res.total,
          last_page: res.last_page,
          last_7_days: (res as unknown as { last_7_days?: number[] }).last_7_days,
          effectiveness: (res as unknown as { effectiveness?: number }).effectiveness,
        });
      } catch (e: unknown) {
        if (!alive) return;
        const msg =
          (e as { response?: { data?: { message?: string } } })?.response?.data
            ?.message ?? "Error cargando tareas";
        setErr(msg);
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
  }, [status, date, overdue, search, priority]);

  async function quickSetStatus(
    taskId: string,
    next: "open" | "in_progress" | "completed",
  ) {
    setErr(null);
    setBusyId(taskId);

    const previousData = data;
    if (data) {
      setData({
        ...data,
        data: data.data.map((t) =>
          t.id === taskId ? { ...t, status: next } : t,
        ),
      });
    }

    try {
      await updateTaskStatus(taskId, next);
      const res = await listTasks(params);
      setData({
        data: res.data as ExtendedTask[],
        total: res.total,
        last_page: res.last_page,
        last_7_days: (res as unknown as { last_7_days?: number[] }).last_7_days,
        effectiveness: (res as unknown as { effectiveness?: number }).effectiveness,
      });
    } catch (e: unknown) {
      if (previousData) setData(previousData);
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "No se pudo actualizar el status";
      setErr(msg);
    } finally {
      setBusyId(null);
    }
  }

  async function handleReload(taskId: string) {
    setBusyId(taskId);
    setReloadKey((k) => k + 1);
    await new Promise((r) => setTimeout(r, 800));
    setBusyId(null);
  }

  // ===== APROBACIONES =====
  const [apPage, setApPage] = useState(1);
  const [apLoading, setApLoading] = useState(false);
  const [apErr, setApErr] = useState<string | null>(null);
  const [apData, setApData] = useState<{
    data: ExtendedPendingApproval[];
    total: number;
    last_page: number;
  } | null>(null);

  // modal evidencias
  const [evOpen, setEvOpen] = useState(false);
  const [evAssignmentId, setEvAssignmentId] = useState<string | null>(null);
  const [evTaskId, setEvTaskId] = useState<string | null>(null);
  const [evChecklist, setEvChecklist] = useState<EvChecklist | null>(null);
  const [actionBusy, setActionBusy] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setApLoading(true);
      setApErr(null);
      try {
        const res = await listPendingApprovals({ page: apPage });
        if (!alive) return;
        setApData({
          data: (res.data ?? []) as ExtendedPendingApproval[],
          total: res.total,
          last_page: res.last_page,
        });
      } catch (e: unknown) {
        if (!alive) return;
        const msg =
          (e as { response?: { data?: { message?: string } } })?.response?.data
            ?.message ?? "Error cargando aprobaciones";
        setApErr(msg);
      } finally {
        if (alive) setApLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [apPage]);

  async function handleOpenEvidences(assignmentId: string, taskId: string) {
    setEvAssignmentId(assignmentId);
    setEvTaskId(taskId);
    setEvOpen(true);
    setEvChecklist(null);

    if (!assignmentId || !apData) return;

    const assignment = apData.data.find((a) => a.id === assignmentId);
    const checklistState =
      (assignment?.meta?.checklist as Record<string, ChecklistItemState> | null) ??
      null;
    const templateId = (
      assignment?.task?.meta as Record<string, unknown> | undefined
    )?.template_id as string | undefined;

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
        setEvChecklist({ def: [], state: checklistState });
      }
    }
  }

  async function doApprove(assignmentId: string) {
    setActionBusy(assignmentId);
    setApErr(null);

    const previousApData = apData;
    if (apData) {
      setApData({
        ...apData,
        data: apData.data.filter((a) => a.id !== assignmentId),
        total: Math.max(0, apData.total - 1),
      });
    }

    try {
      await approveAssignment(assignmentId);
      const res = await listPendingApprovals({ page: apPage });
      setApData({
        data: (res.data ?? []) as ExtendedPendingApproval[],
        total: res.total,
        last_page: res.last_page,
      });
      if (evOpen && evAssignmentId === assignmentId) {
        setEvOpen(false);
      }
    } catch (e: unknown) {
      if (previousApData) setApData(previousApData);
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "No se pudo aprobar";
      setApErr(msg);
    } finally {
      setActionBusy(null);
    }
  }

  async function doReject(assignmentId: string, note: string) {
    if (!note.trim()) {
      setApErr("Escribe una nota para rechazar.");
      return;
    }

    setActionBusy(assignmentId);
    setApErr(null);

    const previousApData = apData;
    if (apData) {
      setApData({
        ...apData,
        data: apData.data.filter((a) => a.id !== assignmentId),
        total: Math.max(0, apData.total - 1),
      });
    }

    try {
      await rejectAssignment(assignmentId, note);
      const res = await listPendingApprovals({ page: apPage });
      setApData({
        data: (res.data ?? []) as ExtendedPendingApproval[],
        total: res.total,
        last_page: res.last_page,
      });
      if (evOpen && evAssignmentId === assignmentId) {
        setEvOpen(false);
      }
    } catch (e: unknown) {
      if (previousApData) setApData(previousApData);
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "No se pudo rechazar";
      setApErr(msg);
    } finally {
      setActionBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      {tab === "tareas" ? (
        <div className="space-y-6 animate-in-fade">
          <TaskFiltersBar
            status={status}
            onStatusChange={setStatus}
            empleadoId={empleadoId}
            onEmpleadoIdChange={setEmpleadoId}
            empleados={empleados}
            search={search}
            onSearchChange={setSearch}
            overdue={overdue}
            onOverdueChange={setOverdue}
            date={date}
            onDateChange={setDate}
            priority={priority}
            onPriorityChange={setPriority}
            totalTasks={data?.total ?? 0}
            pendingApprovalsCount={apData?.total ?? 0}
            onGotoAprobaciones={() => setTab("aprobaciones")}
          />

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

          <TaskTable
            loading={loading}
            error={err}
            data={data}
            busyId={busyId}
            onQuickSetStatus={quickSetStatus}
            onReload={handleReload}
            onOpenEvidences={(taskId) => handleOpenEvidences("", taskId)}
            page={page}
            onPageChange={setPage}
          />

          <TaskMetricsPanel data={data} />
        </div>
      ) : (
        <ApprovalsPanel
          loading={apLoading}
          error={apErr}
          data={apData}
          page={apPage}
          onPageChange={setApPage}
          onReload={() => setApPage(1)}
          onBack={() => setTab("tareas")}
          actionBusy={actionBusy}
          onApprove={doApprove}
          onOpenEvidences={handleOpenEvidences}
        />
      )}

      <EvidenceModal
        assignmentId={evAssignmentId}
        taskId={evTaskId}
        open={evOpen}
        actionBusy={actionBusy}
        checklist={evChecklist}
        onClose={() => {
          setEvOpen(false);
          setEvAssignmentId(null);
          setEvTaskId(null);
          setEvChecklist(null);
        }}
        onApprove={doApprove}
        onReject={doReject}
      />
    </div>
  );
}
