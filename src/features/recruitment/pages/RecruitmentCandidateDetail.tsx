import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { recruitmentApi } from "../api/recruitmentApi";
import type { Application } from "../types/recruitment";
import { ArrowLeft, Check, X, FileText, Calendar } from "lucide-react";

export default function RecruitmentCandidateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);

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

  const handleHire = async () => {
    if (!id) return;
    const salary = prompt("Ingresa el salario diario asignado:");
    if (!salary) return;
    
    try {
      await recruitmentApi.hireTrial(id, 1, Number(salary), []);
      alert("Candidato contratado a prueba");
      navigate("/manager/reclutamiento/candidatos");
    } catch(e) {
      alert("Error al contratar");
    }
  };

  const handleReject = async () => {
    if (!id) return;
    const reason = prompt("Motivo de rechazo:");
    if (!reason) return;
    
    try {
      await recruitmentApi.reject(id, reason, true);
      alert("Candidato rechazado");
      navigate("/manager/reclutamiento/candidatos");
    } catch(e) {
      alert("Error al rechazar");
    }
  };

  if (loading) return <p className="text-k-text-b">Cargando detalles...</p>;
  if (!app) return <p className="text-red-500">No encontrado</p>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center space-x-2 text-k-text-b hover:text-k-text-h transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="font-bold text-sm">Volver al Kanban</span>
      </button>

      <div className="bg-k-bg-card border border-k-border rounded-3xl p-8 shadow-k-card flex flex-col md:flex-row gap-8 items-start">
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-k-accent to-purple-500 flex-shrink-0 flex items-center justify-center text-4xl text-white font-black shadow-sm">
          {app.user?.name?.charAt(0) || '?'}
        </div>
        
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-black text-k-text-h tracking-tight">{app.user?.name}</h1>
              <p className="text-k-accent font-bold mt-1">Postulante para: {app.jobOpening?.title}</p>
            </div>
            <span className="bg-k-bg-secondary text-k-text-b px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider">
              Estado: {app.status}
            </span>
          </div>

          <div className="mt-6 flex gap-4">
            <button onClick={handleHire} className="flex items-center space-x-2 bg-emerald-500 text-white px-6 py-3 rounded-2xl font-bold hover:bg-emerald-600 transition-colors shadow-sm">
              <Check className="w-5 h-5" />
              <span>Contratar (A Prueba)</span>
            </button>
            <button onClick={handleReject} className="flex items-center space-x-2 bg-rose-500 text-white px-6 py-3 rounded-2xl font-bold hover:bg-rose-600 transition-colors shadow-sm">
              <X className="w-5 h-5" />
              <span>Rechazar</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-k-bg-card border border-k-border rounded-3xl p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-black text-k-text-h text-lg">Documentos</h3>
          </div>
          
          {app.documents?.length ? (
            <div className="space-y-3">
              {app.documents.map(doc => (
                <a key={doc.id} href={doc.url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 border border-k-border rounded-xl hover:bg-k-bg-secondary transition-colors">
                  <span className="font-bold text-sm text-k-text-h">{doc.document_type}</span>
                  <span className="text-xs text-k-accent font-bold">Ver / Descargar</span>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-k-text-b text-sm">No hay documentos subidos.</p>
          )}
        </div>

        <div className="bg-k-bg-card border border-k-border rounded-3xl p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="font-black text-k-text-h text-lg">Historial</h3>
          </div>
          
          <div className="space-y-4">
            {app.statusLogs?.map(log => (
              <div key={log.id} className="relative pl-6 border-l-2 border-k-border pb-4 last:pb-0 last:border-0">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-k-bg-card border-2 border-k-accent"></div>
                <p className="text-xs text-k-text-b mb-1">{new Date(log.created_at).toLocaleString()}</p>
                <p className="text-sm font-bold text-k-text-h">
                  {log.from_status || 'N/A'} <span className="text-k-text-b font-normal mx-1">→</span> {log.to_status}
                </p>
                {log.notes && <p className="text-sm text-k-text-b mt-1">{log.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
