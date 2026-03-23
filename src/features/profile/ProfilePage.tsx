// src/features/profile/ProfilePage.tsx
import { useEffect, useState } from "react";
import api from "@/lib/http";

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
  attendance_status?: string | null; // "on_time" | "late" | "absent" | null
};

function Avatar({ name, url, size = "lg" }: { name: string; url?: string | null; size?: "sm" | "lg" }) {
  const initials = name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
  const sz = size === "lg" ? "h-24 w-24 text-3xl" : "h-10 w-10 text-sm";
  if (url) return <img src={url} alt={name} className={cx("rounded-full object-cover border-4 border-white shadow", sz)} />;
  return (
    <div className={cx("rounded-full bg-blue-200 text-blue-800 font-bold flex items-center justify-center border-4 border-white shadow", sz)}>
      {initials}
    </div>
  );
}

function AttendanceBadge({ status }: { status?: string | null }) {
  if (!status) return null;
  const conf =
    status === "on_time" ? { label: "A tiempo", cls: "bg-emerald-500/20 text-emerald-200 border-emerald-400/30" }
    : status === "late" ? { label: "Retardo", cls: "bg-amber-500/20 text-amber-200 border-amber-400/30" }
    : { label: "Ausente", cls: "bg-rose-500/20 text-rose-200 border-rose-400/30" };
  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium", conf.cls)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {conf.label}
    </span>
  );
}

