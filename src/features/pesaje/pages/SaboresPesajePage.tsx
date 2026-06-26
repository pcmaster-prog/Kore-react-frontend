import { useState } from "react";
import { BookOpen, Plus, Cherry, Power, PowerOff, Pencil } from "lucide-react";
import { useSabores, useCreateSabor, useUpdateSabor } from "../hooks/usePesaje";
import type { PesajeSabor } from "../types";

type FormData = {
  nombre: string;
  presentacion: string;
  peso_estandar: string;
  unidad: string;
  usar20kg: boolean;
};

const EMPTY_FORM: FormData = {
  nombre: "",
  presentacion: "",
  peso_estandar: "20",
  unidad: "bulto",
  usar20kg: true,
};

export default function SaboresPesajePage() {
  const { data: saboresResp, isLoading } = useSabores(true);
  const { mutateAsync: createItem } = useCreateSabor();
  const { mutateAsync: updateItem } = useUpdateSabor();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<PesajeSabor | null>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);

  const openCreate = () => {
    setEditing(null);
    setFormData(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (sabor: PesajeSabor) => {
    setEditing(sabor);
    setFormData({
      nombre: sabor.nombre,
      presentacion: sabor.presentacion ?? "",
      peso_estandar: String(sabor.peso_estandar ?? 20),
      unidad: sabor.unidad || "bulto",
      usar20kg: Number(sabor.peso_estandar ?? 20) === 20,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      nombre: formData.nombre.trim(),
      presentacion: formData.presentacion.trim() || undefined,
      peso_estandar: parseFloat(formData.peso_estandar),
      unidad: formData.unidad.trim() || "bulto",
    };

    if (editing) {
      await updateItem({ id: editing.id, data: payload });
    } else {
      await createItem(payload);
    }

    setShowModal(false);
    setEditing(null);
    setFormData(EMPTY_FORM);
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
          onClick={openCreate}
          className="h-10 px-4 bg-k-text-h text-white rounded-xl font-bold text-sm hover:bg-black transition-colors shadow-lg flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nuevo Sabor
        </button>
      </div>

      {isLoading ? (
        <p className="text-center py-10">Cargando sabores...</p>
      ) : saboresResp?.data && saboresResp.data.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {saboresResp.data.map((s: PesajeSabor) => (
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
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(s)}
                    className="p-2 rounded-xl transition-colors bg-k-bg-page text-k-text-b hover:text-k-text-h"
                    title="Editar sabor"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleStatus(s.id, s.activo)}
                    className={`p-2 rounded-xl transition-colors ${s.activo ? 'bg-green-500/10 text-green-600 hover:bg-red-500/10 hover:text-red-600' : 'bg-red-500/10 text-red-600 hover:bg-green-500/10 hover:text-green-600'}`}
                    title={s.activo ? "Desactivar sabor" : "Activar sabor"}
                  >
                    {s.activo ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-k-border space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-k-text-b font-bold uppercase">Peso estándar</span>
                  <span className="text-xs font-black text-k-text-h">{s.peso_estandar} kg / {s.unidad}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-k-text-b font-bold uppercase">Estado</span>
                  <span className={`text-xs font-black px-2 py-1 rounded-lg ${s.activo ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                    {s.activo ? 'ACTIVO' : 'INACTIVO'}
                  </span>
                </div>
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
            <h2 className="text-xl font-bold text-k-text-h mb-4">
              {editing ? "Editar Sabor" : "Nuevo Sabor"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-k-text-b uppercase tracking-wider mb-2">Nombre del sabor</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={e => setFormData({ ...formData, nombre: e.target.value })}
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
                  onChange={e => setFormData({ ...formData, presentacion: e.target.value })}
                  className="w-full h-11 px-4 bg-k-bg-page border border-k-border rounded-xl text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
                  placeholder="Ej. Bote 5kg, Polvo..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-k-text-b uppercase tracking-wider mb-2">Peso estándar por unidad</label>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, usar20kg: true, peso_estandar: "20" })}
                    className={`flex-1 h-10 rounded-xl text-sm font-bold border transition-colors ${formData.usar20kg ? 'bg-amber-500 text-white border-amber-500' : 'bg-k-bg-page border-k-border text-k-text-b'}`}
                  >
                    20 kg
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, usar20kg: false })}
                    className={`flex-1 h-10 rounded-xl text-sm font-bold border transition-colors ${!formData.usar20kg ? 'bg-amber-500 text-white border-amber-500' : 'bg-k-bg-page border-k-border text-k-text-b'}`}
                  >
                    Otro
                  </button>
                </div>
                {!formData.usar20kg && (
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={formData.peso_estandar}
                    onChange={e => setFormData({ ...formData, peso_estandar: e.target.value })}
                    className="w-full h-11 px-4 bg-k-bg-page border border-k-border rounded-xl text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
                    placeholder="Ej. 5, 10.5, 25..."
                    required
                  />
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-k-text-b uppercase tracking-wider mb-2">Unidad de conteo</label>
                <input
                  type="text"
                  value={formData.unidad}
                  onChange={e => setFormData({ ...formData, unidad: e.target.value })}
                  className="w-full h-11 px-4 bg-k-bg-page border border-k-border rounded-xl text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
                  placeholder="Ej. bulto, cubeta, caja..."
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditing(null); setFormData(EMPTY_FORM); }}
                  className="px-4 py-2 text-sm font-medium text-k-text-b hover:text-k-text-h transition-colors"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2 bg-amber-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-amber-500/30 hover:bg-amber-600 transition-colors">
                  {editing ? "Guardar cambios" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
