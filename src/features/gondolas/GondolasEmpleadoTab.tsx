// src/features/gondolas/GondolasEmpleadoTab.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutGrid, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { misOrdenesGondola } from "./api";
import type { GondolaOrden } from "./types";
import { STATUS_CONFIG, tiempoRelativo } from "./utils";

function cx(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(" ");
}

export default function GondolasEmpleadoTab() {
  const nav = useNavigate();
  const [ordenes, setOrdenes] = useState<GondolaOrden[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setErr(null);
    misOrdenesGondola()
      .then(setOrdenes)
      .catch((e: any) =>
        setErr(e?.response?.data?.message ?? "Error cargando órdenes"),
      )
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toDateString();

  const porHacer = ordenes.filter((o) =>
    ["pendiente", "en_proceso", "rechazado"].includes(o.status),
  );
  const completadasHoy = ordenes.filter(
    (o) =>
      ["completado", "aprobado"].includes(o.status) &&
      new Date(o.completed_at ?? o.created_at).toDateString() === today,
  );

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-7 w-7 border-2 border-neutral-200 border-t-obsidian rounded-full animate-spin" />
      </div>
    );

  if (err)
    return (
      <div className="rounded-2xl bg-rose-50 border border-rose-100 px-5 py-4 flex items-center gap-3 text-sm text-rose-700 font-medium">
        <AlertCircle className="h-4 w-4 shrink-0" /> {err}
      </div>
    );

  if (ordenes.length === 0)
    return (
      <div className="rounded-[32px] border border-dashed border-neutral-200 p-16 text-center">
        <LayoutGrid className="h-10 w-10 text-neutral-300 mx-auto mb-4" />
        <div className="text-lg font-black text-neutral-400">
          Sin órdenes asignadas
        </div>
        <p className="text-sm text-neutral-400 font-medium mt-1">
          Tu supervisor te asignará órdenes de relleno.
        </p>
      </div>
    );

  return (
    <div className="space-y-8">
      {/* Por hacer */}
      {porHacer.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-amber-600" />
            <h2 className="text-sm font-black text-obsidian uppercase tracking-widest">
              Por hacer ({porHacer.length})
            </h2>
          </div>
          <div className="space-y-3">
            {porHacer.map((o) => (
              <OrdenCard
                key={o.id}
                orden={o}
                onNavigate={(id) => nav(`/app/employee/gondola-relleno/${id}`)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Completadas hoy */}
      {completadasHoy.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-black text-obsidian uppercase tracking-widest">
              Completadas hoy ({completadasHoy.length})
            </h2>
          </div>
          <div className="space-y-3">
            {completadasHoy.map((o) => (
              <OrdenCard
                key={o.id}
                orden={o}
                onNavigate={(id) => nav(`/app/employee/gondola-relleno/${id}`)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function OrdenCard({
  orden,
  onNavigate,
}: {
  orden: GondolaOrden;
  onNavigate: (id: string) => void;
}) {
  const statusCfg = STATUS_CONFIG[orden.status] ?? {
    label: orden.status,
    color: "bg-neutral-100 text-neutral-600 border-neutral-200",
  };
  const isRechazado = orden.status === "rechazado";

  const btnLabel =
    orden.status === "pendiente"
      ? "▶ Iniciar relleno"
      : orden.status === "en_proceso"
        ? "→ Continuar"
        : orden.status === "rechazado"
          ? "↩ Volver a completar"
          : "👁 Ver detalle";

  const btnCls =
    orden.status === "pendiente"
      ? "bg-obsidian hover:bg-gold text-white"
      : orden.status === "en_proceso"
        ? "bg-blue-600 hover:bg-blue-700 text-white"
        : orden.status === "rechazado"
          ? "bg-rose-600 hover:bg-rose-700 text-white"
          : "border border-neutral-200 text-obsidian hover:bg-neutral-50";

  return (
    <div
      className={cx(
        "rounded-[28px] border p-5 flex flex-col gap-4 transition-all",
        isRechazado
          ? "border-rose-200 bg-rose-50/30"
          : "border-neutral-100 bg-white hover:shadow-sm",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-lg font-black text-obsidian tracking-tight truncate">
            {orden.gondola.nombre}
          </div>
          <div className="text-xs text-neutral-400 font-medium mt-1">
            {orden.items.length} productos · Asignada{" "}
            {tiempoRelativo(orden.created_at)}
          </div>
        </div>
        <span
          className={cx(
            "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold shrink-0 mt-0.5",
            statusCfg.color,
          )}
        >
          {statusCfg.label}
        </span>
      </div>

      {/* Banner rechazo */}
      {isRechazado && orden.notas_rechazo && (
        <div className="rounded-2xl bg-rose-100 border border-rose-200 px-4 py-3 text-sm text-rose-800 font-medium">
          <span className="font-black">Motivo: </span>
          {orden.notas_rechazo}
        </div>
      )}

      <button
        onClick={() => onNavigate(orden.id)}
        className={cx(
          "w-full h-12 rounded-2xl text-sm font-bold transition-all shadow-sm",
          btnCls,
        )}
      >
        {btnLabel}
      </button>
    </div>
  );
}
