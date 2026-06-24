// src/hooks/useThemeMode.ts
import { useState, useEffect, useCallback } from "react";

export type ThemeMode = "system" | "light" | "dark";

const STORAGE_KEY = "kore_preferences";

interface Preferences {
  notifications?: boolean;
  language?: string;
  theme?: ThemeMode;
}

function readPreferences(): Preferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Preferences) : {};
  } catch {
    return {};
  }
}

function writePreferences(prefs: Preferences) {
  try {
    const current = readPreferences();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...prefs }));
  } catch {
    // ignore
  }
}

function getSystemIsDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyClass(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  const shouldDark = mode === "dark" || (mode === "system" && getSystemIsDark());
  document.documentElement.classList.toggle("dark", shouldDark);
}

export function useThemeMode() {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const prefs = readPreferences();
    return prefs.theme ?? "system";
  });

  const applyMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    writePreferences({ theme: next });
    applyClass(next);
  }, []);

  useEffect(() => {
    applyClass(mode);
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyClass(mode);
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [mode]);

  const resolvedIsDark =
    mode === "dark" || (mode === "system" && getSystemIsDark());

  const syncWithBackend = useCallback(
    async (api: { put: (path: string, body: unknown) => Promise<unknown> }) => {
      try {
        await api.put("/users/preferences", { theme: mode });
      } catch {
        // Silencioso: no bloquear la UI si falla el sync
      }
    },
    [mode]
  );

  return {
    mode,
    setMode: applyMode,
    resolvedIsDark,
    syncWithBackend,
  };
}
