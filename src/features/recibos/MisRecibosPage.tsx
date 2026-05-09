import { useRecibos } from "./useRecibos";
import ReciboNominaView from "./components/ReciboNominaView";
import ReciboGratificacionView from "./components/ReciboGratificacionView";
import SignatureModal from "./components/SignatureModal";
import { cx } from "@/lib/utils";
import {
  FileText, Gift, ArrowLeft, Loader2, AlertTriangle,
  CheckCircle2, Clock, FileCheck, PenLine, Wallet
} from "lucide-react";

function formatPeriod(start: string, end: string) {
  const s = new Date(start + "T12:00:00").toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
  const e = new Date(end + "T12:00:00").toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
  return `${s} – ${e}`;
}

function fmtMXN(n: number) {
  return n.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  });
}

export default function MisRecibosPage() {
  const {
    tab, setTab,
    nominaList, nominaLoading, nominaError, nominaSummary,
    selectedNominaId, selectedNomina, nominaDetailLoading,
    gratList, gratLoading, gratError,
    selectedGratId, selectedGrat, gratDetailLoading,
    openNomina, openGratificacion, backToList,
    signModalOpen, signingType, openSignModal, closeSignModal, handleSign, signSuccess,
  } = useRecibos();

  const isDetail = selectedNominaId !== null || selectedGratId !== null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Toast */}
      {signSuccess && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-3 text-sm font-bold text-emerald-700 flex items-center gap-3 animate-in-fade">
          <CheckCircle2 className="h-4 w-4" />
          {signSuccess}
        </div>
      )}

      {nominaError && !isDetail && (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-5 py-3 text-sm font-bold text-rose-700 flex items-center gap-3">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {nominaError}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-k-text-h tracking-tight">
            {isDetail ? "Detalle del Recibo" : "Mis Recibos"}
          </h1>
          <p className="text-xs font-bold text-k-text-b uppercase tracking-widest mt-1">
            {isDetail
              ? selectedNomina?.folio ?? selectedGrat?.folio ?? ""
              : "Revisa y firma tus recibos de pago"}
          </p>
        </div>
        {isDetail && (
          <button
            onClick={backToList}
            className="inline-flex items-center gap-2 rounded-xl border border-k-border px-4 py-2 text-xs font-bold text-k-text-b hover:bg-k-bg-card2 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver
          </button>
        )}
      </div>

      {/* Tabs */}
      {!isDetail && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab("nomina")}
            className={cx(
              "inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold transition",
              tab === "nomina"
                ? "bg-k-bg-sidebar text-white shadow-lg shadow-obsidian/10"
                : "bg-k-bg-card border border-k-border text-k-text-b hover:bg-k-bg-card2"
            )}
          >
            <FileText className="h-4 w-4" />
            Nómina
            {nominaSummary.pending_count > 0 && (
              <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-black text-white">
                {nominaSummary.pending_count}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab("gratificaciones")}
            className={cx(
              "inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold transition",
              tab === "gratificaciones"
                ? "bg-k-bg-sidebar text-white shadow-lg shadow-obsidian/10"
                : "bg-k-bg-card border border-k-border text-k-text-b hover:bg-k-bg-card2"
            )}
          >
            <Gift className="h-4 w-4" />
            Gratificaciones
            {gratList.filter(g => g.can_sign).length > 0 && (
              <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-black text-white">
                {gratList.filter(g => g.can_sign).length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Content */}
      {isDetail ? (
        /* Detalle de recibo */
        <div className="space-y-4">
          {nominaDetailLoading || gratDetailLoading ? (
            <div className="rounded-[40px] border bg-k-bg-card p-20 flex flex-col items-center gap-4 text-k-text-b">
              <div className="h-10 w-10 border-4 border-k-border border-t-obsidian rounded-full animate-spin" />
              <span className="text-xs font-bold uppercase tracking-widest">Cargando recibo...</span>
            </div>
          ) : selectedNomina ? (
            <ReciboNominaView
              recibo={selectedNomina}
              onSign={
                selectedNomina.can_sign
                  ? () => openSignModal(selectedNomina.id, "nomina")
                  : undefined
              }
            />
          ) : selectedGrat ? (
            <ReciboGratificacionView
              recibo={selectedGrat}
              onSign={
                selectedGrat.can_sign
                  ? () => openSignModal(selectedGrat.id, "gratificacion")
                  : undefined
              }
            />
          ) : null}
        </div>
      ) : tab === "nomina" ? (
        /* Lista de nómina */
        nominaLoading ? (
          <div className="rounded-[40px] border bg-k-bg-card p-20 flex flex-col items-center gap-4 text-k-text-b">
            <div className="h-10 w-10 border-4 border-k-border border-t-obsidian rounded-full animate-spin" />
            <span className="text-xs font-bold uppercase tracking-widest">Cargando recibos...</span>
          </div>
        ) : nominaList.length === 0 ? (
          <div className="rounded-[40px] border bg-k-bg-card p-16 flex flex-col items-center gap-6 text-center">
            <div className="h-20 w-20 rounded-[28px] bg-k-bg-card2 border border-k-border flex items-center justify-center">
              <FileText className="h-10 w-10 text-neutral-200" />
            </div>
            <div>
              <div className="font-black text-2xl text-k-text-h">Sin Recibos</div>
              <div className="text-sm text-k-text-b mt-2 max-w-xs">
                Aún no tienes recibos de nómina generados. Aparecerán aquí cuando el administrador apruebe un periodo.
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nominaList.map((item) => {
              const isSigned = item.status === "signed";
              return (
                <button
                  key={item.id}
                  onClick={() => openNomina(item.id)}
                  className={cx(
                    "text-left rounded-[28px] border bg-k-bg-card p-5 transition-all hover:shadow-lg hover:shadow-obsidian/5 hover:-translate-y-0.5",
                    isSigned ? "border-emerald-100" : "border-k-border"
                  )}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <div className={cx(
                        "h-9 w-9 rounded-xl flex items-center justify-center",
                        isSigned ? "bg-emerald-50" : "bg-amber-50"
                      )}>
                        {isSigned ? (
                          <FileCheck className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-amber-600" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-k-text-h">{item.folio}</div>
                        <div className="text-[10px] font-bold text-k-text-b">
                          {formatPeriod(item.period_start, item.period_end)}
                        </div>
                      </div>
                    </div>
                    <span className={cx(
                      "text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg",
                      isSigned
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        : "bg-amber-50 text-amber-700 border border-amber-100"
                    )}>
                      {isSigned ? "Firmado" : "Pendiente"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-k-text-h">
                      <Wallet className="h-3.5 w-3.5 text-k-text-b" />
                      {fmtMXN(item.net_pay)}
                    </div>
                    {!isSigned && item.can_sign && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600">
                        <PenLine className="h-3 w-3" />
                        Requiere firma
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )
      ) : (
        /* Lista de gratificaciones */
        gratLoading ? (
          <div className="rounded-[40px] border bg-k-bg-card p-20 flex flex-col items-center gap-4 text-k-text-b">
            <div className="h-10 w-10 border-4 border-k-border border-t-obsidian rounded-full animate-spin" />
            <span className="text-xs font-bold uppercase tracking-widest">Cargando recibos...</span>
          </div>
        ) : gratList.length === 0 ? (
          <div className="rounded-[40px] border bg-k-bg-card p-16 flex flex-col items-center gap-6 text-center">
            <div className="h-20 w-20 rounded-[28px] bg-k-bg-card2 border border-k-border flex items-center justify-center">
              <Gift className="h-10 w-10 text-neutral-200" />
            </div>
            <div>
              <div className="font-black text-2xl text-k-text-h">Sin Gratificaciones</div>
              <div className="text-sm text-k-text-b mt-2 max-w-xs">
                Aún no tienes recibos de gratificación. Aparecerán aquí cuando el administrador los genere.
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gratList.map((item) => {
              const isSigned = item.status === "signed";
              return (
                <button
                  key={item.id}
                  onClick={() => openGratificacion(item.id)}
                  className={cx(
                    "text-left rounded-[28px] border bg-k-bg-card p-5 transition-all hover:shadow-lg hover:shadow-obsidian/5 hover:-translate-y-0.5",
                    isSigned ? "border-emerald-100" : "border-k-border"
                  )}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <div className={cx(
                        "h-9 w-9 rounded-xl flex items-center justify-center",
                        isSigned ? "bg-emerald-50" : "bg-amber-50"
                      )}>
                        {isSigned ? (
                          <FileCheck className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-amber-600" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-k-text-h">{item.folio}</div>
                        <div className="text-[10px] font-bold text-k-text-b">
                          {item.gratification_type.name}
                        </div>
                      </div>
                    </div>
                    <span className={cx(
                      "text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg",
                      isSigned
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        : "bg-amber-50 text-amber-700 border border-amber-100"
                    )}>
                      {isSigned ? "Firmado" : "Pendiente"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-k-text-h">
                      <Wallet className="h-3.5 w-3.5 text-k-text-b" />
                      {fmtMXN(item.net_amount)}
                    </div>
                    <div className="text-[10px] font-bold text-k-text-b">
                      Ejercicio {item.fiscal_year}
                    </div>
                  </div>
                  {!isSigned && item.can_sign && (
                    <div className="mt-2 pt-2 border-t border-k-border/50 flex items-center gap-1 text-[10px] font-bold text-amber-600">
                      <PenLine className="h-3 w-3" />
                      Requiere firma
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )
      )}

      {/* Signature Modal */}
      <SignatureModal
        open={signModalOpen}
        title={`Firmar recibo de ${signingType === "nomina" ? "nómina" : "gratificación"}`}
        subtitle="Firma digital con confirmación de identidad"
        onClose={closeSignModal}
        onConfirm={handleSign}
      />
    </div>
  );
}
