import { Briefcase, Users, LayoutTemplate } from "lucide-react";
import type { Puesto } from "../types";

type Props = {
  puesto: Puesto;
  onClick?: () => void;
};

export function PuestoCard({ puesto, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-k-border bg-k-bg-card p-5 transition-all duration-300 ${
        onClick ? "cursor-pointer hover:border-violet-500 hover:shadow-xl hover:shadow-violet-500/5" : ""
      }`}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-k-bg-card2 border border-k-border group-hover:bg-violet-500 group-hover:text-white transition-colors">
            <Briefcase className="h-6 w-6 text-k-text-b group-hover:text-white transition-colors" />
          </div>
          <div>
            <h3 className="font-bold text-k-text-h text-lg">{puesto.nombre}</h3>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${puesto.activo ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {puesto.activo ? "Activo" : "Inactivo"}
            </span>
          </div>
        </div>
      </div>

      {puesto.descripcion && (
        <p className="text-sm text-k-text-b line-clamp-2 mb-4">
          {puesto.descripcion}
        </p>
      )}

      <div className="mt-auto grid grid-cols-2 gap-4 border-t border-k-border pt-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-k-text-b mb-1">
            <Users className="h-3.5 w-3.5" />
            Empleados
          </div>
          <div className="text-lg font-black text-k-text-h">
            {puesto.empleados_count ?? 0}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-k-text-b mb-1">
            <LayoutTemplate className="h-3.5 w-3.5" />
            Módulos
          </div>
          <div className="text-lg font-black text-k-text-h">
            {puesto.modulos.length}
          </div>
        </div>
      </div>
    </div>
  );
}
