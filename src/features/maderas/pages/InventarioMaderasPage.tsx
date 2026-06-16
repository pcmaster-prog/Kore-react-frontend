import { Package, Search, AlertCircle, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useInventario } from "../hooks/useInventario";
import { MaderasInventario } from "../types";

export default function InventarioMaderasPage() {
  const { data: inventario = [], isLoading } = useInventario();

  const totalStockBastones = inventario
    .filter((item: MaderasInventario) => item.catalogo?.tipo === "baston")
    .reduce((acc: number, item: MaderasInventario) => acc + item.stock, 0);

  const totalStockProductos = inventario
    .filter((item: MaderasInventario) => item.catalogo?.tipo === "producto_terminado")
    .reduce((acc: number, item: MaderasInventario) => acc + item.stock, 0);

  const alertas = inventario.filter((item: MaderasInventario) => item.status === "critical" || item.status === "low").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-k-text-h tracking-tight">Inventario de Maderas</h1>
          <p className="text-k-text-b text-sm mt-1">
            Gestión de stock de bastones y productos terminados.
          </p>
        </div>
        <button className="h-10 px-4 bg-k-primary hover:bg-k-primary-hover text-white rounded-xl font-bold text-sm transition-colors shadow-k-button flex items-center gap-2">
          <Package className="h-4 w-4" />
          Ajuste de Stock
        </button>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-k-border bg-k-bg-card">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-k-text-b">Cargando inventario...</td>
                </tr>
              ) : inventario.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-k-text-b">No hay items en el inventario.</td>
                </tr>
              ) : (
                inventario.map((item: MaderasInventario) => (
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
