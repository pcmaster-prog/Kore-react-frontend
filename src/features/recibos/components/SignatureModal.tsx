import { useState, useCallback } from "react";
import { X, Lock, Pen, AlertTriangle, Loader2, FileCheck } from "lucide-react";
import { cx } from "@/lib/utils";
import SignatureCanvas from "./SignatureCanvas";

interface SignatureModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  onConfirm: (payload: { signature_image: string; password: string }) => Promise<void>;
}

export default function SignatureModal({
  open,
  title,
  subtitle,
  onClose,
  onConfirm,
}: SignatureModalProps) {
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const handleClose = useCallback(() => {
    setSignatureImage(null);
    setPassword("");
    setError(null);
    setStep(1);
    onClose();
  }, [onClose]);

  const handleNext = () => {
    if (!signatureImage) {
      setError("Debes dibujar tu firma para continuar");
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleConfirm = async () => {
    if (!signatureImage) {
      setError("La firma es requerida");
      return;
    }
    if (!password || password.length < 1) {
      setError("Ingresa tu contraseña para confirmar");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onConfirm({ signature_image: signatureImage, password });
      handleClose();
    } catch (e: any) {
      setError(
        e?.response?.data?.message ??
        "No se pudo firmar el recibo. Verifica tu contraseña e intenta de nuevo."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-obsidian/60 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-k-bg-card rounded-[32px] border border-k-border shadow-2xl w-full max-w-lg overflow-hidden animate-in-fade">
        {/* Header */}
        <div className="px-6 py-5 border-b border-k-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-k-bg-sidebar border border-k-border flex items-center justify-center">
              <Pen className="h-5 w-5 text-k-sb-active" />
            </div>
            <div>
              <h3 className="text-base font-black text-k-text-h tracking-tight">{title}</h3>
              {subtitle && (
                <p className="text-[10px] font-bold text-k-text-b uppercase tracking-widest">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="h-8 w-8 rounded-xl hover:bg-k-bg-card2 flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4 text-k-text-b" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <div className="text-[10px] font-bold text-k-text-b uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Pen className="h-3.5 w-3.5" />
                  Paso 1: Dibuja tu firma
                </div>
                <p className="text-xs text-k-text-b mb-3">
                  Usa el mouse o tu dedo para firmar en el área de abajo. Asegúrate de que sea legible.
                </p>
                <SignatureCanvas
                  onChange={setSignatureImage}
                  width={440}
                  height={140}
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleNext}
                  disabled={!signatureImage}
                  className="inline-flex items-center gap-2 rounded-xl bg-k-bg-sidebar px-5 py-2.5 text-xs font-bold text-white hover:opacity-90 transition disabled:opacity-40"
                >
                  <Lock className="h-3.5 w-3.5" />
                  Confirmar con contraseña
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="text-[10px] font-bold text-k-text-b uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5" />
                  Paso 2: Confirma tu identidad
                </div>
                <p className="text-xs text-k-text-b mb-3">
                  Ingresa tu contraseña de Kore para verificar tu identidad y completar la firma del recibo.
                </p>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
                  placeholder="Tu contraseña"
                  className="w-full rounded-2xl border border-k-border bg-k-bg-card2 px-4 py-3 text-sm font-medium text-k-text-h outline-none focus:ring-2 focus:ring-obsidian/10"
                  autoFocus
                />
              </div>

              {/* Preview de firma */}
              {signatureImage && (
                <div className="rounded-xl border border-k-border bg-white p-3">
                  <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">
                    Vista previa de tu firma
                  </div>
                  <img
                    src={signatureImage}
                    alt="Firma"
                    className="h-12 object-contain"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="text-[11px] font-bold text-k-text-b hover:text-k-text-h transition"
                >
                  ← Volver a firmar
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading || !password}
                  className={cx(
                    "inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition",
                    loading || !password
                      ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                      : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20"
                  )}
                >
                  {loading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <FileCheck className="h-3.5 w-3.5" />
                  )}
                  {loading ? "Firmando..." : "Firmar recibo"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
