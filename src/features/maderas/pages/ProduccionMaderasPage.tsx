import { useState } from "react";
import { Clock, User, Hammer, Trash2 } from "lucide-react";
import { useProduccion, useCreateProduccion, useAnularProduccion } from "../hooks/useProduccion";
import { useEmployees } from "@/features/tasks/hooks/useEmployees";
import { useProductos, useBastones } from "../hooks/useCatalogo";
import type { MaderasProduccion } from "../types";

export default function ProduccionMaderasPage() {
  const { data: produccion = [], isLoading } = useProduccion();
  const { mutateAsync: createProduccion } = useCreateProduccion();
  const { mutateAsync: anular } = useAnularProduccion();

  const { data: employees = [], isLoading: loadingEmployees } = useEmployees();
  const { data: productos = [], isLoading: loadingProd } = useProductos();
  const { data: bastones = [], isLoading: loadingBast } = useBastones();

  const [formData, setFormData] = useState({
    empleado_id: "",
    catalogo_id: "",
    maquina: "Torno 1",
    cantidad: "",
  });

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!formData.empleado_id) {
      setErrorMsg("Debes seleccionar un operario.");
      return;
    }
    if (!formData.catalogo_id) {
      setErrorMsg("Debes seleccionar un producto o material.");
      return;
    }
    if (!formData.cantidad || parseInt(formData.cantidad) <= 0) {
      setErrorMsg("La cantidad debe ser mayor a 0.");
      return;
    }

    try {
      await createProduccion({
        empleado_id: formData.empleado_id,
        catalogo_id: parseInt(formData.catalogo_id),
        maquina: formData.maquina,
        cantidad: parseInt(formData.cantidad),
      });

      setSuccessMsg("Producción registrada correctamente.");
      setFormData({
        empleado_id: "",
        catalogo_id: "",
        maquina: "Torno 1",
        cantidad: "",
      });

      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error ?? "No se pudo registrar la producción.");
    }
  };

  const handleAnular = async (id: number) => {
    if (!window.confirm("¿Estás seguro de que deseas anular este registro de producción? Se descontará del inventario.")) {
      return;
    }
    try {
      await anular(id);
    } catch (err: any) {
      alert(err?.response?.data?.error ?? "No se pudo anular la producción.");
    }
  };

  // Combine products and materials for selection
  const catalogItems = [...productos, ...bastones];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-k-text-h tracking-tight">Registro de Producción</h1>
          <p className="text-k-text-b text-sm mt-1">
            Control de las piezas trabajadas por operario y máquina.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-k-bg-card to-k-bg-card2 border border-k-border rounded-3xl p-6 shadow-k-card h-fit">
          <h3 className="text-sm font-bold text-k-text-b uppercase tracking-widest mb-4">Registro Rápido</h3>
          
          {errorMsg && (
            <div className="p-3 mb-4 text-xs font-semibold text-rose-600 bg-rose-50 rounded-xl border border-rose-100">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="p-3 mb-4 text-xs font-semibold text-emerald-600 bg-emerald-50 rounded-xl border border-emerald-100">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-k-text-b uppercase tracking-wider mb-2">Operario / Empleado</label>
              <select
                value={formData.empleado_id}
                onChange={(e) => setFormData({ ...formData, empleado_id: e.target.value })}
                className="w-full h-11 px-4 bg-k-bg-page border border-k-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-k-primary text-k-text-h"
                disabled={loadingEmployees}
              >
                <option value="">Seleccionar operario...</option>
                {employees.map((emp: any) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name ?? emp.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-k-text-b uppercase tracking-wider mb-2">Producto o Material Generado</label>
              <select
                value={formData.catalogo_id}
                onChange={(e) => setFormData({ ...formData, catalogo_id: e.target.value })}
                className="w-full h-11 px-4 bg-k-bg-page border border-k-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-k-primary text-k-text-h"
                disabled={loadingProd || loadingBast}
              >
                <option value="">Seleccionar artículo...</option>
                {catalogItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    [{item.tipo === "producto_terminado" ? "PROD" : "MAT"}] {item.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-k-text-b uppercase tracking-wider mb-2">Máquina</label>
                <select
                  value={formData.maquina}
                  onChange={(e) => setFormData({ ...formData, maquina: e.target.value })}
                  className="w-full h-11 px-4 bg-k-bg-page border border-k-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-k-primary text-k-text-h"
                >
                  <option value="Torno 1">Torno 1</option>
                  <option value="Torno 2">Torno 2</option>
                  <option value="Sierra 1">Sierra 1</option>
                  <option value="Sierra 2">Sierra 2</option>
                  <option value="Manual / Banco">Manual / Banco</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-k-text-b uppercase tracking-wider mb-2">Cantidad</label>
                <input
                  type="number"
                  placeholder="Ej. 150"
                  min="1"
                  value={formData.cantidad}
                  onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                  className="w-full h-11 px-4 bg-k-bg-page border border-k-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-k-primary text-k-text-h"
                />
              </div>
            </div>
            
            <button
              type="submit"
              className="w-full h-11 bg-k-text-h text-white rounded-xl font-bold text-sm hover:bg-black transition-colors shadow-lg"
            >
              Guardar Registro
            </button>
          </form>
        </div>

        <div className="bg-k-bg-card border border-k-border rounded-3xl p-6 shadow-k-card flex flex-col lg:col-span-2 h-[500px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-k-text-b uppercase tracking-widest">Historial de Producción</h3>
            <Hammer className="h-4 w-4 text-k-text-b" />
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2" style={{ scrollbarWidth: 'thin' }}>
            {isLoading ? (
              <div className="text-center text-k-text-b py-8">Cargando producción...</div>
            ) : produccion.length === 0 ? (
              <div className="text-center text-k-text-b py-8">Aún no hay registros de producción.</div>
            ) : (
              produccion.map((item: MaderasProduccion) => (
                <div key={item.id} className="p-4 rounded-2xl bg-k-bg-card2 border border-k-border flex items-center justify-between hover:border-k-primary/30 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                      {(item.empleado?.full_name ?? "U").charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-k-text-h">{item.empleado?.full_name ?? "Usuario"}</h4>
                      <div className="flex items-center gap-2 text-xs text-k-text-b mt-0.5">
                        <span className="flex items-center gap-1"><User className="h-3 w-3" /> {item.maquina || "S/M"}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(item.fecha_registro).toLocaleDateString("es-MX")} {new Date(item.fecha_registro).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-lg font-black text-k-primary">+{item.cantidad}</div>
                      <div className="text-xs text-k-text-b font-medium">{item.catalogo?.nombre}</div>
                    </div>
                    <button
                      onClick={() => handleAnular(item.id)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Anular registro"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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
