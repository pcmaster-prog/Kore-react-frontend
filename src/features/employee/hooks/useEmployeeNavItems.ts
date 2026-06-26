import {
  LayoutDashboard,
  ClipboardList,
  CalendarCheck,
  User,
  Hammer,
  Scale,
  LogOut,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { auth } from "@/features/auth/store";

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
  const modules = auth.getModules();
  const hasModule = (slug: string) => modules.length === 0 || modules.includes(slug);

  const items: EmployeeNavItem[] = [
    { type: "link", label: "Dashboard", to: "/app/employee/dashboard", icon: LayoutDashboard },
    { type: "link", label: "Mi Agenda", to: "/app/employee/mis-tareas/asignaciones", icon: ClipboardList },
    { type: "link", label: "Asistencia", to: "/app/employee/asistencia", icon: CalendarCheck },
  ];

  if (hasModule("produccion_maderas")) {
    items.push({ type: "link", label: "Maderas", to: "/app/maderas/dashboard", icon: Hammer });
  }

  if (hasModule("produccion_pesaje")) {
    items.push({ type: "link", label: "Pesaje", to: "/app/pesaje/dashboard", icon: Scale });
  }

  items.push(
    { type: "link", label: "Perfil", to: "/app/perfil", icon: User },
    { type: "action", label: "Salir", action: "logout", icon: LogOut }
  );

  return items;
}
