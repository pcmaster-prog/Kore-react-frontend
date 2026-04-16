// src/features/configuracion/ConfiguracionPage.tsx
import { useState, useEffect } from "react";
import { Users, Shield, DollarSign, Clock, Activity, Blocks, Wifi, AlertTriangle, CheckCircle2, Loader2, FileText, Trash2 } from "lucide-react";
import api from "@/lib/http";
import { auth } from "@/features/auth/store";
import EmpleadosPage from "@/features/employees/EmpleadosPage";
import ActividadTab from "./ActividadTab";
import SemaforoAdminTab from "@/features/semaforo/SemaforoAdminTab";

function cx(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(" ");
}

function RolesTab() {
  const roles = [
    {
      key: "admin", label: "Administrador", desc: "Acceso completo y configuración global",
      color: "bg-violet-50 border-violet-100 text-violet-600", dot: "bg-violet-500", icon: <Shield className="h-5 w-5" />,
      permisos: ["Gestión total de empleados y parámetros", "Configuración de módulos y seguridad", "Visualización de nómina y reportes", "Operaciones sobre tareas de todo el equipo"],
    },
    {
      key: "supervisor", label: "Supervisor", desc: "Liderazgo de equipos y operaciones",
      color: "bg-blue-50 border-blue-100 text-blue-600", dot: "bg-blue-500", icon: <Users className="h-5 w-5" />,
      permisos: ["Asignación de tareas y rutinas recurrentes", "Visualización de asistencia de su equipo", "Aprobación o rechazo de evidencias", "Revisión de la actividad general de operaciones"],
    },
    {
      key: "empleado", label: "Empleado", desc: "Registro operativo y consultas personales",
      color: "bg-neutral-50 border-neutral-100 text-neutral-500", dot: "bg-neutral-400", icon: <Activity className="h-5 w-5" />,
      permisos: ["Visualización de tareas asignadas para hoy", "Envío de evidencias fotográficas", "Entrada y salida de asistencia personal", "Consulta de historial y perfil"],
    },
  ];

  return (
    <div className="rounded-[40px] border border-neutral-100 bg-white shadow-sm overflow-hidden animate-in-up">
      <div className="px-8 py-6 border-b border-neutral-50 bg-neutral-50/50 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-obsidian tracking-tight">Roles del Sistema</h2>
          <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mt-1">Niveles de permisos y visibilidad</p>
        </div>
      </div>
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roles.map((r) => (
            <div key={r.key} className="rounded-[28px] border border-neutral-100 bg-white overflow-hidden hover:shadow-lg hover:shadow-obsidian/5 transition-all group">
              <div className={cx("p-6 border-b border-neutral-100 flex items-center gap-4 transition-colors", r.color)}>
                <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                  {r.icon}
                </div>
                <div>
                  <div className="font-black text-lg tracking-tight">{r.label}</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest opacity-70 mt-0.5">{r.key}</div>
                </div>
              </div>
              <div className="p-6">
                <p className="text-sm font-medium text-neutral-500 mb-4">{r.desc}</p>
                <div className="space-y-3">
                  {r.permisos.map((p, i) => (
                    <div key={i} className="flex gap-3 text-sm font-medium text-neutral-700">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="leading-snug">{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-medium text-blue-700 flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0">
            <span className="text-sm">💡</span>
          </div>
          Los permisos son pre-establecidos para mantener la seguridad estructural de Kore. Puedes cambiar el rol de un usuario desde la pestaña de Empleados.
        </div>
      </div>
    </div>
  );
}

function TarifasTab() {
  return (
    <div className="rounded-[40px] border border-neutral-100 bg-white shadow-sm overflow-hidden animate-in-up">
      <div className="px-8 py-6 border-b border-neutral-50 bg-neutral-50/50">
        <h2 className="text-xl font-black text-obsidian tracking-tight">Tarifas y Remuneración</h2>
        <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mt-1">Gestión financiera de recursos humanos</p>
      </div>
      <div className="p-16 flex flex-col items-center justify-center text-center">
        <div className="h-20 w-20 rounded-[24px] bg-gradient-to-tr from-emerald-100 to-emerald-50 border border-emerald-200 flex items-center justify-center shadow-inner mb-6">
          <DollarSign className="h-10 w-10 text-emerald-600" />
        </div>
        <h3 className="text-2xl font-black text-obsidian tracking-tight mb-2">Centralizado en Nómina</h3>
        <p className="text-neutral-500 max-w-md font-medium">
          Las tarifas se asignan de forma individual al crear o editar el perfil de cada empleado en la lista principal. El cálculo final automatizado se realiza desde el <strong>Módulo de Nómina</strong>.
        </p>
      </div>
    </div>
  );
}

function HorariosTab() {
  const [checkInTime, setCheckInTime] = useState("08:30");
  const [checkOutTime, setCheckOutTime] = useState("17:00");
  const [lateTolerance, setLateTolerance] = useState("10");
  const [maxHours, setMaxHours] = useState("8");
  const [weekStart, setWeekStart] = useState("0");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get("/empresa/settings/operativo")
      .then((res) => {
        const o = res.data.operativo;
        if (o) {
          setCheckInTime(o.check_in_time);
          setCheckOutTime(o.check_out_time);
          setLateTolerance(o.late_tolerance.toString());
          setMaxHours(o.max_hours.toString());
        }
        const c = res.data.calendar;
        if (c && c.week_start !== undefined) {
          setWeekStart(c.week_start.toString());
        }
      })
      .catch((err) => console.error("Error loading settings", err))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await Promise.all([
        api.patch("/empresa/settings/operativo", {
          check_in_time: checkInTime,
          check_out_time: checkOutTime,
          late_tolerance: parseInt(lateTolerance),
          max_hours: parseInt(maxHours)
        }),
        api.patch("/empresa/settings/calendar", {
          week_start: parseInt(weekStart)
        })
      ]);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error("Error saving settings", err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="rounded-[40px] border border-neutral-100 bg-white p-16 flex flex-col items-center gap-3">
      <Loader2 className="h-10 w-10 text-obsidian animate-spin" />
      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Cargando esquema...</span>
    </div>
  );

  return (
    <div className="rounded-[40px] border border-neutral-100 bg-white shadow-sm overflow-hidden animate-in-up">
      <div className="px-8 py-6 border-b border-neutral-50 bg-neutral-50/50 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-obsidian tracking-tight">Esquema Operativo</h2>
          <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mt-1">Horarios laborables y tolerancias</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="rounded-2xl bg-obsidian px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-neutral-800 hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2">
          {saving ? <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Clock className="h-4 w-4" />}
          Guardar Cambios
        </button>
      </div>
      
      <div className="p-8 space-y-6">
        {saved && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-800 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5" /> Configuración global de horarios actualizada.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="rounded-[28px] border border-neutral-100 bg-neutral-50/50 p-6 space-y-6">
            <div className="flex items-center gap-3 pb-2 border-b border-neutral-100">
              <Clock className="h-5 w-5 text-neutral-400" />
              <h3 className="text-sm font-bold text-obsidian uppercase tracking-widest">Jornada Standard</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Hora de Entrada</label>
                <input type="time" className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-obsidian/10 transition-all" value={checkInTime} onChange={(e) => setCheckInTime(e.target.value)} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Hora de Salida</label>
                <input type="time" className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-obsidian/10 transition-all" value={checkOutTime} onChange={(e) => setCheckOutTime(e.target.value)} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Inicio de Semana</label>
                <select className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-obsidian/10 transition-all" value={weekStart} onChange={(e) => setWeekStart(e.target.value)}>
                  <option value="0">Domingo</option>
                  <option value="1">Lunes</option>
                  <option value="2">Martes</option>
                  <option value="3">Miércoles</option>
                  <option value="4">Jueves</option>
                  <option value="5">Viernes</option>
                  <option value="6">Sábado</option>
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-neutral-100 bg-neutral-50/50 p-6 space-y-6">
            <div className="flex items-center gap-3 pb-2 border-b border-neutral-100">
              <Activity className="h-5 w-5 text-neutral-400" />
              <h3 className="text-sm font-bold text-obsidian uppercase tracking-widest">Regulaciones</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Tolerancia (min)</label>
                <input type="number" min={0} max={60} className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-obsidian/10 transition-all" value={lateTolerance} onChange={(e) => setLateTolerance(e.target.value)} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Jornada máx (Hrs)</label>
                <input type="number" min={1} max={24} className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-obsidian/10 transition-all" value={maxHours} onChange={(e) => setMaxHours(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-medium text-blue-700 flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0">
            <span className="text-sm">💡</span>
          </div>
          Excepciones locales: Los días de descanso semanal y tarifas específicas aplican a nivel de contrato individual en Empleados.
        </div>
      </div>
    </div>
  );
}

interface ModuleState {
  key: string;
  enabled: boolean;
}

function ModulosTab() {
  const MODS = [
    { key: "tareas", label: "Módulo de Tareas", desc: "Digitalización de checklist, plantillas, evidencias fotográficas y rutinas diarias", icon: "📋", theme: "emerald" },
    { key: "asistencia", label: "Reloj Checador", desc: "Registro inteligente de jornadas, ingresos, escapes geolocalizados y pausas", icon: "🕒", theme: "amber" },
    { key: "nomina", label: "Nómina Automática", desc: "Integración de asistencia y salarios para el pre-cálculo financiero", icon: "💰", theme: "violet" },
    { key: "configuracion", label: "SysAdmin", desc: "Panel rector de comportamientos globales y seguridad inquebrantable", icon: "🛡️", theme: "obsidian", alwaysOn: true },
  ];
  const [modules, setModules] = useState<ModuleState[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [loadingMods, setLoadingMods] = useState(true);

  useEffect(() => {
    api.get("/empresa/modulos").then((res) => {
      const raw = (Array.isArray(res.data) ? res.data : res.data?.modules ?? []) as any[];
      const mods = raw.map(m => typeof m === "string" ? { key: m, enabled: true } : { key: m.slug ?? m.key, enabled: m.enabled === true }) as ModuleState[];
      setModules(mods);
      auth.setModules(mods.filter(m => m.enabled).map(m => m.key));
      window.dispatchEvent(new Event("kore-modules-updated"));
    }).catch(() => {
      const saved = auth.getModules();
      setModules(saved.map(k => ({ key: k, enabled: true })));
    }).finally(() => setLoadingMods(false));
  }, []);

  async function toggle(key: string) {
    if (key === "configuracion") return;
    const exists = modules.find(m => m.key === key);
    const enabled = !exists?.enabled;
    let next: ModuleState[];
    if (exists) { next = modules.map(m => m.key === key ? { ...m, enabled } : m); }
    else { next = [...modules, { key, enabled }]; }

    setSaving(key);
    try {
      await api.post("/empresa/modulos", { module_slug: key, enabled });
      setModules(next);
      auth.setModules(next.filter(m => m.enabled).map(m => m.key));
      window.dispatchEvent(new Event("kore-modules-updated"));
    } catch { /* silent */ }
    finally { setSaving(null); }
  }

  if (loadingMods) return (
    <div className="rounded-[40px] border border-neutral-100 bg-white p-16 flex flex-col items-center gap-3">
      <div className="h-10 w-10 border-4 border-neutral-100 border-t-obsidian rounded-full animate-spin" />
      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Sincronizando Sistema...</span>
    </div>
  );

  return (
    <div className="rounded-[40px] border border-neutral-100 bg-white shadow-sm overflow-hidden animate-in-up">
      <div className="px-8 py-6 border-b border-neutral-50 bg-neutral-50/50">
        <h2 className="text-xl font-black text-obsidian tracking-tight">Capacidades del Ecosistema</h2>
        <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mt-1">Activa las herramientas de la suite kore</p>
      </div>
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {MODS.map((m) => {
            const mod = modules.find(x => x.key === m.key);
            const active = m.alwaysOn || mod?.enabled === true;
            
            return (
              <div key={m.key} className={cx(
                "rounded-[28px] border overflow-hidden transition-all duration-300 relative group",
                active ? "border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50/60 hover:shadow-lg hover:shadow-emerald-500/5" : "border-neutral-200 bg-white opacity-80 hover:opacity-100"
              )}>
                {active && !m.alwaysOn && <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-bl from-emerald-200/40 to-transparent pointer-events-none" />}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-14 w-14 rounded-2xl bg-white border border-neutral-100 shadow-sm flex items-center justify-center text-3xl">
                      {m.icon}
                    </div>
                    <div>
                      {!m.alwaysOn ? (
                        <button
                          onClick={() => toggle(m.key)}
                          disabled={saving === m.key}
                          className={cx(
                            "h-8 w-14 rounded-full transition-all flex items-center px-1 border",
                            active ? "bg-emerald-500 border-emerald-600 shadow-inner" : "bg-neutral-200 border-neutral-300"
                          )}
                        >
                          <div className={cx(
                            "h-6 w-6 rounded-full bg-white transition-transform duration-300 shadow flex flex-col items-center justify-center",
                            active ? "translate-x-6" : "translate-x-0"
                          )}>
                            {saving === m.key && <Loader2 className="h-3 w-3 animate-spin text-neutral-400" />}
                          </div>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-xl border border-obsidian bg-obsidian text-white px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider">
                          🛡️ Core Activo
                        </span>
                      )}
                    </div>
                  </div>
                  <h3 className="text-lg font-black text-obsidian tracking-tight mb-1">{m.label}</h3>
                  <p className="text-sm font-medium text-neutral-500 line-clamp-2">{m.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
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
    api.get("/empresa/red").then((res) => { setIp(res.data?.allowed_ip ?? ""); }).catch(() => {});
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
    <div className="rounded-[40px] border border-neutral-100 bg-white shadow-sm overflow-hidden animate-in-up">
      <div className="px-8 py-6 border-b border-neutral-50 bg-neutral-50/50 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-obsidian tracking-tight">Geocerca Virtual & Redes</h2>
          <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mt-1">Seguridad de accesos e IPs</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="rounded-2xl bg-obsidian px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-neutral-800 hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2">
          {saving ? <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Shield className="h-4 w-4" />}
          Blindar Red
        </button>
      </div>

      <div className="p-8 space-y-6">
        {saved && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-800 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5" /> Reglas de red aplicadas correctamente.
          </div>
        )}
        
        <div className="rounded-[28px] border border-neutral-100 bg-neutral-50/50 p-8 space-y-6">
          <div className="flex items-center gap-4 pb-4 border-b border-neutral-100">
            <div className="h-12 w-12 rounded-2xl bg-white border border-neutral-100 flex items-center justify-center shadow-sm">
              <Wifi className="h-6 w-6 text-neutral-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-obsidian uppercase tracking-widest">Lista Blanca (Whitelist)</h3>
              <p className="text-xs font-medium text-neutral-500 mt-0.5">Controla quién puede operar la caja o el reloj</p>
            </div>
          </div>
          
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Dirección IP o Rango (CIDR)</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                className="flex-1 rounded-2xl border border-neutral-200 bg-white px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-obsidian/10 font-mono tracking-wider transition-all placeholder:text-neutral-300 placeholder:font-sans"
                placeholder="Ej. 192.168.1.0/24 o 201.175.42.10"
                value={ip}
                onChange={(e) => setIp(e.target.value)}
              />
              <button
                onClick={fetchMyIp}
                disabled={loadingIp}
                className="rounded-2xl border border-neutral-200 bg-white px-6 py-4 text-xs font-bold text-neutral-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all uppercase tracking-widest disabled:opacity-50"
              >
                {loadingIp ? "Rastreando..." : "¿Cuál es mi IP?"}
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-700 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          Advertencia: Al definir una IP, bloquearás todo tráfico que no provenga de esa locación. Déjalo en blanco para omitir restricciones globales.
        </div>
      </div>
    </div>
  );
}

function DocumentosTab() {
  const [documentos, setDocumentos] = useState<Array<{
    nombre: string;
    url: string;
    size: number;
    uploaded_at: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  function showToast(type: "ok" | "err", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    api.get("/empresa/documentos")
      .then(res => setDocumentos(res.data?.documentos ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      showToast("err", "Solo se permiten archivos PDF");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast("err", "El archivo no puede superar 10MB");
      return;
    }

    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await api.post("/empresa/documentos", form, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setDocumentos(res.data?.documentos ?? []);
      showToast("ok", "Documento subido correctamente");
    } catch (e: any) {
      showToast("err", e?.response?.data?.message ?? "Error al subir documento");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDelete(index: number) {
    if (!confirm("¿Eliminar este documento?")) return;
    try {
      const res = await api.delete(`/empresa/documentos/${index}`);
      setDocumentos(res.data?.documentos ?? []);
      showToast("ok", "Documento eliminado");
    } catch {
      showToast("err", "No se pudo eliminar");
    }
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="space-y-6 animate-in-up">
      {toast && (
        <div className={cx(
          "rounded-2xl border px-5 py-3 text-sm font-bold flex items-center gap-3",
          toast.type === "ok" ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-rose-50 border-rose-100 text-rose-700"
        )}>
          {toast.type === "ok" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      <div className="rounded-[40px] border border-neutral-100 bg-white shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-neutral-50 bg-neutral-50/50 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-obsidian tracking-tight">Documentos de Bienvenida</h2>
            <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mt-1">Gestión de archivos adjuntos para nuevos ingresos</p>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Zona de upload */}
          <div className="rounded-[32px] border-2 border-dashed border-neutral-100 bg-neutral-50/30 p-10 text-center group hover:border-obsidian/20 transition-all">
            <div className="h-20 w-20 rounded-[28px] bg-white border border-neutral-100 flex items-center justify-center shadow-sm mx-auto mb-6 group-hover:scale-110 transition-transform">
              <FileText className="h-10 w-10 text-neutral-300" />
            </div>
            <div className="max-w-xs mx-auto">
              <div className="text-sm font-black text-obsidian tracking-tight mb-1">
                {uploading ? "Subiendo documento..." : "Subir documento PDF"}
              </div>
              <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-6">
                Solo archivos PDF hasta 10MB
              </p>
              
              <label className={cx(
                "inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold shadow-md transition-all cursor-pointer",
                uploading
                  ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                  : "bg-obsidian text-white hover:bg-gold hover:shadow-lg"
              )}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                {uploading ? "Sincronizando..." : "Agregar documento"}
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handleUpload}
                  disabled={uploading}
                />
              </label>
            </div>
          </div>

          {/* Lista de documentos */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-neutral-50">
              <FileText className="h-4 w-4 text-neutral-300" />
              <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em]">Archivos en el Sistema</h3>
            </div>

            {loading ? (
              <div className="py-12 flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 text-neutral-200 animate-spin" />
                <span className="text-[10px] font-bold text-neutral-300 uppercase tracking-widest">Consultando archivos...</span>
              </div>
            ) : documentos.length === 0 ? (
              <div className="rounded-3xl border border-neutral-50 bg-neutral-50/20 p-12 text-center">
                <div className="text-3xl mb-4 opacity-20">📂</div>
                <p className="text-sm font-medium text-neutral-400">No hay documentos configurados.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {documentos.map((doc, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-neutral-100 bg-white p-4 flex items-center justify-between hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-neutral-50 flex items-center justify-center text-rose-500 font-black text-xs border border-neutral-100">
                        PDF
                      </div>
                      <div>
                        <div className="text-sm font-black text-obsidian tracking-tight line-clamp-1">{doc.nombre}</div>
                        <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5">
                          {formatSize(doc.size)} · {new Date(doc.uploaded_at).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl border border-neutral-100 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:bg-neutral-50 transition"
                      >
                        Ver
                      </a>
                      <button
                        onClick={() => handleDelete(index)}
                        className="h-9 w-9 rounded-xl border border-rose-100 text-rose-500 flex items-center justify-center hover:bg-rose-50 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-[32px] border border-blue-100 bg-blue-50/50 p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white border border-blue-100 flex items-center justify-center text-2xl shadow-sm shrink-0">
              💡
            </div>
            <p className="text-sm font-medium text-blue-700 leading-relaxed">
              Los documentos se enviarán <strong>automáticamente</strong> adjuntos en el correo de bienvenida de cada nuevo empleado. Recomendamos subir el reglamento interno, contratos o protocolos de operación.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const TABS = [
  { key: "empleados", label: "Equipo", icon: <Users className="h-4 w-4" /> },
  { key: "roles",     label: "Roles",     icon: <Shield className="h-4 w-4" /> },
  { key: "horarios",  label: "Horarios",  icon: <Clock className="h-4 w-4" /> },
  { key: "documentos", label: "Documentos", icon: <FileText className="h-4 w-4" /> },
  { key: "tarifas",   label: "Nómina",   icon: <DollarSign className="h-4 w-4" /> },
  { key: "modulos",   label: "Capacidades",   icon: <Blocks className="h-4 w-4" /> },
  { key: "red",       label: "Seguridad",       icon: <Wifi className="h-4 w-4" /> },
  { key: "semaforo",  label: "Semáforo",  icon: <Activity className="h-4 w-4" /> },
  { key: "actividad", label: "Auditoría", icon: <Activity className="h-4 w-4" /> },
] as const;

type TabKey = typeof TABS[number]["key"];

export default function ConfiguracionPage() {
  const [tab, setTab] = useState<TabKey>("empleados");

  return (
    <div className="space-y-6">
      {/* ── Hero Header ─────────────────────────────────────────────── */}
      <div className="relative rounded-[40px] bg-obsidian overflow-hidden px-8 py-10 text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/[0.03]" />
          <div className="absolute top-8 right-32 h-32 w-32 rounded-full bg-white/[0.04]" />
          <div className="absolute bottom-0 left-1/3 h-20 w-40 rounded-full bg-gold/10" />
        </div>
        <div className="relative flex items-center gap-4 flex-wrap">
          <div>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-1">Centro de Comando</p>
            <h1 className="text-3xl font-black tracking-tight">Configuración del Sistema</h1>
            <p className="text-white/50 text-sm mt-1 max-w-xl">
              Administra privilegios globales de recursos humanos, seguridad y operaciones financieras desde la terminal central de tu instancia en Kore Suite.
            </p>
          </div>
        </div>
      </div>

      <div className="inline-flex flex-wrap gap-1 rounded-3xl border border-neutral-100 bg-white p-1.5 shadow-sm max-w-full overflow-x-auto custom-scrollbar">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cx(
              "inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-[11px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
              tab === t.key ? "bg-obsidian text-white shadow-md" : "text-neutral-400 hover:text-obsidian hover:bg-neutral-50"
            )}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      <div className="pb-8">
        {tab === "empleados" && <EmpleadosPage />}
        {tab === "roles"     && <RolesTab />}
        {tab === "tarifas"   && <TarifasTab />}
        {tab === "horarios"  && <HorariosTab />}
        {tab === "documentos" && <DocumentosTab />}
        {tab === "actividad" && <ActividadTab />}
        {tab === "modulos"   && <ModulosTab />}
        {tab === "red"       && <RedTab />}
        {tab === "semaforo"  && <SemaforoAdminTab />}
      </div>
    </div>
  );
}
