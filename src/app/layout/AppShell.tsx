// src/layout/AppShell.tsx
import { useState, useEffect } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { auth } from "@/features/auth/store";
import {
  Menu, X, LogOut, LayoutDashboard, ClipboardList,
  CalendarCheck, User, Users,
  Settings, ChevronRight, Bell
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
          "group flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm transition-all duration-200",
          indent && "ml-4 pl-3",
          isActive
            ? "bg-white/10 text-white shadow-sm backdrop-blur-md"
            : "text-white/60 hover:bg-white/5 hover:text-white"
        )
      }
    >
      <span className={cx("shrink-0 transition-colors uppercase", "group-hover:text-white")}>{icon}</span>
      <span className="font-medium tracking-wide">{label}</span>
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
    <div className="space-y-1 mt-6">
      <div className="px-4 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
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
    <div className="flex items-center gap-2 text-[13px] text-neutral-400 font-medium">
      <span className="text-neutral-500 hover:text-neutral-900 transition-colors cursor-default">Kore</span>
      {crumbs.map((c, i) => (
        <span key={`${c}-${i}`} className="flex items-center gap-2">
          <ChevronRight className="h-3.5 w-3.5 text-neutral-300" strokeWidth={3} />
          <span className={cx(
            "transition-colors",
            i === crumbs.length - 1 ? "text-neutral-900 font-bold" : "hover:text-neutral-600 cursor-default"
          )}>{c}</span>
        </span>
      ))}
    </div>
  );
}


