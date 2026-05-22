// src/features/tasks/hooks/useTaskTimer.ts
// ─── Hook local para cronómetro de tareas ───────────────────────────────────
// Uso: start(taskId) → cronómetro corre → stop() → devuelve duración

import { useState, useRef, useCallback, useEffect } from "react";

export function useTaskTimer() {
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tick = useCallback(() => {
    if (startTimeRef.current) {
      const now = Date.now();
      const seconds = Math.floor((now - startTimeRef.current) / 1000);
      setElapsedSeconds(seconds);
    }
  }, []);

  const start = useCallback((taskId: string) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    startTimeRef.current = Date.now();
    setActiveTaskId(taskId);
    setElapsedSeconds(0);
    setIsRunning(true);
    intervalRef.current = setInterval(tick, 1000);
  }, [tick]);

  const stop = useCallback((): number => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    const final = startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current) / 1000) : 0;
    setIsRunning(false);
    setActiveTaskId(null);
    startTimeRef.current = null;
    return final;
  }, []);

  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setActiveTaskId(null);
    setElapsedSeconds(0);
    setIsRunning(false);
    startTimeRef.current = null;
  }, []);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return {
    activeTaskId,
    elapsedSeconds,
    isRunning,
    start,
    stop,
    reset,
  };
}
