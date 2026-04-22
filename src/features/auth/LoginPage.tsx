//features/auth/LoginPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { auth } from "./store";
import { login as apiLogin } from "./api";


// ─── Rate limiting con cooldown exponencial ──────────────────────────────────
const COOLDOWN_STEPS = [3000, 10000, 30000]; // 3s, 10s, 30s

export default function LoginPage() {
  const nav = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [caps, setCaps] = useState(false);

  // Rate limiting state
  const [failCount, setFailCount] = useState(0);
  const [cooldownEnd, setCooldownEnd] = useState<number | null>(null);
  const [cooldownLeft, setCooldownLeft] = useState(0);

  // A11y: ref para enfocar el error
  const errorRef = useRef<HTMLDivElement>(null);

  const from = useMemo(() => {
    const state = location.state as any;
    return state?.from?.pathname ?? null;
  }, [location.state]);

  function defaultLanding(role?: string) {
    return role === "empleado" ? "/app/employee/dashboard" : "/app/manager/dashboard";
  }

  // ✅ si ya está logueado y cae a /login -> lo mandas a su landing
  useEffect(() => {
    const s = auth.get();
    if (s.token && s.user) {
      nav(defaultLanding(s.user.role), { replace: true });
    }
  }, [nav]);

  // ─── Cooldown timer ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!cooldownEnd) return;
    const interval = setInterval(() => {
      const remaining = cooldownEnd - Date.now();
      if (remaining <= 0) {
        setCooldownEnd(null);
        setCooldownLeft(0);
      } else {
        setCooldownLeft(Math.ceil(remaining / 1000));
      }
    }, 200);
    return () => clearInterval(interval);
  }, [cooldownEnd]);

  // ─── Focus en error para accesibilidad ───────────────────────────────────────
  useEffect(() => {
    if (err && errorRef.current) {
      errorRef.current.focus();
    }
  }, [err]);

  const isCoolingDown = cooldownEnd !== null && Date.now() < cooldownEnd;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isCoolingDown) return;

    setErr(null);
    setLoading(true);

    try {
      const res = await apiLogin(email.trim(), password);

      // Guardar auth y resetear contadores
      auth.set({ token: res.token, user: res.user });
      setFailCount(0);
      setCooldownEnd(null);

      const target = from ?? defaultLanding(res.user?.role);
      nav(target, { replace: true });
    } catch (e: any) {
      const newFails = failCount + 1;
      setFailCount(newFails);
      setErr(e?.response?.data?.message ?? "No se pudo iniciar sesión. Verifica tus credenciales.");

      // Aplicar cooldown exponencial después de 3 intentos
      if (newFails >= 3) {
        const stepIdx = Math.min(newFails - 3, COOLDOWN_STEPS.length - 1);
        const ms = COOLDOWN_STEPS[stepIdx];
        setCooldownEnd(Date.now() + ms);
        setCooldownLeft(Math.ceil(ms / 1000));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex bg-neutral-50 font-sans">

      {/* ── Left Panel: Brand Experience (Hidden on Mobile) ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-obsidian relative overflow-hidden flex-col justify-between p-12">
        {/* Abstract shapes / Glows */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white/[0.03] blur-3xl animate-pulse" />
          <div className="absolute top-1/2 -right-32 h-80 w-80 rounded-full bg-gold/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 h-72 w-[38rem] rounded-full bg-emerald-500/5 blur-3xl" />
        </div>

        {/* Top Logo */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-3 rounded-[24px] bg-white/5 border border-white/10 px-5 py-2.5 backdrop-blur-md shadow-2xl">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
            <span className="text-xl font-black tracking-tight text-white">Kore</span>
            <span className="text-white/50 text-[10px] font-bold tracking-[0.2em] uppercase ml-1">Ops Suite</span>
          </div>
        </div>

        {/* Hero Copy */}
        <div className="relative z-10 max-w-xl">
          <h1 className="text-[3rem] font-black text-white tracking-tight leading-[1.1] mb-6">
            Panel de Control DecorArte
          </h1>
          <p className="text-lg text-white/50 font-medium leading-relaxed max-w-md">
            Gestion de RH y Operaciones precisas. <br /> Todo en un solo lugar.
          </p>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">
          © {new Date().getFullYear()} Kore-DecorArte
        </div>
      </div>

      {/* ── Right Panel: Login Form ── */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 lg:px-24 relative">
        <div className="w-full max-w-sm mx-auto">

          {/* Mobile Logo */}
          <div className="lg:hidden mb-12 text-center flex justify-center">
            <div className="inline-flex items-center gap-3 rounded-[24px] bg-obsidian px-5 py-2.5 shadow-xl">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="text-xl font-black tracking-tight text-white">Kore</span>
              <span className="text-white/50 text-[10px] font-bold tracking-[0.2em] uppercase ml-1">Ops Suite</span>
            </div>
          </div>

          <div className="mb-10 lg:mb-12 text-center lg:text-left">
            <h2 className="text-3xl font-black text-obsidian tracking-tight">Iniciar Sesión</h2>
            <p className="mt-3 text-sm font-medium text-neutral-500 leading-relaxed">
              Ingresa tus credenciales para acceder a tu entorno de trabajo seguro.
            </p>
          </div>

          {err ? (
            <div
              ref={errorRef}
              tabIndex={-1}
              role="alert"
              className="mb-8 rounded-[24px] border border-rose-200 bg-rose-50/50 p-5 shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                  <span className="text-sm font-bold">!</span>
                </div>
                <div>
                  <div className="text-xs font-bold text-rose-800 uppercase tracking-widest">Error de acceso</div>
                  <div className="mt-1 text-sm font-medium text-rose-600 leading-relaxed">{err}</div>
                </div>
              </div>
            </div>
          ) : null}



          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-2">Correo Electrónico</label>
              <input
                id="login-email"
                className="w-full rounded-2xl border border-neutral-200 bg-white px-5 py-3.5 text-sm font-medium text-obsidian placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-obsidian/5 transition-all shadow-sm"
                placeholder="correo@kore.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                inputMode="email"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between ml-2">
                <label htmlFor="login-password" className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Contraseña</label>
                {caps ? (
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Caps Lock
                  </span>
                ) : null}
              </div>

              <div className="relative flex items-center">
                <input
                  id="login-password"
                  className="w-full rounded-2xl border border-neutral-200 bg-white px-5 py-3.5 text-sm font-medium text-obsidian placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-obsidian/5 transition-all shadow-sm pr-20"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyUp={(e) => setCaps((e.getModifierState && e.getModifierState("CapsLock")) || false)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest hover:text-obsidian transition-colors"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPass ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-300 text-obsidian focus:ring-obsidian/20 transition-all cursor-pointer accent-obsidian"
                />
                <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest group-hover:text-obsidian transition-colors">
                  Recordarme
                </span>
              </label>

              <button type="button" className="text-[11px] font-bold text-neutral-400 hover:text-obsidian uppercase tracking-widest transition-colors">
                ¿Olvidaste tu clave?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim() || !password.trim() || isCoolingDown}
              className="mt-6 w-full rounded-2xl bg-obsidian text-white px-6 py-4 text-xs font-bold tracking-widest uppercase hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-obsidian focus:ring-offset-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Verificando...
                </>
              ) : isCoolingDown ? (
                `Espera ${cooldownLeft}s`
              ) : (
                "Ingresar"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
