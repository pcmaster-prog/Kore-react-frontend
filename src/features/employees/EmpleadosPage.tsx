// src/features/employees/EmpleadosPage.tsx
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  listUsers,
  createUser,
  updateUser,
  toggleUserStatus,
  deleteUser,
  type UserItem,
  type CreateUserPayload,
  type UpdateUserPayload,
} from "./api";
import {
  Users, UserPlus, CheckCircle2, AlertTriangle,
  Search, Pencil, UserX, UserCheck, Trash2, Shield, Briefcase, DollarSign
} from "lucide-react";

function cx(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(" ");
}

// ─── Avatar ──────────────────────────────────────────────────────────────────
function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
  const colors = [
    "bg-blue-100 text-blue-700",
    "bg-violet-100 text-violet-700",
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-700",
    "bg-rose-100 text-rose-700",
    "bg-sky-100 text-sky-700",
  ];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={cx("h-10 w-10 rounded-2xl flex items-center justify-center text-xs font-bold shrink-0", color)}>
      {initials}
    </div>
  );
}

// ─── Badge de rol ─────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: string }) {
  const conf =
    role === "admin"
      ? "bg-violet-50 text-violet-600 border-violet-100"
      : role === "supervisor"
      ? "bg-blue-50 text-blue-600 border-blue-100"
      : "bg-neutral-50 text-neutral-500 border-neutral-100";
  const label =
    role === "admin" ? "Admin" : role === "supervisor" ? "Supervisor" : "Empleado";
  return (
    <span className={cx("inline-flex rounded-xl border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider", conf)}>
      {label}
    </span>
  );
}

