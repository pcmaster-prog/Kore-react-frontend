import { LayoutDashboard } from "lucide-react";

export default function DashboardPesajePage() {
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

      <div className="bg-k-bg-card border border-k-border rounded-3xl p-6 shadow-k-card text-center py-12">
        <LayoutDashboard className="h-12 w-12 mx-auto text-k-text-b opacity-20 mb-4" />
        <h2 className="text-lg font-bold text-k-text-h">Próximamente</h2>
        <p className="text-sm text-k-text-b max-w-md mx-auto mt-2">
          Aquí se mostrarán gráficas y estadísticas agregadas sobre el volumen de material pesado en la última semana.
        </p>
      </div>
    </div>
  );
}
