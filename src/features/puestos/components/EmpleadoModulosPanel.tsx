import { useState } from "react";
import { Shield, Plus, X } from "lucide-react";
import {
  useModulosDisponibles,
  useEmpleadoModulos,
  useAddEmpleadoModulo,
  useRemoveEmpleadoModulo,
} from "../hooks/usePuestos";

export function EmpleadoModulosPanel({ empleadoId }: { empleadoId: string }) {
  const { data: modulosDisp } = useModulosDisponibles();
  const { data: acceso, isLoading } = useEmpleadoModulos(empleadoId);
  const { mutate: addModulo, isPending: adding } = useAddEmpleadoModulo();
  const { mutate: removeModulo, isPending: removing } = useRemoveEmpleadoModulo();

  const [selectedToAdd, setSelectedToAdd] = useState("");

  if (isLoading) {
    return <div className="p-4 text-sm text-k-text-b animate-pulse">Cargando permisos...</div>;
  }

  const disponiblesParaAgregar = modulosDisp?.filter(
    (m) => !acceso?.efectivos.includes(m.slug)
  ) ?? [];

  const handleAdd = () => {
    if (!selectedToAdd) return;
    addModulo(
      { empleadoId, modulo_slug: selectedToAdd },
      { onSuccess: () => setSelectedToAdd("") }
    );
  };

  return (
    <div className="space-y-8">
      {/* Módulos Heredados (Read-only) */}
      <div>
        <h3 className="text-sm font-bold text-k-text-h uppercase tracking-widest mb-4 flex items-center gap-2">
          <Shield className="h-4 w-4 text-k-text-b" />
          Heredados del Puesto
        </h3>
        {acceso?.heredados.length === 0 ? (
          <div className="text-sm text-k-text-b p-4 bg-k-bg-card2 rounded-xl border border-dashed border-k-border">
            No hereda módulos de ningún puesto.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {acceso?.heredados.map((slug) => {
              const info = modulosDisp?.find((m) => m.slug === slug);
              return (
                <div
                  key={slug}
                  className="px-3 py-1.5 rounded-lg bg-k-bg-card2 border border-k-border text-sm font-medium text-k-text-h flex items-center gap-2"
                >
                  <Shield className="h-3.5 w-3.5 text-violet-500" />
                  {info?.nombre ?? slug}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Módulos Individuales (Overrides) */}
      <div>
        <h3 className="text-sm font-bold text-k-text-h uppercase tracking-widest mb-4 flex items-center gap-2">
          <Shield className="h-4 w-4 text-emerald-500" />
          Excepciones Individuales
        </h3>
        
        <div className="bg-k-bg-card2 border border-k-border rounded-2xl p-4 mb-4">
          <p className="text-xs text-k-text-b mb-4">
            Añade módulos extra a este empleado sin tener que cambiar su puesto.
          </p>
          <div className="flex gap-2">
            <select
              value={selectedToAdd}
              onChange={(e) => setSelectedToAdd(e.target.value)}
              className="flex-1 rounded-xl border-k-border bg-k-bg-card text-sm"
              disabled={adding || disponiblesParaAgregar.length === 0}
            >
              <option value="">Seleccionar módulo...</option>
              {disponiblesParaAgregar.map((m) => (
                <option key={m.slug} value={m.slug}>
                  {m.nombre}
                </option>
              ))}
            </select>
            <button
              onClick={handleAdd}
              disabled={!selectedToAdd || adding}
              className="h-10 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Añadir
            </button>
          </div>
        </div>

        {acceso?.individuales.length === 0 ? (
          <div className="text-sm text-k-text-b p-4 text-center">
            Sin excepciones adicionales.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {acceso?.individuales.map((slug) => {
              const info = modulosDisp?.find((m) => m.slug === slug);
              return (
                <div
                  key={slug}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100 text-sm font-medium text-emerald-800 flex items-center gap-2"
                >
                  <Shield className="h-3.5 w-3.5" />
                  {info?.nombre ?? slug}
                  <button
                    onClick={() => removeModulo({ empleadoId, modulo_slug: slug })}
                    disabled={removing}
                    className="ml-1 p-0.5 hover:bg-emerald-200 rounded text-emerald-600 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
