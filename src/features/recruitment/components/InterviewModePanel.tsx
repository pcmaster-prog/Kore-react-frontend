import { useState, useMemo } from 'react';
import {
  X,
  Star,
  BookOpen,
  ClipboardList,
  FileText,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Save,
  AlertTriangle,
} from 'lucide-react';
import type { Interview, Application, InterviewDocumentChecklist } from '../types/recruitment';

// ─── Default data ────────────────────────────────────────────────────────────

const DEFAULT_SCORECARD = [
  { name: 'Comunicación oral' },
  { name: 'Actitud y disposición' },
  { name: 'Puntualidad' },
  { name: 'Presentación personal' },
  { name: 'Experiencia relevante' },
];

const DEFAULT_DOCUMENTS: { type: string; label: string }[] = [
  { type: 'ine', label: 'INE / Credencial de elector' },
  { type: 'curp', label: 'CURP' },
  { type: 'domicilio', label: 'Comprobante de domicilio' },
  { type: 'rfc', label: 'RFC' },
  { type: 'nss', label: 'NSS' },
  { type: 'cv', label: 'Currículum Vitae' },
  { type: 'acta_nacimiento', label: 'Acta de nacimiento' },
  { type: 'certificado', label: 'Certificado de estudios' },
];

const RED_FLAGS = [
  { id: 'late', emoji: '⏰', label: 'Llegó tarde' },
  { id: 'attitude', emoji: '😞', label: 'Actitud negativa' },
  { id: 'docs', emoji: '📄', label: 'Documentos incompletos' },
  { id: 'inconsistent', emoji: '⚠️', label: 'Historia inconsistente' },
];

type Tab = 'guide' | 'scorecard' | 'documents';

interface ScorecardEntry {
  name: string;
  score: number;
  notes: string;
}

interface DocEntry extends InterviewDocumentChecklist {}

