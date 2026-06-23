import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { recruitmentApi } from "../api/recruitmentApi";
import type { JobOpening, JobOpeningTemplate, ScreeningQuestion } from "../types/recruitment";
import { Plus, X, Share2, Link as LinkIcon, Copy, Check } from "lucide-react";

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
    image_url: '',
    induction_video_url: '',
    screening_pass_score: '7',
    screening_questions: [] as { question: string; options: string; correctIndex: string }[]
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
      status: 'draft',
      image_url: template.image_url || '',
      induction_video_url: template.induction_video_url || '',
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
        status: job.status,
        image_url: job.image_url || '',
        induction_video_url: job.induction_video_url || '',
        screening_pass_score: String(job.screening_pass_score ?? 7),
        screening_questions: (job.screening_questions || []).map(q => ({
          question: q.question,
          options: (q.options || []).join('\n'),
          correctIndex: String(q.correctIndex ?? 0)
        }))
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
        image_url: '',
        induction_video_url: '',
        screening_pass_score: '7',
        screening_questions: []
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
        requirements: formData.requirements.split('\n').map(r => r.trim()).filter(r => r),
        induction_video_url: formData.induction_video_url || undefined,
        screening_pass_score: parseInt(formData.screening_pass_score, 10),
        screening_questions: formData.screening_questions
          .filter(q => q.question.trim())
          .map(q => ({
            question: q.question.trim(),
            options: q.options.split('\n').map(o => o.trim()).filter(o => o),
            correctIndex: parseInt(q.correctIndex, 10) || 0
          }))
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

  const publicJobUrl = (job: JobOpening) => `${portalBaseUrl}/jobs/${job.id}`;
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
                  onClick={() => setShareJob(job)}
                  className="text-sm font-bold text-k-text-b hover:text-k-accent-btn transition-colors flex items-center gap-1"
                >
                  <Share2 className="w-4 h-4" />
                  Compartir
                </button>
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
