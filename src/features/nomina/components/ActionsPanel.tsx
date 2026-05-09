import { CheckCircle2, Download, FileSpreadsheet, Loader2, LockOpen } from "lucide-react";

export type ActionsPanelProps = {
  approved: boolean;
  approving: boolean;
  reopening?: boolean;
  onApprove: () => void;
  onReopen?: () => void;
  onExportPDF: () => void;
  onExportCSV: () => void;
};

export default function ActionsPanel({
  approved,
  approving,
  reopening,
  onApprove,
  onReopen,
  onExportPDF,
  onExportCSV,
}: ActionsPanelProps) {
  return (
    <div className="rounded-[40px] border border-k-border bg-k-bg-card shadow-k-card overflow-hidden">
      <div className="px-6 py-5 border-b border-k-border">
        <h3 className="text-sm font-black text-k-text-h tracking-tight">Acciones</h3>
      </div>
      <div className="p-6 space-y-3">
        {!approved ? (
          <button
            onClick={onApprove}
            disabled={approving}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-k-bg-sidebar px-4 py-3.5 text-xs font-bold text-white uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-obsidian/10 disabled:opacity-50"
          >
            {approving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Aprobar Nómina
          </button>
        ) : (
          <button
            onClick={onReopen}
            disabled={reopening}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-600 px-4 py-3.5 text-xs font-bold text-white uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            {reopening ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LockOpen className="h-4 w-4" />
            )}
            Reabrir Nómina
          </button>
        )}
        <button
          onClick={onExportPDF}
          className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-k-border bg-k-bg-card hover:bg-k-bg-card2 px-4 py-3 text-xs font-bold text-k-text-h uppercase tracking-widest transition"
        >
          <Download className="h-4 w-4" />
          Exportar PDF
        </button>
        <button
          onClick={onExportCSV}
          className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-k-border bg-k-bg-card hover:bg-k-bg-card2 px-4 py-3 text-xs font-bold text-k-text-h uppercase tracking-widest transition"
        >
          <FileSpreadsheet className="h-4 w-4" />
          Exportar CSV
        </button>
      </div>
    </div>
  );
}
