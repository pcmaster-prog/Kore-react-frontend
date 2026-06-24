import { useEffect, useState } from "react";
import { recruitmentApi } from "../api/recruitmentApi";
import type { EmailTemplate, EmailTemplateType } from "../types/recruitment";
import { Plus, X, Save, Trash2, Mail, Eye } from "lucide-react";

const TYPE_LABELS: Record<EmailTemplateType, string> = {
  application_received: "Postulación recibida",
  interview_scheduled: "Entrevista programada",
  interview_reminder: "Recordatorio de entrevista",
  offer_sent: "Oferta enviada",
  hired: "Contratación",
  rejected: "Rechazo",
};

const VARIABLES_BY_TYPE: Record<EmailTemplateType, string[]> = {
  application_received: ["candidateName", "jobTitle", "empresaName"],
  interview_scheduled: ["candidateName", "jobTitle", "scheduledAt", "method", "location", "meetingUrl", "empresaName"],
  interview_reminder: ["recipientName", "candidateName", "jobTitle", "scheduledAt", "method", "location", "meetingUrl", "role", "empresaName"],
  offer_sent: ["candidateName", "jobTitle", "empresaName", "offerUrl"],
  hired: ["candidateName", "jobTitle", "empresaName"],
  rejected: ["candidateName", "jobTitle", "reason", "empresaName"],
};

