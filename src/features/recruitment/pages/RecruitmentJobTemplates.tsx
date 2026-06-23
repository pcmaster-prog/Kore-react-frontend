import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { recruitmentApi } from "../api/recruitmentApi";
import type { JobOpeningTemplate, ScreeningQuestion } from "../types/recruitment";
import { Plus, X, Copy, Trash2, Briefcase } from "lucide-react";

const emptyTemplate = {
  title: '',
  description: '',
  requirements: '',
  salary_range: '',
  schedule: '',
  status: 'draft' as 'draft' | 'open' | 'closed',
  image_url: '',
  induction_video_url: '',
  screening_pass_score: '7',
  screening_questions: [] as { question: string; options: string; correctIndex: string }[],
  is_active: true,
};

export default function RecruitmentJobTemplates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<JobOpeningTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<JobOpeningTemplate | null>(null);
  const [formData, setFormData] = useState(emptyTemplate);

  const fetchTemplates = async () => {
    try {
      const data = await recruitmentApi.getJobTemplates();
      setTemplates(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const openModal = (template?: JobOpeningTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        title: template.title,
        description: template.description || '',
        requirements: template.requirements ? template.requirements.join('\n') : '',
        salary_range: template.salary_range || '',
        schedule: template.schedule || '',
        status: template.status,
        image_url: template.image_url || '',
        induction_video_url: template.induction_video_url || '',
        screening_pass_score: String(template.screening_pass_score ?? 7),
        screening_questions: (template.screening_questions || []).map((q: ScreeningQuestion) => ({
          question: q.question,
          options: (q.options || []).join('\n'),
          correctIndex: String(q.correctIndex ?? 0)
        })),
        is_active: template.is_active,
      });
    } else {
      setEditingTemplate(null);
      setFormData(emptyTemplate);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTemplate(null);
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

  const buildPayload = () => ({
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
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = buildPayload();
      if (editingTemplate) {
        await recruitmentApi.updateJobTemplate(editingTemplate.id, payload);
      } else {
        await recruitmentApi.createJobTemplate(payload);
      }
      await fetchTemplates();
      closeModal();
    } catch (error) {
      console.error(error);
      alert("Hubo un error al guardar la plantilla.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta plantilla?")) return;
    try {
      await recruitmentApi.deleteJobTemplate(id);
      await fetchTemplates();
    } catch (error) {
      console.error(error);
      alert("Error al eliminar la plantilla.");
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await recruitmentApi.duplicateJobTemplate(id);
      await fetchTemplates();
    } catch (error) {
      console.error(error);
      alert("Error al duplicar la plantilla.");
    }
  };

  const useTemplate = (template: JobOpeningTemplate) => {
    navigate(`/app/manager/reclutamiento/vacantes?templateId=${template.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-k-text-h tracking-tight">Plantillas de Vacante</h1>
          <p className="text-k-text-b text-sm mt-1">Crea plantillas reutilizables para publicar vacantes más rápido.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center space-x-2 bg-k-accent-btn text-white px-4 py-2 rounded-xl font-bold hover:bg-opacity-90 transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Nueva Plantilla</span>
        </button>
      </div>

      {loading ? (
        <p className="text-k-text-b">Cargando plantillas...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {templates.map(template => (
            <div key={template.id} className="bg-k-bg-card border border-k-border rounded-3xl p-6 shadow-k-card">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-black text-k-text-h">{template.title}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${template.is_active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-gray-500/10 text-gray-600'}`}>
                  {template.is_active ? 'Activa' : 'Inactiva'}
                </span>
              </div>
              <p className="text-k-text-b text-sm mt-2 line-clamp-2">{template.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-xs bg-k-bg-card2 text-k-text-b px-2 py-1 rounded-lg">{template.schedule}</span>
                <span className="text-xs bg-k-bg-card2 text-k-text-b px-2 py-1 rounded-lg">{template.salary_range}</span>
                <span className="text-xs bg-k-bg-card2 text-k-text-b px-2 py-1 rounded-lg">{template.screening_questions?.length ?? 0} preguntas</span>
              </div>
              <div className="mt-6 flex justify-end space-x-3 border-t border-k-border pt-4">
                <button onClick={() => useTemplate(template)} className="text-sm font-bold text-k-accent-btn hover:underline flex items-center gap-1">
                  <Briefcase className="w-4 h-4" /> Crear vacante
                </button>
                <button onClick={() => handleDuplicate(template.id)} className="text-sm font-bold text-k-text-b hover:text-k-accent-btn transition-colors flex items-center gap-1">
                  <Copy className="w-4 h-4" /> Duplicar
                </button>
                <button onClick={() => openModal(template)} className="text-sm font-bold text-k-text-b hover:text-k-accent-btn transition-colors">Editar</button>
                <button onClick={() => handleDelete(template.id)} className="text-sm font-bold text-k-text-b hover:text-red-500 transition-colors flex items-center gap-1">
                  <Trash2 className="w-4 h-4" /> Eliminar
                </button>
              </div>
            </div>
          ))}
          {templates.length === 0 && (
            <div className="col-span-full py-12 text-center bg-k-bg-card border border-k-border rounded-3xl border-dashed">
              <p className="text-k-text-b">No hay plantillas registradas.</p>
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-k-text-h">
                {editingTemplate ? 'Editar Plantilla' : 'Crear Plantilla'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-700"><X className="w-6 h-6" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-k-text-h mb-1">Título</label>
                <input type="text" required className="w-full bg-k-bg-primary border border-k-border rounded-xl px-4 py-2 focus:outline-none focus:border-k-accent" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-k-text-h mb-1">Descripción</label>
                <textarea className="w-full bg-k-bg-primary border border-k-border rounded-xl px-4 py-2 focus:outline-none focus:border-k-accent h-24" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-k-text-h mb-1">Requisitos (uno por línea)</label>
                <textarea className="w-full bg-k-bg-primary border border-k-border rounded-xl px-4 py-2 focus:outline-none focus:border-k-accent h-24" value={formData.requirements} onChange={(e) => setFormData({...formData, requirements: e.target.value})} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-k-text-h mb-1">Rango Salarial</label>
                  <input type="text" className="w-full bg-k-bg-primary border border-k-border rounded-xl px-4 py-2" value={formData.salary_range} onChange={(e) => setFormData({...formData, salary_range: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-k-text-h mb-1">Horario</label>
                  <input type="text" className="w-full bg-k-bg-primary border border-k-border rounded-xl px-4 py-2" value={formData.schedule} onChange={(e) => setFormData({...formData, schedule: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-k-text-h mb-1">URL de la Imagen</label>
                <input type="text" className="w-full bg-k-bg-primary border border-k-border rounded-xl px-4 py-2" value={formData.image_url} onChange={(e) => setFormData({...formData, image_url: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-k-text-h mb-1">Video de Inducción (URL)</label>
                <input type="text" className="w-full bg-k-bg-primary border border-k-border rounded-xl px-4 py-2" value={formData.induction_video_url} onChange={(e) => setFormData({...formData, induction_video_url: e.target.value})} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-k-text-h mb-1">Puntaje mínimo</label>
                  <input type="number" min={1} max={10} className="w-full bg-k-bg-primary border border-k-border rounded-xl px-4 py-2" value={formData.screening_pass_score} onChange={(e) => setFormData({...formData, screening_pass_score: e.target.value})} />
                </div>
                <div className="flex items-center gap-2">
                  <input id="is_active" type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({...formData, is_active: e.target.checked})} className="w-5 h-5" />
                  <label htmlFor="is_active" className="text-sm font-bold text-k-text-h">Activa</label>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-bold text-k-text-h">Preguntas de Autoevaluación</label>
                  <button type="button" onClick={addQuestion} className="text-xs font-bold text-k-accent-btn hover:underline">+ Agregar pregunta</button>
                </div>
                <div className="space-y-3">
                  {formData.screening_questions.map((q, idx) => (
                    <div key={idx} className="bg-k-bg-primary border border-k-border rounded-xl p-3 space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <input type="text" placeholder="Pregunta" className="flex-1 bg-white border border-k-border rounded-lg px-3 py-1.5 text-sm" value={q.question} onChange={(e) => updateQuestion(idx, 'question', e.target.value)} />
                        <button type="button" onClick={() => removeQuestion(idx)} className="text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
                      </div>
                      <textarea placeholder="Opciones (una por línea)" className="w-full bg-white border border-k-border rounded-lg px-3 py-1.5 text-sm h-16" value={q.options} onChange={(e) => updateQuestion(idx, 'options', e.target.value)} />
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-k-text-b">Índice respuesta correcta:</label>
                        <input type="number" min={0} className="w-16 bg-white border border-k-border rounded-lg px-2 py-1 text-sm" value={q.correctIndex} onChange={(e) => updateQuestion(idx, 'correctIndex', e.target.value)} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-k-text-h mb-1">Estado</label>
                <select className="w-full bg-k-bg-primary border border-k-border rounded-xl px-4 py-2" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value as 'open' | 'draft' | 'closed'})}>
                  <option value="draft">Borrador</option>
                  <option value="open">Abierta</option>
                  <option value="closed">Cerrada</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="px-4 py-2 rounded-xl font-bold text-k-text-b hover:bg-gray-100">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2 rounded-xl font-bold text-white bg-k-accent-btn hover:bg-opacity-90 disabled:opacity-50">{isSubmitting ? 'Guardando...' : 'Guardar Plantilla'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
