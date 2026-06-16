import { useState } from "react";
import { Calendar, Plus, CalendarCheck2 } from "lucide-react";
import { useTemporadas, useTemporadaActiva, useCreateTemporada } from "../hooks/useTemporada";

const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export default function TemporadasMaderasPage() {
  const { data: temporadas, isLoading } = useTemporadas();
  const { data: activa } = useTemporadaActiva();
  const { mutateAsync: createItem } = useCreateTemporada();

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    mes_inicio: 1,
    mes_fin: 12,
    multiplicador: 1.0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createItem(formData);
    setShowModal(false);
    setFormData({ nombre: "", mes_inicio: 1, mes_fin: 12, multiplicador: 1.0 });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-k-text-h tracking-tight">Temporadas (Administrador)</h1>
          <p className="text-k-text-b text-sm mt-1">
            Configuración de meses fuertes y parámetros de producción.
          </p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="h-10 px-4 bg-k-text-h text-white rounded-xl font-bold text-sm hover:bg-black transition-colors shadow-lg flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nueva Temporada
        </button>
      </div>

      {activa && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-amber-500/30 shrink-0">
            <CalendarCheck2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-600 uppercase tracking-wider">Temporada Actual</h3>
            <p className="text-lg font-black text-k-text-h">
              {activa.nombre} <span className="text-sm font-medium text-k-text-b ml-2">(Multiplicador: {activa.multiplicador}x)</span>
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-center py-10">Cargando temporadas...</p>
      ) : temporadas && temporadas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {temporadas.map(t => (
            <div key={t.id} className={`bg-k-bg-card border ${activa?.id === t.id ? 'border-amber-500 ring-1 ring-amber-500' : 'border-k-border'} rounded-3xl p-6 shadow-k-card`}>
              <h3 className="text-lg font-bold text-k-text-h">{t.nombre}</h3>
              <p className="text-sm text-k-text-b mt-1">De {monthNames[t.mes_inicio - 1]} a {monthNames[t.mes_fin - 1]}</p>
              <div className="mt-4 pt-4 border-t border-k-border flex justify-between items-center">
                <span className="text-xs text-k-text-b font-bold uppercase">Multiplicador</span>
                <span className="text-sm font-black text-k-text-h bg-k-bg-page px-3 py-1 rounded-lg">{t.multiplicador}x</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-k-bg-card border border-k-border rounded-3xl p-6 shadow-k-card text-center py-12">
          <Calendar className="h-12 w-12 mx-auto text-k-text-b opacity-20 mb-4" />
          <h2 className="text-lg font-bold text-k-text-h">Sin Temporadas</h2>
          <p className="text-sm text-k-text-b max-w-md mx-auto mt-2">
            Aquí podrás definir periodos del año donde la demanda cambia para ajustar las recomendaciones de la calculadora automáticamente.
          </p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-k-bg-card rounded-3xl w-full max-w-md shadow-2xl p-6">
            <h2 className="text-xl font-bold text-k-text-h mb-4">Nueva Temporada</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-k-text-b uppercase tracking-wider mb-2">Nombre de Temporada</label>
                <input 
                  type="text" 
                  value={formData.nombre} 
                  onChange={e => setFormData({...formData, nombre: e.target.value})}
                  className="w-full h-11 px-4 bg-k-bg-page border border-k-border rounded-xl text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
                  placeholder="Ej. Temporada Alta"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-k-text-b uppercase tracking-wider mb-2">Mes Inicio</label>
                  <select
                    value={formData.mes_inicio}
                    onChange={e => setFormData({...formData, mes_inicio: parseInt(e.target.value)})}
                    className="w-full h-11 px-4 bg-k-bg-page border border-k-border rounded-xl text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
                  >
                    {monthNames.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-k-text-b uppercase tracking-wider mb-2">Mes Fin</label>
                  <select
                    value={formData.mes_fin}
                    onChange={e => setFormData({...formData, mes_fin: parseInt(e.target.value)})}
                    className="w-full h-11 px-4 bg-k-bg-page border border-k-border rounded-xl text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
                  >
                    {monthNames.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-k-text-b uppercase tracking-wider mb-2">Multiplicador (Demanda)</label>
                <input 
                  type="number" 
                  step="0.1"
                  min="0.1"
                  value={formData.multiplicador} 
                  onChange={e => setFormData({...formData, multiplicador: parseFloat(e.target.value)})}
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
