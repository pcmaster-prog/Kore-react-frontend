import { TrendingDown } from "lucide-react";
import { fmt } from "../nomina.utils";

export type PayrollSummaryCardProps = {
  totalAmount: number;
  totalAdjustments: number;
  totalEmp: number;
  avgTotal: number;
};

export default function PayrollSummaryCard({
  totalAmount,
  totalAdjustments,
  totalEmp,
  avgTotal,
}: PayrollSummaryCardProps) {
  return (
    <div className="rounded-[40px] border border-k-border bg-k-bg-card shadow-k-card overflow-hidden">
      <div className="px-6 py-5 border-b border-k-border">
        <h3 className="text-sm font-black text-k-text-h tracking-tight">Resumen de Nómina</h3>
        <p className="text-[10px] font-bold text-k-text-b uppercase tracking-widest mt-0.5">
          Totales del periodo
        </p>
      </div>
      <div className="p-6 space-y-4">
        <div className="rounded-[28px] bg-k-bg-sidebar p-5 text-white">
          <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/50 mb-2">
            Total a Pagar
          </div>
          <div className="text-3xl font-black tracking-tight">{fmt(totalAmount)}</div>
        </div>

        <div className="rounded-2xl bg-rose-50 border border-rose-100 p-4">
          <div className="flex items-center gap-1.5 text-rose-500 mb-2">
            <TrendingDown className="h-3.5 w-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Ajustes</span>
          </div>
          <div className="text-xl font-black text-rose-600">{fmt(totalAdjustments)}</div>
        </div>

        <div className="rounded-2xl border border-k-border bg-k-bg-card2/50 p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-k-text-b uppercase tracking-wider">Empleados</span>
            <span className="text-sm font-black text-k-text-h">{totalEmp}</span>
          </div>
          <div className="w-full h-px bg-neutral-100" />
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-k-text-b uppercase tracking-wider">
              Prom. por empleado
            </span>
            <span className="text-sm font-black text-k-text-h">{fmt(avgTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
