import { useEffect, useState } from "react";
import { recruitmentApi } from "../api/recruitmentApi";
import type { Application } from "../types/recruitment";
import { Link } from "react-router-dom";
import { ChevronRight, Calendar, Check, X, Loader2, Flag, ListFilter } from "lucide-react";

const statusLabels: Record<string, string> = {
  new: "Nuevos",
  screening: "Evaluación",
  "interview-requested": "Entrevista solicitada",
  interviewing: "Entrevistas",
  hired: "Contratados",
  rejected: "Rechazados",
};

const stages = [
  { id: "new", label: statusLabels["new"] },
  { id: "screening", label: statusLabels["screening"] },
  { id: "interview-requested", label: statusLabels["interview-requested"] },
  { id: "interviewing", label: statusLabels["interviewing"] },
  { id: "hired", label: statusLabels["hired"] },
  { id: "rejected", label: statusLabels["rejected"] },
];

export default function RecruitmentCandidates() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [view, setView] = useState<'pipeline' | 'review'>('pipeline');

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

  const runAction = async (id: string, action: () => Promise<unknown>) => {
    setBusyId(id);
    try {
      await action();
      await fetchApps();
    } catch (error) {
      console.error(error);
      alert("Error al ejecutar la acción. Revisa la consola.");
    } finally {
      setBusyId(null);
    }
  };

  const handleAdvance = (app: Application) => {
    const nextStatus: Record<string, string> = {
      new: "screening",
      screening: "interview-requested",
      "interview-requested": "interviewing",
    };
    const target = nextStatus[app.status];
    if (!target) return;
    runAction(app.id, () => recruitmentApi.changeStatus(app.id, target));
  };

  const handleReject = (app: Application) => {
    const reason = prompt("Motivo de rechazo:");
    if (!reason) return;
    runAction(app.id, () => recruitmentApi.reject(app.id, reason, true));
  };

  const handleManualReview = (app: Application, required: boolean) => {
    const reason = required ? prompt("Motivo de revisión manual:") : undefined;
    if (required && !reason) return;
    runAction(app.id, () => recruitmentApi.toggleManualReview(app.id, required, reason || undefined));
  };

  const reviewCount = applications.filter((a) => a.manual_review_required).length;

  const CandidateCard = ({ app }: { app: Application }) => (
    <div className={`bg-k-bg-card border ${app.blacklist_alert || app.is_rehire ? 'border-red-500 shadow-red-500/20' : 'border-k-border'} rounded-2xl p-4 shadow-sm hover:shadow-md transition-all hover:border-k-accent/30 group`}>
      <Link
        to={`/app/manager/reclutamiento/candidatos/${app.id}`}
        className="block"
      >
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-k-accent to-purple-500 flex items-center justify-center text-white font-black shadow-sm">
            {app.user?.name?.charAt(0) || "?"}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-k-text-h text-sm leading-tight group-hover:text-k-accent-btn transition-colors truncate">
              {app.user?.name}
            </p>
            <p className="text-xs text-k-text-b truncate max-w-[150px]">
              {app.jobOpening?.title}
        <div className="flex items-center space-x-4 mb-4">
          <div className="relative w-12 h-12 rounded-full bg-gradient-to-tr from-k-accent-btn to-purple-500 flex items-center justify-center text-white font-black shadow-lg shadow-k-accent-btn/30 group-hover:scale-110 transition-transform duration-500">
            {app.user?.name?.charAt(0) || "?"}
            {app.status === 'new' && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-k-bg-card rounded-full animate-pulse"></span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-k-text-h text-base leading-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-k-text-h group-hover:to-k-text-b transition-colors truncate">
              {app.user?.name}
            </p>
            <p className="text-xs text-k-text-b truncate font-medium mt-0.5 flex items-center gap-1">
              <Briefcase className="w-3 h-3 opacity-70" />
              {app.jobOpening?.title}
            </p>
          </div>
        </div>

        {(app.blacklist_alert || app.is_rehire) && (
          <div className="mb-4 flex items-center gap-1.5 text-xs font-bold text-red-500 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-xl w-fit backdrop-blur-sm">
            <Flag className="w-3.5 h-3.5 animate-pulse" />
            Alerta: Ex-empleado
          </div>
        )}

        {app.manual_review_required && (
          <div className="mb-4 flex items-center gap-1.5 text-xs font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl w-fit backdrop-blur-sm">
            <Flag className="w-3.5 h-3.5" />
            Revisión manual: {app.manual_review_reason || "Requerida"}
          </div>
        )}

        <div className="flex justify-between items-center pt-4 mt-auto border-t border-k-border/50">
          <span className="text-[10px] uppercase font-bold text-k-text-b tracking-widest group-hover:text-k-text-h transition-colors">
            Ver Perfil Completo
          </span>
          <div className="w-6 h-6 rounded-full bg-k-border/50 flex items-center justify-center group-hover:bg-k-accent-btn group-hover:text-white transition-colors duration-300">
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </Link>

      {/* Quick actions */}
      <div className="mt-4 pt-4 border-t border-k-border/50 flex gap-2 flex-wrap">
        {busyId === app.id ? (
          <span className="text-k-accent-btn text-xs font-bold flex items-center gap-2 bg-k-accent-btn/10 px-3 py-1.5 rounded-xl w-full justify-center">
            <Loader2 className="w-4 h-4 animate-spin" />
            Procesando...
          </span>
        ) : (
          <>
            {(app.status === "new" ||
              app.status === "screening" ||
              app.status === "interview-requested") && (
              <button
                type="button"
                onClick={() => handleAdvance(app)}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 px-3 py-2 rounded-xl transition-all duration-300"
              >
                <Check className="w-4 h-4" />
                Avanzar
              </button>
            )}
            {app.status === "screening" && (
              <Link
                to={`/app/manager/reclutamiento/candidatos/${app.id}`}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-amber-500 bg-amber-500/10 hover:bg-amber-500 hover:text-white border border-amber-500/20 px-3 py-2 rounded-xl transition-all duration-300"
              >
                <Calendar className="w-4 h-4" />
                Agendar
              </Link>
            )}
            {!app.manual_review_required && app.status !== "hired" && app.status !== "rejected" && (
              <button
                type="button"
                onClick={() => handleManualReview(app, true)}
                className="flex items-center justify-center w-9 h-9 text-amber-500 bg-amber-500/10 hover:bg-amber-500 hover:text-white border border-amber-500/20 rounded-xl transition-all duration-300 tooltip"
                title="Marcar para revisión"
              >
                <Flag className="w-4 h-4" />
              </button>
            )}
            {app.manual_review_required && (
              <button
                type="button"
                onClick={() => handleManualReview(app, false)}
                className="flex items-center justify-center w-9 h-9 text-slate-500 bg-slate-500/10 hover:bg-slate-500 hover:text-white border border-slate-500/20 rounded-xl transition-all duration-300 tooltip"
                title="Marcar como revisado"
              >
                <Check className="w-4 h-4" />
              </button>
            )}
            {app.status !== "hired" && app.status !== "rejected" && (
              <button
                type="button"
                onClick={() => handleReject(app)}
                className="flex items-center justify-center w-9 h-9 text-rose-500 bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/20 rounded-xl transition-all duration-300 tooltip ml-auto"
                title="Rechazar"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 h-full flex flex-col">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-k-bg-card to-k-bg-card2 border border-k-border p-6 shadow-xl flex flex-col md:flex-row md:justify-between md:items-center gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-k-accent-btn opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-k-text-h to-k-text-b tracking-tight">
            Pipeline de Candidatos
          </h1>
          <p className="text-k-text-b text-sm mt-2 max-w-xl">
            Gestiona el talento de forma visual. Arrastra, revisa y contrata a los mejores perfiles para tu equipo.
          </p>
        </div>

        <div className="relative z-10 flex bg-k-bg-page/50 backdrop-blur-md rounded-2xl p-1.5 border border-k-border shadow-inner">
          <button
            type="button"
            onClick={() => setView('pipeline')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
              view === 'pipeline'
                ? 'bg-k-accent-btn text-white shadow-lg shadow-k-accent-btn/30 scale-105'
                : 'text-k-text-b hover:text-k-text-h hover:bg-k-bg-card'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            Tablero Kanban
          </button>
          <button
            type="button"
            onClick={() => setView('review')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
              view === 'review'
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 scale-105'
                : 'text-k-text-b hover:text-k-text-h hover:bg-k-bg-card'
            }`}
          >
            <Flag className="w-4 h-4" />
            Revisión Manual
            {reviewCount > 0 && (
              <span className="ml-1.5 bg-white text-amber-600 text-[10px] px-2 py-0.5 rounded-full font-black shadow-sm">
                {reviewCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4 min-h-[400px]">
          <Loader2 className="w-10 h-10 animate-spin text-k-accent-btn" />
          <p className="text-k-text-b font-medium animate-pulse">Cargando pipeline de talento...</p>
        </div>
      ) : view === 'pipeline' ? (
        <div className="flex space-x-6 overflow-x-auto pb-6 pt-2 px-2 scrollbar-thin scrollbar-thumb-k-border scrollbar-track-transparent flex-1">
          {stages.map((stage) => {
            const appsInStage = applications.filter((a) => a.status === stage.id);
            return (
              <div
                key={stage.id}
                className="min-w-[340px] w-[340px] flex-shrink-0 bg-k-bg-card/50 backdrop-blur-xl border border-k-border/50 rounded-3xl p-5 flex flex-col h-[calc(100vh-280px)] shadow-lg shadow-black/5"
              >
                <div className="flex justify-between items-center mb-6 px-1">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      stage.id === 'new' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]' :
                      stage.id === 'screening' ? 'bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]' :
                      stage.id === 'interviewing' ? 'bg-purple-400 shadow-[0_0_10px_rgba(192,132,252,0.5)]' :
                      stage.id === 'hired' ? 'bg-emerald-600 shadow-[0_0_10px_rgba(5,150,105,0.5)]' :
                      'bg-k-border'
                    }`}></div>
                    <h3 className="font-black text-k-text-h uppercase text-xs tracking-widest">
                      {stage.label}
                    </h3>
                  </div>
                  <span className="bg-k-bg-page border border-k-border text-k-text-h text-xs font-black px-3 py-1 rounded-full shadow-inner">
                    {appsInStage.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-3 -mr-3 scrollbar-thin scrollbar-thumb-k-border scrollbar-track-transparent">
                  {appsInStage.map((app) => (
                    <CandidateCard key={app.id} app={app} />
                  ))}
                  {appsInStage.length === 0 && (
                    <div className="h-32 border-2 border-dashed border-k-border/50 rounded-3xl flex flex-col items-center justify-center text-k-text-b space-y-2">
                      <div className="w-10 h-10 rounded-full bg-k-border/30 flex items-center justify-center">
                        <Users className="w-5 h-5 opacity-50" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider opacity-50">Columna vacía</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {applications
            .filter((a) => a.manual_review_required)
            .map((app) => (
              <CandidateCard key={app.id} app={app} />
            ))}
          {reviewCount === 0 && (
            <div className="col-span-full py-20 text-center bg-k-bg-card/50 backdrop-blur-md border border-k-border/50 rounded-3xl border-dashed shadow-inner flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-emerald-500" />
              </div>
              <h3 className="text-xl font-black text-k-text-h mb-2">¡Todo al día!</h3>
              <p className="text-k-text-b">No hay candidatos pendientes de revisión manual.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
