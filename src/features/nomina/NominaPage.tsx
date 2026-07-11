import { CheckCircle2, AlertTriangle, Loader2, DollarSign, RefreshCw } from "lucide-react";
import { cx } from "@/lib/utils";
import { isEnabled } from "@/lib/featureFlags";
import { useNomina } from "./useNomina";
import { weekLabel } from "./nomina.utils";
import NominaHeader from "./components/NominaHeader";
import NominaTable from "./components/NominaTable";
import PayrollSummaryCard from "./components/PayrollSummaryCard";
import ActionsPanel from "./components/ActionsPanel";
import NotesPanel from "./components/NotesPanel";
import CostDistributionChart from "./components/CostDistributionChart";
import StatusBanner from "./components/StatusBanner";
import FloatingSaveBar from "./components/FloatingSaveBar";

export default function NominaPage() {
  const {
    period,
    loading,
    generating,
    approving,
    reopening,
    err,
    toast,
    globalPatches,
    savingGlobal,
    notes,
    savingNotes,
    mealSchedules,
    weekStart,
    weekEnd,
    approved,
    totalEmp,
    avgTotal,
    draftCount,
    chartData,
    prevWeek,
    nextWeek,
    generate,
    approve,
    reopen,
    saveEntry,
    saveAllChanges,
    toggleExclude,
    exportPDF,
    exportCSV,
    setNotes,
    saveNotes,
    patchEntry,
    lockEntry,
    unlockEntry,
  } = useNomina();

  return (
    <div className="space-y-6 pb-24">
      <NominaHeader
        period={period}
        approved={approved}
        weekStart={weekStart}
        weekEnd={weekEnd}
        onPrevWeek={prevWeek}
        onNextWeek={nextWeek}
      />

      {/* Toast */}
      {toast && (
        <div
          className={cx(
            "rounded-2xl border px-5 py-3 text-sm font-bold flex items-center gap-3",
            toast.type === "ok"
              ? "bg-emerald-50 border-emerald-100 text-emerald-700"
              : "bg-rose-50 border-rose-100 text-rose-700"
          )}
        >
          {toast.type === "ok" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          {toast.msg}
        </div>
      )}

      {/* Error */}
      {err && (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-5 py-3 text-sm font-medium text-rose-700 flex items-center gap-3">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {err}
        </div>
      )}

      {/* Loading */}
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
              No hay un periodo para la semana{" "}
              <span className="font-bold text-k-text-h">{weekLabel(weekStart, weekEnd)}</span>. Genera uno
              para empezar.
            </div>
          </div>
          <button
            onClick={generate}
            disabled={generating}
            className="inline-flex items-center gap-2 rounded-2xl bg-k-bg-sidebar px-8 py-3.5 text-sm font-bold text-white hover:opacity-90 transition-all shadow-lg shadow-obsidian/20 disabled:opacity-50"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Generar Nómina
              </>
            )}
          </button>
        </div>
      ) : (
        /* ── Periodo cargado ──────────────────────────────────────────── */
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 items-start">
          <NominaTable
            period={period}
            approved={approved}
            mealSchedules={mealSchedules}
            globalPatches={globalPatches}
            generating={generating}
            totalEmp={totalEmp}
            onSave={saveEntry}
            onToggleExclude={toggleExclude}
            onLock={lockEntry}
            onUnlock={unlockEntry}
            onPatch={patchEntry}
            onRecalculate={generate}
          />

          {/* ─ Panel lateral ──────────────────────────────────────────── */}
          <div className="space-y-4">
            <PayrollSummaryCard
              totalAmount={period.total_amount}
              totalAdjustments={period.total_adjustments}
              totalEmp={totalEmp}
              avgTotal={avgTotal}
            />
            <ActionsPanel
              approved={approved}
              approving={approving}
              reopening={reopening}
              onApprove={approve}
              onReopen={reopen}
              onExportPDF={exportPDF}
              onExportCSV={exportCSV}
            />
            <NotesPanel
              notes={notes}
              approved={approved}
              savingNotes={savingNotes}
              periodNotes={period.notes}
              onChange={setNotes}
              onSave={saveNotes}
            />
            {isEnabled("newManagementAdmin") && chartData.length > 0 && (
              <CostDistributionChart data={chartData} />
            )}
            <StatusBanner
              approved={approved}
              approvedAt={period.approved_at}
              draftCount={draftCount}
            />
          </div>
        </div>
      )}

      {/* Floating Save Bar for Global Save */}
      {isEnabled("newManagementAdmin") && Object.keys(globalPatches).length > 0 && !approved && (
        <FloatingSaveBar savingGlobal={savingGlobal} onSaveAll={saveAllChanges} />
      )}
    </div>
  );
}