interface Props {
  interview: Interview;
  application: Application;
  onClose: () => void;
  onSave: (interviewId: string, data: Partial<Interview>) => Promise<void>;
  onApprove: () => void;
  onReject: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcAverage(entries: ScorecardEntry[]): number {
  const rated = entries.filter((e) => e.score > 0);
  if (!rated.length) return 0;
  return rated.reduce((s, e) => s + e.score, 0) / rated.length;
}

function RecommendationBadge({ avg }: { avg: number }) {
  if (avg === 0) return null;
  const cfg =
    avg >= 4.5
      ? { label: 'Excelente', cls: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30' }
      : avg >= 3.5
      ? { label: 'Buena elección', cls: 'bg-blue-500/15 text-blue-600 border-blue-500/30' }
      : avg >= 2.5
      ? { label: 'Regular', cls: 'bg-amber-500/15 text-amber-600 border-amber-500/30' }
      : { label: 'No recomendado', cls: 'bg-red-500/15 text-red-600 border-red-500/30' };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black border ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function InterviewModePanel({ interview, application, onClose, onSave, onApprove, onReject }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('scorecard');
  const [saving, setSaving] = useState(false);

  // ── Guide tab state ──────────────────────────────────────────────────────
  const guideQuestions = application.jobOpening?.interview_guide_questions ?? [];
  const [checkedQuestions, setCheckedQuestions] = useState<Record<number, boolean>>({});
  const [questionNotes, setQuestionNotes] = useState<Record<number, string>>({});

  // ── Scorecard tab state ──────────────────────────────────────────────────
  const templateCriteria = useMemo(() => {
    const tpl = application.jobOpening?.scorecard_template;
    if (tpl && tpl.length > 0) return tpl.map((c) => c.name);
    return DEFAULT_SCORECARD.map((c) => c.name);
  }, [application.jobOpening?.scorecard_template]);

  const [scorecard, setScorecard] = useState<ScorecardEntry[]>(() =>
    templateCriteria.map((name) => {
      const existing = interview.scorecard?.find((c) => c.name === name);
      return { name, score: existing?.score ?? 0, notes: existing?.notes ?? '' };
    })
  );

  const [activeFlags, setActiveFlags] = useState<Set<string>>(new Set());

  const avg = useMemo(() => calcAverage(scorecard), [scorecard]);

  const toggleFlag = (id: string) =>
    setActiveFlags((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const setScore = (idx: number, score: number) =>
    setScorecard((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], score };
      return next;
    });

  const setScorecardNote = (idx: number, notes: string) =>
    setScorecard((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], notes };
      return next;
    });

  // ── Documents tab state ──────────────────────────────────────────────────
  const [docs, setDocs] = useState<DocEntry[]>(() =>
    DEFAULT_DOCUMENTS.map((d) => {
      const existing = interview.document_checklist?.find((c) => c.type === d.type);
      return {
        type: d.type,
        label: d.label,
        status: existing?.status ?? 'pending',
        notes: existing?.notes ?? '',
      };
    })
  );

  const setDocStatus = (idx: number, status: DocEntry['status']) =>
    setDocs((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], status };
      return next;
    });

  const setDocNote = (idx: number, notes: string) =>
    setDocs((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], notes };
      return next;
    });

  // ── Save handler ─────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      const cleanScorecard = scorecard.filter((c) => c.score > 0);
      const recommendation =
        avg >= 4.5
          ? 'Excelente'
          : avg >= 3.5
          ? 'Buena elección'
          : avg >= 2.5
          ? 'Regular'
          : avg > 0
          ? 'No recomendado'
          : undefined;

      await onSave(interview.id, {
        scorecard: cleanScorecard,
        recommendation,
        document_checklist: docs,
      });
    } finally {
      setSaving(false);
    }
  };

  // ── Grouped guide questions ──────────────────────────────────────────────
  const groupedGuide = useMemo(() => {
    const map: Record<string, { idx: number; question: string }[]> = {};
    guideQuestions.forEach((q, idx) => {
      if (!map[q.category]) map[q.category] = [];
      map[q.category].push({ idx, question: q.question });
    });
    return map;
  }, [guideQuestions]);

  // ─── Render ────────────────────────────────────────────────────────────────
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'guide', label: 'Guía', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'scorecard', label: 'Evaluación', icon: <ClipboardList className="w-4 h-4" /> },
    { id: 'documents', label: 'Documentos', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-stretch justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-2xl flex flex-col bg-k-bg-card/95 backdrop-blur-xl border-l border-k-border/50 shadow-2xl animate-in slide-in-from-right duration-300">

        {/* ── Header ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-k-border/50 bg-gradient-to-r from-k-accent/10 to-purple-500/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-k-accent to-purple-600 text-white shadow-lg">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-k-text-b">Modo Entrevista</p>
              <h2 className="font-black text-k-text-h leading-tight">
                {application.user?.name ?? 'Candidato'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-k-bg-secondary/80 text-k-text-b hover:text-k-text-h transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Tabs ──────────────────────────────────────────────── */}
        <div className="flex gap-1 px-4 pt-3 pb-0 shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-t-xl text-sm font-bold transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'border-k-accent text-k-accent bg-k-accent/5'
                  : 'border-transparent text-k-text-b hover:text-k-text-h hover:bg-k-bg-secondary/50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
        <div className="h-px bg-k-border/50 shrink-0" />

        {/* ── Body ──────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* ══ TAB: GUIDE ══════════════════════════════════════ */}
          {activeTab === 'guide' && (
            <>
              {guideQuestions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="p-4 bg-k-bg-secondary/60 rounded-2xl mb-4">
                    <BookOpen className="w-8 h-8 text-k-text-b opacity-40" />
                  </div>
                  <p className="font-bold text-k-text-h mb-1">Sin guía configurada</p>
                  <p className="text-sm text-k-text-b max-w-xs">
                    No hay guía configurada para esta vacante. Ve a la vacante y agrega preguntas de entrevista.
                  </p>
                </div>
              ) : (
                Object.entries(groupedGuide).map(([category, questions]) => (
                  <div key={category} className="space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-widest text-k-accent border-b border-k-border/40 pb-1.5">
                      {category}
                    </h4>
                    {questions.map(({ idx, question }) => (
                      <div
                        key={idx}
                        className={`border rounded-2xl p-4 transition-all ${
                          checkedQuestions[idx]
                            ? 'bg-emerald-500/5 border-emerald-500/20'
                            : 'bg-k-bg-secondary/30 border-k-border/40 hover:border-k-border'
                        }`}
                      >
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!checkedQuestions[idx]}
                            onChange={(e) =>
                              setCheckedQuestions((prev) => ({ ...prev, [idx]: e.target.checked }))
                            }
                            className="mt-0.5 w-4 h-4 rounded border-k-border text-k-accent focus:ring-k-accent cursor-pointer shrink-0"
                          />
                          <span
                            className={`text-sm font-medium leading-relaxed transition-colors ${
                              checkedQuestions[idx] ? 'text-k-text-b line-through opacity-70' : 'text-k-text-h'
                            }`}
                          >
                            {question}
                          </span>
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Notas sobre esta respuesta..."
                          value={questionNotes[idx] ?? ''}
                          onChange={(e) =>
                            setQuestionNotes((prev) => ({ ...prev, [idx]: e.target.value }))
                          }
                          className="w-full mt-3 ml-7 bg-k-bg-card/60 border border-k-border/40 rounded-xl px-3 py-2 text-xs text-k-text-h placeholder:text-k-text-b/50 resize-none focus:outline-none focus:ring-1 focus:ring-k-accent/50 transition-all"
                        />
                      </div>
                    ))}
                  </div>
                ))
              )}
            </>
          )}

          {/* ══ TAB: SCORECARD ══════════════════════════════════ */}
          {activeTab === 'scorecard' && (
            <>
              <div className="space-y-3">
                {scorecard.map((criterion, idx) => (
                  <div
                    key={idx}
                    className="bg-k-bg-secondary/30 border border-k-border/40 rounded-2xl p-4 space-y-3 hover:border-k-border transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm font-bold text-k-text-h">{criterion.name}</span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((score) => (
                          <button
                            key={score}
                            type="button"
                            onClick={() => setScore(idx, score)}
                            className="p-1 hover:scale-110 active:scale-95 transition-transform"
                          >
                            <Star
                              className={`w-6 h-6 transition-colors ${
                                score <= criterion.score
                                  ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
                                  : 'text-k-border hover:text-amber-200'
                              }`}
                            />
                          </button>
                        ))}
                        {criterion.score > 0 && (
                          <span className="ml-2 text-xs font-bold text-k-text-b bg-k-bg-card px-2 py-0.5 rounded-lg border border-k-border/50">
                            {criterion.score}/5
                          </span>
                        )}
                      </div>
                    </div>
                    <textarea
                      rows={2}
                      placeholder="Observaciones sobre este criterio..."
                      value={criterion.notes}
                      onChange={(e) => setScorecardNote(idx, e.target.value)}
                      className="w-full bg-k-bg-card/60 border border-k-border/40 rounded-xl px-3 py-2 text-xs text-k-text-h placeholder:text-k-text-b/50 resize-none focus:outline-none focus:ring-1 focus:ring-k-accent/50 transition-all"
                    />
                  </div>
                ))}
              </div>

              {/* Average & recommendation */}
              {avg > 0 && (
                <div className="bg-gradient-to-br from-k-accent/5 to-purple-500/5 border border-k-accent/20 rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-k-text-b mb-0.5">
                      Promedio general
                    </p>
                    <p className="text-3xl font-black text-k-text-h">
                      {avg.toFixed(1)}<span className="text-base text-k-text-b font-bold">/5</span>
                    </p>
                  </div>
                  <RecommendationBadge avg={avg} />
                </div>
              )}

              {/* Red Flags */}
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-k-text-b mb-3 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                  Señales de alerta
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {RED_FLAGS.map((flag) => {
                    const active = activeFlags.has(flag.id);
                    return (
                      <button
                        key={flag.id}
                        type="button"
                        onClick={() => toggleFlag(flag.id)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                          active
                            ? 'bg-red-500/15 border-red-500/40 text-red-600 shadow-sm'
                            : 'bg-k-bg-secondary/40 border-k-border/40 text-k-text-b hover:border-k-border hover:text-k-text-h'
                        }`}
                      >
                        <span>{flag.emoji}</span>
                        <span>{flag.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* ══ TAB: DOCUMENTS ══════════════════════════════════ */}
          {activeTab === 'documents' && (
            <div className="space-y-3">
              {docs.map((doc, idx) => (
                <div
                  key={doc.type}
                  className={`border rounded-2xl p-4 space-y-3 transition-colors ${
                    doc.status === 'presented'
                      ? 'bg-emerald-500/5 border-emerald-500/20'
                      : doc.status === 'missing'
                      ? 'bg-red-500/5 border-red-500/20'
                      : 'bg-k-bg-secondary/30 border-k-border/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-bold text-k-text-h">{doc.label}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setDocStatus(idx, 'presented')}
                        title="Presentó"
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          doc.status === 'presented'
                            ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                            : 'bg-k-bg-card border-k-border/50 text-k-text-b hover:border-emerald-400 hover:text-emerald-600'
                        }`}
                      >
                        ✅ Presentó
                      </button>
                      <button
                        type="button"
                        onClick={() => setDocStatus(idx, 'missing')}
                        title="No presentó"
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          doc.status === 'missing'
                            ? 'bg-red-500 text-white border-red-600 shadow-sm'
                            : 'bg-k-bg-card border-k-border/50 text-k-text-b hover:border-red-400 hover:text-red-600'
                        }`}
                      >
                        ❌ No presentó
                      </button>
                      <button
                        type="button"
                        onClick={() => setDocStatus(idx, 'pending')}
                        title="Pendiente"
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          doc.status === 'pending'
                            ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                            : 'bg-k-bg-card border-k-border/50 text-k-text-b hover:border-amber-400 hover:text-amber-600'
                        }`}
                      >
                        ⏳ Pendiente
                      </button>
                    </div>
                  </div>
                  <textarea
                    rows={1}
                    placeholder="Notas sobre este documento..."
                    value={doc.notes ?? ''}
                    onChange={(e) => setDocNote(idx, e.target.value)}
                    className="w-full bg-k-bg-card/60 border border-k-border/40 rounded-xl px-3 py-2 text-xs text-k-text-h placeholder:text-k-text-b/50 resize-none focus:outline-none focus:ring-1 focus:ring-k-accent/50 transition-all"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Footer ────────────────────────────────────────────── */}
        <div className="shrink-0 border-t border-k-border/50 bg-k-bg-card/80 backdrop-blur-md px-6 py-4 flex items-center justify-between gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-k-bg-secondary border border-k-border/50 text-k-text-h text-sm font-bold hover:bg-k-border/60 transition-all disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Guardando…' : 'Guardar evaluación'}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onReject}
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 text-white text-sm font-bold shadow-lg shadow-rose-500/25 hover:from-rose-600 hover:to-red-700 hover:scale-[1.02] transition-all disabled:opacity-60"
            >
              <ThumbsDown className="w-4 h-4" />
              Rechazar
            </button>
            <button
              onClick={onApprove}
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-bold shadow-lg shadow-emerald-500/25 hover:from-emerald-600 hover:to-teal-700 hover:scale-[1.02] transition-all disabled:opacity-60"
            >
              <ThumbsUp className="w-4 h-4" />
              Aprobar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
