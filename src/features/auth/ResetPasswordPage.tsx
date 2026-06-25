import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams, useNavigate } from "react-router-dom";
import { resetPassword } from "./api";

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get("email") || "";
  const nav = useNavigate();

  const [email, setEmail] = useState(emailParam);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [caps, setCaps] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (err && errorRef.current) {
      errorRef.current.focus();
    }
  }, [err]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSuccess(null);

    if (!email.trim() || !password.trim() || !passwordConfirmation.trim()) {
      setErr("Todos los campos son obligatorios.");
      return;
    }

    if (password !== passwordConfirmation) {
      setErr("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      await resetPassword({
        token,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      setSuccess("Tu contraseña ha sido restablecida correctamente. Ahora puedes iniciar sesión.");
      setTimeout(() => {
        nav("/login");
      }, 3000);
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "No se pudo restablecer la contraseña. El enlace puede haber expirado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-k-bg w-full">
      {/* ── Left Panel: Branding / Visual ── */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-obsidian flex-col justify-between p-12 overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-emerald-500/10 blur-[120px]" />
          <div className="absolute top-[40%] -right-[20%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[100px]" />
          <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] rounded-full bg-rose-500/10 blur-[100px]" />
        </div>

        {/* Top Logo */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-3 rounded-[24px] bg-k-bg-card/5 border border-white/10 px-5 py-2.5 backdrop-blur-md shadow-2xl">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
            <span className="text-xl font-black tracking-tight text-white">Kore</span>
            <span className="text-white/50 text-[10px] font-bold tracking-[0.2em] uppercase ml-1">Ops Suite</span>
          </div>
        </div>

        {/* Hero Copy */}
        <div className="relative z-10 max-w-xl">
          <h1 className="text-[3rem] font-black text-white tracking-tight leading-[1.1] mb-6">
            Crea tu nueva contraseña
          </h1>
          <p className="text-lg text-white/50 font-medium leading-relaxed max-w-md">
            Asegúrate de usar una contraseña fuerte y que no hayas usado antes en otros sitios.
          </p>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">
          © {new Date().getFullYear()} Kore-DecorArte
        </div>
      </div>

      {/* ── Right Panel: Form ── */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 lg:px-24 relative">
        <div className="w-full max-w-sm mx-auto">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-12 text-center flex justify-center">
            <div className="inline-flex items-center gap-3 rounded-[24px] bg-k-bg-sidebar px-5 py-2.5 shadow-xl">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-lg font-black tracking-tight text-k-text-h">Kore</span>
            </div>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-2xl font-black text-k-text-h tracking-tight mb-2">Restablecer Clave</h2>
            <p className="text-sm font-medium text-k-text-b leading-relaxed">
              Ingresa tu nueva contraseña para acceder.
            </p>
          </div>

          {err ? (
            <div
              ref={errorRef}
              tabIndex={-1}
              className="mb-8 rounded-2xl bg-rose-50 border border-rose-200/50 p-5 shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                  <span className="text-sm font-bold">!</span>
                </div>
                <div>
                  <div className="text-xs font-bold text-rose-800 uppercase tracking-widest">Error</div>
                  <div className="mt-1 text-sm font-medium text-rose-600 leading-relaxed">{err}</div>
                </div>
              </div>
            </div>
          ) : null}

          {success ? (
            <div className="mb-8 rounded-2xl bg-emerald-50 border border-emerald-200/50 p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-800 uppercase tracking-widest">Éxito</div>
                  <div className="mt-1 text-sm font-medium text-emerald-600 leading-relaxed">{success}</div>
                </div>
              </div>
            </div>
          ) : null}

          {!success && (
            <form onSubmit={onSubmit} className="space-y-5">
              <div className="space-y-1.5 hidden">
                <input type="hidden" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between ml-2">
                  <label htmlFor="new-password" className="text-[10px] font-bold text-k-text-b uppercase tracking-widest">Nueva Contraseña</label>
                  {caps ? (
                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Caps Lock
                    </span>
                  ) : null}
                </div>
                <div className="relative flex items-center">
                  <input
                    id="new-password"
                    className="w-full rounded-2xl border border-k-border bg-k-bg-card px-5 py-3.5 text-sm font-medium text-k-text-h placeholder:text-k-text-b focus:outline-none focus:ring-2 focus:ring-obsidian/5 transition-all shadow-k-card pr-20"
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyUp={(e) => setCaps((e.getModifierState && e.getModifierState("CapsLock")) || false)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute right-4 text-[10px] font-bold text-k-text-b uppercase tracking-widest hover:text-k-text-h transition-colors"
                    onClick={() => setShowPass((v) => !v)}
                  >
                    {showPass ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password-confirm" className="text-[10px] font-bold text-k-text-b uppercase tracking-widest ml-2">Confirmar Contraseña</label>
                <div className="relative flex items-center">
                  <input
                    id="password-confirm"
                    className="w-full rounded-2xl border border-k-border bg-k-bg-card px-5 py-3.5 text-sm font-medium text-k-text-h placeholder:text-k-text-b focus:outline-none focus:ring-2 focus:ring-obsidian/5 transition-all shadow-k-card"
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !password.trim() || !passwordConfirmation.trim()}
                className="mt-6 w-full rounded-2xl bg-k-accent-btn text-k-accent-btn-text px-6 py-4 text-xs font-bold tracking-widest uppercase hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-obsidian focus:ring-offset-2 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Restableciendo...
                  </>
                ) : (
                  "Restablecer Contraseña"
                )}
              </button>
            </form>
          )}

          <div className="mt-8 text-center">
            <Link to="/login" className="text-[11px] font-bold text-k-text-b hover:text-k-text-h uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver al Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
