import { Hammer, Plus, User, Clock } from "lucide-react";

export default function ProduccionMaderasPage() {
  const MOCK_PRODUCCION = [
    { id: 1, operario: "Juan Pérez", maquina: "Torno 1", producto: "Pino 100cm", cantidad: 450, fecha: "Hoy, 10:30 AM", status: "completado" },
    { id: 2, operario: "Carlos López", maquina: "Torno 2", producto: "Pino 120cm", cantidad: 300, fecha: "Hoy, 09:15 AM", status: "completado" },
    { id: 3, operario: "Miguel Ángel", maquina: "Sierra 1", producto: "Tabla Corte A", cantidad: 120, fecha: "Ayer, 16:45 PM", status: "completado" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-k-text-h tracking-tight">Registro de Producción</h1>
          <p className="text-k-text-b text-sm mt-1">
            Control de las piezas trabajadas por operario y máquina.
          </p>
        </div>
        <button className="h-10 px-4 bg-k-primary hover:bg-k-primary-hover text-white rounded-xl font-bold text-sm transition-colors shadow-k-button flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Registrar Producción
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-k-bg-card to-k-bg-card2 border border-k-border rounded-3xl p-6 shadow-k-card">
          <h3 className="text-sm font-bold text-k-text-b uppercase tracking-widest mb-4">Registro Rápido (Mock)</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-k-text-b mb-1">Operario</label>
              <select className="w-full bg-white border border-k-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-k-primary transition-all">
                <option>Seleccionar operario...</option>
                <option>Juan Pérez</option>
                <option>Carlos López</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-k-text-b mb-1">Máquina</label>
                <select className="w-full bg-white border border-k-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-k-primary transition-all">
                  <option>Torno 1</option>
                  <option>Torno 2</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-k-text-b mb-1">Cantidad</label>
                <input type="number" placeholder="Ej. 150" className="w-full bg-white border border-k-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-k-primary transition-all" />
              </div>
            </div>
            <button className="w-full h-11 bg-k-text-h text-white rounded-xl font-bold text-sm hover:bg-black transition-colors shadow-lg">
              Guardar Registro
            </button>
          </div>
        </div>

        <div className="bg-k-bg-card border border-k-border rounded-3xl p-6 shadow-k-card flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-k-text-b uppercase tracking-widest">Últimos Registros</h3>
            <Hammer className="h-4 w-4 text-k-text-b" />
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2" style={{ scrollbarWidth: 'thin' }}>
            {MOCK_PRODUCCION.map(item => (
              <div key={item.id} className="p-4 rounded-2xl bg-k-bg-card2 border border-k-border flex items-center justify-between hover:border-k-primary/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                    {item.operario.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-k-text-h">{item.operario}</h4>
                    <div className="flex items-center gap-2 text-xs text-k-text-b mt-0.5">
                      <span className="flex items-center gap-1"><User className="h-3 w-3" /> {item.maquina}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {item.fecha}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-k-primary">+{item.cantidad}</div>
                  <div className="text-xs text-k-text-b font-medium">{item.producto}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
