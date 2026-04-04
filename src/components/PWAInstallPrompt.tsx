import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detectar iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone = window.matchMedia('(display-mode: standalone)').matches;

    // Si ya está instalada, no mostrar nada
    if (standalone) return;

    if (ios) {
      setIsIOS(true);
      // Mostrar instrucciones iOS si no se descartó antes
      const dismissed = localStorage.getItem('pwa-ios-dismissed');
      if (!dismissed) setShowBanner(true);
      return;
    }

    // Android / Chrome
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  }

  function handleDismiss() {
    setShowBanner(false);
    localStorage.setItem(
      isIOS ? 'pwa-ios-dismissed' : 'pwa-install-dismissed',
      '1'
    );
  }

  if (!showBanner) return null;

  // Banner para iOS
  if (isIOS) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom">
        <div className="bg-[#313852] text-white rounded-[24px] p-5 shadow-2xl">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center">
                <Download className="h-5 w-5" />
              </div>
              <div>
                <div className="font-bold text-sm">Instalar Kore</div>
                <div className="text-white/60 text-xs">Acceso rápido desde tu pantalla de inicio</div>
              </div>
            </div>
            <button onClick={handleDismiss} className="text-white/40 hover:text-white transition">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 text-xs text-white/80 leading-relaxed">
            Toca <strong>Compartir</strong> (□↑) en Safari → luego
            <strong> "Agregar a pantalla de inicio"</strong>
          </div>
        </div>
      </div>
    );
  }

  // Banner para Android/Chrome
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom">
      <div className="bg-[#313852] text-white rounded-[24px] p-5 shadow-2xl flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
          <Download className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm">Instalar Kore</div>
          <div className="text-white/60 text-xs">
            Acceso rápido desde tu pantalla de inicio
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleDismiss}
            className="h-9 px-3 rounded-xl bg-white/10 text-xs font-bold hover:bg-white/20 transition"
          >
            Ahora no
          </button>
          <button
            onClick={handleInstall}
            className="h-9 px-4 rounded-xl bg-white text-[#313852] text-xs font-bold hover:bg-white/90 transition"
          >
            Instalar
          </button>
        </div>
      </div>
    </div>
  );
}