export default function RecruitmentEmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [types, setTypes] = useState<EmailTemplateType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState<{
    type: EmailTemplateType;
    subject: string;
    body: string;
    is_active: boolean;
  }>({
    type: "application_received",
    subject: "",
    body: "",
    is_active: true,
  });

  const fetchTemplates = async () => {
    try {
      const [data, availableTypes] = await Promise.all([
        recruitmentApi.getEmailTemplates(),
        recruitmentApi.getEmailTemplateTypes(),
      ]);
      setTemplates(data);
      setTypes(availableTypes);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const openForm = (template?: EmailTemplate) => {
    if (template) {
      setEditing(template);
      setFormData({
        type: template.type,
        subject: template.subject,
        body: template.body,
        is_active: template.is_active,
      });
    } else {
      setEditing(null);
      setFormData({
        type: types[0] || "application_received",
        subject: "",
        body: "",
        is_active: true,
      });
    }
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await recruitmentApi.updateEmailTemplate(editing.id, formData);
      } else {
        await recruitmentApi.createEmailTemplate(formData);
      }
      await fetchTemplates();
      closeForm();
    } catch (error) {
      console.error(error);
      alert("No se pudo guardar la plantilla.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta plantilla? Se usará el email predeterminado.")) return;
    try {
      await recruitmentApi.deleteEmailTemplate(id);
      await fetchTemplates();
    } catch (error) {
      console.error(error);
      alert("No se pudo eliminar la plantilla.");
    }
  };

  const previewBody = (body: string) => {
    return body
      .replace(/\{\{\s*\$candidateName\s*\}\}/g, "Juan Pérez")
      .replace(/\{\{\s*\$jobTitle\s*\}\}/g, "Cajero")
      .replace(/\{\{\s*\$empresaName\s*\}\}/g, "Decorarte")
      .replace(/\{\{\s*\$scheduledAt\s*\}\}/g, "01/01/2026 10:00")
      .replace(/\{\{\s*\$method\s*\}\}/g, "video")
      .replace(/\{\{\s*\$location\s*\}\}/g, "Oficinas centrales")
      .replace(/\{\{\s*\$meetingUrl\s*\}\}/g, "https://meet.example.com")
      .replace(/\{\{\s*\$reason\s*\}\}/g, "No alcanzaste el puntaje mínimo")
      .replace(/\{\{\s*\$recipientName\s*\}\}/g, "Reclutador")
      .replace(/\{\{\s*\$role\s*\}\}/g, "candidate");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-k-text-h tracking-tight">Plantillas de Email</h1>
          <p className="text-k-text-b text-sm mt-1">
            Personaliza los correos automáticos del ATS. Si no hay plantilla activa, se usa el diseño predeterminado.
          </p>
        </div>
        <button
          onClick={() => openForm()}
          className="flex items-center space-x-2 bg-k-accent-btn text-white px-4 py-2 rounded-xl font-bold hover:bg-opacity-90 transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Nueva plantilla</span>
        </button>
      </div>

      {loading ? (
        <p className="text-k-text-b">Cargando plantillas...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {templates.map((template) => (
            <div key={template.id} className="bg-k-bg-card border border-k-border rounded-3xl p-6 shadow-k-card">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-black text-k-text-h">{TYPE_LABELS[template.type]}</h3>
                  <p className="text-sm text-k-text-b mt-1 line-clamp-1">{template.subject}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    template.is_active ? "bg-emerald-500/10 text-emerald-600" : "bg-gray-500/10 text-gray-600"
                  }`}
                >
                  {template.is_active ? "Activa" : "Inactiva"}
                </span>
              </div>

              <div className="mt-4 p-3 bg-k-bg-primary border border-k-border rounded-xl text-sm text-k-text-b line-clamp-3">
                <div dangerouslySetInnerHTML={{ __html: previewBody(template.body) }} />
              </div>

              <div className="mt-4 flex justify-end space-x-3 border-t border-k-border pt-4">
                <button
                  onClick={() => openForm(template)}
                  className="text-sm font-bold text-k-text-b hover:text-k-accent-btn transition-colors flex items-center gap-1"
                >
                  <Eye className="w-4 h-4" /> Ver / Editar
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="text-sm font-bold text-k-text-b hover:text-red-500 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" /> Eliminar
                </button>
              </div>
            </div>
          ))}

          {templates.length === 0 && (
            <div className="col-span-full py-12 text-center bg-k-bg-card border border-k-border rounded-3xl border-dashed">
              <Mail className="w-10 h-10 text-k-text-b mx-auto mb-3" />
              <p className="text-k-text-b">No hay plantillas personalizadas.</p>
              <p className="text-xs text-k-text-b mt-1">El sistema usará los correos predeterminados.</p>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-3xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-k-text-h">
                {editing ? "Editar plantilla" : "Nueva plantilla"}
              </h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-k-text-h mb-1">Tipo de email</label>
                <select
                  className="w-full bg-k-bg-primary border border-k-border rounded-xl px-4 py-2 focus:outline-none focus:border-k-accent"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as EmailTemplateType })}
                  disabled={!!editing}
                >
                  {types.map((type) => (
                    <option key={type} value={type}>
                      {TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-k-text-h mb-1">Asunto</label>
                <input
                  type="text"
                  required
                  className="w-full bg-k-bg-primary border border-k-border rounded-xl px-4 py-2 focus:outline-none focus:border-k-accent"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Ej. Gracias {{ $candidateName }}"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-k-text-h mb-1">Cuerpo (HTML)</label>
                <textarea
                  required
                  className="w-full bg-k-bg-primary border border-k-border rounded-xl px-4 py-2 focus:outline-none focus:border-k-accent h-48 font-mono text-sm"
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  placeholder="<p>Hola {{ $candidateName }},</p>"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="is_active"
                  type="checkbox"
                  className="w-5 h-5 rounded border-k-border text-k-accent-btn focus:ring-k-accent-btn"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <label htmlFor="is_active" className="text-sm font-bold text-k-text-h">
                  Plantilla activa
                </label>
              </div>

              <div className="bg-k-bg-primary border border-k-border rounded-xl p-4">
                <p className="text-sm font-bold text-k-text-h mb-2">Variables disponibles</p>
                <div className="flex flex-wrap gap-2">
                  {VARIABLES_BY_TYPE[formData.type].map((variable) => (
                    <code key={variable} className="text-xs bg-white border border-k-border rounded-lg px-2 py-1">
                      {'{{ $' + variable + ' }}'}
                    </code>
                  ))}
                </div>
              </div>

              <div className="bg-k-bg-primary border border-k-border rounded-xl p-4">
                <p className="text-sm font-bold text-k-text-h mb-2">Vista previa</p>
                <div
                  className="prose prose-sm max-w-none text-k-text-b"
                  dangerouslySetInnerHTML={{ __html: previewBody(formData.body) }}
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 rounded-xl font-bold text-k-text-b hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl font-bold text-white bg-k-accent-btn hover:bg-opacity-90 transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
