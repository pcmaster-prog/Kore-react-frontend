import { useState } from "react";
import { Scale, CheckCircle } from "lucide-react";
import { useSabores, useCreatePesaje } from "../hooks/usePesaje";
import toast from "react-hot-toast";

export default function RegistroPesajePage() {
  const { data: saboresResp, isLoading: loadingSabores } = useSabores();
  const saboresActivos = saboresResp?.data?.filter((s: any) => s.activo) || [];
  
  const { mutateAsync: createPesaje, isPending } = useCreatePesaje();
  
  const [saborId, setSaborId] = useState("");
  const [peso, setPeso] = useState("");

  const handleSubmit = async () => {
    if (!saborId || !peso) {
      toast.error("Selecciona un sabor y escribe el peso");
      return;
    }
    try {
      await createPesaje({ sabor_id: saborId, peso: parseFloat(peso) });
      toast.success("Pesaje registrado correctamente");
      setSaborId("");
      setPeso("");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al registrar el pesaje");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-k-text-h tracking-tight">Registro de Pesaje</h1>
          <p className="text-k-text-b text-sm mt-1">
            Captura rápida de pesajes por operario y sabor.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-k-bg-card to-k-bg-card2 border border-k-border rounded-3xl p-6 shadow-k-card">
          <h3 className="text-sm font-bold text-k-text-b uppercase tracking-widest mb-4">Captura Manual</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-k-text-b mb-1">Sabor / Producto</label>
              <select 
                value={saborId}
                onChange={e => setSaborId(e.target.value)}
                className="w-full bg-white border border-k-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
              >
                <option value="">Seleccionar sabor...</option>
                {saboresActivos.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.nombre} {s.presentacion ? `(${s.presentacion})` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-k-text-b mb-1">Peso Registrado (kg)</label>
              <input 
                type="number" 
                step="0.001" 
                min="0.001"
                placeholder="Ej. 15.50" 
                value={peso}
                onChange={e => setPeso(e.target.value)}
                className="w-full text-2xl font-black text-center bg-white border border-k-border rounded-xl px-4 py-6 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all" 
              />
            </div>
            <button 
              onClick={handleSubmit}
              disabled={isPending || !saborId || !peso}
              className="w-full h-12 bg-amber-500 text-white rounded-xl font-bold text-base hover:bg-amber-600 disabled:bg-gray-300 transition-colors shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 mt-2"
            >
              <Scale className="h-5 w-5" />
              {isPending ? "Registrando..." : "Registrar Peso"}
            </button>
          </div>
        </div>

        <div className="bg-k-bg-card border border-k-border rounded-3xl p-6 shadow-k-card flex flex-col justify-center items-center text-center">
          <div className="h-20 w-20 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/20">
            <CheckCircle className="h-10 w-10" />
          </div>
          <h3 className="text-xl font-black text-k-text-h mb-2">Báscula Lista</h3>
          <p className="text-sm text-k-text-b max-w-xs">
            Selecciona el producto y registra el peso para ingresarlo al sistema. El registro quedará a tu nombre.
          </p>
        </div>
      </div>
    </div>
  );
}
