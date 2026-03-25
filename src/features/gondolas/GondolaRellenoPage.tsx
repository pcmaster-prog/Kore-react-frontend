// src/features/gondolas/GondolaRellenoPage.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Package } from "lucide-react";
import { getOrden, iniciarOrden, completarOrden } from "./api";
import type { GondolaOrden, GondolaOrdenItem } from "./types";
import { STATUS_CONFIG, UNIDADES } from "./utils";
import EvidenciaUploader from "./EvidenciaUploader";

function cx(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(" ");
}

export default function GondolaRellenoPage() {
  const { ordenId } = useParams<{ ordenId: string }>();
  const nav = useNavigate();

  const [orden, setOrden] = useState<GondolaOrden | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Cantidades locales
  const [cantidades, setCantidades] = useState<Record<string, number>>({});
  const [notas, setNotas] = useState("");
  const [evidencia, setEvidencia] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);

  async function load() {
    if (!ordenId) return;
    setLoading(true);
    setErr(null);
    try {
      const o = await getOrden(ordenId);
      setOrden(o);
      // Iniciar si está pendiente
      if (o.status === "pendiente") {
        try {
          const iniciada = await iniciarOrden(o.id);
          setOrden(iniciada);
          initCantidades(iniciada.items);
        } catch {
          initCantidades(o.items);
        }
      } else {
        initCantidades(o.items);
      }
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "Error cargando la orden");
    } finally {
      setLoading(false);
    }
  }

  function initCantidades(items: GondolaOrdenItem[]) {
    const init: Record<string, number> = {};
    items.forEach((it) => {
      init[it.id] = it.cantidad ?? 0;
    });
    setCantidades(init);
  }

  useEffect(() => {
    load();
  }, [ordenId]);

  function adjustCant(itemId: string, delta: number) {
    setCantidades((prev) => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] ?? 0) + delta),
    }));
  }

  const totalLlenados = Object.values(cantidades).filter((v) => v > 0).length;
  const totalItems = orden?.items?.length ?? 0;
  const canSubmit = totalLlenados > 0;

  async function handleCompletar() {
    if (!orden || !canSubmit) return;

    if (!evidencia) {
      const ok = window.confirm(
        "¿Seguro? No agregaste foto de evidencia. ¿Continuar sin evidencia?",
      );
      if (!ok) return;
    }

    setSubmitting(true);
    setSubmitErr(null);
    try {
      await completarOrden(orden.id, {
        items: order_items_payload(),
        notas_empleado: notas.trim() || undefined,
        evidencia: evidencia ?? undefined,
      });
      nav(-1);
    } catch (e: any) {
      setSubmitErr(e?.response?.data?.message ?? "Error al completar la orden");
    } finally {
      setSubmitting(false);
    }
  }

  function order_items_payload() {
    return (orden?.items ?? []).map((it) => ({
      id: it.id,
      cantidad: cantidades[it.id] ?? 0,
    }));
  }

  const statusCfg = orden
    ? (STATUS_CONFIG[orden.status] ?? {
        label: orden.status,
        color: "bg-neutral-100 text-neutral-600 border-neutral-200",
      })
    : null;
  const isReadonly = orden
    ? ["completado", "aprobado"].includes(orden.status)
    : false;

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-7 w-7 border-2 border-neutral-200 border-t-obsidian rounded-full animate-spin" />
      </div>
    );

  if (err || !orden)
    return (
      <div className="p-6">
        <button
          onClick={() => nav(-1)}
          className="mb-4 flex items-center gap-2 text-sm font-bold text-neutral-500 hover:text-obsidian transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Volver
        </button>
        <div className="rounded-2xl bg-rose-50 border border-rose-100 px-5 py-4 text-sm text-rose-700 font-medium">
          {err ?? "Orden no encontrada"}
        </div>
      </div>
    );

  return (
    <div className="flex flex-col min-h-screen bg-bone max-w-xl mx-auto">
      {/* Header fijo */}
      <div className="sticky top-0 z-10 bg-white border-b border-neutral-100 shadow-sm px-4 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => nav(-1)}
            className="h-10 w-10 rounded-xl bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors shrink-0"
          >
            <ArrowLeft className="h-4 w-4 text-obsidian" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="text-base font-black text-obsidian tracking-tight truncate">
              {orden.gondola.nombre}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-neutral-400 font-medium">
                {totalLlenados}/{totalItems} productos llenados
              </span>
              {statusCfg && (
                <span
                  className={cx(
                    "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold",
                    statusCfg.color,
                  )}
                >
                  {statusCfg.label}
                </span>
              )}
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-1.5 rounded-full bg-neutral-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-300"
            style={{
              width:
                totalItems > 0
                  ? `${(totalLlenados / totalItems) * 100}%`
                  : "0%",
            }}
          />
        </div>
      </div>

      {/* Banner rechazo */}
      {orden.status === "rechazado" && orden.notas_rechazo && (
        <div className="mx-4 mt-4 rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-800 font-medium">
          <span className="font-black">Motivo del rechazo: </span>
          {orden.notas_rechazo}
        </div>
      )}

      {/* Lista de productos — scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-48">
        {(orden.items || []).map((item) => {
          const cant = cantidades[item.id] ?? 0;
          const filled = cant > 0;
          return (
            <div
              key={item.id}
              className={cx(
                "rounded-[24px] border p-4 flex items-center gap-4 transition-all",
                filled
                  ? "border-emerald-200 bg-emerald-50/60"
                  : "border-neutral-100 bg-white",
              )}
            >
              {/* Foto */}
              <div className="h-14 w-14 shrink-0 rounded-2xl overflow-hidden border border-neutral-100">
                {item.foto_url ? (
                  <img
                    src={item.foto_url}
                    alt={item.nombre}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-neutral-100 flex items-center justify-center">
                    <Package className="h-6 w-6 text-neutral-400" />
                  </div>
                )}
              </div>

              {/* Info + controles */}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-neutral-400 uppercase">
                  {item.clave}
                </div>
                <div className="text-sm font-bold text-obsidian truncate leading-tight">
                  {item.nombre}
                </div>

                <div className="flex items-center gap-2 mt-2">
                  {/* - */}
                  <button
                    type="button"
                    onClick={() => adjustCant(item.id, -1)}
                    disabled={isReadonly || cant <= 0}
                    className="h-9 w-9 rounded-xl bg-neutral-100 hover:bg-neutral-200 active:scale-95 flex items-center justify-center text-xl font-black text-neutral-700 transition-all disabled:opacity-30"
                  >
                    −
                  </button>

                  {/* Valor */}
                  <input
                    type="number"
                    min={0}
                    value={cant}
                    readOnly={isReadonly}
                    onChange={(e) => {
                      const v = parseInt(e.target.value) || 0;
                      setCantidades((prev) => ({
                        ...prev,
                        [item.id]: Math.max(0, v),
                      }));
                    }}
                    className={cx(
                      "h-9 w-16 text-center rounded-xl border text-sm font-black outline-none transition-all",
                      filled
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800 focus:border-emerald-500"
                        : "border-neutral-200 bg-neutral-50 text-obsidian focus:border-obsidian",
                    )}
                  />

                  {/* + */}
                  <button
                    type="button"
                    onClick={() => adjustCant(item.id, 1)}
                    disabled={isReadonly}
                    className="h-9 w-9 rounded-xl bg-obsidian hover:bg-gold active:scale-95 flex items-center justify-center text-xl font-black text-white transition-all disabled:opacity-30"
                  >
                    +
                  </button>

                  {/* Unidad */}
                  <span className="ml-1 text-xs font-bold text-neutral-400 uppercase">
                    {UNIDADES[item.unidad] ?? item.unidad}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer fijo */}
      {!isReadonly && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-xl bg-white border-t border-neutral-100 shadow-lg p-4 space-y-3 z-10">
          {/* Evidencia */}
          <EvidenciaUploader onChange={setEvidencia} disabled={submitting} />

          {/* Notas */}
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={1}
            placeholder="Notas para el admin (opcional)..."
            disabled={submitting}
            className="w-full rounded-2xl border border-neutral-200 px-4 py-2.5 text-sm font-medium text-obsidian outline-none focus:border-obsidian focus:ring-2 focus:ring-obsidian/10 transition-all resize-none disabled:opacity-60"
          />

          {submitErr && (
            <div className="rounded-xl bg-rose-50 border border-rose-100 px-4 py-2.5 text-sm text-rose-700 font-medium">
              {submitErr}
            </div>
          )}

          <button
            type="button"
            onClick={handleCompletar}
            disabled={submitting || !canSubmit}
            className={cx(
              "w-full h-14 rounded-2xl text-sm font-black tracking-wide transition-all shadow-md",
              canSubmit && !submitting
                ? "bg-obsidian text-white hover:bg-gold active:scale-98"
                : "bg-neutral-200 text-neutral-400 cursor-not-allowed",
            )}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Enviando...
              </span>
            ) : canSubmit ? (
              "✓ Marcar como completado"
            ) : (
              "Llena al menos 1 cantidad"
            )}
          </button>
        </div>
      )}

      {/* Readonly banner */}
      {isReadonly && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-xl bg-emerald-600 px-6 py-4 text-center text-sm font-bold text-white z-10">
          {orden.status === "aprobado"
            ? "✓ Orden Aprobada"
            : "⏳ Orden en revisión"}
        </div>
      )}
    </div>
  );
}
