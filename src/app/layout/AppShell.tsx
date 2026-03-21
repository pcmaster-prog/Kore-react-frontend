// src/layout/AppShell.tsx
import { useState, useEffect } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { auth } from "@/features/auth/store";
import {
  Menu, X, LogOut, LayoutDashboard, ClipboardList,
  CalendarCheck, Clock, ShieldCheck, User, Users,
  Settings, ChevronRight,
} from "lucide-react";

function cx(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(" ");
}


// ─── Link simple ──────────────────────────────────────────────────────────────
function SidebarLink({
  to, label, icon, indent = false, onClick,
}: {
  to: string; label: string; icon?: React.ReactNode;
  indent?: boolean; onClick?: () => void;
}) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cx(
          "group flex items-center gap-2 rounded-2xl px-3 py-2 text-sm transition border border-transparent",
          indent && "ml-4 pl-3",
          isActive
            ? "bg-neutral-900 text-white shadow-sm"
            : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
        )
      }
    >
      <span className="shrink-0">{icon}</span>
      <span className="font-medium">{label}</span>
    </NavLink>
  );
}

// ─── Grupo de links con label ─────────────────────────────────────────────────
function NavGroup({
  label, children,
}: {
  label: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-0.5">
      <div className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
        {label}
      </div>
      {children}
    </div>
  );
}

// ─── Breadcrumbs ──────────────────────────────────────────────────────────────
function Breadcrumbs() {
  const location = useLocation();
  const parts = location.pathname.split("/").filter(Boolean);
  const labelMap: Record<string, string> = {
    manager: "Manager", employee: "Empleado", dashboard: "Dashboard",
    tareas: "Tareas", plantillas: "Plantillas", rutinas: "Rutinas",
    asistencia: "Asistencia", activity: "Actividad", "mis-tareas": "Mis tareas",
    asignaciones: "Asignaciones", revision: "Revisión", perfil: "Perfil",
    configuracion: "Configuración", usuarios: "Usuarios", nomina: "Nómina",
  };
  const crumbs = parts
    .filter((p) => p !== "app")
    .map((p) => labelMap[p] ?? (p.charAt(0).toUpperCase() + p.slice(1)));

  return (
    <div className="flex items-center gap-1.5 text-xs text-neutral-500 flex-wrap">
      <span className="text-neutral-400">Kore</span>
      {crumbs.map((c, i) => (
        <span key={`${c}-${i}`} className="flex items-center gap-1.5">
          <ChevronRight className="h-3 w-3 text-neutral-300" />
          <span className={i === crumbs.length - 1 ? "text-neutral-900 font-medium" : ""}>{c}</span>
        </span>
      ))}
    </div>
  );
}

// ─── Badge de rol ─────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role?: string }) {
  const meta =
    role === "admin"
      ? { label: "Admin", cls: "bg-emerald-50 text-emerald-800 border-emerald-200", icon: <ShieldCheck className="h-3.5 w-3.5" /> }
      : role === "supervisor"
      ? { label: "Supervisor", cls: "bg-blue-50 text-blue-800 border-blue-200", icon: <ShieldCheck className="h-3.5 w-3.5" /> }
      : { label: "Empleado", cls: "bg-neutral-50 text-neutral-700 border-neutral-200", icon: <Clock className="h-3.5 w-3.5" /> };

  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs", meta.cls)}>
      {meta.icon}{meta.label}
    </span>
  );
}

