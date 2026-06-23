import { useEffect, useMemo, useState } from "react";
import { recruitmentApi } from "../api/recruitmentApi";
import type { PipelineAnalytics, JobOpening } from "../types/recruitment";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Briefcase,
  Users,
  Calendar,
  UserCheck,
  Clock,
  Filter,
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  new: "#3b82f6",
  screening: "#8b5cf6",
  "interview-requested": "#f59e0b",
  interviewing: "#d97706",
  "offer-sent": "#6366f1",
  hired: "#10b981",
  rejected: "#f43f5e",
};

const STATUS_LABELS: Record<string, string> = {
  new: "Nuevo",
  screening: "En evaluación",
  "interview-requested": "Entrevista solicitada",
  interviewing: "En entrevista",
  "offer-sent": "Oferta enviada",
  hired: "Contratado",
  rejected: "Rechazado",
};

const REJECTION_COLORS = ["#f43f5e", "#fb7185", "#fda4af", "#fecdd3", "#ffe4e6"];

export default function RecruitmentReports() {
  const [analytics, setAnalytics] = useState<PipelineAnalytics | null>(null);
  const [jobs, setJobs] = useState<JobOpening[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [jobOpeningId, setJobOpeningId] = useState("");

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const params: { date_from?: string; date_to?: string; job_opening_id?: string } = {};
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (jobOpeningId) params.job_opening_id = jobOpeningId;

      const data = await recruitmentApi.getPipelineAnalytics(params);
      setAnalytics(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadJobs = async () => {
    try {
      const data = await recruitmentApi.getJobs();
      setJobs(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadAnalytics();
    loadJobs();
  }, []);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    loadAnalytics();
  };

  const totals = analytics?.totals;
  const totalApplications = useMemo(
    () => Object.values(totals ?? {}).reduce((a, b) => a + b, 0),
    [totals]
  );
  const totalHired = totals?.hired ?? 0;
  const upcomingCount = analytics?.upcoming_interviews.length ?? 0;
  const openJobsCount = analytics?.open_jobs.length ?? 0;

  const statusChartData = useMemo(() => {
    if (!totals) return [];
    return Object.entries(totals).map(([status, count]) => ({
      name: STATUS_LABELS[status] || status,
      count,
      color: STATUS_COLORS[status] || "#94a3b8",
    }));
  }, [totals]);

  const funnelData = useMemo(
    () => analytics?.funnel.map((f) => ({ name: f.stage, count: f.count })) ?? [],
    [analytics]
  );

  const rejectionData = useMemo(
    () =>
      analytics?.rejection_reasons.map((r) => ({
        name: r.notes.length > 40 ? r.notes.slice(0, 40) + "…" : r.notes,
        value: r.count,
      })) ?? [],
    [analytics]
  );

  if (loading) return <p className="text-k-text-b">Cargando reportes…</p>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-black text-k-text-h tracking-tight">Reportes de reclutamiento</h1>
        <p className="text-k-text-b text-sm mt-1">
          Métricas del pipeline, tiempos por etapa y entrevistas próximas.
        </p>
      </div>

      {/* Filters */}
      <form
        onSubmit={handleFilter}
        className="bg-k-bg-card border border-k-border rounded-3xl p-5 flex flex-wrap items-end gap-4"
      >
        <div>
          <label className="block text-xs font-bold text-k-text-b mb-1">Desde</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="bg-k-bg-secondary border border-k-border rounded-xl px-3 py-2 text-sm text-k-text-h"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-k-text-b mb-1">Hasta</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="bg-k-bg-secondary border border-k-border rounded-xl px-3 py-2 text-sm text-k-text-h"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-k-text-b mb-1">Vacante</label>
          <select
            value={jobOpeningId}
            onChange={(e) => setJobOpeningId(e.target.value)}
            className="bg-k-bg-secondary border border-k-border rounded-xl px-3 py-2 text-sm text-k-text-h min-w-[180px]"
          >
            <option value="">Todas</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-k-accent text-white text-sm font-bold hover:bg-k-accent/90 transition-colors flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          Filtrar
        </button>
      </form>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={Users} label="Total aplicaciones" value={totalApplications} color="blue" />
        <Kpi icon={UserCheck} label="Contrataciones" value={totalHired} color="green" />
        <Kpi icon={Calendar} label="Entrevistas 7 días" value={upcomingCount} color="amber" />
        <Kpi icon={Briefcase} label="Vacantes abiertas" value={openJobsCount} color="purple" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-k-bg-card border border-k-border rounded-3xl p-5 shadow-sm">
          <h3 className="font-black text-k-text-h text-base mb-4">Funnel de conversión</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#312E74" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-k-bg-card border border-k-border rounded-3xl p-5 shadow-sm">
          <h3 className="font-black text-k-text-h text-base mb-4">Distribución por estatus</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={70} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Average times */}
        <div className="bg-k-bg-card border border-k-border rounded-3xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-k-accent" />
            <h3 className="font-black text-k-text-h text-base">Tiempo promedio por etapa</h3>
          </div>
          {analytics?.average_times && Object.keys(analytics.average_times).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(analytics.average_times).map(([key, hours]) => {
                const labels: Record<string, string> = {
                  new_to_screening: "Nuevo → Evaluación",
                  screening_to_interview_requested: "Evaluación → Entrevista solicitada",
                  interview_requested_to_interviewing: "Solicitada → En entrevista",
                  interviewing_to_offer_sent: "Entrevista → Oferta",
                  offer_sent_to_hired: "Oferta → Contratado",
                };
                return (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <span className="text-k-text-b">{labels[key] || key}</span>
                    <span className="font-bold text-k-text-h">
                      {hours === null ? "—" : `${hours}h`}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-k-text-b text-sm">Sin datos suficientes.</p>
          )}
        </div>

        {/* Rejection reasons */}
        <div className="bg-k-bg-card border border-k-border rounded-3xl p-5 shadow-sm">
          <h3 className="font-black text-k-text-h text-base mb-4">Motivos de rechazo</h3>
          {rejectionData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={rejectionData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {rejectionData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={REJECTION_COLORS[index % REJECTION_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-k-text-b text-sm">Sin rechazos registrados.</p>
          )}
        </div>

        {/* Upcoming interviews */}
        <div className="bg-k-bg-card border border-k-border rounded-3xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-k-accent" />
            <h3 className="font-black text-k-text-h text-base">Entrevistas próximas</h3>
          </div>
          {analytics?.upcoming_interviews.length ? (
            <div className="space-y-3 max-h-80 overflow-auto custom-scrollbar">
              {analytics.upcoming_interviews.map((interview) => (
                <div
                  key={interview.id}
                  className="border border-k-border rounded-xl p-3 bg-k-bg-secondary/40"
                >
                  <p className="font-bold text-k-text-h text-sm">{interview.candidate_name || "Candidato"}</p>
                  <p className="text-xs text-k-text-b">{interview.job_title || "Vacante"}</p>
                  <p className="text-xs text-k-accent font-bold mt-1">
                    {new Date(interview.scheduled_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-k-text-b text-sm">No hay entrevistas programadas para los próximos 7 días.</p>
          )}
        </div>
      </div>

      {/* Open jobs table */}
      <div className="bg-k-bg-card border border-k-border rounded-3xl p-5 shadow-sm overflow-auto">
        <h3 className="font-black text-k-text-h text-base mb-4">Vacantes abiertas</h3>
        {analytics?.open_jobs.length ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-k-text-b border-b border-k-border">
                <th className="pb-2 font-bold">Vacante</th>
                <th className="pb-2 font-bold text-right">Aplicaciones</th>
                <th className="pb-2 font-bold text-right">En entrevista</th>
                <th className="pb-2 font-bold text-right">Ofertas</th>
                <th className="pb-2 font-bold text-right">Contratados</th>
              </tr>
            </thead>
            <tbody>
              {analytics.open_jobs.map((job) => (
                <tr key={job.id} className="border-b border-k-border/50 last:border-0">
                  <td className="py-3 text-k-text-h font-medium">{job.title}</td>
                  <td className="py-3 text-right text-k-text-b">{job.total_applications}</td>
                  <td className="py-3 text-right text-k-text-b">{job.interviewing_count}</td>
                  <td className="py-3 text-right text-k-text-b">{job.offer_sent_count}</td>
                  <td className="py-3 text-right text-k-text-b">{job.hired_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-k-text-b text-sm">No hay vacantes abiertas.</p>
        )}
      </div>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: "blue" | "green" | "amber" | "purple";
}) {
  const colorClasses = {
    blue: "bg-blue-500/10 text-blue-600",
    green: "bg-emerald-500/10 text-emerald-600",
    amber: "bg-amber-500/10 text-amber-600",
    purple: "bg-purple-500/10 text-purple-600",
  };

  return (
    <div className="bg-k-bg-card border border-k-border rounded-3xl p-5 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-black text-k-text-h">{value}</p>
        <p className="text-xs text-k-text-b font-bold">{label}</p>
      </div>
    </div>
  );
}
