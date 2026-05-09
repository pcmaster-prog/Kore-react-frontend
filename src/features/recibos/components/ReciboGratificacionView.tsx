import { cx } from "@/lib/utils";
import type { ReciboGratificacion } from "../recibos.types";
import {
  Building2, CalendarDays, Hash, Wallet, Gift, CreditCard,
  CheckCircle2, AlertCircle, PenLine, BadgeCheck, Landmark
} from "lucide-react";

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso + "T12:00:00").toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function fmtMXN(n: number) {
  return n.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  });
}

interface ReciboGratificacionViewProps {
  recibo: ReciboGratificacion;
  onSign?: () => void;
  compact?: boolean;
}

export default function ReciboGratificacionView({ recibo, onSign, compact = false }: ReciboGratificacionViewProps) {
  const isSigned = recibo.status === "signed";

  return (
    <div className={cx("bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden", compact ? "" : "max-w-3xl mx-auto")}>
      {/* Header */}
      <div className="p-6 border-b border-neutral-100">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-k-bg-sidebar flex items-center justify-center">
              <Building2 className="h-6 w-6 text-k-sb-active" />
            </div>
            <div>
              <div className="text-xs font-black text-k-text-h uppercase tracking-wide">Empresa Modelo</div>
              <div className="text-[10px] font-bold text-k-text-b uppercase tracking-widest">SA de CV</div>
            </div>
          </div>
          <div className="text-right space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-50 border border-neutral-100 px-3 py-1">
              <Hash className="h-3 w-3 text-neutral-400" />
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Folio:</span>
              <span className="text-xs font-black text-k-text-h">{recibo.folio}</span>
            </div>
            <div className="flex items-center justify-end gap-1.5 text-[10px] font-bold text-k-text-b">
              <CalendarDays className="h-3 w-3" />
              Emisión: {formatDate(recibo.issue_date)}
            </div>
          </div>
        </div>

        {/* Título */}
        <div className="mt-5 flex items-center justify-between">
          <h2 className="text-sm font-black text-k-text-h uppercase tracking-wide">
            Recibo de Gratificación Extraordinaria
          </h2>
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-100 px-3 py-1">
            <Gift className="h-3 w-3 text-amber-600" />
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
              {recibo.gratification_type.name}
            </span>
          </div>
        </div>
      </div>

      {/* Datos del empleado */}
      <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50/50">
        <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-3">
          Datos del Empleado
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl border border-neutral-100 bg-white px-3 py-2">
            <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Nombre</div>
            <div className="text-xs font-bold text-k-text-h truncate">{recibo.employee_name}</div>
          </div>
          <div className="rounded-xl border border-neutral-100 bg-white px-3 py-2">
            <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Puesto</div>
            <div className="text-xs font-bold text-k-text-h">{recibo.position_title ?? "—"}</div>
          </div>
          <div className="rounded-xl border border-neutral-100 bg-white px-3 py-2">
            <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">NSS</div>
            <div className="text-xs font-bold text-k-text-h font-mono">{recibo.nss ?? "—"}</div>
          </div>
          <div className="rounded-xl border border-neutral-100 bg-white px-3 py-2">
            <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">RFC</div>
            <div className="text-xs font-bold text-k-text-h font-mono">{recibo.rfc ?? "—"}</div>
          </div>
          <div className="rounded-xl border border-neutral-100 bg-white px-3 py-2 col-span-2">
            <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">CURP</div>
            <div className="text-xs font-bold text-k-text-h font-mono">{recibo.curp ?? "—"}</div>
          </div>
          <div className="rounded-xl border border-neutral-100 bg-white px-3 py-2">
            <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Ejercicio Fiscal</div>
            <div className="text-xs font-bold text-k-text-h flex items-center gap-1">
              <Landmark className="h-3 w-3 text-neutral-400" />
              {recibo.fiscal_year}
            </div>
          </div>
          <div className="rounded-xl border border-neutral-100 bg-white px-3 py-2">
            <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Pago</div>
            <div className="text-xs font-bold text-k-text-h">{formatDate(recibo.payment_date)}</div>
          </div>
        </div>
      </div>

      {/* Concepto */}
      {recibo.concept_description && (
        <div className="px-6 py-3 border-b border-neutral-100">
          <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Concepto</div>
          <div className="text-xs font-medium text-k-text-h">{recibo.concept_description}</div>
        </div>
      )}

      {/* Desglose y Retenciones */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Desglose del pago */}
        <div>
          <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2 flex items-center gap-2">
            <Wallet className="h-3.5 w-3.5" />
            Desglose del Pago
          </div>
          <div className="rounded-xl border border-neutral-100 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-neutral-50">
                  <th className="text-left px-3 py-2 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Concepto</th>
                  <th className="text-right px-3 py-2 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Importe</th>
                </tr>
              </thead>
              <tbody>
                {recibo.payment_breakdown?.map((p, i) => (
                  <tr key={i} className="border-t border-neutral-50">
                    <td className="px-3 py-2 text-k-text-h">{p.concept}</td>
                    <td className="px-3 py-2 text-right font-bold text-k-text-h">{fmtMXN(p.amount)}</td>
                  </tr>
                ))}
                {(!recibo.payment_breakdown || recibo.payment_breakdown.length === 0) && (
                  <tr>
                    <td colSpan={2} className="px-3 py-4 text-center text-neutral-300 text-[11px]">Sin desglose registrado</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-neutral-50 border-t border-neutral-100">
                  <td className="px-3 py-2 font-black text-k-text-h text-[10px] uppercase tracking-wider">Total Gratificación</td>
                  <td className="px-3 py-2 text-right font-black text-k-text-h">{fmtMXN(recibo.total_gratification)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Retenciones */}
        <div>
          <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2 flex items-center gap-2">
            <CreditCard className="h-3.5 w-3.5" />
            Desglose Retenciones
          </div>
          <div className="rounded-xl border border-neutral-100 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-neutral-50">
                  <th className="text-left px-3 py-2 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Concepto</th>
                  <th className="text-right px-3 py-2 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Importe</th>
                </tr>
              </thead>
              <tbody>
                {recibo.retentions?.map((r, i) => (
                  <tr key={i} className="border-t border-neutral-50">
                    <td className="px-3 py-2 text-k-text-h">{r.concept}</td>
                    <td className="px-3 py-2 text-right font-bold text-rose-600">{fmtMXN(r.amount)}</td>
                  </tr>
                ))}
                {(!recibo.retentions || recibo.retentions.length === 0) && (
                  <tr>
                    <td colSpan={2} className="px-3 py-4 text-center text-neutral-300 text-[11px]">Sin retenciones registradas</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-neutral-50 border-t border-neutral-100">
                  <td className="px-3 py-2 font-black text-k-text-h text-[10px] uppercase tracking-wider">Total Retenciones</td>
                  <td className="px-3 py-2 text-right font-black text-rose-600">{fmtMXN(recibo.total_retentions)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Neto a recibir */}
      <div className="px-6 pb-4">
        <div className="rounded-2xl bg-k-bg-sidebar border border-k-border p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-k-sb-text uppercase tracking-widest">Neto a Recibir</span>
            <span className="text-2xl font-black text-k-sb-active">{fmtMXN(recibo.net_amount)}</span>
          </div>
          <div className="text-[11px] font-medium text-k-sb-text italic">
            {recibo.net_amount_words ?? "—"}
          </div>
        </div>
      </div>

      {/* Firma y disclaimers */}
      <div className="px-6 pb-6">
        <div className="rounded-xl border border-neutral-100 bg-neutral-50/50 p-4">
          <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2 flex items-center gap-2">
            <PenLine className="h-3.5 w-3.5" />
            Firma del Trabajador
          </div>

          {isSigned ? (
            <div className="flex items-center gap-2 text-emerald-600">
              <BadgeCheck className="h-5 w-5" />
              <div>
                <div className="text-xs font-bold">Recibo firmado digitalmente</div>
                <div className="text-[10px] text-emerald-500">
                  {recibo.signature?.signed_at
                    ? new Date(recibo.signature.signed_at).toLocaleString("es-MX")
                    : ""}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-amber-600 mb-1">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-[11px] font-bold">Pendiente de firma</span>
                </div>
                <p className="text-[10px] text-neutral-400 leading-relaxed">
                  Recibí de la empresa, en carácter de aueeso presente para que dar no coroces del directo
                  convenian al dentsituamiento, de Trabajador, firma el amaoton de puecia empresa.
                </p>
              </div>
              {recibo.can_sign && onSign && (
                <button
                  onClick={onSign}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-k-bg-sidebar px-4 py-2 text-[11px] font-bold text-white hover:opacity-90 transition shadow-sm shrink-0 ml-4"
                >
                  <PenLine className="h-3.5 w-3.5" />
                  Firmar
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Status badge */}
      {isSigned && (
        <div className="px-6 pb-6">
          <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-700">
              Este recibo ha sido firmado digitalmente y es válido como comprobante de pago.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}


