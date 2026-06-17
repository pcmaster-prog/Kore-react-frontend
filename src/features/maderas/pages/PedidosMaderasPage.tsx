import { useState, useMemo } from "react";
import { Clock, CheckCircle, FileText, Plus, Trash2, Save, X, Eye } from "lucide-react";
import { usePedidos, useCreatePedido, useUpdatePedido, useCalcularPedido, useDeletePedido } from "../hooks/usePedido";
import { useTemporadas } from "../hooks/useTemporada";
import type { MaderasPedido, PedidoItem } from "../types";
import { cx } from "@/lib/utils";
import api from "@/lib/http";

const CATEGORIAS = [
  "Recorte Rectangular",
  "Recorte Circular",
  "Recorte Cuadrado",
  "Tablas en Tiras",
  "Otros Productos",
];

export default function PedidosMaderasPage() {
  const { data: pedidos = [], isLoading } = usePedidos();
  const { mutateAsync: createPedido, isPending: creating } = useCreatePedido();
  const { mutateAsync: updatePedido } = useUpdatePedido();
  const { mutateAsync: deletePedido } = useDeletePedido();

  // State for form
  const [showModal, setShowModal] = useState(false);
  const [clientName, setClientName] = useState("");
  const [orderCode, setOrderCode] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [items, setItems] = useState<PedidoItem[]>([]);

  // State for auto vs manual
  const [orderMode, setOrderMode] = useState<"auto" | "manual">("auto");
  const [selectedTemporada, setSelectedTemporada] = useState<string>("");
  const [isCalculated, setIsCalculated] = useState(false);

  const { data: temporadas = [] } = useTemporadas();
  const { mutateAsync: calcularPedido, isPending: calculating } = useCalcularPedido();

  // State for view modal
  const [viewPedido, setViewPedido] = useState<MaderasPedido | null>(null);

  const addItem = (categoria: string) => {
    setItems([
      ...items,
      {
        categoria,
        cantidad: 1,
        descripcion: "",
        precio_unitario: 0,
        total: 0,
        piezas_calculadas: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof PedidoItem, value: any) => {
    const newItems = [...items];
    const item = newItems[index];
    
    // @ts-ignore
    item[field] = value;
    
    if (field === "cantidad" || field === "precio_unitario") {
      item.total = Number(item.cantidad) * Number(item.precio_unitario);
    }
    
    setItems(newItems);
  };

  const totalGeneral = useMemo(() => items.reduce((acc, item) => acc + (item.total || 0), 0), [items]);

  const openNewOrderModal = () => {
    setClientName("");
    setOrderCode("PED-" + Math.floor(1000 + Math.random() * 9000));
    setDeliveryDate("");
    setOrderMode("auto");
    setSelectedTemporada("");
    setIsCalculated(false);
    setItems([]);
    setShowModal(true);
  };

  const handleCalculate = async () => {
    if (!selectedTemporada) {
      alert("Selecciona una temporada primero.");
      return;
    }
    
    try {
      const res = await calcularPedido(Number(selectedTemporada));
      const data = res.data;
      
      const newItems: PedidoItem[] = [];
      
      // Mapear resultados a items del pedido
      if (data.servicios_corte) {
        data.servicios_corte.forEach((i: any) => {
          let cat = "Otros Productos";
          if (i.nombre.toLowerCase().includes("rectangular")) cat = "Recorte Rectangular";
          if (i.nombre.toLowerCase().includes("circul")) cat = "Recorte Circular";
          if (i.nombre.toLowerCase().includes("cuadra")) cat = "Recorte Cuadrado";
          
          newItems.push({
            categoria: cat,
            cantidad: i.cantidad,
            descripcion: i.nombre,
            precio_unitario: i.precio_unitario,
            total: i.subtotal,
          });
        });
      }

      if (data.tablas_pino) {
        data.tablas_pino.forEach((i: any) => {
          newItems.push({
            categoria: "Tablas en Tiras",
            cantidad: i.cantidad,
            descripcion: i.nombre,
            precio_unitario: i.precio_unitario,
            total: i.subtotal,
          });
        });
      }

      if (data.hojas_mdf) {
        data.hojas_mdf.forEach((i: any) => {
          newItems.push({
            categoria: "Otros Productos", // Generalmente MDF
            cantidad: i.cantidad,
            descripcion: i.nombre,
            precio_unitario: i.precio_unitario,
            total: i.subtotal,
            piezas_calculadas: i.cantidad,
          });
        });
      }

      if (data.consumibles) {
        data.consumibles.forEach((i: any) => {
          newItems.push({
            categoria: "Otros Productos",
            cantidad: i.cantidad,
            descripcion: i.nombre,
            precio_unitario: i.precio_unitario,
            total: i.subtotal,
          });
        });
      }

      setItems(newItems);
      setIsCalculated(true);
    } catch (err: any) {
      alert(err?.response?.data?.message ?? "Error al calcular el pedido.");
    }
  };

  const handleCreateOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderCode || (orderMode === 'manual' && items.length === 0)) {
      alert("Completa el código y agrega al menos un producto.");
      return;
    }

    try {
      await createPedido({
        codigo: orderCode,
        cliente: "Interno", // Legacy check
        total: totalGeneral,
        fecha_pedido: new Date().toISOString().split('T')[0],
        fecha_entrega: deliveryDate || undefined,
        temporada_id: orderMode === 'auto' ? Number(selectedTemporada) : undefined,
        items: orderMode === 'manual' ? items : [],
      } as any);
      setShowModal(false);
    } catch (err: any) {
      alert(err?.response?.data?.message ?? "Error al registrar el pedido.");
    }
  };

  const handleMarkAsDelivered = async (id: number) => {
    try {
      await updatePedido({
        id,
        data: { status: "recibido" }
      });
    } catch (err: any) {
      alert(err?.response?.data?.message ?? "Error al actualizar pedido.");
    }
  };

  const handleDeleteOrder = async (id: number) => {
    if (!window.confirm("¿Seguro que deseas eliminar este pedido?")) return;
    try {
      await deletePedido(id);
    } catch (err: any) {
      alert("Error al eliminar pedido.");
    }
  };

  const handleLoadExcel = () => {
    setOrderMode("manual");
    setItems([
      { categoria: 'Recorte Rectangular', cantidad: 7, descripcion: 'HOJA MDF BLANCA 4.5MM 40 x 60', precio_unitario: 180, total: 1260, piezas_calculadas: 84 },
      { categoria: 'Recorte Rectangular', cantidad: 4, descripcion: 'HOJA MDF BLANCA 4.5MM 40 x 50', precio_unitario: 180, total: 720, piezas_calculadas: 48 },
      { categoria: 'Recorte Rectangular', cantidad: 12, descripcion: 'HOJA MDF BLANCA 4.5MM 50 x 70', precio_unitario: 180, total: 2160, piezas_calculadas: 72 },
      { categoria: 'Recorte Rectangular', cantidad: 23, descripcion: 'RECORTES RECTANGULA / CUADRADO X HOJA', precio_unitario: 30, total: 690 },
      { categoria: 'Recorte Circular', cantidad: 2, descripcion: 'HOJA MDF BLANCA 4.5MM 30 cm', precio_unitario: 210, total: 420, piezas_calculadas: 64 },
      { categoria: 'Recorte Circular', cantidad: 10, descripcion: 'HOJA MDF BLANCA 4.5MM 45 cm', precio_unitario: 210, total: 2100, piezas_calculadas: 100 },
      { categoria: 'Recorte Circular', cantidad: 12, descripcion: 'RECORTES DE HOJAS EN CIRCULOS', precio_unitario: 80, total: 960 },
      { categoria: 'Recorte Cuadrado', cantidad: 5, descripcion: 'RECORTES RECTANGULA / CUADRADO X HOJA', precio_unitario: 30, total: 150 },
      { categoria: 'Tablas en Tiras', cantidad: 7, descripcion: 'TABLAS RECORTADAS EN TIRAS', precio_unitario: 260, total: 1820 },
      { categoria: 'Otros Productos', cantidad: 2, descripcion: 'PAQUETES GRAPAS DE 3/8', precio_unitario: 26, total: 52, piezas_calculadas: 2 },
      { categoria: 'Otros Productos', cantidad: 1, descripcion: 'GALONES RESISTOL', precio_unitario: 368, total: 368, piezas_calculadas: 1 },
      { categoria: 'Otros Productos', cantidad: 2, descripcion: 'HOJAS DE 3MM', precio_unitario: 0, total: 0, piezas_calculadas: 0 },
    ]);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-k-text-h tracking-tight">Pedidos (Formato Cotización)</h1>
          <p className="text-k-text-b text-sm mt-1">
            Genera y administra pedidos desglosados como en tu Excel.
          </p>
        </div>
        <button
          onClick={openNewOrderModal}
          className="h-10 px-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-violet-500/20 flex items-center gap-2 hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" />
          Nueva Cotización
        </button>
      </div>

      <div className="bg-k-bg-card border border-k-border rounded-3xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-k-text-b uppercase tracking-widest mb-4">Historial de Cotizaciones</h3>
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center text-k-text-b py-8 animate-pulse">Cargando pedidos...</div>
          ) : pedidos.length === 0 ? (
            <div className="text-center text-k-text-b py-12 flex flex-col items-center border border-dashed border-k-border rounded-2xl">
              <FileText className="h-10 w-10 text-k-text-b/40 mb-3" />
              <p>Aún no hay pedidos registrados.</p>
            </div>
          ) : (
            pedidos.map((pedido: MaderasPedido) => (
              <div key={pedido.id} className="p-4 rounded-2xl bg-k-bg-card2 border border-k-border flex items-center justify-between hover:border-violet-500/30 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center border ${pedido.status === 'recibido' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                    {pedido.status === 'recibido' ? <CheckCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-k-text-h text-sm">{pedido.codigo}</h4>
                    <div className="text-xs text-k-text-b flex gap-3 mt-1">
                      <span>Entrega: {pedido.fecha_entrega ? pedido.fecha_entrega.substring(0, 10) : "Sin fecha"}</span>
                      <span>•</span>
                      <span>{pedido.created_at ? pedido.created_at.substring(0, 10) : "N/A"}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-black text-k-text-h text-lg">${Number(pedido.total || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
                    <span className={cx(
                      "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full inline-block mt-1",
                      pedido.status === 'recibido' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    )}>{pedido.status}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        try {
                          const res = await api.get(`/maderas/pedidos/${pedido.id}/pdf`, { responseType: 'blob' });
                          const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
                          window.open(url, '_blank');
                        } catch (err) {
                          alert("Error al descargar el PDF");
                        }
                      }}
                      className="h-9 w-9 flex items-center justify-center bg-white border border-k-border hover:border-violet-300 hover:text-violet-600 rounded-xl transition-all shadow-sm"
                      title="Descargar PDF"
                    >
                      <FileText className="h-4 w-4" />
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const res = await api.get(`/maderas/pedidos/${pedido.id}`);
                          setViewPedido(res.data);
                        } catch (err) {
                          alert("Error al cargar detalles del pedido");
                        }
                      }}
                      className="h-9 w-9 flex items-center justify-center bg-white border border-k-border hover:border-violet-300 hover:text-violet-600 rounded-xl transition-all shadow-sm"
                      title="Ver detalle"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteOrder(pedido.id)}
                      className="h-9 w-9 flex items-center justify-center bg-white border border-k-border hover:border-red-300 hover:text-red-600 rounded-xl transition-all shadow-sm"
                      title="Eliminar Pedido"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    {pedido.status === "pendiente" && (
                      <button
                        onClick={() => handleMarkAsDelivered(pedido.id)}
                        className="h-9 w-9 flex items-center justify-center bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-600 rounded-xl transition-all shadow-sm"
                        title="Marcar como entregado"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-k-bg-card border border-k-border rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-k-border flex items-center justify-between bg-k-bg-card2/50 shrink-0">
              <div className="mb-8 relative">
                <h2 className="text-xl font-black text-k-text-h tracking-tight">DecorArte</h2>
                <p className="text-xs text-k-text-b font-medium mt-0.5">CALLE COLON 270 A ZONA CENTRO 4626269090</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 text-k-text-b hover:bg-white rounded-xl transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateOrderSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-k-bg-card2 p-5 rounded-2xl border border-k-border">
                <div>
                  <label className="block text-[10px] font-bold text-k-text-b uppercase tracking-wider mb-1.5">Código Pedido</label>
                  <input
                    type="text"
                    value={orderCode}
                    onChange={(e) => setOrderCode(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-k-border rounded-xl text-sm font-bold focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-k-text-b uppercase tracking-wider mb-1.5">Solicitó (Cliente)</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-k-border rounded-xl text-sm font-bold focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-k-text-b uppercase tracking-wider mb-1.5">Fecha Entrega</label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-k-border rounded-xl text-sm font-bold focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 mb-6">
                <button
                  type="button"
                  onClick={() => { setOrderMode("auto"); setIsCalculated(false); setItems([]); }}
                  className={cx(
                    "flex-1 h-12 flex items-center justify-center gap-2 font-bold text-sm border-b-2 transition-colors",
                    orderMode === "auto" ? "border-violet-600 text-violet-600" : "border-transparent text-k-text-b hover:text-k-text-h"
                  )}
                >
                  <CheckCircle className="h-4 w-4" /> Generar Automático
                </button>
                <button
                  type="button"
                  onClick={() => { 
                    setOrderMode("manual"); 
                    setIsCalculated(true);
                    if (items.length === 0) {
                      setItems([{ categoria: "Recorte Rectangular", cantidad: 1, descripcion: "HOJA MDF BLANCA 4,5MM", precio_unitario: 180, total: 180, piezas_calculadas: 0 }]);
                    }
                  }}
                  className={cx(
                    "flex-1 h-12 flex items-center justify-center gap-2 font-bold text-sm border-b-2 transition-colors",
                    orderMode === "manual" ? "border-violet-600 text-violet-600" : "border-transparent text-k-text-b hover:text-k-text-h"
                  )}
                >
                  <Plus className="h-4 w-4" /> Crear Manualmente
                </button>
                <button
                  type="button"
                  onClick={handleLoadExcel}
                  className="flex-1 h-12 flex items-center justify-center gap-2 font-bold text-sm border-b-2 border-transparent text-k-text-b hover:text-blue-600 transition-colors"
                >
                  <FileText className="h-4 w-4" /> Cargar Excel Default
                </button>
              </div>

              {orderMode === "auto" && !isCalculated ? (
                <div className="bg-k-bg-card2 border border-k-border rounded-2xl p-8 text-center max-w-md mx-auto mb-8">
                  <div className="mb-6">
                    <label className="block text-sm font-bold text-k-text-b mb-2">Selecciona Temporada:</label>
                    <select
                      value={selectedTemporada}
                      onChange={(e) => setSelectedTemporada(e.target.value)}
                      className="w-full h-11 px-3 bg-white border border-k-border rounded-xl text-sm font-bold focus:border-violet-500 outline-none"
                    >
                      <option value="">-- Elige una temporada --</option>
                      {temporadas.map((t: any) => (
                        <option key={t.id} value={t.id}>{t.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={handleCalculate}
                    disabled={calculating || !selectedTemporada}
                    className="w-full h-11 bg-violet-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-violet-700 transition-all disabled:opacity-50"
                  >
                    {calculating ? "Cargando..." : "CALCULAR AUTOMÁTICO"}
                  </button>
                </div>
              ) : (
              <div className="space-y-8">
                {CATEGORIAS.map(cat => {
                  const itemsCat = items.filter(i => i.categoria === cat);
                  
                  return (
                    <div key={cat} className="space-y-3">
                      <div className="flex items-center justify-between border-b-2 border-k-text-h pb-2">
                        <h3 className="font-black text-k-text-h uppercase tracking-wider text-sm">{cat}</h3>
                        <button
                          type="button"
                          onClick={() => addItem(cat)}
                          className="text-xs font-bold text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 px-3 py-1 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Plus className="h-3 w-3" /> Agregar fila
                        </button>
                      </div>

                      {itemsCat.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-k-bg-card2 text-k-text-h text-[10px] font-bold uppercase tracking-wider border-b border-k-border">
                              <tr>
                                <th className="px-3 py-2 w-20">Cant</th>
                                <th className="px-3 py-2">Descripción</th>
                                <th className="px-3 py-2 w-32">P/U ($)</th>
                                <th className="px-3 py-2 w-32">Total ($)</th>
                                <th className="px-3 py-2 w-24">Piezas</th>
                                <th className="px-3 py-2 w-10"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-k-border">
                              {items.map((item, idx) => {
                                if (item.categoria !== cat) return null;
                                return (
                                  <tr key={idx} className="group hover:bg-k-bg-card2/30">
                                    <td className="px-2 py-2">
                                      <input 
                                        type="number" min="1" step="0.01" required
                                        value={item.cantidad || ''} 
                                        onChange={e => updateItem(idx, 'cantidad', parseFloat(e.target.value))}
                                        className="w-full h-8 px-2 border border-transparent focus:border-violet-300 hover:border-k-border rounded bg-transparent focus:bg-white transition-all outline-none text-center font-bold"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input 
                                        type="text" required placeholder="Ej. HOJA MDF BLANCA 40x60"
                                        value={item.descripcion} 
                                        onChange={e => updateItem(idx, 'descripcion', e.target.value)}
                                        className="w-full h-8 px-2 border border-transparent focus:border-violet-300 hover:border-k-border rounded bg-transparent focus:bg-white transition-all outline-none"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input 
                                        type="number" min="0" step="0.01" required
                                        value={item.precio_unitario || ''} 
                                        onChange={e => updateItem(idx, 'precio_unitario', parseFloat(e.target.value))}
                                        className="w-full h-8 px-2 border border-transparent focus:border-violet-300 hover:border-k-border rounded bg-transparent focus:bg-white transition-all outline-none text-right"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <div className="w-full h-8 flex items-center justify-end px-2 font-black text-k-text-h bg-k-bg-card2 rounded">
                                        ${(item.total || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                      </div>
                                    </td>
                                    <td className="px-2 py-2">
                                      <input 
                                        type="number" min="0"
                                        value={item.piezas_calculadas || ''} 
                                        onChange={e => updateItem(idx, 'piezas_calculadas', parseInt(e.target.value))}
                                        className="w-full h-8 px-2 border border-transparent focus:border-violet-300 hover:border-k-border rounded bg-transparent focus:bg-white transition-all outline-none text-center"
                                        placeholder="Opcional"
                                      />
                                    </td>
                                    <td className="px-2 py-2 text-right">
                                      <button 
                                        type="button"
                                        onClick={() => removeItem(idx)}
                                        className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-xs text-k-text-b italic py-2 px-3 border border-dashed border-k-border rounded-xl">
                          Sin productos en esta categoría.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              )}

              <div className="flex justify-end pt-6 border-t-2 border-k-text-h">
                <div className="w-full max-w-sm">
                  <div className="flex justify-between items-center py-3 px-4 bg-k-bg-card2 rounded-2xl border border-k-border">
                    <span className="font-bold text-k-text-b uppercase tracking-widest text-sm">Total General</span>
                    <span className="font-black text-3xl text-k-text-h">${totalGeneral.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                </div>
              </div>

            </form>
            <div className="p-5 border-t border-k-border bg-white flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="h-11 px-6 border border-k-border rounded-xl font-bold text-sm text-k-text-b hover:bg-k-bg-page transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateOrderSubmit}
                disabled={creating}
                className="h-11 px-8 bg-violet-600 text-white rounded-xl font-bold text-sm hover:bg-violet-700 hover:-translate-y-0.5 transition-all shadow-md shadow-violet-500/20 disabled:opacity-50 disabled:hover:translate-y-0 flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {creating ? "Guardando..." : "Guardar Cotización"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {viewPedido && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-k-bg-card border border-k-border rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-k-border flex items-center justify-between bg-k-bg-card2/50 shrink-0">
              <div>
                <h2 className="text-xl font-black text-k-text-h tracking-tight">PEDIDO #{viewPedido.codigo}</h2>
                <p className="text-xs text-k-text-b font-medium mt-0.5">Detalle de Cotización / Pedido</p>
              </div>
              <button onClick={() => setViewPedido(null)} className="p-2 text-k-text-b hover:bg-white rounded-xl transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-k-text-b uppercase tracking-wider">Creado El</div>
                  <div className="font-black text-lg text-k-text-h">{viewPedido.created_at ? viewPedido.created_at.substring(0, 10) : 'N/A'}</div>
                </div>
                <div className="space-y-1 text-right">
                  <div className="text-xs font-bold text-k-text-b uppercase tracking-wider">Fecha / Entrega</div>
                  <div className="font-bold text-sm text-k-text-h">
                    {viewPedido.created_at ? viewPedido.created_at.substring(0, 10) : 'N/A'} / {viewPedido.fecha_entrega ? viewPedido.fecha_entrega.substring(0, 10) : "TBD"}
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                {[
                  { id: 'hojas_mdf', label: 'Hojas y Tableros (MDF / Triplay)' },
                  { id: 'tablas_pino', label: 'Tablas de Pino' },
                  { id: 'consumibles', label: 'Consumibles' },
                  { id: 'servicios_corte', label: 'Servicios de Corte' },
                ].map(sec => {
                  const itemsCat = (viewPedido.detalles || []).filter((i: any) => i.seccion_pdf === sec.id);
                  if (itemsCat.length === 0) return null;
                  
                  return (
                    <div key={sec.id} className="space-y-2">
                      <h3 className="font-black text-k-text-h uppercase tracking-wider text-sm border-b-2 border-k-text-h pb-2">{sec.label}</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                          <thead className="text-k-text-b text-[10px] font-bold uppercase tracking-wider border-b border-k-border">
                            <tr>
                              <th className="py-2 w-20">Cant</th>
                              <th className="py-2">Descripción</th>
                              <th className="py-2 w-32 text-right">P/U</th>
                              <th className="py-2 w-32 text-right">Total</th>
                              <th className="py-2 w-24 text-center">Piezas</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-k-border/50">
                            {itemsCat.map((item: any, idx: number) => (
                              <tr key={idx} className="hover:bg-k-bg-card2/30">
                                <td className="py-2 font-bold">{item.cantidad}</td>
                                <td className="py-2">{item.nombre_item}</td>
                                <td className="py-2 text-right">${Number(item.precio_unitario).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                                <td className="py-2 text-right font-black text-k-text-h">${Number(item.subtotal).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                                <td className="py-2 text-center text-k-text-b">{'-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end pt-6">
                <div className="w-full max-w-sm">
                  <div className="flex justify-between items-center py-3 px-4 bg-k-bg-card2 rounded-2xl border border-k-border">
                    <span className="font-bold text-k-text-b uppercase tracking-widest text-sm">Total General</span>
                    <span className="font-black text-3xl text-k-text-h">${Number(viewPedido.total || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
