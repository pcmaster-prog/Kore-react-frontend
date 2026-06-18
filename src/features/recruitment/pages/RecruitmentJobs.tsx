import { useEffect, useState } from "react";
import { recruitmentApi } from "../api/recruitmentApi";
import type { JobOpening } from "../types/recruitment";
import { Plus } from "lucide-react";

export default function RecruitmentJobs() {
  const [jobs, setJobs] = useState<JobOpening[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    try {
      const data = await recruitmentApi.getJobs();
      setJobs(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-k-text-h tracking-tight">Gestión de Vacantes</h1>
          <p className="text-k-text-b text-sm mt-1">Publica y administra las vacantes disponibles para el portal.</p>
        </div>
        <button className="flex items-center space-x-2 bg-k-accent text-white px-4 py-2 rounded-xl font-bold hover:bg-opacity-90 transition-all">
          <Plus className="w-5 h-5" />
          <span>Nueva Vacante</span>
        </button>
      </div>

      {loading ? (
        <p className="text-k-text-b">Cargando vacantes...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {jobs.map(job => (
            <div key={job.id} className="bg-k-bg-card border border-k-border rounded-3xl p-6 shadow-k-card">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-black text-k-text-h">{job.title}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${job.status === 'open' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-gray-500/10 text-gray-600'}`}>
                  {job.status}
                </span>
              </div>
              <p className="text-k-text-b text-sm mt-2 line-clamp-2">{job.description}</p>
              
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-xs bg-k-bg-secondary text-k-text-b px-2 py-1 rounded-lg">
                  {job.schedule}
                </span>
                <span className="text-xs bg-k-bg-secondary text-k-text-b px-2 py-1 rounded-lg">
                  {job.salary_range}
                </span>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3 border-t border-k-border pt-4">
                <button className="text-sm font-bold text-k-text-b hover:text-k-accent transition-colors">
                  Editar
                </button>
                <button className="text-sm font-bold text-k-text-b hover:text-red-500 transition-colors">
                  Cerrar
                </button>
              </div>
            </div>
          ))}
          {jobs.length === 0 && (
            <div className="col-span-full py-12 text-center bg-k-bg-card border border-k-border rounded-3xl border-dashed">
              <p className="text-k-text-b">No hay vacantes registradas.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
