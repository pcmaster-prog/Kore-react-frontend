// src/features/attendance/EmployeeAttendancePage.tsx
import { useEffect, useState, useCallback } from "react";
import {
  getMyToday,
  getMyDays,
  checkIn,
  breakStart,
  breakEnd,
  checkOut,
  markRestDay,
  cancelRestDay,
  minutesToHHMM,
  formatTime,
  type TodayResponse,
  type MyDayRow,
} from "./api";

function cx(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(" ");
}

// ─── Badge estado asistencia del día ─────────────────────────────────────────
function DayBadge({ row }: { row: MyDayRow }) {
  const checkedIn = !!row.first_check_in_at;
  const closed = row.status === "closed";
  if (!checkedIn) return <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700">Ausente</span>;
  if (closed) return <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">Presente</span>;
  return <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">En curso</span>;
}

// ─── Botón de acción ──────────────────────────────────────────────────────────
function ActionBtn({
  label, icon, sublabel, enabled, busy, variant, onClick,
}: {
  label: string; icon: string; sublabel?: string;
  enabled: boolean; busy: boolean;
  variant: "primary" | "warning" | "danger" | "neutral";
  onClick: () => void;
}) {
  const v = {
    primary: "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700",
    warning: "bg-amber-500 hover:bg-amber-600 text-white border-amber-600",
    danger: "bg-neutral-900 hover:bg-neutral-800 text-white border-neutral-900",
    neutral: "bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed",
  }[variant];

  return (
    <button
      onClick={onClick}
      disabled={!enabled || busy}
      className={cx(
        "flex flex-col items-center justify-center gap-2 rounded-3xl border p-5 text-center transition w-full",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        v
      )}
    >
      <span className="text-3xl">{busy ? "⏳" : icon}</span>
      <div>
        <div className="text-sm font-semibold">{label}</div>
        {sublabel && <div className="text-xs opacity-70 mt-0.5">{sublabel}</div>}
      </div>
    </button>
  );
}

