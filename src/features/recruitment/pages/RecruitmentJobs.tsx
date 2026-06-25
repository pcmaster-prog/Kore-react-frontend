import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { recruitmentApi } from "../api/recruitmentApi";
import type { JobOpening, JobOpeningTemplate, ScreeningQuestion } from "../types/recruitment";
import { Plus, X, Share2, Link as LinkIcon, Copy, Check, MessageCircle, Facebook, Linkedin } from "lucide-react";
import BulletListField from "../components/BulletListField";

const splitLines = (value: string) =>
  value.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);

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
    location: '',
    job_type: '',
    department: '',
    vacancies_count: '1',
    benefits: '',
    tags: '',
    is_featured: false,
    published_at: '',
    slug: '',
    status: 'open' as 'open' | 'draft' | 'closed',
    image_url: '',
    induction_video_url: '',
    about_us: '',
    objective: '',
    responsibilities: '',
    education_requirements: '',
    experience_requirements: '',
    knowledge_requirements: '',
    competencies: '',
    performance_indicators: '',
    offer_details: '',
    closing_statement: '',
    screening_pass_score: '7',
    screening_questions: [] as { question: string; options: string; correctIndex: string }[],
    scorecard_template: [] as { name: string; score: number; notes: string }[]
  });

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
    setFormData({
      title: template.title,
      description: template.description || '',
      requirements: template.requirements ? template.requirements.join('\n') : '',
      salary_range: template.salary_range || '',
      schedule: template.schedule || '',
      location: '',
      job_type: '',
      department: '',
      vacancies_count: '1',
      benefits: '',
      tags: '',
      is_featured: false,
      published_at: '',
      slug: '',
      status: 'draft',
      image_url: template.image_url || '',
      induction_video_url: template.induction_video_url || '',
      about_us: template.about_us || '',
      objective: template.objective || '',
      responsibilities: template.responsibilities ? template.responsibilities.join('\n') : '',
      education_requirements: template.education_requirements ? template.education_requirements.join('\n') : '',
      experience_requirements: template.experience_requirements ? template.experience_requirements.join('\n') : '',
      knowledge_requirements: template.knowledge_requirements ? template.knowledge_requirements.join('\n') : '',
      competencies: template.competencies ? template.competencies.join('\n') : '',
      performance_indicators: template.performance_indicators ? template.performance_indicators.join('\n') : '',
      offer_details: template.offer_details ? template.offer_details.join('\n') : '',
      closing_statement: template.closing_statement || '',
      screening_pass_score: String(template.screening_pass_score ?? 7),
      screening_questions: (template.screening_questions || []).map((q: ScreeningQuestion) => ({
        question: q.question,
        options: (q.options || []).join('\n'),
        correctIndex: String(q.correctIndex ?? 0)
      }))
    });
    setIsModalOpen(true);
  };

  const openModal = (job?: JobOpening) => {
    if (job) {
      setEditingJob(job);
      setFormData({
        title: job.title,
        description: job.description || '',
        requirements: job.requirements ? job.requirements.join('\n') : '',
        salary_range: job.salary_range || '',
        schedule: job.schedule || '',
        location: job.location || '',
        job_type: job.job_type || '',
        department: job.department || '',
        vacancies_count: String(job.vacancies_count ?? 1),
        benefits: job.benefits ? job.benefits.join('\n') : '',
        tags: job.tags ? job.tags.join('\n') : '',
        is_featured: job.is_featured || false,
        published_at: job.published_at ? job.published_at.slice(0, 16) : '',
        slug: job.slug || '',
        status: job.status,
        image_url: job.image_url || '',
        induction_video_url: job.induction_video_url || '',
        about_us: job.about_us || '',
        objective: job.objective || '',
        responsibilities: job.responsibilities ? job.responsibilities.join('\n') : '',
        education_requirements: job.education_requirements ? job.education_requirements.join('\n') : '',
        experience_requirements: job.experience_requirements ? job.experience_requirements.join('\n') : '',
        knowledge_requirements: job.knowledge_requirements ? job.knowledge_requirements.join('\n') : '',
        competencies: job.competencies ? job.competencies.join('\n') : '',
        performance_indicators: job.performance_indicators ? job.performance_indicators.join('\n') : '',
        offer_details: job.offer_details ? job.offer_details.join('\n') : '',
        closing_statement: job.closing_statement || '',
        screening_pass_score: String(job.screening_pass_score ?? 7),
        screening_questions: (job.screening_questions || []).map(q => ({
          question: q.question,
          options: (q.options || []).join('\n'),
          correctIndex: String(q.correctIndex ?? 0)
        })),
        scorecard_template: job.scorecard_template || []
      });
    } else {
      setEditingJob(null);
      setFormData({
        title: '',
        description: '',
        requirements: '',
        salary_range: '',
        schedule: '',
        location: '',
        job_type: '',
        department: '',
        vacancies_count: '1',
        benefits: '',
        tags: '',
        is_featured: false,
        published_at: '',
        slug: '',
        status: 'open',
        image_url: '',
        induction_video_url: '',
        about_us: '',
        objective: '',
        responsibilities: '',
        education_requirements: '',
        experience_requirements: '',
        knowledge_requirements: '',
        competencies: '',
        performance_indicators: '',
        offer_details: '',
        closing_statement: '',
        screening_pass_score: '7',
        screening_questions: [],
        scorecard_template: []
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
        requirements: splitLines(formData.requirements),
        benefits: splitLines(formData.benefits),
        tags: splitLines(formData.tags),
        responsibilities: splitLines(formData.responsibilities),
        education_requirements: splitLines(formData.education_requirements),
        experience_requirements: splitLines(formData.experience_requirements),
        knowledge_requirements: splitLines(formData.knowledge_requirements),
        competencies: splitLines(formData.competencies),
        performance_indicators: splitLines(formData.performance_indicators),
        offer_details: splitLines(formData.offer_details),
        vacancies_count: parseInt(formData.vacancies_count, 10) || 1,
        published_at: formData.published_at || undefined,
        slug: formData.slug || undefined,
        induction_video_url: formData.induction_video_url || undefined,
        screening_pass_score: parseInt(formData.screening_pass_score, 10),
        screening_questions: formData.screening_questions
          .filter(q => q.question.trim())
          .map(q => ({
            question: q.question.trim(),
            options: q.options.split('\n').map(o => o.trim()).filter(o => o),
            correctIndex: parseInt(q.correctIndex, 10) || 0
          })),
        scorecard_template: formData.scorecard_template.filter(s => s.name.trim())
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

  const addQuestion = () => {
    setFormData(prev => ({
      ...prev,
      screening_questions: [...prev.screening_questions, { question: '', options: '', correctIndex: '0' }]
    }));
  };

  const removeQuestion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      screening_questions: prev.screening_questions.filter((_, i) => i !== index)
    }));
  };

  const updateQuestion = (index: number, field: 'question' | 'options' | 'correctIndex', value: string) => {
    setFormData(prev => {
      const next = [...prev.screening_questions];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, screening_questions: next };
    });
  };

  const addScorecardCriterion = () => {
    setFormData(prev => ({
      ...prev,
      scorecard_template: [...prev.scorecard_template, { name: '', score: 0, notes: '' }]
    }));
  };

  const removeScorecardCriterion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      scorecard_template: prev.scorecard_template.filter((_, i) => i !== index)
    }));
  };

  const updateScorecardCriterion = (index: number, value: string) => {
    setFormData(prev => {
      const next = [...prev.scorecard_template];
      next[index] = { ...next[index], name: value };
      return { ...prev, scorecard_template: next };
    });
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
            <div key={job.id} className="group relative bg-white border border-k-border/50 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-k-accent/5 rounded-bl-[100px] z-0 transition-transform group-hover:scale-110"></div>
              
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

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Información general */}
              <section className="bg-k-bg-card border border-k-border rounded-3xl p-4 space-y-4">
                <h3 className="text-base font-black text-k-text-h">Información general</h3>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-k-text-h mb-1">Departamento</label>
                    <input
                      type="text"
                      className="w-full bg-k-bg-primary border border-k-border rounded-xl px-4 py-2 focus:outline-none focus:border-k-accent"
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                      placeholder="Ej. Operaciones"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-k-text-h mb-1">Tipo de empleo</label>
                    <select
                      className="w-full bg-k-bg-primary border border-k-border rounded-xl px-4 py-2 focus:outline-none focus:border-k-accent"
                      value={formData.job_type}
                      onChange={(e) => setFormData({...formData, job_type: e.target.value})}
                    >
                      <option value="">Selecciona...</option>
                      <option value="full-time">Tiempo completo</option>
                      <option value="part-time">Medio tiempo</option>
                      <option value="intern">Prácticas</option>
                      <option value="temporary">Temporal</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-k-text-h mb-1">Ubicación</label>
                    <input
                      type="text"
                      className="w-full bg-k-bg-primary border border-k-border rounded-xl px-4 py-2 focus:outline-none focus:border-k-accent"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      placeholder="Ej. Ciudad de México"
                    />
                  </div>
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-k-text-h mb-1">Número de vacantes</label>
                    <input
                      type="number"
                      min={1}
                      className="w-full bg-k-bg-primary border border-k-border rounded-xl px-4 py-2 focus:outline-none focus:border-k-accent"
                      value={formData.vacancies_count}
                      onChange={(e) => setFormData({...formData, vacancies_count: e.target.value})}
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
                  <div className="flex items-center gap-2 h-full pt-6">
                    <input
                      id="is_featured"
                      type="checkbox"
                      className="w-5 h-5 rounded border-k-border text-k-accent-btn focus:ring-k-accent-btn"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({...formData, is_featured: e.target.checked})}
                    />
                    <label htmlFor="is_featured" className="text-sm font-bold text-k-text-h">Vacante destacada</label>
                  </div>
                </div>
              </section>

              {/* Sobre la empresa y objetivo */}
              <section className="bg-k-bg-card border border-k-border rounded-3xl p-4 space-y-4">
                <h3 className="text-base font-black text-k-text-h">Sobre la empresa y objetivo</h3>
                <div>
                  <label className="block text-sm font-bold text-k-text-h mb-1">Sobre nosotros</label>
                  <textarea
                    className="w-full bg-k-bg-primary border border-k-border rounded-xl px-4 py-2 focus:outline-none focus:border-k-accent h-24"
                    value={formData.about_us}
                    onChange={(e) => setFormData({...formData, about_us: e.target.value})}
                    placeholder="Breve descripción de la empresa para el aspirante"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-k-text-h mb-1">Objetivo del puesto</label>
                  <textarea
                    className="w-full bg-k-bg-primary border border-k-border rounded-xl px-4 py-2 focus:outline-none focus:border-k-accent h-24"
                    value={formData.objective}
                    onChange={(e) => setFormData({...formData, objective: e.target.value})}
                    placeholder="Propósito principal de la vacante"
                  />
                </div>
              </section>

              {/* Perfil del candidato */}
              <section className="bg-k-bg-card border border-k-border rounded-3xl p-4 space-y-4">
                <h3 className="text-base font-black text-k-text-h">Perfil del candidato</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <BulletListField
                    label="Formación académica"
                    value={formData.education_requirements}
                    onChange={(v) => setFormData({...formData, education_requirements: v})}
                    placeholder="Licenciatura en Administración&#10;Ingeniería Industrial"
                  />
                  <BulletListField
                    label="Experiencia requerida"
                    value={formData.experience_requirements}
                    onChange={(v) => setFormData({...formData, experience_requirements: v})}
                    placeholder="2 años en puesto similar&#10;Manejo de personal"
                  />
                  <BulletListField
                    label="Conocimientos técnicos"
                    value={formData.knowledge_requirements}
                    onChange={(v) => setFormData({...formData, knowledge_requirements: v})}
                    placeholder="Paquetería Office&#10;Manejo de CRM"
                  />
                  <BulletListField
                    label="Requisitos generales"
                    value={formData.requirements}
                    onChange={(v) => setFormData({...formData, requirements: v})}
                    placeholder="Disponibilidad de horario&#10;Gusto por repostería"
                  />
                </div>
              </section>

              {/* Responsabilidades y competencias */}
              <section className="bg-k-bg-card border border-k-border rounded-3xl p-4 space-y-4">
                <h3 className="text-base font-black text-k-text-h">Responsabilidades y competencias</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <BulletListField
                    label="Responsabilidades"
                    value={formData.responsibilities}
                    onChange={(v) => setFormData({...formData, responsibilities: v})}
                    placeholder="Atención al cliente&#10;Cierre de caja"
                  />
                  <BulletListField
                    label="Competencias"
                    value={formData.competencies}
                    onChange={(v) => setFormData({...formData, competencies: v})}
                    placeholder="Comunicación asertiva&#10;Trabajo en equipo"
                  />
                </div>
              </section>

              {/* Indicadores y oferta */}
              <section className="bg-k-bg-card border border-k-border rounded-3xl p-4 space-y-4">
                <h3 className="text-base font-black text-k-text-h">Indicadores y oferta</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <BulletListField
                    label="Indicadores de desempeño"
                    value={formData.performance_indicators}
                    onChange={(v) => setFormData({...formData, performance_indicators: v})}
                    placeholder="Cumplimiento de metas mensuales&#10;Nivel de satisfacción del cliente"
                  />
                  <BulletListField
                    label="Detalles de la oferta"
                    value={formData.offer_details}
                    onChange={(v) => setFormData({...formData, offer_details: v})}
                    placeholder="Contrato indefinido&#10;Capacitación pagada"
                  />
                </div>
                <BulletListField
                  label="Beneficios"
                  value={formData.benefits}
                  onChange={(v) => setFormData({...formData, benefits: v})}
                  placeholder="Seguro social&#10;Vales de despensa"
                />
              </section>

              {/* Descripción libre y cierre */}
              <section className="bg-k-bg-card border border-k-border rounded-3xl p-4 space-y-4">
                <h3 className="text-base font-black text-k-text-h">Descripción libre y cierre</h3>
                <div>
                  <label className="block text-sm font-bold text-k-text-h mb-1">Descripción general</label>
                  <textarea
                    className="w-full bg-k-bg-primary border border-k-border rounded-xl px-4 py-2 focus:outline-none focus:border-k-accent h-24"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Breve descripción del puesto"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-k-text-h mb-1">Cierre / Llamado a la acción</label>
                  <textarea
                    className="w-full bg-k-bg-primary border border-k-border rounded-xl px-4 py-2 focus:outline-none focus:border-k-accent h-24"
                    value={formData.closing_statement}
                    onChange={(e) => setFormData({...formData, closing_statement: e.target.value})}
                    placeholder="¿Te interesa? Postúlate hoy y únete al equipo."
                  />
                </div>
              </section>

              {/* Configuración avanzada */}
              <section className="bg-k-bg-card border border-k-border rounded-3xl p-4 space-y-4">
                <h3 className="text-base font-black text-k-text-h">Configuración avanzada</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-k-text-h mb-1">Slug (URL amigable)</label>
                    <input
                      type="text"
                      className="w-full bg-k-bg-primary border border-k-border rounded-xl px-4 py-2 focus:outline-none focus:border-k-accent"
                      value={formData.slug}
                      onChange={(e) => setFormData({...formData, slug: e.target.value})}
                      placeholder="dejar en blanco para generar automáticamente"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-k-text-h mb-1">Fecha de publicación</label>
                    <input
                      type="datetime-local"
                      className="w-full bg-k-bg-primary border border-k-border rounded-xl px-4 py-2 focus:outline-none focus:border-k-accent"
                      value={formData.published_at}
                      onChange={(e) => setFormData({...formData, published_at: e.target.value})}
                    />
                  </div>
                </div>

                <BulletListField
                  label="Tags"
                  value={formData.tags}
                  onChange={(v) => setFormData({...formData, tags: v})}
                  placeholder="urgente&#10;nuevo"
                />

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
                  <label className="block text-sm font-bold text-k-text-h mb-1">Video de Inducción (URL)</label>
                  <input
                    type="text"
                    className="w-full bg-k-bg-primary border border-k-border rounded-xl px-4 py-2 focus:outline-none focus:border-k-accent"
                    value={formData.induction_video_url}
                    onChange={(e) => setFormData({...formData, induction_video_url: e.target.value})}
                    placeholder="https://youtube.com/watch?v=..."
                  />
                  <p className="text-xs text-k-text-b mt-1">Si lo dejas vacío, el portal usará el video de bienvenida general.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-k-text-h mb-1">Puntaje mínimo para aprobar</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      className="w-full bg-k-bg-primary border border-k-border rounded-xl px-4 py-2 focus:outline-none focus:border-k-accent"
                      value={formData.screening_pass_score}
                      onChange={(e) => setFormData({...formData, screening_pass_score: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-bold text-k-text-h">Preguntas de Autoevaluación</label>
                    <button
                      type="button"
                      onClick={addQuestion}
                      className="text-xs font-bold text-k-accent-btn hover:underline"
                    >
                      + Agregar pregunta
                    </button>
                  </div>
                  <div className="space-y-3">
                    {formData.screening_questions.map((q, idx) => (
                      <div key={idx} className="bg-k-bg-primary border border-k-border rounded-xl p-3 space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <input
                            type="text"
                            placeholder="Pregunta"
                            className="flex-1 bg-white border border-k-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-k-accent"
                            value={q.question}
                            onChange={(e) => updateQuestion(idx, 'question', e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => removeQuestion(idx)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <textarea
                          placeholder="Opciones (una por línea)"
                          className="w-full bg-white border border-k-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-k-accent h-16"
                          value={q.options}
                          onChange={(e) => updateQuestion(idx, 'options', e.target.value)}
                        />
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-k-text-b">Índice de respuesta correcta (0-based):</label>
                          <input
                            type="number"
                            min={0}
                            className="w-16 bg-white border border-k-border rounded-lg px-2 py-1 text-sm"
                            value={q.correctIndex}
                            onChange={(e) => updateQuestion(idx, 'correctIndex', e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-bold text-k-text-h">Rúbricas de Entrevista (Scorecards)</label>
                    <button
                      type="button"
                      onClick={addScorecardCriterion}
                      className="text-xs font-bold text-k-accent-btn hover:underline"
                    >
                      + Agregar criterio
                    </button>
                  </div>
                  <div className="space-y-3">
                    {formData.scorecard_template.map((s, idx) => (
                      <div key={idx} className="bg-k-bg-primary border border-k-border rounded-xl p-3 space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <input
                            type="text"
                            placeholder="Ej. Comunicación asertiva, Habilidades técnicas..."
                            className="flex-1 bg-white border border-k-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-k-accent"
                            value={s.name}
                            onChange={(e) => updateScorecardCriterion(idx, e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => removeScorecardCriterion(idx)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {formData.scorecard_template.length === 0 && (
                      <p className="text-xs text-k-text-b italic">No hay criterios definidos. Agrega uno para calificar a los candidatos en entrevista.</p>
                    )}
                  </div>
                </div>
              </section>

              <div className="pt-2 flex justify-end gap-3">
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
