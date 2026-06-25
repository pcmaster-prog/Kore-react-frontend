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
      className="fixed bottom-3 left-3 right-3 z-50 rounded-2xl border border-gray-200 bg-white/95 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="flex items-center justify-around gap-1 overflow-x-auto scrollbar-hide py-2 px-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.type === "link" && isActive(item.to);

          const content = (
            <div
              className={cx(
                "flex min-w-[56px] shrink-0 flex-col items-center justify-center rounded-xl px-2 py-2 transition-all duration-200",
                active
                  ? "bg-obsidian text-white shadow-md"
                  : "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
              <span className="mt-0.5 text-[10px] font-semibold leading-none">{item.label}</span>
            </div>
          );

          if (item.type === "action") {
            return (
              <li key={item.label} className="shrink-0">
                <button
                  type="button"
                  onClick={onLogout}
                  className="rounded-xl p-0 text-neutral-400 transition-all duration-200 hover:bg-neutral-100 hover:text-neutral-700"
                  aria-label="Cerrar sesión"
                >
                  {content}
                </button>
              </li>
            );
          }

          return (
            <li key={item.label} className="shrink-0">
              <NavLink
                to={item.to!}
                className="block rounded-xl p-0"
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
