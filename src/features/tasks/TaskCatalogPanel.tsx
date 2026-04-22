import { useEffect, useMemo, useState } from "react";
import {
  bulkAssignFromCatalog,
  createTask,
  assignTask,
  getCatalog,
  type CatalogResponse,
} from "./api";
import { listEmployees } from "./employeeApi";
import { assignRoutine, listActiveRoutines, type Routine } from "./routinesApi";
import {
  X,
  Calendar,
  Clock,
  ArrowRight,
  CheckCircle2,
  Search,
} from "lucide-react";
import { isEnabled } from "@/lib/featureFlags";

type CatalogApiItem = CatalogResponse["catalog"][number];

type Employee = {
  id: string;
  name?: string;
  nombre?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: string;
};

function PriorityBadge({ p }: { p?: string }) {
  const label = (p ?? "-").toLowerCase();
  const cls =
    label === "urgent"
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : label === "high"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : label === "low"
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-neutral-50 text-neutral-700 border-neutral-200";

  return (
    <span
      className={`inline-flex items-center rounded-[8px] border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${cls}`}
    >
      {p ?? "-"}
    </span>
  );
}

export default function TaskCatalogPanel({
  onAssigned,
  onClose,
}: {
  onAssigned: () => void;
  onClose: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);

  const [catalog, setCatalog] = useState<CatalogApiItem[]>([]);
  const [emps, setEmps] = useState<Employee[]>([]);

  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);
  const [selectedEmps, setSelectedEmps] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [routineId, setRoutineId] = useState<string>("");
  const [assigningRoutine, setAssigningRoutine] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState<string>("medium");
  const [newEstMin, setNewEstMin] = useState<string>("");
  const [creating, setCreating] = useState(false);

  // New states for the UI
  const [tab, setTab] = useState<"adhoc" | "catalog">("adhoc");
  const [empSearch, setEmpSearch] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      setErr(null);
      setMsg(null);
      try {
        const [catRes, empRes, rutRes] = await Promise.all([
          getCatalog(date),
          listEmployees(),
          listActiveRoutines(),
        ]);
        if (!alive) return;

        const catRaw = (catRes as CatalogResponse).catalog || [];
        const e = Array.isArray(empRes)
          ? empRes
          : (empRes as { data?: Employee[] }).data || [];

        const filteredEmps = e.filter(
          (x: any) => x.role === "empleado" || !x.role,
        );

        setCatalog(catRaw);
        setEmps(filteredEmps);
        setSelectedTemplateIds([]);

        setRoutines(rutRes);
        setRoutineId((prev) => prev || (rutRes?.[0]?.id ?? ""));
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.response?.data?.message ?? "No se pudo cargar el catálogo.");
      }
    })();
    return () => {
      alive = false;
    };
  }, [date]);

  const allEmpIds = useMemo(() => emps.map((x) => x.id), [emps]);
  const filteredEmpsList = useMemo(() => {
    if (!empSearch.trim()) return emps;
    const lower = empSearch.toLowerCase();
    return emps.filter((e) => {
      const label =
        e.full_name || e.name || e.nombre || e.first_name || e.email || e.id;
      return label.toLowerCase().includes(lower);
    });
  }, [emps, empSearch]);

  async function assign() {
    setMsg(null);
    setErr(null);

    if (selectedTemplateIds.length === 0) {
      setErr("Selecciona al menos 1 tarea del catálogo.");
      return;
    }
    if (selectedEmps.length === 0) {
      setErr("Selecciona al menos 1 empleado.");
      return;
    }

    setLoading(true);
    try {
      await bulkAssignFromCatalog({
        date,
        template_ids: selectedTemplateIds,
        empleado_ids: selectedEmps,
        allow_duplicate: false,
      });
      setMsg(
        `Ya se aplicó esta asignación a ${selectedEmps.length} empleado(s) ✅`,
      );
      setTimeout(onAssigned, 1000);
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "Error en asignación.");
    } finally {
      setLoading(false);
    }
  }

  async function assignSelectedRoutine() {
    setMsg(null);
    setErr(null);

    if (!routineId) {
      setErr("Selecciona una rutina.");
      return;
    }
    if (selectedEmps.length === 0) {
      setErr("Selecciona al menos 1 empleado.");
      return;
    }

    setAssigningRoutine(true);
    try {
      await assignRoutine(routineId, {
        date,
        empleado_ids: selectedEmps,
        allow_duplicate: false,
      });
      setMsg(
        `Ya se aplicó esta asignación a ${selectedEmps.length} empleado(s) ✅`,
      );
      setTimeout(onAssigned, 1000);
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "No se pudo asignar la rutina.");
    } finally {
      setAssigningRoutine(false);
    }
  }

  async function createAndAssignAdhoc() {
    setMsg(null);
    setErr(null);

    if (!newTitle.trim()) {
      setErr("Pon un título para la tarea rápida.");
      return;
    }
    if (selectedEmps.length === 0) {
      setErr("Selecciona al menos 1 empleado.");
      return;
    }

    const est = newEstMin.trim() ? Number(newEstMin) : undefined;
    if (newEstMin.trim() && (!Number.isFinite(est) || est! <= 0)) {
      setErr("Estimación debe ser un número válido.");
      return;
    }

    setCreating(true);
    try {
      const created = await createTask({
        title: newTitle.trim(),
        description: newDesc.trim() || undefined,
        priority: newPriority,
        catalog_date: date,
        estimated_minutes: est,
      });

      await assignTask(created.item.id, { empleado_ids: selectedEmps });

      setMsg(
        `Ya se aplicó esta asignación a ${selectedEmps.length} empleado(s) ✅`,
      );
      setNewTitle("");
      setNewDesc("");
      setNewEstMin("");
      setTimeout(onAssigned, 1000);
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "Error creando tarea.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-obsidian/40 backdrop-blur-sm transition-all"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] bg-white h-full shadow-2xl flex flex-col animate-in-slide-left pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-neutral-100 flex items-center justify-between shrink-0 bg-neutral-50/50">
          <div>
            <h2 className="text-xl font-black text-obsidian tracking-tight">
              Nueva Tarea
            </h2>
            <p className="text-xs font-medium text-neutral-400 mt-1">
              Configura y asigna trabajo a tu equipo
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="h-10 w-10 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-neutral-400 hover:text-obsidian hover:bg-neutral-50 hover:border-neutral-300 transition-colors shadow-sm"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-8 py-4 border-b border-neutral-100 shrink-0">
          <div className="flex bg-neutral-100 p-1.5 rounded-[20px]">
            <button
              onClick={() => setTab("adhoc")}
              className={`flex-1 py-2 text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all ${
                tab === "adhoc"
                  ? "bg-white text-obsidian shadow-sm shadow-black/5"
                  : "text-neutral-400 hover:text-obsidian"
              }`}
            >
              Tarea Rápida
            </button>
            <button
              onClick={() => setTab("catalog")}
              className={`flex-1 py-2 text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all ${
                tab === "catalog"
                  ? "bg-white text-obsidian shadow-sm shadow-black/5"
                  : "text-neutral-400 hover:text-obsidian"
              }`}
            >
              Catálogo / Rutina
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          {/* Alertas */}
          {err && (
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-sm text-rose-700 animate-in-shake">
              {err}
            </div>
          )}
          {msg && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-sm text-emerald-700 font-bold flex items-center gap-2 animate-in-fade">
              <CheckCircle2 className="h-4 w-4" />
              {msg}
            </div>
          )}

          {tab === "adhoc" ? (
            <div className="space-y-6 animate-in-fade">
              <div className="space-y-4">
                <label className="block">
                  <span className="block text-[11px] font-bold uppercase tracking-widest text-neutral-400 mb-2">
                    Título de la tarea
                  </span>
                  <input
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-obsidian/10 transition-shadow"
                    placeholder="Ej. Limpiar el congelador N°3"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </label>

                <label className="block">
                  <span className="block text-[11px] font-bold uppercase tracking-widest text-neutral-400 mb-2">
                    Descripción (Opcional)
                  </span>
                  <textarea
                    rows={2}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-obsidian/10 transition-shadow resize-none"
                    placeholder="Instrucciones breves..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                  />
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="block text-[11px] font-bold uppercase tracking-widest text-neutral-400 mb-2">
                      Prioridad
                    </span>
                    <select
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-obsidian/10 transition-shadow appearance-none cursor-pointer"
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value)}
                    >
                      <option value="low">Baja</option>
                      <option value="medium">Media</option>
                      <option value="high">Alta</option>
                      <option value="urgent">Urgente</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="block text-[11px] font-bold uppercase tracking-widest text-neutral-400 mb-2">
                      Minutos Est.
                    </span>
                    {isEnabled("newTaskModal") ? (
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { val: "15", label: "15m" },
                          { val: "30", label: "30m" },
                          { val: "60", label: "1h" },
                          { val: "120", label: "2h" },
                        ].map((t) => (
                          <button
                            key={t.val}
                            type="button"
                            onClick={() => setNewEstMin(t.val)}
                            className={`py-3 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all ${
                              newEstMin === t.val
                                ? "bg-obsidian text-white shadow-md shadow-obsidian/20"
                                : "bg-neutral-50 border border-neutral-200 text-neutral-500 hover:border-neutral-300 hover:bg-white"
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <input
                        type="number"
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-obsidian/10 transition-shadow"
                        placeholder="Ej. 15"
                        value={newEstMin}
                        onChange={(e) => setNewEstMin(e.target.value)}
                      />
                    )}
                  </label>
                </div>
                {isEnabled("newTaskModal") && newEstMin && selectedEmps.length > 0 && (
                  <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-4 animate-in-fade flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl bg-white flex items-center justify-center text-indigo-500 shadow-sm shrink-0">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                        Carga Estimada
                      </p>
                      <p className="text-xs font-medium text-indigo-700 mt-0.5">
                        Esta tarea ocupará <span className="font-bold">{Number(newEstMin) * selectedEmps.length} min</span> en total ({newEstMin}m × {selectedEmps.length} personas).
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in-fade">
              {/* Contexto de Fecha */}
              <label className="block">
                <span className="block text-[11px] font-bold uppercase tracking-widest text-neutral-400 mb-2 flex items-center gap-2">
                  <Calendar className="h-3 w-3" /> Fecha de Asignación
                </span>
                <input
                  type="date"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-obsidian/10 transition-shadow appearance-none cursor-pointer"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </label>

              {/* Rutinas Dropdown */}
              <div className="p-5 bg-white border border-neutral-200 rounded-3xl shadow-sm space-y-4">
                <span className="block text-[11px] font-bold uppercase tracking-widest text-neutral-400">
                  Asignar una Rutina Completa
                </span>
                <div className="flex gap-2">
                  <select
                    className="flex-1 bg-neutral-50 border border-neutral-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-obsidian/10 transition-shadow appearance-none cursor-pointer disabled:opacity-50"
                    value={routineId}
                    onChange={(e) => setRoutineId(e.target.value)}
                    disabled={routines.length === 0}
                  >
                    {routines.length === 0 ? (
                      <option value="">Sin rutinas activas</option>
                    ) : (
                      routines.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))
                    )}
                  </select>
                  <button
                    disabled={
                      assigningRoutine ||
                      routines.length === 0 ||
                      selectedEmps.length === 0
                    }
                    onClick={assignSelectedRoutine}
                    className="px-4 rounded-2xl bg-neutral-100 text-obsidian font-bold text-xs uppercase tracking-widest hover:bg-neutral-200 disabled:opacity-40 transition-colors"
                  >
                    Asignar
                  </button>
                </div>
              </div>

              {/* Catálogo List */}
              <div className="p-5 bg-white border border-neutral-200 rounded-3xl shadow-sm flex flex-col h-[280px]">
                <div className="flex items-center justify-between mb-4">
                  <span className="block text-[11px] font-bold uppercase tracking-widest text-neutral-400">
                    Catálogo Ad-hoc
                  </span>
                  {catalog.length > 0 && (
                    <button
                      className="text-[9px] font-bold uppercase tracking-widest text-obsidian bg-neutral-100 hover:bg-neutral-200 px-2 py-1 rounded-md transition"
                      onClick={() =>
                        setSelectedTemplateIds(
                          catalog.map((x) => x.template.id),
                        )
                      }
                    >
                      Seleccionar Todo
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                  {catalog.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-neutral-400 font-medium pb-4">
                      No hay tareas para esta fecha.
                    </div>
                  ) : (
                    catalog.map((it) => {
                      const t = it.template;
                      const reactKey =
                        it.routine_item_id ?? `${it.routine_id}-${t.id}`;
                      const selected = selectedTemplateIds.includes(t.id);
                      return (
                        <label
                          key={reactKey}
                          className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-colors ${selected ? "bg-obsidian/5 border-obsidian/20" : "bg-white border-neutral-100 hover:border-neutral-200"}`}
                        >
                          <input
                            type="checkbox"
                            className="mt-1 accent-obsidian"
                            checked={selected}
                            onChange={(e) =>
                              setSelectedTemplateIds((p) =>
                                e.target.checked
                                  ? [...p, t.id]
                                  : p.filter((x) => x !== t.id),
                              )
                            }
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-sm font-bold text-obsidian line-clamp-2 leading-tight">
                                {t.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <PriorityBadge p={t.priority} />
                              <span className="text-[10px] font-bold text-neutral-400 flex items-center gap-1">
                                <Clock className="h-3 w-3" />{" "}
                                {(t as any).estimated_minutes ??
                                  t.meta?.estimated_minutes ??
                                  "--"}
                                m
                              </span>
                            </div>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Selector Universal de Empleados */}
          <div className="pt-6 border-t border-neutral-100">
            <div className="flex items-center justify-between mb-4">
              <span className="block text-[11px] font-bold uppercase tracking-widest text-neutral-400">
                Asignar a...
              </span>
              <div className="flex gap-2">
                <button
                  className="text-[9px] font-bold uppercase tracking-widest text-obsidian bg-neutral-100 hover:bg-neutral-200 px-2 py-1 rounded-md transition"
                  onClick={() => setSelectedEmps(allEmpIds)}
                >
                  Todos
                </button>
                <button
                  className="text-[9px] font-bold uppercase tracking-widest text-rose-600 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded-md transition"
                  onClick={() => setSelectedEmps([])}
                >
                  Limpiar
                </button>
              </div>
            </div>

            <div className="relative mb-3">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-obsidian/10 transition-shadow"
                placeholder="Buscar empleado..."
                value={empSearch}
                onChange={(e) => setEmpSearch(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2 max-h-[160px] overflow-y-auto custom-scrollbar content-start">
              {filteredEmpsList.map((e) => {
                const label =
                  e.first_name ||
                  e.nombre ||
                  e.full_name ||
                  e.name ||
                  e.email ||
                  "Empleado";
                const selected = selectedEmps.includes(e.id);
                return (
                  <button
                    key={e.id}
                    onClick={() =>
                      setSelectedEmps((p) =>
                        selected ? p.filter((x) => x !== e.id) : [...p, e.id],
                      )
                    }
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 ${
                      selected
                        ? "bg-obsidian text-white border-obsidian shadow-sm"
                        : "bg-white text-neutral-500 border-neutral-200 hover:bg-neutral-50"
                    }`}
                  >
                    <div
                      className={`h-2 w-2 rounded-full ${selected ? "bg-gold" : "bg-neutral-300"}`}
                    />
                    {label}
                  </button>
                );
              })}
              {filteredEmpsList.length === 0 && (
                <div className="w-full text-center text-xs text-neutral-400 py-2">
                  No hay empleados con ese nombre.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-6 border-t border-neutral-100 bg-neutral-50/50 shrink-0">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              className="flex-1 py-4 bg-white border border-neutral-200 rounded-2xl text-[11px] font-black uppercase tracking-widest text-neutral-500 hover:text-obsidian hover:bg-neutral-100 hover:border-neutral-300 transition-all shadow-sm"
            >
              Cancelar
            </button>
            <button
              disabled={
                creating ||
                loading ||
                selectedEmps.length === 0 ||
                (tab === "catalog" && selectedTemplateIds.length === 0)
              }
              onClick={tab === "adhoc" ? createAndAssignAdhoc : assign}
              className="flex-[2] flex items-center justify-center gap-2 py-4 bg-obsidian rounded-2xl text-[11px] font-black uppercase tracking-widest text-white hover:bg-gold hover:text-obsidian transition-all shadow-xl shadow-obsidian/20 disabled:opacity-50 disabled:hover:bg-obsidian disabled:hover:text-white"
            >
              {creating || loading
                ? "Procesando..."
                : tab === "adhoc"
                  ? "Crear y Asignar"
                  : "Asignar Selección"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
