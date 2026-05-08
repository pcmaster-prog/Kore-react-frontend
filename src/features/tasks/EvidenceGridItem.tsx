import { Download, FileText } from "lucide-react";
import { isImage } from "./tasks.utils";
import type { EvidenceItem } from "./tasks.types";

interface EvidenceGridItemProps {
  item: EvidenceItem;
}

export default function EvidenceGridItem({ item }: EvidenceGridItemProps) {
  return (
    <div className="group relative border border-neutral-100 rounded-[28px] overflow-hidden bg-neutral-50 transition-all hover:bg-white hover:shadow-lg hover:shadow-obsidian/5">
      {isImage(item.mime) ? (
        <div className="aspect-square w-full overflow-hidden bg-neutral-200">
          <img
            src={item.url ?? ""}
            className="w-full h-full object-cover transition-transform group-hover:scale-110"
            alt="Evidencia"
            onError={(ev) => {
              (ev.target as HTMLImageElement).src =
                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56'%3E%3Crect width='56' height='56' fill='%23f5f5f5'/%3E%3Ctext x='50%25' y='55%25' text-anchor='middle' fill='%23999' font-size='12'%3E📷%3C/text%3E%3C/svg%3E";
            }}
          />
        </div>
      ) : (
        <div className="aspect-square w-full flex flex-col items-center justify-center gap-2 bg-neutral-100 text-neutral-400">
          <FileText className="h-8 w-8" />
          <span className="text-[10px] font-bold uppercase tracking-widest">
            Documento
          </span>
        </div>
      )}
      <div className="absolute inset-0 bg-obsidian/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
        <a
          href={item.url ?? "#"}
          target="_blank"
          rel="noreferrer"
          className="h-10 w-10 rounded-xl bg-white text-obsidian flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
        >
          <Download className="h-5 w-5" />
        </a>
      </div>
    </div>
  );
}
