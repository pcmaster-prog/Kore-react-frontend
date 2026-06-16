import { Combine, Layers, Plus } from "lucide-react";
import { useEnsambles } from "../hooks/useEnsamblaje";
import type { MaderasEnsamble, MaderasEnsamblePieza } from "../types";

export default function EnsamblajeMaderasPage() {
  const { data: ensamblajes = [], isLoading } = useEnsambles();
  
  const ensamblesCompletados = ensamblajes
    .filter((e: MaderasEnsamble) => e.status === "listo")
    .reduce((acc: number, e: MaderasEnsamble) => acc + e.cantidad_generada, 0);

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
                <span className="text-2xl font-black text-k-text-h">{ensamblesCompletados}</span>
              </div>
              <div className="w-full bg-k-bg-card2 rounded-full h-2">
                <div className="bg-violet-500 h-2 rounded-full" style={{ width: ensamblajes.length > 0 ? '100%' : '0%' }}></div>
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
            {isLoading ? (
              <div className="text-center text-k-text-b py-8">Cargando ensambles...</div>
            ) : ensamblajes.length === 0 ? (
              <div className="text-center text-k-text-b py-8">Aún no hay ensambles registrados.</div>
            ) : (
              ensamblajes.map((item: MaderasEnsamble) => (
                <div key={item.id} className="p-5 rounded-2xl bg-k-bg-card2 border border-k-border flex flex-col sm:flex-row gap-4 sm:items-center justify-between hover:border-violet-300 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-white border border-k-border flex items-center justify-center text-violet-600 flex-shrink-0">
                      <Combine className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-k-text-h flex items-center gap-2">
                        {item.catalogo?.nombre}
                        {item.status === 'listo' && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase">Finalizado</span>
                        )}
                        {item.status === 'en_proceso' && (
                          <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 text-[10px] font-bold uppercase">En Proceso</span>
                        )}
                      </h4>
                      <div className="text-xs text-k-text-b mt-1 flex gap-2">
                        <span>Piezas:</span>
                        <span className="font-medium">
                          {item.piezas?.map((p: MaderasEnsamblePieza) => `${p.cantidad_usada}x ${p.catalogo?.nombre}`).join(", ")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-xl font-black text-k-text-h">{item.cantidad_generada} <span className="text-xs font-medium text-k-text-b">uds</span></div>
                    <div className="text-xs text-k-text-b mt-0.5">{new Date(item.created_at).toLocaleDateString()}</div>
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
