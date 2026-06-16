import { useState } from "react";
import { Plus, Package, Clock, Users, Flame, User, Hammer } from "lucide-react";
import { useProduccion } from "../hooks/useProduccion";
import { MaderasProduccion } from "../types";

export default function ProduccionMaderasPage() {
  const { data: produccion = [], isLoading } = useProduccion();

  const hoy = new Date().toISOString().split('T')[0];
  
  const produccionHoy = produccion
    .filter((p: MaderasProduccion) => p.fecha_registro.startsWith(hoy))
    .reduce((acc: number, p: MaderasProduccion) => acc + p.cantidad, 0);

  const operariosActivos = new Set(
    produccion
      .filter((p: MaderasProduccion) => p.fecha_registro.startsWith(hoy))
      .map((p: MaderasProduccion) => p.empleado_id)
  ).size;

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-k-bg-card to-k-bg-card2 border border-k-border rounded-3xl p-6 shadow-k-card">
          <h3 className="text-sm font-bold text-k-text-b uppercase tracking-widest mb-4">Registro Rápido</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-k-text-b mb-1">Operario</label>
              <select className="w-full bg-white border border-k-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-k-primary transition-all">
                <option>Seleccionar operario...</option>
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

        <div className="bg-k-bg-card border border-k-border rounded-3xl p-6 shadow-k-card flex flex-col col-span-1 md:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-k-text-b uppercase tracking-widest">Últimos Registros</h3>
            <Hammer className="h-4 w-4 text-k-text-b" />
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2" style={{ scrollbarWidth: 'thin' }}>
            {isLoading ? (
              <div className="text-center text-k-text-b py-8">Cargando producción...</div>
            ) : produccion.length === 0 ? (
              <div className="text-center text-k-text-b py-8">Aún no hay registros de producción.</div>
            ) : (
              produccion.map((item: MaderasProduccion) => (
                <div key={item.id} className="p-4 rounded-2xl bg-k-bg-card2 border border-k-border flex items-center justify-between hover:border-k-primary/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                      {item.empleado?.nombre?.charAt(0) || "U"}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-k-text-h">{item.empleado?.nombre || item.empleado_id.slice(0, 8)}</h4>
                      <div className="flex items-center gap-2 text-xs text-k-text-b mt-0.5">
                        <span className="flex items-center gap-1"><User className="h-3 w-3" /> {item.maquina || "S/M"}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(item.fecha_registro).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-k-primary">+{item.cantidad}</div>
                    <div className="text-xs text-k-text-b font-medium">{item.catalogo?.nombre}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
