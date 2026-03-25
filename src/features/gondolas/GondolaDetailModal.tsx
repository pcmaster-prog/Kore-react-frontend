// src/features/gondolas/GondolaDetailModal.tsx
import { useEffect, useRef, useState } from "react";
import { X, Plus, Package, Edit2, Check, Camera } from "lucide-react";
import {
  getGondola,
  addProducto,
  updateProducto,
  uploadFotoProducto,
  listOrdenes,
} from "./api";
import type { Gondola, GondolaProducto, GondolaOrden } from "./types";
import { STATUS_CONFIG, UNIDADES, tiempoRelativo } from "./utils";
import OrdenDetailModal from "./OrdenDetailModal";

function cx(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(" ");
}

type Props = {
  gondola: Gondola;
  onClose: () => void;
  onRefreshList: () => void;
};

type InnerTab = "productos" | "historial";

export default function GondolaDetailModal({
  gondola,
  onClose,
  onRefreshList,
}: Props) {
  const [tab, setTab] = useState<InnerTab>("productos");
  const [productos, setProductos] = useState<GondolaProducto[]>([]);
  const [ordenes, setOrdenes] = useState<GondolaOrden[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrden, setSelectedOrden] = useState<GondolaOrden | null>(null);

  // Formulario agregar producto
  const [showAddForm, setShowAddForm] = useState(false);
  const [addBusy, setAddBusy] = useState(false);
  const [addErr, setAddErr] = useState<string | null>(null);
  const [newNombre, setNewNombre] = useState("");
  const [newClave, setNewClave] = useState("");
  const [newUnidad, setNewUnidad] = useState<string>("pz");
  const [newDesc, setNewDesc] = useState("");

  // Edición inline
  const [editId, setEditId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editBusy, setEditBusy] = useState(false);

  const fotoInputRef = useRef<HTMLInputElement | null>(null);
  const [fotoTargetId, setFotoTargetId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await getGondola(gondola.id);
      setProductos(data.productos ?? []);
      const ords = await listOrdenes({ gondola_id: gondola.id });
      setOrdenes(ords);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [gondola.id]);

  async function handleAddProducto(e: React.FormEvent) {
    e.preventDefault();
    if (!newNombre.trim()) {
      setAddErr("Nombre requerido");
      return;
    }
    setAddBusy(true);
    setAddErr(null);
    try {
      const p = await addProducto(gondola.id, {
        nombre: newNombre.trim(),
        clave: newClave.trim() || undefined,
        unidad: newUnidad,
        descripcion: newDesc.trim() || undefined,
      });
      setProductos((prev) => [...prev, p]);
      setNewNombre("");
      setNewClave("");
      setNewDesc("");
      setNewUnidad("pz");
      setShowAddForm(false);
      onRefreshList();
    } catch (e: any) {
      setAddErr(e?.response?.data?.message ?? "Error al agregar");
    } finally {
      setAddBusy(false);
    }
  }

  async function handleToggleActivo(p: GondolaProducto) {
    try {
      const updated = await updateProducto(gondola.id, p.id, {
        activo: !p.activo,
      });
      setProductos((prev) => prev.map((x) => (x.id === p.id ? updated : x)));
    } catch {
      /* silent */
    }
  }

  async function handleSaveEdit(p: GondolaProducto) {
    if (!editNombre.trim()) return;
    setEditBusy(true);
    try {
      const updated = await updateProducto(gondola.id, p.id, {
        nombre: editNombre.trim(),
      });
      setProductos((prev) => prev.map((x) => (x.id === p.id ? updated : x)));
      setEditId(null);
    } finally {
      setEditBusy(false);
    }
  }

  async function handleFotoChange(file: File) {
    if (!fotoTargetId) return;
    try {
      const { foto_url } = await uploadFotoProducto(
        gondola.id,
        fotoTargetId,
        file,
      );
      setProductos((prev) =>
        prev.map((x) => (x.id === fotoTargetId ? { ...x, foto_url } : x)),
      );
    } catch {
      /* silent */
    }
    setFotoTargetId(null);
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div
          className="absolute inset-0 bg-obsidian/40 backdrop-blur-sm"
          onClick={onClose}
        />
        <div className="relative bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl w-full sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in-up">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-100">
            <div>
              <div className="text-lg font-black text-obsidian tracking-tight">
                {gondola.nombre}
              </div>
              {gondola.ubicacion && (
                <div className="text-xs text-neutral-400 font-medium mt-0.5">
                  {gondola.ubicacion}
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="h-9 w-9 rounded-xl bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors"
            >
              <X className="h-4 w-4 text-neutral-500" />
            </button>
          </div>

          {/* Inner tabs */}
          <div className="flex gap-1 p-3 bg-neutral-50/50 border-b border-neutral-100">
            {(["productos", "historial"] as InnerTab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cx(
                  "flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                  tab === t
                    ? "bg-obsidian text-white shadow-sm"
                    : "text-neutral-400 hover:text-obsidian hover:bg-neutral-100",
                )}
              >
                {t === "productos"
                  ? `Productos (${productos.length})`
                  : "Historial"}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="overflow-y-auto flex-1 p-4 sm:p-6">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-6 w-6 border-2 border-neutral-200 border-t-obsidian rounded-full animate-spin" />
              </div>
            ) : tab === "productos" ? (
              <div className="space-y-3">
                {productos.map((p) => (
                  <div
                    key={p.id}
                    className={cx(
                      "flex items-center gap-3 rounded-2xl border p-3 transition-all",
                      p.activo
                        ? "bg-white border-neutral-100"
                        : "bg-neutral-50 border-neutral-100 opacity-60",
                    )}
                  >
                    {/* Foto */}
                    <button
                      onClick={() => {
                        setFotoTargetId(p.id);
                        fotoInputRef.current?.click();
                      }}
                      className="relative h-12 w-12 shrink-0 rounded-xl overflow-hidden border border-neutral-100 hover:opacity-80 transition-opacity group"
                    >
                      {p.foto_url ? (
                        <img
                          src={p.foto_url}
                          alt={p.nombre}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-neutral-100 flex items-center justify-center">
                          <Package className="h-5 w-5 text-neutral-400" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="h-3 w-3 text-white" />
                      </div>
                    </button>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      {editId === p.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            value={editNombre}
                            onChange={(e) => setEditNombre(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveEdit(p);
                              if (e.key === "Escape") setEditId(null);
                            }}
                            className="flex-1 rounded-xl border border-obsidian/30 px-3 py-1.5 text-sm font-medium outline-none focus:border-obsidian"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveEdit(p)}
                            disabled={editBusy}
                            className="h-8 w-8 rounded-xl bg-emerald-100 hover:bg-emerald-200 flex items-center justify-center transition-colors"
                          >
                            <Check className="h-3.5 w-3.5 text-emerald-700" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-obsidian truncate">
                            {p.nombre}
                          </span>
                          {p.clave && (
                            <span className="text-[10px] font-bold text-neutral-400 uppercase">
                              {p.clave}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex rounded-full border border-neutral-200 px-2 py-0.5 text-[10px] font-bold text-neutral-500 bg-neutral-50">
                          {UNIDADES[p.unidad] ?? p.unidad}
                        </span>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setEditId(p.id);
                          setEditNombre(p.nombre);
                        }}
                        className="h-8 w-8 rounded-xl bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors"
                      >
                        <Edit2 className="h-3.5 w-3.5 text-neutral-500" />
                      </button>
                      <button
                        onClick={() => handleToggleActivo(p)}
                        className={cx(
                          "relative h-7 w-12 rounded-full border transition-colors",
                          p.activo
                            ? "bg-emerald-500 border-emerald-500"
                            : "bg-neutral-200 border-neutral-200",
                        )}
                      >
                        <span
                          className={cx(
                            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                            p.activo ? "left-6" : "left-0.5",
                          )}
                        />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add form */}
                {showAddForm ? (
                  <form
                    onSubmit={handleAddProducto}
                    className="rounded-2xl border-2 border-dashed border-obsidian/20 p-4 space-y-3 bg-obsidian/[0.02]"
                  >
                    <div className="text-xs font-black text-obsidian uppercase tracking-widest">
                      Nuevo Producto
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        value={newNombre}
                        onChange={(e) => setNewNombre(e.target.value)}
                        placeholder="Nombre *"
                        className="col-span-2 rounded-xl border border-neutral-200 px-3 py-2 text-sm font-medium outline-none focus:border-obsidian"
                      />
                      <input
                        value={newClave}
                        onChange={(e) => setNewClave(e.target.value)}
                        placeholder="Clave"
                        className="rounded-xl border border-neutral-200 px-3 py-2 text-sm font-medium outline-none focus:border-obsidian"
                      />
                      <select
                        value={newUnidad}
                        onChange={(e) => setNewUnidad(e.target.value)}
                        className="rounded-xl border border-neutral-200 px-3 py-2 text-sm font-medium outline-none focus:border-obsidian bg-white"
                      >
                        {Object.entries(UNIDADES).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v}
                          </option>
                        ))}
                      </select>
                      <input
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                        placeholder="Descripción"
                        className="col-span-2 rounded-xl border border-neutral-200 px-3 py-2 text-sm font-medium outline-none focus:border-obsidian"
                      />
                    </div>
                    {addErr && (
                      <div className="text-xs text-rose-600 font-medium">
                        {addErr}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="flex-1 h-10 rounded-xl border border-neutral-200 text-sm font-bold text-neutral-500 hover:bg-neutral-50 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={addBusy}
                        className="flex-1 h-10 rounded-xl bg-obsidian text-white text-sm font-bold hover:bg-gold transition-colors disabled:opacity-60"
                      >
                        {addBusy ? "..." : "Agregar"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="w-full rounded-2xl border-2 border-dashed border-neutral-200 py-4 text-sm font-bold text-neutral-400 hover:border-obsidian hover:text-obsidian transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="h-4 w-4" /> Agregar producto
                  </button>
                )}
              </div>
            ) : (
              /* Historial */
              <div className="space-y-2">
                {ordenes.length === 0 ? (
                  <div className="py-16 text-center text-sm text-neutral-400 font-medium">
                    Sin órdenes aún
                  </div>
                ) : (
                  ordenes.map((o) => {
                    const cfg = STATUS_CONFIG[o.status] ?? {
                      label: o.status,
                      color:
                        "bg-neutral-100 text-neutral-600 border-neutral-200",
                    };
                    return (
                      <button
                        key={o.id}
                        onClick={() => setSelectedOrden(o)}
                        className="w-full flex items-center justify-between gap-3 rounded-2xl border border-neutral-100 bg-white px-4 py-3 hover:shadow-sm transition-all text-left"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-obsidian truncate">
                            {o.empleado.full_name}
                          </div>
                          <div className="text-xs text-neutral-400 mt-0.5">
                            {tiempoRelativo(o.created_at)}
                          </div>
                        </div>
                        <span
                          className={cx(
                            "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold shrink-0",
                            cfg.color,
                          )}
                        >
                          {cfg.label}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* File input oculto para foto */}
      <input
        ref={fotoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFotoChange(f);
          e.target.value = "";
        }}
      />

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
    </>
  );
}
