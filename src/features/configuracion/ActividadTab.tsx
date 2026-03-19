// src/features/configuracion/ActividadTab.tsx
import { useEffect, useState, useCallback, useMemo } from "react";
import api from "@/lib/http";

function cx(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(" ");
}

type ActivityItem = {
  id: string;
  action: string;
  entity_type?: string | null;
  entity_id?: string | null;
  user_id?: string | null;
  empleado_id?: string | null;
  meta?: Record<string, any> | null;
  created_at: string;
};

type Conf = {
  label: string; sublabel: string; icon: string;
  iconBg: string; badge: string; badgeCls: string;
  category: "tareas" | "asistencia" | "sistema";
};

// Nombres REALES del backend (con punto y guión bajo)
function getConf(action: string, meta: Record<string, any>): Conf {
  const statusLabel: Record<string, string> = {
    open: "Abierta", in_progress: "En progreso",
    completed: "Completada", done_pending: "Pendiente revisión",
    approved: "Aprobada", rejected: "Rechazada",
  };

  switch (action) {
    case "task.bulk_created": {
      const added = Array.isArray(meta.empleados_added) ? meta.empleados_added.length : 0;
      const tplName = meta.task_title ?? meta.template_title ?? "plantilla";
      const creator = meta.created_by_name ?? null;
      const dateStr = meta.catalog_date ? new Date(meta.catalog_date + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "long" }) : null;
      return {
        label: `Tareas creadas: ${tplName}`,
        sublabel: [
          creator ? `Por: ${creator}` : null,
          `${added} empleado${added !== 1 ? "s" : ""} asignados`,
          dateStr ? `para el ${dateStr}` : null,
        ].filter(Boolean).join(" · "),
        icon: "📋", iconBg: "bg-blue-100",
        badge: "Creación", badgeCls: "bg-blue-100 text-blue-700",
        category: "tareas",
      };
    }
    case "task.bulk_reused": {
      const sk2 = Array.isArray(meta.empleados_skipped) ? meta.empleados_skipped.length : 0;
      const ad2 = Array.isArray(meta.empleados_added) ? meta.empleados_added.length : 0;
      const tplName2 = meta.task_title ?? meta.template_title ?? "rutina";
      const dateStr2 = meta.catalog_date ? new Date(meta.catalog_date + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "long" }) : null;
      return {
        label: `Rutina reutilizada: ${tplName2}`,
        sublabel: [
          ad2 > 0 ? `${ad2} nuevo${ad2 !== 1 ? "s" : ""}` : null,
          sk2 > 0 ? `${sk2} ya tenía${sk2 !== 1 ? "n" : ""} la tarea` : null,
          dateStr2 ? `para el ${dateStr2}` : null,
        ].filter(Boolean).join(" · "),
        icon: "🔄", iconBg: "bg-indigo-100",
        badge: "Rutina", badgeCls: "bg-indigo-100 text-indigo-700",
        category: "tareas",
      };
    }
    case "task.status_changed": {
      const from = statusLabel[meta.from] ?? meta.from ?? "—";
      const to   = statusLabel[meta.to]   ?? meta.to   ?? "—";
      const isCompleted = meta.to === "completed";
      return {
        label: meta.task_title ? `Estado cambiado: ${meta.task_title}` : `Estado: ${from} → ${to}`,
        sublabel: `${from} → ${to}`,
        icon: isCompleted ? "✅" : "🔄",
        iconBg: isCompleted ? "bg-emerald-100" : "bg-amber-100",
        badge: "Estado", badgeCls: "bg-neutral-100 text-neutral-600",
        category: "tareas",
      };
    }
    case "task.created":
      return {
        label: `Tarea creada${meta.task_title ? `: ${meta.task_title}` : ""}`,
        sublabel: meta.employee_name ? `Asignado a: ${meta.employee_name}` : "",
        icon: "✏️", iconBg: "bg-blue-100",
        badge: "Creación", badgeCls: "bg-blue-100 text-blue-700",
        category: "tareas",
      };
    case "task.approved":
      return {
        label: `Tarea aprobada${meta.task_title ? `: ${meta.task_title}` : ""}`,
        sublabel: meta.note ?? "",
        icon: "👍", iconBg: "bg-emerald-100",
        badge: "Aprobada", badgeCls: "bg-emerald-100 text-emerald-700",
        category: "tareas",
      };
    case "task.rejected":
      return {
        label: `Tarea rechazada${meta.task_title ? `: ${meta.task_title}` : ""}`,
        sublabel: meta.note ?? "",
        icon: "❌", iconBg: "bg-rose-100",
        badge: "Rechazada", badgeCls: "bg-rose-100 text-rose-700",
        category: "tareas",
      };
    case "evidence.uploaded":
      return {
        label: `Evidencia subida${meta.task_title ? `: ${meta.task_title}` : ""}`,
        sublabel: meta.file_name ?? "",
        icon: "📎", iconBg: "bg-violet-100",
        badge: "Evidencia", badgeCls: "bg-violet-100 text-violet-700",
        category: "tareas",
      };
    case "checklist.updated":
      return {
        label: `Checklist actualizado${meta.task_title ? `: ${meta.task_title}` : ""}`,
        sublabel: meta.item_label ?? "",
        icon: "☑️", iconBg: "bg-amber-100",
        badge: "Checklist", badgeCls: "bg-amber-100 text-amber-700",
        category: "tareas",
      };
    // ── Asistencia ──────────────────────────────────────────────────────────
    case "attendance.check_in":
      return {
        label: `Registro de entrada: ${meta.employee_name ?? "Empleado"}`,
        sublabel: meta.late_minutes ? `Retardo: ${meta.late_minutes} min` : "",
        icon: "🟢", iconBg: "bg-emerald-100",
        badge: meta.late_minutes ? "Retardo" : "Entrada",
        badgeCls: meta.late_minutes ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700",
        category: "asistencia",
      };
    case "attendance.check_out":
      return {
        label: `Registro de salida: ${meta.employee_name ?? "Empleado"}`,
        sublabel: meta.worked_minutes
          ? `Horas trabajadas: ${Math.floor(meta.worked_minutes / 60)}h ${meta.worked_minutes % 60}min`
          : "",
        icon: "🔴", iconBg: "bg-neutral-100",
        badge: "Salida", badgeCls: "bg-neutral-100 text-neutral-600",
        category: "asistencia",
      };
    case "attendance.break_start":
      return {
        label: `Pausa iniciada: ${meta.employee_name ?? "Empleado"}`,
        sublabel: "",
        icon: "☕", iconBg: "bg-amber-100",
        badge: "Pausa", badgeCls: "bg-amber-100 text-amber-700",
        category: "asistencia",
      };
    case "attendance.break_end":
      return {
        label: `Pausa terminada: ${meta.employee_name ?? "Empleado"}`,
        sublabel: "",
        icon: "▶️", iconBg: "bg-emerald-100",
        badge: "Reanudó", badgeCls: "bg-emerald-100 text-emerald-700",
        category: "asistencia",
      };
    // ── Sistema ─────────────────────────────────────────────────────────────
    case "user.created":
      return {
        label: `Usuario creado: ${meta.user_name ?? "Nuevo usuario"}`,
        sublabel: meta.role ? `Rol: ${meta.role}` : "",
        icon: "👤", iconBg: "bg-teal-100",
        badge: "Sistema", badgeCls: "bg-neutral-100 text-neutral-600",
        category: "sistema",
      };
    case "user.deactivated":
      return {
        label: `Usuario desactivado: ${meta.user_name ?? ""}`,
        sublabel: "",
        icon: "🚫", iconBg: "bg-rose-100",
        badge: "Sistema", badgeCls: "bg-neutral-100 text-neutral-600",
        category: "sistema",
      };
    default:
      // Fallback — limpia el nombre sin mostrar puntos ni guiones crudos
      return {
        label: action.replace(/\./g, " · ").replace(/_/g, " "),
        sublabel: "",
        icon: "⚙️", iconBg: "bg-neutral-100",
        badge: "Sistema", badgeCls: "bg-neutral-100 text-neutral-600",
        category: "sistema",
      };
  }
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

