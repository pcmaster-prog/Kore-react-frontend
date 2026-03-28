export type SemaforoColor = 'verde' | 'amarillo' | 'rojo' | null;

export type EvaluadorRol = 'admin' | 'supervisor';

export type Accion =
  | 'mantener_desempeno'
  | 'capacitacion'
  | 'llamada_atencion'
  | 'seguimiento_30_dias';

export type EmployeeEvaluation = {
  id: string;
  empleado_id: string;
  is_active: boolean;
  activated_at: string;
  deactivated_at?: string | null;
  evaluaciones_count: number;
  peer_evaluaciones_count: number;
  semaforo: SemaforoColor;
};

export type EmpleadoConEvaluacion = {
  empleado: {
    id: string;
    full_name: string;
    position_title?: string | null;
    user_id?: string | number | null;
  };
  evaluation: EmployeeEvaluation | null;
};

export type EvaluacionCriterios = {
  puntualidad: number;
  responsabilidad: number;
  actitud_trabajo: number;
  orden_limpieza: number;
  atencion_cliente: number;
  trabajo_equipo: number;
  iniciativa: number;
  aprendizaje_adaptacion: number;
};

export type DesempenoEvaluacion = EvaluacionCriterios & {
  id: string;
  evaluador: { full_name: string; role: string };
  evaluador_rol: EvaluadorRol;
  total: number;
  porcentaje: number;
  acciones: Accion[];
  observaciones?: string | null;
  created_at: string;
};

export type PeerEvaluacion = {
  id: string;
  evaluador?: { full_name: string }; // solo visible para admin
  colaboracion: number;
  puntualidad: number;
  actitud: number;
  comunicacion: number;
  promedio: number;
  porcentaje: number;
};

export type ResultadoCompleto = {
  empleado: { id: string; full_name: string; position_title?: string | null; user_id?: string | number | null; };
  is_active: boolean;
  activated_at: string;
  deactivated_at?: string | null;
  final_score: number | null;
  semaforo: SemaforoColor;
  eval_score: number | null;
  peer_score: number | null;
  evaluaciones: DesempenoEvaluacion[];
  peer_evaluaciones: PeerEvaluacion[];
  peer_count: number;
};

export type CompaneroParaEvaluar = {
  empleado: { id: string; full_name: string; position_title?: string | null; user_id?: string | number | null; };
  evaluation_id: string;
  already_evaluated: boolean;
};
