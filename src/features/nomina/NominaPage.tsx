// src/features/nomina/NominaPage.tsx
import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/lib/http";
import {
  CheckCircle2, ChevronLeft, ChevronRight,
  Download, FileSpreadsheet, Loader2,
  AlertTriangle, RefreshCw, Clock, CalendarDays,
  DollarSign, Users, TrendingDown, TrendingUp,
  Pencil, Check,
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
  excluded_employee_ids?: string[];
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

function toLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function todayLocalDate(): string {
  return toLocalDate(new Date());
}

function initials(name: string): string {
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700", "bg-emerald-100 text-emerald-700",
  "bg-violet-100 text-violet-700", "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700", "bg-teal-100 text-teal-700",
  "bg-indigo-100 text-indigo-700", "bg-orange-100 text-orange-700",
];
function avatarColor(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

// ─── Fila editable ────────────────────────────────────────────────────────────
function EntryRow({
  entry, period, approved, onSave, onToggleExclude,
}: {
  entry: Entry;
  period: Period;
  approved: boolean;
  onSave: (id: string, patch: Partial<Entry>) => Promise<void>;
  onToggleExclude: (empleadoId: string, excluir: boolean) => Promise<void>;
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
  const isExcluded = (period?.excluded_employee_ids ?? []).includes(entry.empleado_id);

  return (
    <>
      <tr className={cx(
        "border-t border-neutral-50 transition-colors group",
        isExcluded ? "opacity-40 bg-neutral-50" : (dirty ? "bg-amber-50/30" : "hover:bg-neutral-50/50")
      )}>
        {/* Empleado */}
        <td className="px-5 py-4">
          <div className="flex items-center gap-3">
            <div className={cx("h-10 w-10 rounded-2xl flex items-center justify-center text-xs font-bold shrink-0", avatarColor(entry.empleado_name))}>
              {initials(entry.empleado_name)}
            </div>
            <div>
              <div className="text-sm font-bold text-obsidian">{entry.empleado_name}</div>
              {entry.empleado_role && <div className="text-[10px] text-neutral-400 uppercase tracking-wider mt-0.5">{entry.empleado_role}</div>}
            </div>
          </div>
        </td>

        {/* Horas/días */}
        <td className="px-5 py-4">
          <div className="text-sm font-semibold text-obsidian">{fmtUnits(entry.payment_type, entry.units)}</div>
          {entry.rest_days_paid > 0 && (
            <div className="text-[10px] text-emerald-600 font-medium mt-0.5">+{entry.rest_days_paid} descanso pagado</div>
          )}
        </td>

        {/* Tipo */}
        <td className="px-5 py-4">
          <span className={cx(
            "inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
            entry.payment_type === "hourly"
              ? "bg-blue-50 text-blue-600 border-blue-100"
              : "bg-violet-50 text-violet-600 border-violet-100"
          )}>
            {entry.payment_type === "hourly"
              ? <><Clock className="h-3 w-3" />Por hora</>
              : <><CalendarDays className="h-3 w-3" />Por día</>}
          </span>
        </td>

        {/* Tarifa */}
        <td className="px-5 py-4">
          <div className="text-sm font-semibold text-obsidian">{fmt(entry.rate)}</div>
          <div className="text-[10px] text-neutral-400">{entry.payment_type === "hourly" ? "/hora" : "/día"}</div>
        </td>

        {/* Subtotal */}
        <td className="px-5 py-4">
          <div className="text-sm font-bold text-obsidian">{fmt(entry.subtotal)}</div>
        </td>

        {/* Ajuste */}
        <td className="px-5 py-4">
          {approved ? (
            <div className={cx("text-sm font-semibold", (entry.adjustment_amount ?? 0) < 0 ? "text-rose-500" : "text-neutral-500")}>
              {(entry.adjustment_amount ?? 0) !== 0 ? fmt(entry.adjustment_amount) : <span className="text-neutral-300">—</span>}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="0.01"
                value={adj}
                onChange={(e) => { setAdj(e.target.value); setDirty(true); }}
                className={cx(
                  "w-24 rounded-xl border px-2.5 py-1.5 text-sm font-medium outline-none transition",
                  "focus:ring-2 focus:ring-obsidian/10 focus:border-neutral-300",
                  parseFloat(adj) < 0 ? "text-rose-600 border-rose-200 bg-rose-50" : "border-neutral-200 bg-white text-obsidian"
                )}
                placeholder="0"
              />
              <button
                onClick={() => setExpanded(!expanded)}
                className={cx(
                  "h-7 w-7 rounded-lg flex items-center justify-center transition",
                  expanded ? "bg-obsidian text-white" : "border border-neutral-200 text-neutral-400 hover:bg-neutral-50"
                )}
                title="Agregar motivo"
              >
                <Pencil className="h-3 w-3" />
              </button>
            </div>
          )}
        </td>

        {/* Bono */}
        <td className="px-5 py-4">
          {approved ? (
            <div className="text-sm font-semibold text-emerald-600">
              {(entry.bonus_amount ?? 0) > 0 ? fmt(entry.bonus_amount) : <span className="text-neutral-300">—</span>}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="0.01"
                min="0"
                value={bonus}
                onChange={(e) => { setBonus(e.target.value); setDirty(true); }}
                className="w-24 rounded-xl border border-neutral-200 bg-white px-2.5 py-1.5 text-sm font-medium text-obsidian outline-none transition focus:ring-2 focus:ring-obsidian/10 focus:border-neutral-300"
                placeholder="0"
              />
              <button
                onClick={() => setExpanded(!expanded)}
                className={cx(
                  "h-7 w-7 rounded-lg flex items-center justify-center transition",
                  expanded ? "bg-obsidian text-white" : "border border-neutral-200 text-neutral-400 hover:bg-neutral-50"
                )}
                title="Agregar motivo"
              >
                <Pencil className="h-3 w-3" />
              </button>
            </div>
          )}
        </td>

        {/* Total */}
        <td className="px-5 py-4">
          <div className="text-sm font-black text-obsidian">{fmt(computedTotal)}</div>
        </td>

        {/* Guardar */}
        {!approved && (
          <td className="px-5 py-4">
            {dirty && (
              <button
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-xl bg-obsidian px-3 py-1.5 text-[11px] font-bold text-white hover:bg-gold transition disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Check className="h-3 w-3" />Guardar</>}
              </button>
            )}
          </td>
        )}

        {/* Excluir/Incluir */}
        {!approved && (
          <td className="px-5 py-4 text-right">
            <button
              onClick={async () => {
                await onToggleExclude(entry.empleado_id, !isExcluded);
              }}
              className={cx(
                "h-8 px-3 rounded-xl text-[11px] font-bold transition border",
                isExcluded
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                  : "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100"
              )}
              title={isExcluded ? "Incluir en nómina" : "Excluir de nómina"}
            >
              {isExcluded ? "✓ Incluir" : "✕ Excluir"}
            </button>
          </td>
        )}
      </tr>

      {/* Fila de motivos expandida */}
      {expanded && !approved && (
        <tr className="bg-amber-50/20">
          <td colSpan={9} className="px-5 pb-4 pt-0">
            <div className="flex items-center gap-4 ml-14 mt-2">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 block">Motivo del ajuste</label>
                <input
                  type="text"
                  value={adjNote}
                  onChange={(e) => { setAdjNote(e.target.value); setDirty(true); }}
                  placeholder="Ej. Descuento por falta, error en pago anterior..."
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-300 focus:ring-2 focus:ring-obsidian/10"
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 block">Motivo del bono</label>
                <input
                  type="text"
                  value={bonusNote}
                  onChange={(e) => { setBonusNote(e.target.value); setDirty(true); }}
                  placeholder="Ej. Bono por puntualidad, incentivo especial..."
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-300 focus:ring-2 focus:ring-obsidian/10"
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

  const [refDate, setRefDate] = useState<string>(todayLocalDate());

  function showToast(type: "ok" | "err", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  const weekStart = period?.week_start || refDate;
  const weekEnd   = period?.week_end || (() => {
    const d = new Date(refDate + "T12:00:00");
    d.setDate(d.getDate() + 6);
    return toLocalDate(d);
  })();

  function prevWeek() {
    const d = new Date(weekStart + "T12:00:00");
    d.setDate(d.getDate() - 7);
    setRefDate(toLocalDate(d));
    setPeriod(null);
  }

  function nextWeek() {
    const d = new Date(weekStart + "T12:00:00");
    d.setDate(d.getDate() + 7);
    setRefDate(toLocalDate(d));
    setPeriod(null);
  }

  const loadPeriod = useCallback(async () => {
    setLoading(true);
    setErr(null);
    setPeriod(null);
    try {
      const res = await api.get("/nomina/periodos");
      const list = res.data?.data ?? res.data ?? [];
      // Buscar periodo que contenga el refDate
      const found = Array.isArray(list)
        ? list.find((p: Period) => refDate >= p.week_start && refDate <= p.week_end)
        : null;

      if (found) {
        const detail = await api.get(`/nomina/periodos/${found.id}`);
        setPeriod(detail.data?.period ?? detail.data);
      }
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "Error cargando nómina");
    } finally {
      setLoading(false);
    }
  }, [refDate]);

  useEffect(() => { loadPeriod(); }, [loadPeriod]);

  async function generate() {
    setGenerating(true);
    setErr(null);
    try {
      const res = await api.post("/nomina/periodos/generar", { week_date: refDate });
      const newPeriod = res.data?.period ?? null;
      setPeriod(newPeriod);
      if (newPeriod) {
        setRefDate(newPeriod.week_start);
      }
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

  async function toggleExclude(empleadoId: string, excluir: boolean) {
    if (!period) return;
    try {
      const res = await api.post(`/nomina/periodos/${period.id}/excluir`, {
        empleado_id: empleadoId,
        excluir,
      });
      setPeriod(prev => prev ? { ...prev, excluded_employee_ids: res.data?.excluded_employee_ids ?? [] } : prev);
      showToast("ok", res.data?.message ?? (excluir ? "Empleado excluido" : "Empleado incluido"));
      // Opcional: Generar de nuevo al cambiar para que se recálcule el total
      await generate();
    } catch (e: any) {
      showToast("err", e?.response?.data?.message ?? "Error modificando exclusión");
    }
  }

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
  const draftCount = period?.entries.filter(e => (e.adjustment_amount ?? 0) < 0).length ?? 0;

  return (
    <div className="space-y-6">

      {/* ── Header Hero ─────────────────────────────────────────────────────── */}
      <div className="relative rounded-[40px] bg-obsidian overflow-hidden px-8 py-8 text-white">
        {/* Organic blobs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/[0.03]" />
          <div className="absolute top-8 right-32 h-32 w-32 rounded-full bg-white/[0.04]" />
          <div className="absolute bottom-0 left-1/3 h-20 w-40 rounded-full bg-gold/10" />
        </div>

        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-1">Recursos Humanos</p>
            <h1 className="text-3xl font-black tracking-tight">Nómina Semanal</h1>
            <p className="text-white/50 text-sm mt-1">Genera, revisa y aprueba el pago semanal.</p>
          </div>

          <div className="flex items-center gap-3">
            {period && (
              <span className={cx(
                "inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-xs font-bold uppercase tracking-widest",
                approved
                  ? "bg-emerald-500/15 border-emerald-400/30 text-emerald-300"
                  : "bg-amber-500/15 border-amber-400/30 text-amber-300"
              )}>
                {approved ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                {approved ? "Aprobada" : "Borrador"}
              </span>
            )}

            {/* Week navigator inline in header */}
            <div className="flex items-center gap-2 bg-white/10 rounded-2xl p-1">
              <button
                onClick={prevWeek}
                className="h-9 w-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
              >
                <ChevronLeft className="h-4 w-4 text-white" />
              </button>
              <span className="px-3 text-sm font-semibold text-white whitespace-nowrap">
                {weekLabel(weekStart, weekEnd)}
              </span>
              <button
                onClick={nextWeek}
                className="h-9 w-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
              >
                <ChevronRight className="h-4 w-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={cx(
          "rounded-2xl border px-5 py-3 text-sm font-bold flex items-center gap-3",
          toast.type === "ok"
            ? "bg-emerald-50 border-emerald-100 text-emerald-700"
            : "bg-rose-50 border-rose-100 text-rose-700"
        )}>
          {toast.type === "ok"
            ? <CheckCircle2 className="h-4 w-4" />
            : <AlertTriangle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      {err && (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-5 py-3 text-sm font-medium text-rose-700 flex items-center gap-3">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {err}
        </div>
      )}

      {loading ? (
        <div className="rounded-[40px] border bg-white p-20 flex flex-col items-center gap-4 text-neutral-400">
          <div className="h-12 w-12 border-4 border-neutral-100 border-t-obsidian rounded-full animate-spin" />
          <span className="text-xs font-bold uppercase tracking-widest">Cargando nómina...</span>
        </div>
      ) : !period ? (
        /* ── Sin periodo generado ─────────────────────────────────────── */
        <div className="rounded-[40px] border bg-white p-16 flex flex-col items-center gap-6 text-center">
          <div className="h-20 w-20 rounded-[28px] bg-neutral-50 border border-neutral-100 flex items-center justify-center">
            <DollarSign className="h-10 w-10 text-neutral-200" />
          </div>
          <div>
            <div className="font-black text-2xl text-obsidian">Sin Nómina Generada</div>
            <div className="text-sm text-neutral-400 mt-2 max-w-xs">
              No hay un periodo para la semana <span className="font-bold text-obsidian">{weekLabel(weekStart, weekEnd)}</span>. Genera uno para empezar.
            </div>
          </div>
          <button
            onClick={generate}
            disabled={generating}
            className="inline-flex items-center gap-2 rounded-2xl bg-obsidian px-8 py-3.5 text-sm font-bold text-white hover:bg-gold transition-all shadow-lg shadow-obsidian/20 disabled:opacity-50"
          >
            {generating
              ? <><Loader2 className="h-4 w-4 animate-spin" />Generando...</>
              : <><RefreshCw className="h-4 w-4" />Generar Nómina</>}
          </button>
        </div>
      ) : (
        /* ── Periodo cargado ──────────────────────────────────────────── */
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 items-start">

          {/* ─ Tabla de empleados ─────────────────────────────────── */}
          <div className="rounded-[40px] border border-neutral-100 bg-white shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-neutral-50 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-obsidian tracking-tight">Detalle por Empleado</h2>
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">
                  Semana {weekLabel(period.week_start, period.week_end)}
                </p>
              </div>
              {!approved && (
                <button
                  onClick={generate}
                  disabled={generating}
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-neutral-100 bg-white px-4 py-2 text-xs font-bold text-neutral-500 hover:bg-neutral-50 transition"
                >
                  <RefreshCw className={cx("h-3.5 w-3.5", generating && "animate-spin")} />
                  Recalcular
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50/80 border-b border-neutral-50">
                  <tr>
                    {["Empleado", "Horas/Días", "Tipo", "Tarifa", "Subtotal", "Ajuste", "Bono", "Total"].map((h, i) => (
                      <th key={i} className="text-left px-5 py-4 text-[10px] font-bold text-neutral-400 uppercase tracking-[0.1em]">
                        {h}
                      </th>
                    ))}
                    {!approved && <th className="px-5 py-4 text-[10px] font-bold text-neutral-400 uppercase tracking-[0.1em]">Guardar</th>}
                    {!approved && <th className="px-5 py-4"></th>}
                  </tr>
                </thead>
                <tbody>
                  {period.entries.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-5 py-16 text-center">
                        <Users className="h-10 w-10 text-neutral-100 mx-auto mb-3" />
                        <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest">Sin empleados en este periodo</p>
                      </td>
                    </tr>
                  ) : (
                    period.entries.map(entry => (
                      <EntryRow
                        key={entry.id}
                        entry={entry}
                        period={period}
                        approved={approved}
                        onSave={saveEntry}
                        onToggleExclude={toggleExclude}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer con total */}
            <div className="px-8 py-5 border-t border-neutral-50 bg-neutral-50/50 flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
                {period.entries.length} empleado{period.entries.length !== 1 ? "s" : ""}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Total semana</span>
                <span className="text-2xl font-black text-obsidian">{fmt(period.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* ─ Panel lateral ──────────────────────────────────────── */}
          <div className="space-y-4">

            {/* Resumen de nómina */}
            <div className="rounded-[40px] border border-neutral-100 bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-neutral-50">
                <h3 className="text-sm font-black text-obsidian tracking-tight">Resumen de Nómina</h3>
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5">Totales del periodo</p>
              </div>
              <div className="p-6 space-y-4">
                {/* Total destacado */}
                <div className="rounded-[28px] bg-obsidian p-5 text-white">
                  <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/50 mb-2">Total a Pagar</div>
                  <div className="text-3xl font-black tracking-tight">{fmt(period.total_amount)}</div>
                </div>

                {/* Ajustes y bonos */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-rose-50 border border-rose-100 p-4">
                    <div className="flex items-center gap-1.5 text-rose-500 mb-2">
                      <TrendingDown className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Ajustes</span>
                    </div>
                    <div className="text-xl font-black text-rose-600">{fmt(period.total_adjustments)}</div>
                  </div>
                  <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
                    <div className="flex items-center gap-1.5 text-emerald-600 mb-2">
                      <TrendingUp className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Bonos</span>
                    </div>
                    <div className="text-xl font-black text-emerald-600">{fmt(period.total_bonuses)}</div>
                  </div>
                </div>

                {/* Stats */}
                <div className="rounded-2xl border border-neutral-50 bg-neutral-50/50 p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Empleados</span>
                    <span className="text-sm font-black text-obsidian">{totalEmp}</span>
                  </div>
                  <div className="w-full h-px bg-neutral-100" />
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Prom. por empleado</span>
                    <span className="text-sm font-black text-obsidian">{fmt(avgTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="rounded-[40px] border border-neutral-100 bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-neutral-50">
                <h3 className="text-sm font-black text-obsidian tracking-tight">Acciones</h3>
              </div>
              <div className="p-6 space-y-3">
                {!approved && (
                  <button
                    onClick={approve}
                    disabled={approving}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-obsidian px-4 py-3.5 text-xs font-bold text-white uppercase tracking-widest hover:bg-gold transition-all shadow-lg shadow-obsidian/10 disabled:opacity-50"
                  >
                    {approving
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <CheckCircle2 className="h-4 w-4" />}
                    Aprobar Nómina
                  </button>
                )}
                <button
                  onClick={exportPDF}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-neutral-100 bg-white hover:bg-neutral-50 px-4 py-3 text-xs font-bold text-obsidian uppercase tracking-widest transition"
                >
                  <Download className="h-4 w-4" />Exportar PDF
                </button>
                <button
                  onClick={exportCSV}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-neutral-100 bg-white hover:bg-neutral-50 px-4 py-3 text-xs font-bold text-obsidian uppercase tracking-widest transition"
                >
                  <FileSpreadsheet className="h-4 w-4" />Exportar CSV
                </button>
              </div>
            </div>

            {/* Estado / nota */}
            {approved ? (
              <div className="rounded-[28px] border border-emerald-100 bg-emerald-50 p-5 text-xs text-emerald-700 flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold mb-1">Nómina Cerrada</div>
                  No puede modificarse.<br />
                  Aprobada el {new Date(period.approved_at!).toLocaleDateString("es-MX", { day:"numeric", month:"long", year:"numeric" })}.
                </div>
              </div>
            ) : (
              <div className="rounded-[28px] border border-amber-100 bg-amber-50 p-5 text-xs text-amber-700 flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold mb-1">En Borrador</div>
                  {draftCount > 0 && <div className="mb-1">Hay <strong>{draftCount}</strong> registros con ajustes negativos.</div>}
                  Puedes editar ajustes y bonos. Una vez aprobada, no podrá modificarse.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}