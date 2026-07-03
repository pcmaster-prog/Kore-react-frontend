import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, CheckCircle2, Sparkles, LayoutList, Settings } from 'lucide-react';
import BulletListField from './BulletListField';
import type { JobOpening, JobOpeningTemplate, ScreeningQuestion } from '../types/recruitment';

interface JobFormWizardProps {
  initialJob: JobOpening | null;
  initialTemplate: JobOpeningTemplate | null;
  onClose: () => void;
  onSubmit: (payload: any) => Promise<void>;
  isSubmitting: boolean;
}

const splitLines = (value: string) =>
  value.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);

const steps = [
  { id: 'info', title: 'Información General', icon: LayoutList },
  { id: 'details', title: 'Perfil y Detalles', icon: Sparkles },
  { id: 'flow', title: 'Configuración y Flujo', icon: Settings }
];

export default function JobFormWizard({ initialJob, initialTemplate, onClose, onSubmit, isSubmitting }: JobFormWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  
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
    scorecard_template: [] as { name: string; score: number; notes: string }[],
    interview_guide_questions: [] as { category: string; question: string }[]
  });

  useEffect(() => {
    if (initialTemplate) {
      setFormData({
        title: initialTemplate.title,
        description: initialTemplate.description || '',
        requirements: initialTemplate.requirements ? initialTemplate.requirements.join('\n') : '',
        salary_range: initialTemplate.salary_range || '',
        schedule: initialTemplate.schedule || '',
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
        image_url: initialTemplate.image_url || '',
        induction_video_url: initialTemplate.induction_video_url || '',
        about_us: initialTemplate.about_us || '',
        objective: initialTemplate.objective || '',
        responsibilities: initialTemplate.responsibilities ? initialTemplate.responsibilities.join('\n') : '',
        education_requirements: initialTemplate.education_requirements ? initialTemplate.education_requirements.join('\n') : '',
        experience_requirements: initialTemplate.experience_requirements ? initialTemplate.experience_requirements.join('\n') : '',
        knowledge_requirements: initialTemplate.knowledge_requirements ? initialTemplate.knowledge_requirements.join('\n') : '',
        competencies: initialTemplate.competencies ? initialTemplate.competencies.join('\n') : '',
        performance_indicators: initialTemplate.performance_indicators ? initialTemplate.performance_indicators.join('\n') : '',
        offer_details: initialTemplate.offer_details ? initialTemplate.offer_details.join('\n') : '',
        closing_statement: initialTemplate.closing_statement || '',
        screening_pass_score: String(initialTemplate.screening_pass_score ?? 7),
        screening_questions: (initialTemplate.screening_questions || []).map((q: ScreeningQuestion) => ({
          question: q.question,
          options: (q.options || []).join('\n'),
          correctIndex: String(q.correctIndex ?? 0)
        })),
        scorecard_template: [],
        interview_guide_questions: []
      });
    } else if (initialJob) {
      setFormData({
        title: initialJob.title,
        description: initialJob.description || '',
        requirements: initialJob.requirements ? initialJob.requirements.join('\n') : '',
        salary_range: initialJob.salary_range || '',
        schedule: initialJob.schedule || '',
        location: initialJob.location || '',
        job_type: initialJob.job_type || '',
        department: initialJob.department || '',
        vacancies_count: String(initialJob.vacancies_count ?? 1),
        benefits: initialJob.benefits ? initialJob.benefits.join('\n') : '',
        tags: initialJob.tags ? initialJob.tags.join('\n') : '',
        is_featured: initialJob.is_featured || false,
        published_at: initialJob.published_at ? initialJob.published_at.slice(0, 16) : '',
        slug: initialJob.slug || '',
        status: initialJob.status,
        image_url: initialJob.image_url || '',
        induction_video_url: initialJob.induction_video_url || '',
        about_us: initialJob.about_us || '',
        objective: initialJob.objective || '',
        responsibilities: initialJob.responsibilities ? initialJob.responsibilities.join('\n') : '',
        education_requirements: initialJob.education_requirements ? initialJob.education_requirements.join('\n') : '',
        experience_requirements: initialJob.experience_requirements ? initialJob.experience_requirements.join('\n') : '',
        knowledge_requirements: initialJob.knowledge_requirements ? initialJob.knowledge_requirements.join('\n') : '',
        competencies: initialJob.competencies ? initialJob.competencies.join('\n') : '',
        performance_indicators: initialJob.performance_indicators ? initialJob.performance_indicators.join('\n') : '',
        offer_details: initialJob.offer_details ? initialJob.offer_details.join('\n') : '',
        closing_statement: initialJob.closing_statement || '',
        screening_pass_score: String(initialJob.screening_pass_score ?? 7),
        screening_questions: (initialJob.screening_questions || []).map(q => ({
          question: q.question,
          options: (q.options || []).join('\n'),
          correctIndex: String(q.correctIndex ?? 0)
        })),
        scorecard_template: (initialJob.scorecard_template || []).map(s => ({
          name: s.name,
          score: s.score,
          notes: s.notes || ''
        })),
        interview_guide_questions: (initialJob.interview_guide_questions || []).map(q => ({
          category: q.category,
          question: q.question
        }))
      });
    }
  }, [initialJob, initialTemplate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      return;
    }

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
      scorecard_template: formData.scorecard_template.filter(s => s.name.trim()),
      interview_guide_questions: formData.interview_guide_questions.filter(q => q.question.trim())
    };

    await onSubmit(payload);
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

  // ── Interview Guide Questions helpers ────────────────────────────────────
  const DEFAULT_SCORECARD_NAMES = ['Comunicación oral', 'Actitud y disposición', 'Puntualidad', 'Presentación personal', 'Experiencia relevante'];
  const GUIDE_CATEGORIES = ['Motivación', 'Experiencia', 'Disponibilidad', 'Actitud', 'Conocimiento técnico'];

  const addGuideQuestion = () => {
    setFormData(prev => ({
      ...prev,
      interview_guide_questions: [...prev.interview_guide_questions, { category: GUIDE_CATEGORIES[0], question: '' }]
    }));
  };

  const removeGuideQuestion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      interview_guide_questions: prev.interview_guide_questions.filter((_, i) => i !== index)
    }));
  };

  const updateGuideQuestion = (index: number, field: 'category' | 'question', value: string) => {
    setFormData(prev => {
      const next = [...prev.interview_guide_questions];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, interview_guide_questions: next };
    });
  };

  const prefillDefaultScorecard = () => {
    if (formData.scorecard_template.length === 0) {
      setFormData(prev => ({
        ...prev,
        scorecard_template: DEFAULT_SCORECARD_NAMES.map(name => ({ name, score: 0, notes: '' }))
      }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md px-4 sm:px-6 py-6 sm:py-10 transition-opacity animate-in fade-in duration-300">
      <div className="bg-white/95 backdrop-blur-3xl border border-white/20 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transform transition-all animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-k-border/50 bg-white/50 backdrop-blur-md">
          <h2 className="text-xl font-bold bg-gradient-to-r from-k-accent-btn to-purple-600 bg-clip-text text-transparent">
            {initialJob ? 'Editar Vacante' : 'Crear Nueva Vacante'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper */}
        <div className="flex justify-between px-8 py-4 bg-gray-50/50 border-b border-k-border/50">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300 ${
                currentStep > idx ? 'bg-k-accent-btn border-k-accent-btn text-white' : 
                currentStep === idx ? 'border-k-accent-btn text-k-accent-btn bg-white shadow-md shadow-k-accent-btn/20 scale-110' : 
                'border-gray-300 text-gray-400 bg-gray-50'
              }`}>
                {currentStep > idx ? <CheckCircle2 className="w-5 h-5" /> : <step.icon className="w-4 h-4" />}
              </div>
              <span className={`ml-3 text-sm font-semibold hidden md:block transition-colors duration-300 ${
                currentStep === idx ? 'text-k-text-h' : currentStep > idx ? 'text-k-text-h' : 'text-gray-400'
              }`}>
                {step.title}
              </span>
              {idx < steps.length - 1 && (
                <div className="w-8 md:w-16 h-[2px] mx-2 md:mx-4 bg-gray-200">
                  <div className="h-full bg-k-accent-btn transition-all duration-500 ease-in-out" style={{ width: currentStep > idx ? '100%' : '0%' }}></div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
          <form id="job-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* STEP 1: INFO */}
            <div className={`transition-all duration-300 ease-in-out ${currentStep === 0 ? 'block opacity-100' : 'hidden opacity-0'}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-k-text-h mb-1">Título de la Vacante <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    className="w-full bg-white/70 backdrop-blur border border-k-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-k-accent/50 focus:border-k-accent transition-all shadow-sm"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Ej. Desarrollador Frontend Senior"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-k-text-h mb-1">Departamento</label>
                  <input
                    type="text"
                    className="w-full bg-white/70 backdrop-blur border border-k-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-k-accent/50 focus:border-k-accent transition-all shadow-sm"
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    placeholder="Ej. Tecnología"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-k-text-h mb-1">Tipo de empleo</label>
                  <select
                    className="w-full bg-white/70 backdrop-blur border border-k-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-k-accent/50 focus:border-k-accent transition-all shadow-sm"
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

                <div>
                  <label className="block text-sm font-bold text-k-text-h mb-1">Ubicación</label>
                  <input
                    type="text"
                    className="w-full bg-white/70 backdrop-blur border border-k-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-k-accent/50 focus:border-k-accent transition-all shadow-sm"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="Ej. Remoto, Monterrey"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-k-text-h mb-1">Rango Salarial</label>
                  <input
                    type="text"
                    className="w-full bg-white/70 backdrop-blur border border-k-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-k-accent/50 focus:border-k-accent transition-all shadow-sm"
                    value={formData.salary_range}
                    onChange={(e) => setFormData({...formData, salary_range: e.target.value})}
                    placeholder="Ej. $20k - $30k mensuales"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-k-text-h mb-1">Horario</label>
                  <input
                    type="text"
                    className="w-full bg-white/70 backdrop-blur border border-k-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-k-accent/50 focus:border-k-accent transition-all shadow-sm"
                    value={formData.schedule}
                    onChange={(e) => setFormData({...formData, schedule: e.target.value})}
                    placeholder="Ej. Lunes a Viernes 9am - 6pm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-k-text-h mb-1">Número de vacantes</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full bg-white/70 backdrop-blur border border-k-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-k-accent/50 focus:border-k-accent transition-all shadow-sm"
                    value={formData.vacancies_count}
                    onChange={(e) => setFormData({...formData, vacancies_count: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-k-text-h mb-1">Estado</label>
                  <select
                    className="w-full bg-white/70 backdrop-blur border border-k-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-k-accent/50 focus:border-k-accent transition-all shadow-sm"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as 'open' | 'draft' | 'closed'})}
                  >
                    <option value="open">Abierta (Visible)</option>
                    <option value="draft">Borrador (Oculta)</option>
                    <option value="closed">Cerrada</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 h-full pt-6">
                  <div className="relative flex items-center">
                    <input
                      id="is_featured"
                      type="checkbox"
                      className="peer w-5 h-5 rounded border-k-border text-k-accent-btn focus:ring-k-accent-btn cursor-pointer transition-all"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({...formData, is_featured: e.target.checked})}
                    />
                  </div>
                  <label htmlFor="is_featured" className="text-sm font-bold text-k-text-h cursor-pointer select-none">Destacar Vacante ✨</label>
                </div>
              </div>
            </div>

            {/* STEP 2: DETAILS */}
            <div className={`transition-all duration-300 ease-in-out ${currentStep === 1 ? 'block opacity-100' : 'hidden opacity-0'}`}>
              <div className="space-y-6">
                
                <div className="bg-k-bg-card/50 backdrop-blur border border-k-border rounded-2xl p-5 shadow-sm">
                  <h3 className="text-sm font-black text-k-text-h uppercase tracking-wider mb-4">La Empresa y el Puesto</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-k-text-h mb-1">Sobre nosotros</label>
                      <textarea
                        className="w-full bg-white border border-k-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-k-accent/50 focus:border-k-accent h-24 resize-none transition-all"
                        value={formData.about_us}
                        onChange={(e) => setFormData({...formData, about_us: e.target.value})}
                        placeholder="Breve descripción de la empresa para el aspirante"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-k-text-h mb-1">Objetivo del puesto</label>
                      <textarea
                        className="w-full bg-white border border-k-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-k-accent/50 focus:border-k-accent h-24 resize-none transition-all"
                        value={formData.objective}
                        onChange={(e) => setFormData({...formData, objective: e.target.value})}
                        placeholder="Propósito principal de la vacante"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-k-bg-card/50 backdrop-blur border border-k-border rounded-2xl p-5 shadow-sm">
                  <h3 className="text-sm font-black text-k-text-h uppercase tracking-wider mb-4">Requisitos y Perfil</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <BulletListField
                      label="Formación académica"
                      value={formData.education_requirements}
                      onChange={(v) => setFormData({...formData, education_requirements: v})}
                      placeholder="Licenciatura en Sistemas&#10;Ingeniería de Software"
                    />
                    <BulletListField
                      label="Experiencia requerida"
                      value={formData.experience_requirements}
                      onChange={(v) => setFormData({...formData, experience_requirements: v})}
                      placeholder="3 años en React&#10;1 año liderando equipos"
                    />
                    <BulletListField
                      label="Conocimientos técnicos"
                      value={formData.knowledge_requirements}
                      onChange={(v) => setFormData({...formData, knowledge_requirements: v})}
                      placeholder="React, TypeScript&#10;Git, CI/CD"
                    />
                    <BulletListField
                      label="Competencias blandas"
                      value={formData.competencies}
                      onChange={(v) => setFormData({...formData, competencies: v})}
                      placeholder="Comunicación efectiva&#10;Proactividad"
                    />
                  </div>
                </div>
                
                <div className="bg-k-bg-card/50 backdrop-blur border border-k-border rounded-2xl p-5 shadow-sm">
                  <h3 className="text-sm font-black text-k-text-h uppercase tracking-wider mb-4">Responsabilidades y Detalles Libres</h3>
                  <div className="space-y-4">
                    <BulletListField
                      label="Responsabilidades"
                      value={formData.responsibilities}
                      onChange={(v) => setFormData({...formData, responsibilities: v})}
                      placeholder="Desarrollo de nuevas features&#10;Code reviews"
                    />
                    <div>
                      <label className="block text-sm font-bold text-k-text-h mb-1">Descripción general</label>
                      <textarea
                        className="w-full bg-white border border-k-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-k-accent/50 focus:border-k-accent h-24 resize-none transition-all"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        placeholder="Descripción libre del puesto (opcional)"
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* STEP 3: FLOW & CONFIG */}
            <div className={`transition-all duration-300 ease-in-out ${currentStep === 2 ? 'block opacity-100' : 'hidden opacity-0'}`}>
              <div className="space-y-6">
                
                <div className="bg-k-bg-card/50 backdrop-blur border border-k-border rounded-2xl p-5 shadow-sm">
                  <h3 className="text-sm font-black text-k-text-h uppercase tracking-wider mb-4">Oferta y Beneficios</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <BulletListField
                      label="Beneficios"
                      value={formData.benefits}
                      onChange={(v) => setFormData({...formData, benefits: v})}
                      placeholder="Seguro de gastos médicos mayores&#10;Fondo de ahorro"
                    />
                    <BulletListField
                      label="Indicadores de desempeño"
                      value={formData.performance_indicators}
                      onChange={(v) => setFormData({...formData, performance_indicators: v})}
                      placeholder="Velocity de sprints&#10;Reducción de bugs en producción"
                    />
                  </div>
                </div>

                <div className="bg-k-bg-card/50 backdrop-blur border border-k-border rounded-2xl p-5 shadow-sm">
                  <h3 className="text-sm font-black text-k-text-h uppercase tracking-wider mb-4">Configuración Avanzada</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-k-text-h mb-1">Slug (URL amigable)</label>
                      <input
                        type="text"
                        className="w-full bg-white border border-k-border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-k-accent/50 focus:border-k-accent transition-all"
                        value={formData.slug}
                        onChange={(e) => setFormData({...formData, slug: e.target.value})}
                        placeholder="dejar en blanco para autogenerar"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-k-text-h mb-1">Fecha de publicación</label>
                      <input
                        type="datetime-local"
                        className="w-full bg-white border border-k-border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-k-accent/50 focus:border-k-accent transition-all"
                        value={formData.published_at}
                        onChange={(e) => setFormData({...formData, published_at: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-k-text-h mb-1">URL de la Imagen (Banner)</label>
                      <input
                        type="text"
                        className="w-full bg-white border border-k-border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-k-accent/50 focus:border-k-accent transition-all"
                        value={formData.image_url}
                        onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-k-text-h mb-1">Video de Inducción (URL)</label>
                      <input
                        type="text"
                        className="w-full bg-white border border-k-border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-k-accent/50 focus:border-k-accent transition-all"
                        value={formData.induction_video_url}
                        onChange={(e) => setFormData({...formData, induction_video_url: e.target.value})}
                        placeholder="https://youtube.com/watch?v=..."
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <BulletListField
                      label="Tags (Etiquetas internas)"
                      value={formData.tags}
                      onChange={(v) => setFormData({...formData, tags: v})}
                      placeholder="urgente&#10;nuevo"
                    />
                  </div>
                </div>

                <div className="bg-k-bg-card/50 backdrop-blur border border-k-border rounded-2xl p-5 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-black text-k-text-h uppercase tracking-wider">Flujo de Selección</h3>
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-bold text-k-text-h mb-1">Puntaje mínimo para aprobar screening</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      className="w-full md:w-1/3 bg-white border border-k-border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-k-accent/50 focus:border-k-accent transition-all"
                      value={formData.screening_pass_score}
                      onChange={(e) => setFormData({...formData, screening_pass_score: e.target.value})}
                    />
                  </div>

                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-bold text-k-text-h">Preguntas de Autoevaluación</label>
                        <button
                          type="button"
                          onClick={addQuestion}
                          className="text-xs font-bold text-k-accent-btn hover:text-k-accent-btn/80 transition-colors"
                        >
                          + Agregar pregunta
                        </button>
                      </div>
                      <div className="space-y-3">
                        {formData.screening_questions.map((q, idx) => (
                          <div key={idx} className="bg-white border border-k-border rounded-xl p-4 shadow-sm relative group transition-all">
                            <button
                              type="button"
                              onClick={() => removeQuestion(idx)}
                              className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <input
                              type="text"
                              placeholder="Escribe la pregunta..."
                              className="w-full bg-transparent border-b border-k-border/50 px-1 py-1.5 mb-2 text-sm focus:outline-none focus:border-k-accent font-medium"
                              value={q.question}
                              onChange={(e) => updateQuestion(idx, 'question', e.target.value)}
                            />
                            <textarea
                              placeholder="Opciones (una por línea)"
                              className="w-full bg-gray-50 border border-k-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-k-accent/50 h-20 resize-none mt-1"
                              value={q.options}
                              onChange={(e) => updateQuestion(idx, 'options', e.target.value)}
                            />
                            <div className="flex items-center gap-2 mt-2">
                              <label className="text-xs font-medium text-gray-500">Índice correcta (0-based):</label>
                              <input
                                type="number"
                                min={0}
                                className="w-16 bg-white border border-k-border rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-k-accent"
                                value={q.correctIndex}
                                onChange={(e) => updateQuestion(idx, 'correctIndex', e.target.value)}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ── Interview Guide Questions ── */}
                  <div className="border border-k-border/50 rounded-2xl overflow-hidden">
                    <details className="group">
                      <summary className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 cursor-pointer select-none hover:from-indigo-500/10 hover:to-purple-500/10 transition-colors list-none">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🎤</span>
                          <span className="text-sm font-black text-k-text-h">Guía de Preguntas de Entrevista</span>
                          {formData.interview_guide_questions.length > 0 && (
                            <span className="bg-indigo-500/15 text-indigo-600 border border-indigo-500/20 text-xs font-bold px-2 py-0.5 rounded-lg">
                              {formData.interview_guide_questions.length}
                            </span>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-k-text-b transition-transform group-open:rotate-90" />
                      </summary>
                      <div className="px-5 pb-5 pt-4 space-y-3 bg-k-bg-card/30">
                        <p className="text-xs text-k-text-b">Estas preguntas aparecerán al entrevistador durante el Modo Entrevista, agrupadas por categoría.</p>
                        {formData.interview_guide_questions.map((q, idx) => (
                          <div key={idx} className="bg-white border border-k-border rounded-xl p-3 flex gap-3 items-start group/q relative shadow-sm">
                            <button
                              type="button"
                              onClick={() => removeGuideQuestion(idx)}
                              className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover/q:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <div className="flex flex-col gap-2 flex-1 min-w-0 pr-6">
                              <select
                                value={q.category}
                                onChange={(e) => updateGuideQuestion(idx, 'category', e.target.value)}
                                className="w-full md:w-48 bg-gray-50 border border-k-border rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-k-accent/50 text-k-text-h"
                              >
                                {GUIDE_CATEGORIES.map(c => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </select>
                              <input
                                type="text"
                                placeholder="Escribe la pregunta de entrevista..."
                                className="w-full bg-transparent border-b border-k-border/50 px-1 py-1.5 text-sm focus:outline-none focus:border-k-accent font-medium text-k-text-h"
                                value={q.question}
                                onChange={(e) => updateGuideQuestion(idx, 'question', e.target.value)}
                              />
                            </div>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addGuideQuestion}
                          className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-500/10 hover:bg-indigo-500/20 px-4 py-2 rounded-xl transition-colors w-fit"
                        >
                          + Agregar pregunta
                        </button>
                      </div>
                    </details>
                  </div>

                  {/* ── Scorecard Template ── */}
                  <div className="border border-k-border/50 rounded-2xl overflow-hidden">
                    <details className="group">
                      <summary className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-amber-500/5 to-orange-500/5 cursor-pointer select-none hover:from-amber-500/10 hover:to-orange-500/10 transition-colors list-none">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">⭐</span>
                          <span className="text-sm font-black text-k-text-h">Plantilla de Evaluación (Scorecard)</span>
                          {formData.scorecard_template.length > 0 && (
                            <span className="bg-amber-500/15 text-amber-600 border border-amber-500/20 text-xs font-bold px-2 py-0.5 rounded-lg">
                              {formData.scorecard_template.length} criterios
                            </span>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-k-text-b transition-transform group-open:rotate-90" />
                      </summary>
                      <div className="px-5 pb-5 pt-4 space-y-3 bg-k-bg-card/30">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-k-text-b">Criterios con los que se evaluará al candidato durante la entrevista.</p>
                          {formData.scorecard_template.length === 0 && (
                            <button
                              type="button"
                              onClick={prefillDefaultScorecard}
                              className="text-xs font-bold text-amber-600 hover:text-amber-700 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1 rounded-lg transition-colors whitespace-nowrap"
                            >
                              Usar predeterminados
                            </button>
                          )}
                        </div>
                        <div className="space-y-2">
                          {formData.scorecard_template.map((s, idx) => (
                            <div key={idx} className="bg-white border border-k-border rounded-xl p-2 flex items-center gap-2 shadow-sm">
                              <span className="text-k-text-b text-sm ml-1 shrink-0">⭐</span>
                              <input
                                type="text"
                                placeholder="Ej. Comunicación asertiva, Habilidades técnicas..."
                                className="flex-1 bg-transparent border-none px-3 py-1.5 text-sm focus:outline-none text-k-text-h"
                                value={s.name}
                                onChange={(e) => updateScorecardCriterion(idx, e.target.value)}
                              />
                              <button
                                type="button"
                                onClick={() => removeScorecardCriterion(idx)}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          {formData.scorecard_template.length === 0 && (
                            <p className="text-xs text-k-text-b italic p-3 bg-gray-50 rounded-xl">No hay criterios. Agrega uno o usa los predeterminados.</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={addScorecardCriterion}
                          className="flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 bg-amber-500/10 hover:bg-amber-500/20 px-4 py-2 rounded-xl transition-colors w-fit"
                        >
                          + Agregar criterio
                        </button>
                      </div>
                    </details>
                  </div>

              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-k-border/50 bg-gray-50/50 backdrop-blur-md flex justify-between items-center">
          <button
            type="button"
            onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold transition-all ${
              currentStep === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-k-text-b hover:bg-white hover:shadow-sm border border-transparent hover:border-k-border'
            }`}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="w-4 h-4" /> Atrás
          </button>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-xl font-bold text-k-text-b hover:bg-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="job-form"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-k-accent-btn to-indigo-600 hover:from-k-accent-btn hover:to-purple-600 hover:shadow-lg hover:shadow-k-accent-btn/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 transition-all"
            >
              {currentStep < steps.length - 1 ? (
                <>Siguiente <ChevronRight className="w-4 h-4" /></>
              ) : isSubmitting ? (
                'Guardando...'
              ) : (
                'Guardar Vacante'
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
