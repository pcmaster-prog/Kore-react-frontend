import { useEffect, useMemo } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Package, Hammer, Combine, FileText, Calendar, BookOpen, Scissors } from "lucide-react";
import { cx } from "@/lib/utils";
import { useAuthStore } from "@/features/auth/authStore";
import type { PositionPermissions } from "@/features/puestos/types";

const MODULE_SLUG = "produccion_maderas";

const MADERAS_TABS = [
  { path: "/app/maderas/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" />, permissionKey: "dashboard" },
  { path: "/app/maderas/inventario", label: "Inventario", icon: <Package className="h-4 w-4" />, permissionKey: "inventario" },
  { path: "/app/maderas/produccion", label: "Producción", icon: <Hammer className="h-4 w-4" />, permissionKey: "produccion" },
  { path: "/app/maderas/ensamblaje", label: "Ensamblaje", icon: <Combine className="h-4 w-4" />, permissionKey: "ensamblaje" },
  { path: "/app/maderas/pedidos", label: "Pedidos", icon: <FileText className="h-4 w-4" />, permissionKey: "pedidos" },
  { path: "/app/maderas/temporadas", label: "Temporadas", icon: <Calendar className="h-4 w-4" />, adminOnly: true },
  { path: "/app/maderas/catalogo", label: "Catálogo", icon: <BookOpen className="h-4 w-4" />, adminOnly: true },
  { path: "/app/maderas/tablas-corte", label: "Tablas Corte", icon: <Scissors className="h-4 w-4" />, adminOnly: true },
];

function hasTabPermission(
  isAdmin: boolean,
  permissions: PositionPermissions,
  permissionKey?: string
): boolean {
  if (isAdmin || !permissionKey) return true;

  const modulePerms = permissions[MODULE_SLUG];

  // Sin permisos configurados = acceso total (compatibilidad hacia atrás).
  if (!modulePerms || modulePerms.length === 0) return true;

  return modulePerms.includes(permissionKey);
}

export default function MaderasLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const permissions = useAuthStore((s) => s.permissions);
  const isAdmin = user?.role === "admin";

  const tabs = useMemo(
    () => MADERAS_TABS.filter((t) => !t.adminOnly || isAdmin).filter((t) => hasTabPermission(isAdmin, permissions, t.permissionKey)),
    [isAdmin, permissions]
  );

  // Seguridad UX: si el usuario escribe una URL a la que no tiene acceso,
  // redirigirlo a la primera pestaña permitida.
  useEffect(() => {
    if (tabs.length === 0) return;

    const currentPath = location.pathname;
    const isAllowed = tabs.some((t) => currentPath === t.path || currentPath.startsWith(`${t.path}/`));

    if (!isAllowed) {
      navigate(tabs[0].path, { replace: true });
    }
  }, [location.pathname, tabs, navigate]);

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
