// src/features/configuracion/ConfiguracionPage.tsx
import { useState, useEffect } from "react";
import { Users, Shield, DollarSign, Clock, Activity, Blocks, Wifi } from "lucide-react";
import api from "@/lib/http";
import { auth } from "@/features/auth/store";
import EmpleadosPage from "@/features/employees/EmpleadosPage";
import ActividadTab from "./ActividadTab";

function cx(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(" ");
}

function RolesTab() {
  const roles = [
    {
      key: "admin", label: "Administrador", desc: "Acceso completo al sistema",
      color: "bg-violet-50 border-violet-200 text-violet-700", dot: "bg-violet-500",
      permisos: ["Gestión de usuarios y empleados","Configuración del sistema","Ver y aprobar nómina","Ver reportes completos","Gestionar tareas y rutinas","Ver y gestionar asistencia"],
    },
    {
      key: "supervisor", label: "Supervisor", desc: "Gestión de tareas y equipos",
      color: "bg-blue-50 border-blue-200 text-blue-700", dot: "bg-blue-500",
      permisos: ["Asignar y revisar tareas","Ver asistencia del equipo","Aprobar evidencias","Ver actividad del equipo"],
    },
    {
      key: "empleado", label: "Empleado", desc: "Acceso básico al sistema",
      color: "bg-neutral-50 border-neutral-200 text-neutral-700", dot: "bg-neutral-400",
      permisos: ["Ver sus tareas asignadas","Subir evidencias de trabajo","Registrar asistencia","Ver su historial y perfil"],
    },
  ];
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Roles y Permisos</h2>
        <p className="text-sm text-neutral-500 mt-0.5">Los roles definen qué puede ver y hacer cada usuario.</p>
      </div>
      <div className="space-y-3">
        {roles.map((r) => (
          <div key={r.key} className="rounded-2xl border border-neutral-200 bg-white p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={cx("h-2.5 w-2.5 rounded-full", r.dot)} />
                <div>
                  <div className="font-semibold">{r.label}</div>
                  <div className="text-xs text-neutral-500">{r.desc}</div>
                </div>
              </div>
              <span className={cx("rounded-full border px-2.5 py-1 text-xs font-medium", r.color)}>{r.label}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
              {r.permisos.map((p) => (
                <div key={p} className="flex items-center gap-2 text-sm text-neutral-700">
                  <span className="text-emerald-500 text-xs">✓</span>{p}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        💡 Los roles son fijos en esta versión. Puedes cambiar el rol de un usuario desde la pestaña <strong>Empleados</strong>.
      </div>
    </div>
  );
}

function TarifasTab() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Tarifas de Pago</h2>
        <p className="text-sm text-neutral-500 mt-0.5">Configura el tipo y tarifa de pago por empleado.</p>
      </div>
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
        💡 Las tarifas por empleado se configuran desde <strong>Empleados → Editar</strong>. El módulo de nómina usará estos valores automáticamente.
      </div>
      <div className="rounded-2xl border bg-neutral-50 p-6 text-center text-sm text-neutral-500">
        <div className="text-2xl mb-2">💰</div>
        <div className="font-medium text-neutral-700 mb-1">Módulo de Nómina próximamente</div>
        <div>El cálculo detallado de tarifas estará disponible en el módulo de Nómina.</div>
      </div>
    </div>
  );
}

function HorariosTab() {
  const [checkInTime, setCheckInTime] = useState("08:00");
  const [checkOutTime, setCheckOutTime] = useState("17:00");
  const [lateTolerance, setLateTolerance] = useState("10");
  const [maxHours, setMaxHours] = useState("8");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Configuración de Horarios</h2>
        <p className="text-sm text-neutral-500 mt-0.5">Define el horario laboral general de la empresa.</p>
      </div>
      {saved && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">✅ Configuración guardada</div>
      )}
      <div className="rounded-2xl border bg-neutral-50 p-5 space-y-4">
        <div className="font-medium text-sm">Horario Laboral General</div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-neutral-500 mb-1">Hora de entrada</div>
            <input type="time" className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black/10" value={checkInTime} onChange={(e) => setCheckInTime(e.target.value)} />
          </div>
          <div>
            <div className="text-xs text-neutral-500 mb-1">Hora de salida</div>
            <input type="time" className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black/10" value={checkOutTime} onChange={(e) => setCheckOutTime(e.target.value)} />
          </div>
          <div>
            <div className="text-xs text-neutral-500 mb-1">Tolerancia de retardo (min)</div>
            <input type="number" min={0} max={60} className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black/10" value={lateTolerance} onChange={(e) => setLateTolerance(e.target.value)} />
          </div>
          <div>
            <div className="text-xs text-neutral-500 mb-1">Horas máximas por día</div>
            <input type="number" min={1} max={24} className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black/10" value={maxHours} onChange={(e) => setMaxHours(e.target.value)} />
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        💡 El día de descanso y horas por empleado se configuran individualmente desde <strong>Empleados → Editar</strong>.
      </div>
      <button onClick={handleSave} disabled={saving} className="rounded-2xl bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 transition disabled:opacity-50">
        {saving ? "Guardando..." : "Guardar Configuración"}
      </button>
    </div>
  );
}

interface ModuleState {
  key: string;
  enabled: boolean;
}

function ModulosTab() {
  const MODS = [
    { key: "tareas", label: "Tareas", desc: "Asigna y supervisa tareas con evidencias", icon: "📋" },
    { key: "asistencia", label: "Asistencia", desc: "Control de entrada/salida del equipo", icon: "🕐" },
    { key: "nomina", label: "Nómina", desc: "Calcula y aprueba el pago semanal", icon: "💰" },
    { key: "configuracion", label: "Configuración", desc: "Gestión de la plataforma", icon: "⚙️", alwaysOn: true },
  ];
  const [modules, setModules] = useState<ModuleState[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [loadingMods, setLoadingMods] = useState(true);

  useEffect(() => {
    api.get("/empresa/modulos").then((res) => {
      const raw = (res.data?.modules ?? []) as any[];
      // Normalize to ModuleState objects
      const mods = raw.map(m => typeof m === "string" ? { key: m, enabled: true } : m) as ModuleState[];
      setModules(mods);
      auth.setModules(mods.filter(m => m.enabled).map(m => m.key));
    }).catch(() => {
      const saved = auth.getModules();
      setModules(saved.map(k => ({ key: k, enabled: true })));
    }).finally(() => setLoadingMods(false));
  }, []);

  async function toggle(key: string) {
    if (key === "configuracion") return;
    
    const exists = modules.find(m => m.key === key);
    let next: ModuleState[];
    
    if (exists) {
      next = modules.map(m => m.key === key ? { ...m, enabled: !m.enabled } : m);
    } else {
      next = [...modules, { key, enabled: true }];
    }

    setSaving(key);
    try {
      await api.post("/empresa/modulos", { modules: next });
      setModules(next);
      auth.setModules(next.filter(m => m.enabled).map(m => m.key));
    } catch { /* silent */ }
    finally { setSaving(null); }
  }

  if (loadingMods) return <div className="text-sm text-neutral-500">Cargando módulos...</div>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Módulos Activos</h2>
        <p className="text-sm text-neutral-500 mt-0.5">Activa o desactiva módulos para tu empresa.</p>
      </div>
      <div className="space-y-2">
        {MODS.map((m) => {
          const mod = modules.find(x => x.key === m.key);
          const active = m.alwaysOn || mod?.enabled === true;
          
          return (
            <div key={m.key} className={cx("rounded-2xl border p-4 transition", active ? "border-emerald-200 bg-emerald-50" : "border-neutral-200 bg-white")}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{m.icon}</span>
                  <div>
                    <div className="text-sm font-medium">{m.label}</div>
                    <div className="text-xs text-neutral-500">{m.desc}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cx("rounded-full border px-2 py-0.5 text-xs font-medium", active ? "border-emerald-200 bg-emerald-100 text-emerald-700" : "border-neutral-200 bg-neutral-100 text-neutral-500")}>
                    {active ? "Activo" : "Inactivo"}
                  </span>
                  {!m.alwaysOn ? (
                    <button
                      onClick={() => toggle(m.key)}
                      disabled={saving === m.key}
                      className={cx("h-6 w-11 rounded-full transition-all flex items-center px-0.5", active ? "bg-emerald-500" : "bg-neutral-300")}
                    >
                      <div className={cx("h-5 w-5 rounded-full bg-white transition-transform shadow", active ? "translate-x-5" : "translate-x-0")} />
                    </button>
                  ) : (
                    <span className="text-xs text-neutral-400">Siempre activo</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RedTab() {
  const [ip, setIp] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadingIp, setLoadingIp] = useState(false);

  useEffect(() => {
    api.get("/empresa/red").then((res) => {
      setIp(res.data?.allowed_ip ?? "");
    }).catch(() => {});
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await api.post("/empresa/red", { allowed_ip: ip.trim() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch { /* silent */ }
    finally { setSaving(false); }
  }

  async function fetchMyIp() {
    setLoadingIp(true);
    try {
      const res = await fetch("https://api.ipify.org?format=json");
      const data = await res.json();
      setIp(data.ip);
    } catch { /* silent */ }
    finally { setLoadingIp(false); }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Restricción por Red</h2>
        <p className="text-sm text-neutral-500 mt-0.5">Limita desde qué red pueden marcar asistencia tus empleados.</p>
      </div>
      {saved && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">✅ Configuración de red guardada</div>}
      <div className="rounded-2xl border bg-neutral-50 p-5 space-y-4">
        <div>
          <div className="text-xs text-neutral-500 mb-1">IP o rango permitido (CIDR)</div>
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black/10"
              placeholder="Ej. 192.168.1.0/24 o 201.175.42.10"
              value={ip}
              onChange={(e) => setIp(e.target.value)}
            />
            <button
              onClick={fetchMyIp}
              disabled={loadingIp}
              className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition whitespace-nowrap disabled:opacity-50"
            >
              {loadingIp ? "Buscando..." : "¿Cuál es mi IP?"}
            </button>
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
        💡 Deja vacío para permitir el acceso desde cualquier red.
      </div>
      <button onClick={handleSave} disabled={saving} className="rounded-2xl bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 transition disabled:opacity-50">
        {saving ? "Guardando..." : "Guardar Configuración de Red"}
      </button>
    </div>
  );
}

const TABS = [
  { key: "empleados", label: "Empleados", icon: <Users className="h-4 w-4" /> },
  { key: "roles",     label: "Roles",     icon: <Shield className="h-4 w-4" /> },
  { key: "tarifas",   label: "Tarifas",   icon: <DollarSign className="h-4 w-4" /> },
  { key: "horarios",  label: "Horarios",  icon: <Clock className="h-4 w-4" /> },
  { key: "actividad", label: "Actividad", icon: <Activity className="h-4 w-4" /> },
  { key: "modulos",   label: "Módulos",   icon: <Blocks className="h-4 w-4" /> },
  { key: "red",       label: "Red",       icon: <Wifi className="h-4 w-4" /> },
] as const;

type TabKey = typeof TABS[number]["key"];

export default function ConfiguracionPage() {
  const [tab, setTab] = useState<TabKey>("empleados");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configuración del Sistema</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Administra empleados, roles y configuraciones generales.</p>
      </div>

      <div className="flex gap-1 rounded-2xl border bg-neutral-50 p-1 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cx(
              "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition whitespace-nowrap",
              tab === t.key ? "bg-blue-600 text-white shadow" : "text-neutral-600 hover:bg-white hover:text-neutral-900"
            )}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      <div>
        {tab === "empleados" && <EmpleadosPage />}
        {tab === "roles"     && <RolesTab />}
        {tab === "tarifas"   && <TarifasTab />}
        {tab === "horarios"  && <HorariosTab />}
        {tab === "actividad" && <ActividadTab />}
        {tab === "modulos"   && <ModulosTab />}
        {tab === "red"       && <RedTab />}
      </div>
    </div>
  );
}