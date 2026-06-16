import { Package, Layers, PlayCircle, ShoppingBag, AlertTriangle, Hammer } from "lucide-react";
import { useDashboardMaderas } from "../hooks/useDashboard";
import { Link } from "react-router-dom";

export default function DashboardMaderasPage() {
  const { data: metrics, isLoading } = useDashboardMaderas();

  const cards = [
    {
      title: "Productos Terminados",
      value: metrics?.total_productos ?? 0,
      icon: Package,
      color: "text-amber-500 bg-amber-500/10",
      description: "Productos listos para entrega",
      link: "/produccion-maderas/catalogo"
    },
    {
      title: "Bastones y Materiales",
      value: metrics?.total_bastones ?? 0,
      icon: Layers,
      color: "text-blue-500 bg-blue-500/10",
      description: "Materia prima registrada",
      link: "/produccion-maderas/catalogo"
    },
    {
      title: "Producción de Hoy",
      value: metrics?.produccion_hoy ?? 0,
      icon: PlayCircle,
      color: "text-emerald-500 bg-emerald-500/10",
      description: "Unidades cortadas hoy",
      link: "/produccion-maderas/produccion"
    },
    {
      title: "Pedidos Pendientes",
      value: metrics?.pedidos_pendientes ?? 0,
      icon: ShoppingBag,
      color: "text-purple-500 bg-purple-500/10",
      description: "Pedidos por procesar",
      link: "/produccion-maderas/pedidos"
    },
    {
      title: "Material Stock Bajo",
      value: metrics?.stock_bajo ?? 0,
      icon: AlertTriangle,
      color: "text-rose-500 bg-rose-500/10",
      description: "Materiales bajo mínimo",
      link: "/produccion-maderas/inventario"
    },
    {
      title: "Ensambles en Proceso",
      value: metrics?.ensambles_proceso ?? 0,
      icon: Hammer,
      color: "text-indigo-500 bg-indigo-500/10",
      description: "Ensambles activos",
      link: "/produccion-maderas/ensambles"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-k-text-h tracking-tight">Dashboard Maderas</h1>
        <p className="text-k-text-b text-sm mt-1">
          Panel general de producción de maderas, inventarios y ensamble.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-k-text-b animate-pulse text-sm">Cargando estadísticas de maderas...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card, i) => {
            const Icon = card.icon;
            return (
              <Link
                key={i}
                to={card.link}
                className="bg-k-bg-card border border-k-border rounded-3xl p-6 shadow-k-card hover:border-k-primary/50 transition-all duration-300 group block"
              >
                <div className="flex justify-between items-start">
                  <div className={`p-3 rounded-2xl ${card.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-bold text-k-text-b opacity-0 group-hover:opacity-100 transition-opacity">
                    Ver más →
                  </span>
                </div>
                <div className="mt-6">
                  <h3 className="text-sm font-bold text-k-text-b uppercase tracking-wider">
                    {card.title}
                  </h3>
                  <p className="text-4xl font-black text-k-text-h mt-2">
                    {card.value}
                  </p>
                  <p className="text-xs text-k-text-b mt-2">
                    {card.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
