import { Briefcase, Users, CheckCircle, Clock } from "lucide-react";
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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const jobs = await recruitmentApi.getJobs();
        const apps = await recruitmentApi.getApplications();
        
        setStats({
          activeJobs: jobs.filter((j: any) => j.status === 'open').length,
          candidatesInProgress: apps.filter((a: any) => ['new','screening','interviewing'].includes(a.status)).length,
          interviewsPending: apps.filter((a: any) => a.status === 'interviewing').length,
          hiredThisMonth: apps.filter((a: any) => a.status === 'hired').length // Simplificado
        });
      } catch (error) {
        console.error("Error fetching stats", error);
      }
    };
    fetchStats();
  }, []);

  const cards = [
    { title: "Vacantes Activas", value: stats.activeJobs, icon: Briefcase, color: "text-blue-500 bg-blue-500/10" },
    { title: "Candidatos en Proceso", value: stats.candidatesInProgress, icon: Users, color: "text-amber-500 bg-amber-500/10" },
    { title: "Entrevistas Programadas", value: stats.interviewsPending, icon: Clock, color: "text-purple-500 bg-purple-500/10" },
    { title: "Contratados", value: stats.hiredThisMonth, icon: CheckCircle, color: "text-emerald-500 bg-emerald-500/10" }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-k-text-h tracking-tight">Dashboard Reclutamiento</h1>
        <p className="text-k-text-b text-sm mt-1">Resumen del ATS y proceso de contratación.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="bg-k-bg-card border border-k-border rounded-3xl p-6 shadow-k-card transition-all duration-300 hover:-translate-y-1">
              <div className="flex justify-between items-start">
                <div className={`p-3 rounded-2xl ${card.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-6">
                <h3 className="text-sm font-bold text-k-text-b uppercase tracking-wider">{card.title}</h3>
                <p className="text-4xl font-black text-k-text-h mt-2">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Widget de Prueba de WhatsApp */}
      <WhatsAppTestWidget />
    </div>
  );
}
