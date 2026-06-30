import { Briefcase, Users, CheckCircle, Clock, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { recruitmentApi } from "../api/recruitmentApi";
import WhatsAppTestWidget from "../components/WhatsAppTestWidget";

export default function RecruitmentDashboard() {
  const [stats, setStats] = useState({
    activeJobs: 0,
    candidatesInProgress: 0,
    interviewsPending: 0,
    hiredThisMonth: 0
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const jobs = await recruitmentApi.getJobs();
        const apps = await recruitmentApi.getApplications();
        
        setStats({
          activeJobs: jobs.filter((j: any) => j.status === 'open').length,
          candidatesInProgress: apps.filter((a: any) => ['new','screening','interviewing'].includes(a.status)).length,
          interviewsPending: apps.filter((a: any) => a.status === 'interviewing').length,
          hiredThisMonth: apps.filter((a: any) => a.status === 'hired').length
        });
      } catch (error) {
        console.error("Error fetching stats", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const cards = [
    { title: "Vacantes Activas", value: stats.activeJobs, icon: Briefcase, gradient: "from-blue-500/20 to-blue-600/5", iconColor: "text-blue-500 bg-blue-500/10" },
    { title: "En Proceso", value: stats.candidatesInProgress, icon: Users, gradient: "from-amber-500/20 to-amber-600/5", iconColor: "text-amber-500 bg-amber-500/10" },
    { title: "Entrevistas", value: stats.interviewsPending, icon: Clock, gradient: "from-purple-500/20 to-purple-600/5", iconColor: "text-purple-500 bg-purple-500/10" },
    { title: "Contratados", value: stats.hiredThisMonth, icon: CheckCircle, gradient: "from-emerald-500/20 to-emerald-600/5", iconColor: "text-emerald-500 bg-emerald-500/10" }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Banner Premium */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-k-bg-card to-k-bg-card2 border border-k-border p-8 shadow-2xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-k-accent-btn opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-purple-500 opacity-10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-k-accent-btn/10 text-k-accent-btn text-xs font-bold uppercase tracking-wider mb-4 border border-k-accent-btn/20">
            <Sparkles className="w-3 h-3" /> ATS Inteligente
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-k-text-h to-k-text-b tracking-tight">
            Dashboard de Reclutamiento
          </h1>
          <p className="text-k-text-b text-lg mt-3 max-w-2xl leading-relaxed">
            Monitorea el flujo de contratación en tiempo real. Descubre talento, agenda entrevistas y cierra posiciones más rápido con la potencia de Kore HR.
          </p>
        </div>
      </div>

      {/* Tarjetas Estadísticas con Animación Escalonada */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div 
              key={i} 
              className={`relative overflow-hidden bg-k-bg-card border border-k-border rounded-3xl p-6 shadow-k-card group hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 ease-out`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
              
              <div className="relative z-10 flex justify-between items-start">
                <div className={`p-4 rounded-2xl ${card.iconColor} ring-1 ring-white/10 shadow-inner group-hover:scale-110 transition-transform duration-500 ease-out`}>
                  <Icon className="h-7 w-7" />
                </div>
              </div>
              <div className="relative z-10 mt-6">
                <h3 className="text-xs font-bold text-k-text-b uppercase tracking-widest">{card.title}</h3>
                {isLoading ? (
                  <div className="h-10 w-24 bg-k-border animate-pulse rounded-lg mt-2"></div>
                ) : (
                  <p className="text-5xl font-black text-k-text-h mt-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-k-text-h group-hover:to-k-text-b transition-colors duration-300">
                    {card.value}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Widget de WhatsApp (Integrado en el nuevo grid de acciones rápidas si hubiera más, pero por ahora solo él) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WhatsAppTestWidget />
        {/* Espacio para futuros widgets (ej. Actividad Reciente) */}
        <div className="bg-k-bg-card border border-k-border rounded-3xl p-6 shadow-k-card flex flex-col justify-center items-center text-center">
           <div className="w-16 h-16 rounded-full bg-k-border/50 flex items-center justify-center mb-4 animate-pulse">
             <Clock className="w-8 h-8 text-k-text-b/50" />
           </div>
           <h3 className="text-lg font-bold text-k-text-h">Actividad Reciente</h3>
           <p className="text-sm text-k-text-b mt-2 max-w-xs">El historial de reclutamiento estará disponible próximamente en esta sección.</p>
        </div>
      </div>
    </div>
  );
}
