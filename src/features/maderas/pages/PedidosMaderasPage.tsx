import { Clock, CheckCircle, Calculator, FileText, Plus } from "lucide-react";
import { usePedidos } from "../hooks/usePedido";
import { MaderasPedido } from "../types";

export default function PedidosMaderasPage() {
  const { data: pedidos = [], isLoading } = usePedidos();

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-k-text-h tracking-tight">Pedidos y Cotizaciones</h1>
          <p className="text-k-text-b text-sm mt-1">
            Calcula materiales y gestiona el historial de pedidos de maderas.
          </p>
        </div>
        <button className="h-10 px-4 bg-k-primary hover:bg-k-primary-hover text-white rounded-xl font-bold text-sm transition-colors shadow-k-button flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Pedido Directo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-k-bg-card border border-k-border rounded-3xl p-6 shadow-k-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <Calculator className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-k-text-h">Calculadora de Materiales</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-k-text-b mb-1">Producto Requerido</label>
              <select className="w-full bg-white border border-k-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-k-primary transition-all">
                <option>Seleccionar producto...</option>
                <option>Trapeador Premium</option>
                <option>Escoba de Plástico</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-k-text-b mb-1">Cantidad a Producir</label>
              <input type="number" placeholder="Ej. 1000" className="w-full bg-white border border-k-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-k-primary transition-all" />
            </div>
            <button className="w-full h-11 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-600 transition-colors shadow-lg mt-4 flex items-center justify-center gap-2">
              <Calculator className="h-4 w-4" />
              Calcular
            </button>
          </div>
        </div>

        <div className="bg-k-bg-card border border-dashed border-k-border rounded-3xl p-6 flex flex-col items-center justify-center text-center h-full">
          <FileText className="h-12 w-12 text-k-text-b opacity-20 mb-4" />
          <h3 className="text-sm font-bold text-k-text-h mb-2">Esperando parámetros</h3>
          <p className="text-xs text-k-text-b max-w-xs">
            Ingresa el producto y la cantidad deseada para calcular los materiales y tiempos estimados antes de generar el pedido.
          </p>
        </div>
      </div>

      <div className="bg-k-bg-card border border-k-border rounded-3xl p-6 shadow-k-card mt-8">
        <h3 className="text-sm font-bold text-k-text-h uppercase tracking-widest mb-4">Historial de Pedidos</h3>
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center text-k-text-b py-8">Cargando pedidos...</div>
          ) : pedidos.length === 0 ? (
            <div className="text-center text-k-text-b py-8">Aún no hay pedidos registrados.</div>
          ) : (
            pedidos.map((pedido: MaderasPedido) => (
              <div key={pedido.id} className="p-4 rounded-2xl bg-k-bg-card2 border border-k-border flex items-center justify-between hover:border-k-primary transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${pedido.status === 'entregado' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                    {pedido.status === 'entregado' ? <CheckCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-k-text-h text-sm">{pedido.codigo} - {pedido.cliente}</h4>
                    <div className="text-xs text-k-text-b">Entrega: {pedido.fecha_entrega ? new Date(pedido.fecha_entrega).toLocaleDateString() : "Sin fecha"}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black text-k-text-h">{pedido.total_unidades.toLocaleString()} uds</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
