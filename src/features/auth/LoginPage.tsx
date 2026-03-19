//features/auth/LoginPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { auth } from "./store";
import { login as apiLogin } from "./api";

type DemoUser = { label: string; email: string; pass: string };

const DEMOS: DemoUser[] = [
  { label: "Admin", email: "adan@deco.com", pass: "Chivas2017" },
  { label: "Supervisor", email: "joselin@deco.com", pass: "jos1123456" },
  { label: "Empleado", email: "kevin@deco.com", pass: "kevin123456" },
];

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

  function fillDemo(d: DemoUser) {
    setEmail(d.email);
    setPassword(d.pass);
    setErr(null);
  }

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
    <div className="min-h-screen bg-neutral-950 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute top-40 -right-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-72 w-[38rem] rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Brand */}
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-white border border-white/10">
              <div className="h-2.5 w-2.5 rounded-full bg-white" />
              <span className="font-semibold tracking-tight">Kore</span>
              <span className="text-white/60 text-xs">Ops Suite</span>
            </div>

            <h1 className="mt-4 text-3xl font-semibold text-white tracking-tight">
              Bienvenido de vuelta
            </h1>
            <p className="mt-2 text-sm text-white/60">
              Inicia sesión para gestionar tareas, evidencias y operación diaria.
            </p>
          </div>

          {/* Card */}
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-5 shadow-2xl">
            {err ? (
              <div className="mb-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200">
                <div className="font-medium">No se pudo iniciar sesión</div>
                <div className="text-rose-200/80">{err}</div>
              </div>
            ) : null}

            {/* Demo quick fill */}
            <div className="mb-4 flex flex-wrap gap-2">
              {DEMOS.map((d) => (
                <button
                  key={d.label}
                  type="button"
                  onClick={() => fillDemo(d)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 hover:text-white hover:bg-white/10 transition"
                >
                  Usar demo: <span className="text-white">{d.label}</span>
                </button>
              ))}
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <label className="block">
                <span className="text-xs text-white/60">Correo</span>
                <input
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                  placeholder="correo@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  inputMode="email"
                />
              </label>

              <label className="block">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/60">Contraseña</span>
                  {caps ? (
                    <span className="text-[11px] text-amber-200/80 border border-amber-200/20 bg-amber-200/10 px-2 py-1 rounded-full">
                      Caps Lock activado
                    </span>
                  ) : null}
                </div>

                <div className="mt-1 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 focus-within:ring-2 focus-within:ring-white/20">
                  <input
                    className="w-full bg-transparent text-white placeholder:text-white/30 focus:outline-none"
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyUp={(e) => setCaps((e.getModifierState && e.getModifierState("CapsLock")) || false)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="text-xs text-white/60 hover:text-white"
                    onClick={() => setShowPass((v) => !v)}
                  >
                    {showPass ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </label>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-white/60 select-none">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="accent-white"
                  />
                  Recordarme
                </label>

                <span className="text-xs text-white/40">
                  (próximo: “Olvidé mi contraseña” 😉)
                </span>
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim() || !password.trim()}
                className="w-full rounded-2xl bg-white text-neutral-900 py-3 font-medium hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? "Entrando..." : "Iniciar sesión"}
              </button>
            </form>

            <div className="mt-4 text-xs text-white/40">
              Tip: usa demo para validar roles (admin/supervisor/empleado). Kore te redirige automático.
            </div>

            <div className="mt-3 text-center">
              <Link to="/register" className="text-sm text-white/60 hover:text-white transition">
                ¿No tienes cuenta? Regístrate
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
