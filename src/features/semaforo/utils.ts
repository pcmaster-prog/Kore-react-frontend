import type { SemaforoColor, Accion } from './types';
import {
  getCriteriosAdmin,
  getCriteriosPeer,
  getUmbrales,
  getRangosTexto,
  getPesos,
  getMaxScoreAdmin,
  calcSemaforoDinamico,
} from './configStore';

// Re-export dinámicos para compatibilidad con componentes existentes
export { getCriteriosAdmin, getCriteriosPeer, getUmbrales, getRangosTexto, getPesos, getMaxScoreAdmin, calcSemaforoDinamico };

// Config visual del semáforo (colores y descripciones se mantienen estáticos, rangos son dinámicos)
export const SEMAFORO_CONFIG = {
  verde: {
    label: 'Verde',
    badgeBg: '#dcfce7',
    badgeText: '#166534',
    progressColor: '#22c55e',
    dot: '🟢',
    get rango() { return getRangosTexto().verde; },
    descripcion: 'Empleado confiable. Buen desempeño.',
  },
  amarillo: {
    label: 'Amarillo',
    badgeBg: '#fef3c7',
    badgeText: '#92400e',
    progressColor: '#f59e0b',
    dot: '🟡',
    get rango() { return getRangosTexto().amarillo; },
    descripcion: 'Empleado funcional pero con áreas de mejora.',
  },
  rojo: {
    label: 'Rojo',
    badgeBg: '#fee2e2',
    badgeText: '#991b1b',
    progressColor: '#ef4444',
    dot: '🔴',
    get rango() { return getRangosTexto().rojo; },
    descripcion: 'Requiere seguimiento o corrección.',
  },
};

// Constantes legacy para compatibilidad con código que aún no migra
export const CRITERIOS_ADMIN = getCriteriosAdmin();
export const CRITERIOS_PEER = getCriteriosPeer();

export const ACCIONES_CONFIG: Record<Accion, { label: string; color: string }> = {
  mantener_desempeno:    { label: 'Mantener desempeño',    color: '#1E2D4A' },
  capacitacion:          { label: 'Capacitación',           color: '#3b82f6' },
  llamada_atencion:      { label: 'Llamada de atención',    color: '#f59e0b' },
  seguimiento_30_dias:   { label: 'Seguimiento en 30 días', color: '#8b5cf6' },
};

// calcSemaforo legacy — ahora delega al dinámico
export function calcSemaforo(score: number | null): SemaforoColor {
  return calcSemaforoDinamico(score) as SemaforoColor;
}

export function initials(name: string): string {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

