import api from '@/lib/http';
import type {
  EmpleadoConEvaluacion, ResultadoCompleto,
  EvaluacionCriterios, Accion, CompaneroParaEvaluar
} from './types';

// ── Admin ──────────────────────────────────────────────────────────────────
export const listEmpleadosEvaluacion = () =>
  api.get('/semaforo/empleados').then(r => r.data as EmpleadoConEvaluacion[]);

export const activarEvaluacion = (empleadoId: string) =>
  api.post(`/semaforo/empleados/${empleadoId}/activar`).then(r => r.data);

export const desactivarEvaluacion = (empleadoId: string) =>
  api.post(`/semaforo/empleados/${empleadoId}/desactivar`).then(r => r.data);

export const getResultado = (empleadoId: string) =>
  api.get(`/semaforo/empleados/${empleadoId}/resultado`).then(r => r.data as ResultadoCompleto);

export const evaluarEmpleado = (data: EvaluacionCriterios & {
  empleado_id: string;
  acciones?: Accion[];
  observaciones?: string;
}) => api.post('/semaforo/evaluaciones', data).then(r => r.data);

// ── Supervisor ────────────────────────────────────────────────────────────
export const getPendientesSupervisor = () =>
  api.get('/semaforo/mis-evaluaciones-pendientes').then(r => r.data as EmpleadoConEvaluacion[]);

// ── Empleado ──────────────────────────────────────────────────────────────
export const getCompanerosParaEvaluar = () =>
  api.get('/semaforo/companeros').then(r => r.data as {
    companeros: CompaneroParaEvaluar[];
    progress: { evaluated: number; total: number };
  });

export const enviarPeerEvaluacion = (data: {
  employee_evaluation_id: string;
  evaluado_empleado_id: string;
  colaboracion: number;
  puntualidad: number;
  actitud: number;
  comunicacion: number;
}) => api.post('/semaforo/peer-evaluaciones', data).then(r => r.data);
