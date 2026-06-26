import { useMemo, useState } from "react";
import { Scale, CheckCircle } from "lucide-react";
import { useSabores, useCreatePesaje } from "../hooks/usePesaje";
import { useEmployees } from "@/features/tasks/hooks/useEmployees";
import { useAuthStore } from "@/features/auth/authStore";

export default function RegistroPesajePage() {
  const user = useAuthStore((s) => s.user);
  const esEmpleado = user?.role === "empleado";
  const empleadoPropio = user?.empleado;

  const { data: saboresResp } = useSabores();
  const saboresActivos = saboresResp?.data?.filter((s) => s.activo) || [];

  const { mutateAsync: createPesaje, isPending } = useCreatePesaje();
  const { data: employees = [], isLoading: loadingEmployees } = useEmployees();

  const [empleadoId, setEmpleadoId] = useState(empleadoPropio?.id || "");
  const [saborId, setSaborId] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [pesoManual, setPesoManual] = useState("");
  const [modoManual, setModoManual] = useState(false);

  const saborSeleccionado = useMemo(
    () => saboresActivos.find((s) => String(s.id) === saborId),
    [saboresActivos, saborId]
  );

  const pesoCalculado = useMemo(() => {
    if (modoManual) {
      const val = parseFloat(pesoManual);
      return isNaN(val) ? 0 : val;
    }
    const qty = parseFloat(cantidad);
    const estandar = saborSeleccionado?.peso_estandar ?? 0;
    if (isNaN(qty) || estandar <= 0) return 0;
    return Math.round(qty * estandar * 100) / 100;
  }, [modoManual, pesoManual, cantidad, saborSeleccionado]);

  const handleSubmit = async () => {
    const empId = esEmpleado && empleadoPropio ? empleadoPropio.id : empleadoId;
    const saborIdNum = parseInt(saborId, 10);

    if (!empId || !saborIdNum) {
      alert("Selecciona un operario y un sabor");
      return;
    }

    if (modoManual) {
      const val = parseFloat(pesoManual);
      if (isNaN(val) || val <= 0) {
        alert("Escribe un peso válido");
        return;
      }
    } else {
      const qty = parseFloat(cantidad);
      if (isNaN(qty) || qty <= 0) {
        alert("Escribe una cantidad válida");
        return;
      }
    }

    const payload = {
      empleado_id: empId,
      sabor_id: saborIdNum,
      cantidad: modoManual ? 1 : parseFloat(cantidad),
      ...(modoManual ? { peso: parseFloat(pesoManual) } : {}),
    };

    try {
      await createPesaje(payload);
      alert("Pesaje registrado correctamente");
      setSaborId("");
      setCantidad("1");
      setPesoManual("");
      setModoManual(false);
      if (!esEmpleado) setEmpleadoId("");
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al registrar el pesaje");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-k-text-h tracking-tight">Registro de Pesaje</h1>
          <p className="text-k-text-b text-sm mt-1">
            Captura rápida de pesajes por operario y sabor.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-k-bg-card to-k-bg-card2 border border-k-border rounded-3xl p-6 shadow-k-card">
          <h3 className="text-sm font-bold text-k-text-b uppercase tracking-widest mb-4">Captura Manual</h3>
          <div className="space-y-4">
            {esEmpleado ? (
              empleadoPropio ? (
                <div>
                  <label className="block text-xs font-semibold text-k-text-b mb-1">Operario</label>
                  <div className="w-full bg-k-bg-page border border-k-border rounded-xl px-4 py-2 text-sm text-k-text-h font-medium">
                    {empleadoPropio.full_name}
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm font-bold text-red-700">No tienes un empleado asociado</p>
                  <p className="text-xs text-red-600 mt-1">
                    Contacta al administrador para que vincule tu usuario con un empleado.
                  </p>
                </div>
              )
            ) : (
              <div>
                <label className="block text-xs font-semibold text-k-text-b mb-1">Operario</label>
                <select
                  value={empleadoId}
                  onChange={(e) => setEmpleadoId(e.target.value)}
                  className="w-full bg-white border border-k-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                  disabled={loadingEmployees}
                >
                  <option value="">Seleccionar operario...</option>
                  {employees.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>{emp.full_name ?? emp.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-k-text-b mb-1">Sabor / Producto</label>
              <select
                value={saborId}
                onChange={(e) => setSaborId(e.target.value)}
                className="w-full bg-white border border-k-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
              >
                <option value="">Seleccionar sabor...</option>
                {saboresActivos.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre} {s.presentacion ? `(${s.presentacion})` : ""} — {s.peso_estandar} kg/{s.unidad}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between bg-k-bg-page border border-k-border rounded-xl px-4 py-2">
              <span className="text-xs font-semibold text-k-text-b">Modo peso manual</span>
              <button
                type="button"
                onClick={() => setModoManual((m) => !m)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${modoManual ? "bg-amber-500" : "bg-gray-300"}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${modoManual ? "translate-x-6" : "translate-x-1"}`}
                />
              </button>
            </div>

            {modoManual ? (
              <div>
                <label className="block text-xs font-semibold text-k-text-b mb-1">Peso real (kg)</label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  placeholder="Ej. 15.50"
                  value={pesoManual}
                  onChange={(e) => setPesoManual(e.target.value)}
                  className="w-full text-2xl font-black text-center bg-white border border-k-border rounded-xl px-4 py-6 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-k-text-b mb-1">
                  Cantidad de {saborSeleccionado?.unidad || "unidades"}
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  placeholder="Ej. 1, 2, 3..."
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  className="w-full text-2xl font-black text-center bg-white border border-k-border rounded-xl px-4 py-6 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                />
                {saborSeleccionado && (
                  <p className="text-xs text-k-text-b mt-2 text-center">
                    Peso calculado: <span className="font-black text-amber-600">{pesoCalculado.toFixed(2)} kg</span>
                  </p>
                )}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={isPending || !saborId || (modoManual ? !pesoManual : !cantidad) || (!esEmpleado && !empleadoId)}
              className="w-full h-12 bg-amber-500 text-white rounded-xl font-bold text-base hover:bg-amber-600 disabled:bg-gray-300 transition-colors shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 mt-2"
            >
              <Scale className="h-5 w-5" />
              {isPending ? "Registrando..." : `Registrar ${modoManual ? "Peso" : (saborSeleccionado?.unidad || "Bulto")}`}
            </button>
          </div>
        </div>

        <div className="bg-k-bg-card border border-k-border rounded-3xl p-6 shadow-k-card flex flex-col justify-center items-center text-center">
          <div className="h-20 w-20 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/20">
            <CheckCircle className="h-10 w-10" />
          </div>
          <h3 className="text-xl font-black text-k-text-h mb-2">Báscula Lista</h3>
          <p className="text-sm text-k-text-b max-w-xs">
            Selecciona el producto y la cantidad de unidades para registrarlo. El sistema calculará el peso automáticamente.
          </p>
        </div>
      </div>
    </div>
  );
}
