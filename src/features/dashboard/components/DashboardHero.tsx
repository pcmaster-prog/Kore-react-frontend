import { Zap } from "lucide-react";

export interface DashboardHeroProps {
  userName: string;
  pendingReview: number;
  activeTasks: number;
}

export default function DashboardHero({
  userName,
  pendingReview,
  activeTasks,
}: DashboardHeroProps) {
  return (
    <div className="relative overflow-hidden bg-k-bg-sidebar rounded-[40px] p-8 lg:p-10 text-white shadow-2xl shadow-obsidian/20">
      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-k-bg-card/10 text-[10px] font-bold tracking-[0.2em] uppercase mb-4">
          <Zap className="h-3 w-3" />
          Panel de Supervisión
        </div>
        <h1 className="text-3xl lg:text-4xl font-black tracking-tight mb-2">
          Hola, <span className="italic">{userName}</span>.
        </h1>
        <p className="text-white/60 text-base">
          <span className="text-white font-bold">{pendingReview}</span> en revisión ·{" "}
          <span className="text-white font-bold">{activeTasks}</span> activas ahora
        </p>
      </div>
      <div className="absolute -top-16 -right-16 w-72 h-72 bg-k-bg-card/5 rounded-full blur-[80px]" />
    </div>
  );
}
