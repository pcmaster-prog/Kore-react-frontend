// src/features/bitacora/BitacoraPage.tsx
import { useEffect, useRef, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import type { ByDateItem } from "@/features/attendance/api";
import { minutesToHHMM } from "@/features/attendance/api";
import type { Task } from "@/features/tasks/types";
import {
  getByDate,
  listTasks,
  getEvaluationCriteria,
  saveEvaluationCriteria,
  DEFAULT_CRITERIOS,
  type EvaluacionCriterio,
} from "./api";
import {
  ChevronDown, ChevronUp, Download, Settings2, Star,
  FileText, Users, CheckCircle2, AlertTriangle, ClipboardList,
  Plus, Trash2, X, Loader2, Clock
} from "lucide-react";

function cx(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(" ");
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function formatFechaLarga(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("es-MX", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  "bg-violet-500","bg-blue-500","bg-emerald-500","bg-amber-500","bg-rose-500","bg-teal-500"
];
function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  const sz = size === "sm" ? "h-8 w-8 text-xs" : size === "lg" ? "h-12 w-12 text-base" : "h-10 w-10 text-sm";
  return (
    <div className={cx("rounded-2xl flex items-center justify-center font-black text-white flex-shrink-0", sz, AVATAR_COLORS[idx])}>
      {getInitials(name)}
    </div>
  );
}

// ─── Stars ────────────────────────────────────────────────────────────────────
function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <button
          key={i}
          type="button"
          onClick={() => onChange?.(i)}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110 focus:outline-none"
        >
          <Star
            className={cx(
              "h-4 w-4 transition-colors",
              i <= (hovered || value)
                ? "fill-amber-400 text-amber-400"
                : "text-neutral-200"
            )}
          />
        </button>
      ))}
    </div>
  );
}

// ─── Tipos locales ────────────────────────────────────────────────────────────
type EmployeeEval = {
  rating: number;
  checks: Record<string, boolean>; // criterio.id -> checked
  note: string;
};

