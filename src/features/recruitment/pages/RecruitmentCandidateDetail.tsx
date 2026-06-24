import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { recruitmentApi } from "../api/recruitmentApi";
import type { Application, ApplicationStatus, Interview, OnboardingDocument, RehireCheck, ScorecardCriterion } from "../types/recruitment";
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
      const res = await import("@/features/puestos/api").then((m) => m.listPuestos());
      setPositions((res.data ?? []).map((p) => ({ id: p.id, name: p.nombre })));
    } catch (error) {
      console.error(error);
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
    if (!id || !interviewDate) return;
    runAction(async () => {
      await recruitmentApi.scheduleInterview(id, {
        interview_scheduled_at: new Date(interviewDate).toISOString(),
        notes: interviewNotes,
        notify_whatsapp: notifyWhatsapp,
        method: interviewMethod || undefined,
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
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center space-x-2 text-k-text-b hover:text-k-text-h transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="font-bold text-sm">Volver al Kanban</span>
      </button>

      {/* Header */}
      <div className="bg-k-bg-card border border-k-border rounded-3xl p-6 md:p-8 shadow-k-card flex flex-col md:flex-row gap-6 items-start">
        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-tr from-k-accent to-purple-500 flex-shrink-0 flex items-center justify-center text-3xl md:text-4xl text-white font-black shadow-sm">
          {app.user?.name?.charAt(0) || "?"}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-k-text-h tracking-tight">
                {app.user?.name}
              </h1>
              <p className="text-k-accent font-bold mt-1">
                Postulante para: {app.jobOpening?.title}
              </p>
              <p className="text-k-text-b text-sm mt-1">{app.user?.email}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 self-start">
              {rehireCheck?.is_rehire && (
                <span className="bg-amber-500/10 text-amber-600 border border-amber-500/20 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider">
                  Ex-empleado
                </span>
              )}
              <span className="bg-k-bg-secondary text-k-text-b px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider">
                {statusLabels[status] || status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions panel */}
      <div className="bg-k-bg-card border border-k-border rounded-3xl p-6 shadow-sm">
        <h3 className="font-black text-k-text-h text-lg mb-4">Acciones</h3>
        {busy ? (
          <p className="text-k-text-b text-sm">Procesando…</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {status === "new" && (
              <button
                onClick={() => handleAdvance("screening")}
                className="px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-bold hover:bg-blue-600 transition-colors"
              >
                Enviar a evaluación
              </button>
            )}

            {(status === "screening" || status === "interview-requested") && (
              <button
                onClick={() => setShowInterviewForm((s) => !s)}
                className="px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 transition-colors"
              >
                {showInterviewForm ? "Cancelar" : "Agendar entrevista"}
              </button>
            )}

            {status === "interviewing" && (
              <button
                onClick={() => setShowResultForm((s) => !s)}
                className="px-4 py-2 rounded-xl bg-violet-500 text-white text-sm font-bold hover:bg-violet-600 transition-colors"
              >
                {showResultForm ? "Cancelar" : "Registrar resultado"}
              </button>
            )}

            {status === "interviewing" && (
              <button
                onClick={() => setShowHireForm((s) => !s)}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-colors"
              >
                {showHireForm ? "Cancelar" : "Contratar a prueba"}
              </button>
            )}

            {(status === "interviewing" || status === "offer-sent") && (
              <button
                onClick={() => setShowOfferForm((s) => !s)}
                className="px-4 py-2 rounded-xl bg-indigo-500 text-white text-sm font-bold hover:bg-indigo-600 transition-colors"
              >
                {showOfferForm ? "Cancelar" : app.offer?.status === "sent" ? "Editar oferta" : "Enviar oferta"}
              </button>
            )}

            {status === "offer-sent" && app.offer?.status === "sent" && (
              <button
                onClick={handleResendOffer}
                className="px-4 py-2 rounded-xl bg-indigo-500/80 text-white text-sm font-bold hover:bg-indigo-600 transition-colors"
              >
                Reenviar oferta
              </button>
            )}

            {status !== "hired" && status !== "rejected" && rehireCheck?.is_rehire && (
              <button
                onClick={() => setShowRehireForm((s) => !s)}
                className="px-4 py-2 rounded-xl bg-sky-500 text-white text-sm font-bold hover:bg-sky-600 transition-colors"
              >
                {showRehireForm ? "Cancelar" : "Recontratar rápido"}
              </button>
            )}

            {status === "rejected" && app?.screening_test_results != null && (
              <button
                onClick={handleResetScreening}
                disabled={busy}
                className="px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                🔄 Reintentar evaluación
              </button>
            )}

            {status !== "hired" && status !== "rejected" && (
              <button
                onClick={handleReject}
                className="px-4 py-2 rounded-xl bg-rose-500 text-white text-sm font-bold hover:bg-rose-600 transition-colors"
              >
                Rechazar
              </button>
            )}
          </div>
        )}

        {showInterviewForm && (
          <form
            onSubmit={handleScheduleInterview}
            className="mt-4 space-y-3 border-t border-k-border pt-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-k-text-b mb-1">
                  Fecha y hora de entrevista
                </label>
                <input
                  type="datetime-local"
                  required
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  className="w-full bg-k-bg-secondary border border-k-border rounded-xl px-3 py-2 text-sm text-k-text-h"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-k-text-b mb-1">
                  Método
                </label>
                <select
                  value={interviewMethod}
                  onChange={(e) => setInterviewMethod(e.target.value as Interview["method"] | "")}
                  className="w-full bg-k-bg-secondary border border-k-border rounded-xl px-3 py-2 text-sm text-k-text-h"
                >
                  <option value="">Seleccionar…</option>
                  <option value="in-person">Presencial</option>
                  <option value="video">Videollamada</option>
                  <option value="phone">Teléfono</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-k-text-b mb-1">
                  Ubicación / Lugar
                </label>
                <input
                  type="text"
                  value={interviewLocation}
                  onChange={(e) => setInterviewLocation(e.target.value)}
                  placeholder="Ej. Oficina central, Sala 3"
                  className="w-full bg-k-bg-secondary border border-k-border rounded-xl px-3 py-2 text-sm text-k-text-h"
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
                  className="w-full bg-k-bg-secondary border border-k-border rounded-xl px-3 py-2 text-sm text-k-text-h"
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
                className="w-full bg-k-bg-secondary border border-k-border rounded-xl px-3 py-2 text-sm text-k-text-h"
                rows={3}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-k-text-b">
              <input
                type="checkbox"
                checked={notifyWhatsapp}
                onChange={(e) => setNotifyWhatsapp(e.target.checked)}
              />
              Notificar por WhatsApp
            </label>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 transition-colors"
            >
              Guardar entrevista
            </button>
          </form>
        )}

        {showResultForm && (
          <form
            onSubmit={handleRecordResult}
            className="mt-4 space-y-3 border-t border-k-border pt-4"
          >
            <div>
              <label className="block text-xs font-bold text-k-text-b mb-1">
                Resultado
              </label>
              <select
                value={resultValue}
                onChange={(e) => setResultValue(e.target.value as "passed" | "failed")}
                className="w-full md:w-auto bg-k-bg-secondary border border-k-border rounded-xl px-3 py-2 text-sm text-k-text-h"
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
                className="w-full bg-k-bg-secondary border border-k-border rounded-xl px-3 py-2 text-sm text-k-text-h"
                rows={3}
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-violet-500 text-white text-sm font-bold hover:bg-violet-600 transition-colors"
            >
              Guardar resultado
            </button>
          </form>
        )}

        {showHireForm && (
          <form
            onSubmit={handleHire}
            className="mt-4 space-y-3 border-t border-k-border pt-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  className="w-full bg-k-bg-secondary border border-k-border rounded-xl px-3 py-2 text-sm text-k-text-h"
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
                  className="w-full bg-k-bg-secondary border border-k-border rounded-xl px-3 py-2 text-sm text-k-text-h"
                />
              </div>
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-colors"
            >
              Confirmar contratación
            </button>
          </form>
        )}

        {showOfferForm && (
          <form
            onSubmit={handleSendOffer}
            className="mt-4 space-y-3 border-t border-k-border pt-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  className="w-full bg-k-bg-secondary border border-k-border rounded-xl px-3 py-2 text-sm text-k-text-h"
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
                  className="w-full bg-k-bg-secondary border border-k-border rounded-xl px-3 py-2 text-sm text-k-text-h"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-k-text-b mb-1">
                  Puesto
                </label>
                <select
                  value={offerPositionId}
                  onChange={(e) => setOfferPositionId(e.target.value)}
                  className="w-full bg-k-bg-secondary border border-k-border rounded-xl px-3 py-2 text-sm text-k-text-h"
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
                className="w-full bg-k-bg-secondary border border-k-border rounded-xl px-3 py-2 text-sm text-k-text-h"
                rows={3}
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-500 text-white text-sm font-bold hover:bg-indigo-600 transition-colors"
            >
              Enviar oferta al candidato
            </button>
          </form>
        )}

        {showRehireForm && (
          <form
            onSubmit={handleRehire}
            className="mt-4 space-y-3 border-t border-k-border pt-4"
          >
            <div className="bg-sky-500/10 text-sky-700 border border-sky-500/20 rounded-xl p-3 text-sm">
              <p className="font-bold">Recontratación rápida</p>
              <p>
                Este candidato coincide con el ex-empleado{" "}
                <span className="font-bold">{rehireCheck?.previous_full_name || "—"}</span>.
                Se reactivará su expediente anterior.
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
                className="w-full md:w-64 bg-k-bg-secondary border border-k-border rounded-xl px-3 py-2 text-sm text-k-text-h"
                placeholder="0.00"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-sky-500 text-white text-sm font-bold hover:bg-sky-600 transition-colors"
            >
              Confirmar recontratación
            </button>
          </form>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact info */}
        <div className="bg-k-bg-card border border-k-border rounded-3xl p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-k-accent/10 text-k-accent rounded-xl">
              <Phone className="w-5 h-5" />
            </div>
            <h3 className="font-black text-k-text-h text-lg">Información de contacto</h3>
          </div>

          {app.contact_info ? (
            <div className="space-y-3 text-sm">
              {app.contact_info.phone && (
                <div className="flex items-center gap-3 text-k-text-b">
                  <Phone className="w-4 h-4" />
                  <span>{app.contact_info.phone}</span>
                </div>
              )}
              {app.user?.email && (
                <div className="flex items-center gap-3 text-k-text-b">
                  <Mail className="w-4 h-4" />
                  <span>{app.user.email}</span>
                </div>
              )}
              {app.contact_info.address && (
                <div className="flex items-start gap-3 text-k-text-b">
                  <MapPin className="w-4 h-4 mt-0.5" />
                  <span>{app.contact_info.address}</span>
                </div>
              )}
              {app.contact_info.rfc && (
                <p className="text-k-text-b">
                  <span className="font-bold text-k-text-h">RFC:</span>{" "}
                  {app.contact_info.rfc}
                </p>
              )}
              {app.contact_info.curp && (
                <p className="text-k-text-b">
                  <span className="font-bold text-k-text-h">CURP:</span>{" "}
                  {app.contact_info.curp}
                </p>
              )}
              {app.contact_info.nss && (
                <p className="text-k-text-b">
                  <span className="font-bold text-k-text-h">NSS:</span>{" "}
                  {app.contact_info.nss}
                </p>
              )}
            </div>
          ) : (
            <p className="text-k-text-b text-sm">No hay información de contacto registrada.</p>
          )}
        </div>

        {/* Screening results */}
        <div className="bg-k-bg-card border border-k-border rounded-3xl p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="font-black text-k-text-h text-lg">Evaluación / Screening</h3>
          </div>

          {app.screening_test_results ? (
            <div className="space-y-3 text-sm">
              <p className="text-k-text-b">
                <span className="font-bold text-k-text-h">Puntaje:</span>{" "}
                {app.screening_test_results.score ?? "N/A"}
              </p>
              {app.screening_test_results.submitted_at && (
                <p className="text-k-text-b">
                  <span className="font-bold text-k-text-h">Enviado:</span>{" "}
                  {new Date(app.screening_test_results.submitted_at).toLocaleString()}
                </p>
              )}
            </div>
          ) : (
            <p className="text-k-text-b text-sm">Aún no se ha enviado la evaluación.</p>
          )}

          <div className="mt-4 pt-4 border-t border-k-border/50">
            <div className="flex items-center gap-3 text-sm text-k-text-b">
              <PlayCircle className="w-4 h-4" />
              <span>
                Video de inducción:{" "}
                <span className={app.has_induction_video_watched ? "text-emerald-500 font-bold" : "text-k-text-b"}>
                  {app.has_induction_video_watched ? "Visto" : "Pendiente"}
                </span>
              </span>
            </div>
            {app.induction_video_watched_at && (
              <p className="text-k-text-b text-xs mt-1 ml-7">
                {new Date(app.induction_video_watched_at).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* Education / Experience */}
        <div className="bg-k-bg-card border border-k-border rounded-3xl p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="font-black text-k-text-h text-lg">Educación y experiencia</h3>
          </div>

          <div className="space-y-4">
            {app.education ? (
              <div>
                <h4 className="font-bold text-k-text-h text-sm mb-1">Educación</h4>
                <pre className="text-xs text-k-text-b bg-k-bg-secondary p-3 rounded-xl overflow-auto">
                  {JSON.stringify(app.education, null, 2)}
                </pre>
              </div>
            ) : (
              <p className="text-k-text-b text-sm">Sin datos de educación.</p>
            )}
            {app.experience ? (
              <div>
                <h4 className="font-bold text-k-text-h text-sm mb-1">Experiencia</h4>
                <pre className="text-xs text-k-text-b bg-k-bg-secondary p-3 rounded-xl overflow-auto">
                  {JSON.stringify(app.experience, null, 2)}
                </pre>
              </div>
            ) : (
              <p className="text-k-text-b text-sm">Sin datos de experiencia.</p>
            )}
          </div>
        </div>

        {/* Documents */}
        <div className="bg-k-bg-card border border-k-border rounded-3xl p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-purple-500/10 text-purple-500 rounded-xl">
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
                  className="flex items-center justify-between p-3 border border-k-border rounded-xl hover:bg-k-bg-secondary transition-colors"
                >
                  <span className="font-bold text-sm text-k-text-h">
                    {doc.document_type}
                  </span>
                  <span className="text-xs text-k-accent font-bold">Ver / Descargar</span>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-k-text-b text-sm">No hay documentos subidos.</p>
          )}
        </div>

        {/* Offer & Onboarding */}
        {(status === "offer-sent" || status === "hired") && (
          <div className="bg-k-bg-card border border-k-border rounded-3xl p-6 shadow-sm md:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl">
                <Send className="w-5 h-5" />
              </div>
              <h3 className="font-black text-k-text-h text-lg">Oferta y onboarding</h3>
            </div>

            {app.offer && (
              <div className="bg-k-bg-secondary/40 border border-k-border rounded-2xl p-4 mb-4">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <span className="font-bold text-k-text-h text-sm">Oferta</span>
                  <span
                    className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
                      app.offer.status === "accepted"
                        ? "bg-emerald-500/10 text-emerald-600"
                        : app.offer.status === "rejected"
                          ? "bg-rose-500/10 text-rose-600"
                          : "bg-indigo-500/10 text-indigo-600"
                    }`}
                  >
                    {app.offer.status === "sent" && "Enviada"}
                    {app.offer.status === "accepted" && "Aceptada"}
                    {app.offer.status === "rejected" && "Rechazada"}
                    {app.offer.status === "draft" && "Borrador"}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <p className="text-k-text-b">
                    <span className="font-bold text-k-text-h">Salario diario:</span> ${app.offer.salary}
                  </p>
                  <p className="text-k-text-b">
                    <span className="font-bold text-k-text-h">Periodo de prueba:</span>{" "}
                    {app.offer.trial_months} mes{app.offer.trial_months !== 1 ? "es" : ""}
                  </p>
                  {app.offer.position && (
                    <p className="text-k-text-b">
                      <span className="font-bold text-k-text-h">Puesto:</span> {app.offer.position.name}
                    </p>
                  )}
                </div>
                {app.offer.notes && (
                  <p className="text-k-text-b text-sm mt-2">
                    <span className="font-bold text-k-text-h">Notas:</span> {app.offer.notes}
                  </p>
                )}
                {app.offer.sent_at && (
                  <p className="text-k-text-b text-xs mt-2">
                    Enviada el {new Date(app.offer.sent_at).toLocaleString()}
                  </p>
                )}
                {app.offer.accepted_at && (
                  <p className="text-k-text-b text-xs mt-2">
                    Aceptada el {new Date(app.offer.accepted_at).toLocaleString()}
                  </p>
                )}
              </div>
            )}

            {status === "hired" && (
              <div>
                <h4 className="font-bold text-k-text-h text-sm mb-3">Checklist de documentos de alta</h4>
                {onboardingDocs.length === 0 ? (
                  <p className="text-k-text-b text-sm">Cargando documentos…</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {onboardingDocs.map((doc) => (
                      <div
                        key={doc.type}
                        className="bg-k-bg-secondary/40 border border-k-border rounded-xl p-3 flex items-start justify-between gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {doc.verified ? (
                              <Check className="w-4 h-4 text-emerald-500" />
                            ) : doc.uploaded ? (
                              <FileCheck className="w-4 h-4 text-amber-500" />
                            ) : (
                              <X className="w-4 h-4 text-k-text-b" />
                            )}
                            <span className="text-sm font-bold text-k-text-h">{doc.label}</span>
                          </div>
                          <p className="text-xs text-k-text-b mt-1">
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
                              className="text-xs text-k-accent font-bold hover:underline mt-1 inline-block"
                            >
                              Ver documento
                            </a>
                          )}
                        </div>
                        {doc.uploaded && (
                          <div className="flex items-center gap-2">
                            {!doc.verified ? (
                              <button
                                onClick={() => handleVerifyDocument(doc.type)}
                                className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 text-xs font-bold hover:bg-emerald-500/20 transition-colors"
                              >
                                Verificar
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUnverifyDocument(doc.type)}
                                className="px-2 py-1 rounded-lg bg-k-bg-secondary text-k-text-b text-xs font-bold hover:bg-k-border transition-colors"
                              >
                                Desverificar
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
        <div className="bg-k-bg-card border border-k-border rounded-3xl p-6 shadow-sm md:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="font-black text-k-text-h text-lg">Entrevistas</h3>
            </div>
            <span className="text-xs text-k-text-b font-bold">
              {interviews.length} registrada{interviews.length !== 1 ? "s" : ""}
            </span>
          </div>

          {interviews.length === 0 ? (
            <p className="text-k-text-b text-sm">No hay entrevistas programadas.</p>
          ) : (
            <div className="space-y-4">
              {interviews.map((interview) => {
                const isEditing = editingInterviewId === interview.id;
                return (
                  <div
                    key={interview.id}
                    className="border border-k-border rounded-2xl p-4 bg-k-bg-secondary/40"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="flex items-center gap-1.5 text-k-text-h font-bold">
                            <Clock className="w-4 h-4 text-k-accent" />
                            {new Date(interview.scheduled_at).toLocaleString()}
                          </span>
                          {interview.method && (
                            <span className="px-2 py-0.5 rounded-lg bg-k-bg-secondary border border-k-border text-k-text-b text-xs font-bold">
                              {methodLabels[interview.method] || interview.method}
                            </span>
                          )}
                          {interview.result && interview.result !== "pending" && (
                            <span
                              className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
                                interview.result === "passed"
                                  ? "bg-emerald-500/10 text-emerald-600"
                                  : "bg-rose-500/10 text-rose-600"
                              }`}
                            >
                              {interview.result === "passed" ? "Aprobado" : "No aprobado"}
                            </span>
                          )}
                        </div>
                        {interview.location && (
                          <p className="flex items-center gap-2 text-k-text-b">
                            <MapPinned className="w-4 h-4 text-k-accent" />
                            {interview.location}
                          </p>
                        )}
                        {interview.meeting_url && (
                          <p className="flex items-center gap-2 text-k-text-b">
                            <Video className="w-4 h-4 text-k-accent" />
                            <a
                              href={interview.meeting_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-k-accent font-bold hover:underline truncate max-w-md"
                            >
                              {interview.meeting_url}
                            </a>
                          </p>
                        )}
                        {interview.notes && (
                          <p className="text-k-text-b">
                            <span className="font-bold text-k-text-h">Notas:</span>{" "}
                            {interview.notes}
                          </p>
                        )}
                        {interview.interviewer && (
                          <p className="text-k-text-b text-xs">
                            Entrevistador: {interview.interviewer.name}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEditingScorecard(interview)}
                          className="px-3 py-1.5 rounded-lg bg-violet-500/10 text-violet-600 text-xs font-bold hover:bg-violet-500/20 transition-colors"
                        >
                          {interview.scorecard?.length ? "Editar scorecard" : "Agregar scorecard"}
                        </button>
                        <button
                          onClick={() => handleDeleteInterview(interview.id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 transition-colors"
                          title="Eliminar entrevista"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {interview.scorecard && interview.scorecard.length > 0 && !isEditing && (
                      <div className="mt-4 pt-4 border-t border-k-border/50">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {interview.scorecard.map((criterion, idx) => (
                            <div
                              key={idx}
                              className="bg-k-bg-secondary border border-k-border rounded-xl p-3"
                            >
                              <p className="text-xs font-bold text-k-text-h mb-1">
                                {criterion.name}
                              </p>
                              <div className="flex items-center gap-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < criterion.score
                                        ? "text-amber-400 fill-amber-400"
                                        : "text-k-border"
                                    }`}
                                  />
                                ))}
                                <span className="text-xs text-k-text-b ml-1">
                                  {criterion.score}/5
                                </span>
                              </div>
                              {criterion.notes && (
                                <p className="text-xs text-k-text-b mt-1">{criterion.notes}</p>
                              )}
                            </div>
                          ))}
                        </div>
                        {interview.recommendation && (
                          <p className="mt-3 text-sm font-bold text-k-text-h">
                            Recomendación:{" "}
                            <span className="text-k-accent">{interview.recommendation}</span>
                          </p>
                        )}
                      </div>
                    )}

                    {isEditing && (
                      <form
                        onSubmit={handleSaveScorecard}
                        className="mt-4 pt-4 border-t border-k-border/50 space-y-4"
                      >
                        <div className="space-y-3">
                          {scorecardDraft.map((criterion, idx) => (
                            <div
                              key={idx}
                              className="bg-k-bg-secondary border border-k-border rounded-xl p-3 space-y-2"
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="text"
                                  value={criterion.name}
                                  onChange={(e) => updateCriterion(idx, "name", e.target.value)}
                                  placeholder="Criterio"
                                  className="flex-1 bg-k-bg-card border border-k-border rounded-lg px-3 py-1.5 text-sm text-k-text-h"
                                />
                                <div className="flex items-center gap-1">
                                  {[1, 2, 3, 4, 5].map((score) => (
                                    <button
                                      key={score}
                                      type="button"
                                      onClick={() => updateCriterion(idx, "score", score)}
                                      className="p-1"
                                    >
                                      <Star
                                        className={`w-5 h-5 ${
                                          score <= criterion.score
                                            ? "text-amber-400 fill-amber-400"
                                            : "text-k-border"
                                        }`}
                                      />
                                    </button>
                                  ))}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeCriterion(idx)}
                                  className="p-1.5 text-rose-600 hover:bg-rose-500/10 rounded-lg"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                              <textarea
                                value={criterion.notes || ""}
                                onChange={(e) => updateCriterion(idx, "notes", e.target.value)}
                                placeholder="Notas del criterio"
                                rows={2}
                                className="w-full bg-k-bg-card border border-k-border rounded-lg px-3 py-1.5 text-sm text-k-text-h"
                              />
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={addCriterion}
                          className="flex items-center gap-1.5 text-sm font-bold text-k-accent hover:text-k-accent/80"
                        >
                          <Plus className="w-4 h-4" />
                          Agregar criterio
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-k-text-b mb-1">
                              Resultado
                            </label>
                            <select
                              value={scorecardResultDraft}
                              onChange={(e) =>
                                setScorecardResultDraft(e.target.value as Interview["result"])
                              }
                              className="w-full bg-k-bg-secondary border border-k-border rounded-xl px-3 py-2 text-sm text-k-text-h"
                            >
                              <option value="pending">Pendiente</option>
                              <option value="passed">Aprobado</option>
                              <option value="failed">No aprobado</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-k-text-b mb-1">
                              Notas generales
                            </label>
                            <input
                              type="text"
                              value={scorecardNotesDraft}
                              onChange={(e) => setScorecardNotesDraft(e.target.value)}
                              className="w-full bg-k-bg-secondary border border-k-border rounded-xl px-3 py-2 text-sm text-k-text-h"
                            />
                          </div>
                        </div>

                        {recommendationPreview && (
                          <p className="text-sm font-bold text-k-text-h">
                            Recomendación automática:{" "}
                            <span className="text-k-accent">{recommendationPreview}</span>
                          </p>
                        )}

                        <div className="flex items-center gap-3">
                          <button
                            type="submit"
                            className="px-4 py-2 rounded-xl bg-violet-500 text-white text-sm font-bold hover:bg-violet-600 transition-colors"
                          >
                            Guardar scorecard
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditingScorecard}
                            className="px-4 py-2 rounded-xl bg-k-bg-secondary text-k-text-b text-sm font-bold hover:bg-k-border transition-colors"
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
        <div className="bg-k-bg-card border border-k-border rounded-3xl p-6 shadow-sm md:col-span-2">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="font-black text-k-text-h text-lg">Historial</h3>
          </div>

          <div className="space-y-4">
            {app.statusLogs?.map((log) => (
              <div
                key={log.id}
                className="relative pl-6 border-l-2 border-k-border pb-4 last:pb-0 last:border-0"
              >
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-k-bg-card border-2 border-k-accent"></div>
                <p className="text-xs text-k-text-b mb-1">
                  {new Date(log.created_at).toLocaleString()}
                </p>
                <p className="text-sm font-bold text-k-text-h">
                  {statusLabels[log.from_status || "N/A"] || log.from_status || "N/A"}{" "}
                  <span className="text-k-text-b font-normal mx-1">→</span>{" "}
                  {statusLabels[log.to_status] || log.to_status}
                </p>
                {log.notes && (
                  <p className="text-sm text-k-text-b mt-1">{log.notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
