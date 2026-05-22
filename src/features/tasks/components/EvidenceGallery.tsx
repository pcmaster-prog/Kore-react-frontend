// src/features/tasks/components/EvidenceGallery.tsx
import { cx } from "@/lib/utils";
import type { Evidence, EvidenceType } from "@/features/tasks/types";
import { Image, Mic, FileText, File, Download } from "lucide-react";

interface EvidenceGalleryProps {
  evidences: Evidence[];
  onAdd?: () => void;
  className?: string;
}

const typeConfig: Record<EvidenceType, { icon: React.ReactNode; label: string; bg: string }> = {
  photo: {
    icon: <Image className="h-4 w-4" />,
    label: "Foto",
    bg: "bg-indigo-50 text-indigo-600",
  },
  voice_note: {
    icon: <Mic className="h-4 w-4" />,
    label: "Audio",
    bg: "bg-amber-50 text-amber-600",
  },
  text_note: {
    icon: <FileText className="h-4 w-4" />,
    label: "Nota",
    bg: "bg-emerald-50 text-emerald-600",
  },
  file: {
    icon: <File className="h-4 w-4" />,
    label: "Archivo",
    bg: "bg-gray-50 text-gray-600",
  },
};

export default function EvidenceGallery({ evidences, onAdd, className }: EvidenceGalleryProps) {
  if (evidences.length === 0 && !onAdd) {
    return (
      <div className="text-center py-6 text-k-text-b text-sm">
        Sin evidencias registradas
      </div>
    );
  }

  return (
    <div className={cx("space-y-3", className)}>
      {evidences.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {evidences.map((ev) => {
            const cfg = typeConfig[ev.evidenceType] ?? typeConfig.file;
            const isPhoto = ev.evidenceType === "photo";
            return (
              <div
                key={ev.id}
                className="group relative rounded-2xl border border-k-border bg-k-bg-card p-3 shadow-k-card hover:shadow-md transition-all"
              >
                {isPhoto ? (
                  <div className="aspect-square rounded-xl bg-neutral-100 flex items-center justify-center mb-2 overflow-hidden">
                    <Image className="h-8 w-8 text-neutral-300" />
                  </div>
                ) : (
                  <div className={cx("h-10 w-10 rounded-xl flex items-center justify-center mb-2", cfg.bg)}>
                    {cfg.icon}
                  </div>
                )}
                <div className="text-[10px] font-bold uppercase tracking-wider text-k-text-b mb-0.5">
                  {cfg.label}
                </div>
                <div className="text-xs font-medium text-k-text-h truncate" title={ev.originalName}>
                  {ev.originalName}
                </div>
                <div className="text-[10px] text-k-text-b mt-1">
                  {(ev.size / 1024).toFixed(0)} KB
                </div>
                <a
                  href={`#${ev.path}`}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 rounded-lg bg-white border border-k-border flex items-center justify-center shadow-sm"
                  title="Descargar"
                >
                  <Download className="h-3.5 w-3.5 text-k-text-h" />
                </a>
              </div>
            );
          })}
        </div>
      )}

      {onAdd && (
        <button
          type="button"
          onClick={onAdd}
          className="w-full h-12 rounded-2xl border-2 border-dashed border-k-border text-k-text-b text-sm font-bold hover:border-k-bg-sidebar hover:text-k-text-h transition-all flex items-center justify-center gap-2"
        >
          + Agregar evidencia
        </button>
      )}
    </div>
  );
}
