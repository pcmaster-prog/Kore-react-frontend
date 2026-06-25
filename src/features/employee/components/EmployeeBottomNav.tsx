import { NavLink, useLocation } from "react-router-dom";
import { cx } from "@/lib/utils";
import { useEmployeeNavItems } from "@/features/employee/hooks/useEmployeeNavItems";

interface EmployeeBottomNavProps {
  onLogout: () => void;
}

export function EmployeeBottomNav({ onLogout }: EmployeeBottomNavProps) {
  const location = useLocation();
  const items = useEmployeeNavItems();

  const isActive = (to?: string) => {
    if (!to) return false;
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  };

  return (
    <nav
      aria-label="Navegación principal de empleado"
      className="fixed bottom-0 left-0 z-50 w-full border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"
    >
      <ul className="scrollbar-hide flex snap-x snap-mandatory overflow-x-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.type === "link" && isActive(item.to);

          const content = (
            <div
              className={cx(
                "flex min-w-[64px] shrink-0 snap-start flex-col items-center justify-center gap-1 py-2 transition-colors",
                active ? "text-k-sb-active" : "text-neutral-400 hover:text-neutral-600"
              )}
            >
              <Icon className="h-6 w-6" strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px] font-semibold leading-none">{item.label}</span>
            </div>
          );

          if (item.type === "action") {
            return (
              <li key={item.label} className="flex flex-1">
                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full text-neutral-400 transition-colors hover:text-neutral-600"
                  aria-label="Cerrar sesión"
                >
                  {content}
                </button>
              </li>
            );
          }

          return (
            <li key={item.label} className="flex flex-1">
              <NavLink
                to={item.to!}
                className="w-full"
                aria-current={active ? "page" : undefined}
              >
                {content}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