export default function EmployeeAttendancePage() {
  const [today, setToday] = useState<TodayResponse | null>(null);
  const [history, setHistory] = useState<MyDayRow[]>([]);
  const [loadingToday, setLoadingToday] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [wifiBlocked, setWifiBlocked] = useState(false);

  function showToast(type: "ok" | "err", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  const loadToday = useCallback(async () => {
    setLoadingToday(true);
    try {
      const res = await getMyToday();
      setToday(res);
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "No se pudo cargar tu asistencia");
    } finally {
      setLoadingToday(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const res = await getMyDays({ page: 1 });
      setHistory(res.data ?? []);
    } catch { /* silencioso */ }
  }, []);

  useEffect(() => {
    loadToday();
    loadHistory();
  }, [loadToday, loadHistory]);

  async function doAction(fn: () => Promise<any>, msg: string) {
    setBusy(true);
    setWifiBlocked(false);
    try {
      await fn();
      showToast("ok", msg);
      await loadToday();
      await loadHistory();
    } catch (e: any) {
      const code = e?.response?.data?.code ?? "";
      if (code === "NETWORK_RESTRICTED") {
        setWifiBlocked(true);
        showToast("err", "Debes estar conectado a la red WiFi de la empresa para marcar asistencia.");
      } else if (code === "REST_ALREADY_USED") {
        showToast("err", "Ya usaste tu día de descanso esta semana.");
      } else {
        showToast("err", e?.response?.data?.message ?? "No se pudo completar");
      }
    } finally {
      setBusy(false);
    }
  }

  const state = today?.state ?? "out";
  const actions = today?.actions;
  const totals = today?.totals;
  const dayInfo = today?.day;

  // 🔧 FIX 4: KPIs calculados del historial + hoy (evitar duplicar día actual)
  const todayMinutes = today?.totals?.worked_minutes ?? 0;
  const historyMinutes = history
    .filter(d => d.date !== today?.date) // evitar duplicar hoy si ya está en historial
    .slice(0, 7)
    .reduce((acc, d) => acc + (d.totals?.worked_minutes ?? 0), 0);
  const workedThisWeek = todayMinutes + historyMinutes;

  const completeDays = history.filter((d) => d.status === "closed" && !!d.first_check_in_at).length;

  const stateConf = {
    working: { label: "En turno", cls: "bg-emerald-50 text-emerald-800 border-emerald-200", dot: "bg-emerald-500" },
    break: { label: "En pausa", cls: "bg-amber-50 text-amber-800 border-amber-200", dot: "bg-amber-400" },
    closed: { label: "Turno cerrado", cls: "bg-neutral-50 text-neutral-700 border-neutral-200", dot: "bg-neutral-400" },
    rest: { label: "Día de descanso", cls: "bg-sky-50 text-sky-800 border-sky-200", dot: "bg-sky-400" },
    out: { label: "Sin turno", cls: "bg-neutral-50 text-neutral-500 border-neutral-200", dot: "bg-neutral-300" },
  }[state] ?? { label: state, cls: "bg-neutral-50 text-neutral-500 border-neutral-200", dot: "bg-neutral-300" };

  const todayFormatted = new Date().toLocaleDateString("es-MX", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mi Asistencia</h1>
          <p className="text-sm text-neutral-500 capitalize mt-0.5">Revisa tu historial y registra tu asistencia</p>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={cx(
          "rounded-2xl border px-4 py-3 text-sm font-medium",
          toast.type === "ok" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"
        )}>
          {toast.type === "ok" ? "✅" : "❌"} {toast.msg}
        </div>
      )}

      {err && !toast && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{err}</div>
      )}

      {wifiBlocked && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
          📡 <span>Debes conectarte a la <strong>red WiFi de la empresa</strong> para registrar tu asistencia.</span>
        </div>
      )}

      {loadingToday ? (
        <div className="rounded-3xl border bg-white p-8 text-center text-sm text-neutral-500">Cargando...</div>
      ) : today?.is_rest_day ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <div className="text-3xl mb-2">🛋️</div>
          <div className="font-semibold text-emerald-800">Hoy es tu día de descanso</div>
          <div className="text-sm text-emerald-600 mt-1">¡Descansa bien!</div>
          <button
            onClick={() => doAction(() => cancelRestDay(today.date), "Día de descanso cancelado")}
            disabled={busy}
            className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100 transition disabled:opacity-50"
          >
            Cancelar descanso
          </button>
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-3xl border bg-blue-600 p-4 text-white shadow-sm col-span-2">
              <div className="text-xs text-white/70 mb-1">Horas esta semana</div>
              <div className="text-4xl font-bold">{minutesToHHMM(workedThisWeek)}</div>
              <div className="text-xs text-white/70 mt-1 capitalize">{todayFormatted}</div>
            </div>
            <div className="rounded-3xl border bg-white p-4 shadow-sm text-center">
              <div className="text-xs text-neutral-500 mb-1">Días completos</div>
              <div className="text-3xl font-bold text-emerald-600">{completeDays}</div>
            </div>
            <div className="rounded-3xl border bg-white p-4 shadow-sm text-center">
              <div className="text-xs text-neutral-500 mb-1">Estado hoy</div>
              <div className="mt-1 flex justify-center">
                <span className={cx("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium", stateConf.cls)}>
                  <span className={cx("h-2 w-2 rounded-full", stateConf.dot)} />
                  {stateConf.label}
                </span>
              </div>
            </div>
          </div>

          {/* Hora de entrada/salida hoy */}
          {dayInfo && (
            <div className="rounded-3xl border bg-white p-4 shadow-sm">
              <div className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">Registro de hoy</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-neutral-500">Entrada</div>
                  <div className="text-xl font-semibold mt-1">{formatTime(dayInfo.first_check_in_at)}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-500">Salida</div>
                  <div className="text-xl font-semibold mt-1">{formatTime(dayInfo.last_check_out_at)}</div>
                </div>
                {totals && (
                  <>
                    <div>
                      <div className="text-xs text-neutral-500">Tiempo trabajado</div>
                      <div className="text-xl font-semibold mt-1 text-emerald-700">{minutesToHHMM(totals.worked_minutes)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-neutral-500">Pausas</div>
                      <div className="text-xl font-semibold mt-1 text-amber-600">{minutesToHHMM(totals.break_minutes)}</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="rounded-3xl border bg-white p-5 shadow-sm">
            <div className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-4">Control de Asistencia</div>
            <div className="grid grid-cols-2 gap-3">
              <ActionBtn label="Marcar Entrada" icon="🟢" sublabel="Iniciar turno" enabled={actions?.check_in ?? false} busy={busy} variant="primary" onClick={() => doAction(checkIn, "Entrada registrada")} />
              <ActionBtn label="Iniciar Pausa" icon="☕" sublabel="Tomar descanso" enabled={actions?.break_start ?? false} busy={busy} variant="warning" onClick={() => doAction(breakStart, "Pausa iniciada")} />
              <ActionBtn label="Terminar Pausa" icon="▶️" sublabel="Regresar al turno" enabled={actions?.break_end ?? false} busy={busy} variant="warning" onClick={() => doAction(breakEnd, "Pausa terminada")} />
              <ActionBtn label="Marcar Salida" icon="🔴" sublabel="Cerrar turno" enabled={actions?.check_out ?? false} busy={busy} variant="danger" onClick={() => doAction(checkOut, "Salida registrada")} />
            </div>
            <p className="mt-4 text-xs text-neutral-400 text-center">
              {state === "out" && "Marca tu entrada para iniciar el turno."}
              {state === "working" && "Estás en turno activo. Puedes pausar o cerrar."}
              {state === "break" && "Estás en pausa. Recuerda terminarla antes de salir."}
              {state === "closed" && "Tu turno de hoy está cerrado."}
            </p>

            {/* Rest day button */}
            {state === "out" && !today?.is_rest_day && today?.state !== "rest" && (
              <button
                onClick={() => doAction(() => markRestDay(today!.date), "Día de descanso marcado")}
                disabled={busy}
                className="mt-4 w-full rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition disabled:opacity-50"
              >
                🛋️ Marcar día de descanso
              </button>
            )}
          </div>
        </>
      )}

      {/* Historial de la semana - tabla */}
      <div className="rounded-3xl border bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b flex items-center gap-2">
          <span className="text-base">📅</span>
          <div>
            <div className="font-semibold">Historial de la Semana</div>
            <div className="text-xs text-neutral-500">Tus últimos registros de asistencia</div>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="p-6 text-sm text-neutral-500 text-center">Sin registros aún.</div>
        ) : (
          <>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="text-left p-3 pl-5">Día</th>
                    <th className="text-left p-3">Fecha</th>
                    <th className="text-left p-3">Entrada</th>
                    <th className="text-left p-3">Salida</th>
                    <th className="text-left p-3">Horas</th>
                    <th className="text-left p-3">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice(0, 7).map((row) => {
                    const d = new Date(row.date + "T12:00:00");
                    const dayName = d.toLocaleDateString("es-MX", { weekday: "long" });
                    const dateShort = d.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
                    const isToday = row.date === new Date().toISOString().slice(0, 10);
                    return (
                      <tr key={row.id} className={cx("border-t transition", isToday ? "bg-blue-50/40" : "hover:bg-neutral-50/60")}>
                        <td className="p-3 pl-5 capitalize font-medium">{dayName}</td>
                        <td className="p-3 text-neutral-600">{dateShort}</td>
                        <td className="p-3 font-medium">{formatTime(row.first_check_in_at)}</td>
                        <td className="p-3 text-neutral-600">{formatTime(row.last_check_out_at)}</td>
                        <td className="p-3 font-semibold">
                          {row.totals ? minutesToHHMM(row.totals.worked_minutes) : "—"}
                        </td>
                        <td className="p-3"><DayBadge row={row} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Total semanal */}
            <div className="p-4 border-t flex items-center justify-between">
              <span className="text-sm text-neutral-600">Total de horas esta semana:</span>
              <span className="text-base font-bold text-blue-600">{minutesToHHMM(workedThisWeek)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}