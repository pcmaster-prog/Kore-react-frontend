import { Outlet, NavLink } from "react-router-dom";
import { LayoutDashboard, Package, Hammer, Combine, Calculator, FileText, Calendar, BookOpen, Scissors } from "lucide-react";
import { cx } from "@/lib/utils";
import { useAuthStore } from "@/features/auth/authStore";

const MADERAS_TABS = [
  { path: "/app/maderas/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { path: "/app/maderas/inventario", label: "Inventario", icon: <Package className="h-4 w-4" /> },
  { path: "/app/maderas/produccion", label: "Producción", icon: <Hammer className="h-4 w-4" /> },
  { path: "/app/maderas/ensamblaje", label: "Ensamblaje", icon: <Combine className="h-4 w-4" /> },
  { path: "/app/maderas/pedidos", label: "Pedidos", icon: <FileText className="h-4 w-4" /> },
  { path: "/app/maderas/temporadas", label: "Temporadas", icon: <Calendar className="h-4 w-4" />, adminOnly: true },
  { path: "/app/maderas/catalogo", label: "Catálogo", icon: <BookOpen className="h-4 w-4" />, adminOnly: true },
  { path: "/app/maderas/tablas-corte", label: "Tablas Corte", icon: <Scissors className="h-4 w-4" />, adminOnly: true },
];

export default function MaderasLayout() {
  const isAdmin = useAuthStore((s: any) => s.user?.role === "admin");
  const tabs = MADERAS_TABS.filter((t) => !t.adminOnly || isAdmin);

  return (
    <div className="space-y-6 animate-in-up flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Tabs - Organic Segmented Style */}
        <div className="w-full overflow-x-auto pb-2 sm:pb-0 -mb-2 sm:mb-0" style={{ scrollbarWidth: "none" }}>
          <div className="flex p-1.5 bg-k-bg-card border border-k-border rounded-[28px] shadow-k-card w-max">
            {tabs.map((t) => (
              <NavLink
                key={t.path}
                to={t.path}
                className={({ isActive }) => cx(
                  "flex whitespace-nowrap items-center gap-2 px-6 py-2.5 rounded-[22px] text-sm font-bold transition-all duration-300 shrink-0",
                  isActive
                    ? "bg-k-bg-sidebar text-white shadow-lg shadow-obsidian/20"
                    : "text-k-text-b hover:text-k-text-h hover:bg-k-bg-card2",
                )}
              >
                {t.icon}
                {t.label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}
