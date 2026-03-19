// src/features/employees/EmpleadosPage.tsx
import { useEffect, useState, useCallback } from "react";
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
    <div className={cx("h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0", color)}>
      {initials}
    </div>
  );
}

// ─── Badge de rol ─────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: string }) {
  const conf =
    role === "admin"
      ? "bg-violet-50 text-violet-700 border-violet-200"
      : role === "supervisor"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : "bg-neutral-50 text-neutral-600 border-neutral-200";
  const label =
    role === "admin" ? "Admin" : role === "supervisor" ? "Supervisor" : "Empleado";
  return (
    <span className={cx("inline-flex rounded-full border px-2.5 py-1 text-xs font-medium", conf)}>
      {label}
    </span>
  );
}

// ─── Modal crear/editar ───────────────────────────────────────────────────────
function UserModal({
  open,
  mode,
  initial,
  onClose,
  onSaved,
}: {
  open: boolean;
  mode: "create" | "edit";
  initial?: UserItem | null;
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
      setEmployeeCode("");
      setHiredAt("");
      setPaymentType("hourly");
      setHourlyRate("");
      setDailyRate("");
    }
  }, [open, initial]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-3xl border bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <div className="font-semibold text-lg">
              {mode === "create" ? "Nuevo Usuario" : "Editar Usuario"}
            </div>
            <div className="text-xs text-neutral-500 mt-0.5">
              {mode === "create"
                ? "Crea la cuenta de acceso y el perfil del empleado"
                : "Modifica los datos del usuario"}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-neutral-200 px-3 py-1.5 text-sm hover:bg-neutral-50 transition"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {err && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {err}
            </div>
          )}

          {/* Sección cuenta */}
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
            Cuenta de acceso
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <div className="text-xs text-neutral-500 mb-1">Nombre completo *</div>
              <input
                className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black/10"
                placeholder="Ej. Juan Pérez"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="col-span-2 md:col-span-1">
              <div className="text-xs text-neutral-500 mb-1">Correo electrónico *</div>
              <input
                type="email"
                className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black/10"
                placeholder="juan@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="col-span-2 md:col-span-1">
              <div className="text-xs text-neutral-500 mb-1">Rol *</div>
              <select
                className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black/10 bg-white"
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
              >
                <option value="empleado">Empleado</option>
                <option value="supervisor">Supervisor</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="col-span-2">
              <div className="text-xs text-neutral-500 mb-1">
                Contraseña {mode === "edit" ? "(dejar vacío para no cambiar)" : "*"}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black/10 pr-10"
                  placeholder={mode === "create" ? "Mínimo 6 caracteres" : "Nueva contraseña (opcional)"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 text-xs"
                >
                  {showPassword ? "Ocultar" : "Ver"}
                </button>
              </div>
            </div>
          </div>

          {/* Sección empleado */}
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide pt-2">
            Datos del empleado
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-neutral-500 mb-1">Número de empleado</div>
              <input
                className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black/10"
                placeholder="Ej. EMP-001"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
              />
            </div>

            <div>
              <div className="text-xs text-neutral-500 mb-1">Fecha de ingreso</div>
              <input
                type="date"
                className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black/10"
                value={hiredAt}
                onChange={(e) => setHiredAt(e.target.value)}
              />
            </div>

            <div className="col-span-2">
              <div className="text-xs text-neutral-500 mb-1">Puesto</div>
              <input
                className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black/10"
                placeholder="Ej. Auxiliar de almacén"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
              />
            </div>
          </div>

          {/* Sección nómina */}
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide pt-2">
            Configuración de Nómina
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <div className="text-xs text-neutral-500 mb-1">Tipo de pago</div>
              <div className="grid grid-cols-2 gap-2">
                {(["hourly", "daily"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setPaymentType(t)}
                    className={cx(
                      "rounded-xl border px-4 py-2.5 text-sm font-medium transition text-left",
                      paymentType === t
                        ? "bg-neutral-900 text-white border-neutral-900"
                        : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
                    )}
                  >
                    <div className="font-semibold">{t === "hourly" ? "⏱ Por hora" : "📅 Por día"}</div>
                    <div className={cx("text-xs mt-0.5", paymentType === t ? "text-white/60" : "text-neutral-400")}>
                      {t === "hourly" ? "Tarifa × horas trabajadas" : "Tarifa × días asistidos"}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {paymentType === "hourly" ? (
              <div className="col-span-2">
                <div className="text-xs text-neutral-500 mb-1">Tarifa por hora ($)</div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full rounded-xl border border-neutral-200 pl-7 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black/10"
                    placeholder="0.00"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="col-span-2">
                <div className="text-xs text-neutral-500 mb-1">Tarifa por día ($)</div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full rounded-xl border border-neutral-200 pl-7 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black/10"
                    placeholder="0.00"
                    value={dailyRate}
                    onChange={(e) => setDailyRate(e.target.value)}
                  />
                </div>
                <div className="mt-1.5 rounded-xl bg-blue-50 border border-blue-100 px-3 py-2 text-xs text-blue-700">
                  💡 Los empleados por día tienen 1 día de descanso pagado por semana
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t bg-neutral-50">
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50 transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 transition disabled:opacity-40"
          >
            {saving ? "Guardando..." : mode === "create" ? "Crear usuario" : "Guardar cambios"}
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
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Usuarios</h1>
            <p className="text-sm text-neutral-500 mt-0.5">
              Gestiona las cuentas de acceso y perfiles del equipo.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-2xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 transition shadow-sm"
          >
            + Nuevo usuario
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div className={cx(
            "rounded-2xl border px-4 py-3 text-sm font-medium",
            toast.type === "ok"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          )}>
            {toast.type === "ok" ? "✅" : "❌"} {toast.msg}
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total", val: total, cls: "bg-white" },
            { label: "Activos", val: active, cls: "bg-emerald-50 border-emerald-100", num: "text-emerald-700" },
            { label: "Inactivos", val: inactive, cls: "bg-neutral-50", num: inactive > 0 ? "text-rose-600" : "text-neutral-400" },
          ].map((k) => (
            <div key={k.label} className={cx("rounded-3xl border p-4 text-center shadow-sm", k.cls)}>
              <div className="text-xs text-neutral-500">{k.label}</div>
              <div className={cx("text-3xl font-bold mt-1", k.num ?? "text-neutral-800")}>{k.val}</div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-2">
          <input
            className="flex-1 rounded-2xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black/10"
            placeholder="Buscar por nombre, email o puesto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black/10"
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
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{err}</div>
        )}

        {/* Tabla */}
        <div className="rounded-3xl border bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-sm text-neutral-500">Cargando usuarios...</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-sm text-neutral-500">
              {search || roleFilter ? "Sin resultados para ese filtro." : "Sin usuarios aún. Crea el primero."}
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="text-left p-3 pl-5">Usuario</th>
                    <th className="text-left p-3">Rol</th>
                    <th className="text-left p-3">Puesto</th>
                    <th className="text-left p-3">No. empleado</th>
                    <th className="text-left p-3">Estado</th>
                    <th className="text-left p-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className={cx(
                      "border-t transition",
                      !user.is_active ? "opacity-50" : "hover:bg-neutral-50/60"
                    )}>
                      <td className="p-3 pl-5">
                        <div className="flex items-center gap-3">
                          <Avatar name={user.name} />
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-xs text-neutral-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="p-3 text-neutral-600">
                        {user.position_title ?? <span className="text-neutral-400">—</span>}
                      </td>
                      <td className="p-3 font-mono text-xs text-neutral-600">
                        {user.employee_code ?? <span className="text-neutral-400">—</span>}
                      </td>
                      <td className="p-3">
                        <span className={cx(
                          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                          user.is_active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-neutral-50 text-neutral-500 border-neutral-200"
                        )}>
                          <span className={cx(
                            "h-1.5 w-1.5 rounded-full",
                            user.is_active ? "bg-emerald-500" : "bg-neutral-400"
                          )} />
                          {user.is_active ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(user)}
                            className="rounded-xl border border-neutral-200 px-3 py-1.5 text-xs font-medium hover:bg-neutral-50 transition"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => setToggleTarget(user)}
                            className={cx(
                              "rounded-xl border px-3 py-1.5 text-xs font-medium transition",
                              user.is_active
                                ? "border-rose-200 text-rose-600 hover:bg-rose-50"
                                : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                            )}
                          >
                            {user.is_active ? "Desactivar" : "Activar"}
                          </button>
                          <button
                            onClick={() => setDeleteTarget(user)}
                            className="rounded-xl border border-red-200 text-red-600 px-3 py-1.5 text-xs font-medium hover:bg-red-50 transition"
                          >
                            Eliminar
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

      {/* Modals */}
      <UserModal
        open={modalOpen}
        mode={modalMode}
        initial={editTarget}
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