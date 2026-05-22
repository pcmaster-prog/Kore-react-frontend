// src/features/gondolas/ProductFormModal.tsx
import { useState, useEffect, useRef } from "react";
import { X, Package, Camera, Trash2 } from "lucide-react";
import { useCreateProduct, useUpdateProduct } from "./hooks/useGondolaProducts";
import type { Product } from "./types";
import { UNIDADES } from "./utils";
import { cx } from "@/lib/utils";

interface ProductFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: (product: Product) => void;
  product?: Product | null;
}

export default function ProductFormModal({
  open,
  onClose,
  onSaved,
  product,
}: ProductFormModalProps) {
  const isEdit = Boolean(product);

  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [defaultUnit, setDefaultUnit] = useState<string>("pz");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  useEffect(() => {
    if (open) {
      if (product) {
        setSku(product.sku ?? "");
        setName(product.name ?? "");
        setDescription(product.description ?? "");
        setDefaultUnit(product.default_unit ?? "pz");
        setPreviewUrl(product.photo_url ?? null);
      } else {
        setSku("");
        setName("");
        setDescription("");
        setDefaultUnit("pz");
        setPreviewUrl(null);
      }
      setPhotoFile(null);
      setErr(null);
      setBusy(false);
    }
  }, [open, product]);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const url = URL.createObjectURL(file);
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(url);
    e.target.value = "";
  }

  function handleRemovePhoto() {
    setPhotoFile(null);
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setErr("El nombre es requerido");
      return;
    }
    setBusy(true);
    setErr(null);

    try {
      if (isEdit && product) {
        const payload: Partial<Product> & { photo?: File } = {
          sku: sku.trim() || undefined,
          name: name.trim(),
          description: description.trim() || undefined,
          default_unit: defaultUnit,
        };
        if (photoFile) payload.photo = photoFile;
        // Si se eliminó la foto explícitamente (previewUrl es null y había photo_url),
        // no enviamos photo_url porque la API no lo maneja como eliminación aquí.
        const result = await updateMutation.mutateAsync({
          id: product.id,
          data: payload,
        });
        onSaved(result);
      } else {
        const result = await createMutation.mutateAsync({
          sku: sku.trim() || undefined,
          name: name.trim(),
          description: description.trim() || undefined,
          default_unit: defaultUnit,
          photo: photoFile || undefined,
        });
        onSaved(result);
      }
      onClose();
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "Error al guardar el producto");
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-obsidian/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-[32px] shadow-2xl border border-neutral-100 w-full max-w-md p-8 animate-in-up max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-obsidian tracking-tight">
            {isEdit ? "Editar Producto" : "Nuevo Producto"}
          </h2>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-xl bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4 text-neutral-500" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {/* SKU */}
          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">
              SKU <span className="text-neutral-300">(opcional)</span>
            </label>
            <input
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="Ej. SKU-001"
              className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-medium text-obsidian outline-none focus:border-obsidian focus:ring-2 focus:ring-obsidian/10 transition-all"
            />
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">
              Nombre <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre del producto"
              className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-medium text-obsidian outline-none focus:border-obsidian focus:ring-2 focus:ring-obsidian/10 transition-all"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">
              Descripción <span className="text-neutral-300">(opcional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Descripción breve…"
              className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-medium text-obsidian outline-none focus:border-obsidian focus:ring-2 focus:ring-obsidian/10 transition-all resize-none"
            />
          </div>

          {/* Unidad default */}
          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">
              Unidad default
            </label>
            <select
              value={defaultUnit}
              onChange={(e) => setDefaultUnit(e.target.value)}
              className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-medium text-obsidian outline-none focus:border-obsidian focus:ring-2 focus:ring-obsidian/10 transition-all bg-white"
            >
              {Object.entries(UNIDADES).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Foto */}
          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">
              Foto <span className="text-neutral-300">(opcional)</span>
            </label>
            {previewUrl ? (
              <div className="relative w-full h-40 rounded-2xl overflow-hidden border border-neutral-100">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute top-2 right-2 h-8 w-8 rounded-xl bg-white/90 hover:bg-white shadow-sm flex items-center justify-center transition-colors"
                >
                  <Trash2 className="h-4 w-4 text-rose-500" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 rounded-2xl border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center gap-2 text-neutral-400 hover:border-obsidian hover:text-obsidian transition-colors"
              >
                <Camera className="h-6 w-6" />
                <span className="text-xs font-bold">Haz clic para subir foto</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Error */}
          {err && (
            <div className="rounded-2xl bg-rose-50 border border-rose-100 px-4 py-3 text-sm text-rose-700 font-medium">
              {err}
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-2">
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
              className={cx(
                "flex-1 h-12 rounded-2xl text-sm font-bold text-white transition-all shadow-sm",
                busy
                  ? "bg-obsidian/60 cursor-not-allowed"
                  : "bg-obsidian hover:bg-gold"
              )}
            >
              {busy ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
