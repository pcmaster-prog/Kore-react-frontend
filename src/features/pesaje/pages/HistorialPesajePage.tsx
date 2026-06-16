import { Search } from "lucide-react";

export default function HistorialPesajePage() {
  const MOCK_HISTORIAL = [
    { id: 1, operario: "María García", sabor: "Fresa 500g", peso: 15.50, fecha: "10 Oct, 14:30", supervisor: "Admin" },
    { id: 2, operario: "José Rodríguez", sabor: "Vainilla 1kg", peso: 22.10, fecha: "10 Oct, 12:15", supervisor: "Admin" },
    { id: 3, operario: "Ana López", sabor: "Chocolate 500g", peso: 14.80, fecha: "09 Oct, 16:45", supervisor: "Admin" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-k-text-h tracking-tight">Historial de Pesajes</h1>
          <p className="text-k-text-b text-sm mt-1">
            Consulta y filtra todos los registros de la báscula.
          </p>
        </div>
      </div>

      <div className="bg-k-bg-card border border-k-border rounded-3xl shadow-k-card overflow-hidden">
        <div className="p-4 border-b border-k-border flex justify-between items-center bg-k-bg-card2">
          <h2 className="font-bold text-k-text-h">Registros</h2>
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-k-text-b" />
            <input
              type="text"
              placeholder="Buscar operario o sabor..."
              className="pl-9 pr-4 py-2 bg-k-bg-card border border-k-border rounded-xl text-sm w-64 focus:outline-none focus:ring-2 focus:ring-k-primary"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-k-border bg-k-bg-card text-xs font-bold text-k-text-b uppercase tracking-wider">
                <th className="p-4">Operario</th>
                <th className="p-4">Sabor / Producto</th>
                <th className="p-4">Peso</th>
                <th className="p-4">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-k-border bg-k-bg-card">
              {MOCK_HISTORIAL.map((item) => (
                <tr key={item.id} className="hover:bg-k-bg-card2 transition-colors">
                  <td className="p-4">
                    <span className="font-bold text-k-text-h text-sm">{item.operario}</span>
                  </td>
                  <td className="p-4 text-sm font-medium text-k-text-b">{item.sabor}</td>
                  <td className="p-4">
                    <span className="font-black text-k-primary">{item.peso.toFixed(2)} <span className="text-xs font-medium text-k-text-b">kg</span></span>
                  </td>
                  <td className="p-4 text-sm text-k-text-b">{item.fecha}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
