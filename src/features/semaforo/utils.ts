import type { SemaforoColor, Accion } from './types';

export const SEMAFORO_CONFIG = {
  verde: {
    label: 'Verde',
    badgeBg: '#dcfce7',
    badgeText: '#166534',
    progressColor: '#22c55e',
    dot: '🟢',
    rango: '80 – 100%',
    descripcion: 'Empleado confiable. Buen desempeño.',
  },
  amarillo: {
    label: 'Amarillo',
    badgeBg: '#fef3c7',
    badgeText: '#92400e',
    progressColor: '#f59e0b',
    dot: '🟡',
    rango: '60 – 79%',
    descripcion: 'Empleado funcional pero con áreas de mejora.',
  },
  rojo: {
    label: 'Rojo',
    badgeBg: '#fee2e2',
    badgeText: '#991b1b',
    progressColor: '#ef4444',
    dot: '🔴',
    rango: '0 – 59%',
    descripcion: 'Requiere seguimiento o corrección.',
  },
};

export const CRITERIOS_ADMIN = [
  { key: 'puntualidad',           label: 'Puntualidad' },
  { key: 'responsabilidad',       label: 'Responsabilidad' },
  { key: 'actitud_trabajo',       label: 'Actitud de Trabajo' },
  { key: 'orden_limpieza',        label: 'Orden y Limpieza' },
  { key: 'atencion_cliente',      label: 'Atención al Cliente' },
  { key: 'trabajo_equipo',        label: 'Trabajo en Equipo' },
  { key: 'iniciativa',            label: 'Iniciativa' },
  { key: 'aprendizaje_adaptacion', label: 'Aprendizaje / Adaptación' },
] as const;

export const CRITERIOS_PEER = [
  { key: 'colaboracion', label: 'Colaboración',  icon: '🤝' },
  { key: 'puntualidad',  label: 'Puntualidad',   icon: '⏰' },
  { key: 'actitud',      label: 'Actitud',        icon: '😊' },
  { key: 'comunicacion', label: 'Comunicación',   icon: '💬' },
] as const;

export const ACCIONES_CONFIG: Record<Accion, { label: string; color: string }> = {
  mantener_desempeno:    { label: 'Mantener desempeño',    color: '#1E2D4A' },
  capacitacion:          { label: 'Capacitación',           color: '#3b82f6' },
  llamada_atencion:      { label: 'Llamada de atención',    color: '#f59e0b' },
  seguimiento_30_dias:   { label: 'Seguimiento en 30 días', color: '#8b5cf6' },
};

export function calcSemaforo(score: number | null): SemaforoColor {
  if (score === null) return null;
  if (score >= 80) return 'verde';
  if (score >= 60) return 'amarillo';
  return 'rojo';
}

export function initials(name: string): string {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}
