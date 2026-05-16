// src/features/semaforo/configStore.ts
// Store local de configuración del semáforo (persiste en localStorage hasta que el backend tenga endpoints)

const STORAGE_KEY = "kore-semaforo-config";

export type CriterioAdminConfig = {
  key: string;
  label: string;
};

export type CriterioPeerConfig = {
  key: string;
  label: string;
  icon: string;
};

export type SemaforoConfigState = {
  criteriosAdmin: CriterioAdminConfig[];
  criteriosPeer: CriterioPeerConfig[];
  pesoAdmin: number;   // %
  pesoPeer: number;    // %
  umbralVerde: number; // % mínimo para verde
  umbralAmarillo: number; // % mínimo para amarillo
};

const DEFAULTS: SemaforoConfigState = {
  criteriosAdmin: [
    { key: "puntualidad", label: "Puntualidad" },
    { key: "responsabilidad", label: "Responsabilidad" },
    { key: "actitud_trabajo", label: "Actitud de Trabajo" },
    { key: "orden_limpieza", label: "Orden y Limpieza" },
    { key: "atencion_cliente", label: "Atención al Cliente" },
    { key: "trabajo_equipo", label: "Trabajo en Equipo" },
    { key: "iniciativa", label: "Iniciativa" },
    { key: "aprendizaje_adaptacion", label: "Aprendizaje / Adaptación" },
  ],
  criteriosPeer: [
    { key: "colaboracion", label: "Colaboración", icon: "🤝" },
    { key: "puntualidad", label: "Puntualidad", icon: "⏰" },
    { key: "actitud", label: "Actitud", icon: "😊" },
    { key: "comunicacion", label: "Comunicación", icon: "💬" },
  ],
  pesoAdmin: 70,
  pesoPeer: 30,
  umbralVerde: 80,
  umbralAmarillo: 60,
};

function load(): SemaforoConfigState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SemaforoConfigState>;
      // Validar que los arrays no estén vacíos (puede pasar por corrupción)
      const criteriosAdmin = parsed.criteriosAdmin && parsed.criteriosAdmin.length > 0
        ? parsed.criteriosAdmin
        : DEFAULTS.criteriosAdmin;
      const criteriosPeer = parsed.criteriosPeer && parsed.criteriosPeer.length > 0
        ? parsed.criteriosPeer
        : DEFAULTS.criteriosPeer;
      return {
        ...DEFAULTS,
        ...parsed,
        criteriosAdmin,
        criteriosPeer,
      };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULTS };
}

function save(state: SemaforoConfigState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

let _state = load();

// ─── API ──────────────────────────────────────────────────────────────────────

export function getConfig(): SemaforoConfigState {
  return { ..._state };
}

export function getCriteriosAdmin(): CriterioAdminConfig[] {
  return [..._state.criteriosAdmin];
}

export function getCriteriosPeer(): CriterioPeerConfig[] {
  return [..._state.criteriosPeer];
}

export function getPesos() {
  return { admin: _state.pesoAdmin, peer: _state.pesoPeer };
}

export function getUmbrales() {
  return { verde: _state.umbralVerde, amarillo: _state.umbralAmarillo };
}

export function setCriteriosAdmin(criterios: CriterioAdminConfig[]) {
  _state = { ..._state, criteriosAdmin: [...criterios] };
  save(_state);
}

export function setCriteriosPeer(criterios: CriterioPeerConfig[]) {
  _state = { ..._state, criteriosPeer: [...criterios] };
  save(_state);
}

export function setPesos(pesoAdmin: number, pesoPeer: number) {
  _state = { ..._state, pesoAdmin, pesoPeer };
  save(_state);
}

export function setUmbrales(umbralVerde: number, umbralAmarillo: number) {
  _state = { ..._state, umbralVerde, umbralAmarillo };
  save(_state);
}

export function resetConfig() {
  _state = { ...DEFAULTS };
  save(_state);
}

// ─── Helpers para cálculos ────────────────────────────────────────────────────

export function calcSemaforoDinamico(score: number | null): "verde" | "amarillo" | "rojo" | null {
  if (score === null) return null;
  const { verde, amarillo } = getUmbrales();
  if (score >= verde) return "verde";
  if (score >= amarillo) return "amarillo";
  return "rojo";
}

export function getMaxScoreAdmin(): number {
  return getCriteriosAdmin().length * 5;
}

export function getRangosTexto() {
  const { verde, amarillo } = getUmbrales();
  return {
    verde: `${verde} – 100%`,
    amarillo: `${amarillo} – ${verde - 1}%`,
    rojo: `0 – ${amarillo - 1}%`,
  };
}


