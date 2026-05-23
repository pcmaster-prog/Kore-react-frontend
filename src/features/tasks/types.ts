//features/tasks/types.ts

// ═══════════════════════════════════════════════════════════════════════════
// ① TIPOS LEGACY (no modificar — usados por vistas existentes)
// ═══════════════════════════════════════════════════════════════════════════

export type TaskStatus = "open" | "in_progress" | "completed";

export type Task = {
  id: string;
  title: string;
  description?: string | null;
  priority?: string | null;
  status: TaskStatus;
  due_at?: string | null;
  created_at: string;
  meta?: Record<string, any> | null;
  /** Sección a la que pertenece la tarea */
  section?: string | null;
  /** Departamento al que pertenece la tarea */
  department?: string | null;

  // Campos enriquecidos desde el backend (eager-load)
  has_evidence?: boolean | null;
  evidence_count?: number | null;
  assignee_name?: string | null;
  empleado?: {
    id: string;
    full_name?: string | null;
    name?: string | null;
    avatar_url?: string | null;
  } | null;
  assignees?: any[] | null;
};

export type Paginated<T> = {
  current_page: number;
  data: T[];
  last_page: number;
  per_page: number;
  total: number;
};

// ═══════════════════════════════════════════════════════════════════════════
// ② NUEVOS TIPOS — Módulo Tareas por Área/Sección (v2)
// ═══════════════════════════════════════════════════════════════════════════

export interface Area {
  id: string;
  name: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
  sections?: Section[];
}

export interface Section {
  id: string;
  areaId: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

export interface Position {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  baseTasks?: TaskTemplate[];
}

export interface TaskTemplate {
  id: string;
  title: string;
  description?: string | null;
  priority?: string | null;
  estimated_minutes?: number | null;
  isActive: boolean;
}

export type AssigneeType = 'empleado' | 'position' | 'section_supervisor';

export interface TaskAssignmentRuleItem {
  id: string;
  ruleId: string;
  templateId: string;
  template: TaskTemplate;
  sortOrder: number;
  isActive: boolean;
}

export interface TaskAssignmentRule {
  id: string;
  // Legacy: soporte para reglas con un solo template (se migran a items)
  taskTemplateId?: string;
  templateTitle?: string;
  // Nuevo: reglas multitemplate
  items: TaskAssignmentRuleItem[];
  assigneeType: AssigneeType;
  assigneeId?: string;
  sectionId?: string;
  dayOfWeek: number[];
  triggerTime?: string;
  triggerEvent: 'time' | 'attendance_checkin' | 'both';
  isActive: boolean;
}

export type IncidentType = 'missing_material' | 'broken_equipment' | 'other';
export type IncidentStatus = 'open' | 'resolved' | 'dismissed';

export interface Incident {
  id: string;
  taskId: string;
  taskAssigneeId?: string;
  reportedBy: string;
  type: IncidentType;
  description: string;
  status: IncidentStatus;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
}

export type EvidenceType = 'photo' | 'voice_note' | 'text_note' | 'file';

export interface Evidence {
  id: string;
  taskId?: string;
  taskAssigneeId?: string;
  evidenceType: EvidenceType;
  disk: string;
  path: string;
  originalName: string;
  mime: string;
  size: number;
  createdAt: string;
}

export type TaskV2Status = 'open' | 'in_progress' | 'done_pending' | 'approved' | 'rejected' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TaskV2 {
  id: string;
  name: string;
  description: string;
  areaId?: string;
  sectionId?: string;
  priority: TaskPriority;
  assignedTo?: string[];
  dueDate?: string;
  estimatedTime?: number;
  actualTime?: number;
  status: TaskV2Status;
  completed: boolean;
  attachments: Evidence[];
  checklist: ChecklistItem[];
  notes: string;
  incidents: Incident[];
  startedAt?: string;
  area?: Area;
  section?: Section;
  isBlocked?: boolean;
}

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export type RoutineScheduleAssigneeType = 'empleado' | 'position' | 'section' | 'area' | null;

export interface RoutineSchedule {
  id: string;
  routineId: string;
  routineName?: string;
  triggerTime: string;
  triggerDays: number[];
  autoAssign: boolean;
  notifyPush: boolean;
  isActive: boolean;
  assigneeType?: RoutineScheduleAssigneeType;
  assigneeId?: string | null;
  areaId?: string | null;
  sectionId?: string | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// ③ TIPOS DE REQUEST/RESPONSE AUXILIARES
// ═══════════════════════════════════════════════════════════════════════════

export type CreateAreaPayload = Omit<Area, 'id' | 'sections'>;
export type UpdateAreaPayload = Partial<Omit<Area, 'id' | 'sections'>>;

export type CreateSectionPayload = Omit<Section, 'id'>;
export type UpdateSectionPayload = Partial<Omit<Section, 'id'>>;

export type CreatePositionPayload = Omit<Position, 'id' | 'baseTasks'>;
export type UpdatePositionPayload = Partial<Omit<Position, 'id' | 'baseTasks'>>;

export type CreateTaskAssignmentRulePayload = {
  template_ids: string[];
  assignee_type: 'empleado' | 'position' | 'section_supervisor';
  assignee_id?: string | null;
  section_id?: string | null;
  day_of_week: number[];
  trigger_time?: string;
  trigger_event?: 'time' | 'attendance_checkin' | 'both';
  is_active?: boolean;
};

export type UpdateTaskAssignmentRulePayload = Partial<CreateTaskAssignmentRulePayload>;

export type CreateIncidentPayload = Omit<Incident, 'id' | 'status' | 'resolvedBy' | 'resolvedAt' | 'createdAt'>;

export type CreateRoutineSchedulePayload = Omit<RoutineSchedule, 'id'>;
export type UpdateRoutineSchedulePayload = Partial<Omit<RoutineSchedule, 'id'>>;

// ═══════════════════════════════════════════════════════════════════════════
// ④ NUEVOS TIPOS — Empleado-Secciones y Tareas Huérfanas
// ═══════════════════════════════════════════════════════════════════════════

export interface EmpleadoSection {
  id: string;
  empleado_id: string;
  section_id: string;
  section_name?: string;
  area_name?: string;
  is_primary: boolean;
  // Objetos anidados cuando el backend eager-load
  section?: Section;
  area?: Area;
}

export interface UnassignedTask {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  area: { id: string; name: string } | null;
  section: { id: string; name: string } | null;
  unassigned_reason: string;
  created_at: string;
}