// ─── Sidebar content (reutilizado en desktop y mobile drawer) ─────────────────
function SidebarContent({
  user, role, onNav, onLogout,
}: {
  user: any; role: string; onNav?: () => void; onLogout: () => void;
}) {
  const isEmployee = role === "empleado";
  const isAdmin = role === "admin";
  const [activeModules, setActiveModules] = useState(() => auth.getModules());

  useEffect(() => {
    const handleUpdate = () => setActiveModules(auth.getModules());
    window.addEventListener("kore-modules-updated", handleUpdate);
    return () => window.removeEventListener("kore-modules-updated", handleUpdate);
  }, []);

  const hasModule = (slug: string) => activeModules.length === 0 || activeModules.includes(slug);

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <div className="text-lg font-semibold tracking-tight">Kore</div>
          <div className="text-xs text-neutral-500">Ops Suite</div>
        </div>
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" title="Online" />
      </div>

      {/* Sesión */}
      <div className="p-3">
        <div className="rounded-2xl border bg-neutral-50 p-3">
          <div className="text-xs text-neutral-500 mb-1">Sesión</div>
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{user?.name ?? "Usuario"}</div>
              <div className="text-xs text-neutral-500 truncate">{user?.email ?? ""}</div>
            </div>
            <RoleBadge role={role} />
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 pb-2 space-y-0.5">
        {isEmployee ? (
          // ── EMPLEADO ──────────────────────────────────────────────────────
          <>
            <SidebarLink to="/app/employee/dashboard" label="Dashboard" icon={<LayoutDashboard className="h-4 w-4" />} onClick={onNav} />
            <SidebarLink to="/app/employee/mis-tareas/asignaciones" label="Mis tareas" icon={<ClipboardList className="h-4 w-4" />} onClick={onNav} />
            <SidebarLink to="/app/employee/asistencia" label="Asistencia" icon={<CalendarCheck className="h-4 w-4" />} onClick={onNav} />
            <SidebarLink to="/app/perfil" label="Perfil" icon={<User className="h-4 w-4" />} onClick={onNav} />
          </>
        ) : (
          // ── MANAGER (admin + supervisor) ──────────────────────────────────
          <>
            <SidebarLink to="/app/manager/dashboard" label="Dashboard" icon={<LayoutDashboard className="h-4 w-4" />} onClick={onNav} />

            {hasModule("tareas") && (
              <NavGroup label="Operaciones">
                <SidebarLink to="/app/manager/tareas" label="Tareas" icon={<ClipboardList className="h-4 w-4" />} onClick={onNav} />
              </NavGroup>
            )}

            {hasModule("asistencia") && (
              <NavGroup label="Equipo">
                <SidebarLink to="/app/manager/asistencia" label="Asistencia" icon={<CalendarCheck className="h-4 w-4" />} onClick={onNav} />
                <SidebarLink to="/app/employee/asistencia" label="Mi Asistencia" icon={<Clock className="h-4 w-4" />} onClick={onNav} />
              </NavGroup>
            )}

            {/* Solo admin ve Configuración y Nómina */}
            {isAdmin && (
              <NavGroup label="Administración">
                <SidebarLink to="/app/manager/configuracion" label="Configuración" icon={<Settings className="h-4 w-4" />} onClick={onNav} />
                {hasModule("nomina") && (
                  <SidebarLink to="/app/manager/nomina" label="Nómina" icon={<Users className="h-4 w-4" />} onClick={onNav} />
                )}
              </NavGroup>
            )}

            <NavGroup label="Cuenta">
              <SidebarLink to="/app/perfil" label="Perfil" icon={<User className="h-4 w-4" />} onClick={onNav} />
            </NavGroup>
          </>
        )}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t">
        <button
          onClick={onLogout}
          className="w-full rounded-2xl border px-3 py-2 text-sm hover:bg-neutral-50 inline-flex items-center justify-center gap-2 transition"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

// ─── AppShell ─────────────────────────────────────────────────────────────────
export default function AppShell() {
  const nav = useNavigate();
  const { user } = auth.get();
  const [mobileOpen, setMobileOpen] = useState(false);
  const role = user?.role ?? "empleado";

  function logout() {
    auth.clear();
    nav("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Topbar */}
      <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-[1400px] px-4 md:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden rounded-2xl border bg-white px-3 py-2 text-sm hover:bg-neutral-50"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex flex-col">
              <Breadcrumbs />
              <div className="text-sm text-neutral-500 hidden sm:block">
                Operación con evidencia (y sin drama).
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <RoleBadge role={role} />
            <div className="hidden sm:flex items-center gap-2 rounded-2xl border bg-white px-3 py-2">
              <div className="h-8 w-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center text-xs font-semibold">
                {(user?.name ?? "U").slice(0, 2).toUpperCase()}
              </div>
              <div className="leading-tight">
                <div className="text-sm font-medium text-neutral-900">{user?.name ?? "Usuario"}</div>
                <div className="text-xs text-neutral-500">{user?.email ?? ""}</div>
              </div>
            </div>
            <button
              onClick={logout}
              className="rounded-2xl border bg-white px-3 py-2 text-sm hover:bg-neutral-50 inline-flex items-center gap-2"
              title="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-4 md:px-6 py-4 flex gap-4">
        {/* Desktop sidebar */}
        <aside className="hidden md:block w-72 shrink-0">
          <div className="rounded-3xl border bg-white shadow-sm overflow-hidden">
            <SidebarContent user={user} role={role} onLogout={logout} />
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <div className="rounded-3xl border bg-white shadow-sm p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-[86%] max-w-sm bg-white shadow-2xl border-r flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="font-semibold">Menú</div>
              <button
                className="rounded-2xl border px-3 py-2 text-sm hover:bg-neutral-50"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SidebarContent
                user={user}
                role={role}
                onNav={() => setMobileOpen(false)}
                onLogout={() => { setMobileOpen(false); logout(); }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}