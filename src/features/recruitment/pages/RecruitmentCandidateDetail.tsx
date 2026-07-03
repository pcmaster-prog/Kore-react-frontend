import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { recruitmentApi } from "../api/recruitmentApi";
import type { Application, ApplicationStatus, Interview, OnboardingDocument, RehireCheck, ScorecardCriterion } from "../types/recruitment";
import InterviewModePanel from "../components/InterviewModePanel";
import {
  ArrowLeft,
  FileText,
  Calendar,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  Award,
  PlayCircle,
  Star,
  Plus,
  Trash2,
  Video,
  MapPinned,
  Clock,
  Send,
  FileCheck,
  Check,
  X,
} from "lucide-react";

const statusLabels: Record<string, string> = {
  new: "Nuevo",
  screening: "En evaluación",
  "interview-requested": "Entrevista solicitada",
  interviewing: "En entrevista",
  "offer-sent": "Oferta enviada",
  hired: "Contratado",
  rejected: "Rechazado",
};

const methodLabels: Record<string, string> = {
  "in-person": "Presencial",
  video: "Videollamada",
  phone: "Teléfono",
};

function calculateRecommendation(scorecard: ScorecardCriterion[]): string {
  if (!scorecard.length) return "";
  const avg = scorecard.reduce((sum, c) => sum + c.score, 0) / scorecard.length;
  if (avg >= 4.5) return "Excelente elección";
  if (avg >= 3.5) return "Buena elección";
  if (avg >= 2.5) return "Regular";
  return "No recomendado";
}

