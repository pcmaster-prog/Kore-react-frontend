import { useState } from "react";
import { MessageSquare, Send, CheckCircle, AlertCircle } from "lucide-react";
import http from "@/lib/http";

export default function WhatsAppTestWidget() {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("Hola, esto es un mensaje de prueba automático desde Kore HR.");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;

    setLoading(true);
    setStatus('idle');
    try {
      const response = await http.post('/whatsapp/test', { phone, message });
      if (response.data.success) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error(error);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-k-bg-card border border-k-border rounded-3xl p-6 shadow-k-card mt-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-2xl text-green-500 bg-green-500/10">
          <MessageSquare className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-lg font-black text-k-text-h tracking-tight">Prueba de WhatsApp</h3>
          <p className="text-sm text-k-text-b">Simula el envío de un mensaje directo por Evolution API.</p>
        </div>
      </div>

      <form onSubmit={handleTest} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-k-text-b mb-1">Número de Teléfono (10 dígitos)</label>
          <input
            type="text"
            className="w-full bg-k-bg border border-k-border rounded-xl px-4 py-3 text-k-text-h focus:outline-none focus:border-k-accent"
            placeholder="Ej: 4621234567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            pattern="[0-9]{10}"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-k-text-b mb-1">Mensaje de Prueba</label>
          <textarea
            className="w-full bg-k-bg border border-k-border rounded-xl px-4 py-3 text-k-text-h focus:outline-none focus:border-k-accent min-h-[80px]"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
        </div>
        
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? 'Enviando...' : (
              <>
                <Send className="w-5 h-5" /> Enviar Mensaje
              </>
            )}
          </button>
          
          {status === 'success' && (
            <div className="flex items-center gap-2 text-green-500 bg-green-500/10 px-4 py-2 rounded-xl">
              <CheckCircle className="w-5 h-5" />
              <span className="font-bold text-sm">Enviado con éxito</span>
            </div>
          )}
          {status === 'error' && (
            <div className="flex items-center gap-2 text-red-500 bg-red-500/10 px-4 py-2 rounded-xl">
              <AlertCircle className="w-5 h-5" />
              <span className="font-bold text-sm">Falló el envío</span>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
