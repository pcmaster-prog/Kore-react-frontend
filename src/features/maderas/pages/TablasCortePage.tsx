import { useState } from "react";
import { Scissors, Plus, FileText } from "lucide-react";
import { useTablasCortes, useCreateTablaCorte } from "../hooks/useCatalogo";

export default function TablasCortePage() {
  const { data: tablas, isLoading } = useTablasCortes();
  const { mutateAsync: createItem } = useCreateTablaCorte();

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    rendimiento_esperado: 1.0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createItem(formData);
    setShowModal(false);
    setFormData({ nombre: "", rendimiento_esperado: 1.0 });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-k-text-h tracking-tight">Tablas de Corte (Administrador)</h1>
          <p className="text-k-text-b text-sm mt-1">
            Métricas de piezas por troncos y aserraderos.
          </p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="h-10 px-4 bg-k-text-h text-white rounded-xl font-bold text-sm hover:bg-black transition-colors shadow-lg flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nueva Tabla
        </button>
      </div>

      {isLoading ? (
        <p className="text-center py-10">Cargando tablas...</p>
      ) : tablas && tablas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tablas.map(t => (
            <div key={t.id} className="bg-k-bg-card border border-k-border rounded-3xl p-6 shadow-k-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                  <FileText className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-k-text-h">{t.nombre}</h3>
              </div>
              <div className="mt-4 pt-4 border-t border-k-border flex justify-between items-center">
                <span className="text-xs text-k-text-b font-bold uppercase">Rendimiento Base</span>
                <span className="text-sm font-black text-k-text-h bg-k-bg-page px-3 py-1 rounded-lg">{t.rendimiento_esperado}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-k-bg-card border border-k-border rounded-3xl p-6 shadow-k-card text-center py-12">
          <Scissors className="h-12 w-12 mx-auto text-k-text-b opacity-20 mb-4" />
          <h2 className="text-lg font-bold text-k-text-h">Sin Tablas Registradas</h2>
          <p className="text-sm text-k-text-b max-w-md mx-auto mt-2">
            Aquí podrás definir las tablas de corte (PXT) para proyectar el aserrado.
          </p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-k-bg-card rounded-3xl w-full max-w-md shadow-2xl p-6">
            <h2 className="text-xl font-bold text-k-text-h mb-4">Nueva Tabla de Corte</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-k-text-b uppercase tracking-wider mb-2">Nombre</label>
                <input 
                  type="text" 
                  value={formData.nombre} 
                  onChange={e => setFormData({...formData, nombre: e.target.value})}
                  className="w-full h-11 px-4 bg-k-bg-page border border-k-border rounded-xl text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
                  placeholder="Ej. Tabla Pino"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-k-text-b uppercase tracking-wider mb-2">Rendimiento Esperado</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0.01"
                  value={formData.rendimiento_esperado} 
                  onChange={e => setFormData({...formData, rendimiento_esperado: parseFloat(e.target.value)})}
                  className="w-full h-11 px-4 bg-k-bg-page border border-k-border rounded-xl text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-k-text-b hover:text-k-text-h transition-colors">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-amber-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-amber-500/30 hover:bg-amber-600 transition-colors">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
