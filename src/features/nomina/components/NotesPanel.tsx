import { Save, StickyNote, Loader2 } from "lucide-react";
import { cx } from "@/lib/utils";

export type NotesPanelProps = {
  notes: string;
  approved: boolean;
  savingNotes: boolean;
  periodNotes?: string | null;
  onChange: (value: string) => void;
  onSave: () => void;
};

export default function NotesPanel({
  notes,
  approved,
  savingNotes,
  periodNotes,
  onChange,
  onSave,
}: NotesPanelProps) {
  return (
    <div className="rounded-[40px] border border-k-border bg-k-bg-card shadow-k-card overflow-hidden">
      <div className="px-6 py-5 border-b border-k-border flex items-center gap-2">
        <StickyNote className="h-4 w-4 text-amber-500" />
        <h3 className="text-sm font-black text-k-text-h tracking-tight">Notas</h3>
      </div>
      <div className="p-6">
        <textarea
          value={notes}
          onChange={(e) => onChange(e.target.value)}
          disabled={approved}
          rows={4}
          placeholder="Escribe notas adicionales para esta nómina..."
          className={cx(
            "w-full rounded-2xl border border-k-border px-4 py-3 text-sm outline-none resize-none transition",
            "focus:ring-2 focus:ring-obsidian/10 focus:border-neutral-300",
            approved ? "bg-k-bg-card2 text-k-text-b cursor-not-allowed" : "bg-k-bg-card text-k-text-h"
          )}
        />
        {!approved && (
          <button
            onClick={onSave}
            disabled={savingNotes || notes === (periodNotes ?? "")}
            className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-k-border bg-k-bg-card hover:bg-k-bg-card2 px-4 py-2.5 text-xs font-bold text-k-text-h uppercase tracking-widest transition disabled:opacity-40"
          >
            {savingNotes ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Guardar Notas
          </button>
        )}
      </div>
    </div>
  );
}
