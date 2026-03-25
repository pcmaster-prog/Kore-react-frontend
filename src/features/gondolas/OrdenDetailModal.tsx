// src/features/gondolas/OrdenDetailModal.tsx
import { useState } from "react";
import { X, CheckCircle, XCircle, Package } from "lucide-react";
import { aprobarOrden, rechazarOrden } from "./api";
import type { GondolaOrden } from "./types";
import { STATUS_CONFIG, UNIDADES } from "./utils";

function cx(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(" ");
}

type Props = {
  orden: GondolaOrden;
  onClose: () => void;
  onUpdated: (o: GondolaOrden) => void;
};

export default function OrdenDetailModal({ orden, onClose, onUpdated }: Props) {
  const [rejectionNote, setRejectionNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const statusCfg = STATUS_CONFIG[orden.status] ?? {
    label: orden.status,
    color: "bg-neutral-100 text-neutral-600 border-neutral-200",
  };

  async function handleAprobar() {
    setBusy(true);
    setErr(null);
    try {
      const updated = await aprobarOrden(orden.id);
      onUpdated(updated);
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "Error al aprobar");
    } finally {
      setBusy(false);
    }
  }

  async function handleRechazar() {
    if (!rejectionNote.trim()) {
      setErr("Escribe una nota de rechazo");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const updated = await rechazarOrden(orden.id, rejectionNote.trim());
      onUpdated(updated);
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "Error al rechazar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-obsidian/40 backdrop-blur-sm"
          onClick={onClose}
        />
        <div className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in-up">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-100">
            <div className="flex items-center gap-3 min-w-0">
              <div className="min-w-0">
                <div className="text-lg font-black text-obsidian tracking-tight truncate">
                  {orden.gondola.nombre}
                </div>
                <div className="text-xs text-neutral-400 font-medium mt-0.5">
                  Orden de relleno
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span
                className={cx(
                  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold",
                  statusCfg.color,
                )}
              >
                {statusCfg.label}
              </span>
              <button
                onClick={onClose}
                className="h-9 w-9 rounded-xl bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4 text-neutral-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto flex-1 p-6 space-y-6">
            {/* Info */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: "Empleado", val: orden.empleado.full_name },
                {
                  label: "Asignada",
                  val: new Date(orden.created_at).toLocaleString("es-MX", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }),
                },
                {
                  label: "Completada",
                  val: orden.completed_at
                    ? new Date(orden.completed_at).toLocaleString("es-MX", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : "—",
                },
              ].map(({ label, val }) => (
                <div
                  key={label}
                  className="rounded-2xl bg-neutral-50 border border-neutral-100 px-4 py-3"
                >
                  <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                    {label}
                  </div>
                  <div className="text-sm font-bold text-obsidian mt-1 truncate">
                    {val}
                  </div>
                </div>
              ))}
            </div>

            {/* Cantidades */}
            <div>
              <div className="text-sm font-black text-obsidian uppercase tracking-widest mb-3">
                Cantidades registradas
              </div>
              <div className="rounded-2xl border border-neutral-100 overflow-hidden">
                {orden.items.length === 0 ? (
                  <div className="p-8 text-center text-sm text-neutral-400 font-medium">
                    Sin productos
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-neutral-50 border-b border-neutral-100">
                      <tr>
                        <th className="text-left px-4 py-2.5 text-[10px] font-bold text-neutral-400 uppercase tracking-widest w-14">
                          Foto
                        </th>
                        <th className="text-left px-4 py-2.5 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                          Clave
                        </th>
                        <th className="text-left px-4 py-2.5 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                          Producto
                        </th>
                        <th className="text-right px-4 py-2.5 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                          Cant.
                        </th>
                        <th className="text-left px-4 py-2.5 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                          Unidad
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {orden.items.map((item, i) => (
                        <tr
                          key={item.id}
                          className={cx(
                            "border-b border-neutral-50 last:border-0",
                            i % 2 === 0 ? "bg-white" : "bg-neutral-50/50",
                          )}
                        >
                          <td className="px-4 py-3">
                            {item.foto_url ? (
                              <img
                                src={item.foto_url}
                                alt={item.nombre}
                                className="h-10 w-10 rounded-xl object-cover border border-neutral-100"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-xl bg-neutral-100 flex items-center justify-center">
                                <Package className="h-4 w-4 text-neutral-400" />
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs font-bold text-neutral-400">
                            {item.clave ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-obsidian">
                            {item.nombre}
                          </td>
                          <td
                            className={cx(
                              "px-4 py-3 text-right text-sm font-black",
                              item.cantidad != null && item.cantidad > 0
                                ? "text-emerald-700"
                                : "text-neutral-300",
                            )}
                          >
                            {item.cantidad != null && item.cantidad > 0
                              ? item.cantidad
                              : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex rounded-full border border-neutral-200 px-2 py-0.5 text-xs font-bold text-neutral-500 bg-neutral-50">
                              {UNIDADES[item.unidad] ?? item.unidad}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Evidencia */}
            <div>
              <div className="text-sm font-black text-obsidian uppercase tracking-widest mb-3">
                Evidencia
              </div>
              {orden.evidencia_url ? (
                <button
                  onClick={() => setLightboxUrl(orden.evidencia_url!)}
                  className="block rounded-2xl overflow-hidden border border-neutral-100 hover:opacity-90 transition-opacity"
                >
                  <img
                    src={orden.evidencia_url}
                    alt="Evidencia"
                    className="w-full max-h-48 object-cover"
                  />
                  <div className="px-4 py-2 text-xs font-bold text-neutral-400 uppercase tracking-widest text-center">
                    Clic para ampliar
                  </div>
                </button>
              ) : (
                <div className="rounded-2xl bg-neutral-50 border border-neutral-100 p-6 text-center text-sm text-neutral-400 font-medium">
                  Sin evidencia
                </div>
              )}
            </div>

            {/* Notas del empleado */}
            {orden.notas_empleado && (
              <div>
                <div className="text-sm font-black text-obsidian uppercase tracking-widest mb-3">
                  Notas del empleado
                </div>
                <div className="rounded-2xl bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-800 font-medium">
                  {orden.notas_empleado}
                </div>
              </div>
            )}

            {/* Banners de estado final */}
            {orden.status === "aprobado" && (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-5 py-4 flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-sm font-black text-emerald-800">
                    Orden Aprobada
                  </div>
                  {orden.approved_at && (
                    <div className="text-xs text-emerald-600 mt-0.5">
                      {new Date(orden.approved_at).toLocaleString("es-MX", {
                        dateStyle: "long",
                        timeStyle: "short",
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {orden.status === "rechazado" && (
              <div className="rounded-2xl bg-rose-50 border border-rose-200 px-5 py-4">
                <div className="flex items-center gap-3 mb-2">
                  <XCircle className="h-5 w-5 text-rose-600 shrink-0" />
                  <div className="text-sm font-black text-rose-800">
                    Orden Rechazada
                  </div>
                </div>
                {orden.notas_rechazo && (
                  <p className="text-sm text-rose-700 font-medium">
                    {orden.notas_rechazo}
                  </p>
                )}
                <p className="text-xs text-rose-500 mt-2">
                  El empleado puede volver a completar la orden.
                </p>
              </div>
            )}

            {err && (
              <div className="rounded-2xl bg-rose-50 border border-rose-100 px-4 py-3 text-sm text-rose-700 font-medium">
                {err}
              </div>
            )}

            {/* Acciones si status = completado */}
            {orden.status === "completado" && (
              <div className="border-t border-neutral-100 pt-6 space-y-4">
                <div className="text-sm font-black text-obsidian uppercase tracking-widest">
                  Revisión
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleAprobar}
                    disabled={busy}
                    className="flex-1 h-12 rounded-2xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <CheckCircle className="h-4 w-4" />
                    {busy ? "Procesando..." : "Aprobar"}
                  </button>
                </div>
                <div className="flex gap-2">
                  <textarea
                    value={rejectionNote}
                    onChange={(e) => setRejectionNote(e.target.value)}
                    placeholder="Escribe el motivo del rechazo..."
                    rows={2}
                    className="flex-1 rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-medium text-obsidian outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all resize-none"
                  />
                  <button
                    onClick={handleRechazar}
                    disabled={busy}
                    className="h-full px-5 rounded-2xl bg-rose-600 text-white text-sm font-bold hover:bg-rose-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 shrink-0"
                  >
                    <XCircle className="h-4 w-4" />
                    {busy ? "..." : "Rechazar"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80"
          onClick={() => setLightboxUrl(null)}
        >
          <img
            src={lightboxUrl}
            alt="Evidencia"
            className="max-w-full max-h-full rounded-2xl object-contain"
          />
        </div>
      )}
    </>
  );
}
