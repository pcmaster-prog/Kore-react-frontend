// src/features/gondolas/EvidenciaUploader.tsx
import { useRef, useState } from "react";
import { Camera, X } from "lucide-react";

import { cx } from "@/lib/utils";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
  "application/pdf",
];
const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

type Props = {
  onChange: (file: File | null) => void;
  disabled?: boolean;
};

export default function EvidenciaUploader({ onChange, disabled }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  function handleFile(file: File | null) {
    setError(null);
    if (!file) {
      setPreview(null);
      onChange(null);
      return;
    }

    // Validación de tipo MIME real (no solo la extensión)
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(`Tipo de archivo no permitido: ${file.type || "desconocido"}`);
      onChange(null);
      return;
    }

    // Validación de tamaño
    if (file.size > MAX_SIZE_BYTES) {
      setError(`El archivo excede el límite de ${MAX_SIZE_MB}MB`);
      onChange(null);
      return;
    }

    setPreview(URL.createObjectURL(file));
    onChange(file);
  }

  function handleClear() {
    setPreview(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        disabled={disabled}
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />

      {error && (
        <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-600">
          {error}
        </div>
      )}

      {preview ? (
        <div className="relative rounded-2xl overflow-hidden border border-neutral-200 shadow-sm">
          <img
            src={preview}
            alt="Evidencia"
            className="w-full max-h-48 object-cover"
          />
          {!disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          )}
          <div className="px-4 py-2 bg-emerald-50 border-t border-emerald-100 text-xs font-bold text-emerald-700 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            Evidencia lista
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className={cx(
            "w-full rounded-2xl border-2 border-dashed py-6 flex flex-col items-center gap-3 transition-all",
            disabled
              ? "border-neutral-100 text-neutral-300 cursor-not-allowed"
              : "border-neutral-200 text-neutral-500 hover:border-obsidian hover:text-obsidian active:scale-98",
          )}
        >
          <div
            className={cx(
              "h-12 w-12 rounded-2xl flex items-center justify-center",
              disabled ? "bg-neutral-50" : "bg-neutral-100",
            )}
          >
            <Camera className="h-6 w-6" />
          </div>
          <span className="text-sm font-bold">Toca para agregar foto</span>
          <span className="text-xs text-neutral-400 font-medium">
            Evidencia del relleno completado
          </span>
        </button>
      )}
    </div>
  );
}
