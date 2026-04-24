// src/features/nomina/NominaPage.tsx
import { useCallback, useEffect, useState } from "react";
import api from "@/lib/http";
import {
  CheckCircle2, ChevronLeft, ChevronRight,
  Download, FileSpreadsheet, Loader2,
  AlertTriangle, RefreshCw, Clock, CalendarDays,
  DollarSign, Users, TrendingDown, TrendingUp,
  Pencil, Check, MoreVertical, Save, Trash2
} from "lucide-react";
import { isEnabled } from "@/lib/featureFlags";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

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
  tardiness_count: number;
  absences_count: number;
  penalty_active: boolean;
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
  entry, period, approved, onSave, onToggleExclude, pendingPatch, onPatch
}: {
  entry: Entry;
  period: Period;
  approved: boolean;
  onSave: (id: string, patch: Partial<Entry>) => Promise<void>;
  onToggleExclude: (empleadoId: string, excluir: boolean) => Promise<void>;
  pendingPatch?: Partial<Entry>;
  onPatch: (id: string, patch: Partial<Entry>) => void;
}) {
  const currentAdj = pendingPatch?.adjustment_amount ?? entry.adjustment_amount ?? 0;
  const currentAdjNote = pendingPatch?.adjustment_note ?? entry.adjustment_note ?? "";
  const currentBonus = pendingPatch?.bonus_amount ?? entry.bonus_amount ?? 0;
  const currentBonusNote = pendingPatch?.bonus_note ?? entry.bonus_note ?? "";

  const [adj, setAdj] = useState(String(currentAdj));
  const [adjNote, setAdjNote] = useState(currentAdjNote);
  const [bonus, setBonus] = useState(String(currentBonus));
  const [bonusNote, setBonusNote] = useState(currentBonusNote);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const [editingAdj, setEditingAdj] = useState(false);
  const [editingBonus, setEditingBonus] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showConfirmExclude, setShowConfirmExclude] = useState(false);

  // Sync internal state if pendingPatch changes from outside (not strictly needed since we update patch on edit, but good practice)
  useEffect(() => {
    if (!dirty) {
      setAdj(String(currentAdj));
      setAdjNote(currentAdjNote);
      setBonus(String(currentBonus));
      setBonusNote(currentBonusNote);
    }
  }, [currentAdj, currentAdjNote, currentBonus, currentBonusNote, dirty]);

  function handleChange() {
    setDirty(true);
    const parsedAdj = parseFloat(adj) || 0;
    const parsedBonus = parseFloat(bonus) || 0;
    onPatch(entry.id, {
      adjustment_amount: parsedAdj,
      adjustment_note: adjNote || null,
      bonus_amount: parsedBonus,
      bonus_note: bonusNote || null,
    } as any);
  }

  // Update patch whenever inputs change
  useEffect(() => {
    if (dirty) {
      handleChange();
    }
  }, [adj, adjNote, bonus, bonusNote]);

  const computedTotal = entry.subtotal + currentAdj + currentBonus;
  const isExcluded = (period?.excluded_employee_ids ?? []).includes(entry.empleado_id);

  return (
    <>
      <tr className={cx(
        "border-t border-k-border transition-colors group",
        isExcluded ? "opacity-40 bg-k-bg-card2" : (dirty ? "bg-amber-50/30" : "hover:bg-k-bg-card2/50")
      )}>
        {/* Empleado */}
        <td className="px-5 py-4">
          <div className="flex items-center gap-3">
            <div className={cx("h-10 w-10 rounded-2xl flex items-center justify-center text-xs font-bold shrink-0", avatarColor(entry.empleado_name))}>
              {initials(entry.empleado_name)}
            </div>
            <div>
              <div className="text-sm font-bold text-k-text-h">{entry.empleado_name}</div>
              {entry.empleado_role && <div className="text-[10px] text-k-text-b uppercase tracking-wider mt-0.5">{entry.empleado_role}</div>}
            </div>
          </div>
        </td>

        {/* Horas/días */}
        <td className="px-5 py-4">
          <div className="text-sm font-semibold text-k-text-h">{fmtUnits(entry.payment_type, entry.units)}</div>
          {entry.rest_days_paid > 0 && (
            <div className="text-[10px] text-emerald-600 font-medium mt-0.5">+{entry.rest_days_paid} descanso pagado</div>
          )}
          {entry.penalty_active && (
            <div className="text-[10px] text-rose-500 font-bold mt-0.5">🚨 Sin pago descanso</div>
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
          <div className="text-sm font-semibold text-k-text-h">{fmt(entry.rate)}</div>
          <div className="text-[10px] text-k-text-b">{entry.payment_type === "hourly" ? "/hora" : "/día"}</div>
        </td>

        {/* Subtotal */}
        <td className="px-5 py-4">
          <div className="text-sm font-bold text-k-text-h">{fmt(entry.subtotal)}</div>
        </td>

        {/* Ajuste */}
        <td className="px-5 py-4">
          {approved ? (
            <div className={cx("text-sm font-semibold", currentAdj < 0 ? "text-rose-500" : "text-k-text-b")}>
              {currentAdj !== 0 ? fmt(currentAdj) : <span className="text-k-text-b">—</span>}
            </div>
          ) : (isEnabled("newManagementAdmin") && !editingAdj) ? (
            <div 
              onClick={() => { setEditingAdj(true); setExpanded(true); }}
              className="cursor-pointer group flex items-center gap-2"
            >
              <span className={cx("text-sm font-semibold transition-colors", currentAdj < 0 ? "text-rose-500" : "text-k-text-b group-hover:text-k-text-h")}>
                {currentAdj !== 0 ? fmt(currentAdj) : "—"}
              </span>
              <Pencil className="h-3 w-3 text-k-text-b group-hover:text-k-text-h transition-colors" />
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="0.01"
                value={adj}
                onChange={(e) => { setAdj(e.target.value); setDirty(true); }}
                onBlur={() => setEditingAdj(false)}
                autoFocus={editingAdj}
                className={cx(
                  "w-24 rounded-xl border px-2.5 py-1.5 text-sm font-medium outline-none transition",
                  "focus:ring-2 focus:ring-obsidian/10 focus:border-neutral-300",
                  parseFloat(adj) < 0 ? "text-rose-600 border-rose-200 bg-rose-50" : "border-k-border bg-k-bg-card text-k-text-h"
                )}
                placeholder="0"
              />
              {!isEnabled("newManagementAdmin") && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className={cx(
                    "h-7 w-7 rounded-lg flex items-center justify-center transition",
                    expanded ? "bg-k-bg-sidebar text-white" : "border border-k-border text-k-text-b hover:bg-k-bg-card2"
                  )}
                  title="Agregar motivo"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
        </td>

        {/* Bono */}
        <td className="px-5 py-4">
          {approved ? (
            <div className="text-sm font-semibold text-emerald-600">
              {currentBonus > 0 ? fmt(currentBonus) : <span className="text-k-text-b">—</span>}
            </div>
          ) : (isEnabled("newManagementAdmin") && !editingBonus) ? (
            <div 
              onClick={() => { setEditingBonus(true); setExpanded(true); }}
              className="cursor-pointer group flex items-center gap-2"
            >
              <span className={cx("text-sm font-semibold transition-colors", currentBonus > 0 ? "text-emerald-600" : "text-k-text-b group-hover:text-k-text-h")}>
                {currentBonus !== 0 ? fmt(currentBonus) : "—"}
              </span>
              <Pencil className="h-3 w-3 text-k-text-b group-hover:text-k-text-h transition-colors" />
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="0.01"
                min="0"
                value={bonus}
                onChange={(e) => { setBonus(e.target.value); setDirty(true); }}
                onBlur={() => setEditingBonus(false)}
                autoFocus={editingBonus}
                className="w-24 rounded-xl border border-k-border bg-k-bg-card px-2.5 py-1.5 text-sm font-medium text-k-text-h outline-none transition focus:ring-2 focus:ring-obsidian/10 focus:border-neutral-300"
                placeholder="0"
              />
              {!isEnabled("newManagementAdmin") && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className={cx(
                    "h-7 w-7 rounded-lg flex items-center justify-center transition",
                    expanded ? "bg-k-bg-sidebar text-white" : "border border-k-border text-k-text-b hover:bg-k-bg-card2"
                  )}
                  title="Agregar motivo"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
        </td>

        {/* Total */}
        <td className="px-5 py-4">
          <div className="text-sm font-black text-k-text-h">{fmt(computedTotal)}</div>
        </td>

        {/* Guardar/Acciones */}
        {!approved && (
          <td className="px-5 py-4 text-right relative">
            {isEnabled("newManagementAdmin") ? (
              <div className="relative inline-block text-left">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="h-8 w-8 rounded-xl flex items-center justify-center hover:bg-neutral-100 transition-colors"
                >
                  <MoreVertical className="h-4 w-4 text-k-text-b" />
                </button>
                {showDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                    <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-k-bg-card border border-k-border shadow-xl z-20 overflow-hidden py-2">
                      <button
                        onClick={async () => {
                          setShowDropdown(false);
                          if (!isEnabled("newManagementAdmin")) {
                            setSaving(true);
                            await onSave(entry.id, {
                              adjustment_amount: parseFloat(adj) || 0,
                              adjustment_note: adjNote || null,
                              bonus_amount: parseFloat(bonus) || 0,
                              bonus_note: bonusNote || null,
                            });
                            setSaving(false);
                            setDirty(false);
                          } else {
                            // "Guardar" individual can just trigger the global save for this row or we can leave it as "dirty will be picked up by global save".
                            // But maybe they want to force save one row.
                            setSaving(true);
                            await onSave(entry.id, {
                              adjustment_amount: parseFloat(adj) || 0,
                              adjustment_note: adjNote || null,
                              bonus_amount: parseFloat(bonus) || 0,
                              bonus_note: bonusNote || null,
                            });
                            setSaving(false);
                            setDirty(false);
                          }
                        }}
                        className="w-full text-left px-4 py-2 text-sm font-semibold text-k-text-h hover:bg-k-bg-card2 flex items-center gap-2"
                      >
                        <Check className="h-4 w-4" /> Guardar fila
                      </button>
                      <div className="h-px w-full bg-neutral-100 my-1" />
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          setShowConfirmExclude(true);
                        }}
                        className="w-full text-left px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" /> {isExcluded ? "Incluir" : "Excluir"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                {dirty && (
                  <button
                    onClick={async () => {
                      setSaving(true);
                      await onSave(entry.id, {
                        adjustment_amount: parseFloat(adj) || 0,
                        adjustment_note: adjNote || null,
                        bonus_amount: parseFloat(bonus) || 0,
                        bonus_note: bonusNote || null,
                      });
                      setSaving(false);
                      setDirty(false);
                    }}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-k-bg-sidebar px-3 py-1.5 text-[11px] font-bold text-white hover:opacity-90 transition disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Check className="h-3 w-3" />Guardar</>}
                  </button>
                )}
                <button
                  onClick={async () => {
                    await onToggleExclude(entry.empleado_id, !isExcluded);
                  }}
                  className={cx(
                    "ml-2 h-8 px-3 rounded-xl text-[11px] font-bold transition border",
                    isExcluded
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                      : "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100"
                  )}
                  title={isExcluded ? "Incluir en nómina" : "Excluir de nómina"}
                >
                  {isExcluded ? "✓ Incluir" : "✕ Excluir"}
                </button>
              </>
            )}
          </td>
        )}
      </tr>

      {/* Confirm Exclude Modal */}
      {showConfirmExclude && (
        <tr>
          <td colSpan={9} className="px-5 py-4 bg-rose-50 border-t border-rose-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
                <span className="text-sm font-bold text-rose-800">
                  ¿Estás seguro de que deseas {isExcluded ? "incluir" : "excluir"} a {entry.empleado_name} de esta nómina?
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowConfirmExclude(false)} className="px-3 py-1.5 rounded-lg border border-rose-200 text-xs font-bold text-rose-700 hover:bg-rose-100 transition">Cancelar</button>
                <button 
                  onClick={async () => {
                    await onToggleExclude(entry.empleado_id, !isExcluded);
                    setShowConfirmExclude(false);
                  }} 
                  className="px-3 py-1.5 rounded-lg bg-rose-600 text-xs font-bold text-white hover:bg-rose-700 transition"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}

      {/* Fila de motivos expandida */}
      {expanded && !approved && (
        <tr className="bg-amber-50/20">
          <td colSpan={9} className="px-5 pb-4 pt-0">
            <div className="flex items-center gap-4 ml-14 mt-2">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-k-text-b uppercase tracking-widest mb-1.5 block">Motivo del ajuste</label>
                <input
                  type="text"
                  value={adjNote}
                  onChange={(e) => { setAdjNote(e.target.value); setDirty(true); }}
                  placeholder="Ej. Descuento por falta, error en pago anterior..."
                  className="w-full rounded-xl border border-k-border bg-k-bg-card px-3 py-2 text-sm outline-none focus:border-neutral-300 focus:ring-2 focus:ring-obsidian/10"
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-bold text-k-text-b uppercase tracking-widest mb-1.5 block">Motivo del bono</label>
                <input
                  type="text"
                  value={bonusNote}
                  onChange={(e) => { setBonusNote(e.target.value); setDirty(true); }}
                  placeholder="Ej. Bono por puntualidad, incentivo especial..."
                  className="w-full rounded-xl border border-k-border bg-k-bg-card px-3 py-2 text-sm outline-none focus:border-neutral-300 focus:ring-2 focus:ring-obsidian/10"
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

  const [globalPatches, setGlobalPatches] = useState<Record<string, Partial<Entry>>>({});
  const [savingGlobal, setSavingGlobal] = useState(false);

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
    setGlobalPatches({});
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

  async function saveAllChanges() {
    if (!period || Object.keys(globalPatches).length === 0) return;
    setSavingGlobal(true);
    try {
      for (const id of Object.keys(globalPatches)) {
        await api.patch(`/nomina/periodos/${period.id}/entradas/${id}`, globalPatches[id]);
      }
      showToast("ok", "Cambios guardados globalmente");
      setGlobalPatches({});
      await loadPeriod();
    } catch (e: any) {
      showToast("err", e?.response?.data?.message ?? "Error al guardar algunos cambios");
    } finally {
      setSavingGlobal(false);
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

    const excludedIds = period.excluded_employee_ids ?? [];
    const visibleEntries = period.entries.filter(e => !excludedIds.includes(e.empleado_id));

    const rows = visibleEntries.map(e => `
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
        Empleados: ${visibleEntries.length}
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
        <div class="total-box"><div class="label">Empleados</div><div class="val">${visibleEntries.length}</div></div>
      </div>
      <script>window.onload = () => window.print();</script>
      </body></html>`);
    w.document.close();
  }

  function exportCSV() {
    if (!period) return;

    const excludedIds = period.excluded_employee_ids ?? [];
    const visibleEntries = period.entries.filter(e => !excludedIds.includes(e.empleado_id));

    const header = "Empleado,Horas/Días,Tipo,Tarifa,Subtotal,Ajuste,Motivo Ajuste,Bono,Motivo Bono,Total\n";
    const rows = visibleEntries.map(e =>
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
  const excludedIds = period?.excluded_employee_ids ?? [];
  const visibleEntries = (period?.entries ?? []).filter(e => !excludedIds.includes(e.empleado_id));
  const totalEmp  = visibleEntries.length;
  const avgTotal  = totalEmp > 0 ? (period?.total_amount ?? 0) / totalEmp : 0;
  const draftCount = visibleEntries.filter(e => (e.adjustment_amount ?? 0) < 0).length ?? 0;

  // Chart data
  const chartData = Object.entries(
    visibleEntries.reduce((acc, entry) => {
      const role = entry.empleado_role || "Sin rol";
      acc[role] = (acc[role] || 0) + entry.total;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  const colors = ["#000000", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6", "#3b82f6", "#14b8a6"];

  return (
    <div className="space-y-6 pb-24">

      {/* ── Header Hero ─────────────────────────────────────────────────────── */}
      <div className="relative rounded-[40px] bg-k-bg-sidebar overflow-hidden px-8 py-8 text-white">
        {/* Organic blobs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-k-bg-card/[0.03]" />
          <div className="absolute top-8 right-32 h-32 w-32 rounded-full bg-k-bg-card/[0.04]" />
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
            <div className="flex items-center gap-2 bg-k-bg-card/10 rounded-2xl p-1">
              <button
                onClick={prevWeek}
                className="h-9 w-9 rounded-xl bg-k-bg-card/10 hover:bg-k-bg-card/20 flex items-center justify-center transition"
              >
                <ChevronLeft className="h-4 w-4 text-white" />
              </button>
              <span className="px-3 text-sm font-semibold text-white whitespace-nowrap">
                {weekLabel(weekStart, weekEnd)}
              </span>
              <button
                onClick={nextWeek}
                className="h-9 w-9 rounded-xl bg-k-bg-card/10 hover:bg-k-bg-card/20 flex items-center justify-center transition"
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
        <div className="rounded-[40px] border bg-k-bg-card p-20 flex flex-col items-center gap-4 text-k-text-b">
          <div className="h-12 w-12 border-4 border-k-border border-t-obsidian rounded-full animate-spin" />
          <span className="text-xs font-bold uppercase tracking-widest">Cargando nómina...</span>
        </div>
      ) : !period ? (
        /* ── Sin periodo generado ─────────────────────────────────────── */
        <div className="rounded-[40px] border bg-k-bg-card p-16 flex flex-col items-center gap-6 text-center">
          <div className="h-20 w-20 rounded-[28px] bg-k-bg-card2 border border-k-border flex items-center justify-center">
            <DollarSign className="h-10 w-10 text-neutral-200" />
          </div>
          <div>
            <div className="font-black text-2xl text-k-text-h">Sin Nómina Generada</div>
            <div className="text-sm text-k-text-b mt-2 max-w-xs">
              No hay un periodo para la semana <span className="font-bold text-k-text-h">{weekLabel(weekStart, weekEnd)}</span>. Genera uno para empezar.
            </div>
          </div>
          <button
            onClick={generate}
            disabled={generating}
            className="inline-flex items-center gap-2 rounded-2xl bg-k-bg-sidebar px-8 py-3.5 text-sm font-bold text-white hover:opacity-90 transition-all shadow-lg shadow-obsidian/20 disabled:opacity-50"
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
          <div className="rounded-[40px] border border-k-border bg-k-bg-card shadow-k-card overflow-hidden">
            <div className="px-8 py-6 border-b border-k-border flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-k-text-h tracking-tight">Detalle por Empleado</h2>
                <p className="text-[10px] font-bold text-k-text-b uppercase tracking-widest mt-1">
                  Semana {weekLabel(period.week_start, period.week_end)}
                </p>
              </div>
              {!approved && (
                <button
                  onClick={() => {
                    if (Object.keys(globalPatches).length > 0 && !confirm("Hay cambios sin guardar. ¿Recalcular nómina de todos modos y perder los cambios?")) return;
                    generate();
                  }}
                  disabled={generating}
                  title="Vuelve a calcular la nómina tomando la última información de asistencia"
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-k-border bg-k-bg-card px-4 py-2 text-xs font-bold text-k-text-b hover:bg-k-bg-card2 transition"
                >
                  <RefreshCw className={cx("h-3.5 w-3.5", generating && "animate-spin")} />
                  {isEnabled("newManagementAdmin") ? "Recalcular nómina del mes" : "Recalcular"}
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-k-bg-card2/80 border-b border-k-border">
                  <tr>
                    {["Empleado", "Horas/Días", "Tipo", "Tarifa", "Subtotal", "Ajuste", "Bono", "Total"].map((h, i) => (
                      <th key={i} className="text-left px-5 py-4 text-[10px] font-bold text-k-text-b uppercase tracking-[0.1em]">
                        {h}
                      </th>
                    ))}
                    {!approved && <th className="px-5 py-4 text-[10px] font-bold text-k-text-b uppercase tracking-[0.1em]">Guardar</th>}
                    {!approved && <th className="px-5 py-4"></th>}
                  </tr>
                </thead>
                <tbody>
                  {period.entries.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-5 py-16 text-center">
                        <Users className="h-10 w-10 text-neutral-100 mx-auto mb-3" />
                        <p className="text-sm font-bold text-k-text-b uppercase tracking-widest">Sin empleados en este periodo</p>
                      </td>
                    </tr>
                  ) : (
                    visibleEntries.map(entry => (
                      <EntryRow
                        key={entry.id}
                        entry={entry}
                        period={period}
                        approved={approved}
                        onSave={saveEntry}
                        onToggleExclude={toggleExclude}
                        pendingPatch={globalPatches[entry.id]}
                        onPatch={(id, patch) => setGlobalPatches(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }))}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer con total */}
            <div className="px-8 py-5 border-t border-k-border bg-k-bg-card2/50 flex items-center justify-between">
              <span className="text-xs font-bold text-k-text-b uppercase tracking-widest">
                {totalEmp} empleado{totalEmp !== 1 ? "s" : ""} (pagables)
              </span>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-k-text-b uppercase tracking-widest">Total semana</span>
                <span className="text-2xl font-black text-k-text-h">{fmt(period.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* ─ Panel lateral ──────────────────────────────────────── */}
          <div className="space-y-4">

            {/* Resumen de nómina */}
            <div className="rounded-[40px] border border-k-border bg-k-bg-card shadow-k-card overflow-hidden">
              <div className="px-6 py-5 border-b border-k-border">
                <h3 className="text-sm font-black text-k-text-h tracking-tight">Resumen de Nómina</h3>
                <p className="text-[10px] font-bold text-k-text-b uppercase tracking-widest mt-0.5">Totales del periodo</p>
              </div>
              <div className="p-6 space-y-4">
                {/* Total destacado */}
                <div className="rounded-[28px] bg-k-bg-sidebar p-5 text-white">
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
                <div className="rounded-2xl border border-k-border bg-k-bg-card2/50 p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-k-text-b uppercase tracking-wider">Empleados</span>
                    <span className="text-sm font-black text-k-text-h">{totalEmp}</span>
                  </div>
                  <div className="w-full h-px bg-neutral-100" />
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-k-text-b uppercase tracking-wider">Prom. por empleado</span>
                    <span className="text-sm font-black text-k-text-h">{fmt(avgTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="rounded-[40px] border border-k-border bg-k-bg-card shadow-k-card overflow-hidden">
              <div className="px-6 py-5 border-b border-k-border">
                <h3 className="text-sm font-black text-k-text-h tracking-tight">Acciones</h3>
              </div>
              <div className="p-6 space-y-3">
                {!approved && (
                  <button
                    onClick={approve}
                    disabled={approving}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-k-bg-sidebar px-4 py-3.5 text-xs font-bold text-white uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-obsidian/10 disabled:opacity-50"
                  >
                    {approving
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <CheckCircle2 className="h-4 w-4" />}
                    Aprobar Nómina
                  </button>
                )}
                <button
                  onClick={exportPDF}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-k-border bg-k-bg-card hover:bg-k-bg-card2 px-4 py-3 text-xs font-bold text-k-text-h uppercase tracking-widest transition"
                >
                  <Download className="h-4 w-4" />Exportar PDF
                </button>
                <button
                  onClick={exportCSV}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-k-border bg-k-bg-card hover:bg-k-bg-card2 px-4 py-3 text-xs font-bold text-k-text-h uppercase tracking-widest transition"
                >
                  <FileSpreadsheet className="h-4 w-4" />Exportar CSV
                </button>
              </div>
            </div>

            {/* Gráfico de distribución (NUEVO) */}
            {isEnabled("newManagementAdmin") && chartData.length > 0 && (
              <div className="rounded-[40px] border border-k-border bg-k-bg-card shadow-k-card overflow-hidden mb-4">
                <div className="px-6 py-5 border-b border-k-border">
                  <h3 className="text-sm font-black text-k-text-h tracking-tight">Distribución de Costos</h3>
                  <p className="text-[10px] font-bold text-k-text-b uppercase tracking-widest mt-0.5">Por departamento / Rol</p>
                </div>
                <div className="p-6">
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                        <Tooltip
                          cursor={{ fill: '#f5f5f5' }}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          formatter={(value: any) => [fmt(value), "Costo"]}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {chartData.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

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

      {/* Floating Save Bar for Global Save */}
      {isEnabled("newManagementAdmin") && Object.keys(globalPatches).length > 0 && !approved && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10">
          <div className="bg-k-bg-sidebar text-white rounded-full px-6 py-3 shadow-2xl flex items-center gap-6 border border-white/10">
            <div className="text-sm font-bold">
              Hay cambios pendientes de guardar
            </div>
            <button
              onClick={saveAllChanges}
              disabled={savingGlobal}
              className="flex items-center gap-2 bg-k-bg-card text-k-text-h px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest hover:bg-neutral-100 transition disabled:opacity-50"
            >
              {savingGlobal ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar Cambios
            </button>
          </div>
        </div>
      )}
    </div>
  );
}