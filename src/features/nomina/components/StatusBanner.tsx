import { CheckCircle2, AlertTriangle } from "lucide-react";

export type StatusBannerProps = {
  approved: boolean;
  approvedAt?: string | null;
  draftCount: number;
};

export default function StatusBanner({ approved, approvedAt, draftCount }: StatusBannerProps) {
  if (approved) {
    return (
      <div className="rounded-[28px] border border-emerald-100 bg-emerald-50 p-5 text-xs text-emerald-700 flex items-start gap-3">
        <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
        <div>
          <div className="font-bold mb-1">Nómina Cerrada</div>
          No puede modificarse.
          <br />
          Aprobada el{" "}
          {approvedAt
            ? new Date(approvedAt).toLocaleDateString("es-MX", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })
            : "—"}
          .
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[28px] border border-amber-100 bg-amber-50 p-5 text-xs text-amber-700 flex items-start gap-3">
      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
      <div>
        <div className="font-bold mb-1">En Borrador</div>
        {draftCount > 0 && (
          <div className="mb-1">
            Hay <strong>{draftCount}</strong> registros con ajustes negativos.
          </div>
        )}
        Puedes editar ajustes. Una vez aprobada, no podrá modificarse.
      </div>
    </div>
  );
}
