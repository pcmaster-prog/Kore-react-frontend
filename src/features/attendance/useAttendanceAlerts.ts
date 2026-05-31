import { useEffect, useRef } from "react";
import type { TodayResponse } from "./api";

export type AttendanceAlert = {
  type: "check_in" | "break_start" | "break_end" | "check_out" | "lunch" | "exit_soon";
  title: string;
  body: string;
};

function dispatchAlert(alert: AttendanceAlert) {
  window.dispatchEvent(
    new CustomEvent("kore-notification", {
      detail: {
        title: alert.title,
        body: alert.body,
        data: { type: alert.type },
      },
    })
  );
}

/**
 * Detecta cambios en las acciones disponibles de asistencia y dispara
 * notificaciones locales (in-app) cuando el empleado puede realizar una acción.
 *
 * NO depende de push notifications. Funciona como fallback robusto.
 */
export function useAttendanceAlerts(today: TodayResponse | null) {
  const prevRef = useRef<TodayResponse | null>(null);

  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = today;

    if (!today) return;
    if (!prev) return; // Primera carga: no alertar para no spamear

    const prevActions = prev.actions;
    const currActions = today.actions;

    // 1. Entrada habilitada
    if (!prevActions?.check_in && currActions?.check_in) {
      dispatchAlert({
        type: "check_in",
        title: "¡Buenos días!",
        body: "Ya puedes registrar tu entrada.",
      });
    }

    // 2. Descanso habilitado
    if (!prevActions?.break_start && currActions?.break_start) {
      dispatchAlert({
        type: "break_start",
        title: "Momento de descansar",
        body: "Puedes iniciar tu descanso ahora.",
      });
    }

    // 3. Fin de descanso habilitado
    if (!prevActions?.break_end && currActions?.break_end) {
      dispatchAlert({
        type: "break_end",
        title: "Fin del descanso",
        body: "Ya puedes finalizar tu descanso.",
      });
    }

    // 4. Salida habilitada
    if (!prevActions?.check_out && currActions?.check_out) {
      dispatchAlert({
        type: "check_out",
        title: "Jornada completada",
        body: "Ya puedes registrar tu salida. ¡Buen trabajo!",
      });
    }

    // 5. Recordatorio de comida (nuevo campo del contrato, puede no existir aún)
    const prevLunch = (prev as any)?.lunch_reminder_sent ?? false;
    const currLunch = (today as any)?.lunch_reminder_sent ?? false;
    if (!prevLunch && currLunch) {
      dispatchAlert({
        type: "lunch",
        title: "🍽️ Es hora de comer",
        body: "Tu horario de comida ha comenzado. Presiona 'Iniciar tiempo de comida'.",
      });
    }

    // 6. Aviso 5 min antes de salida (nuevo campo del contrato)
    const prevExit = (prev as any)?.exit_reminder_sent ?? false;
    const currExit = (today as any)?.exit_reminder_sent ?? false;
    if (!prevExit && currExit) {
      dispatchAlert({
        type: "exit_soon",
        title: "⏰ Tu jornada está por terminar",
        body: "Faltan 5 minutos para completar tu horario.",
      });
    }
  }, [today]);
}
