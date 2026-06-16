import { Search } from "lucide-react";
import { useHistorialPesaje } from "../hooks/usePesaje";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function HistorialPesajePage() {
  const { data: historial, isLoading } = useHistorialPesaje();

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
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-sm text-k-text-b">Cargando historial...</td>
                </tr>
              ) : historial?.data && historial.data.length > 0 ? (
                historial.data.map((item: any) => (
                  <tr key={item.id} className="hover:bg-k-bg-card2 transition-colors">
                    <td className="p-4">
                      <span className="font-bold text-k-text-h text-sm">
                        {item.empleado ? `${item.empleado.nombres} ${item.empleado.apellidos}` : 'Usuario'}
                      </span>
                    </td>
                    <td className="p-4 text-sm font-medium text-k-text-b">
                      {item.sabor ? `${item.sabor.nombre} ${item.sabor.presentacion ? `(${item.sabor.presentacion})` : ''}` : '-'}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 font-bold text-sm">
                        {item.peso} kg
                      </span>
                    </td>
                    <td className="p-4 text-sm text-k-text-b">
                      {format(new Date(item.fecha_registro), "dd MMM, HH:mm", { locale: es })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-sm text-k-text-b">No hay registros de pesaje.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
