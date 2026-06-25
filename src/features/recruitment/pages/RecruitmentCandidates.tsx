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
            </p>
          </div>
        </div>

        {(app.blacklist_alert || app.is_rehire) && (
          <div className="mb-3 flex items-center gap-1 text-xs font-bold text-red-600 bg-red-500/10 px-2 py-1 rounded-lg w-fit">
            <Flag className="w-3 h-3" />
            Alerta: Ex-empleado
          </div>
        )}

        {app.manual_review_required && (
          <div className="mb-3 flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-500/10 px-2 py-1 rounded-lg w-fit">
            <Flag className="w-3 h-3" />
            Revisión manual: {app.manual_review_reason || "Sin motivo"}
          </div>
        )}

        <div className="flex justify-between items-center pt-3 border-t border-k-border/50">
          <span className="text-[10px] uppercase font-bold text-k-text-b tracking-wider">
            Ver Detalle
          </span>
          <ChevronRight className="w-4 h-4 text-k-text-b group-hover:text-k-accent-btn transition-transform group-hover:translate-x-1" />
        </div>
      </Link>

      {/* Quick actions */}
      <div className="mt-3 pt-3 border-t border-k-border/50 flex gap-2 flex-wrap">
        {busyId === app.id ? (
          <span className="text-k-text-b text-xs flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            Procesando…
          </span>
        ) : (
          <>
            {(app.status === "new" ||
              app.status === "screening" ||
              app.status === "interview-requested") && (
              <button
                type="button"
                onClick={() => handleAdvance(app)}
                className="flex items-center gap-1 text-xs font-bold text-emerald-500 hover:text-emerald-600"
              >
                <Check className="w-3 h-3" />
                Avanzar
              </button>
            )}
            {app.status === "screening" && (
              <Link
                to={`/app/manager/reclutamiento/candidatos/${app.id}`}
                className="flex items-center gap-1 text-xs font-bold text-amber-500 hover:text-amber-600"
              >
                <Calendar className="w-3 h-3" />
                Entrevista
              </Link>
            )}
            {!app.manual_review_required && app.status !== "hired" && app.status !== "rejected" && (
              <button
                type="button"
                onClick={() => handleManualReview(app, true)}
                className="flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700"
              >
                <Flag className="w-3 h-3" />
                Revisión
              </button>
            )}
            {app.manual_review_required && (
              <button
                type="button"
                onClick={() => handleManualReview(app, false)}
                className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-600"
              >
                <Check className="w-3 h-3" />
                Revisado
              </button>
            )}
            {app.status !== "hired" && app.status !== "rejected" && (
              <button
                type="button"
                onClick={() => handleReject(app)}
                className="flex items-center gap-1 text-xs font-bold text-rose-500 hover:text-rose-600 ml-auto"
              >
                <X className="w-3 h-3" />
                Rechazar
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div>
          <h1 className="text-2xl font-black text-k-text-h tracking-tight">
            Candidatos (Pipeline)
          </h1>
          <p className="text-k-text-b text-sm mt-1">
            Visualiza y gestiona las postulaciones a las vacantes.
          </p>
        </div>

        <div className="flex bg-k-bg-card2 rounded-xl p-1 border border-k-border self-start">
          <button
            type="button"
            onClick={() => setView('pipeline')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
              view === 'pipeline'
                ? 'bg-k-accent-btn text-white'
                : 'text-k-text-b hover:text-k-text-h'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            Pipeline
          </button>
          <button
            type="button"
            onClick={() => setView('review')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
              view === 'review'
                ? 'bg-k-accent-btn text-white'
                : 'text-k-text-b hover:text-k-text-h'
            }`}
          >
            <Flag className="w-4 h-4" />
            Revisión manual
            {reviewCount > 0 && (
              <span className="ml-1 bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {reviewCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-k-text-b">Cargando candidatos...</p>
      ) : view === 'pipeline' ? (
        <div className="flex space-x-6 overflow-x-auto pb-6 scrollbar-hide">
          {stages.map((stage) => {
            const appsInStage = applications.filter((a) => a.status === stage.id);
            return (
              <div
                key={stage.id}
                className="min-w-[320px] w-[320px] flex-shrink-0 bg-k-bg-card2 rounded-3xl p-4 flex flex-col h-[calc(100vh-250px)]"
              >
                <div className="flex justify-between items-center mb-4 px-2">
                  <h3 className="font-black text-k-text-h uppercase text-sm tracking-wider">
                    {stage.label}
                  </h3>
                  <span className="bg-k-bg-card text-k-text-b text-xs font-bold px-2 py-1 rounded-xl shadow-sm">
                    {appsInStage.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-k-border">
                  {appsInStage.map((app) => (
                    <CandidateCard key={app.id} app={app} />
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {applications
            .filter((a) => a.manual_review_required)
            .map((app) => (
              <CandidateCard key={app.id} app={app} />
            ))}
          {reviewCount === 0 && (
            <div className="col-span-full py-12 text-center bg-k-bg-card border border-k-border rounded-3xl border-dashed">
              <p className="text-k-text-b">No hay candidatos marcados para revisión manual.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
