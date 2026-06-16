import { LayoutDashboard, TrendingUp, TrendingDown, Scale, Route } from "lucide-react";
import { useDashboardPesaje } from "../hooks/usePesaje";

export default function DashboardPesajePage() {
  const { data: dashboard, isLoading } = useDashboardPesaje();
  const stats = dashboard?.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-k-text-h tracking-tight">Dashboard Pesaje</h1>
          <p className="text-k-text-b text-sm mt-1">
            Métricas clave y resumen general del área de pesaje.
          </p>
        </div>
      </div>

      {isLoading ? (
        <p className="text-center py-10">Cargando métricas...</p>
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-k-bg-card border border-k-border rounded-3xl p-6 shadow-k-card">
              <div className="flex items-center gap-3 mb-4 text-amber-600">
                <Scale className="h-6 w-6" />
                <h3 className="text-sm font-bold uppercase tracking-wider">Kg Ingresados Hoy</h3>
              </div>
              <p className="text-4xl font-black text-k-text-h">{stats.kgIngresadosHoy} <span className="text-xl font-medium text-k-text-b">kg</span></p>
              
              <div className={`mt-4 flex items-center gap-2 text-sm font-bold ${stats.tendencia >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stats.tendencia >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {Math.abs(stats.tendencia)}% vs ayer
              </div>
            </div>

            <div className="bg-k-bg-card border border-k-border rounded-3xl p-6 shadow-k-card">
              <div className="flex items-center gap-3 mb-4 text-emerald-600">
                <Route className="h-6 w-6" />
                <h3 className="text-sm font-bold uppercase tracking-wider">Viajes Registrados Hoy</h3>
              </div>
              <p className="text-4xl font-black text-k-text-h">{stats.viajesHoy} <span className="text-xl font-medium text-k-text-b">viajes</span></p>
            </div>
          </div>

          <div className="bg-k-bg-card border border-k-border rounded-3xl p-6 shadow-k-card">
            <h2 className="text-lg font-bold text-k-text-h mb-4">Últimos Registros</h2>
            {stats.ultimosViajes && stats.ultimosViajes.length > 0 ? (
              <ul className="divide-y divide-k-border">
                {stats.ultimosViajes.map((viaje: any) => (
                  <li key={viaje.id} className="py-3 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-k-text-h text-sm">
                        {viaje.empleado ? `${viaje.empleado.nombres} ${viaje.empleado.apellidos}` : 'Usuario'}
                      </p>
                      <p className="text-xs text-k-text-b">
                        {viaje.sabor ? `${viaje.sabor.nombre} ${viaje.sabor.presentacion ? `(${viaje.sabor.presentacion})` : ''}` : '-'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-amber-600">{viaje.peso} kg</p>
                      <p className="text-xs text-k-text-b">
                        {new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit' }).format(new Date(viaje.fecha_registro))}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-k-text-b text-center py-4">No hay registros recientes.</p>
            )}
          </div>
        </>
      ) : (
        <div className="bg-k-bg-card border border-k-border rounded-3xl p-6 shadow-k-card text-center py-12">
          <LayoutDashboard className="h-12 w-12 mx-auto text-k-text-b opacity-20 mb-4" />
          <h2 className="text-lg font-bold text-k-text-h">Error</h2>
          <p className="text-sm text-k-text-b max-w-md mx-auto mt-2">
            No se pudieron cargar las métricas.
          </p>
        </div>
      )}
    </div>
  );
}