function groupLabel(dateStr: string) {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (dateStr === today) return "Hoy";
  if (dateStr === yesterday) return "Ayer";
  return new Date(dateStr + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "long" });
}

// ─── Fila expandible ──────────────────────────────────────────────────────────
function ActivityRow({ item }: { item: ActivityItem }) {
  const [expanded, setExpanded] = useState(false);
  const meta = item.meta ?? {};
  const conf = getConf(item.action, meta);

  const HIDDEN = ["task_title","employee_name","user_name","template_id","empleados_added","empleados_skipped","created_by_name","template_title","evidence_id"];
  const expandableMeta = Object.entries(meta).filter(([k, v]) => !HIDDEN.includes(k) && v !== null && v !== "");

  return (
    <div className="border-b last:border-0">
      <div
        className={cx(
          "flex items-center gap-3 px-4 py-3 transition",
          expandableMeta.length > 0 ? "cursor-pointer hover:bg-neutral-50/60" : ""
        )}
        onClick={() => expandableMeta.length > 0 && setExpanded(!expanded)}
      >
        <div className={cx("h-10 w-10 rounded-2xl flex items-center justify-center text-lg shrink-0", conf.iconBg)}>
          {conf.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-neutral-900 truncate">{conf.label}</div>
          {conf.sublabel && <div className="text-xs text-neutral-500 mt-0.5">{conf.sublabel}</div>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={cx("rounded-full px-2.5 py-1 text-xs font-medium hidden sm:inline-block", conf.badgeCls)}>
            {conf.badge}
          </span>
          <span className="text-xs text-neutral-400 w-12 text-right">{formatTime(item.created_at)}</span>
          {expandableMeta.length > 0 && (
            <span className="text-neutral-300 text-xs">{expanded ? "▲" : "▼"}</span>
          )}
        </div>
      </div>

      {expanded && expandableMeta.length > 0 && (
        <div className="px-16 pb-3">
          <div className="rounded-2xl bg-neutral-50 border border-neutral-100 px-4 py-3 text-xs text-neutral-600 space-y-1.5">
            {expandableMeta.map(([k, v]) => {
              const val = Array.isArray(v) ? `${v.length} elementos` : typeof v === "object" ? JSON.stringify(v) : String(v);
              return (
                <div key={k} className="flex gap-2">
                  <span className="text-neutral-400 capitalize min-w-24">{k.replace(/_/g, " ")}:</span>
                  <span className="font-medium break-all">{val}</span>
                </div>
              );
            })}
            {item.entity_type && (
              <div className="flex gap-2 pt-1 border-t border-neutral-200 mt-1">
                <span className="text-neutral-400 min-w-24">Módulo:</span>
                <span className="font-medium capitalize">{item.entity_type}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const CATEGORY_FILTERS = [
  { key: "todo",       label: "Todo" },
  { key: "tareas",     label: "Tareas" },
  { key: "asistencia", label: "Asistencia" },
  { key: "sistema",    label: "Sistema" },
] as const;
type CategoryKey = typeof CATEGORY_FILTERS[number]["key"];

// ─── Página ───────────────────────────────────────────────────────────────────
export default function ActividadTab() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CategoryKey>("todo");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await api.get("/activity-logs", {
        params: {
          per_page: 100,
          from: dateFrom || undefined,
          to: dateTo ? dateTo + " 23:59:59" : undefined,
        },
      });
      const raw = res.data;
      setItems(Array.isArray(raw) ? raw : (raw?.data ?? []));
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "No se pudo cargar");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  const today = new Date().toISOString().slice(0, 10);
  const eventosHoy    = items.filter(i => i.created_at.slice(0, 10) === today).length;
  const tareasCreadas = items.filter(i => ["task.bulk_created", "task.created"].includes(i.action)).length;
  const regAsistencia = items.filter(i => i.action.startsWith("attendance.")).length;
  const totalEventos  = items.length;

  const filtered = useMemo(() => items.filter(item => {
    const conf = getConf(item.action, item.meta ?? {});
    if (category !== "todo" && conf.category !== category) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!conf.label.toLowerCase().includes(q) &&
          !conf.sublabel.toLowerCase().includes(q) &&
          !JSON.stringify(item.meta ?? {}).toLowerCase().includes(q)) return false;
    }
    return true;
  }), [items, category, search]);

  const grouped = useMemo(() => {
    const map: Record<string, ActivityItem[]> = {};
    for (const item of filtered) {
      const d = item.created_at.slice(0, 10);
      if (!map[d]) map[d] = [];
      map[d].push(item);
    }
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

  const categoryCounts = useMemo(() => {
    const c: Record<string, number> = { todo: items.length };
    for (const item of items) {
      const cat = getConf(item.action, item.meta ?? {}).category;
      c[cat] = (c[cat] ?? 0) + 1;
    }
    return c;
  }, [items]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-neutral-900 text-white flex items-center justify-center text-xl">📊</div>
          <div>
            <h2 className="text-lg font-semibold">Actividad Reciente</h2>
            <p className="text-sm text-neutral-500">Historial completo de eventos del sistema</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />Solo Administrador
        </span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Eventos hoy",     val: eventosHoy,    cls: "text-blue-600" },
          { label: "Tareas creadas",  val: tareasCreadas, cls: "text-emerald-600" },
          { label: "Reg. asistencia", val: regAsistencia, cls: "text-amber-600" },
          { label: "Total eventos",   val: totalEventos,  cls: "text-violet-600" },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className={cx("text-3xl font-bold", k.cls)}>{k.val}</div>
            <div className="text-xs text-neutral-500 mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Filtros fecha */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-2 rounded-2xl border bg-white px-3 py-2">
          <span className="text-xs text-neutral-500">Desde</span>
          <input type="date" className="text-sm outline-none bg-transparent"
            value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className="flex items-center gap-2 rounded-2xl border bg-white px-3 py-2">
          <span className="text-xs text-neutral-500">Hasta</span>
          <input type="date" className="text-sm outline-none bg-transparent"
            value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        {(dateFrom || dateTo) && (
          <button onClick={() => { setDateFrom(""); setDateTo(""); }}
            className="rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-500 hover:bg-neutral-50">
            ✕ Limpiar
          </button>
        )}
        <button onClick={load}
          className="ml-auto rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-xs text-neutral-600 hover:bg-neutral-50 transition">
          ↻ Refrescar
        </button>
      </div>

      {/* Buscador */}
      <div className="rounded-2xl border bg-white px-4 py-2.5 flex items-center gap-2">
        <span className="text-neutral-400 text-sm">🔍</span>
        <input className="flex-1 text-sm outline-none bg-transparent placeholder:text-neutral-400"
          placeholder="Buscar por evento o descripción..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
        {search && <button onClick={() => setSearch("")} className="text-neutral-400 hover:text-neutral-600 text-xs">✕</button>}
      </div>

      {/* Filtros categoría */}
      <div className="flex items-center gap-2 flex-wrap">
        {CATEGORY_FILTERS.map((f) => {
          const count = categoryCounts[f.key] ?? 0;
          const active = category === f.key;
          return (
            <button key={f.key} onClick={() => setCategory(f.key)}
              className={cx(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                active ? "bg-neutral-900 text-white border-neutral-900" : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
              )}>
              {f.label}
              {count > 0 && (
                <span className={cx("rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                  active ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-600")}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {err && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{err}</div>}

      {/* Timeline */}
      {loading ? (
        <div className="rounded-3xl border bg-white p-8 text-center text-sm text-neutral-500">Cargando actividad...</div>
      ) : grouped.length === 0 ? (
        <div className="rounded-3xl border bg-white p-8 text-center">
          <div className="text-2xl mb-2">📭</div>
          <div className="text-sm text-neutral-500">
            {search || category !== "todo" || dateFrom || dateTo ? "Sin resultados." : "Sin actividad registrada todavía."}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(([date, dayItems]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-2">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 text-white px-3 py-1 text-xs font-medium">
                  📅 {groupLabel(date)}
                </div>
                <div className="flex-1 h-px bg-neutral-100" />
                <div className="text-xs text-neutral-400">{dayItems.length} evento{dayItems.length !== 1 ? "s" : ""}</div>
              </div>
              <div className="rounded-3xl border bg-white shadow-sm overflow-hidden">
                {dayItems.map((item) => <ActivityRow key={item.id} item={item} />)}
              </div>
            </div>
          ))}
          <div className="text-center text-xs text-neutral-400 py-2">
            — Mostrando {filtered.length} de {totalEventos} evento{totalEventos !== 1 ? "s" : ""} —
          </div>
        </div>
      )}
    </div>
  );
}