// src/features/profile/ProfilePage.tsx
import { useEffect, useState } from "react";
import api from "@/lib/http";
import {
  User, Mail, Phone, MapPin, Briefcase, Shield,
  Calendar, Hash, CheckCircle2, AlertTriangle,
  Pencil, Save, X, Loader2, Key, Camera, ChevronDown, Bell, Globe, Moon, MonitorSmartphone
} from "lucide-react";

function cx(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(" ");
}

type ProfileData = {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  avatar_url?: string | null;
  employee_number?: string | null;
  position_title?: string | null;
  department?: string | null;
  hire_date?: string | null;
  role: string;
  pay_type?: string | null;
  hourly_rate?: number | null;
  daily_rate?: number | null;
  attendance_status?: string | null;
};

function Avatar({ name, url, onUpload }: { name: string; url?: string | null; onUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  const initials = name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
  return (
    <div className="relative group">
      {url ? (
        <img src={url} alt={name} className="h-20 w-20 rounded-[24px] object-cover border-2 border-white shadow-lg" />
      ) : (
        <div className="h-20 w-20 rounded-[24px] bg-obsidian text-white font-black text-2xl flex items-center justify-center border-2 border-white shadow-lg">
          {initials}
        </div>
      )}
      {onUpload && (
        <label className="absolute inset-0 bg-black/40 rounded-[24px] flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
          <Camera className="h-5 w-5 text-white mb-1" />
          <span className="text-[8px] font-bold text-white uppercase tracking-widest">Cambiar</span>
          <input type="file" accept="image/*" className="hidden" onChange={onUpload} />
        </label>
      )}
    </div>
  );
}

function InfoField({ label, value, icon, placeholder }: { label: string; value?: string | null; icon?: React.ReactNode; placeholder?: string }) {
  return (
    <div>
      <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">{label}</div>
      <div className="rounded-2xl border border-neutral-100 bg-neutral-50/50 px-4 py-3 text-sm font-medium text-obsidian flex items-center gap-3">
        {icon && <span className="text-neutral-300 shrink-0">{icon}</span>}
        {value || <span className="text-neutral-300 italic">{placeholder ?? "—"}</span>}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [avatarLocal, setAvatarLocal] = useState<string | null>(localStorage.getItem("kore_avatar"));
  
  const [preferences, setPreferences] = useState({
    notifications: localStorage.getItem("kore_prefs_notif") !== "false",
    language: localStorage.getItem("kore_prefs_lang") || "es",
    theme: localStorage.getItem("kore_prefs_theme") || "system",
  });

  const [securityExpanded, setSecurityExpanded] = useState(false);

  function showToast(type: "ok" | "err", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }

  async function loadProfile() {
    setLoading(true);
    try {
      const res = await api.get("/mi-perfil");
      const data = res.data?.data ?? res.data;
      setProfile(data);
      setName(data.full_name ?? "");
      setPhone(data.phone ?? "");
      setAddress(data.address ?? "");
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "No se pudo cargar el perfil");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadProfile(); }, []);

  function startEdit() {
    if (!profile) return;
    setName(profile.full_name);
    setPhone(profile.phone ?? "");
    setAddress(profile.address ?? "");
    setEditing(true);
  }

  function cancelEdit() { setEditing(false); }

  async function saveEdit() {
    setSaving(true);
    try {
      const res = await api.patch("/mi-perfil", { full_name: name, phone, address });
      const data = res.data?.data ?? res.data;
      setProfile(data);
      setEditing(false);
      showToast("ok", "Perfil actualizado");
    } catch (e: any) {
      showToast("err", e?.response?.data?.message ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function savePassword() {
    if (newPassword !== confirmPassword) {
      showToast("err", "Las contraseñas no coinciden");
      return;
    }
    if (newPassword.length < 6) {
      showToast("err", "La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setSavingPassword(true);
    try {
      await api.post("/mi-perfil/password", {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      });
      showToast("ok", "Contraseña actualizada correctamente");
      setChangingPassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      showToast("err", e?.response?.data?.message ?? "Error al cambiar contraseña");
    } finally {
      setSavingPassword(false);
    }
  }

  function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setAvatarLocal(base64);
      localStorage.setItem("kore_avatar", base64);
      showToast("ok", "Avatar guardado localmente en este dispositivo");
    };
    reader.readAsDataURL(file);
  }

  async function updatePreferenceBackend(key: string, value: any) {
    try {
      await api.put("/users/preferences", { [key]: value });
    } catch (e) {
      console.error("Error saving preference", e);
    }
  }

  function toggleTheme(newTheme: string) {
    setPreferences(p => ({ ...p, theme: newTheme }));
    localStorage.setItem("kore_prefs_theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (newTheme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
    showToast("ok", "Tema actualizado");
    updatePreferenceBackend("theme", newTheme);
  }

  async function toggleNotifications() {
    const next = !preferences.notifications;
    
    if (next && "Notification" in window) {
      if (Notification.permission !== "granted") {
        await Notification.requestPermission();
      }
    }

    setPreferences(p => ({ ...p, notifications: next }));
    localStorage.setItem("kore_prefs_notif", String(next));
    showToast("ok", next ? "Notificaciones habilitadas" : "Notificaciones deshabilitadas");
    updatePreferenceBackend("notifications_enabled", next);
  }

  function changeLanguage(lang: string) {
    setPreferences(p => ({ ...p, language: lang }));
    localStorage.setItem("kore_prefs_lang", lang);
    showToast("ok", "Idioma actualizado");
    updatePreferenceBackend("language", lang);
  }

  const roleLabel =
    profile?.role === "admin" ? "Administrador"
    : profile?.role === "supervisor" ? "Supervisor"
    : "Empleado";

  const formatDate = (iso?: string | null) => {
    if (!iso) return "—";
    return new Date(iso + "T12:00:00").toLocaleDateString("es-MX", {
      day: "numeric", month: "long", year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4 text-neutral-400">
        <div className="h-10 w-10 border-4 border-neutral-100 border-t-obsidian rounded-full animate-spin" />
        <span className="text-xs font-bold uppercase tracking-widest">Cargando perfil...</span>
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-[32px] border border-rose-100 bg-rose-50 p-8 text-sm font-medium text-rose-700 max-w-lg mx-auto flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0" />{err}
      </div>
    );
  }

  if (!profile) return null;

  // const payRate = profile.pay_type === "daily" ? profile.daily_rate : profile.hourly_rate;
  // const payLabel = profile.pay_type === "daily" ? "/ día" : "/ hora";

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className={cx(
          "rounded-2xl border px-5 py-3 text-sm font-bold flex items-center gap-3",
          toast.type === "ok" ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-rose-50 border-rose-100 text-rose-700"
        )}>
          {toast.type === "ok" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-6">
        {/* ── Left Column: Employee Card ── */}
        <div className="space-y-4">
          {/* Profile Card */}
          <div className="rounded-[32px] bg-obsidian p-6 text-white shadow-sm overflow-hidden relative">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/[0.03]" />
              <div className="absolute bottom-0 left-0 h-20 w-32 rounded-full bg-gold/10" />
            </div>
            <div className="relative flex items-center gap-5">
              <div className="flex-shrink-0">
                <Avatar name={profile.full_name} url={avatarLocal || profile.avatar_url} onUpload={handleAvatarUpload} />
              </div>
              <div className="min-w-0">
                <div className="font-black text-xl tracking-tight truncate">{profile.full_name}</div>
                <div className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mt-1 truncate">{profile.position_title ?? roleLabel}</div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-[10px] font-bold text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                    Activo
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/10 px-3 py-1.5 text-[10px] font-bold text-white max-w-full">
                    <Mail className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{profile.email}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-neutral-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <MonitorSmartphone className="h-4 w-4 text-neutral-300" />
              <span className="text-sm font-black text-obsidian tracking-tight">Actividad Reciente</span>
            </div>
            <div className="text-xs font-medium text-neutral-500 leading-relaxed">
              Último acceso: hoy a las {new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })} desde {navigator.userAgent.includes("Chrome") ? "Chrome" : "Navegador"} / {navigator.platform.includes("Win") ? "Windows" : "Sistema OS"}.
            </div>
          </div>
        </div>

        {/* ── Center Column: Personal Info ── */}
        <div className="space-y-4">
          <div className="rounded-[40px] border border-neutral-100 bg-white shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-neutral-50 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-obsidian tracking-tight">Información Personal</h2>
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">Datos de contacto y cuenta</p>
              </div>
              {!editing ? (
                <button
                  onClick={startEdit}
                  className="inline-flex items-center gap-2 rounded-2xl border border-neutral-100 px-4 py-2 text-xs font-bold text-neutral-500 hover:bg-neutral-50 transition"
                >
                  <Pencil className="h-3.5 w-3.5" />Editar
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={cancelEdit}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-100 px-3 py-2 text-xs font-bold text-neutral-400 hover:bg-neutral-50 transition"
                  >
                    <X className="h-3.5 w-3.5" />Cancelar
                  </button>
                  <button
                    onClick={saveEdit}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-obsidian px-4 py-2 text-xs font-bold text-white hover:bg-gold transition disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Guardar
                  </button>
                </div>
              )}
            </div>

            <div className="p-8">
              {editing ? (
                <div className="grid grid-cols-2 gap-5">
                  <div className="col-span-2">
                    <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Nombre completo</div>
                    <input
                      className="w-full rounded-2xl border border-neutral-100 px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-obsidian/10"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Teléfono</div>
                    <input
                      className="w-full rounded-2xl border border-neutral-100 px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-obsidian/10"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+52 55 0000 0000"
                    />
                  </div>
                  <div>
                    <InfoField label="Correo electrónico" value={profile.email} icon={<Mail className="h-4 w-4" />} />
                  </div>
                  <div className="col-span-2">
                    <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Dirección</div>
                    <input
                      className="w-full rounded-2xl border border-neutral-100 px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-obsidian/10"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Calle, Colonia, Ciudad"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-5">
                  <InfoField label="Nombre completo" value={profile.full_name} icon={<User className="h-4 w-4" />} />
                  <InfoField label="Número de empleado" value={profile.employee_number} icon={<Hash className="h-4 w-4" />} />
                  <InfoField label="Correo electrónico" value={profile.email} icon={<Mail className="h-4 w-4" />} />
                  <InfoField label="Teléfono" value={profile.phone} icon={<Phone className="h-4 w-4" />} placeholder="Sin teléfono" />
                  <div className="col-span-2">
                    <InfoField label="Dirección" value={profile.address} icon={<MapPin className="h-4 w-4" />} placeholder="Sin dirección registrada" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right Column: Employment Details ── */}
        <div className="space-y-4">
          {/* Employment Header */}
          <div className="rounded-[32px] bg-bone border border-neutral-100 overflow-hidden shadow-sm">
            <div className="bg-obsidian px-6 py-5 text-white rounded-t-[32px]">
              <div className="text-sm font-black tracking-tight">Datos Laborales</div>
              <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Información corporativa</div>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Puesto</div>
                <div className="text-lg font-black text-obsidian">{profile.position_title ?? roleLabel}</div>
              </div>
              {/* Forma de pago oculta */}
              {/* {(profile.pay_type || payRate) && (
                <div>
                  <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Estructura Salarial</div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-xl bg-obsidian text-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
                      {profile.pay_type === "daily" ? "Diario" : "Horario"}
                    </span>
                    <span className="text-lg font-black text-obsidian">
                      ${payRate ?? "—"} <span className="text-xs font-bold text-neutral-400">{payLabel}</span>
                    </span>
                  </div>
                </div>
              )} */}

              <div>
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Fecha de Ingreso</div>
                <div className="flex items-center gap-2 text-sm font-bold text-obsidian">
                  <Calendar className="h-4 w-4 text-neutral-300" />
                  {formatDate(profile.hire_date)}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Nivel de Acceso</div>
                <div className="flex items-center gap-2 text-sm font-bold text-obsidian">
                  <Shield className="h-4 w-4 text-neutral-300" />
                  {roleLabel}
                </div>
              </div>

              {profile.department && (
                <div>
                  <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Departamento</div>
                  <div className="flex items-center gap-2 text-sm font-bold text-obsidian">
                    <Briefcase className="h-4 w-4 text-neutral-300" />
                    {profile.department}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Preferencias (NUEVO) */}
          <div className="rounded-[32px] border border-neutral-100 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-neutral-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MonitorSmartphone className="h-4 w-4 text-neutral-300" />
                <span className="text-sm font-black text-obsidian tracking-tight">Preferencias</span>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="h-4 w-4 text-neutral-400" />
                  <div>
                    <div className="text-xs font-bold text-obsidian">Notificaciones Push</div>
                    <div className="text-[10px] text-neutral-400">Recibir alertas locales</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={toggleNotifications}
                  className={cx(
                    "h-6 w-11 rounded-full transition-all flex items-center px-0.5 border",
                    preferences.notifications ? "bg-emerald-500 border-emerald-600" : "bg-neutral-200 border-neutral-300"
                  )}
                >
                  <div className={cx(
                    "h-4 w-4 rounded-full bg-white shadow transition-transform duration-300",
                    preferences.notifications ? "translate-x-5" : "translate-x-0"
                  )} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-neutral-400" />
                  <div className="text-xs font-bold text-obsidian">Idioma</div>
                </div>
                <select 
                  className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium outline-none focus:ring-2 focus:ring-obsidian/10"
                  value={preferences.language}
                  onChange={e => changeLanguage(e.target.value)}
                >
                  <option value="es">Español</option>
                  <option value="en">English</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Moon className="h-4 w-4 text-neutral-400" />
                  <div className="text-xs font-bold text-obsidian">Tema</div>
                </div>
                <select 
                  className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium outline-none focus:ring-2 focus:ring-obsidian/10"
                  value={preferences.theme}
                  onChange={e => toggleTheme(e.target.value)}
                >
                  <option value="system">Sistema</option>
                  <option value="light">Claro</option>
                  <option value="dark">Oscuro</option>
                </select>
              </div>
            </div>
          </div>

          {/* Change Password Section */}
          <div className="rounded-[32px] border border-neutral-100 bg-white shadow-sm overflow-hidden">
            <button 
              onClick={() => setSecurityExpanded(!securityExpanded)}
              className="w-full px-6 py-5 flex items-center justify-between hover:bg-neutral-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-neutral-400" />
                <span className="text-sm font-black text-obsidian tracking-tight">Seguridad</span>
              </div>
              <ChevronDown className={cx("h-4 w-4 text-neutral-400 transition-transform", securityExpanded ? "rotate-180" : "rotate-0")} />
            </button>

            {securityExpanded && (
              <div className="p-6 border-t border-neutral-50 animate-in-fade">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm font-medium text-neutral-400 flex flex-col gap-1">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-300">Contraseña</div>
                    <div className="text-xs font-medium">••••••••••</div>
                  </div>
                  {!changingPassword ? (
                    <button
                      onClick={() => setChangingPassword(true)}
                      className="rounded-xl border border-neutral-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500 hover:bg-neutral-50 transition"
                    >
                      <Pencil className="h-3 w-3 inline mr-1" /> Editar
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setChangingPassword(false);
                          setCurrentPassword("");
                          setNewPassword("");
                          setConfirmPassword("");
                        }}
                        className="rounded-xl border border-neutral-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400 hover:bg-neutral-50 transition"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={savePassword}
                        disabled={savingPassword}
                        className="rounded-xl bg-obsidian text-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider hover:bg-gold transition disabled:opacity-50"
                      >
                        {savingPassword ? "..." : "Guardar"}
                      </button>
                    </div>
                  )}
                </div>

                {changingPassword && (
                  <div className="space-y-4 pt-4 border-t border-neutral-50">
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Contraseña actual</label>
                      <input
                        type="password"
                        className="w-full rounded-2xl border border-neutral-100 bg-neutral-50/50 px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-obsidian/10 transition-all"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Nueva contraseña</label>
                      <input
                        type="password"
                        className="w-full rounded-2xl border border-neutral-100 bg-neutral-50/50 px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-obsidian/10 transition-all"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Confirmar nueva contraseña</label>
                      <input
                        type="password"
                        className="w-full rounded-2xl border border-neutral-100 bg-neutral-50/50 px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-obsidian/10 transition-all"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>
                    {newPassword && confirmPassword && newPassword !== confirmPassword && (
                      <div className="text-[10px] font-bold text-rose-500 uppercase tracking-widest flex items-center gap-1.5 animate-in-fade">
                        <AlertTriangle className="h-3 w-3" /> Las contraseñas no coinciden
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}