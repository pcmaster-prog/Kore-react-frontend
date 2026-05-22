// src/features/gondolas/ProductPickerModal.tsx
import { useState } from "react";
import { X, Search, Plus, Package, Loader2 } from "lucide-react";
import { useProducts } from "./hooks/useGondolaProducts";
import type { Product } from "./types";
import ProductFormModal from "./ProductFormModal";
import { cx } from "@/lib/utils";

type Props = {
  onClose: () => void;
  onSelect: (product: Product) => void;
  excludeIds?: string[];
};

export default function ProductPickerModal({ onClose, onSelect, excludeIds = [] }: Props) {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const { data: products, isLoading } = useProducts({
    search: search.trim() || undefined,
  });

  const filtered = (products || []).filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      (p.sku ?? "").toLowerCase().includes(q)
    );
  });

  const excludeSet = new Set(excludeIds);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-obsidian/40 backdrop-blur-sm"
          onClick={onClose}
        />
        <div className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in-up">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-100">
            <div className="text-lg font-black text-obsidian tracking-tight">
              Vincular producto del catálogo
            </div>
            <button
              onClick={onClose}
              className="h-9 w-9 rounded-xl bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors"
            >
              <X className="h-4 w-4 text-neutral-500" />
            </button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-neutral-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre o SKU..."
                autoFocus
                className="w-full h-11 pl-10 pr-4 rounded-2xl border border-neutral-200 text-sm font-medium text-obsidian outline-none focus:border-obsidian focus:ring-2 focus:ring-obsidian/10 transition-all"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 text-neutral-400 animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Package className="h-10 w-10 text-neutral-300 mb-3" />
                <div className="text-sm font-bold text-neutral-400">
                  {search.trim()
                    ? "No se encontraron productos"
                    : "El catálogo está vacío"}
                </div>
                <p className="text-xs text-neutral-400 mt-1">
                  {search.trim()
                    ? "Intenta con otro término de búsqueda"
                    : "Crea el primer producto para empezar"}
                </p>
              </div>
            ) : (
              filtered.map((product) => {
                const excluded = excludeSet.has(product.id);
                return (
                  <button
                    key={product.id}
                    type="button"
                    disabled={excluded}
                    onClick={() => onSelect(product)}
                    className={cx(
                      "w-full flex items-center gap-3 rounded-2xl border p-3 text-left transition-all",
                      excluded
                        ? "opacity-40 cursor-not-allowed border-neutral-100 bg-neutral-50"
                        : "border-neutral-100 bg-white hover:border-obsidian hover:bg-neutral-50",
                    )}
                  >
                    {/* Thumbnail */}
                    <div className="h-12 w-12 shrink-0 rounded-xl overflow-hidden border border-neutral-100 bg-neutral-50">
                      {product.photo_url ? (
                        <img
                          src={product.photo_url}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Package className="h-5 w-5 text-neutral-400" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      {product.sku && (
                        <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                          {product.sku}
                        </div>
                      )}
                      <div className="text-sm font-bold text-obsidian truncate leading-tight">
                        {product.name}
                      </div>
                    </div>

                    {/* Unit badge */}
                    <span className="inline-flex rounded-full border border-neutral-200 px-2 py-0.5 text-[10px] font-bold text-neutral-500 bg-neutral-50 shrink-0">
                      {product.default_unit}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-neutral-100">
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="w-full h-12 rounded-2xl border-2 border-dashed border-neutral-200 text-sm font-bold text-neutral-500 hover:border-obsidian hover:text-obsidian transition-all flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Crear nuevo producto
            </button>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="z-[60]">
          <ProductFormModal
            onClose={() => setShowForm(false)}
            onSaved={(product) => {
              setShowForm(false);
              onSelect(product);
            }}
          />
        </div>
      )}
    </>
  );
}
