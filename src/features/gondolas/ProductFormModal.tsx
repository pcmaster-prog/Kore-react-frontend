// src/features/gondolas/ProductFormModal.tsx
import { useState, useRef, useEffect } from "react";
import { X, Camera, Package, Loader2 } from "lucide-react";
import { useCreateProduct, useUpdateProduct } from "./hooks/useGondolaProducts";
import type { Product } from "./types";
import { cx } from "@/lib/utils";

type Props = {
  product?: Product | null;
  onClose: () => void;
  onSaved?: (product: Product) => void;
};

const UNIT_OPTIONS = [
  { value: "pz", label: "Pieza" },
  { value: "kg", label: "Kilogramo" },
  { value: "caja", label: "Caja" },
  { value: "media_caja", label: "Media caja" },
];

export default function ProductFormModal({ product, onClose, onSaved }: Props) {
  const isEdit = !!product;
  const [sku, setSku] = useState(product?.sku ?? "");
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [defaultUnit, setDefaultUnit] = useState(product?.default_unit ?? "pz");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(product?.photo_url ?? null);
  const [err, setErr] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl !== product?.photo_url) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, []);

  const busy = createProduct.isPending || updateProduct.isPending;

  function handleFileChange(file: File) {
    setPhotoFile(file);
    if (previewUrl && previewUrl !== product?.photo_url) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setErr("El nombre del producto es obligatorio");
      return;
    }
    setErr(null);

    try {
      let result: Product;
      const payload = {
        sku: sku.trim() || undefined,
        name: name.trim(),
        description: description.trim() || undefined,
        default_unit: defaultUnit,
        photo: photoFile ?? undefined,
      };

      if (isEdit && product) {
        result = await updateProduct.mutateAsync({
          id: product.id,
          data: payload,
        });
      } else {
        result = await createProduct.mutateAsync(payload);
      }
      onSaved?.(result);
      onClose();
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "Error al guardar el producto");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-obsidian/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-100">
          <div className="text-lg font-black text-obsidian tracking-tight">
            {isEdit ? "Editar producto" : "Nuevo producto maestro"}
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-xl bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4 text-neutral-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {/* Photo upload */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative h-20 w-20 shrink-0 rounded-2xl overflow-hidden border border-neutral-200 hover:opacity-80 transition-opacity bg-neutral-50 flex items-center justify-center group"
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <Package className="h-8 w-8 text-neutral-300" />
              )}
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-5 w-5 text-white" />
              </div>
            </button>
            <div className="flex-1">
              <div className="text-sm font-bold text-obsidian">Foto del producto</div>
              <div className="text-xs text-neutral-400 mt-0.5">
                {previewUrl ? "Toca para cambiar" : "Toca para agregar foto"}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileChange(f);
                e.target.value = "";
              }}
            />
          </div>

          {/* SKU */}
          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">
              SKU / Clave <span className="text-neutral-300">(opcional)</span>
            </label>
            <input
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="Ej. PROD-001"
              className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-medium text-obsidian outline-none focus:border-obsidian focus:ring-2 focus:ring-obsidian/10 transition-all"
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">
              Nombre <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Coca-Cola 600ml"
              className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-medium text-obsidian outline-none focus:border-obsidian focus:ring-2 focus:ring-obsidian/10 transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">
              Descripción <span className="text-neutral-300">(opcional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Descripción breve..."
              className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-medium text-obsidian outline-none focus:border-obsidian focus:ring-2 focus:ring-obsidian/10 transition-all resize-none"
            />
          </div>

          {/* Default unit */}
          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">
              Unidad por defecto
            </label>
            <select
              value={defaultUnit}
              onChange={(e) => setDefaultUnit(e.target.value)}
              className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-medium text-obsidian outline-none focus:border-obsidian focus:ring-2 focus:ring-obsidian/10 transition-all bg-white"
            >
              {UNIT_OPTIONS.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>

          {err && (
            <div className="rounded-2xl bg-rose-50 border border-rose-100 px-4 py-3 text-sm text-rose-700 font-medium">
              {err}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-neutral-100 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-12 rounded-2xl border border-neutral-200 text-sm font-bold text-neutral-500 hover:bg-neutral-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={busy}
            onClick={handleSubmit}
            className={cx(
              "flex-1 h-12 rounded-2xl text-sm font-bold text-white transition-all shadow-sm flex items-center justify-center gap-2",
              busy ? "bg-obsidian/50 cursor-not-allowed" : "bg-obsidian hover:bg-gold",
            )}
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {busy ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear producto"}
          </button>
        </div>
      </div>
    </div>
  );
}