// ─── Sidebar content ─────────────────
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
    <div className="flex flex-col h-full bg-obsidian text-white">
      {/* Logo Section */}
      <div className="px-8 py-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-white shadow-xl shadow-black/20 flex items-center justify-center text-obsidian font-black text-xl italic">
            K
          </div>
          <div>
            <div className="text-xl font-black tracking-tighter leading-none">Kore</div>
            <div className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] mt-1">Ops Suite</div>
          </div>
        </div>
      </div>

      {/* Nav Section */}
      <nav className="flex-1 overflow-y-auto px-4 pb-6 scrollbar-hide">
        {isEmployee ? (
          <div className="space-y-1">
             <NavGroup label="Principal">
              <SidebarLink to="/app/employee/dashboard" label="Dashboard" icon={<LayoutDashboard className="h-4.5 w-4.5" />} onClick={onNav} />
              <SidebarLink to="/app/employee/mis-tareas/asignaciones" label="Mi Agenda" icon={<ClipboardList className="h-4.5 w-4.5" />} onClick={onNav} />
              <SidebarLink to="/app/employee/asistencia" label="Asistencia" icon={<CalendarCheck className="h-4.5 w-4.5" />} onClick={onNav} />
            </NavGroup>
            <NavGroup label="Usuario">
              <SidebarLink to="/app/perfil" label="Mi Perfil" icon={<User className="h-4.5 w-4.5" />} onClick={onNav} />
            </NavGroup>
          </div>
        ) : (
          <div className="space-y-1">
            <NavGroup label="Principal">
              <SidebarLink to="/app/manager/dashboard" label="Dashboard" icon={<LayoutDashboard className="h-4.5 w-4.5" />} onClick={onNav} />
            </NavGroup>

            {hasModule("tareas") && (
              <NavGroup label="Operaciones">
                <SidebarLink to="/app/manager/tareas" label="Tareas" icon={<ClipboardList className="h-4.5 w-4.5" />} onClick={onNav} />
              </NavGroup>
            )}

            {(hasModule("asistencia") || hasModule("nomina")) && (
              <NavGroup label="Gestión">
                {hasModule("asistencia") && <SidebarLink to="/app/manager/asistencia" label="Asistencia" icon={<CalendarCheck className="h-4.5 w-4.5" />} onClick={onNav} />}
                {isAdmin && hasModule("nomina") && <SidebarLink to="/app/manager/nomina" label="Nómina" icon={<Users className="h-4.5 w-4.5" />} onClick={onNav} />}
                <SidebarLink to="/app/manager/usuarios" label="Equipo" icon={<Users className="h-4.5 w-4.5" />} onClick={onNav} />
              </NavGroup>
            )}

            <NavGroup label="Sistema">
              {isAdmin && <SidebarLink to="/app/manager/configuracion" label="Ajustes" icon={<Settings className="h-4.5 w-4.5" />} onClick={onNav} />}
              <SidebarLink to="/app/perfil" label="Mi Perfil" icon={<User className="h-4.5 w-4.5" />} onClick={onNav} />
            </NavGroup>
          </div>
        )}
      </nav>

      {/* Footer / User Profile Summary */}
      <div className="p-4 border-t border-white/5 space-y-4">
        <div className="flex items-center gap-3 px-2">
           <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-white/20 to-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-white shadow-inner">
            {(user?.name ?? "U")[0].toUpperCase()}
          </div>
          <div className="min-w-0">
             <div className="text-[13px] font-bold text-white truncate leading-tight">{user?.name ?? "Usuario"}</div>
             <div className="text-[10px] font-medium text-white/40 truncate mt-0.5">{role === 'admin' ? 'Operations Manager' : 'Staff'}</div>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full h-11 rounded-xl bg-white/5 text-white/70 text-[13px] font-bold hover:bg-white/10 hover:text-white inline-flex items-center justify-center gap-2 transition-all duration-300 group"
        >
          <LogOut className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}

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
    <div className="min-h-screen bg-bone flex overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:block w-72 shrink-0 h-screen fixed">
        <SidebarContent user={user} role={role} onLogout={logout} />
      </aside>

      <div className="flex-1 flex flex-col lg:ml-72 min-h-screen relative">
        {/* Top Header */}
        <header className="h-20 flex items-center justify-between px-6 lg:px-10 z-10">
          <div className="flex items-center gap-6">
            <button
              className="lg:hidden h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center border border-neutral-100"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5 text-neutral-800" />
            </button>
            <Breadcrumbs />
          </div>

          <div className="flex items-center gap-4 lg:gap-6">
             <button className="h-10 w-10 rounded-xl bg-white flex items-center justify-center border border-neutral-100 shadow-sm hover:bg-neutral-50 transition-colors relative">
               <Bell className="h-4.5 w-4.5 text-neutral-700" />
               <span className="absolute top-2.5 right-2.5 h-1.5 w-1.5 rounded-full bg-rose-500 border-2 border-white" />
             </button>
             <button
               onClick={() => nav(role === 'admin' ? '/app/manager/configuracion' : '/app/perfil')}
               className="h-10 w-10 rounded-xl bg-white flex items-center justify-center border border-neutral-100 shadow-sm hover:bg-neutral-50 transition-colors"
             >
               <Settings className="h-4.5 w-4.5 text-neutral-700" />
             </button>
             
             <div className="h-8 w-px bg-neutral-200 mx-1 hidden sm:block" />

             <div className="hidden sm:flex items-center gap-3">
               <div className="text-right">
                 <div className="text-[13px] font-bold text-neutral-900 leading-none">{user?.name ?? "Usuario"}</div>
                 <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mt-1.5">{role === 'admin' ? 'Operations Manager' : 'Staff'}</div>
               </div>
               <div className="h-10 w-10 rounded-xl bg-neutral-200 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
                 <User className="h-6 w-6 text-neutral-400 mt-2" />
               </div>
             </div>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="flex-1 p-6 lg:p-10 pt-4 overflow-y-auto">
          {/* Internal main-card container effect */}
          <div className="min-h-[calc(100vh-160px)]">
             <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-obsidian/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-[280px] bg-obsidian animate-out-in shadow-2xl">
            <div className="flex justify-end p-4">
               <button onClick={() => setMobileOpen(false)} className="text-white/40 hover:text-white transition-colors">
                 <X className="h-6 w-6" />
               </button>
            </div>
            <SidebarContent user={user} role={role} onNav={() => setMobileOpen(false)} onLogout={() => { setMobileOpen(false); logout(); }} />
          </div>
        </div>
      )}
    </div>
  );
}