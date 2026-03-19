// src/features/auth/RegisterPage.tsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth } from "./store";
import { register, type RegisterPayload } from "./api";

function cx(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(" ");
}

const INDUSTRIES = ["Retail", "Restaurante", "Manufactura", "Servicios", "Otro"];
const RANGES = ["1-10", "11-50", "51-200", "200+"];

const MODULES = [
  { key: "tareas", label: "Tareas", desc: "Asigna y supervisa tareas con evidencias", icon: "📋" },
  { key: "asistencia", label: "Asistencia", desc: "Control de entrada/salida del equipo", icon: "🕐" },
  { key: "nomina", label: "Nómina", desc: "Calcula y aprueba el pago semanal", icon: "💰" },
  { key: "configuracion", label: "Configuración", desc: "Gestión de la plataforma", icon: "⚙️", alwaysOn: true },
];

export default function RegisterPage() {
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Step 1
  const [empresaName, setEmpresaName] = useState("");
  const [industry, setIndustry] = useState("");
  const [employeeRange, setEmployeeRange] = useState("");

  // Step 2
  const [modules, setModules] = useState<string[]>(["tareas", "asistencia", "nomina", "configuracion"]);

  // Step 3
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  function toggleModule(key: string) {
    if (key === "configuracion") return;
    setModules((prev) =>
      prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]
    );
  }

  const canStep1 = empresaName.trim().length > 0;
  const canStep2 = modules.filter((m) => m !== "configuracion").length >= 1;
  const canStep3 =
    adminName.trim().length > 0 &&
    adminEmail.trim().length > 0 &&
    adminPassword.length >= 6 &&
    adminPassword === confirmPassword;

  async function handleSubmit() {
    setLoading(true);
    setErr(null);
    try {
      const payload: RegisterPayload = {
        empresa_name: empresaName.trim(),
        industry,
        employee_range: employeeRange,
        modules,
        admin_name: adminName.trim(),
        admin_email: adminEmail.trim(),
        admin_password: adminPassword,
      };
      const res = await register(payload);
      auth.set({ token: res.token, user: res.user });
      auth.setModules(modules);
      nav("/app/manager/dashboard", { replace: true });
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "Error al registrar. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute top-40 -right-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-72 w-[38rem] rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          {/* Brand */}
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-white border border-white/10">
              <div className="h-2.5 w-2.5 rounded-full bg-white" />
              <span className="font-semibold tracking-tight">Kore</span>
              <span className="text-white/60 text-xs">Ops Suite</span>
            </div>
            <h1 className="mt-4 text-3xl font-semibold text-white tracking-tight">
              Crea tu empresa
            </h1>
            <p className="mt-2 text-sm text-white/60">
              Configura tu cuenta en 3 sencillos pasos
            </p>
          </div>

          {/* Steps indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={cx(
                  "flex items-center gap-2",
                  s < 3 && "flex-1"
                )}
              >
                <div
                  className={cx(
                    "h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all",
                    step === s
                      ? "bg-white text-neutral-900"
                      : step > s
                      ? "bg-emerald-500 text-white"
                      : "bg-white/10 text-white/40"
                  )}
                >
                  {step > s ? "✓" : s}
                </div>
                {s < 3 && (
                  <div className={cx("flex-1 h-0.5 rounded-full", step > s ? "bg-emerald-500" : "bg-white/10")} />
                )}
              </div>
            ))}
          </div>

          {/* Card */}
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-5 shadow-2xl">
            {err && (
              <div className="mb-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200">
                {err}
              </div>
            )}

            {/* Step 1: Datos de la empresa */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="text-sm font-medium text-white/80 mb-2">Datos de la empresa</div>

                <label className="block">
                  <span className="text-xs text-white/60">Nombre de la empresa *</span>
                  <input
                    className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                    placeholder="Mi empresa"
                    value={empresaName}
                    onChange={(e) => setEmpresaName(e.target.value)}
                  />
                </label>

                <label className="block">
                  <span className="text-xs text-white/60">Industria</span>
                  <select
                    className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                  >
                    <option value="" className="bg-neutral-900">Selecciona...</option>
                    {INDUSTRIES.map((i) => (
                      <option key={i} value={i} className="bg-neutral-900">{i}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs text-white/60">Rango de empleados</span>
                  <select
                    className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                    value={employeeRange}
                    onChange={(e) => setEmployeeRange(e.target.value)}
                  >
                    <option value="" className="bg-neutral-900">Selecciona...</option>
                    {RANGES.map((r) => (
                      <option key={r} value={r} className="bg-neutral-900">{r}</option>
                    ))}
                  </select>
                </label>

                <button
                  onClick={() => setStep(2)}
                  disabled={!canStep1}
                  className="w-full rounded-2xl bg-white text-neutral-900 py-3 font-medium hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Siguiente →
                </button>
              </div>
            )}

            {/* Step 2: Módulos */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="text-sm font-medium text-white/80 mb-2">Módulos a activar</div>
                <p className="text-xs text-white/40 -mt-2">Selecciona al menos 1 módulo</p>

                <div className="space-y-2">
                  {MODULES.map((m) => {
                    const active = modules.includes(m.key);
                    return (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => toggleModule(m.key)}
                        disabled={m.alwaysOn}
                        className={cx(
                          "w-full text-left rounded-2xl border p-4 transition",
                          active
                            ? "border-emerald-400/40 bg-emerald-500/10"
                            : "border-white/10 bg-white/5 hover:bg-white/10",
                          m.alwaysOn && "opacity-70 cursor-not-allowed"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{m.icon}</span>
                            <div>
                              <div className="text-sm font-medium text-white">{m.label}</div>
                              <div className="text-xs text-white/50">{m.desc}</div>
                            </div>
                          </div>
                          <div
                            className={cx(
                              "h-5 w-9 rounded-full transition-all flex items-center px-0.5",
                              active ? "bg-emerald-500" : "bg-white/20"
                            )}
                          >
                            <div
                              className={cx(
                                "h-4 w-4 rounded-full bg-white transition-transform",
                                active ? "translate-x-4" : "translate-x-0"
                              )}
                            />
                          </div>
                        </div>
                        {m.alwaysOn && (
                          <div className="mt-1 text-xs text-white/40 ml-9">Siempre activo</div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 rounded-2xl border border-white/10 text-white py-3 font-medium hover:bg-white/5 transition"
                  >
                    ← Atrás
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={!canStep2}
                    className="flex-1 rounded-2xl bg-white text-neutral-900 py-3 font-medium hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Siguiente →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Cuenta admin */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="text-sm font-medium text-white/80 mb-2">Cuenta de administrador</div>

                <label className="block">
                  <span className="text-xs text-white/60">Nombre completo *</span>
                  <input
                    className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                    placeholder="Juan Pérez"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                  />
                </label>

                <label className="block">
                  <span className="text-xs text-white/60">Correo electrónico *</span>
                  <input
                    type="email"
                    className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                    placeholder="admin@empresa.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                  />
                </label>

                <label className="block">
                  <span className="text-xs text-white/60">Contraseña * (mínimo 6 caracteres)</span>
                  <input
                    type={showPass ? "text" : "password"}
                    className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                  />
                </label>

                <label className="block">
                  <span className="text-xs text-white/60">Confirmar contraseña *</span>
                  <input
                    type={showPass ? "text" : "password"}
                    className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </label>

                <label className="flex items-center gap-2 text-xs text-white/60 select-none">
                  <input
                    type="checkbox"
                    checked={showPass}
                    onChange={(e) => setShowPass(e.target.checked)}
                    className="accent-white"
                  />
                  Mostrar contraseñas
                </label>

                {adminPassword.length > 0 && adminPassword.length < 6 && (
                  <div className="text-xs text-amber-300">La contraseña debe tener al menos 6 caracteres</div>
                )}
                {confirmPassword.length > 0 && adminPassword !== confirmPassword && (
                  <div className="text-xs text-rose-300">Las contraseñas no coinciden</div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 rounded-2xl border border-white/10 text-white py-3 font-medium hover:bg-white/5 transition"
                  >
                    ← Atrás
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!canStep3 || loading}
                    className="flex-1 rounded-2xl bg-white text-neutral-900 py-3 font-medium hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {loading ? "Registrando..." : "Crear cuenta"}
                  </button>
                </div>
              </div>
            )}

            <div className="mt-4 text-center">
              <Link to="/login" className="text-sm text-white/60 hover:text-white transition">
                ¿Ya tienes cuenta? Inicia sesión
              </Link>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-white/40">
            © {new Date().getFullYear()} Kore · Operaciones con evidencia (y sin drama)
          </div>
        </div>
      </div>
    </div>
  );
}