function InfoField({ label, value, placeholder }: { label: string; value?: string | null; placeholder?: string }) {
  return (
    <div>
      <div className="text-xs text-neutral-500 mb-1">{label}</div>
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-800">
        {value || <span className="text-neutral-400">{placeholder ?? "—"}</span>}
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

  // Form state
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

  function cancelEdit() {
    setEditing(false);
  }

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

/*
  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('avatar', file);
    
    try {
      const res = await api.post('/mi-perfil/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const newUrl = res.data?.avatar_url ?? res.data;
      setProfile(prev => prev ? { ...prev, avatar_url: newUrl } : prev);
      showToast("ok", "Foto actualizada");
    } catch (e: any) {
      showToast("err", "No se pudo subir la foto");
    }
  }
*/


  const roleLabel =
    profile?.role === "admin" ? "Administrador"
    : profile?.role === "supervisor" ? "Supervisor"
    : "Empleado";

  const formatDate = (iso?: string | null) => {
    if (!iso) return "—";
    return new Date(iso + "T12:00:00").toLocaleDateString("es-MX", {
      day: "numeric", month: "short", year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16 text-sm text-neutral-500">
        Cargando perfil...
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 max-w-lg mx-auto">
        {err}
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mi Perfil</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Información personal y datos del empleado</p>
      </div>

      {/* Toast */}
      {toast && (
        <div className={cx(
          "rounded-2xl border px-4 py-3 text-sm font-medium",
          toast.type === "ok" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"
        )}>
          {toast.type === "ok" ? "✅" : "❌"} {toast.msg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* ── Columna izquierda: tarjeta de empleado ── */}
        <div className="space-y-4">
          {/* Foto + nombre */}
          <div className="rounded-3xl bg-blue-600 p-6 text-white text-center shadow-sm">
            <div className="relative flex justify-center mb-3">
              <div className="relative">
                <Avatar name={profile.full_name} url={profile.avatar_url} size="lg" />
                {/* Botón de foto temporalmente desactivado
                <label className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-white text-neutral-700 flex items-center justify-center cursor-pointer shadow hover:bg-neutral-100 transition border border-neutral-200">
                  📷
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </label>
                */}
              </div>
            </div>
            <div className="font-semibold text-lg">{profile.full_name}</div>

            <div className="text-sm text-white/70 mt-0.5">{roleLabel}</div>
            <div className="mt-2 flex justify-center">
              <AttendanceBadge status={profile.attendance_status} />
            </div>
          </div>

          {/* Tarjeta de empleado */}
          <div className="rounded-3xl border bg-white p-4 shadow-sm">
            <div className="text-xs text-neutral-500 font-medium uppercase tracking-wide mb-3">Tarjeta de Empleado</div>
            <div className="rounded-2xl bg-neutral-900 text-white p-4">
              <div className="text-xs text-white/50 uppercase tracking-widest mb-1">Número de Empleado</div>
              <div className="text-xl font-bold font-mono">{profile.employee_number ?? "—"}</div>
              <div className="mt-3 text-sm">{profile.full_name}</div>
              <div className="text-xs text-white/50">{profile.position_title ?? roleLabel}</div>
            </div>
          </div>

          {/* Info de pago (solo lectura) */}
          {(profile.pay_type || profile.hourly_rate) && (
            <div className="rounded-3xl border bg-white p-4 shadow-sm">
              <div className="text-xs text-neutral-500 font-medium uppercase tracking-wide mb-3">Información de Pago</div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Tipo de pago</span>
                  <span className="font-medium capitalize">{profile.pay_type === "hourly" ? "Por hora" : profile.pay_type ?? "—"}</span>
                </div>
                {profile.hourly_rate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Tarifa</span>
                    <span className="font-semibold text-emerald-600">${profile.hourly_rate}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Columna derecha ── */}
        <div className="md:col-span-2 space-y-4">
          {/* Datos personales */}
          <div className="rounded-3xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span>👤</span>
                <span className="font-semibold">Datos Personales</span>
              </div>
              {!editing ? (
                <button
                  onClick={startEdit}
                  className="rounded-xl border border-neutral-200 px-3 py-1.5 text-xs font-medium hover:bg-neutral-50 transition"
                >
                  ✏️ Editar
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={cancelEdit}
                    className="rounded-xl border border-neutral-200 px-3 py-1.5 text-xs font-medium hover:bg-neutral-50 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={saveEdit}
                    disabled={saving}
                    className="rounded-xl bg-neutral-900 text-white px-3 py-1.5 text-xs font-medium hover:bg-neutral-800 transition disabled:opacity-50"
                  >
                    {saving ? "Guardando..." : "Guardar"}
                  </button>
                </div>
              )}
            </div>

            {editing ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <div className="text-xs text-neutral-500 mb-1">Nombre completo</div>
                  <input
                    className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black/10"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <div className="text-xs text-neutral-500 mb-1">Teléfono</div>
                  <input
                    className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black/10"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+52 55 0000 0000"
                  />
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-neutral-500 mb-1">Dirección</div>
                  <input
                    className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black/10"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Calle, Colonia, Ciudad"
                  />
                </div>
                {/* Email solo lectura en edición */}
                <div className="col-span-2 md:col-span-1">
                  <InfoField label="Correo electrónico" value={profile.email} />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <InfoField label="Nombre completo" value={profile.full_name} />
                <InfoField label="Número de empleado" value={profile.employee_number} />
                <InfoField label="Correo electrónico" value={profile.email} />
                <InfoField label="Teléfono" value={profile.phone} placeholder="Sin teléfono" />
                <div className="col-span-2">
                  <InfoField label="Dirección" value={profile.address} placeholder="Sin dirección" />
                </div>
              </div>
            )}
          </div>

          {/* Información laboral */}
          <div className="rounded-3xl border bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <span>💼</span>
              <span className="font-semibold">Información Laboral</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <InfoField label="Puesto" value={profile.position_title ?? roleLabel} />
              <InfoField label="Departamento" value={profile.department} placeholder="General" />
              <InfoField label="Fecha de ingreso" value={formatDate(profile.hire_date)} />
            </div>

            {/* Nivel de acceso */}
            <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-3">
              <div className="flex items-center gap-2">
                <span className="text-blue-600">🔒</span>
                <span className="text-sm font-medium text-blue-800">Nivel de acceso</span>
              </div>
              <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                Tienes acceso de tipo <strong>{roleLabel}</strong>.{" "}
                {profile.role === "empleado"
                  ? "Puedes ver tus tareas, marcar asistencia y subir evidencias de trabajo."
                  : profile.role === "supervisor"
                  ? "Puedes gestionar tareas, asistencia y revisar el trabajo del equipo."
                  : "Tienes acceso completo al sistema, incluyendo configuración y reportes."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}