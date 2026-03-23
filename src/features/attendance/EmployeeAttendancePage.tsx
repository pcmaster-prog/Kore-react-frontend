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
import {
  LogIn, LogOut, Coffee, Play, Moon, XCircle,
  Clock, CheckCircle2, AlertTriangle, Calendar,
  Timer, Wifi, Loader2,
} from "lucide-react";

function cx(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(" ");
}

// ─── Badge estado del día ─────────────────────────────────────────
function DayBadge({ row }: { row: MyDayRow }) {
  const checkedIn = !!row.first_check_in_at;
  const closed = row.status === "closed";
  if (!checkedIn) return <span className="inline-flex items-center gap-1.5 rounded-xl border border-rose-100 bg-rose-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-500"><span className="h-1.5 w-1.5 rounded-full bg-rose-400" />Ausente</span>;
  if (closed) return <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Presente</span>;
  return <span className="inline-flex items-center gap-1.5 rounded-xl border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-600"><span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />En curso</span>;
}

// ─── Botón de acción ──────────────────────────────────────────────
function ActionBtn({
  label, icon, sublabel, enabled, busy, variant, onClick,
}: {
  label: string; icon: React.ReactNode; sublabel?: string;
  enabled: boolean; busy: boolean;
  variant: "primary" | "warning" | "danger" | "neutral";
  onClick: () => void;
}) {
  const v = {
    primary: "bg-white border-neutral-100 text-obsidian hover:bg-emerald-50 hover:border-emerald-200",
    warning: "bg-white border-neutral-100 text-obsidian hover:bg-amber-50 hover:border-amber-200",
    danger: "bg-white border-neutral-100 text-obsidian hover:bg-neutral-50",
    neutral: "bg-neutral-50 border-neutral-100 text-neutral-300 cursor-not-allowed",
  }[variant];

  return (
    <button
      onClick={onClick}
      disabled={!enabled || busy}
      className={cx(
        "flex flex-col items-center justify-center gap-3 rounded-[28px] border-2 p-6 text-center transition-all w-full shadow-sm",
        "disabled:opacity-30 disabled:cursor-not-allowed",
        v
      )}
    >
      <div className={cx(
        "h-12 w-12 rounded-2xl flex items-center justify-center",
        variant === "primary" ? "bg-emerald-100 text-emerald-600" :
        variant === "warning" ? "bg-amber-100 text-amber-600" :
        variant === "danger" ? "bg-neutral-100 text-obsidian" :
        "bg-neutral-100 text-neutral-300"
      )}>
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : icon}
      </div>
      <div>
        <div className="text-sm font-black tracking-tight">{label}</div>
        {sublabel && <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mt-0.5">{sublabel}</div>}
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
    } catch { /* silent */ }
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
        showToast("err", "Debes estar conectado a la red WiFi de la empresa.");
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

  const todayMinutes = today?.totals?.worked_minutes ?? 0;
  const historyMinutes = history
    .filter(d => d.date !== today?.date)
    .slice(0, 7)
    .reduce((acc, d) => acc + (d.totals?.worked_minutes ?? 0), 0);
  const workedThisWeek = todayMinutes + historyMinutes;
  const completeDays = history.filter((d) => d.status === "closed" && !!d.first_check_in_at).length;

  const stateConf = {
    working: { label: "Jornada Activa", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30", dot: "bg-emerald-400" },
    break: { label: "En Pausa", cls: "bg-amber-500/15 text-amber-300 border-amber-400/30", dot: "bg-amber-400" },
    closed: { label: "Turno Cerrado", cls: "bg-neutral-500/15 text-neutral-300 border-neutral-400/30", dot: "bg-neutral-400" },
    rest: { label: "Día de Descanso", cls: "bg-sky-500/15 text-sky-300 border-sky-400/30", dot: "bg-sky-400" },
    out: { label: "Sin Turno", cls: "bg-neutral-500/15 text-neutral-300 border-neutral-400/30", dot: "bg-neutral-400" },
  }[state] ?? { label: state, cls: "bg-neutral-500/15 text-neutral-300 border-neutral-400/30", dot: "bg-neutral-300" };

  const todayFormatted = new Date().toLocaleDateString("es-MX", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em] mb-1">Registro de Jornada</p>
        <h1 className="text-3xl font-black text-obsidian tracking-tight">Mi Asistencia</h1>
      </div>

      {/* Toast */}
      {toast && (
        <div className={cx(
          "rounded-2xl border px-5 py-3 text-sm font-bold flex items-center gap-3",
          toast.type === "ok" ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-rose-50 border-rose-100 text-rose-700"
        )}>
          {toast.type === "ok" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      {err && !toast && (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-5 py-3 text-sm font-medium text-rose-700 flex items-center gap-3">
          <AlertTriangle className="h-4 w-4 shrink-0" />{err}
        </div>
      )}

      {wifiBlocked && (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 px-5 py-3 text-sm font-bold text-amber-700 flex items-center gap-3">
          <Wifi className="h-4 w-4 shrink-0" />
          Debes conectarte a la <strong>red WiFi de la empresa</strong> para registrar tu asistencia.
        </div>
      )}

      {loadingToday ? (
        <div className="rounded-[40px] border bg-white p-16 flex flex-col items-center gap-4 text-neutral-400">
          <div className="h-10 w-10 border-4 border-neutral-100 border-t-obsidian rounded-full animate-spin" />
          <span className="text-xs font-bold uppercase tracking-widest">Cargando...</span>
        </div>
      ) : today?.is_rest_day ? (
        <div className="rounded-[40px] border border-emerald-100 bg-emerald-50 p-10 text-center">
          <div className="h-16 w-16 rounded-[20px] bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <Moon className="h-8 w-8 text-emerald-600" />
          </div>
          <div className="font-black text-2xl text-emerald-800">Hoy es tu día de descanso</div>
          <div className="text-sm text-emerald-600 mt-2">¡Descansa bien!</div>
          <button
            onClick={() => doAction(() => cancelRestDay(today.date), "Día de descanso cancelado")}
            disabled={busy}
            className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-100 transition disabled:opacity-50"
          >
            <XCircle className="h-3.5 w-3.5" />Cancelar descanso
          </button>
        </div>
      ) : (
        <>
          {/* Hero state card */}
          <div className="rounded-[40px] bg-obsidian p-8 text-white relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/[0.03]" />
              <div className="absolute bottom-0 left-1/3 h-16 w-32 rounded-full bg-gold/10" />
            </div>
            <div className="relative flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest mb-4 {stateConf.cls}">
                  <span className={cx("h-2 w-2 rounded-full animate-pulse", stateConf.dot)} />
                  {stateConf.label}
                </div>
                <div className="text-5xl font-black tracking-tight tabular-nums">{minutesToHHMM(todayMinutes)}</div>
                <div className="text-white/40 text-xs font-bold mt-2 capitalize">{todayFormatted}</div>
              </div>
              <div className="text-right space-y-3">
                <div>
                  <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Entrada</div>
                  <div className="text-lg font-black">{formatTime(dayInfo?.first_check_in_at)}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Salida</div>
                  <div className="text-lg font-black">{formatTime(dayInfo?.last_check_out_at)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* KPI minibar */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-[28px] border border-neutral-100 bg-white p-5 shadow-sm text-center">
              <Timer className="h-5 w-5 text-neutral-200 mx-auto mb-2" />
              <div className="text-2xl font-black text-obsidian">{minutesToHHMM(workedThisWeek)}</div>
              <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">Esta semana</div>
            </div>
            <div className="rounded-[28px] border border-neutral-100 bg-white p-5 shadow-sm text-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-200 mx-auto mb-2" />
              <div className="text-2xl font-black text-emerald-600">{completeDays}</div>
              <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">Días completos</div>
            </div>
            <div className="rounded-[28px] border border-neutral-100 bg-white p-5 shadow-sm text-center">
              <Clock className="h-5 w-5 text-amber-200 mx-auto mb-2" />
              <div className="text-2xl font-black text-amber-600">{minutesToHHMM(totals?.break_minutes ?? 0)}</div>
              <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">Pausas hoy</div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="rounded-[40px] border border-neutral-100 bg-white p-6 shadow-sm">
            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-5">Acciones Rápidas</div>
            <div className="grid grid-cols-2 gap-4">
              <ActionBtn label="Entrada" icon={<LogIn className="h-5 w-5" />} enabled={actions?.check_in ?? false} busy={busy} variant="primary" onClick={() => doAction(checkIn, "Entrada registrada")} />
              <ActionBtn label="Salida" icon={<LogOut className="h-5 w-5" />} enabled={actions?.check_out ?? false} busy={busy} variant="danger" onClick={() => doAction(checkOut, "Salida registrada")} />
              <ActionBtn label="Inicio Descanso" icon={<Coffee className="h-5 w-5" />} enabled={actions?.break_start ?? false} busy={busy} variant="warning" onClick={() => doAction(breakStart, "Pausa iniciada")} />
              <ActionBtn label="Fin Descanso" icon={<Play className="h-5 w-5" />} enabled={actions?.break_end ?? false} busy={busy} variant="warning" onClick={() => doAction(breakEnd, "Pausa terminada")} />
            </div>

            {state === "out" && !today?.is_rest_day && today?.state !== "rest" && (
              <button
                onClick={() => doAction(() => markRestDay(today!.date), "Día de descanso marcado")}
                disabled={busy}
                className="mt-5 w-full rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 px-4 py-3.5 text-sm font-bold text-neutral-500 hover:bg-neutral-100 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Moon className="h-4 w-4" />Marcar día de descanso
              </button>
            )}
          </div>
        </>
      )}

      {/* History table */}
      <div className="rounded-[40px] border border-neutral-100 bg-white shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-neutral-50 flex items-center gap-3">
          <Calendar className="h-5 w-5 text-neutral-300" />
          <div>
            <h3 className="text-sm font-black text-obsidian tracking-tight">Actividad de la Semana</h3>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5">Tus últimos registros</p>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="h-10 w-10 text-neutral-100 mx-auto mb-3" />
            <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Sin registros aún</p>
          </div>
        ) : (
          <>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50/80 border-b border-neutral-50">
                  <tr>
                    {["Día", "Fecha", "Entrada", "Salida", "Horas", "Estado"].map((h) => (
                      <th key={h} className="text-left px-5 py-4 text-[10px] font-bold text-neutral-400 uppercase tracking-[0.1em]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.slice(0, 7).map((row) => {
                    const d = new Date(row.date + "T12:00:00");
                    const dayName = d.toLocaleDateString("es-MX", { weekday: "long" });
                    const dateShort = d.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
                    const isToday = row.date === new Date().toISOString().slice(0, 10);
                    return (
                      <tr key={row.id} className={cx("border-t border-neutral-50 transition", isToday ? "bg-blue-50/30" : "hover:bg-neutral-50/50")}>
                        <td className="px-5 py-4 capitalize text-sm font-bold text-obsidian">{dayName}</td>
                        <td className="px-5 py-4 text-sm text-neutral-400">{dateShort}</td>
                        <td className="px-5 py-4 font-bold text-sm text-obsidian">{formatTime(row.first_check_in_at)}</td>
                        <td className="px-5 py-4 text-sm text-neutral-400">{formatTime(row.last_check_out_at)}</td>
                        <td className="px-5 py-4 font-black text-sm text-obsidian">
                          {row.totals ? minutesToHHMM(row.totals.worked_minutes) : "—"}
                        </td>
                        <td className="px-5 py-4"><DayBadge row={row} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-8 py-5 border-t border-neutral-50 bg-neutral-50/50 flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Total semanal</span>
              <span className="text-xl font-black text-obsidian">{minutesToHHMM(workedThisWeek)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}