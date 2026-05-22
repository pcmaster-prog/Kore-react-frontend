// src/features/gondolas/ProductCatalogPage.tsx
import { useState } from "react";
import { Package, Search, Plus, Loader2, Pencil } from "lucide-react";
import ProductFormModal from "./ProductFormModal";
import { useProducts, useUpdateProduct } from "./hooks/useGondolaProducts";
import type { Product } from "./types";
// 
export default function ProductCatalogPage() {
  const [search, setSearch] = useState("");
  const { data: products, isLoading } = useProducts({
    search: search.trim() || undefined,
  });
  const updateProduct = useUpdateProduct();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  function openNew() {
    setEditingProduct(null);
    setModalOpen(true);
  }

  function openEdit(product: Product) {
    setEditingProduct(product);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingProduct(null);
  }

  async function handleToggleActive(product: Product) {
    await updateProduct.mutateAsync({
      id: product.id,
      data: { is_active: !product.is_active },
    });
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-xl font-black text-k-text-h tracking-tight">
          Catálogo de Productos
        </h1>
        <button
          onClick={openNew}
          className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-2xl bg-k-accent-btn text-k-accent-btn-text text-sm font-bold hover:opacity-90 transition-all shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Nuevo Producto
        </button>
      </div>

      {/* Buscador */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-k-text-b" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar producto..."
          className="w-full h-11 pl-10 pr-4 rounded-2xl border border-k-border text-sm font-medium text-k-text-h outline-none focus:border-obsidian focus:ring-2 focus:ring-obsidian/10 transition-all bg-k-bg-card"
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 text-k-text-b animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && products?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Package className="h-12 w-12 text-k-text-b mb-4" />
          <div className="text-sm font-bold text-k-text-b">
            No hay productos en el catálogo
          </div>
        </div>
      )}

      {/* Grid */}
      {!isLoading && products && products.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-[28px] border border-neutral-100 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                {/* Foto */}
                <div className="h-12 w-12 shrink-0 rounded-xl overflow-hidden border border-k-border bg-neutral-50">
                  {product.photo_url ? (
                    <img
                      src={product.photo_url}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Package className="h-5 w-5 text-k-text-b" />
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
                  <div className="text-sm font-bold text-k-text-h truncate leading-tight">
                    {product.name}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="bg-neutral-100 text-neutral-600 rounded-full px-2 py-0.5 text-[10px] font-bold">
                      {product.default_unit}
                    </span>
                    {typeof product.locations_count === "number" && (
                      <span className="text-[10px] font-medium text-k-text-b">
                        En {product.locations_count} góndola
                        {product.locations_count !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-100">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={product.is_active}
                    onChange={() => handleToggleActive(product)}
                    disabled={updateProduct.isPending}
                    className="h-4 w-4 rounded border-neutral-300 text-k-accent-btn focus:ring-k-accent-btn"
                  />
                  <span className="text-xs font-bold text-k-text-b">
                    {product.is_active ? "Activo" : "Inactivo"}
                  </span>
                </label>

                <button
                  onClick={() => openEdit(product)}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-neutral-200 text-xs font-bold text-k-text-b hover:bg-neutral-50 transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Editar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <ProductFormModal
          product={editingProduct}
          onClose={closeModal}
          onSaved={closeModal}
        />
      )}
    </div>
  );
}