// ─── Panel de Configuración de Criterios ─────────────────────────────────────
function CriteriosModal({
  criterios,
  onClose,
  onSave,
}: {
  criterios: EvaluacionCriterio[];
  onClose: () => void;
  onSave: (criterios: EvaluacionCriterio[]) => void;
}) {
  const [local, setLocal] = useState<EvaluacionCriterio[]>([...criterios]);
  const [saving, setSaving] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newTipo, setNewTipo] = useState<"positivo" | "negativo">("positivo");

  function addCriterio() {
    if (!newLabel.trim()) return;
    setLocal(prev => [...prev, {
      id: `tmp-${Date.now()}`,
      label: newLabel.trim(),
      tipo: newTipo,
      activo: true,
      sort_order: prev.length + 1,
    }]);
    setNewLabel("");
  }

  function removeCriterio(id: string) {
    setLocal(prev => prev.filter(c => c.id !== id));
  }

  function toggleActivo(id: string) {
    setLocal(prev => prev.map(c => c.id === id ? { ...c, activo: !c.activo } : c));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveEvaluationCriteria(local.map(({ id, ...rest }) => rest));
      onSave(local);
      onClose();
    } catch {
      // Si falla, guardamos localmente igual
      onSave(local);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-6 border-b border-neutral-100 bg-neutral-50/70">
          <div>
            <div className="font-black text-xl text-obsidian">Criterios de Evaluación</div>
            <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mt-1">
              Configura los parámetros de evaluación del equipo
            </div>
          </div>
          <button onClick={onClose} className="h-9 w-9 rounded-xl flex items-center justify-center border border-neutral-100 hover:bg-neutral-100 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
          {local.map(c => (
            <div key={c.id} className={cx(
              "flex items-center gap-3 p-3 rounded-2xl border transition-all",
              c.activo ? "bg-white border-neutral-100" : "bg-neutral-50 border-neutral-100 opacity-50"
            )}>
              <button
                onClick={() => toggleActivo(c.id)}
                className={cx(
                  "h-5 w-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                  c.activo ? "bg-obsidian border-obsidian" : "border-neutral-200 bg-white"
                )}
              >
                {c.activo && <CheckCircle2 className="h-3 w-3 text-white" />}
              </button>
              <span className="flex-1 text-sm font-medium text-neutral-700">{c.label}</span>
              <span className={cx(
                "text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wide",
                c.tipo === "positivo"
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-rose-50 text-rose-600"
              )}>
                {c.tipo === "positivo" ? "Pos." : "Neg."}
              </span>
              <button
                onClick={() => removeCriterio(c.id)}
                className="h-7 w-7 rounded-xl flex items-center justify-center text-neutral-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Agregar nuevo */}
        <div className="px-6 pb-4 border-t border-neutral-100 pt-4">
          <div className="flex gap-2">
            <input
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addCriterio()}
              placeholder="Nuevo criterio..."
              className="flex-1 rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-obsidian/10"
            />
            <select
              value={newTipo}
              onChange={e => setNewTipo(e.target.value as "positivo" | "negativo")}
              className="rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-obsidian/10"
            >
              <option value="positivo">Pos.</option>
              <option value="negativo">Neg.</option>
            </select>
            <button
              onClick={addCriterio}
              className="h-10 w-10 rounded-xl bg-obsidian text-white flex items-center justify-center hover:bg-obsidian/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-4 w-full h-11 rounded-xl bg-obsidian text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-obsidian/90 transition-colors disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Guardar criterios
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Fila de empleado colapsable ──────────────────────────────────────────────
function EmployeeRow({
  attendance,
  tasks,
  criterios,
  evalData,
  onEvalChange,
}: {
  attendance: ByDateItem;
  tasks: Task[];
  criterios: EvaluacionCriterio[];
  evalData: EmployeeEval;
  onEvalChange: (data: Partial<EmployeeEval>) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const empName: string =
    (attendance as any).empleado?.full_name ??
    (attendance as any).empleado?.name ??
    `Empleado ${attendance.empleado_id}`;
  const empPosition: string = (attendance as any).empleado?.position_title ?? "—";

  const workedMin = attendance.totals?.worked_minutes ?? 0;

  // Detectar incidencias: al menos un check negativo marcado
  const hasIncidencia = criterios
    .filter(c => c.tipo === "negativo" && c.activo)
    .some(c => evalData.checks[c.id]);

  const positivos = criterios.filter(c => c.tipo === "positivo" && c.activo);
  const negativos = criterios.filter(c => c.tipo === "negativo" && c.activo);

  return (
    <div className="rounded-[24px] border border-neutral-100 bg-white overflow-hidden shadow-sm">
      {/* Resumen colapsable */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-neutral-50/70 transition-colors text-left"
      >
        <Avatar name={empName} />
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm text-obsidian truncate">{empName}</div>
          <div className="text-[11px] text-neutral-400 mt-0.5">{empPosition}</div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Badge incidencia */}
          <span className={cx(
            "text-[10px] font-bold px-2.5 py-1 rounded-xl uppercase tracking-wide border",
            hasIncidencia
              ? "bg-rose-50 text-rose-600 border-rose-100"
              : "bg-emerald-50 text-emerald-600 border-emerald-100"
          )}>
            {hasIncidencia ? "Incidencia" : "Sin incidencias"}
          </span>
          {/* Estrellas */}
          <StarRating value={evalData.rating} onChange={v => onEvalChange({ rating: v })} />
          {/* Tiempo */}
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-500 bg-neutral-50 border border-neutral-100 px-2.5 py-1 rounded-xl">
            <Clock className="h-3 w-3" />
            {minutesToHHMM(workedMin)}
          </div>
          {expanded ? <ChevronUp className="h-4 w-4 text-neutral-400" /> : <ChevronDown className="h-4 w-4 text-neutral-400" />}
        </div>
      </button>

      {/* Detalle expandido */}
      {expanded && (
        <div className="border-t border-neutral-100 p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tareas del día */}
          <div>
            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-3">Tareas realizadas</div>
            {tasks.length === 0 ? (
              <div className="text-xs text-neutral-300 italic py-2">Sin tareas asignadas este día</div>
            ) : (
              <div className="space-y-1.5">
                {tasks.map(t => (
                  <div key={t.id} className="flex items-center justify-between gap-2 text-sm py-1.5 border-b border-neutral-50 last:border-0">
                    <span className="flex-1 text-neutral-700 font-medium truncate">{t.title}</span>
                    <span className={cx(
                      "text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-wide flex-shrink-0",
                      t.status === "completed" ? "bg-emerald-50 text-emerald-600" :
                      t.status === "in_progress" ? "bg-amber-50 text-amber-600" :
                      "bg-neutral-50 text-neutral-400"
                    )}>
                      {t.status === "completed" ? "✓" : t.status === "in_progress" ? "En proceso" : "Pendiente"}
                    </span>
                    {(t as any).estimated_minutes && (
                      <span className="text-[11px] text-neutral-400 flex-shrink-0">
                        {minutesToHHMM((t as any).estimated_minutes)}
                      </span>
                    )}
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2 font-bold text-sm text-obsidian border-t border-neutral-100 mt-1">
                  <span>Total</span>
                  <span>{minutesToHHMM(workedMin)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Evaluación del admin */}
          <div>
            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-3">Evaluación del Admin</div>
            <div className="space-y-2">
              {[...negativos, ...positivos].map(c => (
                <label key={c.id} className="flex items-center gap-3 cursor-pointer group">
                  <div
                    onClick={() => onEvalChange({ checks: { ...evalData.checks, [c.id]: !evalData.checks[c.id] } })}
                    className={cx(
                      "h-5 w-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all",
                      evalData.checks[c.id]
                        ? "bg-obsidian border-obsidian"
                        : "border-neutral-200 bg-white group-hover:border-neutral-300"
                    )}
                  >
                    {evalData.checks[c.id] && <CheckCircle2 className="h-3 w-3 text-white" />}
                  </div>
                  <span className="flex-1 text-sm text-neutral-700">{c.label}</span>
                  <span className={cx(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase",
                    c.tipo === "positivo"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-rose-50 text-rose-600"
                  )}>
                    {c.tipo === "positivo" ? "Pos." : "Neg."}
                  </span>
                </label>
              ))}
            </div>

            {/* Calificación */}
            <div className="mt-4 flex items-center gap-2">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Calificación:</span>
              <StarRating value={evalData.rating} onChange={v => onEvalChange({ rating: v })} />
            </div>

            {/* Nota libre */}
            <textarea
              value={evalData.note}
              onChange={e => onEvalChange({ note: e.target.value })}
              placeholder="Observaciones del admin sobre este empleado..."
              rows={3}
              className="mt-3 w-full rounded-2xl border border-neutral-200 bg-neutral-50/50 px-4 py-3 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-obsidian/10 resize-none transition-all placeholder:text-neutral-300"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function BitacoraPage() {
  const [date, setDate] = useState(todayStr());
  const [attendance, setAttendance] = useState<ByDateItem[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [criterios, setCriterios] = useState<EvaluacionCriterio[]>(DEFAULT_CRITERIOS);
  const [evals, setEvals] = useState<Record<string, EmployeeEval>>({});
  const [notasGenerales, setNotasGenerales] = useState("");
  const [showCriteriosModal, setShowCriteriosModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const bitacoraRef = useRef<HTMLDivElement>(null);

  // Cargar datos
  useEffect(() => {
    setLoading(true);
    Promise.all([
      getByDate(date),
      listTasks({ date, status: "in_progress,completed,open" }),
      getEvaluationCriteria(),
    ]).then(([att, taskData, crit]) => {
      setAttendance(att.items ?? []);
      setTasks(taskData.data ?? []);
      setCriterios(crit);
      // Inicializar evals
      setEvals(prev => {
        const next: Record<string, EmployeeEval> = {};
        (att.items ?? []).forEach((a: ByDateItem) => {
          next[a.empleado_id] = prev[a.empleado_id] ?? { rating: 5, checks: {}, note: "" };
        });
        return next;
      });
    }).finally(() => setLoading(false));
  }, [date]);

  function updateEval(empId: string, data: Partial<EmployeeEval>) {
    setEvals(prev => ({
      ...prev,
      [empId]: { ...prev[empId], ...data },
    }));
  }

  // Tareas de un empleado específico
  function tasksForEmployee(empId: string): Task[] {
    return tasks.filter(t =>
      t.assignees?.some((a: any) => String(a.empleado_id) === String(empId)) ||
      String(t.empleado?.id) === String(empId)
    );
  }

  // KPIs
  const totalActivos = attendance.length;
  const tareasCompletadas = tasks.filter(t => t.status === "completed").length;
  const avgRating = attendance.length
    ? (Object.values(evals).reduce((sum, e) => sum + e.rating, 0) / attendance.length).toFixed(1)
    : "—";
  const sinIncidencias = attendance.filter(a => {
    const ev = evals[a.empleado_id];
    if (!ev) return true;
    return !criterios.filter(c => c.tipo === "negativo" && c.activo).some(c => ev.checks[c.id]);
  }).length;

  // Exportar PDF
  async function handleExportPDF() {
    if (!bitacoraRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(bitacoraRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#f8f7f4",
        windowWidth: 1200,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const imgH = (canvas.height * pdfW) / canvas.width;
      let yPos = 0;
      while (yPos < imgH) {
        if (yPos > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, -yPos, pdfW, imgH);
        yPos += pdfH;
      }
      pdf.save(`bitacora-${date}.pdf`);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="min-h-screen bg-bone">
      {/* Controls bar (fuera del PDF) */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-obsidian tracking-tight">Bitácora del Día</h1>
          <p className="text-sm text-neutral-400 mt-1 capitalize">{formatFechaLarga(date)}</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="h-10 rounded-xl border border-neutral-200 bg-white px-3 text-sm font-medium outline-none focus:ring-2 focus:ring-obsidian/10 shadow-sm"
          />
          <button
            onClick={() => setShowCriteriosModal(true)}
            className="h-10 px-4 rounded-xl border border-neutral-200 bg-white text-sm font-bold text-neutral-600 flex items-center gap-2 hover:bg-neutral-50 transition-colors shadow-sm"
          >
            <Settings2 className="h-4 w-4" />
            Criterios
          </button>
          <button
            onClick={handleExportPDF}
            disabled={exporting || loading}
            className="h-10 px-5 rounded-xl bg-obsidian text-white text-sm font-bold flex items-center gap-2 hover:bg-obsidian/90 transition-colors shadow-sm disabled:opacity-60"
          >
            {exporting
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Download className="h-4 w-4" />}
            {exporting ? "Generando..." : "Exportar PDF"}
          </button>
        </div>
      </div>

      {/* === CONTENIDO DEL PDF === */}
      <div ref={bitacoraRef} className="space-y-6">

        {/* Header del documento */}
        <div className="bg-obsidian rounded-[32px] px-8 py-7 flex items-center justify-between text-white">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-2xl bg-white flex items-center justify-center text-obsidian font-black text-xl italic">K</div>
              <div>
                <div className="text-xl font-black tracking-tighter">Kore</div>
                <div className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">Ops Suite</div>
              </div>
            </div>
            <div className="font-black text-2xl mt-3">Bitácora diaria</div>
            <div className="text-white/60 text-sm mt-1">Reporte de actividades del equipo</div>
          </div>
          <div className="text-right">
            <div className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-1">Fecha</div>
            <div className="text-3xl font-black tabular-nums">
              {date.split("-").reverse().join(" / ")}
            </div>
            <div className="text-white/50 text-sm mt-1 capitalize">
              {new Date(date + "T12:00:00").toLocaleDateString("es-MX", { weekday: "long" })}
              {" · Turno del día"}
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Empleados activos", value: totalActivos, icon: <Users className="h-5 w-5" />, color: "text-blue-600 bg-blue-50" },
            { label: "Tareas completadas", value: tareasCompletadas, icon: <ClipboardList className="h-5 w-5" />, color: "text-emerald-600 bg-emerald-50" },
            { label: "Promedio del equipo", value: `${avgRating} ★`, icon: <Star className="h-5 w-5" />, color: "text-amber-500 bg-amber-50" },
            { label: "Sin incidencias", value: sinIncidencias, icon: <CheckCircle2 className="h-5 w-5" />, color: "text-teal-600 bg-teal-50" },
          ].map(kpi => (
            <div key={kpi.label} className="bg-white rounded-[24px] border border-neutral-100 p-5 shadow-sm">
              <div className={cx("h-10 w-10 rounded-xl flex items-center justify-center mb-3", kpi.color)}>
                {kpi.icon}
              </div>
              <div className="text-2xl font-black text-obsidian">{kpi.value}</div>
              <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wide mt-1">{kpi.label}</div>
            </div>
          ))}
        </div>

        {/* Empleados */}
        {loading ? (
          <div className="bg-white rounded-[32px] border border-neutral-100 p-16 flex flex-col items-center gap-3">
            <div className="h-10 w-10 border-4 border-neutral-100 border-t-obsidian rounded-full animate-spin" />
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Cargando bitácora...</span>
          </div>
        ) : attendance.length === 0 ? (
          <div className="bg-white rounded-[32px] border border-neutral-100 p-16 flex flex-col items-center gap-4 text-center">
            <AlertTriangle className="h-12 w-12 text-neutral-200" />
            <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest">
              Sin registros de asistencia para esta fecha
            </p>
            <p className="text-xs text-neutral-300">Selecciona otro día o verifica que haya empleados con check-in registrado</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 px-1">
              <FileText className="h-4 w-4 text-neutral-400" />
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">
                Empleados y Tareas Realizadas
              </span>
            </div>
            {attendance.map(a => (
              <EmployeeRow
                key={a.empleado_id}
                attendance={a}
                tasks={tasksForEmployee(a.empleado_id)}
                criterios={criterios}
                evalData={evals[a.empleado_id] ?? { rating: 5, checks: {}, note: "" }}
                onEvalChange={data => updateEval(a.empleado_id, data)}
              />
            ))}
          </div>
        )}

        {/* Notas generales */}
        <div className="bg-white rounded-[32px] border border-neutral-100 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-8 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-center">
              <FileText className="h-4 w-4 text-neutral-400" />
            </div>
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">
              Notas Generales del Día
            </span>
          </div>
          <textarea
            value={notasGenerales}
            onChange={e => setNotasGenerales(e.target.value)}
            placeholder="Observaciones generales, incidencias del negocio, pendientes para mañana..."
            rows={4}
            className="w-full rounded-2xl border border-neutral-200 bg-neutral-50/50 px-4 py-3 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-obsidian/10 resize-none transition-all placeholder:text-neutral-300"
          />
        </div>

        {/* Footer del doc */}
        <div className="text-center py-4 text-[11px] text-neutral-300 font-medium">
          Documento generado por Kore Ops Suite · {new Date().toLocaleString("es-MX")}
        </div>
      </div>

      {/* Modal de criterios */}
      {showCriteriosModal && (
        <CriteriosModal
          criterios={criterios}
          onClose={() => setShowCriteriosModal(false)}
          onSave={setCriterios}
        />
      )}
    </div>
  );
}
