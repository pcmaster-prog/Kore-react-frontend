import { useEffect, useRef } from "react";

const DEFAULT_INTERVAL_MS = 30_000; // 30 segundos

/**
 * Ejecuta `fn` cada `intervalMs` mientras la pestaña esté visible.
 * Pausa automáticamente cuando el documento está oculto.
 * Se reanuda inmediatamente al volver visible.
 */
export function useAttendancePolling(fn: () => void | Promise<void>, intervalMs = DEFAULT_INTERVAL_MS) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    function tick() {
      try {
        fnRef.current();
      } catch {
        // Silencioso: el llamador debe manejar sus propios errores
      }
    }

    function start() {
      if (intervalRef.current) return;
      intervalRef.current = setInterval(tick, intervalMs);
    }

    function stop() {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    function handleVisibility() {
      if (document.visibilityState === "hidden") {
        stop();
      } else {
        tick(); // refrescar inmediatamente al volver
        start();
      }
    }

    // Iniciar
    tick();
    start();
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [intervalMs]);
}
