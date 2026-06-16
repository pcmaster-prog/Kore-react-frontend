import { useState } from "react";
import { Combine, Layers, Plus, CheckCircle, Trash2 } from "lucide-react";
import { useEnsambles, useCreateEnsamble, useUpdateEnsamble } from "../hooks/useEnsamblaje";
import { useProductos, useBastones } from "../hooks/useCatalogo";
import type { MaderasEnsamble, MaderasEnsamblePieza } from "../types";

export default function EnsamblajeMaderasPage() {
  const { data: ensamblajes = [], isLoading } = useEnsambles();
  const { mutateAsync: createEnsamble } = useCreateEnsamble();
  const { mutateAsync: updateEnsamble } = useUpdateEnsamble();

  const { data: productos = [] } = useProductos();
  const { data: bastones = [] } = useBastones();

  const [showModal, setShowModal] = useState(false);
  const [targetProduct, setTargetProduct] = useState("");
  const [qtyGenerated, setQtyGenerated] = useState("");
  const [piecesUsed, setPiecesUsed] = useState<Array<{ catalogo_id: string; cantidad_usada: string }>>([
    { catalogo_id: "", cantidad_usada: "" }
  ]);

  const [errorMsg, setErrorMsg] = useState("");

  const ensamblesCompletados = ensamblajes
    .filter((e: MaderasEnsamble) => e.status === "listo")
    .reduce((acc: number, e: MaderasEnsamble) => acc + e.cantidad_generada, 0);

  const handleAddPieceRow = () => {
    setPiecesUsed([...piecesUsed, { catalogo_id: "", cantidad_usada: "" }]);
  };

  const handleRemovePieceRow = (index: number) => {
    const updated = piecesUsed.filter((_, i) => i !== index);
    setPiecesUsed(updated);
  };

  const handlePieceChange = (index: number, field: string, value: string) => {
    const updated = [...piecesUsed];
    updated[index] = { ...updated[index], [field]: value };
    setPiecesUsed(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!targetProduct) {
      setErrorMsg("Selecciona el producto terminado.");
      return;
    }
    if (!qtyGenerated || parseInt(qtyGenerated) <= 0) {
      setErrorMsg("La cantidad generada debe ser mayor a 0.");
      return;
    }

    const validatedPieces = piecesUsed.filter(p => p.catalogo_id && parseInt(p.cantidad_usada) > 0);
    if (validatedPieces.length === 0) {
      setErrorMsg("Debes agregar al menos una pieza/material usado con cantidad válida.");
      return;
    }

    try {
      await createEnsamble({
        catalogo_id: parseInt(targetProduct),
        cantidad_generada: parseInt(qtyGenerated),
        piezas: validatedPieces.map(p => ({
          catalogo_id: parseInt(p.catalogo_id),
          cantidad_usada: parseInt(p.cantidad_usada)
        }))
      });

      setShowModal(false);
      setTargetProduct("");
      setQtyGenerated("");
      setPiecesUsed([{ catalogo_id: "", cantidad_usada: "" }]);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error ?? "No se pudo registrar el ensamblaje.");
    }
  };

  const handleMarkAsReady = async (id: number) => {
    try {
      await updateEnsamble({
        id,
        data: { status: "listo" }
      });
    } catch (err: any) {
      alert(err?.response?.data?.error ?? "Error al actualizar estado.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-k-text-h tracking-tight">Ensamblaje</h1>
          <p className="text-k-text-b text-sm mt-1">
            Agrupación de piezas para formar un producto final.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="h-10 px-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-sm transition-colors shadow-k-button flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nuevo Ensamblaje
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-k-bg-card border border-k-border rounded-3xl p-6 shadow-k-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-k-text-h">Resumen de Ensambles</h3>
                <p className="text-xs text-k-text-b">Historial</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-xs font-semibold text-k-text-b uppercase">Completados</span>
                <span className="text-2xl font-black text-k-text-h">{ensamblesCompletados}</span>
              </div>
              <div className="w-full bg-k-bg-card2 rounded-full h-2">
                <div className="bg-violet-500 h-2 rounded-full w-full"></div>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-violet-500 to-indigo-600 rounded-3xl p-6 shadow-k-card text-white">
            <h3 className="font-bold mb-2">¿Sabías que?</h3>
            <p className="text-sm text-violet-100 opacity-90 leading-relaxed">
              Registrar el ensamblaje descuenta automáticamente el inventario de las piezas sueltas y aumenta el del producto final al marcarlo como listo.
            </p>
          </div>
        </div>

        <div className="lg:col-span-2 bg-k-bg-card border border-k-border rounded-3xl p-6 shadow-k-card">
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
                      <div className="text-xs text-k-text-b mt-1">
                        <span className="font-semibold block mb-1">Materiales Consumidos:</span>
                        <div className="flex flex-wrap gap-1.5 mt-0.5">
                          {item.piezas?.map((p: MaderasEnsamblePieza) => (
                            <span key={p.id} className="px-2 py-0.5 bg-k-bg-page border border-k-border text-[10.5px] rounded-lg font-medium text-k-text-h">
                              {p.cantidad_usada}x {p.catalogo?.nombre}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 justify-between sm:justify-end">
                    <div className="text-left sm:text-right">
                      <div className="text-xl font-black text-k-text-h">{item.cantidad_generada} <span className="text-xs font-medium text-k-text-b">uds</span></div>
                      <div className="text-xs text-k-text-b mt-0.5">{new Date(item.created_at).toLocaleDateString()}</div>
                    </div>
                    {item.status === 'en_proceso' && (
                      <button
                        onClick={() => handleMarkAsReady(item.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow transition-colors"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        Listo
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-k-bg-card border border-k-border rounded-3xl w-full max-w-lg shadow-2xl p-6 overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-bold text-k-text-h mb-4">Registrar Nuevo Ensamblaje</h2>
            
            {errorMsg && (
              <div className="p-3 mb-4 text-xs font-semibold text-rose-600 bg-rose-50 rounded-xl border border-rose-100">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-k-text-b uppercase tracking-wider mb-2">Producto Final Producido</label>
                  <select
                    value={targetProduct}
                    onChange={(e) => setTargetProduct(e.target.value)}
                    className="w-full h-11 px-4 bg-k-bg-page border border-k-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-k-primary text-k-text-h"
                  >
                    <option value="">Seleccionar producto...</option>
                    {productos.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-k-text-b uppercase tracking-wider mb-2">Cantidad de Productos Finales</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Ej. 100"
                    value={qtyGenerated}
                    onChange={(e) => setQtyGenerated(e.target.value)}
                    className="w-full h-11 px-4 bg-k-bg-page border border-k-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-k-primary text-k-text-h"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-k-text-b uppercase tracking-wider">Materiales / Piezas Usados</label>
                  <button
                    type="button"
                    onClick={handleAddPieceRow}
                    className="text-xs font-bold text-violet-600 hover:text-violet-700"
                  >
                    + Agregar Fila
                  </button>
                </div>
                
                <div className="space-y-3">
                  {piecesUsed.map((row, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <select
                        value={row.catalogo_id}
                        onChange={(e) => handlePieceChange(index, "catalogo_id", e.target.value)}
                        className="flex-1 h-10 px-3 bg-k-bg-page border border-k-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-k-primary text-k-text-h"
                      >
                        <option value="">Seleccionar materia prima...</option>
                        {bastones.map(b => (
                          <option key={b.id} value={b.id}>{b.nombre}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        placeholder="Cant."
                        value={row.cantidad_usada}
                        onChange={(e) => handlePieceChange(index, "cantidad_usada", e.target.value)}
                        className="w-24 h-10 px-3 bg-k-bg-page border border-k-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-k-primary text-k-text-h"
                      />
                      {piecesUsed.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePieceRow(index)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="h-10 px-4 border border-k-border rounded-xl font-bold text-sm text-k-text-b hover:bg-k-bg-page transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-10 px-4 bg-violet-600 text-white rounded-xl font-bold text-sm hover:bg-violet-700 transition-colors shadow"
                >
                  Iniciar Ensamblaje
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
