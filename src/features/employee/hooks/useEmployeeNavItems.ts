import {
  LayoutDashboard,
  ClipboardList,
  CalendarCheck,
  User,
  LogOut,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItemType = "link" | "action";

export interface EmployeeNavItem {
  type: NavItemType;
  label: string;
  to?: string;
  action?: "logout";
  icon: LucideIcon;
  /** Slug del módulo que habilita este ítem. undefined = siempre visible. */
  module?: string;
}

export function useEmployeeNavItems(): EmployeeNavItem[] {
  // Nota: Maderas y Pesaje están ocultos temporalmente para empleados.
  // Para reactivarlos, importar Hammer/Scale de lucide-react, leer auth.getModules()
  // y agregar los ítems condicionales según los módulos produccion_maderas / produccion_pesaje.

  const items: EmployeeNavItem[] = [
    { type: "link", label: "Dashboard", to: "/app/employee/dashboard", icon: LayoutDashboard },
    { type: "link", label: "Mi Agenda", to: "/app/employee/mis-tareas/asignaciones", icon: ClipboardList },
    { type: "link", label: "Asistencia", to: "/app/employee/asistencia", icon: CalendarCheck },
  ];

  items.push(
    { type: "link", label: "Perfil", to: "/app/perfil", icon: User },
    { type: "action", label: "Salir", action: "logout", icon: LogOut }
  );

  return items;
}
