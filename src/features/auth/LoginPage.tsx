//features/auth/LoginPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { auth } from "./store";
import { login as apiLogin } from "./api";


export default function LoginPage() {
  const nav = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("adan@deco.com");
  const [password, setPassword] = useState("Chivas2017");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [caps, setCaps] = useState(false);

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


  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const res = await apiLogin(email.trim(), password);

      // si no quieres remember, puedes almacenar en sessionStorage en vez de localStorage.
      // por ahora: lo dejamos en local (simple)
      auth.set({ token: res.token, user: res.user });

      const target = from ?? defaultLanding(res.user?.role);
      nav(target, { replace: true });
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "No se pudo iniciar sesión. Verifica tus credenciales.");
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
            <div className="mb-8 rounded-[24px] border border-rose-200 bg-rose-50/50 p-5 shadow-sm">
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
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-2">Correo Electrónico</label>
              <input
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
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Contraseña</label>
                {caps ? (
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Caps Lock
                  </span>
                ) : null}
              </div>

              <div className="relative flex items-center">
                <input
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
              disabled={loading || !email.trim() || !password.trim()}
              className="mt-6 w-full rounded-2xl bg-obsidian text-white px-6 py-4 text-xs font-bold tracking-widest uppercase hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-obsidian focus:ring-offset-2"
            >
              {loading ? "Verificando..." : "Ingresar"}
            </button>
          </form>
            {/* //proximanete por empresa el registro
          <div className="mt-10 text-center">
            <Link to="/register" className="inline-flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase tracking-widest hover:text-obsidian transition-colors">
              ¿No tienes cuenta? <span className="text-obsidian underline decoration-neutral-300 underline-offset-4">Regístrate</span>
            </Link>
          </div> */}
        </div>
      </div>
    </div>
  );
}
