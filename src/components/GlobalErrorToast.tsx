// src/components/GlobalErrorToast.tsx
// Escucha el evento "kore-error" disparado desde el interceptor HTTP (§4.2)
// y muestra un toast global para errores 500+ del servidor.

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

type ErrorPayload = {
  message: string;
  status: number;
};

export default function GlobalErrorToast() {
  const [error, setError] = useState<ErrorPayload | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handler(e: Event) {
      const { message, status } = (e as CustomEvent).detail;
      setError({ message, status });
      setVisible(true);
    }

    window.addEventListener("kore-error", handler);
    return () => window.removeEventListener("kore-error", handler);
  }, []);

  // Auto-dismiss after 6 seconds
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setVisible(false), 6000);
    return () => clearTimeout(timer);
  }, [visible]);

  if (!visible || !error) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] animate-in slide-in-from-bottom">
      <div className="bg-rose-600 text-white rounded-[20px] p-4 shadow-2xl flex items-start gap-3 max-w-sm">
        <div className="h-9 w-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm">Error del Servidor</div>
          <div className="text-white/80 text-xs mt-0.5">{error.message}</div>
          <div className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">
            Código {error.status}
          </div>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="text-white/40 hover:text-white transition shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
