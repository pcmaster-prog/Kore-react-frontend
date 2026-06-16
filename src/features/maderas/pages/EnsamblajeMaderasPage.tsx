import { Combine, Layers, Plus } from "lucide-react";

export default function EnsamblajeMaderasPage() {
  const MOCK_ENSAMBLAJES = [
    { id: 1, producto: "Trapeador Premium", piezas: ["Bastón Cedro 120cm", "Mechudo Algodón"], cantidad: 50, fecha: "10 Oct, 08:00 AM", status: "listo" },
    { id: 2, producto: "Escoba de Plástico", piezas: ["Bastón Pino 100cm", "Cepillo Duro"], cantidad: 200, fecha: "10 Oct, 11:30 AM", status: "en_proceso" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-k-text-h tracking-tight">Ensamblaje</h1>
          <p className="text-k-text-b text-sm mt-1">
            Agrupación de piezas para formar un producto final.
          </p>
        </div>
        <button className="h-10 px-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-sm transition-colors shadow-k-button flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Ensamblaje
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-k-bg-card border border-k-border rounded-3xl p-6 shadow-k-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-k-text-h">Resumen de Ensambles</h3>
                <p className="text-xs text-k-text-b">Hoy</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-xs font-semibold text-k-text-b uppercase">Completados</span>
                <span className="text-2xl font-black text-k-text-h">250</span>
              </div>
              <div className="w-full bg-k-bg-card2 rounded-full h-2">
                <div className="bg-violet-500 h-2 rounded-full" style={{ width: '70%' }}></div>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-violet-500 to-indigo-600 rounded-3xl p-6 shadow-k-card text-white">
            <h3 className="font-bold mb-2">¿Sabías que?</h3>
            <p className="text-sm text-violet-100 opacity-90 leading-relaxed">
              Registrar el ensamblaje descuenta automáticamente el inventario de las piezas sueltas y aumenta el del producto final.
            </p>
          </div>
        </div>

        <div className="md:col-span-2 bg-k-bg-card border border-k-border rounded-3xl p-6 shadow-k-card">
          <h3 className="text-sm font-bold text-k-text-b uppercase tracking-widest mb-6">Órdenes de Ensamblaje</h3>
          
          <div className="space-y-4">
            {MOCK_ENSAMBLAJES.map(item => (
              <div key={item.id} className="p-5 rounded-2xl bg-k-bg-card2 border border-k-border flex flex-col sm:flex-row gap-4 sm:items-center justify-between hover:border-violet-300 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-white border border-k-border flex items-center justify-center text-violet-600 flex-shrink-0">
                    <Combine className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-k-text-h flex items-center gap-2">
                      {item.producto}
                      {item.status === 'listo' && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase">Finalizado</span>
                      )}
                      {item.status === 'en_proceso' && (
                        <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 text-[10px] font-bold uppercase">En Proceso</span>
                      )}
                    </h4>
                    <div className="text-xs text-k-text-b mt-1 flex gap-2">
                      <span>Piezas:</span>
                      <span className="font-medium">{item.piezas.join(", ")}</span>
                    </div>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-xl font-black text-k-text-h">{item.cantidad} <span className="text-xs font-medium text-k-text-b">uds</span></div>
                  <div className="text-xs text-k-text-b mt-0.5">{item.fecha}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
