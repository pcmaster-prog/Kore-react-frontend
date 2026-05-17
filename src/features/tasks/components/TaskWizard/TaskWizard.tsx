import { useEffect, useMemo, useState } from "react";
import {
  bulkAssignFromCatalog,
  createTask,
  assignTask,
  getCatalog,
  type CatalogResponse,
} from "../../api";
import { listEmployees } from "../../employeeApi";
import {
  assignRoutine,
  listActiveRoutines,
  type Routine,
} from "../../routinesApi";
import { listTemplates } from "../../catalog/api";
import { getSupervisorDashboard } from "@/features/dashboard/api";
import type { EmployeeWorkload } from "@/features/dashboard/types";
import { useAuthStore } from "@/features/auth/authStore";
import { ArrowRight, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import Stepper from "./Stepper";
import StepWhat, { type AssignMode } from "./StepWhat";
import StepWho from "./StepWho";
import StepSummary from "./StepSummary";

interface TaskWizardProps {
  onAssigned: () => void;
  onClose: () => void;
}

const STEPS = [
  { label: "¿Qué?" },
  { label: "¿A quién?" },
  { label: "Confirmar" },
];

export default function TaskWizard({ onAssigned, onClose }: TaskWizardProps) {
  const today = new Date().toISOString().slice(0, 10);
  const user = useAuthStore((s) => s.user);
  const isSupervisor = user?.role === "supervisor";
  const userSection = user?.section ?? null;

  // Step & mode
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<AssignMode>("adhoc");

  // Data loading
  const [catalog, setCatalog] = useState<CatalogResponse["catalog"]>([]);
  const [sectionTemplates, setSectionTemplates] = useState<CatalogResponse["catalog"]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [employees, setEmployees] = useState<EmployeeWorkload[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [dataErr, setDataErr] = useState<string | null>(null);

  // Selections
  const [date, setDate] = useState(today);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);
  const [selectedEmpleadoIds, setSelectedEmpleadoIds] = useState<string[]>([]);
  const [routineId, setRoutineId] = useState<string>("");

  // Ad-hoc fields
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [newEstMin, setNewEstMin] = useState("");

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  // Load catalog, employees, routines, workload
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoadingData(true);
      setDataErr(null);
      try {
        const promises: any[] = [
          getCatalog(date),
          listEmployees(),
          listActiveRoutines(),
          getSupervisorDashboard().catch(() => null),
        ];
        // If supervisor with section, also fetch all templates for that section
        if (isSupervisor && userSection) {
          promises.push(
            listTemplates({ active: true }).catch(() => ({ data: [] }))
          );
        }
        const [catRes, empRes, rutRes, dashRes, tplRes] = await Promise.all(promises);
        if (!alive) return;

        const catRaw = (catRes as CatalogResponse).catalog || [];
        // Filter catalog by supervisor section
        const filteredCatalog = isSupervisor && userSection
          ? catRaw.filter((it) => (it.template as any).section === userSection)
          : catRaw;

        // Build section templates list
        let secTemplates: CatalogResponse["catalog"] = [];
        if (isSupervisor && userSection && tplRes) {
          const allTemplates = Array.isArray(tplRes) ? tplRes : (tplRes.data ?? []);
          secTemplates = allTemplates
            .filter((tmpl: any) => (tmpl.section ?? tmpl.meta?.section) === userSection)
            .map((tmpl: any) => ({
              routine_item_id: `sec_${tmpl.id}`,
              routine_id: "section",
              template: tmpl,
              sort_order: 0,
            }));
        }

        const e = Array.isArray(empRes)
          ? empRes
          : (empRes as { data?: any[] }).data || [];
        const filteredEmps = e.filter(
          (x: any) => x.role === "empleado" || !x.role
        );

        // Merge basic employees with workload data if available
        const workloadMap = new Map<string, EmployeeWorkload>();
        if (dashRes?.workload) {
          dashRes.workload.forEach((w: EmployeeWorkload) => {
            workloadMap.set(w.empleado_id, w);
          });
        }

        const mergedEmps: EmployeeWorkload[] = filteredEmps.map((emp: any) => {
          const wl = workloadMap.get(emp.id);
          if (wl) return wl;
          return {
            empleado_id: emp.id,
            full_name:
              emp.full_name || emp.name || emp.nombre || emp.email || "Empleado",
            position_title: emp.position_title || null,
            avatar_url: emp.avatar_url || null,
            total_minutes: 0,
            total_hours: 0,
            task_count: 0,
            workload_level: "bajo" as const,
            assignments: [],
          };
        });

        setCatalog(filteredCatalog);
        setSectionTemplates(secTemplates);
        setRoutines(rutRes);
        setRoutineId((prev) => prev || (rutRes?.[0]?.id ?? ""));
        setEmployees(mergedEmps);
        setSelectedTemplateIds([]);
      } catch (e: any) {
        if (!alive) return;
        setDataErr(e?.response?.data?.message ?? "No se pudo cargar los datos.");
      } finally {
        if (alive) setLoadingData(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [date]);

  // Derived validation
  const canGoNext = useMemo(() => {
    if (step === 1) {
      if (mode === "adhoc") return newTitle.trim().length >= 3;
      if (mode === "catalog" || mode === "section") return selectedTemplateIds.length > 0;
      if (mode === "routine") return !!routineId;
      return false;
    }
    if (step === 2) return selectedEmpleadoIds.length > 0;
    return true;
  }, [step, mode, newTitle, selectedTemplateIds, routineId, selectedEmpleadoIds]);

  const totalTaskMinutes = useMemo(() => {
    if (mode === "adhoc") return Number(newEstMin) || 0;
    if (mode === "catalog") {
      const items = catalog.filter((it) =>
        selectedTemplateIds.includes(it.template.id)
      );
      if (items.length === 0) return 0;
      return items.reduce((acc, it) => {
        const m =
          (it.template as any).estimated_minutes ??
          it.template.meta?.estimated_minutes ??
          0;
        return acc + m;
      }, 0);
    }
    return 0;
  }, [mode, newEstMin, catalog, selectedTemplateIds]);

  // Handlers
  function toggleTemplate(id: string) {
    setSelectedTemplateIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleEmpleado(id: string) {
    setSelectedEmpleadoIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function selectAllEmpleados() {
    setSelectedEmpleadoIds(employees.map((e) => e.empleado_id));
  }

  function clearEmpleados() {
    setSelectedEmpleadoIds([]);
  }

  async function handleSubmit() {
    setErr(null);
    setErr(null);
    setSubmitting(true);

    try {
      if (mode === "adhoc") {
        const est = newEstMin.trim() ? Number(newEstMin) : undefined;
        const created = await createTask({
          title: newTitle.trim(),
          description: newDesc.trim() || undefined,
          priority: newPriority,
          catalog_date: date,
          estimated_minutes: est,
        });
        await assignTask(created.item.id, {
          empleado_ids: selectedEmpleadoIds,
        });
      } else if (mode === "catalog" || mode === "section") {
        await bulkAssignFromCatalog({
          date,
          template_ids: selectedTemplateIds,
          empleado_ids: selectedEmpleadoIds,
          allow_duplicate: false,
        });
      } else if (mode === "routine") {
        await assignRoutine(routineId, {
          date,
          empleado_ids: selectedEmpleadoIds,
          allow_duplicate: false,
        });
      }

      // success handled by notification
      window.dispatchEvent(
        new CustomEvent("kore-notification", {
          detail: {
            title: "Asignación exitosa",
            body: `Se asignó correctamente a ${selectedEmpleadoIds.length} empleado(s).`,
          },
        })
      );
      setTimeout(onAssigned, 800);
    } catch (e: any) {
      const message =
        e?.response?.data?.message ?? "Error al procesar la asignación.";
      setErr(message);
      window.dispatchEvent(
        new CustomEvent("kore-notification", {
          detail: {
            title: "Error en asignación",
            body: message,
          },
        })
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Content per step
  function renderStep() {
    if (loadingData) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-k-text-b">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-300" />
          <span className="text-[11px] font-bold uppercase tracking-widest">
            Cargando datos...
          </span>
        </div>
      );
    }

    if (dataErr) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-6">
          <div className="h-12 w-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center">
            <span className="text-lg">⚠️</span>
          </div>
          <p className="text-sm font-bold text-rose-700">{dataErr}</p>
          <button
            onClick={() => window.location.reload()}
            className="h-10 px-5 rounded-2xl bg-k-bg-card border border-k-border text-xs font-bold uppercase tracking-widest hover:bg-k-bg-card2 transition"
          >
            Reintentar
          </button>
        </div>
      );
    }

    if (step === 1) {
      return (
        <StepWhat
          mode={mode}
          onModeChange={setMode}
          newTitle={newTitle}
          onTitleChange={setNewTitle}
          newDesc={newDesc}
          onDescChange={setNewDesc}
          newPriority={newPriority}
          onPriorityChange={setNewPriority}
          newEstMin={newEstMin}
          onEstMinChange={setNewEstMin}
          date={date}
          onDateChange={setDate}
          catalog={catalog}
          selectedTemplateIds={selectedTemplateIds}
          onToggleTemplate={toggleTemplate}
          onSelectAllTemplates={() => {
            const source = mode === "section" ? sectionTemplates : catalog;
            setSelectedTemplateIds(source.map((x) => x.template.id));
          }}
          routines={routines}
          routineId={routineId}
          onRoutineChange={setRoutineId}
          sectionTemplates={sectionTemplates}
          isSupervisor={isSupervisor}
          userSection={userSection}
        />
      );
    }

    if (step === 2) {
      return (
        <StepWho
          employees={employees}
          selectedIds={selectedEmpleadoIds}
          onToggle={toggleEmpleado}
          onSelectAll={selectAllEmpleados}
          onClear={clearEmpleados}
          totalTaskMinutes={totalTaskMinutes}
        />
      );
    }

    return (
      <StepSummary
        mode={mode}
        date={date}
        newTitle={newTitle}
        newDesc={newDesc}
        newPriority={newPriority}
        newEstMin={newEstMin}
        catalog={catalog}
        selectedTemplateIds={selectedTemplateIds}
        routines={routines}
        routineId={routineId}
        selectedEmpleadoIds={selectedEmpleadoIds}
        employees={employees}
        err={err}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Stepper step={step} steps={STEPS} />

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        {renderStep()}
      </div>

      {/* Footer actions */}
      <div className="p-6 border-t border-k-border bg-k-bg-card2/50 shrink-0">
        <div className="flex gap-3">
          {step > 1 ? (
            <button
              type="button"
              disabled={submitting}
              onClick={() => {
                setErr(null);
                setStep((s) => s - 1);
              }}
              className="flex-1 py-4 bg-k-bg-card border border-k-border rounded-2xl text-[11px] font-black uppercase tracking-widest text-k-text-b hover:text-k-text-h hover:bg-k-bg-card2 hover:border-neutral-300 transition-all shadow-k-card flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Atrás
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-k-bg-card border border-k-border rounded-2xl text-[11px] font-black uppercase tracking-widest text-k-text-b hover:text-k-text-h hover:bg-k-bg-card2 hover:border-neutral-300 transition-all shadow-k-card"
            >
              Cancelar
            </button>
          )}

          {step < 3 ? (
            <button
              disabled={!canGoNext || loadingData}
              onClick={() => {
                setErr(null);
                setStep((s) => s + 1);
              }}
              className="flex-[2] flex items-center justify-center gap-2 py-4 bg-k-accent-btn rounded-2xl text-[11px] font-black uppercase tracking-widest text-k-accent-btn-text hover:opacity-90 transition-all shadow-k-card disabled:opacity-50"
            >
              Siguiente
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              disabled={submitting || !canGoNext}
              onClick={handleSubmit}
              className="flex-[2] flex items-center justify-center gap-2 py-4 bg-k-accent-btn rounded-2xl text-[11px] font-black uppercase tracking-widest text-k-accent-btn-text hover:opacity-90 transition-all shadow-k-card disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Confirmar y Asignar
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
