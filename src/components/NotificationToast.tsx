import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';

type NotifPayload = {
  title: string;
  body: string;
  data?: any;
};

export default function NotificationToast() {
  const [notif, setNotif] = useState<NotifPayload | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handler(e: Event) {
      const { title, body, data } = (e as CustomEvent).detail;
      setNotif({ title, body, data });
      setVisible(true);
      setTimeout(() => setVisible(false), 5000);
    }

    window.addEventListener('kore-notification', handler);
    return () => window.removeEventListener('kore-notification', handler);
  }, []);

  if (!visible || !notif) return null;

  return (
    <div className="fixed top-4 right-4 z-[100]">
      <div className="bg-obsidian text-white rounded-[20px] p-4 shadow-2xl flex items-start gap-3 max-w-sm animate-in slide-in-from-top">
        <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
          <Bell className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm">{notif.title}</div>
          <div className="text-white/70 text-xs mt-0.5">{notif.body}</div>
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
