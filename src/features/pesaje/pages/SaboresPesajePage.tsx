import { useState } from "react";
import { BookOpen, Plus, Cherry, Power, PowerOff } from "lucide-react";
import { useSabores, useCreateSabor, useUpdateSabor } from "../hooks/usePesaje";

export default function SaboresPesajePage() {
  const { data: sabores, isLoading } = useSabores();
  const { mutateAsync: createItem } = useCreateSabor();
  const { mutateAsync: updateItem } = useUpdateSabor();

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    presentacion: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createItem(formData);
    setShowModal(false);
    setFormData({ nombre: "", presentacion: "" });
  };

  const toggleStatus = async (id: number, activo: boolean) => {
    await updateItem({ id, data: { activo: !activo } });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-k-text-h tracking-tight">Catálogo de Sabores (Administrador)</h1>
          <p className="text-k-text-b text-sm mt-1">
            Gestión de los productos disponibles para pesaje.
          </p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="h-10 px-4 bg-k-text-h text-white rounded-xl font-bold text-sm hover:bg-black transition-colors shadow-lg flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nuevo Sabor
        </button>
      </div>

      {isLoading ? (
        <p className="text-center py-10">Cargando sabores...</p>
      ) : sabores?.data && sabores.data.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sabores.data.map((s: any) => (
            <div key={s.id} className={`bg-k-bg-card border ${s.activo ? 'border-k-border' : 'border-red-500/30 opacity-60'} rounded-3xl p-6 shadow-k-card transition-all`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.activo ? 'bg-amber-500/10 text-amber-600' : 'bg-red-500/10 text-red-600'}`}>
                    <Cherry className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-k-text-h">{s.nombre}</h3>
                    {s.presentacion && <p className="text-xs text-k-text-b">{s.presentacion}</p>}
                  </div>
                </div>
                <button 
                  onClick={() => toggleStatus(s.id, s.activo)}
                  className={`p-2 rounded-xl transition-colors ${s.activo ? 'bg-green-500/10 text-green-600 hover:bg-red-500/10 hover:text-red-600' : 'bg-red-500/10 text-red-600 hover:bg-green-500/10 hover:text-green-600'}`}
                  title={s.activo ? "Desactivar sabor" : "Activar sabor"}
                >
                  {s.activo ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                </button>
              </div>
              <div className="mt-4 pt-4 border-t border-k-border flex justify-between items-center">
                <span className="text-xs text-k-text-b font-bold uppercase">Estado</span>
                <span className={`text-xs font-black px-2 py-1 rounded-lg ${s.activo ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                  {s.activo ? 'ACTIVO' : 'INACTIVO'}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-k-bg-card border border-k-border rounded-3xl p-6 shadow-k-card text-center py-12">
          <BookOpen className="h-12 w-12 mx-auto text-k-text-b opacity-20 mb-4" />
          <h2 className="text-lg font-bold text-k-text-h">Sin Sabores Registrados</h2>
          <p className="text-sm text-k-text-b max-w-md mx-auto mt-2">
            Crea el catálogo de sabores y presentaciones para que los operarios puedan registrarlos en la báscula.
          </p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-k-bg-card rounded-3xl w-full max-w-md shadow-2xl p-6">
            <h2 className="text-xl font-bold text-k-text-h mb-4">Nuevo Sabor</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-k-text-b uppercase tracking-wider mb-2">Nombre del sabor</label>
                <input 
                  type="text" 
                  value={formData.nombre} 
                  onChange={e => setFormData({...formData, nombre: e.target.value})}
                  className="w-full h-11 px-4 bg-k-bg-page border border-k-border rounded-xl text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
                  placeholder="Ej. Chocolate, Vainilla..."
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-k-text-b uppercase tracking-wider mb-2">Presentación (Opcional)</label>
                <input 
                  type="text" 
                  value={formData.presentacion} 
                  onChange={e => setFormData({...formData, presentacion: e.target.value})}
                  className="w-full h-11 px-4 bg-k-bg-page border border-k-border rounded-xl text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
                  placeholder="Ej. Bote 5kg, Polvo..."
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
