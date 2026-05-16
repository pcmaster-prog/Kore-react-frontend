// src/features/reportes/ReportesPage.tsx
import { useState, useEffect } from "react";
import ReporteAsistenciaTab from "./ReporteAsistenciaTab";
import ReporteEmpleadoTab from "./ReporteEmpleadoTab";
import { FileBarChart, UserCircle } from "lucide-react";
import { cx } from "@/lib/utils";

type EmployeeOption = { id: string; full_name?: string; name?: string };

export default function ReportesPage() {
  const [tab, setTab] = useState<"asistencia" | "empleado">("asistencia");
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loadingEmps, setLoadingEmps] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoadingEmps(true);
    import("@/features/tasks/employeeApi")
      .then((mod) => mod.listEmployees())
      .then((res) => {
        if (!alive) return;
        const arr = Array.isArray(res) ? res : [];
        setEmployees(arr);
      })
      .catch(() => {
        if (!alive) return;
        setEmployees([]);
      })
      .finally(() => {
        if (alive) setLoadingEmps(false);
      });
    return () => { alive = false; };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-k-bg-card p-4 rounded-[32px] border border-k-border shadow-k-card">
        <div>
          <h1 className="text-xl font-black text-k-text-h tracking-tight">Reportes</h1>
          <p className="text-sm text-k-text-b mt-0.5">
            Genera reportes de asistencia y desempeño del equipo
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-neutral-100/80 rounded-2xl p-1">
        {(
          [
            { key: "asistencia", label: "Asistencia Semanal", icon: FileBarChart },
            { key: "empleado", label: "Por Empleado", icon: UserCircle },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cx(
              "flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition",
              tab === t.key ? "bg-k-bg-card shadow-k-card text-k-text-h" : "text-k-text-b hover:text-neutral-600"
            )}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {loadingEmps ? (
        <div className="flex flex-col items-center gap-3 py-16 text-k-text-b">
          <div className="h-8 w-8 border-4 border-k-border border-t-obsidian rounded-full animate-spin" />
          <span className="text-xs font-bold uppercase tracking-widest">Cargando...</span>
        </div>
      ) : tab === "asistencia" ? (
        <ReporteAsistenciaTab employees={employees} />
      ) : (
        <ReporteEmpleadoTab employees={employees} />
      )}
    </div>
  );
}

