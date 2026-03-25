// src/features/gondolas/CrearOrdenModal.tsx
import { useEffect, useState } from "react";
import { X, User } from "lucide-react";
import api from "@/lib/http";
import { createOrden, getGondola } from "./api";
import type { Gondola, GondolaOrden, GondolaProducto } from "./types";
import { UNIDADES } from "./utils";

function cx(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(" ");
}

type Empleado = { id: string; name: string; position_title?: string | null };

type Props = {
  gondola: Gondola;
  onClose: () => void;
  onCreated: (orden: GondolaOrden) => void;
};

export default function CrearOrdenModal({
  gondola,
  onClose,
  onCreated,
}: Props) {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [productos, setProductos] = useState<GondolaProducto[]>([]);
  const [selectedEmp, setSelectedEmp] = useState("");
  const [notas, setNotas] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loadingEmps, setLoadingEmps] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/empleados").then((r) => {
        // La API puede devolver { data: [...] } o un array directo
        const list = Array.isArray(r.data) ? r.data : (r.data?.data ?? []);
        return list.filter((e: any) => e.activo !== false);
      }),
      getGondola(gondola.id).then(
        (g) => g.productos?.filter((p) => p.activo) ?? [],
      ),
    ])
      .then(([emps, prods]) => {
        setEmpleados(
          emps.map((e: any) => ({
            id: String(e.id),
            name: e.name ?? e.full_name ?? "—",
            position_title: e.position_title ?? null,
          })),
        );
        setProductos(prods);
      })
      .finally(() => setLoadingEmps(false));
  }, [gondola.id]);

  const productosActivos = productos.filter((p) => p.activo);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEmp) {
      setErr("Selecciona un empleado");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const orden = await createOrden({
        gondola_id: gondola.id,
        empleado_id: selectedEmp,
        notas: notas.trim() || undefined,
      });
      onCreated(orden);
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "Error al crear la orden");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-obsidian/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden animate-in-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-100">
          <div>
            <div className="text-lg font-black text-obsidian tracking-tight">
              Nueva orden de relleno
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

        <form onSubmit={submit} className="p-6 space-y-5">
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
                        {emp.position_title && (
                          <div className="text-xs text-neutral-400">
                            {emp.position_title}
                          </div>
                        )}
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

          {/* Nota */}
          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">
              Nota para el empleado{" "}
              <span className="text-neutral-300">(opcional)</span>
            </label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={2}
              placeholder="Ej. Priorizar los productos del primer estante..."
              className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-medium text-obsidian outline-none focus:border-obsidian focus:ring-2 focus:ring-obsidian/10 transition-all resize-none"
            />
          </div>

          {/* Preview de productos */}
          <div className="rounded-2xl bg-neutral-50 border border-neutral-100 p-4">
            <div className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-2">
              Se incluirán {productosActivos.length} productos
            </div>
            <div className="flex flex-wrap gap-1.5">
              {productosActivos.slice(0, 8).map((p) => (
                <span
                  key={p.id}
                  className="inline-flex items-center rounded-xl bg-white border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-600"
                >
                  {p.nombre}
                  <span className="ml-1 text-[10px] text-neutral-400">
                    {UNIDADES[p.unidad]}
                  </span>
                </span>
              ))}
              {productosActivos.length > 8 && (
                <span className="inline-flex items-center rounded-xl bg-neutral-100 border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-500">
                  +{productosActivos.length - 8} más
                </span>
              )}
              {productosActivos.length === 0 && (
                <span className="text-xs text-neutral-400 font-medium">
                  Esta góndola no tiene productos activos.
                </span>
              )}
            </div>
          </div>

          {err && (
            <div className="rounded-2xl bg-rose-50 border border-rose-100 px-4 py-3 text-sm text-rose-700 font-medium">
              {err}
            </div>
          )}

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
              disabled={busy || !selectedEmp || productosActivos.length === 0}
              className={cx(
                "flex-1 h-12 rounded-2xl text-sm font-bold text-white transition-all shadow-sm",
                busy || !selectedEmp || productosActivos.length === 0
                  ? "bg-obsidian/50 cursor-not-allowed"
                  : "bg-obsidian hover:bg-gold",
              )}
            >
              {busy ? "Creando..." : "Crear y asignar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
