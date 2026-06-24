// src/features/gondolas/GondolasManagerTab.tsx
import { useEffect, useState } from "react";
import {
  Plus,
  LayoutGrid,
  Box,
  ClipboardList,
  AlertCircle,
  X,
  User,
  Wrench,
} from "lucide-react";
import api from "@/lib/http";
import { listGondolas, listOrdenes } from "./api";
import type { Gondola, GondolaOrden } from "./types";
import { STATUS_CONFIG, tiempoRelativo } from "./utils";
import GondolaFormModal from "./GondolaFormModal";
import GondolaDetailModal from "./GondolaDetailModal";
import CrearOrdenModal from "./CrearOrdenModal";
import OrdenDetailModal from "./OrdenDetailModal";
import { useGenerateRefillTask } from "./hooks/useGondolaProducts";

import { cx } from "@/lib/utils";
type InnerTab = "gondolas" | "ordenes";

// ── GondolaCard ───────────────────────────────────────────────────────────────
function GondolaCard({
  gondola,
  onVerProductos,
  onCrearOrden,
  onGenerarTarea,
}: {
  gondola: Gondola;
  onVerProductos: () => void;
  onCrearOrden: () => void;
  onGenerarTarea: () => void;
}) {
  const hasPendientes = gondola.ordenes_pendientes > 0;
  const isRecentlyApproved =
    gondola.ultima_orden?.status === "aprobado" &&
    gondola.ultima_orden.created_at &&
    Date.now() - new Date(gondola.ultima_orden.created_at).getTime() <
      2 * 3_600_000;

  const statusCfg = gondola.ultima_orden
    ? STATUS_CONFIG[gondola.ultima_orden.status]
    : null;

  return (
    <div
      className={cx(
        "relative bg-white rounded-[28px] border p-5 transition-all hover:shadow-md flex flex-col gap-4",
        hasPendientes
          ? "border-amber-200 shadow-amber-50/80 shadow-md"
          : "border-neutral-100",
      )}
    >
      {/* Badge pendientes */}
      {hasPendientes && (
        <div className="absolute top-4 right-4 h-7 min-w-7 rounded-full bg-amber-500 text-white text-xs font-black flex items-center justify-center px-2">
          {gondola.ordenes_pendientes}
        </div>
      )}

      <div className="flex items-start gap-3">
        <div
          className={cx(
            "h-11 w-11 rounded-2xl flex items-center justify-center shrink-0",
            hasPendientes ? "bg-amber-100" : "bg-neutral-100",
          )}
        >
          <LayoutGrid
            className={cx(
              "h-5 w-5",
              hasPendientes ? "text-amber-700" : "text-neutral-500",
            )}
          />
        </div>
        <div className="min-w-0 flex-1 pr-12">
          <div className="text-base font-black text-obsidian tracking-tight truncate">
            {gondola.nombre}
          </div>
          {gondola.ubicacion && (
            <div className="text-xs text-neutral-400 font-medium mt-0.5 truncate">
              {gondola.ubicacion}
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 rounded-xl bg-neutral-50 border border-neutral-100 px-3 py-1.5">
          <Box className="h-3.5 w-3.5 text-neutral-400" />
          <span className="text-xs font-bold text-neutral-600">
            {gondola.productos_count} productos
          </span>
        </div>

        {gondola.ultima_orden ? (
          <div className="flex items-center gap-1.5">
            {isRecentlyApproved && (
              <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
            )}
            <span
              className={cx(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold",
                statusCfg?.color ??
                  "bg-neutral-100 text-neutral-600 border-neutral-200",
              )}
            >
              {statusCfg?.label}
            </span>
            <span className="text-[10px] text-neutral-400">
              {tiempoRelativo(gondola.ultima_orden.created_at)}
            </span>
          </div>
        ) : (
          <span className="text-xs text-neutral-400 font-medium">
            Sin rellenos aún
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1 border-t border-neutral-50">
        <button
          onClick={onVerProductos}
          className="flex-1 h-10 rounded-2xl border border-neutral-200 text-xs font-bold text-obsidian hover:bg-neutral-50 transition-colors"
        >
          Ver productos
        </button>
        <button
          onClick={onGenerarTarea}
          className="h-10 px-3 rounded-2xl border border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-neutral-50 transition-colors"
        >
          Generar tarea
        </button>
        <button
          onClick={onCrearOrden}
          className="flex-1 h-10 rounded-2xl bg-obsidian text-white text-xs font-bold hover:bg-gold transition-colors shadow-sm"
        >
          Crear orden
        </button>
      </div>
    </div>
  );
}

// ── Mini modal generar tarea ──────────────────────────────────────────────────
function GenerarTareaMiniModal({
  gondola,
  onClose,
  onSuccess,
}: {
  gondola: Gondola;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [empleados, setEmpleados] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [selectedEmp, setSelectedEmp] = useState("");
  const [notas, setNotas] = useState("");
  const [loadingEmps, setLoadingEmps] = useState(false);
  const generateRefillTask = useGenerateRefillTask();

  useEffect(() => {
    setLoadingEmps(true);
    api
      .get("/empleados")
      .then((r) => {
        const list = Array.isArray(r.data) ? r.data : r.data?.data ?? [];
        setEmpleados(
          list
            .filter((e: any) => e.activo !== false)
            .map((e: any) => ({
              id: String(e.id),
              name: e.name ?? e.full_name ?? "—",
            })),
        );
      })
      .finally(() => setLoadingEmps(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEmp) return;
    try {
      await generateRefillTask.mutateAsync({
        gondolaId: gondola.id,
        data: {
          empleado_ids: [selectedEmp],
          notas: notas.trim() || undefined,
        },
      });
      alert("Tarea de relleno generada");
      onSuccess();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Error al generar tarea");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-obsidian/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden animate-in-up">
        <div className="flex items-center justify-between p-6 border-b border-neutral-100">
          <div>
            <div className="text-lg font-black text-obsidian tracking-tight">
              Generar tarea de relleno
            </div>
            <div className="text-xs text-neutral-400 font-medium mt-0.5">
              {gondola.nombre}
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-xl bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4 text-neutral-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Selector de empleado */}
          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">
              Empleado a asignar <span className="text-rose-500">*</span>
            </label>
            {loadingEmps ? (
              <div className="h-12 rounded-2xl bg-neutral-100 animate-pulse" />
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {empleados.length === 0 ? (
                  <div className="text-sm text-neutral-400 font-medium py-4 text-center">
                    Sin empleados disponibles
                  </div>
                ) : (
                  empleados.map((emp) => (
                    <button
                      type="button"
                      key={emp.id}
                      onClick={() => setSelectedEmp(emp.id)}
                      className={cx(
                        "w-full flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all text-left",
                        selectedEmp === emp.id
                          ? "border-obsidian bg-obsidian/5"
                          : "border-neutral-100 bg-white hover:border-neutral-200 hover:bg-neutral-50",
                      )}
                    >
                      <div
                        className={cx(
                          "h-8 w-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0",
                          selectedEmp === emp.id
                            ? "bg-obsidian text-white"
                            : "bg-neutral-100 text-neutral-500",
                        )}
                      >
                        {emp.name[0]?.toUpperCase() ?? (
                          <User className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-obsidian truncate">
                          {emp.name}
                        </div>
                      </div>
                      {selectedEmp === emp.id && (
                        <div className="ml-auto h-4 w-4 rounded-full bg-obsidian flex items-center justify-center shrink-0">
                          <span className="text-white text-[8px]">✓</span>
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">
              Notas <span className="text-neutral-300">(opcional)</span>
            </label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={2}
              placeholder="Ej. Priorizar los productos del primer estante..."
              className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-medium text-obsidian outline-none focus:border-obsidian focus:ring-2 focus:ring-obsidian/10 transition-all resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 rounded-2xl border border-neutral-200 text-sm font-bold text-neutral-500 hover:bg-neutral-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={generateRefillTask.isPending || !selectedEmp}
              className={cx(
                "flex-1 h-12 rounded-2xl text-sm font-bold text-white transition-all shadow-sm flex items-center justify-center gap-2",
                generateRefillTask.isPending || !selectedEmp
                  ? "bg-obsidian/50 cursor-not-allowed"
                  : "bg-obsidian hover:bg-gold",
              )}
            >
              {generateRefillTask.isPending ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Wrench className="h-4 w-4" />
              )}
              {generateRefillTask.isPending
                ? "Generando..."
                : "Generar tarea de relleno"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function GondolasManagerTab() {
  const [tab, setTab] = useState<InnerTab>("gondolas");
  const [gondolas, setGondolas] = useState<Gondola[]>([]);
  const [ordenes, setOrdenes] = useState<GondolaOrden[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Filters for ordenes tab
  const [filterStatus, setFilterStatus] = useState("");

  // Modals
  const [showNewGondola, setShowNewGondola] = useState(false);
  const [selectedGondola, setSelectedGondola] = useState<Gondola | null>(null);
  const [gondolaForOrder, setGondolaForOrder] = useState<Gondola | null>(null);
  const [selectedOrden, setSelectedOrden] = useState<GondolaOrden | null>(null);
  const [gondolaForTask, setGondolaForTask] = useState<Gondola | null>(null);

  async function loadGondolas() {
    setLoading(true);
    setErr(null);
    try {
      const [g, o] = await Promise.all([
        listGondolas(),
        listOrdenes(filterStatus ? { status: filterStatus } : undefined),
      ]);
      setGondolas(g);
      setOrdenes(o);
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "Error cargando góndolas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGondolas();
  }, [filterStatus]);

  return (
    <div className="space-y-6">
      {/* Sub-header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex p-1 bg-neutral-100/50 border border-neutral-100 rounded-full w-fit">
          {[
            {
              key: "gondolas",
              label: "Góndolas",
              icon: <LayoutGrid className="h-3.5 w-3.5" />,
            },
            {
              key: "ordenes",
              label: "Órdenes",
              icon: <ClipboardList className="h-3.5 w-3.5" />,
            },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as InnerTab)}
              className={cx(
                "flex items-center gap-1.5 px-4 h-8 rounded-full text-xs font-bold transition-all duration-300",
                tab === t.key
                  ? "bg-white text-obsidian shadow-sm"
                  : "text-neutral-400 hover:text-obsidian hover:bg-white",
              )}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {tab === "gondolas" && (
          <button
            onClick={() => setShowNewGondola(true)}
            className="h-11 px-5 rounded-2xl bg-obsidian text-sm font-bold text-white shadow-sm hover:bg-gold transition-all flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Nueva Góndola
          </button>
        )}

        {tab === "ordenes" && (
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-11 px-4 rounded-2xl border border-neutral-200 text-sm font-bold text-obsidian bg-white outline-none focus:border-obsidian"
          >
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendientes</option>
            <option value="en_proceso">En proceso</option>
            <option value="completado">Completados</option>
            <option value="aprobado">Aprobados</option>
            <option value="rechazado">Rechazados</option>
          </select>
        )}
      </div>

      {/* Error */}
      {err && (
        <div className="rounded-2xl bg-rose-50 border border-rose-100 px-5 py-4 flex items-center gap-3 text-sm text-rose-700 font-medium">
          <AlertCircle className="h-4 w-4 shrink-0" /> {err}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-7 w-7 border-2 border-neutral-200 border-t-obsidian rounded-full animate-spin" />
        </div>
      )}

      {/* Góndolas grid */}
      {!loading && tab === "gondolas" && (
        <>
          {gondolas.length === 0 ? (
            <div className="rounded-[32px] border border-dashed border-neutral-200 p-16 text-center">
              <LayoutGrid className="h-10 w-10 text-neutral-300 mx-auto mb-4" />
              <div className="text-lg font-black text-neutral-400">
                Sin góndolas configuradas
              </div>
              <p className="text-sm text-neutral-400 font-medium mt-1">
                Crea tu primera góndola para empezar.
              </p>
              <button
                onClick={() => setShowNewGondola(true)}
                className="mt-6 h-11 px-6 rounded-2xl bg-obsidian text-white text-sm font-bold hover:bg-gold transition-colors inline-flex items-center gap-2"
              >
                <Plus className="h-4 w-4" /> Nueva Góndola
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {(gondolas || []).map((g) => (
                <GondolaCard
                  key={g.id}
                  gondola={g}
                  onVerProductos={() => setSelectedGondola(g)}
                  onCrearOrden={() => setGondolaForOrder(g)}
                  onGenerarTarea={() => setGondolaForTask(g)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Órdenes list */}
      {!loading && tab === "ordenes" && (
        <div className="rounded-[32px] border border-neutral-100 bg-white shadow-sm overflow-hidden">
          <div className="p-6 border-b border-neutral-50 bg-neutral-50/50">
            <div className="text-lg font-black text-obsidian tracking-tight">
              Órdenes activas
            </div>
          </div>
          {ordenes.length === 0 ? (
            <div className="p-16 text-center text-sm font-bold text-neutral-400 uppercase tracking-widest">
              Sin órdenes
            </div>
          ) : (
            <div className="divide-y divide-neutral-50">
              {(ordenes || []).map((o) => {
                const cfg = STATUS_CONFIG[o.status] ?? {
                  label: o.status,
                  color: "bg-neutral-100 text-neutral-600 border-neutral-200",
                };
                return (
                  <button
                    key={o.id}
                    onClick={() => setSelectedOrden(o)}
                    className="w-full flex items-center justify-between gap-4 px-6 py-4 hover:bg-neutral-50/80 transition-colors text-left"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-black text-obsidian truncate">
                        {o.gondola.nombre}
                      </div>
                      <div className="text-xs text-neutral-400 mt-0.5">
                        {o.empleado.full_name} · {tiempoRelativo(o.created_at)}
                      </div>
                    </div>
                    <span
                      className={cx(
                        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold shrink-0",
                        cfg.color,
                      )}
                    >
                      {cfg.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showNewGondola && (
        <GondolaFormModal
          onClose={() => setShowNewGondola(false)}
          onSaved={() => {
            setShowNewGondola(false);
            loadGondolas();
          }}
        />
      )}

      {selectedGondola && (
        <GondolaDetailModal
          gondola={selectedGondola}
          onClose={() => setSelectedGondola(null)}
          onRefreshList={loadGondolas}
        />
      )}

      {gondolaForOrder && (
        <CrearOrdenModal
          gondola={gondolaForOrder}
          onClose={() => setGondolaForOrder(null)}
          onCreated={() => {
            setGondolaForOrder(null);
            loadGondolas();
          }}
        />
      )}

      {selectedOrden && (
        <OrdenDetailModal
          orden={selectedOrden}
          onClose={() => setSelectedOrden(null)}
          onUpdated={(updated) => {
            setSelectedOrden(updated);
            setOrdenes((prev) =>
              prev.map((o) => (o.id === updated.id ? updated : o)),
            );
          }}
        />
      )}

      {gondolaForTask && (
        <GenerarTareaMiniModal
          gondola={gondolaForTask}
          onClose={() => setGondolaForTask(null)}
          onSuccess={() => {
            setGondolaForTask(null);
            loadGondolas();
          }}
        />
      )}
    </div>
  );
}