export default function RecruitmentCandidateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Inline forms
  const [showInterviewForm, setShowInterviewForm] = useState(false);
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewNotes, setInterviewNotes] = useState("");
  const [interviewMethod, setInterviewMethod] = useState<"in-person" | "video" | "phone" | "">("");
  const [interviewLocation, setInterviewLocation] = useState("");
  const [interviewMeetingUrl, setInterviewMeetingUrl] = useState("");
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(false);

  const [showResultForm, setShowResultForm] = useState(false);
  const [resultValue, setResultValue] = useState<"passed" | "failed">("passed");
  const [resultNotes, setResultNotes] = useState("");

  const [showHireForm, setShowHireForm] = useState(false);
  const [hireSalary, setHireSalary] = useState("");
  const [hireMonths, setHireMonths] = useState("1");

  // Interviews & scorecards
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [editingInterviewId, setEditingInterviewId] = useState<string | null>(null);
  const [scorecardDraft, setScorecardDraft] = useState<ScorecardCriterion[]>([]);
  const [scorecardNotesDraft, setScorecardNotesDraft] = useState("");
  const [scorecardResultDraft, setScorecardResultDraft] = useState<"pending" | "passed" | "failed">("pending");
  const [interviewModeId, setInterviewModeId] = useState<string | null>(null);

  // Rehire
  const [rehireCheck, setRehireCheck] = useState<RehireCheck | null>(null);
  const [showRehireForm, setShowRehireForm] = useState(false);
  const [rehireSalary, setRehireSalary] = useState("");

  // Offer
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerSalary, setOfferSalary] = useState("");
  const [offerMonths, setOfferMonths] = useState("1");
  const [offerPositionId, setOfferPositionId] = useState("");
  const [offerNotes, setOfferNotes] = useState("");
  const [positions, setPositions] = useState<{ id: string; name: string }[]>([]);

  // Onboarding documents
  const [onboardingDocs, setOnboardingDocs] = useState<OnboardingDocument[]>([]);

  const fetchApp = async () => {
    try {
      if (id) {
        const data = await recruitmentApi.getApplication(id);
        setApp(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInterviews = async () => {
    if (!id) return;
    try {
      const data = await recruitmentApi.getInterviews(id);
      setInterviews(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchRehireCheck = async () => {
    if (!id) return;
    try {
      const data = await recruitmentApi.checkRehire(id);
      setRehireCheck(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchOnboardingDocuments = async () => {
    if (!id) return;
    try {
      const data = await recruitmentApi.getOnboardingDocuments(id);
      setOnboardingDocs(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchPositions = async () => {
    try {
      const res = await import("@/lib/http").then(({ default: http }) =>
        http.get<{ data: { id: string; name: string }[] }>("/positions")
      );
      setPositions((res.data.data ?? []).map((p) => ({ id: p.id, name: p.name })));
    } catch {
      // positions are optional – ignore if endpoint fails
    }
  };

  useEffect(() => {
    fetchApp();
    fetchInterviews();
    fetchRehireCheck();
    fetchOnboardingDocuments();
    fetchPositions();
  }, [id]);

  const runAction = async (action: () => Promise<unknown>, after?: () => void) => {
    setBusy(true);
    try {
      await action();
      await fetchApp();
      await fetchInterviews();
      await fetchOnboardingDocuments();
      after?.();
    } catch (error) {
      console.error(error);
      alert("Error al ejecutar la acción. Revisa la consola.");
    } finally {
      setBusy(false);
    }
  };

  const handleAdvance = (nextStatus: ApplicationStatus, notes?: string) => {
    if (!id) return;
    runAction(() => recruitmentApi.changeStatus(id, nextStatus, notes));
  };

  const handleResetScreening = () => {
    if (!id) return;
    if (!window.confirm('¿Reiniciar la evaluación? El aspirante podrá presentar la autoevaluación nuevamente desde el portal.')) return;
    runAction(() => recruitmentApi.resetScreening(id));
  };

  const handleScheduleInterview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !interviewDate || !interviewMethod) return;
    runAction(async () => {
      await recruitmentApi.createInterview(id, {
        scheduled_at: new Date(interviewDate).toISOString(),
        method: interviewMethod as 'in-person' | 'video' | 'phone',
        notes: interviewNotes || undefined,
        location: interviewLocation || undefined,
        meeting_url: interviewMeetingUrl || undefined,
      });
      setShowInterviewForm(false);
      setInterviewDate("");
      setInterviewNotes("");
      setInterviewMethod("");
      setInterviewLocation("");
      setInterviewMeetingUrl("");
      setNotifyWhatsapp(false);
    });
  };

  const handleRecordResult = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    runAction(async () => {
      await recruitmentApi.recordInterviewResult(id, resultValue, resultNotes);
      if (resultValue === "passed") {
        setShowResultForm(false);
        setShowHireForm(true);
      } else {
        setShowResultForm(false);
      }
      setResultNotes("");
      setResultValue("passed");
    });
  };

  const handleHire = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !hireSalary) return;
    runAction(async () => {
      await recruitmentApi.hireTrial(
        id,
        Number(hireMonths) || 1,
        Number(hireSalary),
        []
      );
      setShowHireForm(false);
      setHireSalary("");
      setHireMonths("1");
    });
  };

  const handleReject = () => {
    if (!id) return;
    const reason = prompt("Motivo de rechazo:");
    if (!reason) return;
    runAction(() => recruitmentApi.reject(id, reason, true));
  };

  const handleDeleteInterview = (interviewId: string) => {
    if (!confirm("¿Eliminar esta entrevista?")) return;
    runAction(() => recruitmentApi.deleteInterview(interviewId));
  };

  const startEditingScorecard = (interview: Interview) => {
    setEditingInterviewId(interview.id);
    setScorecardDraft(interview.scorecard?.length ? [...interview.scorecard] : [{ name: "", score: 3 }]);
    setScorecardNotesDraft(interview.notes || "");
    setScorecardResultDraft(interview.result || "pending");
  };

  const cancelEditingScorecard = () => {
    setEditingInterviewId(null);
    setScorecardDraft([]);
    setScorecardNotesDraft("");
    setScorecardResultDraft("pending");
  };

  const updateCriterion = (index: number, field: keyof ScorecardCriterion, value: string | number) => {
    setScorecardDraft((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addCriterion = () => {
    setScorecardDraft((prev) => [...prev, { name: "", score: 3 }]);
  };

  const removeCriterion = (index: number) => {
    setScorecardDraft((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveScorecard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInterviewId) return;
    const cleanScorecard = scorecardDraft
      .map((c) => ({ ...c, score: Number(c.score) || 0 }))
      .filter((c) => c.name.trim() !== "");
    await runAction(async () => {
      await recruitmentApi.updateInterview(editingInterviewId, {
        scorecard: cleanScorecard,
        notes: scorecardNotesDraft,
        result: scorecardResultDraft,
      });
      cancelEditingScorecard();
    });
  };

  const handleRehire = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !rehireSalary) return;
    runAction(async () => {
      await recruitmentApi.rehire(id, { salary: Number(rehireSalary) });
      setShowRehireForm(false);
      setRehireSalary("");
    });
  };

  const handleSendOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !offerSalary) return;
    runAction(async () => {
      await recruitmentApi.sendOffer(id, {
        salary: Number(offerSalary),
        trial_months: Number(offerMonths) || 1,
        position_id: offerPositionId || undefined,
        notes: offerNotes || undefined,
      });
      setShowOfferForm(false);
      setOfferSalary("");
      setOfferMonths("1");
      setOfferPositionId("");
      setOfferNotes("");
    });
  };

  const handleResendOffer = () => {
    if (!id) return;
    runAction(() => recruitmentApi.resendOffer(id));
  };

  const handleVerifyDocument = (type: string) => {
    if (!id) return;
    runAction(async () => {
      await recruitmentApi.verifyOnboardingDocument(id, type);
      await fetchOnboardingDocuments();
    });
  };

  const handleUnverifyDocument = (type: string) => {
    if (!id) return;
    runAction(async () => {
      await recruitmentApi.unverifyOnboardingDocument(id, type);
      await fetchOnboardingDocuments();
    });
  };

  const recommendationPreview = useMemo(() => calculateRecommendation(scorecardDraft), [scorecardDraft]);

  if (loading) return <p className="text-k-text-b">Cargando detalles...</p>;
  if (!app) return <p className="text-red-500">No encontrado</p>;

  const status = app.status;

  return (
    <>
    <div className="space-y-8 max-w-7xl mx-auto pb-12 px-4 md:px-8">
      <button
        onClick={() => navigate(-1)}
        className="group flex items-center space-x-2 text-k-text-b hover:text-k-text-h transition-colors mb-2"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="font-bold text-sm">Volver al Kanban</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* SIDEBAR (Left Column) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Header Card */}
          <div className="bg-k-bg-card/70 backdrop-blur-xl border border-k-border/50 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-3xl rounded-full -mr-16 -mt-16 transition-transform duration-700 group-hover:scale-150"></div>
            
            <div className="flex flex-col items-center text-center space-y-4 relative z-10">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-[3px] shadow-lg">
                <div className="w-full h-full bg-k-bg-card rounded-full flex items-center justify-center text-4xl font-black text-transparent bg-clip-text bg-gradient-to-tr from-indigo-500 to-pink-500">
                  {app.user?.name?.charAt(0) || "?"}
                </div>
              </div>
              
              <div>
                <h1 className="text-2xl font-black text-k-text-h tracking-tight">{app.user?.name}</h1>
                <p className="text-k-accent font-bold mt-1 text-sm">{app.jobOpening?.title}</p>
                <p className="text-k-text-b text-xs mt-1">{app.user?.email}</p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                {rehireCheck?.is_rehire && (
                  <span className="bg-amber-500/10 text-amber-600 border border-amber-500/20 px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider">
                    Ex-empleado
                  </span>
                )}
                <span className="bg-k-bg-secondary/80 backdrop-blur border border-k-border/50 text-k-text-h px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm">
                  {statusLabels[status] || status}
                </span>
              </div>
            </div>
          </div>

          {/* Actions panel */}
          <div className="bg-k-bg-card/70 backdrop-blur-xl border border-k-border/50 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <h3 className="font-black text-k-text-h mb-4">Acciones</h3>
            {busy ? (
              <div className="flex items-center justify-center p-4">
                <div className="w-6 h-6 border-2 border-k-accent border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {status === "new" && (
                  <button
                    onClick={() => handleAdvance("screening")}
                    className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-bold shadow-lg shadow-blue-500/25 hover:scale-[1.02] transition-all"
                  >
                    Enviar a evaluación
                  </button>
                )}

                {(status === "screening" || status === "interview-requested") && (
                  <button
                    onClick={() => setShowInterviewForm((s) => !s)}
                    className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold shadow-lg shadow-amber-500/25 hover:scale-[1.02] transition-all"
                  >
                    {showInterviewForm ? "Cancelar" : "Agendar entrevista"}
                  </button>
                )}

                {status === "interviewing" && (
                  <button
                    onClick={() => setShowResultForm((s) => !s)}
                    className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white text-sm font-bold shadow-lg shadow-violet-500/25 hover:scale-[1.02] transition-all"
                  >
                    {showResultForm ? "Cancelar" : "Registrar resultado"}
                  </button>
                )}

                {status === "interviewing" && (
                  <button
                    onClick={() => setShowHireForm((s) => !s)}
                    className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold shadow-lg shadow-emerald-500/25 hover:scale-[1.02] transition-all"
                  >
                    {showHireForm ? "Cancelar" : "Contratar a prueba"}
                  </button>
                )}

                {(status === "interviewing" || status === "offer-sent") && (
                  <button
                    onClick={() => setShowOfferForm((s) => !s)}
                    className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 text-white text-sm font-bold shadow-lg shadow-indigo-500/25 hover:scale-[1.02] transition-all"
                  >
                    {showOfferForm ? "Cancelar" : app.offer?.status === "sent" ? "Editar oferta" : "Enviar oferta"}
                  </button>
                )}

                {status === "offer-sent" && app.offer?.status === "sent" && (
                  <button
                    onClick={handleResendOffer}
                    className="w-full px-4 py-2.5 rounded-xl bg-k-bg-secondary text-k-text-h text-sm font-bold border border-k-border/50 hover:bg-k-border/50 hover:scale-[1.02] transition-all"
                  >
                    Reenviar oferta
                  </button>
                )}

                {status !== "hired" && status !== "rejected" && rehireCheck?.is_rehire && (
                  <button
                    onClick={() => setShowRehireForm((s) => !s)}
                    className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 text-white text-sm font-bold shadow-lg shadow-sky-500/25 hover:scale-[1.02] transition-all"
                  >
                    {showRehireForm ? "Cancelar" : "Recontratar rápido"}
                  </button>
                )}

                {status === "rejected" && app?.screening_test_results != null && (
                  <button
                    onClick={handleResetScreening}
                    disabled={busy}
                    className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-sm font-bold shadow-lg shadow-amber-500/25 hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    🔄 Reintentar evaluación
                  </button>
                )}

                {status !== "hired" && status !== "rejected" && (
                  <button
                    onClick={handleReject}
                    className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-500 text-white text-sm font-bold shadow-lg shadow-rose-500/25 hover:scale-[1.02] transition-all"
                  >
                    Rechazar
                  </button>
                )}
              </div>
            )}

            {showInterviewForm && (
              <form
                onSubmit={handleScheduleInterview}
                className="mt-4 space-y-3 border-t border-k-border/50 pt-4"
              >
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-k-text-b mb-1">
                      Fecha y hora
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={interviewDate}
                      onChange={(e) => setInterviewDate(e.target.value)}
                      className="w-full bg-k-bg-secondary/50 border border-k-border/50 rounded-xl px-3 py-2 text-sm text-k-text-h focus:ring-2 focus:ring-k-accent/50 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-k-text-b mb-1">
                      Método
                    </label>
                    <select
                      value={interviewMethod}
                      onChange={(e) => setInterviewMethod(e.target.value as Interview["method"] | "")}
                      className="w-full bg-k-bg-secondary/50 border border-k-border/50 rounded-xl px-3 py-2 text-sm text-k-text-h focus:ring-2 focus:ring-k-accent/50 outline-none transition-all"
                    >
                      <option value="">Seleccionar…</option>
                      <option value="in-person">Presencial</option>
                      <option value="video">Videollamada</option>
                      <option value="phone">Teléfono</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-k-text-b mb-1">
                      Ubicación / Lugar
                    </label>
                    <input
                      type="text"
                      value={interviewLocation}
                      onChange={(e) => setInterviewLocation(e.target.value)}
                      placeholder="Ej. Oficina central, Sala 3"
                      className="w-full bg-k-bg-secondary/50 border border-k-border/50 rounded-xl px-3 py-2 text-sm text-k-text-h focus:ring-2 focus:ring-k-accent/50 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-k-text-b mb-1">
                      Enlace de meeting
                    </label>
                    <input
                      type="url"
                      value={interviewMeetingUrl}
                      onChange={(e) => setInterviewMeetingUrl(e.target.value)}
                      placeholder="https://…"
                      className="w-full bg-k-bg-secondary/50 border border-k-border/50 rounded-xl px-3 py-2 text-sm text-k-text-h focus:ring-2 focus:ring-k-accent/50 outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-k-text-b mb-1">
                    Notas
                  </label>
                  <textarea
                    value={interviewNotes}
                    onChange={(e) => setInterviewNotes(e.target.value)}
                    className="w-full bg-k-bg-secondary/50 border border-k-border/50 rounded-xl px-3 py-2 text-sm text-k-text-h focus:ring-2 focus:ring-k-accent/50 outline-none transition-all"
                    rows={2}
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-k-text-b cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyWhatsapp}
                    onChange={(e) => setNotifyWhatsapp(e.target.checked)}
                    className="rounded border-k-border/50 text-k-accent focus:ring-k-accent"
                  />
                  Notificar por WhatsApp
                </label>
                <button
                  type="submit"
                  className="w-full px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20"
                >
                  Guardar entrevista
                </button>
              </form>
            )}

            {showResultForm && (
              <form
                onSubmit={handleRecordResult}
                className="mt-4 space-y-3 border-t border-k-border/50 pt-4"
              >
                <div>
                  <label className="block text-xs font-bold text-k-text-b mb-1">
                    Resultado
                  </label>
                  <select
                    value={resultValue}
                    onChange={(e) => setResultValue(e.target.value as "passed" | "failed")}
                    className="w-full bg-k-bg-secondary/50 border border-k-border/50 rounded-xl px-3 py-2 text-sm text-k-text-h focus:ring-2 focus:ring-violet-500/50 outline-none transition-all"
                  >
                    <option value="passed">Aprobado</option>
                    <option value="failed">Rechazado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-k-text-b mb-1">
                    Notas del resultado
                  </label>
                  <textarea
                    value={resultNotes}
                    onChange={(e) => setResultNotes(e.target.value)}
                    className="w-full bg-k-bg-secondary/50 border border-k-border/50 rounded-xl px-3 py-2 text-sm text-k-text-h focus:ring-2 focus:ring-violet-500/50 outline-none transition-all"
                    rows={2}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full px-4 py-2 rounded-xl bg-violet-500 text-white text-sm font-bold hover:bg-violet-600 transition-colors shadow-lg shadow-violet-500/20"
                >
                  Guardar resultado
                </button>
              </form>
            )}

            {showHireForm && (
              <form
                onSubmit={handleHire}
                className="mt-4 space-y-3 border-t border-k-border/50 pt-4"
              >
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-k-text-b mb-1">
                      Salario diario
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={hireSalary}
                      onChange={(e) => setHireSalary(e.target.value)}
                      className="w-full bg-k-bg-secondary/50 border border-k-border/50 rounded-xl px-3 py-2 text-sm text-k-text-h focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-k-text-b mb-1">
                      Meses de prueba
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={hireMonths}
                      onChange={(e) => setHireMonths(e.target.value)}
                      className="w-full bg-k-bg-secondary/50 border border-k-border/50 rounded-xl px-3 py-2 text-sm text-k-text-h focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
                >
                  Confirmar contratación
                </button>
              </form>
            )}

            {showOfferForm && (
              <form
                onSubmit={handleSendOffer}
                className="mt-4 space-y-3 border-t border-k-border/50 pt-4"
              >
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-k-text-b mb-1">
                      Salario diario
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={offerSalary}
                      onChange={(e) => setOfferSalary(e.target.value)}
                      className="w-full bg-k-bg-secondary/50 border border-k-border/50 rounded-xl px-3 py-2 text-sm text-k-text-h focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-k-text-b mb-1">
                      Meses de prueba
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="3"
                      required
                      value={offerMonths}
                      onChange={(e) => setOfferMonths(e.target.value)}
                      className="w-full bg-k-bg-secondary/50 border border-k-border/50 rounded-xl px-3 py-2 text-sm text-k-text-h focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-k-text-b mb-1">
                      Puesto
                    </label>
                    <select
                      value={offerPositionId}
                      onChange={(e) => setOfferPositionId(e.target.value)}
                      className="w-full bg-k-bg-secondary/50 border border-k-border/50 rounded-xl px-3 py-2 text-sm text-k-text-h focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                    >
                      <option value="">Sin puesto asignado</option>
                      {positions.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-k-text-b mb-1">
                    Notas para el candidato
                  </label>
                  <textarea
                    value={offerNotes}
                    onChange={(e) => setOfferNotes(e.target.value)}
                    className="w-full bg-k-bg-secondary/50 border border-k-border/50 rounded-xl px-3 py-2 text-sm text-k-text-h focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                    rows={2}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full px-4 py-2 rounded-xl bg-indigo-500 text-white text-sm font-bold hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-500/20"
                >
                  Enviar oferta
                </button>
              </form>
            )}

            {showRehireForm && (
              <form
                onSubmit={handleRehire}
                className="mt-4 space-y-3 border-t border-k-border/50 pt-4"
              >
                <div className="bg-sky-500/10 text-sky-700 border border-sky-500/20 rounded-xl p-3 text-sm">
                  <p className="font-bold">Recontratación rápida</p>
                  <p>
                    Este candidato coincide con el ex-empleado{" "}
                    <span className="font-bold">{rehireCheck?.previous_full_name || "—"}</span>.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-k-text-b mb-1">
                    Salario diario
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={rehireSalary}
                    onChange={(e) => setRehireSalary(e.target.value)}
                    className="w-full bg-k-bg-secondary/50 border border-k-border/50 rounded-xl px-3 py-2 text-sm text-k-text-h focus:ring-2 focus:ring-sky-500/50 outline-none transition-all"
                    placeholder="0.00"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full px-4 py-2 rounded-xl bg-sky-500 text-white text-sm font-bold hover:bg-sky-600 transition-colors shadow-lg shadow-sky-500/20"
                >
                  Confirmar recontratación
                </button>
              </form>
            )}
          </div>

          {/* Contact info */}
          <div className="bg-k-bg-card/60 backdrop-blur-xl border border-k-border/50 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-k-accent/20 to-transparent text-k-accent rounded-2xl shadow-inner">
                <Phone className="w-5 h-5" />
              </div>
              <h3 className="font-black text-k-text-h text-lg">Contacto</h3>
            </div>

            {app.contact_info ? (
              <div className="space-y-4 text-sm">
                {app.contact_info.phone && (
                  <div className="flex items-center gap-3 text-k-text-b">
                    <div className="p-1.5 rounded-lg bg-k-bg-secondary/50"><Phone className="w-4 h-4 text-k-text-h" /></div>
                    <span className="font-medium">{app.contact_info.phone}</span>
                  </div>
                )}
                {app.user?.email && (
                  <div className="flex items-center gap-3 text-k-text-b">
                    <div className="p-1.5 rounded-lg bg-k-bg-secondary/50"><Mail className="w-4 h-4 text-k-text-h" /></div>
                    <span className="font-medium truncate">{app.user.email}</span>
                  </div>
                )}
                {app.contact_info.address && (
                  <div className="flex items-start gap-3 text-k-text-b">
                    <div className="p-1.5 rounded-lg bg-k-bg-secondary/50 mt-0.5"><MapPin className="w-4 h-4 text-k-text-h" /></div>
                    <span className="font-medium leading-relaxed">{app.contact_info.address}</span>
                  </div>
                )}
                
                <div className="pt-4 mt-2 border-t border-k-border/30 grid grid-cols-2 gap-3">
                  {app.contact_info.rfc && (
                    <div className="bg-k-bg-secondary/40 p-2 rounded-xl">
                      <span className="block text-[10px] uppercase font-bold text-k-text-b mb-0.5">RFC</span>
                      <span className="font-bold text-k-text-h text-xs">{app.contact_info.rfc}</span>
                    </div>
                  )}
                  {app.contact_info.curp && (
                    <div className="bg-k-bg-secondary/40 p-2 rounded-xl">
                      <span className="block text-[10px] uppercase font-bold text-k-text-b mb-0.5">CURP</span>
                      <span className="font-bold text-k-text-h text-xs">{app.contact_info.curp}</span>
                    </div>
                  )}
                  {app.contact_info.nss && (
                    <div className="bg-k-bg-secondary/40 p-2 rounded-xl col-span-2">
                      <span className="block text-[10px] uppercase font-bold text-k-text-b mb-0.5">NSS</span>
                      <span className="font-bold text-k-text-h text-xs">{app.contact_info.nss}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-k-text-b text-sm italic">No hay información registrada.</p>
            )}
          </div>

          {/* Documents */}
          <div className="bg-k-bg-card/60 backdrop-blur-xl border border-k-border/50 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-purple-500/20 to-transparent text-purple-500 rounded-2xl shadow-inner">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-black text-k-text-h text-lg">Documentos</h3>
            </div>

            {app.documents?.length ? (
              <div className="space-y-3">
                {app.documents.map((doc) => (
                  <a
                    key={doc.id}
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center justify-between p-3 border border-k-border/50 rounded-xl hover:bg-k-bg-secondary/80 transition-all duration-300 hover:scale-[1.02]"
                  >
                    <span className="font-bold text-sm text-k-text-h">{doc.document_type}</span>
                    <span className="text-xs text-k-accent font-bold group-hover:underline">Abrir</span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-k-text-b text-sm italic">No hay documentos subidos.</p>
            )}
          </div>

        </div>

        {/* MAIN AREA (Right Column) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Screening results */}
          <div className="bg-k-bg-card/60 backdrop-blur-xl border border-k-border/50 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-transparent text-emerald-500 rounded-2xl shadow-inner">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="font-black text-k-text-h text-lg">Evaluación / Screening</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {app.screening_test_results ? (
                <div className="bg-k-bg-secondary/40 p-4 rounded-2xl border border-k-border/30">
                  <p className="text-xs font-bold text-k-text-b uppercase tracking-wider mb-1">Puntaje Obtenido</p>
                  <p className="text-3xl font-black text-emerald-500">{app.screening_test_results.score ?? "N/A"}</p>
                  {app.screening_test_results.submitted_at && (
                    <p className="text-xs text-k-text-b mt-2">
                      Enviado: {new Date(app.screening_test_results.submitted_at).toLocaleString()}
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-k-bg-secondary/40 p-4 rounded-2xl border border-k-border/30 flex items-center justify-center">
                  <p className="text-k-text-b text-sm italic text-center">Aún no se ha enviado<br/>la evaluación.</p>
                </div>
              )}

              <div className="bg-k-bg-secondary/40 p-4 rounded-2xl border border-k-border/30">
                <div className="flex items-center gap-3 mb-2">
                  <PlayCircle className={`w-6 h-6 ${app.has_induction_video_watched ? "text-emerald-500" : "text-k-text-b"}`} />
                  <div>
                    <p className="text-xs font-bold text-k-text-b uppercase tracking-wider">Video Inducción</p>
                    <p className={`text-lg font-black ${app.has_induction_video_watched ? "text-emerald-500" : "text-k-text-h"}`}>
                      {app.has_induction_video_watched ? "Visto" : "Pendiente"}
                    </p>
                  </div>
                </div>
                {app.induction_video_watched_at && (
                  <p className="text-xs text-k-text-b mt-2 pl-9">
                    {new Date(app.induction_video_watched_at).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-k-border/30">
              <h4 className="font-bold text-k-text-h text-sm">Educación y Experiencia</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {app.education ? (
                  <div className="bg-k-bg-secondary/30 p-4 rounded-2xl border border-k-border/30">
                    <div className="flex items-center gap-2 mb-2">
                      <GraduationCap className="w-4 h-4 text-blue-500" />
                      <h5 className="font-bold text-k-text-h text-sm">Educación</h5>
                    </div>
                    <pre className="text-xs text-k-text-b overflow-auto max-h-32 whitespace-pre-wrap">{JSON.stringify(app.education, null, 2)}</pre>
                  </div>
                ) : (
                  <div className="bg-k-bg-secondary/30 p-4 rounded-2xl border border-k-border/30 text-k-text-b text-sm italic">Sin datos de educación.</div>
                )}
                {app.experience ? (
                  <div className="bg-k-bg-secondary/30 p-4 rounded-2xl border border-k-border/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="w-4 h-4 text-amber-500" />
                      <h5 className="font-bold text-k-text-h text-sm">Experiencia</h5>
                    </div>
                    <pre className="text-xs text-k-text-b overflow-auto max-h-32 whitespace-pre-wrap">{JSON.stringify(app.experience, null, 2)}</pre>
                  </div>
                ) : (
                  <div className="bg-k-bg-secondary/30 p-4 rounded-2xl border border-k-border/30 text-k-text-b text-sm italic">Sin datos de experiencia.</div>
                )}
              </div>
            </div>
          </div>

          {/* Offer & Onboarding */}
          {(status === "offer-sent" || status === "hired") && (
            <div className="bg-k-bg-card/60 backdrop-blur-xl border border-k-border/50 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-transparent text-indigo-500 rounded-2xl shadow-inner">
                  <Send className="w-5 h-5" />
                </div>
                <h3 className="font-black text-k-text-h text-lg">Oferta y Onboarding</h3>
              </div>

              {app.offer && (
                <div className="bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border border-indigo-500/20 rounded-2xl p-5 mb-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full -mr-10 -mt-10 pointer-events-none"></div>
                  <div className="flex flex-wrap items-center gap-3 mb-4 relative z-10">
                    <span className="font-black text-k-text-h">Detalles de Oferta</span>
                    <span
                      className={`px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm ${
                        app.offer.status === "accepted"
                          ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                          : app.offer.status === "rejected"
                            ? "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                            : "bg-indigo-500/10 text-indigo-600 border border-indigo-500/20"
                      }`}
                    >
                      {app.offer.status === "sent" && "Enviada"}
                      {app.offer.status === "accepted" && "Aceptada"}
                      {app.offer.status === "rejected" && "Rechazada"}
                      {app.offer.status === "draft" && "Borrador"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm relative z-10">
                    <div className="bg-white/5 dark:bg-black/20 p-3 rounded-xl border border-k-border/30">
                      <p className="text-[10px] font-bold text-k-text-b uppercase tracking-wider mb-1">Salario diario</p>
                      <p className="font-black text-k-text-h">${app.offer.salary}</p>
                    </div>
                    <div className="bg-white/5 dark:bg-black/20 p-3 rounded-xl border border-k-border/30">
                      <p className="text-[10px] font-bold text-k-text-b uppercase tracking-wider mb-1">Periodo prueba</p>
                      <p className="font-black text-k-text-h">{app.offer.trial_months} mes{app.offer.trial_months !== 1 ? "es" : ""}</p>
                    </div>
                    {app.offer.position && (
                      <div className="bg-white/5 dark:bg-black/20 p-3 rounded-xl border border-k-border/30 col-span-2 md:col-span-1">
                        <p className="text-[10px] font-bold text-k-text-b uppercase tracking-wider mb-1">Puesto</p>
                        <p className="font-black text-k-text-h">{app.offer.position.name}</p>
                      </div>
                    )}
                  </div>
                  {app.offer.notes && (
                    <div className="mt-4 bg-white/5 dark:bg-black/20 p-3 rounded-xl border border-k-border/30 relative z-10">
                      <p className="text-[10px] font-bold text-k-text-b uppercase tracking-wider mb-1">Notas</p>
                      <p className="text-sm text-k-text-h">{app.offer.notes}</p>
                    </div>
                  )}
                  <div className="mt-4 flex flex-wrap gap-4 text-xs font-medium text-k-text-b relative z-10">
                    {app.offer.sent_at && <span>Enviada: {new Date(app.offer.sent_at).toLocaleString()}</span>}
                    {app.offer.accepted_at && <span className="text-emerald-500 font-bold">Aceptada: {new Date(app.offer.accepted_at).toLocaleString()}</span>}
                  </div>
                </div>
              )}

              {status === "hired" && (
                <div>
                  <h4 className="font-black text-k-text-h text-sm mb-4 flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-500" />
                    Checklist de Documentos de Alta
                  </h4>
                  {onboardingDocs.length === 0 ? (
                    <div className="flex items-center justify-center p-6 bg-k-bg-secondary/30 rounded-2xl border border-k-border/30">
                      <div className="w-5 h-5 border-2 border-k-accent border-t-transparent rounded-full animate-spin mr-3"></div>
                      <p className="text-k-text-b text-sm font-medium">Cargando documentos…</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {onboardingDocs.map((doc) => (
                        <div
                          key={doc.type}
                          className={`bg-k-bg-secondary/40 border rounded-xl p-4 flex items-start justify-between gap-3 transition-colors ${doc.verified ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-k-border/50 hover:border-k-border'}`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {doc.verified ? (
                                <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-500"><Check className="w-3 h-3" /></div>
                              ) : doc.uploaded ? (
                                <div className="p-1 rounded-full bg-amber-500/20 text-amber-500"><FileCheck className="w-3 h-3" /></div>
                              ) : (
                                <div className="p-1 rounded-full bg-k-bg-card border border-k-border text-k-text-b"><X className="w-3 h-3" /></div>
                              )}
                              <span className="text-sm font-bold text-k-text-h truncate">{doc.label}</span>
                            </div>
                            <p className={`text-xs mt-1 ${doc.verified ? 'text-emerald-600 font-medium' : 'text-k-text-b'}`}>
                              {doc.verified
                                ? "Verificado"
                                : doc.uploaded
                                  ? "Pendiente de verificación"
                                  : "No subido"}
                            </p>
                            {doc.url && (
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-k-accent font-bold hover:underline mt-2 inline-flex items-center gap-1"
                              >
                                Ver documento
                              </a>
                            )}
                          </div>
                          {doc.uploaded && (
                            <div className="flex items-center shrink-0">
                              {!doc.verified ? (
                                <button
                                  onClick={() => handleVerifyDocument(doc.type)}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs font-bold hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                                >
                                  Verificar
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUnverifyDocument(doc.type)}
                                  className="px-3 py-1.5 rounded-xl bg-k-bg-card border border-k-border text-k-text-b text-xs font-bold hover:bg-rose-500/10 hover:text-rose-600 hover:border-rose-500/20 transition-all"
                                >
                                  Deshacer
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Interviews */}
          <div className="bg-k-bg-card/60 backdrop-blur-xl border border-k-border/50 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-amber-500/20 to-transparent text-amber-500 rounded-2xl shadow-inner">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="font-black text-k-text-h text-lg">Entrevistas</h3>
              </div>
              <span className="bg-k-bg-secondary px-3 py-1 rounded-xl text-xs text-k-text-h font-bold shadow-sm border border-k-border/50">
                {interviews.length} registrada{interviews.length !== 1 ? "s" : ""}
              </span>
            </div>

            {interviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 bg-k-bg-secondary/30 rounded-3xl border border-k-border/30 border-dashed">
                <Calendar className="w-8 h-8 text-k-text-b mb-3 opacity-50" />
                <p className="text-k-text-b text-sm font-medium">No hay entrevistas programadas.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {interviews.map((interview) => {
                  const isEditing = editingInterviewId === interview.id;
                  return (
                    <div
                      key={interview.id}
                      className="border border-k-border/50 rounded-2xl p-5 bg-white/5 dark:bg-black/10 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
                    >
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 relative z-10">
                        <div className="space-y-3 text-sm flex-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="flex items-center gap-2 text-k-text-h font-black text-base">
                              <div className="p-1.5 bg-k-accent/10 rounded-lg text-k-accent"><Clock className="w-4 h-4" /></div>
                              {new Date(interview.scheduled_at).toLocaleString()}
                            </span>
                            {interview.method && (
                              <span className="px-2.5 py-1 rounded-lg bg-k-bg-card border border-k-border/50 text-k-text-h text-xs font-bold uppercase tracking-wider">
                                {methodLabels[interview.method] || interview.method}
                              </span>
                            )}
                            {interview.result && interview.result !== "pending" && (
                              <span
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${
                                  interview.result === "passed"
                                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                    : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                                }`}
                              >
                                {interview.result === "passed" ? "Aprobado" : "No aprobado"}
                              </span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-k-text-b">
                            {interview.location && (
                              <p className="flex items-center gap-2 bg-k-bg-card/50 p-2 rounded-xl">
                                <MapPinned className="w-4 h-4 text-k-accent shrink-0" />
                                <span className="truncate">{interview.location}</span>
                              </p>
                            )}
                            {interview.meeting_url && (
                              <p className="flex items-center gap-2 bg-k-bg-card/50 p-2 rounded-xl">
                                <Video className="w-4 h-4 text-k-accent shrink-0" />
                                <a
                                  href={interview.meeting_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-k-accent font-bold hover:underline truncate"
                                >
                                  {interview.meeting_url}
                                </a>
                              </p>
                            )}
                          </div>

                          {interview.notes && (
                            <div className="bg-k-bg-card/30 p-3 rounded-xl border border-k-border/30 mt-2">
                              <span className="block text-[10px] uppercase font-bold text-k-text-b mb-1">Notas</span>
                              <p className="text-k-text-h">{interview.notes}</p>
                            </div>
                          )}
                          {interview.interviewer && (
                            <p className="text-k-text-b text-xs font-medium flex items-center gap-1.5 mt-2">
                              <span className="w-5 h-5 rounded-full bg-k-accent/20 flex items-center justify-center text-k-accent text-[10px] font-black">{interview.interviewer.name.charAt(0)}</span>
                              Entrevistador: {interview.interviewer.name}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 shrink-0 self-start">
                          {interview.result === 'pending' && (
                            <button
                              onClick={() => setInterviewModeId(interview.id)}
                              className="px-3 py-2 rounded-xl bg-gradient-to-r from-k-accent/10 to-purple-500/10 text-k-accent border border-k-accent/20 text-xs font-bold hover:from-k-accent hover:to-purple-600 hover:text-white hover:border-transparent transition-all shadow-sm whitespace-nowrap"
                            >
                              🎤 Modo Entrevista
                            </button>
                          )}
                          <button
                            onClick={() => startEditingScorecard(interview)}
                            className="px-3 py-2 rounded-xl bg-violet-500/10 text-violet-600 border border-violet-500/20 text-xs font-bold hover:bg-violet-500 hover:text-white transition-all shadow-sm"
                          >
                            {interview.scorecard?.length ? "Editar Scorecard" : "+ Scorecard"}
                          </button>
                          <button
                            onClick={() => handleDeleteInterview(interview.id)}
                            className="p-2 rounded-xl bg-k-bg-card border border-k-border text-rose-500 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all shadow-sm"
                            title="Eliminar entrevista"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {interview.scorecard && interview.scorecard.length > 0 && !isEditing && (
                        <div className="mt-5 pt-5 border-t border-k-border/30 relative z-10">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-k-text-b mb-3">Resultados del Scorecard</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {interview.scorecard.map((criterion, idx) => (
                              <div
                                key={idx}
                                className="bg-k-bg-card border border-k-border/50 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow"
                              >
                                <p className="text-xs font-bold text-k-text-h mb-1.5 truncate" title={criterion.name}>
                                  {criterion.name}
                                </p>
                                <div className="flex items-center gap-1 mb-2">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-3.5 h-3.5 ${
                                        i < criterion.score
                                          ? "text-amber-400 fill-amber-400"
                                          : "text-k-border"
                                      }`}
                                    />
                                  ))}
                                  <span className="text-[10px] font-bold text-k-text-b ml-1 bg-k-bg-secondary px-1.5 py-0.5 rounded-md">
                                    {criterion.score}/5
                                  </span>
                                </div>
                                {criterion.notes && (
                                  <p className="text-[11px] text-k-text-b leading-relaxed italic">{criterion.notes}</p>
                                )}
                              </div>
                            ))}
                          </div>
                          {interview.recommendation && (
                            <div className="mt-4 inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 rounded-xl">
                              <span className="text-xs font-bold text-indigo-600/80 uppercase">Recomendación:</span>
                              <span className="text-sm font-black text-indigo-600">{interview.recommendation}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {isEditing && (
                        <form
                          onSubmit={handleSaveScorecard}
                          className="mt-5 pt-5 border-t border-k-border/30 space-y-5 relative z-10 bg-k-bg-card/50 p-4 rounded-2xl border-x border-b border-k-border/50"
                        >
                          <h4 className="text-sm font-black text-k-text-h">Editar Scorecard</h4>
                          <div className="space-y-3">
                            {scorecardDraft.map((criterion, idx) => (
                              <div
                                key={idx}
                                className="bg-k-bg-card border border-k-border/50 rounded-xl p-3 space-y-3 shadow-sm"
                              >
                                <div className="flex flex-wrap items-center gap-3">
                                  <input
                                    type="text"
                                    value={criterion.name}
                                    onChange={(e) => updateCriterion(idx, "name", e.target.value)}
                                    placeholder="Nombre del Criterio"
                                    className="flex-1 min-w-[200px] bg-k-bg-secondary/50 border border-k-border/50 rounded-lg px-3 py-2 text-sm text-k-text-h focus:ring-2 focus:ring-k-accent/50 outline-none transition-all font-bold"
                                  />
                                  <div className="flex items-center gap-1 bg-k-bg-secondary/30 px-2 py-1.5 rounded-lg border border-k-border/30">
                                    {[1, 2, 3, 4, 5].map((score) => (
                                      <button
                                        key={score}
                                        type="button"
                                        onClick={() => updateCriterion(idx, "score", score)}
                                        className="p-1 hover:scale-110 transition-transform"
                                      >
                                        <Star
                                          className={`w-5 h-5 ${
                                            score <= criterion.score
                                              ? "text-amber-400 fill-amber-400 drop-shadow-sm"
                                              : "text-k-border hover:text-amber-200"
                                          }`}
                                        />
                                      </button>
                                    ))}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeCriterion(idx)}
                                    className="p-2 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg border border-transparent hover:border-rose-600 transition-all ml-auto"
                                    title="Eliminar criterio"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                                <textarea
                                  value={criterion.notes || ""}
                                  onChange={(e) => updateCriterion(idx, "notes", e.target.value)}
                                  placeholder="Notas u observaciones sobre este criterio..."
                                  rows={2}
                                  className="w-full bg-k-bg-secondary/50 border border-k-border/50 rounded-lg px-3 py-2 text-sm text-k-text-h focus:ring-2 focus:ring-k-accent/50 outline-none transition-all"
                                />
                              </div>
                            ))}
                          </div>
                          
                          <button
                            type="button"
                            onClick={addCriterion}
                            className="flex items-center gap-1.5 text-sm font-bold text-k-accent hover:text-k-accent/80 bg-k-accent/10 px-4 py-2 rounded-xl transition-colors w-fit"
                          >
                            <Plus className="w-4 h-4" />
                            Agregar nuevo criterio
                          </button>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-k-border/30">
                            <div>
                              <label className="block text-xs font-bold text-k-text-b mb-1 uppercase tracking-wider">
                                Resultado de la Entrevista
                              </label>
                              <select
                                value={scorecardResultDraft}
                                onChange={(e) =>
                                  setScorecardResultDraft(e.target.value as Interview["result"])
                                }
                                className="w-full bg-k-bg-secondary/50 border border-k-border/50 rounded-xl px-3 py-2.5 text-sm text-k-text-h font-bold focus:ring-2 focus:ring-violet-500/50 outline-none transition-all"
                              >
                                <option value="pending">Pendiente de Decisión</option>
                                <option value="passed">Aprobado / Recomendado</option>
                                <option value="failed">No Aprobado</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-k-text-b mb-1 uppercase tracking-wider">
                                Notas Finales Generales
                              </label>
                              <input
                                type="text"
                                value={scorecardNotesDraft}
                                onChange={(e) => setScorecardNotesDraft(e.target.value)}
                                placeholder="Ej. Excelente comunicación, falta experiencia técnica..."
                                className="w-full bg-k-bg-secondary/50 border border-k-border/50 rounded-xl px-3 py-2.5 text-sm text-k-text-h focus:ring-2 focus:ring-violet-500/50 outline-none transition-all"
                              />
                            </div>
                          </div>

                          {recommendationPreview && (
                            <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-xl flex items-center justify-between">
                              <span className="text-xs font-bold text-indigo-600/80 uppercase">Recomendación Calculada:</span>
                              <span className="text-sm font-black text-indigo-600">{recommendationPreview}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-3 pt-2">
                            <button
                              type="submit"
                              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white text-sm font-bold hover:scale-[1.02] transition-all shadow-lg shadow-violet-500/25"
                            >
                              Guardar Scorecard
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditingScorecard}
                              className="px-6 py-2.5 rounded-xl bg-k-bg-card border border-k-border text-k-text-b text-sm font-bold hover:bg-k-border/50 transition-all"
                            >
                              Cancelar
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* History */}
          <div className="bg-k-bg-card/60 backdrop-blur-xl border border-k-border/50 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-500/20 to-transparent text-blue-500 rounded-2xl shadow-inner">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-black text-k-text-h text-lg">Historial de Cambios</h3>
            </div>

            <div className="space-y-0 relative before:absolute before:inset-0 before:ml-[15px] before:-translate-x-px md:before:ml-[15px] md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-k-border before:via-k-border/50 before:to-transparent">
              {app.statusLogs?.map((log, index) => (
                <div
                  key={log.id}
                  className="relative pl-10 py-4 group"
                >
                  <div className={`absolute left-0 top-5 w-8 h-8 rounded-full border-4 border-k-bg-card bg-k-accent shadow-sm flex items-center justify-center transition-transform duration-300 group-hover:scale-125 ${index === 0 ? 'bg-k-accent' : 'bg-k-border/80'}`}></div>
                  
                  <div className="bg-white/5 dark:bg-black/10 rounded-2xl p-4 border border-k-border/30 hover:border-k-border/80 transition-colors shadow-sm">
                    <p className="text-[10px] font-bold text-k-text-b uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-sm font-black text-k-text-h mb-1">
                      <span className="bg-k-bg-secondary px-2 py-0.5 rounded text-xs">{statusLabels[log.from_status || "N/A"] || log.from_status || "N/A"}</span>
                      <ArrowLeft className="w-4 h-4 text-k-text-b rotate-180" />
                      <span className="bg-k-accent/10 text-k-accent px-2 py-0.5 rounded text-xs border border-k-accent/20">{statusLabels[log.to_status] || log.to_status}</span>
                    </div>
                    {log.notes && (
                      <p className="text-sm text-k-text-b mt-2 italic leading-relaxed border-l-2 border-k-border/50 pl-3 py-0.5">"{log.notes}"</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Interview Mode Panel */}
    {interviewModeId && app && (() => {
      const iview = interviews.find((i) => i.id === interviewModeId);
      if (!iview) return null;
      return (
        <InterviewModePanel
          interview={iview}
          application={app}
          onClose={() => setInterviewModeId(null)}
          onSave={async (interviewId, data) => {
            await recruitmentApi.updateInterview(interviewId, data as Partial<Interview>);
            await fetchInterviews();
          }}
          onApprove={() => {
            setInterviewModeId(null);
            if (id) runAction(() => recruitmentApi.changeStatus(id, 'offer-sent'));
          }}
          onReject={() => {
            setInterviewModeId(null);
            handleReject();
          }}
        />
      );
    })()}
    </>
  );
}
