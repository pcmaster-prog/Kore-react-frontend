import { useEffect, useState } from "react";
import { recruitmentApi } from "../api/recruitmentApi";
import type { Application } from "../types/recruitment";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export default function RecruitmentCandidates() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApps = async () => {
    try {
      const data = await recruitmentApi.getApplications();
      setApplications(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const stages = [
    { id: 'new', label: 'Nuevos' },
    { id: 'screening', label: 'Evaluación' },
    { id: 'interviewing', label: 'Entrevistas' },
    { id: 'hired', label: 'Contratados' },
    { id: 'rejected', label: 'Rechazados' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-k-text-h tracking-tight">Candidatos (Pipeline)</h1>
        <p className="text-k-text-b text-sm mt-1">Visualiza y gestiona las postulaciones a las vacantes.</p>
      </div>

      {loading ? (
        <p className="text-k-text-b">Cargando candidatos...</p>
      ) : (
        <div className="flex space-x-6 overflow-x-auto pb-6 scrollbar-hide">
          {stages.map(stage => {
            const appsInStage = applications.filter(a => a.status === stage.id);
            return (
              <div key={stage.id} className="min-w-[300px] w-[300px] flex-shrink-0 bg-k-bg-secondary rounded-3xl p-4 flex flex-col h-[calc(100vh-250px)]">
                <div className="flex justify-between items-center mb-4 px-2">
                  <h3 className="font-black text-k-text-h uppercase text-sm tracking-wider">{stage.label}</h3>
                  <span className="bg-k-bg-card text-k-text-b text-xs font-bold px-2 py-1 rounded-xl shadow-sm">
                    {appsInStage.length}
                  </span>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-k-border">
                  {appsInStage.map(app => (
                    <Link 
                      key={app.id} 
                      to={`/manager/reclutamiento/candidatos/${app.id}`}
                      className="block bg-k-bg-card border border-k-border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all hover:border-k-accent/30 group"
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-k-accent to-purple-500 flex items-center justify-center text-white font-black shadow-sm">
                          {app.user?.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-bold text-k-text-h text-sm leading-tight group-hover:text-k-accent transition-colors">
                            {app.user?.name}
                          </p>
                          <p className="text-xs text-k-text-b truncate max-w-[150px]">
                            {app.jobOpening?.title}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center pt-3 border-t border-k-border/50">
                        <span className="text-[10px] uppercase font-bold text-k-text-b tracking-wider">
                          Ver Detalle
                        </span>
                        <ChevronRight className="w-4 h-4 text-k-text-b group-hover:text-k-accent transition-transform group-hover:translate-x-1" />
                      </div>
                    </Link>
                  ))}
                  {appsInStage.length === 0 && (
                    <div className="h-24 border-2 border-dashed border-k-border rounded-2xl flex items-center justify-center text-k-text-b text-xs font-medium">
                      Sin candidatos
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
