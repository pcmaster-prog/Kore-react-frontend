// src/features/nomina/NominaPage.tsx
import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/lib/http";
import {
  CheckCircle2, ChevronLeft, ChevronRight,
  Download, FileSpreadsheet, Loader2,
  AlertTriangle, RefreshCw, Clock, CalendarDays,
} from "lucide-react";

function cx(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(" ");
}

// ─── Tipos ────────────────────────────────────────────────────────────────────
type PaymentType = "hourly" | "daily";

type Entry = {
  id: string;
  empleado_id: string;
  empleado_name: string;
  empleado_role?: string | null;
  payment_type: PaymentType;
  rate: number;
  units: number;
  rest_days_paid: number;
  subtotal: number;
  adjustment_amount: number;
  adjustment_note?: string | null;
  bonus_amount: number;
  bonus_note?: string | null;
  total: number;
};

type Period = {
  id: string;
  week_start: string;
  week_end: string;
  status: "draft" | "approved";
  total_amount: number;
  total_adjustments: number;
  total_bonuses: number;
  approved_at?: string | null;
  entries: Entry[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number): string {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 2 }).format(n);
}

function fmtUnits(type: PaymentType, units: number): string {
  if (type === "hourly") {
    const h = Math.floor(units);
    const m = Math.round((units - h) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${units} día${units !== 1 ? "s" : ""}`;
}

function weekLabel(start: string, end: string): string {
  const s = new Date(start + "T12:00:00");
  const e = new Date(end + "T12:00:00");
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  return `${s.toLocaleDateString("es-MX", opts)} – ${e.toLocaleDateString("es-MX", opts)}`;
}

function sundayOfCurrentWeek(): string {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay()); // retrocede al domingo
  return d.toISOString().slice(0, 10);
}

function initials(name: string): string {
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

const AVATAR_COLORS = [
  "bg-blue-200 text-blue-800", "bg-emerald-200 text-emerald-800",
  "bg-violet-200 text-violet-800", "bg-amber-200 text-amber-800",
  "bg-rose-200 text-rose-800", "bg-teal-200 text-teal-800",
  "bg-indigo-200 text-indigo-800", "bg-orange-200 text-orange-800",
];
function avatarColor(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

// ─── Fila editable ────────────────────────────────────────────────────────────
function EntryRow({
  entry, approved, onSave,
}: {
  entry: Entry;
  approved: boolean;
  onSave: (id: string, patch: Partial<Entry>) => Promise<void>;
}) {
  const [adj, setAdj] = useState(String(entry.adjustment_amount ?? 0));
  const [adjNote, setAdjNote] = useState(entry.adjustment_note ?? "");
  const [bonus, setBonus] = useState(String(entry.bonus_amount ?? 0));
  const [bonusNote, setBonusNote] = useState(entry.bonus_note ?? "");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const originalAdj   = useRef(entry.adjustment_amount);
  const originalBonus = useRef(entry.bonus_amount);

  async function save() {
    setSaving(true);
    await onSave(entry.id, {
      adjustment_amount: parseFloat(adj) || 0,
      adjustment_note:   adjNote || null,
      bonus_amount:      parseFloat(bonus) || 0,
      bonus_note:        bonusNote || null,
    } as any);
    setSaving(false);
    setDirty(false);
    originalAdj.current   = parseFloat(adj) || 0;
    originalBonus.current = parseFloat(bonus) || 0;
  }

  const computedTotal = entry.subtotal + (parseFloat(adj) || 0) + (parseFloat(bonus) || 0);

  return (
    <>
      <tr className={cx(
        "border-t transition-colors group",
        dirty ? "bg-amber-50/40" : "hover:bg-neutral-50/50"
      )}>
        {/* Empleado */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className={cx("h-9 w-9 rounded-2xl flex items-center justify-center text-xs font-bold shrink-0", avatarColor(entry.empleado_name))}>
              {initials(entry.empleado_name)}
            </div>
            <div>
              <div className="text-sm font-medium text-neutral-900">{entry.empleado_name}</div>
              {entry.empleado_role && <div className="text-xs text-neutral-400">{entry.empleado_role}</div>}
            </div>
          </div>
        </td>

        {/* Horas/días */}
        <td className="px-4 py-3">
          <div className="text-sm font-medium">{fmtUnits(entry.payment_type, entry.units)}</div>
          {entry.rest_days_paid > 0 && (
            <div className="text-xs text-emerald-600 mt-0.5">+{entry.rest_days_paid} descanso pagado</div>
          )}
        </td>

        {/* Tipo */}
        <td className="px-4 py-3">
          <span className={cx(
            "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
            entry.payment_type === "hourly"
              ? "bg-blue-50 text-blue-700 border-blue-200"
              : "bg-violet-50 text-violet-700 border-violet-200"
          )}>
            {entry.payment_type === "hourly"
              ? <><Clock className="h-3 w-3" /> Por hora</>
              : <><CalendarDays className="h-3 w-3" /> Por día</>}
          </span>
        </td>

        {/* Tarifa */}
        <td className="px-4 py-3">
          <div className="text-sm font-medium">{fmt(entry.rate)}</div>
          <div className="text-xs text-neutral-400">{entry.payment_type === "hourly" ? "/hora" : "/día"}</div>
        </td>

        {/* Subtotal */}
        <td className="px-4 py-3">
          <div className="text-sm font-semibold">{fmt(entry.subtotal)}</div>
        </td>

        {/* Ajuste */}
        <td className="px-4 py-3">
          {approved ? (
            <div className={cx("text-sm font-medium", (entry.adjustment_amount ?? 0) < 0 ? "text-rose-600" : "text-neutral-700")}>
              {(entry.adjustment_amount ?? 0) !== 0 ? fmt(entry.adjustment_amount) : <span className="text-neutral-400">—</span>}
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.01"
                value={adj}
                onChange={(e) => { setAdj(e.target.value); setDirty(true); }}
                className={cx(
                  "w-24 rounded-xl border px-2.5 py-1.5 text-sm outline-none transition",
                  "focus:border-neutral-400 focus:ring-1 focus:ring-neutral-200",
                  parseFloat(adj) < 0 ? "text-rose-600 border-rose-200 bg-rose-50" : "border-neutral-200 bg-white"
                )}
                placeholder="0"
              />
              <button
                onClick={() => setExpanded(!expanded)}
                className="p-1.5 rounded-lg hover:bg-neutral-100 transition text-neutral-400"
                title="Agregar motivo"
              >
                ✏️
              </button>
            </div>
          )}
        </td>

        {/* Bono */}
        <td className="px-4 py-3">
          {approved ? (
            <div className="text-sm font-medium text-emerald-700">
              {(entry.bonus_amount ?? 0) > 0 ? fmt(entry.bonus_amount) : <span className="text-neutral-400">—</span>}
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.01"
                min="0"
                value={bonus}
                onChange={(e) => { setBonus(e.target.value); setDirty(true); }}
                className="w-24 rounded-xl border border-neutral-200 bg-white px-2.5 py-1.5 text-sm outline-none transition focus:border-neutral-400 focus:ring-1 focus:ring-neutral-200"
                placeholder="0"
              />
              <button
                onClick={() => setExpanded(!expanded)}
                className="p-1.5 rounded-lg hover:bg-neutral-100 transition text-neutral-400"
                title="Agregar motivo"
              >
                ✏️
              </button>
            </div>
          )}
        </td>

        {/* Total */}
        <td className="px-4 py-3">
          <div className="text-sm font-bold text-neutral-900">{fmt(computedTotal)}</div>
        </td>

        {/* Guardar */}
        {!approved && (
          <td className="px-4 py-3">
            {dirty && (
              <button
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-700 transition disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Guardar"}
              </button>
            )}
          </td>
        )}
      </tr>

      {/* Fila de motivos expandida */}
      {expanded && !approved && (
        <tr className="bg-amber-50/30">
          <td colSpan={9} className="px-4 pb-3 pt-0">
            <div className="flex items-center gap-4 ml-12">
              <div className="flex-1">
                <label className="text-xs text-neutral-500 mb-1 block">Motivo del ajuste</label>
                <input
                  type="text"
                  value={adjNote}
                  onChange={(e) => { setAdjNote(e.target.value); setDirty(true); }}
                  placeholder="Ej. Descuento por falta, error en pago anterior..."
                  className="w-full rounded-xl border border-neutral-200 px-3 py-1.5 text-sm outline-none focus:border-neutral-400"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-neutral-500 mb-1 block">Motivo del bono</label>
                <input
                  type="text"
                  value={bonusNote}
                  onChange={(e) => { setBonusNote(e.target.value); setDirty(true); }}
                  placeholder="Ej. Bono por puntualidad, incentivo especial..."
                  className="w-full rounded-xl border border-neutral-200 px-3 py-1.5 text-sm outline-none focus:border-neutral-400"
                />
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function NominaPage() {
  const [period, setPeriod] = useState<Period | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  // La semana actualmente visible: guarda la fecha del domingo
  const [weekDate, setWeekDate] = useState<string>(sundayOfCurrentWeek());

  function showToast(type: "ok" | "err", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  // Calcula domingo/sábado para la semana actual
  const weekStart = weekDate;
  const weekEnd   = (() => {
    const d = new Date(weekDate + "T12:00:00");
    d.setDate(d.getDate() + 6);
    return d.toISOString().slice(0, 10);
  })();

  function prevWeek() {
    const d = new Date(weekDate + "T12:00:00");
    d.setDate(d.getDate() - 7);
    setWeekDate(d.toISOString().slice(0, 10));
  }

  function nextWeek() {
    const d = new Date(weekDate + "T12:00:00");
    d.setDate(d.getDate() + 7);
    setWeekDate(d.toISOString().slice(0, 10));
  }

  // Carga el periodo de la semana (si existe)
  const loadPeriod = useCallback(async () => {
    setLoading(true);
    setErr(null);
    setPeriod(null);
    try {
      // Busca en la lista de periodos el que corresponde a esta semana
      const res = await api.get("/nomina/periodos", { params: { week_start: weekStart } });
      const list = res.data?.data ?? res.data ?? [];
      const found = Array.isArray(list)
        ? list.find((p: Period) => p.week_start === weekStart)
        : null;

      if (found) {
        // Carga detalle con entradas
        const detail = await api.get(`/nomina/periodos/${found.id}`);
        setPeriod(detail.data?.period ?? detail.data);
      }
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "Error cargando nómina");
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => { loadPeriod(); }, [loadPeriod]);

  async function generate() {
    setGenerating(true);
    setErr(null);
    try {
      const res = await api.post("/nomina/periodos/generar", { week_date: weekStart });
      setPeriod(res.data?.period ?? null);
      showToast("ok", "Nómina generada correctamente");
    } catch (e: any) {
      showToast("err", e?.response?.data?.message ?? "No se pudo generar la nómina");
    } finally {
      setGenerating(false);
    }
  }

  async function approve() {
    if (!period) return;
    setApproving(true);
    try {
      const res = await api.post(`/nomina/periodos/${period.id}/aprobar`);
      setPeriod(res.data?.period ?? null);
      showToast("ok", "¡Nómina aprobada y cerrada!");
    } catch (e: any) {
      showToast("err", e?.response?.data?.message ?? "No se pudo aprobar");
    } finally {
      setApproving(false);
    }
  }

  async function saveEntry(entryId: string, patch: Partial<Entry>) {
    if (!period) return;
    try {
      const res = await api.patch(`/nomina/periodos/${period.id}/entradas/${entryId}`, patch);
      const updatedEntry: Entry = res.data?.entry;
      const newTotals = res.data?.period_totals;

      setPeriod(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          total_amount:      newTotals?.total_amount      ?? prev.total_amount,
          total_adjustments: newTotals?.total_adjustments ?? prev.total_adjustments,
          total_bonuses:     newTotals?.total_bonuses     ?? prev.total_bonuses,
          entries: prev.entries.map(e => e.id === entryId ? { ...e, ...updatedEntry } : e),
        };
      });
    } catch (e: any) {
      showToast("err", e?.response?.data?.message ?? "No se pudo guardar el ajuste");
      throw e;
    }
  }

  // Export como JSON para imprimir (PDF del navegador)
  function exportPDF() {
    if (!period) return;
    const w = window.open("", "_blank");
    if (!w) return;
    const rows = period.entries.map(e => `
      <tr>
        <td>${e.empleado_name}</td>
        <td>${fmtUnits(e.payment_type, e.units)}${e.rest_days_paid > 0 ? ` +${e.rest_days_paid}d` : ""}</td>
        <td>${e.payment_type === "hourly" ? "Por hora" : "Por día"}</td>
        <td>${fmt(e.rate)}</td>
        <td>${fmt(e.subtotal)}</td>
        <td>${e.adjustment_amount !== 0 ? fmt(e.adjustment_amount) : "—"}${e.adjustment_note ? ` (${e.adjustment_note})` : ""}</td>
        <td>${e.bonus_amount > 0 ? fmt(e.bonus_amount) : "—"}${e.bonus_note ? ` (${e.bonus_note})` : ""}</td>
        <td><strong>${fmt(e.total)}</strong></td>
      </tr>`).join("");

    w.document.write(`
      <!DOCTYPE html><html><head>
      <meta charset="utf-8"/>
      <title>Nómina ${weekLabel(period.week_start, period.week_end)}</title>
      <style>
        body { font-family: system-ui; font-size: 13px; padding: 32px; color: #111; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        .meta { color: #666; margin-bottom: 24px; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #f5f5f5; text-align: left; padding: 8px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: .05em; }
        td { padding: 8px 12px; border-bottom: 1px solid #eee; }
        .totals { margin-top: 24px; display: flex; gap: 32px; }
        .total-box { background: #f9f9f9; border-radius: 8px; padding: 16px 24px; }
        .total-box .label { font-size: 11px; color: #888; margin-bottom: 4px; }
        .total-box .val { font-size: 22px; font-weight: bold; }
        @media print { body { padding: 16px; } }
      </style>
      </head><body>
      <h1>Nómina Semanal</h1>
      <div class="meta">
        Semana: ${weekLabel(period.week_start, period.week_end)} &nbsp;·&nbsp;
        Estado: ${period.status === "approved" ? "✓ Aprobada" : "Borrador"} &nbsp;·&nbsp;
        Empleados: ${period.entries.length}
      </div>
      <table>
        <thead><tr>
          <th>Empleado</th><th>Horas/Días</th><th>Tipo</th><th>Tarifa</th>
          <th>Subtotal</th><th>Ajuste</th><th>Bono</th><th>Total</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="totals">
        <div class="total-box"><div class="label">Total Nómina</div><div class="val">${fmt(period.total_amount)}</div></div>
        <div class="total-box"><div class="label">Ajustes</div><div class="val">${fmt(period.total_adjustments)}</div></div>
        <div class="total-box"><div class="label">Bonos</div><div class="val">${fmt(period.total_bonuses)}</div></div>
        <div class="total-box"><div class="label">Empleados</div><div class="val">${period.entries.length}</div></div>
      </div>
      <script>window.onload = () => window.print();</script>
      </body></html>`);
    w.document.close();
  }

  function exportCSV() {
    if (!period) return;
    const header = "Empleado,Horas/Días,Tipo,Tarifa,Subtotal,Ajuste,Motivo Ajuste,Bono,Motivo Bono,Total\n";
    const rows = period.entries.map(e =>
      [
        `"${e.empleado_name}"`,
        fmtUnits(e.payment_type, e.units),
        e.payment_type === "hourly" ? "Por hora" : "Por día",
        e.rate,
        e.subtotal,
        e.adjustment_amount,
        `"${e.adjustment_note ?? ""}"`,
        e.bonus_amount,
        `"${e.bonus_note ?? ""}"`,
        e.total,
      ].join(",")
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nomina_${period.week_start}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const approved  = period?.status === "approved";
  const totalEmp  = period?.entries.length ?? 0;
  const avgTotal  = totalEmp > 0 ? (period?.total_amount ?? 0) / totalEmp : 0;

  return (
    <div className="space-y-5">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="relative rounded-3xl bg-neutral-900 overflow-hidden px-6 py-6 text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-white/[0.03]" />
          <div className="absolute top-6 right-24 h-24 w-24 rounded-full bg-white/[0.04]" />
        </div>
        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Nómina Semanal</h1>
            <p className="text-white/50 text-sm mt-1">Genera, revisa y aprueba el pago semanal.</p>
          </div>
          {period && (
            <span className={cx(
              "inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium",
              approved
                ? "bg-emerald-500/15 border-emerald-400/30 text-emerald-300"
                : "bg-amber-500/15 border-amber-400/30 text-amber-300"
            )}>
              {approved ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              {approved ? "Aprobada" : "Borrador"}
            </span>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={cx(
          "rounded-2xl border px-4 py-3 text-sm font-medium",
          toast.type === "ok" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"
        )}>
          {toast.type === "ok" ? "✅" : "❌"} {toast.msg}
        </div>
      )}

      {/* ── Selector de semana ──────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button onClick={prevWeek} className="h-10 w-10 rounded-2xl border bg-white hover:bg-neutral-50 flex items-center justify-center transition">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 rounded-2xl border bg-white px-5 py-2.5 text-center">
          <span className="font-semibold text-sm">{weekLabel(weekStart, weekEnd)}</span>
          <span className="text-xs text-neutral-400 ml-2">Dom → Sáb</span>
        </div>
        <button onClick={nextWeek} className="h-10 w-10 rounded-2xl border bg-white hover:bg-neutral-50 flex items-center justify-center transition">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {err && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{err}</div>
      )}

      {loading ? (
        <div className="rounded-3xl border bg-white p-16 flex flex-col items-center gap-3 text-neutral-500">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-300" />
          <span className="text-sm">Cargando nómina...</span>
        </div>
      ) : !period ? (
        /* ── Sin periodo generado ─────────────────────────────────────── */
        <div className="rounded-3xl border bg-white p-12 flex flex-col items-center gap-4 text-center">
          <div className="h-16 w-16 rounded-3xl bg-neutral-100 flex items-center justify-center text-3xl">💰</div>
          <div>
            <div className="font-semibold text-lg">Sin nómina generada</div>
            <div className="text-sm text-neutral-500 mt-1">
              Genera la nómina para la semana {weekLabel(weekStart, weekEnd)}
            </div>
          </div>
          <button
            onClick={generate}
            disabled={generating}
            className="inline-flex items-center gap-2 rounded-2xl bg-neutral-900 px-6 py-3 text-sm font-medium text-white hover:bg-neutral-700 transition disabled:opacity-50"
          >
            {generating
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Generando...</>
              : <><RefreshCw className="h-4 w-4" /> Generar Nómina</>}
          </button>
        </div>
      ) : (
        /* ── Periodo cargado ──────────────────────────────────────────── */
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5 items-start">

          {/* Tabla de empleados */}
          <div className="rounded-3xl border bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <div>
                <div className="font-semibold">Detalle por empleado</div>
                <div className="text-xs text-neutral-500 mt-0.5">{weekLabel(period.week_start, period.week_end)}</div>
              </div>
              {!approved && (
                <button
                  onClick={generate}
                  disabled={generating}
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-neutral-200 px-3 py-2 text-xs text-neutral-600 hover:bg-neutral-50 transition"
                >
                  <RefreshCw className={cx("h-3.5 w-3.5", generating && "animate-spin")} />
                  Recalcular
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Empleado</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Horas/Días</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Tipo</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Tarifa</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Subtotal</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Ajuste</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Bono</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Total</th>
                    {!approved && <th className="px-4 py-3" />}
                  </tr>
                </thead>
                <tbody>
                  {period.entries.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-sm text-neutral-500">
                        Sin empleados en este periodo.
                      </td>
                    </tr>
                  ) : (
                    period.entries.map(entry => (
                      <EntryRow
                        key={entry.id}
                        entry={entry}
                        approved={approved}
                        onSave={saveEntry}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer con total */}
            <div className="px-5 py-4 border-t bg-neutral-50 flex items-center justify-between">
              <span className="text-sm text-neutral-600">{period.entries.length} empleado{period.entries.length !== 1 ? "s" : ""}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-500">Total:</span>
                <span className="text-lg font-bold text-neutral-900">{fmt(period.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Resumen */}
            <div className="rounded-3xl border bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b">
                <div className="text-sm font-semibold">Resumen de Nómina</div>
              </div>
              <div className="p-4 space-y-3">
                <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4">
                  <div className="text-xs text-blue-600 mb-1 font-medium">Total Nómina</div>
                  <div className="text-3xl font-bold text-blue-700">{fmt(period.total_amount)}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-2xl bg-amber-50 border border-amber-100 p-3">
                    <div className="text-xs text-amber-600 mb-1">Ajustes</div>
                    <div className="text-xl font-bold text-amber-700">{fmt(period.total_adjustments)}</div>
                  </div>
                  <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-3">
                    <div className="text-xs text-emerald-600 mb-1">Bonos</div>
                    <div className="text-xl font-bold text-emerald-700">{fmt(period.total_bonuses)}</div>
                  </div>
                </div>
                <div className="rounded-2xl border bg-neutral-50 p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">Empleados</span>
                    <span className="font-semibold">{totalEmp}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">Promedio</span>
                    <span className="font-semibold">{fmt(avgTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="rounded-3xl border bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b">
                <div className="text-sm font-semibold">Acciones</div>
              </div>
              <div className="p-4 space-y-2">
                {!approved && (
                  <button
                    onClick={approve}
                    disabled={approving}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition disabled:opacity-50"
                  >
                    {approving
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <CheckCircle2 className="h-4 w-4" />}
                    Aprobar Nómina
                  </button>
                )}
                <button
                  onClick={exportPDF}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition"
                >
                  <Download className="h-4 w-4" /> Exportar PDF
                </button>
                <button
                  onClick={exportCSV}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white hover:bg-neutral-50 px-4 py-3 text-sm font-medium text-neutral-700 transition"
                >
                  <FileSpreadsheet className="h-4 w-4" /> Exportar CSV
                </button>
              </div>
            </div>

            {/* Nota estado */}
            <div className={cx(
              "rounded-3xl border p-4 text-xs",
              approved
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-amber-50 border-amber-200 text-amber-700"
            )}>
              {approved
                ? <>✅ Nómina cerrada. No puede modificarse.<br />Aprobada el {new Date(period.approved_at!).toLocaleDateString("es-MX", { day:"numeric", month:"long", year:"numeric" })}.</>
                : <>⚠️ En borrador. Puedes editar ajustes y bonos. Una vez aprobada, no podrá modificarse.</>
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}