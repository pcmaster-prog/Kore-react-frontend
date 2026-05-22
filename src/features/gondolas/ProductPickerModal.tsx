// src/features/gondolas/ProductPickerModal.tsx
import { useState, useMemo, useEffect } from "react";
import { X, Package, Plus, Search, Camera } from "lucide-react";
import { useProducts } from "./hooks/useGondolaProducts";
import type { Product } from "./types";
import { UNIDADES } from "./utils";
import { cx } from "@/lib/utils";
import ProductFormModal from "./ProductFormModal";

interface ProductPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (product: Product) => void;
  excludeIds?: string[];
}

export default function ProductPickerModal({
  open,
  onClose,
  onSelect,
  excludeIds = [],
}: ProductPickerModalProps) {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const { data: products = [], isLoading } = useProducts();

  useEffect(() => {
    if (open) {
      setSearch("");
      setShowCreate(false);
    }
  }, [open]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;
    return products.filter((p) => {
      const nameMatch = p.name.toLowerCase().includes(term);
      const skuMatch = p.sku ? p.sku.toLowerCase().includes(term) : false;
      return nameMatch || skuMatch;
    });
  }, [products, search]);

  const excludeSet = useMemo(() => new Set(excludeIds), [excludeIds]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-obsidian/40 backdrop-blur-sm"
          onClick={onClose}
        />
        <div className="relative bg-white rounded-[32px] shadow-2xl border border-neutral-100 w-full max-w-md overflow-hidden flex flex-col animate-in-up max-h-[85vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-100 shrink-0">
            <h2 className="text-lg font-black text-obsidian tracking-tight">
              Seleccionar producto
            </h2>
            <button
              onClick={onClose}
              className="h-9 w-9 rounded-xl bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors"
            >
              <X className="h-4 w-4 text-neutral-500" />
            </button>
          </div>

          {/* Buscador */}
          <div className="px-6 pt-4 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre o SKU…"
                className="w-full rounded-2xl border border-neutral-200 pl-9 pr-4 py-2.5 text-sm font-medium text-obsidian outline-none focus:border-obsidian focus:ring-2 focus:ring-obsidian/10 transition-all"
              />
            </div>
          </div>

          {/* Lista */}
          <div className="flex-1 overflow-y-auto p-6 min-h-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-6 w-6 border-2 border-neutral-200 border-t-obsidian rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="h-8 w-8 text-neutral-300 mb-2" />
                <p className="text-sm font-medium text-neutral-400">
                  No hay productos en el catálogo
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((product) => {
                  const excluded = excludeSet.has(product.id);
                  return (
                    <button
                      key={product.id}
                      type="button"
                      disabled={excluded}
                      onClick={() => {
                        if (excluded) return;
                        onSelect(product);
                        onClose();
                      }}
                      className={cx(
                        "w-full flex items-center gap-3 rounded-2xl border p-3 transition-all text-left",
                        excluded
                          ? "bg-neutral-50 border-neutral-100 opacity-40 cursor-not-allowed"
                          : "bg-white border-neutral-100 hover:border-obsidian/30 hover:shadow-sm"
                      )}
                    >
                      {/* Thumbnail */}
                      <div className="relative h-12 w-12 shrink-0 rounded-xl overflow-hidden border border-neutral-100 bg-neutral-100 flex items-center justify-center">
                        {product.photo_url ? (
                          <img
                            src={product.photo_url}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Package className="h-5 w-5 text-neutral-400" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-obsidian truncate">
                            {product.name}
                          </span>
                          {product.sku && (
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide shrink-0">
                              {product.sku}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex rounded-full border border-neutral-200 px-2 py-0.5 text-[10px] font-bold text-neutral-500 bg-neutral-50">
                            {UNIDADES[product.default_unit] ?? product.default_unit}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 p-4 border-t border-neutral-100">
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="w-full h-12 rounded-2xl border-2 border-dashed border-neutral-200 text-sm font-bold text-neutral-500 hover:border-obsidian hover:text-obsidian transition-all flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Crear nuevo producto
            </button>
          </div>
        </div>
      </div>

      {/* Stack: crear producto encima */}
      {showCreate && (
        <ProductFormModal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          onSaved={(product) => {
            setShowCreate(false);
            onSelect(product);
            onClose();
          }}
        />
      )}
    </>
  );
}
