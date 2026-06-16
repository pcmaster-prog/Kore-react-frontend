import { Calculator } from "lucide-react";

export default function CalculadoraPedidosPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-k-text-h tracking-tight">Calculadora de Pedidos</h1>
          <p className="text-k-text-b text-sm mt-1">
            Cotiza y calcula materiales necesarios para nuevos pedidos.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-k-bg-card border border-k-border rounded-3xl p-6 shadow-k-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <Calculator className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-k-text-h">Parámetros del Pedido</h3>
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
            <button className="w-full h-11 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-600 transition-colors shadow-lg mt-4">
              Calcular Materiales
            </button>
          </div>
        </div>

        <div className="bg-k-bg-card border border-dashed border-k-border rounded-3xl p-6 flex flex-col items-center justify-center text-center">
          <Calculator className="h-12 w-12 text-k-text-b opacity-20 mb-4" />
          <h3 className="text-sm font-bold text-k-text-h mb-2">Esperando parámetros</h3>
          <p className="text-xs text-k-text-b max-w-xs">
            Ingresa el producto y la cantidad deseada para calcular los materiales, tiempos estimados y costos aproximados.
          </p>
        </div>
      </div>
    </div>
  );
}
