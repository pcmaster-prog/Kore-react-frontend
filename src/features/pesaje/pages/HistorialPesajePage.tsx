import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useHistorialPesaje } from "../hooks/usePesaje";
import type { PesajeRegistro } from "../types";

export default function HistorialPesajePage() {
  const [search, setSearch] = useState("");
  const { data: historial, isLoading } = useHistorialPesaje({ search: search.trim() || undefined });

  const registros: PesajeRegistro[] = historial?.data || [];

  const filtrados = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return registros;
    return registros.filter((item) => {
      const nombreEmpleado = item.empleado
        ? `${item.empleado.nombres ?? ""} ${item.empleado.apellidos ?? ""} ${item.empleado.full_name ?? ""}`.toLowerCase()
        : "";
      const nombreSabor = item.sabor
        ? `${item.sabor.nombre} ${item.sabor.presentacion ?? ""}`.toLowerCase()
        : "";
      return nombreEmpleado.includes(term) || nombreSabor.includes(term);
    });
  }, [registros, search]);

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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
                <th className="p-4">Unidades</th>
                <th className="p-4">Peso</th>
                <th className="p-4">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-k-border bg-k-bg-card">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-sm text-k-text-b">Cargando historial...</td>
                </tr>
              ) : filtrados.length > 0 ? (
                filtrados.map((item) => (
                  <tr key={item.id} className="hover:bg-k-bg-card2 transition-colors">
                    <td className="p-4">
                      <span className="font-bold text-k-text-h text-sm">
                        {item.empleado ? `${item.empleado.nombres ?? ""} ${item.empleado.apellidos ?? ""}`.trim() || item.empleado.full_name : "Usuario"}
                      </span>
                    </td>
                    <td className="p-4 text-sm font-medium text-k-text-b">
                      {item.sabor ? `${item.sabor.nombre} ${item.sabor.presentacion ? `(${item.sabor.presentacion})` : ""}` : "-"}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-lg bg-blue-500/10 text-blue-600 font-bold text-sm">
                        {item.cantidad} {item.sabor?.unidad ?? "unidad"}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 font-bold text-sm">
                        {item.peso} kg
                      </span>
                    </td>
                    <td className="p-4 text-sm text-k-text-b">
                      {new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(item.fecha_registro))}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-sm text-k-text-b">No hay registros de pesaje.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
