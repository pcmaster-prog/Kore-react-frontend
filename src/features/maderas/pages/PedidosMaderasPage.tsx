import { Clock, CheckCircle } from "lucide-react";

export default function PedidosMaderasPage() {
  const MOCK_PEDIDOS = [
    { id: "PED-001", cliente: "Distribuidora del Norte", total: 5000, fecha: "15 Oct 2026", status: "pendiente" },
    { id: "PED-002", cliente: "Súper Mercados X", total: 12000, fecha: "10 Oct 2026", status: "entregado" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-k-text-h tracking-tight">Pedidos</h1>
          <p className="text-k-text-b text-sm mt-1">
            Historial y seguimiento de pedidos de maderas.
          </p>
        </div>
      </div>

      <div className="bg-k-bg-card border border-k-border rounded-3xl p-6 shadow-k-card">
        <div className="space-y-4">
          {MOCK_PEDIDOS.map(pedido => (
            <div key={pedido.id} className="p-4 rounded-2xl bg-k-bg-card2 border border-k-border flex items-center justify-between hover:border-k-primary transition-colors">
              <div className="flex items-center gap-4">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${pedido.status === 'entregado' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                  {pedido.status === 'entregado' ? <CheckCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                </div>
                <div>
                  <h4 className="font-bold text-k-text-h text-sm">{pedido.id} - {pedido.cliente}</h4>
                  <div className="text-xs text-k-text-b">{pedido.fecha}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-black text-k-text-h">{pedido.total.toLocaleString()} uds</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
