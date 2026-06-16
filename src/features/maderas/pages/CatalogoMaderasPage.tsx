import { useState } from "react";
import { BookOpen, Plus, Package, Ruler } from "lucide-react";
import { useProductos, useBastones, useCreateCatalogo } from "../hooks/useCatalogo";

export default function CatalogoMaderasPage() {
  const { data: productos, isLoading: loadingProd } = useProductos();
  const { data: bastones, isLoading: loadingBast } = useBastones();
  const { mutateAsync: createItem } = useCreateCatalogo();

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    tipo: "producto_terminado",
    unidad_medida: "uds",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createItem(formData);
    setShowModal(false);
    setFormData({ nombre: "", tipo: "producto_terminado", unidad_medida: "uds" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-k-text-h tracking-tight">Catálogo (Administrador)</h1>
          <p className="text-k-text-b text-sm mt-1">
            Gestión de productos y bastones.
          </p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="h-10 px-4 bg-k-text-h text-white rounded-xl font-bold text-sm hover:bg-black transition-colors shadow-lg flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Añadir al Catálogo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-k-bg-card border border-k-border rounded-3xl p-6 shadow-k-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
              <Package className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-k-text-h">Productos Terminados</h2>
          </div>
          {loadingProd ? (
            <p className="text-sm text-k-text-b text-center py-4">Cargando...</p>
          ) : productos && productos.length > 0 ? (
            <ul className="divide-y divide-k-border">
              {productos.map((p) => (
                <li key={p.id} className="py-3 flex justify-between items-center">
                  <span className="font-medium text-k-text-h text-sm">{p.nombre}</span>
                  <span className="text-xs text-k-text-b px-2 py-1 bg-k-bg-page rounded-lg">{p.unidad_medida}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-k-text-b text-center py-4">No hay productos registrados.</p>
          )}
        </div>

        <div className="bg-k-bg-card border border-k-border rounded-3xl p-6 shadow-k-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
              <Ruler className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-k-text-h">Bastones / Materia Prima</h2>
          </div>
          {loadingBast ? (
            <p className="text-sm text-k-text-b text-center py-4">Cargando...</p>
          ) : bastones && bastones.length > 0 ? (
            <ul className="divide-y divide-k-border">
              {bastones.map((b) => (
                <li key={b.id} className="py-3 flex justify-between items-center">
                  <span className="font-medium text-k-text-h text-sm">{b.nombre}</span>
                  <span className="text-xs text-k-text-b px-2 py-1 bg-k-bg-page rounded-lg">{b.unidad_medida}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-k-text-b text-center py-4">No hay bastones registrados.</p>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-k-bg-card rounded-3xl w-full max-w-md shadow-2xl p-6">
            <h2 className="text-xl font-bold text-k-text-h mb-4">Añadir al Catálogo</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-k-text-b uppercase tracking-wider mb-2">Nombre</label>
                <input 
                  type="text" 
                  value={formData.nombre} 
                  onChange={e => setFormData({...formData, nombre: e.target.value})}
                  className="w-full h-11 px-4 bg-k-bg-page border border-k-border rounded-xl text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-k-text-b uppercase tracking-wider mb-2">Tipo</label>
                  <select
                    value={formData.tipo}
                    onChange={e => setFormData({...formData, tipo: e.target.value})}
                    className="w-full h-11 px-4 bg-k-bg-page border border-k-border rounded-xl text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
                  >
                    <option value="producto_terminado">Producto Terminado</option>
                    <option value="baston">Bastón / Insumo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-k-text-b uppercase tracking-wider mb-2">Unidad</label>
                  <input 
                    type="text" 
                    value={formData.unidad_medida} 
                    onChange={e => setFormData({...formData, unidad_medida: e.target.value})}
                    className="w-full h-11 px-4 bg-k-bg-page border border-k-border rounded-xl text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
                    placeholder="uds, kg, m..."
                    required
                  />
                </div>
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
