//features/tasks/TaskCatalogPanel.tsx
import { useEffect, useMemo, useState } from "react";
import { 
  bulkAssignFromCatalog, 
  createTask, 
  assignTask, 
  getCatalog,
  type CatalogResponse  // ✅ Importar el tipo
} from "./api";
import { listEmployees } from "./employeeApi";
import { assignRoutine, listActiveRoutines, type Routine } from "./routinesApi";

// ✅ CORRECCIÓN 1: Definir el tipo correctamente usando CatalogResponse
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
    label === "high"
      ? "bg-red-50 text-red-700 border-red-200"
      : label === "medium"
      ? "bg-yellow-50 text-yellow-700 border-yellow-200"
      : label === "low"
      ? "bg-green-50 text-green-700 border-green-200"
      : "bg-neutral-50 text-neutral-700 border-neutral-200";

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${cls}`}>
      {p ?? "-"}
    </span>
  );
}

export default function TaskCatalogPanel({ onAssigned }: { onAssigned: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);

  const [catalog, setCatalog] = useState<CatalogApiItem[]>([]);
  const [emps, setEmps] = useState<Employee[]>([]);

  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);
  const [selectedEmps, setSelectedEmps] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // === Nuevos estados para rutinas ===
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [routineId, setRoutineId] = useState<string>("");
  const [assigningRoutine, setAssigningRoutine] = useState(false);

  // === Estados para crear tarea ad-hoc ===
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState<string>("medium");
  const [newEstMin, setNewEstMin] = useState<string>("");
  const [creating, setCreating] = useState(false);

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

        // ✅ CORRECCIÓN 2: Acceder directamente a .catalog
        const catRaw = (catRes as CatalogResponse).catalog || [];
        
        // ✅ CORRECCIÓN 3: Manejar la respuesta de empleados correctamente
        const e = Array.isArray(empRes) 
          ? empRes 
          : (empRes as { data?: Employee[] }).data || [];

        // Filtrar empleados: solo rol "empleado" o sin rol (asumimos que son operativos)
        const filteredEmps = e.filter((x: any) => x.role === "empleado" || !x.role);

        setCatalog(catRaw);
        setEmps(filteredEmps);
        setSelectedTemplateIds([]);

        // Cargar rutinas
        setRoutines(rutRes);
        setRoutineId((prev) => prev || (rutRes?.[0]?.id ?? ""));
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.response?.data?.message ?? "No se pudo cargar el catálogo/empleados/rutinas");
      }
    })();
    return () => {
      alive = false;
    };
  }, [date]);

  const allEmpIds = useMemo(() => emps.map((x) => x.id), [emps]);

  async function assign() {
    setMsg(null);
    setErr(null);

    if (selectedTemplateIds.length === 0) {
      setErr("Selecciona al menos 1 tarea del catálogo.");
      return;
    }
    if (selectedEmps.length === 0) {
      setErr("Selecciona al menos 1 empleado (o Todos).");
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
      setMsg("Asignación completada ✅");
      onAssigned();
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "Error en asignación bulk");
    } finally {
      setLoading(false);
    }
  }

  // === Nueva función: asignar rutina completa ===
  async function assignSelectedRoutine() {
    setMsg(null);
    setErr(null);

    if (!routineId) {
      setErr("Selecciona una rutina.");
      return;
    }
    if (selectedEmps.length === 0) {
      setErr("Selecciona al menos 1 empleado (o Todos).");
      return;
    }

    setAssigningRoutine(true);
    try {
      await assignRoutine(routineId, {
        date,
        empleado_ids: selectedEmps,
        allow_duplicate: false,
      });
      setMsg("Rutina asignada ✅");
      onAssigned();
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "No se pudo asignar la rutina");
    } finally {
      setAssigningRoutine(false);
    }
  }

  // === Función para crear y asignar tarea ad-hoc ===
  async function createAndAssignAdhoc() {
    setMsg(null);
    setErr(null);

    if (!newTitle.trim()) {
      setErr("Pon un título para la tarea nueva.");
      return;
    }
    if (selectedEmps.length === 0) {
      setErr("Selecciona al menos 1 empleado (o Todos).");
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

      setMsg("Tarea creada y asignada ✅");
      setNewTitle("");
      setNewDesc("");
      setNewEstMin("");
      onAssigned();
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "Error creando/asignando tarea");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-4 shadow-sm">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="text-lg font-semibold tracking-tight">Catálogo del día</div>
          <div className="text-sm text-neutral-500">
            Asigna tareas manualmente o aplica una rutina completa.
          </div>
        </div>

        {/* Nuevo header con rutina + fecha + botones */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            className="rounded-xl border border-neutral-300 px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-black/10"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <select
            className="rounded-xl border border-neutral-300 px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-black/10"
            value={routineId}
            onChange={(e) => setRoutineId(e.target.value)}
            disabled={routines.length === 0}
          >
            {routines.length === 0 ? (
              <option value="">Sin rutinas</option>
            ) : (
              routines.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))
            )}
          </select>

          <button
            disabled={assigningRoutine || routines.length === 0}
            onClick={assignSelectedRoutine}
            className="rounded-xl bg-black text-white px-4 py-2 text-sm font-medium
                       hover:bg-neutral-800 transition disabled:opacity-60"
          >
            {assigningRoutine ? "Asignando..." : "Asignar rutina"}
          </button>

          <button
            disabled={loading}
            onClick={assign}
            className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium
                       hover:bg-neutral-100 transition disabled:opacity-60"
          >
            {loading ? "Asignando..." : "Asignar seleccionadas"}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {err && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {err}
        </div>
      )}
      {msg && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {msg}
        </div>
      )}

      {/* Sección de creación ad-hoc inline */}
      <div className="rounded-2xl border border-neutral-200 bg-neutral-50/60 p-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
            <label className="block md:col-span-2">
              <span className="text-xs text-neutral-500">Nueva tarea (ad-hoc)</span>
              <input
                className="mt-1 w-full rounded-xl border p-2"
                placeholder="Ej. Acomodar vitrina"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </label>

            <label className="block">
              <span className="text-xs text-neutral-500">Prioridad</span>
              <select
                className="mt-1 w-full rounded-xl border p-2"
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
              >
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
                <option value="urgent">urgent</option>
              </select>
            </label>

            <label className="block">
              <span className="text-xs text-neutral-500">Estimación (min)</span>
              <input
                className="mt-1 w-full rounded-xl border p-2"
                placeholder="Ej. 30"
                value={newEstMin}
                onChange={(e) => setNewEstMin(e.target.value)}
              />
            </label>

            <label className="block md:col-span-4">
              <span className="text-xs text-neutral-500">Descripción</span>
              <input
                className="mt-1 w-full rounded-xl border p-2"
                placeholder="Instrucciones rápidas…"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
            </label>
          </div>

          <button
            disabled={creating}
            onClick={createAndAssignAdhoc}
            className="rounded-xl bg-black text-white px-4 py-2 text-sm font-medium
                       hover:bg-neutral-800 transition disabled:opacity-60"
          >
            {creating ? "Creando..." : "Crear y asignar"}
          </button>
        </div>

        <div className="mt-2 text-xs text-neutral-500">
          Se crea como tarea ad-hoc para la fecha <span className="font-medium">{date}</span> y se asigna a los empleados seleccionados.
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Catálogo */}
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50/60">
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
            <div>
              <div className="text-sm font-semibold">Tareas del catálogo</div>
              <div className="text-xs text-neutral-500">
                {catalog.length} disponibles
              </div>
            </div>

            {catalog.length > 0 && (
              <button
                className="text-xs font-medium rounded-lg border border-neutral-300 px-2 py-1 hover:bg-white transition"
                onClick={() => setSelectedTemplateIds(catalog.map((x) => x.template.id))}
              >
                Seleccionar todas
              </button>
            )}
          </div>

          <div className="max-h-64 overflow-auto p-2">
            {catalog.length === 0 ? (
              <div className="p-4 text-sm text-neutral-500">
                No hay tareas precargadas para esta fecha.
              </div>
            ) : (
              <ul className="space-y-2">
                {catalog.map((it) => {
                  const t = it.template;
                  const tplId = t.id;
                  const minutes = t.meta?.estimated_minutes ?? (t as any).estimated_minutes;

                  const reactKey = it.routine_item_id ?? `${it.routine_id}-${t.id}`;

                  return (
                    <li
                      key={reactKey}
                      className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-white p-3 hover:bg-neutral-50 transition"
                    >
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={selectedTemplateIds.includes(tplId)}
                        onChange={(e) => {
                          setSelectedTemplateIds((prev) =>
                            e.target.checked ? [...prev, tplId] : prev.filter((x) => x !== tplId)
                          );
                        }}
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-medium text-sm truncate">{t.title}</div>
                          <PriorityBadge p={t.priority} />
                        </div>

                        <div className="mt-1 text-xs text-neutral-500">
                          {minutes ? `${minutes} min` : "sin estimación"}
                          {t.description ? ` · ${t.description}` : ""}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Empleados */}
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50/60">
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
            <div>
              <div className="text-sm font-semibold">Empleados</div>
              <div className="text-xs text-neutral-500">
                {emps.length} disponibles
              </div>
            </div>

            <div className="flex gap-2">
              <button
                className="text-xs font-medium rounded-lg border border-neutral-300 px-2 py-1 hover:bg-white transition disabled:opacity-60"
                onClick={() => setSelectedEmps(allEmpIds)}
                disabled={emps.length === 0}
              >
                Todos
              </button>
              <button
                className="text-xs font-medium rounded-lg border border-neutral-300 px-2 py-1 hover:bg-white transition"
                onClick={() => setSelectedEmps([])}
              >
                Limpiar
              </button>
            </div>
          </div>

          <div className="max-h-64 overflow-auto p-2">
            {emps.length === 0 ? (
              <div className="p-4 text-sm text-neutral-500">No hay empleados.</div>
            ) : (
              <ul className="space-y-2">
                {emps.map((e) => {
                  const label =
                    e.name ??
                    e.nombre ??
                    e.full_name ??
                    [e.first_name, e.last_name].filter(Boolean).join(" ") ??
                    e.email ??
                    e.id;

                  const selected = selectedEmps.includes(e.id);

                  return (
                    <li
                      key={e.id}
                      className={`flex items-center gap-3 rounded-xl border p-3 transition
                        ${selected ? "border-black/20 bg-white" : "border-neutral-200 bg-white hover:bg-neutral-50"}`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={(ev) => {
                          setSelectedEmps((prev) =>
                            ev.target.checked ? [...prev, e.id] : prev.filter((x) => x !== e.id)
                          );
                        }}
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{label}</div>
                        {e.email ? <div className="text-xs text-neutral-500 truncate">{e.email}</div> : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Footer helper */}
      <div className="text-xs text-neutral-500">
        Tips: selecciona empleados primero y luego asigna.
        <span className="font-medium"></span>.
      </div>
    </div>
  );
}