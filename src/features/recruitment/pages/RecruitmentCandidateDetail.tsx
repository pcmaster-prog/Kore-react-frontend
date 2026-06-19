import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { recruitmentApi } from "../api/recruitmentApi";
import type { Application, ApplicationStatus } from "../types/recruitment";
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
} from "lucide-react";

const statusLabels: Record<string, string> = {
  new: "Nuevo",
  screening: "En evaluación",
  "interview-requested": "Entrevista solicitada",
  interviewing: "En entrevista",
  hired: "Contratado",
  rejected: "Rechazado",
};

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
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(false);

  const [showResultForm, setShowResultForm] = useState(false);
  const [resultValue, setResultValue] = useState<"passed" | "failed">("passed");
  const [resultNotes, setResultNotes] = useState("");

  const [showHireForm, setShowHireForm] = useState(false);
  const [hireSalary, setHireSalary] = useState("");
  const [hireMonths, setHireMonths] = useState("1");

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

  useEffect(() => {
    fetchApp();
  }, [id]);

  const runAction = async (action: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await action();
      await fetchApp();
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

  const handleScheduleInterview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !interviewDate) return;
    runAction(async () => {
      await recruitmentApi.scheduleInterview(
        id,
        new Date(interviewDate).toISOString(),
        interviewNotes,
        notifyWhatsapp
      );
      setShowInterviewForm(false);
      setInterviewDate("");
      setInterviewNotes("");
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
            <span className="self-start bg-k-bg-secondary text-k-text-b px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider">
              {statusLabels[status] || status}
            </span>
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
            <div>
              <label className="block text-xs font-bold text-k-text-b mb-1">
                Fecha y hora de entrevista
              </label>
              <input
                type="datetime-local"
                required
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
                className="w-full md:w-auto bg-k-bg-secondary border border-k-border rounded-xl px-3 py-2 text-sm text-k-text-h"
              />
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

        {/* Interview info */}
        {(app.interview_scheduled_at || app.interview_result) && (
          <div className="bg-k-bg-card border border-k-border rounded-3xl p-6 shadow-sm md:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="font-black text-k-text-h text-lg">Entrevista</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {app.interview_scheduled_at && (
                <p className="text-k-text-b">
                  <span className="font-bold text-k-text-h">Programada:</span>{" "}
                  {new Date(app.interview_scheduled_at).toLocaleString()}
                </p>
              )}
              {app.interview_result && (
                <p className="text-k-text-b">
                  <span className="font-bold text-k-text-h">Resultado:</span>{" "}
                  {app.interview_result === "passed" ? "Aprobado" : app.interview_result === "failed" ? "Rechazado" : app.interview_result}
                </p>
              )}
              {app.interview_notes && (
                <p className="text-k-text-b md:col-span-3">
                  <span className="font-bold text-k-text-h">Notas:</span>{" "}
                  {app.interview_notes}
                </p>
              )}
            </div>
          </div>
        )}

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
