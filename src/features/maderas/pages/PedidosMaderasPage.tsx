import { useState } from "react";
import { Clock, CheckCircle, Calculator, FileText, Plus, Check } from "lucide-react";
import { usePedidos, useCreatePedido, useUpdatePedido } from "../hooks/usePedido";
import { useProductos } from "../hooks/useCatalogo";
import { useTemporadaActiva } from "../hooks/useTemporada";
import type { MaderasPedido } from "../types";

export default function PedidosMaderasPage() {
  const { data: pedidos = [], isLoading } = usePedidos();
  const { mutateAsync: createPedido } = useCreatePedido();
  const { mutateAsync: updatePedido } = useUpdatePedido();

  const { data: productos = [], isLoading: loadingProd } = useProductos();
  const { data: temporadaActiva } = useTemporadaActiva();

  // Calculator State
  const [calcProduct, setCalcProduct] = useState("");
  const [calcQty, setCalcQty] = useState("");
  const [calculation, setCalculation] = useState<{
    productName: string;
    qty: number;
    multiplier: number;
    seasonName: string;
    bastonesNeeded: number;
    insumosNeeded: number;
  } | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [clientName, setClientName] = useState("");
  const [orderCode, setOrderCode] = useState("");
  const [qtyValue, setQtyValue] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");

  const handleCalculate = () => {
    if (!calcProduct || !calcQty || parseInt(calcQty) <= 0) return;
    
    const prod = productos.find(p => p.id === parseInt(calcProduct));
    const qty = parseInt(calcQty);
    const multiplier = temporadaActiva?.multiplicador ?? 1.0;
    const seasonName = temporadaActiva?.nombre ?? "Estándar";

    // Simple recipe: 1 product = 1 stick (baston) and 2 units of other material, scaled by season
    const bastonesNeeded = Math.round(qty * 1.0 * multiplier);
    const insumosNeeded = Math.round(qty * 1.5 * multiplier);

    setCalculation({
      productName: prod?.nombre ?? "Producto",
      qty,
      multiplier,
      seasonName,
      bastonesNeeded,
      insumosNeeded
    });
  };

  const openOrderModalFromCalc = () => {
    if (!calculation) return;
    setClientName("");
    setOrderCode("PED-" + Math.floor(1000 + Math.random() * 9000));
    setQtyValue(calculation.qty.toString());
    setDeliveryDate("");
    setShowModal(true);
  };

  const openNewOrderModal = () => {
    setClientName("");
    setOrderCode("PED-" + Math.floor(1000 + Math.random() * 9000));
    setQtyValue("");
    setDeliveryDate("");
    setShowModal(true);
  };

  const handleCreateOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !orderCode || !qtyValue || parseInt(qtyValue) <= 0) {
      alert("Por favor completa todos los campos obligatorios.");
      return;
    }

    try {
      await createPedido({
        codigo: orderCode,
        cliente: clientName,
        total_unidades: parseInt(qtyValue),
        fecha_entrega: deliveryDate || undefined,
      });
      setShowModal(false);
      setCalculation(null); // Clear calculator results
    } catch (err: any) {
      alert(err?.response?.data?.message ?? "Error al registrar el pedido.");
    }
  };

  const handleMarkAsDelivered = async (id: number) => {
    try {
      await updatePedido({
        id,
        data: { status: "entregado" }
      });
    } catch (err: any) {
      alert(err?.response?.data?.message ?? "Error al actualizar pedido.");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-k-text-h tracking-tight">Pedidos y Cotizaciones</h1>
          <p className="text-k-text-b text-sm mt-1">
            Calcula materiales y gestiona el historial de pedidos de maderas.
          </p>
        </div>
        <button
          onClick={openNewOrderModal}
          className="h-10 px-4 bg-k-primary hover:bg-k-primary-hover text-white rounded-xl font-bold text-sm transition-colors shadow-k-button flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nuevo Pedido Directo
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-k-bg-card border border-k-border rounded-3xl p-6 shadow-k-card h-fit">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <Calculator className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-k-text-h">Calculadora de Materiales</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-k-text-b uppercase tracking-wider mb-2">Producto Requerido</label>
              <select
                value={calcProduct}
                onChange={(e) => setCalcProduct(e.target.value)}
                className="w-full h-11 px-4 bg-k-bg-page border border-k-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-k-primary text-k-text-h"
                disabled={loadingProd}
              >
                <option value="">Seleccionar producto...</option>
                {productos.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-k-text-b uppercase tracking-wider mb-2">Cantidad a Producir</label>
              <input
                type="number"
                placeholder="Ej. 1000"
                min="1"
                value={calcQty}
                onChange={(e) => setCalcQty(e.target.value)}
                className="w-full h-11 px-4 bg-k-bg-page border border-k-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-k-primary text-k-text-h"
              />
            </div>
            <button
              onClick={handleCalculate}
              className="w-full h-11 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-600 transition-colors shadow-lg mt-4 flex items-center justify-center gap-2"
            >
              <Calculator className="h-4 w-4" />
              Calcular Materiales
            </button>
          </div>
        </div>

        {calculation ? (
          <div className="bg-k-bg-card border border-k-border rounded-3xl p-6 shadow-k-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-k-border pb-3">
                <h3 className="text-sm font-bold text-k-text-h uppercase tracking-wider">Resultado del Cálculo</h3>
                <span className="text-xs font-bold text-emerald-600 px-2 py-1 bg-emerald-50 rounded-lg">
                  Factor Temp: {calculation.seasonName} (x{calculation.multiplier})
                </span>
              </div>
              <div className="space-y-4">
                <div>
                  <span className="text-xs text-k-text-b font-medium block">Producto & Volumen</span>
                  <span className="text-lg font-black text-k-text-h">{calculation.qty.toLocaleString()} unidades de {calculation.productName}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-k-border pt-4">
                  <div>
                    <span className="text-xs text-k-text-b font-medium block">Bastones Necesarios</span>
                    <span className="text-2xl font-black text-orange-600">{calculation.bastonesNeeded.toLocaleString()} <span className="text-xs font-bold text-k-text-b">pzas</span></span>
                  </div>
                  <div>
                    <span className="text-xs text-k-text-b font-medium block">Insumos/Otros</span>
                    <span className="text-2xl font-black text-orange-600">{calculation.insumosNeeded.toLocaleString()} <span className="text-xs font-bold text-k-text-b">uds</span></span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={openOrderModalFromCalc}
              className="w-full h-11 bg-k-text-h text-white rounded-xl font-bold text-sm hover:bg-black transition-colors shadow-lg mt-6"
            >
              Convertir en Pedido
            </button>
          </div>
        ) : (
          <div className="bg-k-bg-card border border-dashed border-k-border rounded-3xl p-6 flex flex-col items-center justify-center text-center min-h-[280px]">
            <FileText className="h-12 w-12 text-k-text-b opacity-20 mb-4" />
            <h3 className="text-sm font-bold text-k-text-h mb-2">Esperando parámetros</h3>
            <p className="text-xs text-k-text-b max-w-xs">
              Ingresa el producto y la cantidad deseada para calcular los materiales y tiempos estimados antes de generar el pedido.
            </p>
          </div>
        )}
      </div>

      <div className="bg-k-bg-card border border-k-border rounded-3xl p-6 shadow-k-card mt-8">
        <h3 className="text-sm font-bold text-k-text-b uppercase tracking-widest mb-4">Historial de Pedidos</h3>
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center text-k-text-b py-8">Cargando pedidos...</div>
          ) : pedidos.length === 0 ? (
            <div className="text-center text-k-text-b py-8">Aún no hay pedidos registrados.</div>
          ) : (
            pedidos.map((pedido: MaderasPedido) => (
              <div key={pedido.id} className="p-4 rounded-2xl bg-k-bg-card2 border border-k-border flex items-center justify-between hover:border-k-primary transition-colors group">
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${pedido.status === 'entregado' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                    {pedido.status === 'entregado' ? <CheckCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-k-text-h text-sm">{pedido.codigo} - {pedido.cliente}</h4>
                    <div className="text-xs text-k-text-b">Entrega: {pedido.fecha_entrega ? new Date(pedido.fecha_entrega).toLocaleDateString() : "Sin fecha"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-black text-k-text-h">{pedido.total_unidades.toLocaleString()} uds</div>
                    <span className="text-[10px] uppercase font-bold text-k-text-b">{pedido.status}</span>
                  </div>
                  {pedido.status === "pendiente" && (
                    <button
                      onClick={() => handleMarkAsDelivered(pedido.id)}
                      className="p-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Marcar como entregado"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-k-bg-card border border-k-border rounded-3xl w-full max-w-md shadow-2xl p-6">
            <h2 className="text-xl font-bold text-k-text-h mb-4">Registrar Pedido</h2>
            <form onSubmit={handleCreateOrderSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-k-text-b uppercase tracking-wider mb-2">Código del Pedido</label>
                <input
                  type="text"
                  value={orderCode}
                  onChange={(e) => setOrderCode(e.target.value)}
                  className="w-full h-11 px-4 bg-k-bg-page border border-k-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-k-primary text-k-text-h"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-k-text-b uppercase tracking-wider mb-2">Cliente</label>
                <input
                  type="text"
                  placeholder="Ej. Comercializadora del Norte"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full h-11 px-4 bg-k-bg-page border border-k-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-k-primary text-k-text-h"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-k-text-b uppercase tracking-wider mb-2">Total Unidades Pedidas</label>
                <input
                  type="number"
                  min="1"
                  placeholder="Ej. 1500"
                  value={qtyValue}
                  onChange={(e) => setQtyValue(e.target.value)}
                  className="w-full h-11 px-4 bg-k-bg-page border border-k-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-k-primary text-k-text-h"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-k-text-b uppercase tracking-wider mb-2">Fecha Estimada de Entrega</label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full h-11 px-4 bg-k-bg-page border border-k-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-k-primary text-k-text-h"
                />
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
                  className="h-10 px-4 bg-k-primary text-white rounded-xl font-bold text-sm hover:bg-k-primary-hover transition-colors shadow"
                >
                  Confirmar Pedido
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