// ─── Modal crear/editar ───────────────────────────────────────────────────────
function UserModal({
  open,
  mode,
  initial,
  suggestedCode,
  onClose,
  onSaved,
}: {
  open: boolean;
  mode: "create" | "edit";
  initial?: UserItem | null;
  suggestedCode?: string;
  onClose: () => void;
  onSaved: (item: UserItem) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "supervisor" | "empleado">("empleado");
  const [position, setPosition] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [hiredAt, setHiredAt] = useState("");
  const [paymentType, setPaymentType] = useState<"hourly" | "daily">("hourly");
  const [hourlyRate, setHourlyRate] = useState("");
  const [dailyRate, setDailyRate] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErr(null);
    setPassword("");
    setShowPassword(false);
    if (initial) {
      setName(initial.name);
      setEmail(initial.email);
      setRole(initial.role);
      setPosition(initial.position_title ?? "");
      setEmployeeCode(initial.employee_code ?? "");
      setHiredAt(initial.hired_at ?? "");
      setPaymentType((initial.payment_type as any) ?? "hourly");
      setHourlyRate(String(initial.hourly_rate ?? ""));
      setDailyRate(String(initial.daily_rate ?? ""));
    } else {
      setName("");
      setEmail("");
      setRole("empleado");
      setPosition("");
      setEmployeeCode(suggestedCode ?? "");
      setHiredAt(new Date().toISOString().slice(0, 10));
      setPaymentType("hourly");
      setHourlyRate("");
      setDailyRate("");
    }
  }, [open, initial, suggestedCode]);

  const canSave =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    (mode === "edit" || password.length >= 6);

  async function handleSave() {
    setSaving(true);
    setErr(null);
    try {
      let item: UserItem;
      if (mode === "create") {
        const payload: CreateUserPayload = {
          name: name.trim(),
          email: email.trim(),
          password,
          role,
          position_title: position.trim() || undefined,
          employee_code: employeeCode.trim() || undefined,
          hired_at: hiredAt || undefined,
          payment_type: paymentType,
          hourly_rate: hourlyRate ? parseFloat(hourlyRate) : undefined,
          daily_rate: dailyRate ? parseFloat(dailyRate) : undefined,
        };
        item = await createUser(payload);
      } else {
        const payload: UpdateUserPayload = {
          name: name.trim(),
          email: email.trim(),
          role,
          position_title: position.trim() || undefined,
          employee_code: employeeCode.trim() || undefined,
          hired_at: hiredAt || undefined,
          payment_type: paymentType,
          hourly_rate: hourlyRate ? parseFloat(hourlyRate) : undefined,
          daily_rate: dailyRate ? parseFloat(dailyRate) : undefined,
        };
        if (password.length >= 6) payload.password = password;
        item = await updateUser(initial!.id, payload);
      }
      onSaved(item);
      onClose();
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in-fade">
      <div className="absolute inset-0 bg-obsidian/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-4xl rounded-[40px] border border-neutral-100 bg-white shadow-2xl overflow-hidden animate-in-up flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-neutral-100 bg-neutral-50/50">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white border border-neutral-100 flex items-center justify-center shadow-sm">
              <UserPlus className="h-6 w-6 text-obsidian" />
            </div>
            <div>
              <div className="font-black text-2xl text-obsidian tracking-tight">
                {mode === "create" ? "Nuevo Usuario" : "Editar Usuario"}
              </div>
              <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mt-1">
                {mode === "create" ? "Configuración de perfil y acceso" : "Modifica los datos del usuario"}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-10 w-10 rounded-2xl border border-neutral-200 bg-white flex items-center justify-center text-neutral-400 hover:bg-neutral-50 hover:text-obsidian transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-white">
          {err && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700 flex items-center gap-3 mb-6">
              <AlertTriangle className="h-5 w-5" />
              {err}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Columna Izquierda: Acceso */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-neutral-100">
                <Shield className="h-5 w-5 text-neutral-400" />
                <h3 className="text-sm font-bold text-obsidian uppercase tracking-widest">Cuenta de Acceso</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Nombre completo *</label>
                  <input
                    className="w-full rounded-2xl border border-neutral-200 bg-neutral-50/50 px-4 py-3 text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-obsidian/10 transition-all placeholder:text-neutral-300"
                    placeholder="Ej. Juan Pérez"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Correo electrónico *</label>
                  <input
                    type="email"
                    className="w-full rounded-2xl border border-neutral-200 bg-neutral-50/50 px-4 py-3 text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-obsidian/10 transition-all placeholder:text-neutral-300"
                    placeholder="juan@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Rol del sistema *</label>
                  <select
                    className="w-full rounded-2xl border border-neutral-200 bg-neutral-50/50 px-4 py-3 text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-obsidian/10 transition-all appearance-none"
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                  >
                    <option value="empleado">Empleado (Acceso básico)</option>
                    <option value="supervisor">Supervisor (Gestión de equipo)</option>
                    <option value="admin">Admin (Acceso total)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5">
                    Contraseña {mode === "edit" ? "(dejar vacío para no cambiar)" : "*"}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="w-full rounded-2xl border border-neutral-200 bg-neutral-50/50 px-4 py-3 pr-12 text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-obsidian/10 transition-all placeholder:text-neutral-300"
                      placeholder={mode === "create" ? "Mínimo 6 caracteres" : "Nueva contraseña (opcional)"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-obsidian text-xs font-bold transition-colors"
                    >
                      {showPassword ? "Ocultar" : "Ver"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Laboral & Nómina */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-neutral-100">
                <Briefcase className="h-5 w-5 text-neutral-400" />
                <h3 className="text-sm font-bold text-obsidian uppercase tracking-widest">Datos Laborales</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Nº Empleado</label>
                  <input
                    className="w-full rounded-2xl border border-neutral-200 bg-neutral-50/50 px-4 py-3 text-sm font-bold font-mono text-neutral-600 outline-none focus:bg-white focus:ring-2 focus:ring-obsidian/10 transition-all placeholder:text-neutral-300"
                    placeholder="Ej. EMP-001"
                    value={employeeCode}
                    onChange={(e) => setEmployeeCode(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Puesto</label>
                  <input
                    className="w-full rounded-2xl border border-neutral-200 bg-neutral-50/50 px-4 py-3 text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-obsidian/10 transition-all placeholder:text-neutral-300"
                    placeholder="Ej. Cajero"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Fecha de ingreso</label>
                  <input
                    type="date"
                    className="w-full rounded-2xl border border-neutral-200 bg-neutral-50/50 px-4 py-3 text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-obsidian/10 transition-all text-neutral-600"
                    value={hiredAt}
                    onChange={(e) => setHiredAt(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pb-2 border-b border-neutral-100 pt-2">
                <DollarSign className="h-5 w-5 text-neutral-400" />
                <h3 className="text-sm font-bold text-obsidian uppercase tracking-widest">Nómina</h3>
              </div>

              <div className="space-y-4">
                <div className="flex rounded-2xl bg-neutral-100/50 p-1 border border-neutral-100">
                  <button
                    onClick={() => setPaymentType("hourly")}
                    className={cx("flex-1 rounded-xl py-2.5 text-xs font-bold uppercase tracking-widest transition-all", paymentType === "hourly" ? "bg-white text-obsidian shadow-sm" : "text-neutral-400 hover:text-neutral-600")}
                  >
                    Por Hora
                  </button>
                  <button
                    onClick={() => setPaymentType("daily")}
                    className={cx("flex-1 rounded-xl py-2.5 text-xs font-bold uppercase tracking-widest transition-all", paymentType === "daily" ? "bg-white text-obsidian shadow-sm" : "text-neutral-400 hover:text-neutral-600")}
                  >
                    Por Día
                  </button>
                </div>

                {paymentType === "hourly" ? (
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Tarifa por hora</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">$</span>
                      <input
                        type="number" step="0.01" min="0"
                        className="w-full rounded-2xl border border-neutral-200 bg-neutral-50/50 pl-8 pr-4 py-3 text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-obsidian/10 transition-all placeholder:text-neutral-300"
                        placeholder="0.00"
                        value={hourlyRate}
                        onChange={(e) => setHourlyRate(e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Tarifa por día</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">$</span>
                      <input
                        type="number" step="0.01" min="0"
                        className="w-full rounded-2xl border border-neutral-200 bg-neutral-50/50 pl-8 pr-4 py-3 text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-obsidian/10 transition-all placeholder:text-neutral-300"
                        placeholder="0.00"
                        value={dailyRate}
                        onChange={(e) => setDailyRate(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Welcome Email Banner */}
        {mode === "create" && (
          <div className="px-8 pb-4">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 px-5 py-3 text-[11px] font-bold text-emerald-700 flex items-center gap-3">
              <div className="h-6 w-6 rounded-lg bg-emerald-100 flex items-center justify-center text-xs shadow-sm shadow-emerald-200/50">
                📧
              </div>
              <span>Se enviará automáticamente un correo de bienvenida con las credenciales y documentos configurados.</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-8 py-6 border-t border-neutral-100 bg-neutral-50/50">
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-2xl border border-neutral-200 bg-white px-6 py-3 text-sm font-bold text-obsidian hover:bg-neutral-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="rounded-2xl bg-obsidian px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-neutral-800 hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {mode === "create" ? "Crear Usuario" : "Guardar Cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal confirmar toggle status ────────────────────────────────────────────
function ConfirmToggleModal({
  open,
  user,
  onClose,
  onConfirm,
  loading,
}: {
  open: boolean;
  user: UserItem | null;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  if (!open || !user) return null;
  const deactivating = user.is_active;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-3xl border bg-white shadow-2xl p-6 space-y-4">
        <div className="text-2xl text-center">{deactivating ? "⚠️" : "✅"}</div>
        <div className="text-center">
          <div className="font-semibold text-base">
            {deactivating ? "Desactivar usuario" : "Activar usuario"}
          </div>
          <div className="text-sm text-neutral-500 mt-1">
            {deactivating
              ? `${user.name} no podrá iniciar sesión hasta que lo reactives.`
              : `${user.name} podrá volver a iniciar sesión.`}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-xl border border-neutral-200 py-2.5 text-sm font-medium hover:bg-neutral-50 transition"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cx(
              "flex-1 rounded-xl py-2.5 text-sm font-medium text-white transition disabled:opacity-50",
              deactivating ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
            )}
          >
            {loading ? "..." : deactivating ? "Desactivar" : "Activar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal confirmar eliminación ──────────────────────────────────────────────
function ConfirmDeleteModal({
  open,
  user,
  onClose,
  onConfirm,
  loading,
}: {
  open: boolean;
  user: UserItem | null;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  if (!open || !user) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-3xl border bg-white shadow-2xl p-6 space-y-4">
        <div className="text-2xl text-center">🗑️</div>
        <div className="text-center">
          <div className="font-semibold text-base">Eliminar a {user.name}</div>
          <div className="text-sm text-neutral-500 mt-1">
            Esta acción es permanente. Se eliminarán todos sus registros de asistencia, tareas y evidencias.
          </div>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
          ⚠️ No podrás deshacer esta acción.
        </div>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-xl border border-neutral-200 py-2.5 text-sm font-medium hover:bg-neutral-50 transition"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-700 py-2.5 text-sm font-medium text-white transition disabled:opacity-50"
          >
            {loading ? "Eliminando..." : "Eliminar permanentemente"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function EmpleadosPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editTarget, setEditTarget] = useState<UserItem | null>(null);
  const [toggleTarget, setToggleTarget] = useState<UserItem | null>(null);
  const [toggling, setToggling] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const suggestedCode = useMemo(() => {
    if (users.length === 0) return "EMP-001";
    let max = 0;
    for (const u of users) {
      if (!u.employee_code) continue;
      const match = u.employee_code.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > max) max = num;
      }
    }
    return `EMP-${String(max + 1).padStart(3, "0")}`;
  }, [users]);

  function showToast(type: "ok" | "err", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await listUsers({
        search: search || undefined,
        role: roleFilter || undefined,
      });
      setUsers(res.data ?? []);
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "No se pudo cargar usuarios");
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditTarget(null);
    setModalMode("create");
    setModalOpen(true);
  }

  function openEdit(user: UserItem) {
    setEditTarget(user);
    setModalMode("edit");
    setModalOpen(true);
  }

  function onSaved(item: UserItem) {
    setUsers((prev) => {
      const idx = prev.findIndex((u) => u.id === item.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = item;
        return next;
      }
      return [item, ...prev];
    });
    showToast("ok", modalMode === "create" ? "Usuario creado exitosamente" : "Usuario actualizado");
  }

  async function confirmToggle() {
    if (!toggleTarget) return;
    setToggling(true);
    try {
      const updated = await toggleUserStatus(toggleTarget.id);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      showToast("ok", updated.is_active ? "Usuario activado" : "Usuario desactivado");
      setToggleTarget(null);
    } catch (e: any) {
      showToast("err", e?.response?.data?.message ?? "Error al cambiar estado");
    } finally {
      setToggling(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteUser(deleteTarget.id);
      setUsers(prev => prev.filter(u => u.id !== deleteTarget.id));
      showToast("ok", "Empleado eliminado permanentemente");
      setDeleteTarget(null);
    } catch (e: any) {
      showToast("err", e?.response?.data?.message ?? "Error al eliminar");
    } finally {
      setDeleting(false);
    }
  }

  // Stats
  const total = users.length;
  const active = users.filter((u) => u.is_active).length;
  const inactive = users.filter((u) => !u.is_active).length;

  return (
    <>
      <div className="space-y-6">
        {/* ── Hero Header ─────────────────────────────────────────────── */}
        <div className="relative rounded-[40px] bg-obsidian overflow-hidden px-8 py-8 text-white">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/[0.03]" />
            <div className="absolute top-8 right-32 h-32 w-32 rounded-full bg-white/[0.04]" />
            <div className="absolute bottom-0 left-1/2 h-16 w-48 rounded-full bg-gold/10" />
          </div>
          <div className="relative flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-1">Recursos Humanos</p>
              <h1 className="text-3xl font-black tracking-tight">Equipo</h1>
              <p className="text-white/50 text-sm mt-1">Gestiona las cuentas de acceso y perfiles del equipo.</p>
            </div>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-2xl bg-white/10 border border-white/20 hover:bg-white/20 px-5 py-3 text-sm font-bold text-white transition"
            >
              <UserPlus className="h-4 w-4" />
              Nuevo Usuario
            </button>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div className={cx(
            "rounded-2xl border px-5 py-3 text-sm font-bold flex items-center gap-3",
            toast.type === "ok"
              ? "bg-emerald-50 border-emerald-100 text-emerald-700"
              : "bg-rose-50 border-rose-100 text-rose-700"
          )}>
            {toast.type === "ok"
              ? <CheckCircle2 className="h-4 w-4" />
              : <AlertTriangle className="h-4 w-4" />}
            {toast.msg}
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Equipo", val: total, icon: Users, iconBg: "bg-neutral-100 text-neutral-500" },
            { label: "Activos", val: active, icon: CheckCircle2, iconBg: "bg-emerald-100 text-emerald-600", numCls: "text-emerald-600" },
            { label: "Inactivos", val: inactive, icon: UserX, iconBg: "bg-rose-50 text-rose-400", numCls: inactive > 0 ? "text-rose-500" : "text-neutral-300" },
          ].map((k) => (
            <div key={k.label} className="rounded-[32px] border border-neutral-100 bg-white p-6 shadow-sm">
              <div className={cx("h-10 w-10 rounded-2xl flex items-center justify-center mb-4", k.iconBg)}>
                <k.icon className="h-5 w-5" />
              </div>
              <div className={cx("text-3xl font-black tracking-tight", k.numCls ?? "text-obsidian")}>{k.val}</div>
              <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">{k.label}</div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-300" />
            <input
              className="w-full rounded-2xl border border-neutral-100 bg-white pl-11 pr-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-obsidian/10 placeholder:text-neutral-300"
              placeholder="Buscar por nombre, email o puesto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="rounded-2xl border border-neutral-100 bg-white px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-obsidian/10 text-neutral-600"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">Todos los roles</option>
            <option value="admin">Admin</option>
            <option value="supervisor">Supervisor</option>
            <option value="empleado">Empleado</option>
          </select>
        </div>

        {/* Error */}
        {err && (
          <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm font-medium text-rose-700 flex items-center gap-3">
            <AlertTriangle className="h-4 w-4 shrink-0" />{err}
          </div>
        )}

        {/* Tabla */}
        <div className="rounded-[40px] border border-neutral-100 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-16 flex flex-col items-center gap-3 text-neutral-400">
              <div className="h-10 w-10 border-4 border-neutral-100 border-t-obsidian rounded-full animate-spin" />
              <span className="text-xs font-bold uppercase tracking-widest">Cargando equipo...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="p-16 flex flex-col items-center gap-4 text-center">
              <Users className="h-12 w-12 text-neutral-100" />
              <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest">
                {search || roleFilter ? "Sin resultados para ese filtro" : "Sin usuarios. Crea el primero."}
              </p>
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50/80 border-b border-neutral-50">
                  <tr>
                    {["Usuario", "Rol", "Puesto", "No. Empleado", "Estado", "Acciones"].map((h) => (
                      <th key={h} className="text-left px-5 py-4 text-[10px] font-bold text-neutral-400 uppercase tracking-[0.1em]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className={cx(
                      "border-t border-neutral-50 transition",
                      !user.is_active ? "opacity-40" : "hover:bg-neutral-50/50"
                    )}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={user.name} />
                          <div>
                            <div className="text-sm font-bold text-obsidian">{user.name}</div>
                            <div className="text-[10px] text-neutral-400 mt-0.5">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="px-5 py-4 text-sm font-medium text-neutral-500">
                        {user.position_title ?? <span className="text-neutral-200">—</span>}
                      </td>
                      <td className="px-5 py-4 font-mono text-xs font-bold text-neutral-400">
                        {user.employee_code ?? <span className="text-neutral-200">—</span>}
                      </td>
                      <td className="px-5 py-4">
                        <span className={cx(
                          "inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                          user.is_active
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                            : "bg-neutral-50 text-neutral-400 border-neutral-100"
                        )}>
                          <span className={cx(
                            "h-1.5 w-1.5 rounded-full",
                            user.is_active ? "bg-emerald-500" : "bg-neutral-300"
                          )} />
                          {user.is_active ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(user)}
                            className="h-8 w-8 rounded-xl border border-neutral-100 flex items-center justify-center text-neutral-400 hover:bg-neutral-50 hover:text-obsidian transition"
                            title="Editar"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setToggleTarget(user)}
                            className={cx(
                              "h-8 w-8 rounded-xl border flex items-center justify-center transition",
                              user.is_active
                                ? "border-rose-100 text-rose-400 hover:bg-rose-50"
                                : "border-emerald-100 text-emerald-500 hover:bg-emerald-50"
                            )}
                            title={user.is_active ? "Desactivar" : "Activar"}
                          >
                            {user.is_active
                              ? <UserX className="h-3.5 w-3.5" />
                              : <UserCheck className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            onClick={() => setDeleteTarget(user)}
                            className="h-8 w-8 rounded-xl border border-rose-100 text-rose-400 flex items-center justify-center hover:bg-rose-50 transition"
                            title="Eliminar"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <UserModal
        open={modalOpen}
        mode={modalMode}
        initial={editTarget}
        suggestedCode={suggestedCode}
        onClose={() => setModalOpen(false)}
        onSaved={onSaved}
      />

      <ConfirmToggleModal
        open={!!toggleTarget}
        user={toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={confirmToggle}
        loading={toggling}
      />

      <ConfirmDeleteModal
        open={!!deleteTarget}
        user={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </>
  );
}