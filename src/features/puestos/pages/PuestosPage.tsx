import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Shield, Briefcase, Trash2, Edit2 } from "lucide-react";
import { usePuestos, useDeletePuesto, useModulosDisponibles } from "../hooks/usePuestos";
import { cx } from "@/lib/utils";

export default function PuestosPage() {
  const nav = useNavigate();
  const [search, setSearch] = useState("");
  const { data, isLoading } = usePuestos(search);
  const { data: modulosDisp } = useModulosDisponibles();
  const { mutate: deletePuesto } = useDeletePuesto();

  const puestos = data?.data ?? [];

  const handleDelete = (id: string, nombre: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar el puesto "${nombre}"?`)) {
      deletePuesto(id);
    }
  };

  const getModuloName = (slug: string) => {
    return modulosDisp?.find((m) => m.slug === slug)?.nombre ?? slug;
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-k-bg-card border border-k-border p-6 rounded-3xl shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-k-text-h tracking-tight">Puestos y Accesos</h1>
          <p className="mt-1 text-sm text-k-text-b font-medium">Administra los roles y sus permisos de módulos.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-k-text-b" />
            <input
              type="text"
              placeholder="Buscar puesto..."
              className="w-full h-10 pl-9 pr-4 rounded-xl border border-k-border bg-k-bg-card2 text-sm text-k-text-h focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => nav("/app/manager/puestos/nuevo")}
            className="h-10 px-5 rounded-xl bg-violet-600 text-white text-sm font-bold shadow-sm shadow-violet-500/20 hover:bg-violet-700 hover:-translate-y-0.5 transition-all flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            Nuevo Puesto
          </button>
        </div>
      </header>

      {isLoading ? (
        <div className="p-8 text-center text-k-text-b animate-pulse">Cargando puestos...</div>
      ) : puestos.length === 0 ? (
        <div className="p-12 text-center bg-k-bg-card border border-k-border rounded-3xl">
          <Briefcase className="h-12 w-12 text-k-text-b/30 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-k-text-h">No hay puestos</h3>
          <p className="text-sm text-k-text-b mt-1">Crea el primer puesto para empezar a gestionar accesos.</p>
        </div>
      ) : (
        <div className="bg-k-bg-card border border-k-border rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-k-bg-card2/50 text-k-text-b uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="px-6 py-4">Puesto</th>
                  <th className="px-6 py-4">Módulos Asignados</th>
                  <th className="px-6 py-4 text-center">Empleados</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-k-border/50">
                {puestos.map((p) => (
                  <tr key={p.id} className="hover:bg-k-bg-card2/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-k-text-h">{p.nombre}</div>
                      <div className="text-xs text-k-text-b mt-0.5 max-w-[200px] truncate">{p.descripcion ?? "-"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5 max-w-[300px]">
                        {p.modulos.length === 0 ? (
                          <span className="text-xs text-k-text-b italic">Sin módulos</span>
                        ) : (
                          p.modulos.map((m) => (
                            <span key={m} className="px-2 py-1 rounded-md bg-violet-50 text-violet-700 text-[10px] font-bold border border-violet-100 flex items-center gap-1">
                              <Shield className="h-3 w-3" />
                              {getModuloName(m)}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-k-bg-card2 text-xs font-bold text-k-text-h border border-k-border">
                        {p.empleados_count ?? 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cx(
                        "inline-flex px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        p.activo ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-neutral-100 text-neutral-500 border border-neutral-200"
                      )}>
                        {p.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => nav(`/app/manager/puestos/${p.id}`)}
                          className="p-2 rounded-xl text-k-text-b hover:bg-violet-50 hover:text-violet-600 transition-colors"
                          title="Editar puesto"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.nombre)}
                          className="p-2 rounded-xl text-k-text-b hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          title="Eliminar puesto"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
