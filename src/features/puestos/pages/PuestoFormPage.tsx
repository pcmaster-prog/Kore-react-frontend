import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Briefcase, AlertTriangle, Shield } from "lucide-react";
import { usePuestos, useCreatePuesto, useUpdatePuesto, useModulosDisponibles } from "../hooks/usePuestos";
import { ModulosSelector } from "../components/ModulosSelector";

export default function PuestoFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const nav = useNavigate();

  const { data: puestosData, isLoading: isLoadingPuesto } = usePuestos();
  const { data: modulosDisp, isLoading: isLoadingModulos } = useModulosDisponibles();
  const { mutateAsync: createPuesto, isPending: creating } = useCreatePuesto();
  const { mutateAsync: updatePuesto, isPending: updating } = useUpdatePuesto();

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [activo, setActivo] = useState(true);
  const [selectedModulos, setSelectedModulos] = useState<string[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (isEdit && puestosData?.data) {
      const p = puestosData.data.find(x => x.id === id);
      if (p) {
        setNombre(p.nombre);
        setDescripcion(p.descripcion ?? "");
        setActivo(p.activo);
        setSelectedModulos(p.modulos ?? []);
      }
    }
  }, [id, isEdit, puestosData]);

  const loading = isEdit ? (isLoadingPuesto || isLoadingModulos) : isLoadingModulos;
  const saving = creating || updating;
  const canSave = nombre.trim().length > 0;

  async function handleSave() {
    setErr(null);
    try {
      if (isEdit) {
        await updatePuesto({ id, payload: { nombre, descripcion, modulos: selectedModulos, activo } });
      } else {
        await createPuesto({ nombre, descripcion, modulos: selectedModulos });
      }
      nav("/app/manager/puestos");
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "Error al guardar el puesto");
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-k-text-b animate-pulse">Cargando...</div>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex items-center justify-between bg-k-bg-card border border-k-border p-6 rounded-3xl shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => nav("/app/manager/puestos")}
            className="h-10 w-10 rounded-xl border border-k-border flex items-center justify-center text-k-text-b hover:bg-k-bg-card2 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-k-text-h tracking-tight">
              {isEdit ? "Editar Puesto" : "Nuevo Puesto"}
            </h1>
            <p className="mt-1 text-sm text-k-text-b font-medium">Define la información base y el acceso a módulos.</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          className="h-10 px-6 rounded-xl bg-violet-600 text-white text-sm font-bold shadow-sm hover:bg-violet-700 hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50 disabled:hover:translate-y-0"
        >
          <Save className="h-4 w-4" />
          {saving ? "Guardando..." : "Guardar Puesto"}
        </button>
      </header>

      {err && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5" />
          {err}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-k-bg-card border border-k-border rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-k-border">
            <Briefcase className="h-5 w-5 text-k-text-b" />
            <h2 className="font-bold text-k-text-h uppercase tracking-widest text-sm">Información General</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-k-text-b mb-2">Nombre del Puesto</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Ensamblador, Tornero..."
                className="w-full rounded-xl border border-k-border bg-k-bg-card2 px-4 py-3 text-sm text-k-text-h outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-k-text-b mb-2">Descripción (Opcional)</label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Breve descripción de las funciones..."
                rows={3}
                className="w-full rounded-xl border border-k-border bg-k-bg-card2 px-4 py-3 text-sm text-k-text-h outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all resize-none"
              />
            </div>
            {isEdit && (
              <label className="flex items-center gap-3 p-4 rounded-xl border border-k-border bg-k-bg-card2 cursor-pointer mt-4">
                <input
                  type="checkbox"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                  className="h-4 w-4 rounded text-violet-600 focus:ring-violet-500"
                />
                <span className="text-sm font-bold text-k-text-h">Puesto Activo</span>
              </label>
            )}
          </div>
        </div>

        <div className="bg-k-bg-card border border-k-border rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-k-border">
            <Shield className="h-5 w-5 text-k-text-b" />
            <h2 className="font-bold text-k-text-h uppercase tracking-widest text-sm">Permisos de Módulos</h2>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm text-k-text-b">
              Selecciona los módulos a los que tendrán acceso los empleados con este puesto.
            </p>
            <ModulosSelector
              modulosDisponibles={modulosDisp ?? []}
              selectedSlugs={selectedModulos}
              onChange={setSelectedModulos}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
