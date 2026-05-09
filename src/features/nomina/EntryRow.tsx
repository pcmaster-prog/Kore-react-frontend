import { useState, useEffect } from "react";
import { cx, initials, avatarColor } from "@/lib/utils";
import { isEnabled } from "@/lib/featureFlags";
import {
  Check,
  MoreVertical,
  Pencil,
  Trash2,
  AlertTriangle,
  Loader2,
  UtensilsCrossed,
} from "lucide-react";
import type { Entry, Period, MealScheduleItem } from "./nomina.types";
import { fmt, fmtUnits, formatTime12 } from "./nomina.utils";

export type EntryRowProps = {
  entry: Entry;
  period: Period;
  approved: boolean;
  mealSchedule?: MealScheduleItem;
  onSave: (id: string, patch: Partial<Entry>) => Promise<void>;
  onToggleExclude: (empleadoId: string, excluir: boolean) => Promise<void>;
  pendingPatch?: Partial<Entry>;
  onPatch: (id: string, patch: Partial<Entry>) => void;
};

export default function EntryRow({
  entry,
  period,
  approved,
  mealSchedule,
  onSave,
  onToggleExclude,
  pendingPatch,
  onPatch,
}: EntryRowProps) {
  const currentAdj = pendingPatch?.adjustment_amount ?? entry.adjustment_amount ?? 0;
  const currentAdjNote = pendingPatch?.adjustment_note ?? entry.adjustment_note ?? "";

  const [adj, setAdj] = useState(String(currentAdj));
  const [adjNote, setAdjNote] = useState(currentAdjNote);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const [editingAdj, setEditingAdj] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showConfirmExclude, setShowConfirmExclude] = useState(false);

  useEffect(() => {
    if (!dirty) {
      setAdj(String(currentAdj));
      setAdjNote(currentAdjNote);
    }
  }, [currentAdj, currentAdjNote, dirty]);

  function handleChange() {
    setDirty(true);
    const parsedAdj = parseFloat(adj) || 0;
    onPatch(entry.id, {
      adjustment_amount: parsedAdj,
      adjustment_note: adjNote || null,
    });
  }

  useEffect(() => {
    if (dirty) {
      handleChange();
    }
  }, [adj, adjNote]);

  const computedTotal = entry.subtotal + currentAdj;
  const isExcluded = (period?.excluded_employee_ids ?? []).includes(entry.empleado_id);

  return (
    <>
      <tr
        className={cx(
          "border-t border-k-border transition-colors group",
          isExcluded
            ? "opacity-40 bg-k-bg-card2"
            : dirty
              ? "bg-amber-50/30"
              : "hover:bg-k-bg-card2/50"
        )}
      >
        {/* Empleado */}
        <td className="px-5 py-4">
          <div className="flex items-center gap-3">
            <div
              className={cx(
                "h-10 w-10 rounded-2xl flex items-center justify-center text-xs font-bold shrink-0",
                avatarColor(entry.empleado_name)
              )}
            >
              {initials(entry.empleado_name)}
            </div>
            <div>
              <div className="text-sm font-bold text-k-text-h">{entry.empleado_name ?? "Empleado sin nombre"}</div>
              {entry.empleado_role && (
                <div className="text-[10px] text-k-text-b uppercase tracking-wider mt-0.5">
                  {entry.empleado_role}
                </div>
              )}
            </div>
          </div>
        </td>

        {/* Comida */}
        <td className="px-5 py-4">
          {mealSchedule ? (
            <div>
              <div className="inline-flex items-center gap-1 rounded-lg bg-amber-50 border border-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                <UtensilsCrossed className="h-3 w-3" />
                {formatTime12(mealSchedule.meal_start_time)}
              </div>
              <div className="text-[10px] text-k-text-b font-medium mt-1">
                {mealSchedule.duration_minutes} min
              </div>
            </div>
          ) : (
            <span className="text-sm font-semibold text-k-text-b">—</span>
          )}
        </td>

        {/* Horas/días */}
        <td className="px-5 py-4">
          <div className="text-sm font-semibold text-k-text-h">
            {fmtUnits(entry.payment_type, entry.units)}
          </div>
          {entry.rest_days_paid > 0 && (
            <div className="text-[10px] text-emerald-600 font-medium mt-0.5">
              +{entry.rest_days_paid} descanso pagado
            </div>
          )}
          {entry.holidays_paid > 0 && (
            <div className="text-[10px] text-violet-600 font-medium mt-0.5">
              +{entry.holidays_paid} festivo pagado
            </div>
          )}
          {entry.penalty_active && (
            <div className="text-[10px] text-rose-500 font-bold mt-0.5">
              🚨 Sin pago descanso
            </div>
          )}
        </td>

        {/* Tarifa */}
        <td className="px-5 py-4">
          <div className="text-sm font-semibold text-k-text-h">{fmt(entry.rate)}</div>
          <div className="text-[10px] text-k-text-b">
            {entry.payment_type === "hourly" ? "/hora" : "/día"}
          </div>
        </td>

        {/* Subtotal */}
        <td className="px-5 py-4">
          <div className="text-sm font-bold text-k-text-h">{fmt(entry.subtotal)}</div>
        </td>

        {/* Ajuste */}
        <td className="px-5 py-4">
          {approved ? (
            <div
              className={cx(
                "text-sm font-semibold",
                currentAdj < 0 ? "text-rose-500" : "text-k-text-b"
              )}
            >
              {currentAdj !== 0 ? (
                fmt(currentAdj)
              ) : (
                <span className="text-k-text-b">—</span>
              )}
            </div>
          ) : isEnabled("newManagementAdmin") && !editingAdj ? (
            <div
              onClick={() => {
                setEditingAdj(true);
                setExpanded(true);
              }}
              className="cursor-pointer group flex items-center gap-2"
            >
              <span
                className={cx(
                  "text-sm font-semibold transition-colors",
                  currentAdj < 0 ? "text-rose-500" : "text-k-text-b group-hover:text-k-text-h"
                )}
              >
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
                onChange={(e) => {
                  setAdj(e.target.value);
                  setDirty(true);
                }}
                onBlur={() => setEditingAdj(false)}
                autoFocus={editingAdj}
                className={cx(
                  "w-24 rounded-xl border px-2.5 py-1.5 text-sm font-medium outline-none transition",
                  "focus:ring-2 focus:ring-obsidian/10 focus:border-neutral-300",
                  parseFloat(adj) < 0
                    ? "text-rose-600 border-rose-200 bg-rose-50"
                    : "border-k-border bg-k-bg-card text-k-text-h"
                )}
                placeholder="0"
              />
              {!isEnabled("newManagementAdmin") && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className={cx(
                    "h-7 w-7 rounded-lg flex items-center justify-center transition",
                    expanded
                      ? "bg-k-bg-sidebar text-white"
                      : "border border-k-border text-k-text-b hover:bg-k-bg-card2"
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
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowDropdown(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-k-bg-card border border-k-border shadow-xl z-20 overflow-hidden py-2">
                      <button
                        onClick={async () => {
                          setShowDropdown(false);
                          setSaving(true);
                          await onSave(entry.id, {
                            adjustment_amount: parseFloat(adj) || 0,
                            adjustment_note: adjNote || null,
                          });
                          setSaving(false);
                          setDirty(false);
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
                      });
                      setSaving(false);
                      setDirty(false);
                    }}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-k-bg-sidebar px-3 py-1.5 text-[11px] font-bold text-white hover:opacity-90 transition disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <>
                        <Check className="h-3 w-3" />
                        Guardar
                      </>
                    )}
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
          <td colSpan={7} className="px-5 py-4 bg-rose-50 border-t border-rose-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
                <span className="text-sm font-bold text-rose-800">
                  ¿Estás seguro de que deseas {isExcluded ? "incluir" : "excluir"} a{" "}
                  {entry.empleado_name} de esta nómina?
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowConfirmExclude(false)}
                  className="px-3 py-1.5 rounded-lg border border-rose-200 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
                >
                  Cancelar
                </button>
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
          <td colSpan={7} className="px-5 pb-4 pt-0">
            <div className="flex items-center gap-4 ml-14 mt-2">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-k-text-b uppercase tracking-widest mb-1.5 block">
                  Motivo del ajuste
                </label>
                <input
                  type="text"
                  value={adjNote}
                  onChange={(e) => {
                    setAdjNote(e.target.value);
                    setDirty(true);
                  }}
                  placeholder="Ej. Descuento por falta, bono puntualidad, error en pago..."
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
