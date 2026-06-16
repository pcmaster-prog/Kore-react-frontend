import { useState } from "react";
import { Package, AlertCircle, ArrowUpRight, Search, Edit2 } from "lucide-react";
import { useInventario, useUpdateInventario } from "../hooks/useInventario";
import type { MaderasInventario } from "../types";

export default function InventarioMaderasPage() {
  const { data: inventario = [], isLoading } = useInventario();
  const { mutateAsync: updateStock } = useUpdateInventario();

  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MaderasInventario | null>(null);
  const [stockVal, setStockVal] = useState(0);
  const [stockMinVal, setStockMinVal] = useState(0);

  const totalStockBastones = inventario
    .filter((item: MaderasInventario) => item.catalogo?.tipo === "baston")
    .reduce((acc: number, item: MaderasInventario) => acc + item.stock, 0);

  const totalStockProductos = inventario
    .filter((item: MaderasInventario) => item.catalogo?.tipo === "producto_terminado")
    .reduce((acc: number, item: MaderasInventario) => acc + item.stock, 0);

  const alertas = inventario.filter((item: MaderasInventario) => item.status === "critical" || item.status === "low").length;

  const handleEditClick = (item: MaderasInventario) => {
    setSelectedItem(item);
    setStockVal(item.stock);
    setStockMinVal(item.stock_minimo);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    try {
      await updateStock({
        id: selectedItem.id,
        data: {
          stock: stockVal,
          stock_minimo: stockMinVal,
        },
      });
      setShowModal(false);
    } catch (err) {
      console.error("Error updating inventory", err);
    }
  };

  const filteredInventario = inventario.filter((item) =>
    item.catalogo?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.catalogo?.tipo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-k-text-h tracking-tight">Inventario de Maderas</h1>
          <p className="text-k-text-b text-sm mt-1">
            Gestión de stock de bastones y productos terminados.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-k-bg-card border border-k-border rounded-2xl p-6 shadow-k-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-k-text-b">Stock Total (Bastones)</h3>
            <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-black text-k-text-h">{totalStockBastones.toLocaleString()}</span>
            <span className="text-xs font-medium text-emerald-500 flex items-center bg-emerald-50 px-2 py-1 rounded-lg">
              <ArrowUpRight className="h-3 w-3 mr-1" />+0%
            </span>
          </div>
        </div>
        <div className="bg-k-bg-card border border-k-border rounded-2xl p-6 shadow-k-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-k-text-b">Productos Terminados</h3>
            <div className="h-8 w-8 rounded-full bg-violet-50 flex items-center justify-center text-violet-600">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-black text-k-text-h">{totalStockProductos.toLocaleString()}</span>
            <span className="text-xs font-medium text-emerald-500 flex items-center bg-emerald-50 px-2 py-1 rounded-lg">
              <ArrowUpRight className="h-3 w-3 mr-1" />+0%
            </span>
          </div>
        </div>
        <div className="bg-k-bg-card border border-k-border rounded-2xl p-6 shadow-k-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-k-text-b">Alertas de Stock</h3>
            <div className="h-8 w-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-black text-k-text-h">{alertas}</span>
            <span className="text-xs font-medium text-rose-600">Artículos críticos</span>
          </div>
        </div>
      </div>

      <div className="bg-k-bg-card border border-k-border rounded-2xl shadow-k-card overflow-hidden">
        <div className="p-4 border-b border-k-border flex justify-between items-center bg-k-bg-card2">
          <h2 className="font-bold text-k-text-h">Detalle de Inventario</h2>
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-k-text-b" />
            <input
              type="text"
              placeholder="Buscar material..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-k-bg-card border border-k-border rounded-xl text-sm w-64 focus:outline-none focus:ring-2 focus:ring-k-primary"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-k-border bg-k-bg-card">
                <th className="p-4 text-xs font-bold text-k-text-b uppercase tracking-wider">Tipo</th>
                <th className="p-4 text-xs font-bold text-k-text-b uppercase tracking-wider">Variante</th>
                <th className="p-4 text-xs font-bold text-k-text-b uppercase tracking-wider">Stock</th>
                <th className="p-4 text-xs font-bold text-k-text-b uppercase tracking-wider">Estado</th>
                <th className="p-4 text-xs font-bold text-k-text-b uppercase tracking-wider text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-k-border bg-k-bg-card">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-k-text-b">Cargando inventario...</td>
                </tr>
              ) : filteredInventario.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-k-text-b">No se encontraron items.</td>
                </tr>
              ) : (
                filteredInventario.map((item: MaderasInventario) => (
                  <tr key={item.id} className="hover:bg-k-bg-card2 transition-colors">
                    <td className="p-4">
                      <span className="font-medium text-k-text-h text-sm capitalize">{item.catalogo?.tipo.replace("_", " ")}</span>
                    </td>
                    <td className="p-4 text-sm text-k-text-b">{item.catalogo?.nombre}</td>
                    <td className="p-4">
                      <span className="font-bold text-k-text-h">{item.stock.toLocaleString()}</span>
                      <span className="text-xs text-k-text-b ml-1">{item.catalogo?.unidad_medida}</span>
                    </td>
                    <td className="p-4">
                      {item.status === "ok" && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-600">
                          Adecuado
                        </span>
                      )}
                      {item.status === "low" && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-600">
                          Bajo ({item.stock_minimo} min)
                        </span>
                      )}
                      {item.status === "critical" && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-rose-50 text-rose-600">
                          Crítico ({item.stock_minimo} min)
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleEditClick(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-k-bg-page border border-k-border text-k-text-h hover:border-k-primary text-xs font-bold rounded-lg transition-colors"
                      >
                        <Edit2 className="h-3 w-3" />
                        Ajustar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && selectedItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-k-bg-card border border-k-border rounded-3xl w-full max-w-md shadow-2xl p-6">
            <h2 className="text-xl font-bold text-k-text-h mb-2">Ajustar Inventario</h2>
            <p className="text-xs text-k-text-b mb-6">{selectedItem.catalogo?.nombre}</p>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-k-text-b uppercase tracking-wider mb-2">Stock Actual</label>
                <input
                  type="number"
                  min="0"
                  value={stockVal}
                  onChange={(e) => setStockVal(parseInt(e.target.value) || 0)}
                  className="w-full h-11 px-4 bg-k-bg-page border border-k-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-k-primary text-k-text-h"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-k-text-b uppercase tracking-wider mb-2">Stock Mínimo Alerta</label>
                <input
                  type="number"
                  min="0"
                  value={stockMinVal}
                  onChange={(e) => setStockMinVal(parseInt(e.target.value) || 0)}
                  className="w-full h-11 px-4 bg-k-bg-page border border-k-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-k-primary text-k-text-h"
                  required
                />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="h-10 px-4 border border-k-border rounded-xl font-bold text-sm text-k-text-b hover:bg-k-bg-page transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-10 px-4 bg-k-text-h text-white rounded-xl font-bold text-sm hover:bg-black transition-colors"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
