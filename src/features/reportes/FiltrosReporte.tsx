// src/features/reportes/FiltrosReporte.tsx
import { useState, useEffect } from "react";
import { Calendar, Filter, Loader2, Users, ChevronDown, Check } from "lucide-react";
import { cx } from "@/lib/utils";
import type { FiltrosAsistencia } from "./api";

type EmployeeOption = { id: string; full_name?: string; name?: string };

interface Props {
  onFilter: (filtros: FiltrosAsistencia) => void;
  loading?: boolean;
  employees?: EmployeeOption[];
  modoEmpleado?: boolean; // si es true, oculta selector de empleados (para reporte individual)
  empleadoId?: string; // empleado preseleccionado para reporte individual
}

function getWeekRange(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diffToSunday = day; // domingo = 0
  const sunday = new Date(d);
  sunday.setDate(d.getDate() - diffToSunday);
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);
  const fmt = (x: Date) => x.toISOString().slice(0, 10);
  return { from: fmt(sunday), to: fmt(saturday) };
}

export default function FiltrosReporte({
  onFilter,
  loading = false,
  employees = [],
  modoEmpleado = false,
  empleadoId,
}: Props) {
  const week = getWeekRange();
  const [from, setFrom] = useState(week.from);
  const [to, setTo] = useState(week.to);
  const [selectedIds, setSelectedIds] = useState<string[]>(empleadoId ? [empleadoId] : []);
  const [incluirRetardos, setIncluirRetardos] = useState(false);
  const [incluirComida, setIncluirComida] = useState(true);
  const [empDropdownOpen, setEmpDropdownOpen] = useState(false);

  useEffect(() => {
    if (empleadoId) setSelectedIds([empleadoId]);
  }, [empleadoId]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onFilter({
      from,
      to,
      empleado_ids: modoEmpleado ? undefined : selectedIds.length > 0 ? selectedIds : undefined,
      incluir_retardos: incluirRetardos,
      incluir_tiempos_comida: incluirComida,
    });
  }

  function toggleEmp(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[28px] border border-k-border bg-k-bg-card p-5 shadow-k-card space-y-4">
      <div className="flex items-center gap-2 text-sm font-bold text-k-text-h">
        <Filter className="h-4 w-4 text-k-text-b" />
        Filtros
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        {/* Fecha desde */}
        <div className="flex-1">
          <label className="text-[10px] font-bold text-k-text-b uppercase tracking-widest mb-1.5 block">
            Desde
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-k-text-b" />
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full rounded-xl border border-k-border bg-k-bg-card2 pl-9 pr-3 py-2.5 text-sm font-medium text-k-text-h outline-none focus:ring-2 focus:ring-obsidian/10"
            />
          </div>
        </div>

        {/* Fecha hasta */}
        <div className="flex-1">
          <label className="text-[10px] font-bold text-k-text-b uppercase tracking-widest mb-1.5 block">
            Hasta
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-k-text-b" />
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full rounded-xl border border-k-border bg-k-bg-card2 pl-9 pr-3 py-2.5 text-sm font-medium text-k-text-h outline-none focus:ring-2 focus:ring-obsidian/10"
            />
          </div>
        </div>

        {/* Selector de empleados (solo modo grupal) */}
        {!modoEmpleado && employees.length > 0 && (
          <div className="flex-1 relative">
            <label className="text-[10px] font-bold text-k-text-b uppercase tracking-widest mb-1.5 block">
              Empleados
            </label>
            <button
              type="button"
              onClick={() => setEmpDropdownOpen((p) => !p)}
              className={cx(
                "w-full rounded-xl border border-k-border bg-k-bg-card2 px-3 py-2.5 text-sm font-medium text-k-text-h outline-none focus:ring-2 focus:ring-obsidian/10 flex items-center justify-between transition",
                empDropdownOpen && "ring-2 ring-obsidian/10"
              )}
            >
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4 text-k-text-b" />
                {selectedIds.length === 0
                  ? "Todos los empleados"
                  : `${selectedIds.length} seleccionado${selectedIds.length !== 1 ? "s" : ""}`}
              </span>
              <ChevronDown className={cx("h-4 w-4 text-k-text-b transition", empDropdownOpen && "rotate-180")} />
            </button>
            {empDropdownOpen && (
              <>
                <div className="absolute inset-0 z-10" onClick={() => setEmpDropdownOpen(false)} />
                <div className="absolute z-20 mt-1 w-full max-h-60 overflow-y-auto rounded-xl border border-k-border bg-white shadow-lg py-2">
                  {employees.map((emp) => {
                    const name = emp.full_name ?? emp.name ?? "Empleado";
                    const checked = selectedIds.includes(emp.id);
                    return (
                      <label
                        key={emp.id}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-neutral-50 cursor-pointer text-sm"
                      >
                        <div
                          className={cx(
                            "h-4 w-4 rounded border flex items-center justify-center transition",
                            checked ? "bg-k-bg-sidebar border-k-bg-sidebar" : "border-neutral-300"
                          )}
                        >
                          {checked && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={checked}
                          onChange={() => toggleEmp(emp.id)}
                        />
                        <span className="text-k-text-h">{name}</span>
                      </label>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Checkboxes */}
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm text-k-text-h cursor-pointer">
          <input
            type="checkbox"
            checked={incluirRetardos}
            onChange={(e) => setIncluirRetardos(e.target.checked)}
            className="h-4 w-4 rounded border-k-border text-k-bg-sidebar focus:ring-k-bg-sidebar"
          />
          <span className="text-xs font-bold">Incluir retardos</span>
        </label>
        <label className="flex items-center gap-2 text-sm text-k-text-h cursor-pointer">
          <input
            type="checkbox"
            checked={incluirComida}
            onChange={(e) => setIncluirComida(e.target.checked)}
            className="h-4 w-4 rounded border-k-border text-k-bg-sidebar focus:ring-k-bg-sidebar"
          />
          <span className="text-xs font-bold">Incluir tiempos de comida</span>
        </label>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-k-bg-sidebar text-white px-5 py-2.5 text-sm font-bold hover:bg-obsidian transition disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Generar reporte
        </button>
      </div>
    </form>
  );
}
