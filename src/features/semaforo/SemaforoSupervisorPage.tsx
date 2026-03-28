import SemaforoSupervisorSection from './SemaforoSupervisorSection';

export default function SemaforoSupervisorPage() {
  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative rounded-[32px] sm:rounded-[40px] bg-[#1E2D4A] overflow-hidden px-6 py-8 sm:px-8 sm:py-10 text-white shadow-lg">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/[0.03]" />
          <div className="absolute top-8 right-32 h-32 w-32 rounded-full bg-white/[0.04]" />
          <div className="absolute bottom-0 left-1/4 h-24 w-48 rounded-full bg-yellow-500/10" />
        </div>
        <div className="relative">
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-1">Equipo</p>
          <h1 className="text-3xl font-black tracking-tight">Semáforo de Desempeño</h1>
          <p className="text-white/50 text-sm font-medium mt-1">
            Evalúa a los empleados nuevos asignados a tu supervisión.
          </p>
        </div>
      </div>

      <SemaforoSupervisorSection />
    </div>
  );
}
