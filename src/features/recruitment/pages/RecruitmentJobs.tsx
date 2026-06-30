import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { recruitmentApi } from "../api/recruitmentApi";
import type { JobOpening, JobOpeningTemplate } from "../types/recruitment";
import { Plus, X, Share2, Link as LinkIcon, Copy, Check, MessageCircle, Facebook, Linkedin } from "lucide-react";
import JobFormWizard from "../components/JobFormWizard";

export default function RecruitmentJobs() {
  const [jobs, setJobs] = useState<JobOpening[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingJob, setEditingJob] = useState<JobOpening | null>(null);
  
  const [templateJob, setTemplateJob] = useState<JobOpeningTemplate | null>(null);

  // Share modal state
  const [shareJob, setShareJob] = useState<JobOpening | null>(null);
  const [copied, setCopied] = useState(false);
  const [searchParams] = useSearchParams();

  const portalBaseUrl = import.meta.env.VITE_PORTAL_URL || window.location.origin;

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

  useEffect(() => {
    const templateId = searchParams.get('templateId');
    if (templateId) {
      recruitmentApi.getJobTemplate(templateId)
        .then(template => openModalFromTemplate(template))
        .catch(error => {
          console.error(error);
          alert('No se pudo cargar la plantilla.');
        });
    }
  }, [searchParams]);

  const openModalFromTemplate = (template: JobOpeningTemplate) => {
    setEditingJob(null);
    setTemplateJob(template);
    setIsModalOpen(true);
  };

  const openModal = (job?: JobOpening) => {
    setTemplateJob(null);
    if (job) {
      setEditingJob(job);
    } else {
      setEditingJob(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingJob(null);
    setTemplateJob(null);
  };

  const handleWizardSubmit = async (payload: any) => {
    setIsSubmitting(true);
    try {
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

  const publicJobUrl = (job: JobOpening) => {
    const identifier = job.slug || job.id;
    return `${portalBaseUrl}/jobs/${identifier}`;
  };
  const qrCodeUrl = (job: JobOpening) => `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(publicJobUrl(job))}`;

  const copyToClipboard = async (job: JobOpening) => {
    try {
      await navigator.clipboard.writeText(publicJobUrl(job));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('No se pudo copiar el enlace.');
    }
  };

  const shareText = (job: JobOpening) => `¡Vacante de ${job.title} en Decorarte! ${publicJobUrl(job)}`;

  const shareWhatsApp = (job: JobOpening) => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText(job))}`, '_blank');
  };

  const shareFacebook = (job: JobOpening) => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicJobUrl(job))}`, '_blank');
  };

  const shareLinkedIn = (job: JobOpening) => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicJobUrl(job))}`, '_blank');
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
          className="flex items-center space-x-2 bg-gradient-to-r from-k-accent-btn to-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-k-accent-btn/30 hover:shadow-k-accent-btn/50 hover:-translate-y-0.5 transition-all"
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
            <div key={job.id} className="group relative bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-k-accent/20 to-transparent rounded-bl-[100px] z-0 transition-transform duration-500 group-hover:scale-125"></div>
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 pr-4">
                    <h3 className="text-xl font-black text-k-text-h leading-tight group-hover:text-k-accent-btn transition-colors">{job.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-medium text-k-text-b">{job.department || 'Sin departamento'}</span>
                      <span className="w-1 h-1 rounded-full bg-k-border"></span>
                      <span className="text-xs font-medium text-k-text-b">{job.location || 'Remoto/No esp.'}</span>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider border ${
                    job.status === 'open' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                    : job.status === 'draft' ? 'bg-amber-50 text-amber-600 border-amber-200' 
                    : 'bg-gray-50 text-gray-600 border-gray-200'
                  }`}>
                    {job.status === 'open' ? 'Activa' : job.status === 'draft' ? 'Borrador' : 'Cerrada'}
                  </span>
                </div>
                
                <p className="text-k-text-b text-sm mt-3 line-clamp-2 leading-relaxed">{job.description || 'Sin descripción.'}</p>
                
                <div className="mt-5 flex flex-wrap gap-2">
                  {job.job_type && (
                    <span className="text-xs bg-k-bg-primary text-k-text-h font-medium px-3 py-1.5 rounded-lg border border-k-border shadow-sm">
                      {job.job_type === 'full-time' ? 'Tiempo completo' : job.job_type === 'part-time' ? 'Medio tiempo' : job.job_type}
                    </span>
                  )}
                  {job.schedule && (
                    <span className="text-xs bg-k-bg-primary text-k-text-h font-medium px-3 py-1.5 rounded-lg border border-k-border shadow-sm">
                      {job.schedule}
                    </span>
                  )}
                  {job.salary_range && (
                    <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-3 py-1.5 rounded-lg border border-emerald-100 shadow-sm">
                      {job.salary_range}
                    </span>
                  )}
                  {job.is_featured && (
                    <span className="text-xs bg-k-accent-btn text-white font-bold px-3 py-1.5 rounded-lg shadow-sm shadow-k-accent-btn/30">
                      ✨ Destacada
                    </span>
                  )}
                </div>

                <div className="mt-6 flex justify-between items-center border-t border-k-border/50 pt-4">
                  <div className="flex items-center gap-1.5 text-xs text-k-text-b font-medium">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    {job.views_count || 0} vista{(job.views_count !== 1) ? 's' : ''}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShareJob(job)}
                      className="p-2 text-k-text-b hover:text-k-accent-btn hover:bg-k-accent/5 rounded-xl transition-all"
                      title="Compartir"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => openModal(job)}
                      className="p-2 text-k-text-b hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-all"
                      title="Editar"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button 
                      onClick={() => handleDelete(job.id)}
                      className="p-2 text-k-text-b hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      title="Eliminar/Cerrar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
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
        <JobFormWizard
          initialJob={editingJob}
          initialTemplate={templateJob}
          onClose={closeModal}
          onSubmit={handleWizardSubmit}
          isSubmitting={isSubmitting}
        />
      )}

      {shareJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-k-text-h flex items-center gap-2">
                <LinkIcon className="w-5 h-5" />
                Compartir vacante
              </h2>
              <button onClick={() => setShareJob(null)} className="text-gray-400 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-sm text-k-text-b mb-2">{shareJob.title}</p>

            <div className="flex items-center gap-2 mb-4">
              <input
                type="text"
                readOnly
                value={publicJobUrl(shareJob)}
                className="flex-1 bg-k-bg-primary border border-k-border rounded-xl px-3 py-2 text-sm text-k-text-h"
              />
              <button
                onClick={() => copyToClipboard(shareJob)}
                className="p-2 rounded-xl bg-k-accent-btn text-white hover:bg-opacity-90"
                title="Copiar enlace"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>

            <div className="flex items-center justify-center gap-3 mb-4">
              <button
                onClick={() => shareWhatsApp(shareJob)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-500 text-white text-sm font-bold hover:bg-opacity-90"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </button>
              <button
                onClick={() => shareFacebook(shareJob)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-opacity-90"
              >
                <Facebook className="w-4 h-4" /> Facebook
              </button>
              <button
                onClick={() => shareLinkedIn(shareJob)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-700 text-white text-sm font-bold hover:bg-opacity-90"
              >
                <Linkedin className="w-4 h-4" /> LinkedIn
              </button>
            </div>

            <div className="flex flex-col items-center justify-center p-4 bg-k-bg-primary rounded-2xl border border-k-border">
              <img
                src={qrCodeUrl(shareJob)}
                alt="Código QR de la vacante"
                className="w-48 h-48"
              />
              <p className="text-xs text-k-text-b mt-2">Escanea para abrir el portal del aspirante</p>
            </div>

            {!import.meta.env.VITE_PORTAL_URL && (
              <p className="text-xs text-amber-600 mt-3">
                Nota: configura VITE_PORTAL_URL para generar el enlace correcto del portal.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
