import { Scale, CheckCircle } from "lucide-react";

export default function RegistroPesajePage() {
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
              <label className="block text-xs font-semibold text-k-text-b mb-1">Operario</label>
              <select className="w-full bg-white border border-k-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-k-primary transition-all">
                <option>Seleccionar operario...</option>
                <option>María García</option>
                <option>José Rodríguez</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-k-text-b mb-1">Sabor / Producto</label>
              <select className="w-full bg-white border border-k-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-k-primary transition-all">
                <option>Fresa 500g</option>
                <option>Vainilla 1kg</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-k-text-b mb-1">Peso Registrado (kg)</label>
              <input type="number" step="0.01" placeholder="Ej. 15.50" className="w-full text-2xl font-black text-center bg-white border border-k-border rounded-xl px-4 py-6 focus:outline-none focus:ring-2 focus:ring-k-primary transition-all" />
            </div>
            <button className="w-full h-12 bg-k-primary text-white rounded-xl font-bold text-base hover:bg-k-primary-hover transition-colors shadow-lg flex items-center justify-center gap-2 mt-2">
              <Scale className="h-5 w-5" />
              Registrar Peso
            </button>
          </div>
        </div>

        <div className="bg-k-bg-card border border-k-border rounded-3xl p-6 shadow-k-card flex flex-col justify-center items-center text-center">
          <div className="h-20 w-20 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-6">
            <CheckCircle className="h-10 w-10" />
          </div>
          <h3 className="text-xl font-black text-k-text-h mb-2">Báscula Lista</h3>
          <p className="text-sm text-k-text-b max-w-xs">
            Asegúrate de calibrar la báscula al inicio de tu turno. Todos los registros se guardarán con tu usuario actual.
          </p>
        </div>
      </div>
    </div>
  );
}
