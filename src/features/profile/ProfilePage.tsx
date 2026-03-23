// src/features/profile/ProfilePage.tsx
import { useEffect, useState } from "react";
import api from "@/lib/http";
import {
  User, Mail, Phone, MapPin, Briefcase, Shield,
  Calendar, Hash, DollarSign, CheckCircle2, AlertTriangle,
  Pencil, Save, X, Loader2,
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

function Avatar({ name, url }: { name: string; url?: string | null }) {
  const initials = name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
  if (url) return <img src={url} alt={name} className="h-28 w-28 rounded-[28px] object-cover border-4 border-white shadow-lg" />;
  return (
    <div className="h-28 w-28 rounded-[28px] bg-obsidian text-white font-black text-3xl flex items-center justify-center border-4 border-white shadow-lg">
      {initials}
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

  const payRate = profile.pay_type === "daily" ? profile.daily_rate : profile.hourly_rate;
  const payLabel = profile.pay_type === "daily" ? "/ día" : "/ hora";

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
          <div className="rounded-[40px] bg-obsidian p-8 text-white text-center shadow-sm overflow-hidden relative">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/[0.03]" />
              <div className="absolute bottom-0 left-0 h-20 w-32 rounded-full bg-gold/10" />
            </div>
            <div className="relative">
              <div className="flex justify-center mb-5">
                <Avatar name={profile.full_name} url={profile.avatar_url} />
              </div>
              <div className="font-black text-xl tracking-tight">{profile.full_name}</div>
              <div className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mt-2">{profile.position_title ?? roleLabel}</div>

              <div className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-white/10 border border-white/10 px-4 py-2 text-xs font-bold">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Activo
              </div>
            </div>
          </div>

          {/* Performance Metrics placeholder */}
          <div className="rounded-[32px] border border-neutral-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <Shield className="h-4 w-4 text-neutral-300" />
              <span className="text-sm font-black text-obsidian tracking-tight">Nivel de Acceso</span>
            </div>
            <div className="rounded-2xl bg-obsidian/5 border border-neutral-100 p-4">
              <div className="text-xs font-bold text-obsidian uppercase tracking-wider mb-1">{roleLabel}</div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                {profile.role === "empleado"
                  ? "Puedes ver tus tareas, marcar asistencia y subir evidencias."
                  : profile.role === "supervisor"
                  ? "Puedes gestionar tareas, asistencia y revisar el trabajo del equipo."
                  : "Acceso completo al sistema, incluyendo configuración y reportes."}
              </p>
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

              {(profile.pay_type || payRate) && (
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
              )}

              <div>
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Fecha de Ingreso</div>
                <div className="flex items-center gap-2 text-sm font-bold text-obsidian">
                  <Calendar className="h-4 w-4 text-neutral-300" />
                  {formatDate(profile.hire_date)}
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
        </div>
      </div>
    </div>
  );
}