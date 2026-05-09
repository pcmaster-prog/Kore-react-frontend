import { useCallback, useEffect, useState } from "react";
import api from "@/lib/http";
import { escapeHtml } from "@/lib/utils";
import type { Entry, Period, MealScheduleItem } from "./nomina.types";
import {
  todayLocalDate,
  toLocalDate,
  weekLabel,
  getWeekNumber,
  fmt,
  fmtUnits,
  formatTime12,
} from "./nomina.utils";

export function useNomina() {
  const [period, setPeriod] = useState<Period | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [reopening, setReopening] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const [globalPatches, setGlobalPatches] = useState<Record<string, Partial<Entry>>>({});
  const [savingGlobal, setSavingGlobal] = useState(false);

  const [refDate, setRefDate] = useState<string>(todayLocalDate());
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [mealSchedules, setMealSchedules] = useState<MealScheduleItem[]>([]);

  function showToast(type: "ok" | "err", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  const weekStart = period?.week_start || refDate;
  const weekEnd =
    period?.week_end ||
    (() => {
      const d = new Date(refDate + "T12:00:00");
      d.setDate(d.getDate() + 6);
      return toLocalDate(d);
    })();

  function prevWeek() {
    const d = new Date(weekStart + "T12:00:00");
    d.setDate(d.getDate() - 7);
    setRefDate(toLocalDate(d));
    setPeriod(null);
  }

  function nextWeek() {
    const d = new Date(weekStart + "T12:00:00");
    d.setDate(d.getDate() + 7);
    setRefDate(toLocalDate(d));
    setPeriod(null);
  }

  const loadPeriod = useCallback(async () => {
    setLoading(true);
    setErr(null);
    setPeriod(null);
    setGlobalPatches({});
    try {
      const res = await api.get("/nomina/periodos/semana", {
        params: { week_date: refDate },
      });
      const periodData = res.data?.period ?? res.data;
      if (periodData) {
        setPeriod(periodData);
        setNotes(periodData?.notes ?? "");
      }
      try {
        const mealRes = await api.get("/meal-schedules");
        setMealSchedules(mealRes.data?.data ?? mealRes.data ?? []);
      } catch {
        /* meal schedules not yet configured */
      }
    } catch (e: unknown) {
      const axiosError = e as {
        response?: { status: number; data?: { message?: string } };
      };
      if (axiosError?.response?.status === 404) {
        // no period found — leave period as null to show "generate" UI
      } else {
        setErr(axiosError?.response?.data?.message ?? "Error cargando nómina");
      }
    } finally {
      setLoading(false);
    }
  }, [refDate]);

  useEffect(() => {
    loadPeriod();
  }, [loadPeriod]);

  async function generate() {
    setGenerating(true);
    setErr(null);
    try {
      const res = await api.post("/nomina/periodos/generar", { week_date: refDate });
      const newPeriod = res.data?.period ?? null;
      setPeriod(newPeriod);
      if (newPeriod) {
        setRefDate(newPeriod.week_start);
        setNotes(newPeriod.notes ?? "");
      }
      showToast("ok", "Nómina generada correctamente");
    } catch (e: unknown) {
      const axiosError = e as {
        response?: { status: number; data?: { period?: Period; message?: string } };
      };
      if (axiosError?.response?.status === 409 && axiosError?.response?.data?.period) {
        const existingPeriod = axiosError.response.data.period;
        setPeriod(existingPeriod);
        setRefDate(existingPeriod.week_start);
        setNotes(existingPeriod.notes ?? "");
        showToast("err", axiosError.response.data.message ?? "Esta nómina ya fue aprobada");
      } else {
        showToast("err", axiosError?.response?.data?.message ?? "No se pudo generar la nómina");
      }
    } finally {
      setGenerating(false);
    }
  }

  async function approve() {
    if (!period) return;
    setApproving(true);
    try {
      const res = await api.post(`/nomina/periodos/${period.id}/aprobar`);
      setPeriod(res.data?.period ?? null);
      showToast("ok", "¡Nómina aprobada y cerrada!");
    } catch (e: unknown) {
      const axiosError = e as {
        response?: { data?: { message?: string } };
      };
      showToast("err", axiosError?.response?.data?.message ?? "No se pudo aprobar");
    } finally {
      setApproving(false);
    }
  }

  async function reopen() {
    if (!period) return;
    if (!confirm("¿Reabrir esta nómina? Se podrán editar ajustes y volver a calcular.")) return;
    setReopening(true);
    try {
      await api.patch(`/nomina/periodos/${period.id}/reabrir`);
      showToast("ok", "Nómina reabierta");
      await loadPeriod();
    } catch (e: unknown) {
      const axiosError = e as { response?: { data?: { message?: string } } };
      showToast("err", axiosError?.response?.data?.message ?? "No se pudo reabrir");
    } finally {
      setReopening(false);
    }
  }

  async function saveEntry(entryId: string, patch: Partial<Entry>) {
    if (!period) return;
    try {
      const res = await api.patch(
        `/nomina/periodos/${period.id}/entradas/${entryId}`,
        patch
      );
      const updatedEntry: Entry = res.data?.entry;
      const newTotals = res.data?.period_totals;

      setPeriod((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          total_amount: newTotals?.total_amount ?? prev.total_amount,
          total_adjustments: newTotals?.total_adjustments ?? prev.total_adjustments,
          total_bonuses: newTotals?.total_bonuses ?? prev.total_bonuses,
          entries: prev.entries.map((e) =>
            e.id === entryId ? { ...e, ...updatedEntry } : e
          ),
        };
      });
    } catch (e: unknown) {
      const axiosError = e as {
        response?: { data?: { message?: string } };
      };
      showToast("err", axiosError?.response?.data?.message ?? "No se pudo guardar el ajuste");
      throw e;
    }
  }

  async function saveAllChanges() {
    if (!period || Object.keys(globalPatches).length === 0) return;
    setSavingGlobal(true);
    try {
      for (const id of Object.keys(globalPatches)) {
        await api.patch(
          `/nomina/periodos/${period.id}/entradas/${id}`,
          globalPatches[id]
        );
      }
      showToast("ok", "Cambios guardados globalmente");
      setGlobalPatches({});
      await loadPeriod();
    } catch (e: unknown) {
      const axiosError = e as {
        response?: { data?: { message?: string } };
      };
      showToast("err", axiosError?.response?.data?.message ?? "Error al guardar algunos cambios");
    } finally {
      setSavingGlobal(false);
    }
  }

  async function toggleExclude(empleadoId: string, excluir: boolean) {
    if (!period) return;
    try {
      const res = await api.post(`/nomina/periodos/${period.id}/excluir`, {
        empleado_id: empleadoId,
        excluir,
      });
      setPeriod((prev) =>
        prev
          ? {
              ...prev,
              excluded_employee_ids: res.data?.excluded_employee_ids ?? [],
            }
          : prev
      );
      showToast("ok", res.data?.message ?? (excluir ? "Empleado excluido" : "Empleado incluido"));
      await generate();
    } catch (e: unknown) {
      const axiosError = e as {
        response?: { data?: { message?: string } };
      };
      showToast("err", axiosError?.response?.data?.message ?? "Error modificando exclusión");
    }
  }

  async function saveNotes() {
    if (!period) return;
    setSavingNotes(true);
    try {
      await api.patch(`/nomina/periodos/${period.id}`, { notes });
      setPeriod((prev) => (prev ? { ...prev, notes } : prev));
      showToast("ok", "Notas guardadas");
    } catch {
      showToast("err", "No se pudieron guardar las notas");
    } finally {
      setSavingNotes(false);
    }
  }

  function patchEntry(id: string, patch: Partial<Entry>) {
    setGlobalPatches((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  function exportPDF() {
    if (!period) return;

    const w = window.open("", "_blank");
    if (!w) return;

    const excludedIds = period.excluded_employee_ids ?? [];
    const visibleEntries = (period.entries ?? []).filter(
      (e) => !excludedIds.includes(e.empleado_id)
    );

    const wkNum = getWeekNumber(period.week_start);

    const rows = visibleEntries
      .map((e) => {
        const ms = mealSchedules.find((m) => m.employee_id === e.empleado_id);
        const msStr = ms
          ? `${escapeHtml(formatTime12(ms.meal_start_time))} (${ms.duration_minutes}m)`
          : "—";
        const adjNote = e.adjustment_note
          ? ` (${escapeHtml(e.adjustment_note)})`
          : "";
        return `
      <tr>
        <td>${escapeHtml(e.empleado_name)}</td>
        <td>${msStr}</td>
        <td>${escapeHtml(fmtUnits(e.payment_type, e.units))}${e.rest_days_paid > 0 ? ` +${e.rest_days_paid}d` : ""}</td>
        <td>${escapeHtml(fmt(e.rate))}</td>
        <td>${escapeHtml(fmt(e.subtotal))}</td>
        <td>${e.adjustment_amount !== 0 ? escapeHtml(fmt(e.adjustment_amount)) : "—"}${adjNote}</td>
        <td><strong>${escapeHtml(fmt(e.total))}</strong></td>
      </tr>`;
      })
      .join("");

    const notesHtml = period.notes
      ? `
      <div class="notes">
        <div class="notes-label">Notas</div>
        <div class="notes-text">${escapeHtml(period.notes)}</div>
      </div>`
      : "";

    const html = `
      <!DOCTYPE html><html><head>
      <meta charset="utf-8"/>
      <title>${escapeHtml(`Nómina Semana ${wkNum} – ${weekLabel(period.week_start, period.week_end)}`)}</title>
      <style>
        body { font-family: system-ui; font-size: 13px; padding: 32px; color: #111; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        .week-badge { display: inline-block; background: #111; color: #fff; border-radius: 6px; padding: 3px 10px; font-size: 13px; font-weight: bold; margin-left: 8px; }
        .meta { color: #666; margin-bottom: 24px; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #f5f5f5; text-align: left; padding: 8px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: .05em; }
        td { padding: 8px 12px; border-bottom: 1px solid #eee; }
        .totals { margin-top: 24px; display: flex; gap: 32px; }
        .total-box { background: #f9f9f9; border-radius: 8px; padding: 16px 24px; }
        .total-box .label { font-size: 11px; color: #888; margin-bottom: 4px; }
        .total-box .val { font-size: 22px; font-weight: bold; }
        .notes { margin-top: 24px; background: #fefce8; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; }
        .notes-label { font-size: 11px; font-weight: bold; color: #92400e; text-transform: uppercase; letter-spacing: .05em; margin-bottom: 6px; }
        .notes-text { font-size: 13px; color: #451a03; white-space: pre-wrap; }
        @media print { body { padding: 16px; } }
      </style>
      </head><body>
      <h1>Nómina Semanal <span class="week-badge">Semana ${wkNum}</span></h1>
      <div class="meta">
        ${escapeHtml(weekLabel(period.week_start, period.week_end))} &nbsp;·&nbsp;
        Estado: ${period.status === "approved" ? "✓ Aprobada" : "Borrador"} &nbsp;·&nbsp;
        Empleados: ${visibleEntries.length}
      </div>
      <table>
        <thead><tr>
          <th>Empleado</th><th>Comida</th><th>Horas/Días</th><th>Tarifa</th>
          <th>Subtotal</th><th>Ajuste</th><th>Total</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="totals">
        <div class="total-box"><div class="label">Total Nómina</div><div class="val">${escapeHtml(fmt(period.total_amount))}</div></div>
        <div class="total-box"><div class="label">Ajustes</div><div class="val">${escapeHtml(fmt(period.total_adjustments))}</div></div>
        <div class="total-box"><div class="label">Empleados</div><div class="val">${visibleEntries.length}</div></div>
      </div>
      ${notesHtml}
      <script>window.onload = () => window.print();</script>
      </body></html>`;

    w.document.open();
    w.document.write(html);
    w.document.close();
  }

  function exportCSV() {
    if (!period) return;

    const excludedIds = period.excluded_employee_ids ?? [];
    const visibleEntries = (period.entries ?? []).filter(
      (e) => !excludedIds.includes(e.empleado_id)
    );

    const header = "Empleado,Comida,Horas/Días,Tarifa,Subtotal,Ajuste,Motivo Ajuste,Total\n";
    const rows = visibleEntries
      .map((e) => {
        const ms = mealSchedules.find((m) => m.employee_id === e.empleado_id);
        const msStr = ms
          ? `${formatTime12(ms.meal_start_time)} (${ms.duration_minutes}m)`
          : "";
        return [
          `"${e.empleado_name}"`,
          `"${msStr}"`,
          fmtUnits(e.payment_type, e.units),
          e.rate,
          e.subtotal,
          e.adjustment_amount,
          `"${e.adjustment_note ?? ""}"`,
          e.total,
        ].join(",");
      })
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nomina_${period.week_start}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const approved = period?.status === "approved";
  const excludedIds = period?.excluded_employee_ids ?? [];
  const visibleEntries = (period?.entries ?? []).filter(
    (e) => !excludedIds.includes(e.empleado_id)
  );
  const totalEmp = visibleEntries.length;
  const avgTotal = totalEmp > 0 ? (period?.total_amount ?? 0) / totalEmp : 0;
  const draftCount = visibleEntries.filter((e) => (e.adjustment_amount ?? 0) < 0).length ?? 0;

  const chartData = Object.entries(
    visibleEntries.reduce((acc, entry) => {
      const role = entry.empleado_role || "Sin rol";
      acc[role] = (acc[role] || 0) + entry.total;
      return acc;
    }, {} as Record<string, number>)
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return {
    period,
    loading,
    generating,
    approving,
    err,
    toast,
    globalPatches,
    savingGlobal,
    refDate,
    notes,
    savingNotes,
    mealSchedules,
    weekStart,
    weekEnd,
    approved,
    excludedIds,
    visibleEntries,
    totalEmp,
    avgTotal,
    draftCount,
    chartData,
    showToast,
    prevWeek,
    nextWeek,
    loadPeriod,
    generate,
    approve,
    reopen,
    saveEntry,
    saveAllChanges,
    toggleExclude,
    exportPDF,
    exportCSV,
    setNotes,
    saveNotes,
    patchEntry,
    reopening,
  };
}
