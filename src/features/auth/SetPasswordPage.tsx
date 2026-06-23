import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import api from "@/lib/http";
import { getApiErrorMessage } from "@/lib/error";

export default function SetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);

  const [validating, setValidating] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setTokenError("El enlace de activación no es válido. Solicita uno nuevo al administrador.");
      setValidating(false);
      return;
    }

    api
      .post("/auth/activate/check", { token })
      .then((res) => {
        setUserEmail(res.data?.user?.email ?? null);
      })
      .catch((e) => {
        setTokenError(getApiErrorMessage(e, "El enlace de activación no es válido o ha expirado."));
      })
      .finally(() => {
        setValidating(false);
      });
  }, [token]);

  function validatePassword(value: string): string | null {
    if (value.length < 8) return "La contraseña debe tener al menos 8 caracteres.";
    if (!/[a-z]/.test(value)) return "Debe incluir al menos una minúscula.";
    if (!/[A-Z]/.test(value)) return "Debe incluir al menos una mayúscula.";
    if (!/[0-9]/.test(value)) return "Debe incluir al menos un número.";
    if (!/[^A-Za-z0-9]/.test(value)) return "Debe incluir al menos un símbolo.";
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    const validationError = validatePassword(password);
    if (validationError) {
      setErr(validationError);
      return;
    }

    if (password !== passwordConfirmation) {
      setErr("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/activate", {
        token,
        password,
        password_confirmation: passwordConfirmation,
      });
      setSuccess(true);
    } catch (e) {
      setErr(getApiErrorMessage(e, "No se pudo activar la cuenta. Intenta de nuevo."));
    } finally {
      setLoading(false);
    }
  }

  if (validating) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-k-bg-card2">
        <Loader2 className="h-8 w-8 animate-spin text-k-text-h" />
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-k-bg-card2 px-6">
        <div className="w-full max-w-md rounded-[24px] border border-k-border bg-k-bg-card p-8 shadow-k-card text-center animate-fade-in">
          <AlertCircle className="mx-auto h-12 w-12 text-rose-500 mb-4" />
          <h1 className="text-xl font-black text-k-text-h mb-2">Enlace no válido</h1>
          <p className="text-sm text-k-text-b leading-relaxed mb-6">{tokenError}</p>
          <button
            onClick={() => navigate("/login")}
            className="w-full rounded-2xl bg-k-accent-btn text-k-accent-btn-text px-6 py-3 text-xs font-bold tracking-widest uppercase hover:opacity-90 transition-all"
          >
            Ir al inicio de sesión
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-k-bg-card2 px-6">
        <div className="w-full max-w-md rounded-[24px] border border-k-border bg-k-bg-card p-8 shadow-k-card text-center animate-fade-in">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500 mb-4" />
          <h1 className="text-xl font-black text-k-text-h mb-2">¡Cuenta activada!</h1>
          <p className="text-sm text-k-text-b leading-relaxed mb-6">
            Tu contraseña se ha establecido correctamente. Ya puedes iniciar sesión.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="w-full rounded-2xl bg-k-accent-btn text-k-accent-btn-text px-6 py-3 text-xs font-bold tracking-widest uppercase hover:opacity-90 transition-all"
          >
            Iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-k-bg-card2 px-6">
      <div className="w-full max-w-md rounded-[24px] border border-k-border bg-k-bg-card p-8 shadow-k-card animate-fade-in">
        <h1 className="text-2xl font-black text-k-text-h mb-2">Establece tu contraseña</h1>
        <p className="text-sm text-k-text-b leading-relaxed mb-6">
          Activa tu cuenta de {userEmail ? <strong>{userEmail}</strong> : "Kore"} creando una contraseña segura.
        </p>

        {err ? (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50/50 p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
              <p className="text-sm font-medium text-rose-600">{err}</p>
            </div>
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-[10px] font-bold text-k-text-b uppercase tracking-widest ml-2">
              Nueva contraseña
            </label>
            <div className="relative flex items-center">
              <input
                id="password"
                className="w-full rounded-2xl border border-k-border bg-k-bg-card2 px-5 py-3.5 text-sm font-medium text-k-text-h placeholder:text-k-text-b focus:outline-none focus:ring-2 focus:ring-obsidian/5 transition-all shadow-k-card pr-20"
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            <label htmlFor="password_confirmation" className="text-[10px] font-bold text-k-text-b uppercase tracking-widest ml-2">
              Confirmar contraseña
            </label>
            <input
              id="password_confirmation"
              className="w-full rounded-2xl border border-k-border bg-k-bg-card2 px-5 py-3.5 text-sm font-medium text-k-text-h placeholder:text-k-text-b focus:outline-none focus:ring-2 focus:ring-obsidian/5 transition-all shadow-k-card"
              type={showPass ? "text" : "password"}
              placeholder="••••••••"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <ul className="text-[11px] text-k-text-b space-y-1">
            <li className={password.length >= 8 ? "text-emerald-600" : ""}>• Mínimo 8 caracteres</li>
            <li className={/[a-z]/.test(password) ? "text-emerald-600" : ""}>• Al menos una minúscula</li>
            <li className={/[A-Z]/.test(password) ? "text-emerald-600" : ""}>• Al menos una mayúscula</li>
            <li className={/[0-9]/.test(password) ? "text-emerald-600" : ""}>• Al menos un número</li>
            <li className={/[^A-Za-z0-9]/.test(password) ? "text-emerald-600" : ""}>• Al menos un símbolo</li>
          </ul>

          <button
            type="submit"
            disabled={loading || !password.trim() || !passwordConfirmation.trim()}
            className="w-full rounded-2xl bg-k-accent-btn text-k-accent-btn-text px-6 py-4 text-xs font-bold tracking-widest uppercase hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Activando...
              </>
            ) : (
              "Activar cuenta"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
