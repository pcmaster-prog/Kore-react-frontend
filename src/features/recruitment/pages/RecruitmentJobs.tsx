import { useEffect, useState } from "react";
import { recruitmentApi } from "../api/recruitmentApi";
import type { JobOpening } from "../types/recruitment";
import { Plus, X } from "lucide-react";

export default function RecruitmentJobs() {
  const [jobs, setJobs] = useState<JobOpening[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingJob, setEditingJob] = useState<JobOpening | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    salary_range: '',
    schedule: '',
    status: 'open' as 'open' | 'draft' | 'closed',
    image_url: ''
  });

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

  const openModal = (job?: JobOpening) => {
    if (job) {
      setEditingJob(job);
      setFormData({
        title: job.title,
        description: job.description || '',
        requirements: job.requirements ? job.requirements.join('\n') : '',
        salary_range: job.salary_range || '',
        schedule: job.schedule || '',
        status: job.status,
        image_url: job.image_url || ''
      });
    } else {
      setEditingJob(null);
      setFormData({
        title: '',
        description: '',
        requirements: '',
        salary_range: '',
        schedule: '',
        status: 'open',
        image_url: ''
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingJob(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        requirements: formData.requirements.split('\n').map(r => r.trim()).filter(r => r)
      };

      if (editingJob) {
        await recruitmentApi.updateJob(editingJob.id, payload);
      } else {
        await recruitmentApi.createJob(payload);
      }
      
      await fetchJobs();
      closeModal();
    } catch (error) {
      console.error("Error saving job", error);
      alert("Hubo un error al guardar la vacante.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar o cerrar esta vacante?")) {
      try {
        await recruitmentApi.deleteJob(id);
        await fetchJobs();
      } catch (error) {
        console.error("Error deleting job", error);
        alert("Hubo un error al eliminar la vacante.");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-k-text-h tracking-tight">Gestión de Vacantes</h1>
          <p className="text-k-text-b text-sm mt-1">Publica y administra las vacantes disponibles para el portal.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center space-x-2 bg-k-accent-btn text-white px-4 py-2 rounded-xl font-bold hover:bg-opacity-90 transition-all"
        >
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
                <span className="text-xs bg-k-bg-card2 text-k-text-b px-2 py-1 rounded-lg">
                  {job.schedule}
                </span>
                <span className="text-xs bg-k-bg-card2 text-k-text-b px-2 py-1 rounded-lg">
                  {job.salary_range}
                </span>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3 border-t border-k-border pt-4">
                <button 
                  onClick={() => openModal(job)}
                  className="text-sm font-bold text-k-text-b hover:text-k-accent-btn transition-colors"
                >
                  Editar
                </button>
                <button 
                  onClick={() => handleDelete(job.id)}
                  className="text-sm font-bold text-k-text-b hover:text-red-500 transition-colors"
                >
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

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-k-text-h">
                {editingJob ? 'Editar Vacante' : 'Crear Nueva Vacante'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-k-text-h mb-1">Título de la Vacante</label>
                <input 
                  type="text" 
                  required
                  className="w-full bg-k-bg-primary border border-k-border rounded-xl px-4 py-2 focus:outline-none focus:border-k-accent"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Ej. Ayudante General"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-k-text-h mb-1">Descripción</label>
                <textarea 
                  className="w-full bg-k-bg-primary border border-k-border rounded-xl px-4 py-2 focus:outline-none focus:border-k-accent h-24"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Breve descripción del puesto"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-k-text-h mb-1">Requisitos (Uno por línea)</label>
                <textarea 
                  className="w-full bg-k-bg-primary border border-k-border rounded-xl px-4 py-2 focus:outline-none focus:border-k-accent h-24"
                  value={formData.requirements}
                  onChange={(e) => setFormData({...formData, requirements: e.target.value})}
                  placeholder="Disponibilidad de horario&#10;Gusto por repostería"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-k-text-h mb-1">Rango Salarial</label>
                  <input 
                    type="text" 
                    className="w-full bg-k-bg-primary border border-k-border rounded-xl px-4 py-2 focus:outline-none focus:border-k-accent"
                    value={formData.salary_range}
                    onChange={(e) => setFormData({...formData, salary_range: e.target.value})}
                    placeholder="Ej. $1,500 - $1,800 semanales"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-k-text-h mb-1">Horario</label>
                  <input 
                    type="text" 
                    className="w-full bg-k-bg-primary border border-k-border rounded-xl px-4 py-2 focus:outline-none focus:border-k-accent"
                    value={formData.schedule}
                    onChange={(e) => setFormData({...formData, schedule: e.target.value})}
                    placeholder="Ej. Lunes a Sábado 8am - 4pm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-k-text-h mb-1">URL de la Imagen</label>
                <input 
                  type="text" 
                  className="w-full bg-k-bg-primary border border-k-border rounded-xl px-4 py-2 focus:outline-none focus:border-k-accent"
                  value={formData.image_url}
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                  placeholder="https://ejemplo.com/imagen.jpg (Opcional)"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-k-text-h mb-1">Estado</label>
                <select 
                  className="w-full bg-k-bg-primary border border-k-border rounded-xl px-4 py-2 focus:outline-none focus:border-k-accent"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as 'open' | 'draft' | 'closed'})}
                >
                  <option value="open">Abierta (Visible)</option>
                  <option value="draft">Borrador (Oculta)</option>
                  <option value="closed">Cerrada</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl font-bold text-k-text-b hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-6 py-2 rounded-xl font-bold text-white bg-k-accent-btn hover:bg-opacity-90 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar Vacante'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
