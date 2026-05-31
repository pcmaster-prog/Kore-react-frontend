import { useEffect, useState, useCallback } from 'react';
import {
  Bell, X, LogIn, Coffee, Play, LogOut, UtensilsCrossed,
  Clock, AlertTriangle, CheckCircle2
} from 'lucide-react';

type NotifPayload = {
  title: string;
  body: string;
  data?: {
    type?: string;
    [key: string]: any;
  };
};

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; accent: string }> = {
  check_in:     { icon: <LogIn className="h-4 w-4" />,       accent: "bg-emerald-500/20 text-emerald-300" },
  break_start:  { icon: <Coffee className="h-4 w-4" />,       accent: "bg-sky-500/20 text-sky-300" },
  break_end:    { icon: <Play className="h-4 w-4" />,         accent: "bg-amber-500/20 text-amber-300" },
  check_out:    { icon: <LogOut className="h-4 w-4" />,       accent: "bg-emerald-500/20 text-emerald-300" },
  lunch:        { icon: <UtensilsCrossed className="h-4 w-4" />, accent: "bg-amber-500/20 text-amber-300" },
  exit_soon:    { icon: <Clock className="h-4 w-4" />,        accent: "bg-orange-500/20 text-orange-300" },
  error:        { icon: <AlertTriangle className="h-4 w-4" />, accent: "bg-rose-500/20 text-rose-300" },
  success:      { icon: <CheckCircle2 className="h-4 w-4" />,  accent: "bg-emerald-500/20 text-emerald-300" },
};

function getConfig(type?: string) {
  if (!type) return { icon: <Bell className="h-4 w-4" />, accent: "bg-white/10 text-white" };
  return TYPE_CONFIG[type] ?? { icon: <Bell className="h-4 w-4" />, accent: "bg-white/10 text-white" };
}

export default function NotificationToast() {
  const [notif, setNotif] = useState<NotifPayload | null>(null);
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(100);
  const DURATION = 5000;

  const hide = useCallback(() => {
    setVisible(false);
    setProgress(100);
  }, []);

  useEffect(() => {
    function handler(e: Event) {
      const { title, body, data } = (e as CustomEvent).detail;
      setNotif({ title, body, data });
      setVisible(true);
      setProgress(100);
    }

    window.addEventListener('kore-notification', handler);
    return () => window.removeEventListener('kore-notification', handler);
  }, []);

  // Barra de progreso + auto-hide
  useEffect(() => {
    if (!visible) return;

    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.max(0, 100 - (elapsed / DURATION) * 100);
      setProgress(pct);
      if (pct <= 0) {
        hide();
        clearInterval(timer);
      }
    }, 50);

    return () => clearInterval(timer);
  }, [visible, hide]);

  if (!visible || !notif) return null;

  const cfg = getConfig(notif.data?.type);

  return (
    <div className="fixed top-4 right-4 z-[100]">
      <div className="bg-obsidian text-white rounded-[20px] p-4 shadow-2xl flex items-start gap-3 max-w-sm animate-in slide-in-from-top">
        <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.accent}`}>
          {cfg.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm">{notif.title}</div>
          <div className="text-white/70 text-xs mt-0.5">{notif.body}</div>
          {/* Barra de progreso */}
          <div className="mt-2 h-0.5 w-full bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-white/40 rounded-full transition-none"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <button
          onClick={hide}
          className="text-white/40 hover:text-white transition shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
