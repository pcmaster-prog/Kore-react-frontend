import { Save, Loader2 } from "lucide-react";

export type FloatingSaveBarProps = {
  savingGlobal: boolean;
  onSaveAll: () => void;
};

export default function FloatingSaveBar({ savingGlobal, onSaveAll }: FloatingSaveBarProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10">
      <div className="bg-k-bg-sidebar text-white rounded-full px-6 py-3 shadow-2xl flex items-center gap-6 border border-white/10">
        <div className="text-sm font-bold">Hay cambios pendientes de guardar</div>
        <button
          onClick={onSaveAll}
          disabled={savingGlobal}
          className="flex items-center gap-2 bg-k-bg-card text-k-text-h px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest hover:bg-neutral-100 transition disabled:opacity-50"
        >
          {savingGlobal ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Guardar Cambios
        </button>
      </div>
    </div>
  );
}
