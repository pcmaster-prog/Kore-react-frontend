// src/mocks/taskAreaMocks.ts
// ─── Mock data para el módulo de Tareas por Área/Sección ───────────────────
// Usar mientras el backend implementa los endpoints reales.
// Cuando esté listo: poner USE_MOCKS = false en este archivo.

import type {
  Area,
  Section,
  Position,
  TaskTemplate,
  TaskAssignmentRule,
  RoutineSchedule,
  Incident,
  TaskV2,
  CreateAreaPayload,
  UpdateAreaPayload,
  CreateSectionPayload,
  UpdateSectionPayload,
  CreatePositionPayload,
  UpdatePositionPayload,
  CreateTaskAssignmentRulePayload,
  UpdateTaskAssignmentRulePayload,
  CreateIncidentPayload,
  CreateRoutineSchedulePayload,
  UpdateRoutineSchedulePayload,
  Evidence,
} from "@/features/tasks/types";

// ─── Toggle ──────────────────────────────────────────────────────────────────
export const USE_MOCKS = true;

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
let idCounter = 1;
const nextId = () => `mock-${String(idCounter++).padStart(3, '0')}`;

// ─── Datos Demo ──────────────────────────────────────────────────────────────

export const MOCK_AREAS: Area[] = [
  { id: "area-001", name: "Patio", icon: "Sun", sortOrder: 1, isActive: true },
  { id: "area-002", name: "Mostrador", icon: "Store", sortOrder: 2, isActive: true },
  { id: "area-003", name: "Almacén", icon: "Package", sortOrder: 3, isActive: true },
  { id: "area-004", name: "Caja", icon: "CreditCard", sortOrder: 4, isActive: true },
  { id: "area-005", name: "Producción", icon: "Factory", sortOrder: 5, isActive: true },
];

export const MOCK_SECTIONS: Section[] = [
  { id: "sec-001", areaId: "area-001", name: "Limpieza exterior", sortOrder: 1, isActive: true },
  { id: "sec-002", areaId: "area-001", name: "Estacionamiento", sortOrder: 2, isActive: true },
  { id: "sec-003", areaId: "area-002", name: "Atención cliente", sortOrder: 1, isActive: true },
  { id: "sec-004", areaId: "area-002", name: "Exhibición", sortOrder: 2, isActive: true },
  { id: "sec-005", areaId: "area-003", name: "Recepción mercancía", sortOrder: 1, isActive: true },
  { id: "sec-006", areaId: "area-003", name: "Inventario", sortOrder: 2, isActive: true },
  { id: "sec-007", areaId: "area-004", name: "Cobro", sortOrder: 1, isActive: true },
  { id: "sec-008", areaId: "area-004", name: "Corte", sortOrder: 2, isActive: true },
  { id: "sec-009", areaId: "area-005", name: "Preparación", sortOrder: 1, isActive: true },
  { id: "sec-010", areaId: "area-005", name: "Empaque", sortOrder: 2, isActive: true },
];

export const MOCK_POSITIONS: Position[] = [
  { id: "pos-001", name: "Supervisor de Turno", description: "Coordina operaciones del turno", isActive: true },
  { id: "pos-002", name: "Cajero", description: "Atiende pagos y corte de caja", isActive: true },
  { id: "pos-003", name: "Almacenista", description: "Maneja inventario y recepción", isActive: true },
];

export const MOCK_EVIDENCES: Evidence[] = [
  {
    id: "ev-001", taskId: "task-001", evidenceType: "photo",
    disk: "local", path: "/uploads/ev-001.jpg", originalName: "patio_limpio.jpg",
    mime: "image/jpeg", size: 204800, createdAt: "2026-05-20T08:30:00Z",
  },
  {
    id: "ev-002", taskId: "task-002", evidenceType: "text_note",
    disk: "local", path: "/uploads/ev-002.txt", originalName: "nota.txt",
    mime: "text/plain", size: 120, createdAt: "2026-05-20T09:15:00Z",
  },
];

export const MOCK_TASKS: TaskV2[] = [
  {
    id: "task-001",
    name: "Lavar piso del patio",
    description: "Limpieza profunda del área exterior usando jabón desinfectante",
    areaId: "area-001",
    sectionId: "sec-001",
    priority: "medium",
    assignedTo: ["emp-001"],
    dueDate: "2026-05-20",
    estimatedTime: 30,
    actualTime: 0,
    status: "open",
    completed: false,
    attachments: [MOCK_EVIDENCES[0]],
    checklist: [
      { id: "chk-001", label: "Verificar jabón", done: false },
      { id: "chk-002", label: "Trapear toda el área", done: false },
      { id: "chk-003", label: "Revisar desagüe", done: false },
    ],
    notes: "",
    incidents: [],
    isBlocked: false,
  },
  {
    id: "task-002",
    name: "Revisar basura",
    description: "Verificar que todos los contenedores estén vacíos y limpios",
    areaId: "area-001",
    sectionId: "sec-001",
    priority: "high",
    assignedTo: ["emp-001"],
    dueDate: "2026-05-20",
    estimatedTime: 15,
    actualTime: 0,
    status: "open",
    completed: false,
    attachments: [MOCK_EVIDENCES[1]],
    checklist: [
      { id: "chk-004", label: "Contenedor principal", done: false },
      { id: "chk-005", label: "Contenedor de reciclaje", done: false },
    ],
    notes: "",
    incidents: [],
    isBlocked: false,
  },
  {
    id: "task-003",
    name: "Organizar exhibición",
    description: "Alinear productos en el mostrador según planograma",
    areaId: "area-002",
    sectionId: "sec-004",
    priority: "low",
    assignedTo: ["emp-002"],
    dueDate: "2026-05-20",
    estimatedTime: 45,
    actualTime: 0,
    status: "in_progress",
    completed: false,
    attachments: [],
    checklist: [
      { id: "chk-006", label: "Revisar planograma", done: true },
      { id: "chk-007", label: "Alinear productos", done: false },
      { id: "chk-008", label: "Verificar precios", done: false },
    ],
    notes: "Empezada a las 8:00",
    incidents: [],
    startedAt: "2026-05-20T08:00:00Z",
    isBlocked: false,
  },
  {
    id: "task-004",
    name: "Corte de caja matutino",
    description: "Realizar corte de caja del turno matutino",
    areaId: "area-004",
    sectionId: "sec-007",
    priority: "urgent",
    assignedTo: ["emp-003"],
    dueDate: "2026-05-20",
    estimatedTime: 20,
    actualTime: 0,
    status: "open",
    completed: false,
    attachments: [],
    checklist: [
      { id: "chk-009", label: "Contar efectivo", done: false },
      { id: "chk-010", label: "Imprimir reporte", done: false },
    ],
    notes: "",
    incidents: [],
    isBlocked: true, // bloqueada hasta check-in
  },
  {
    id: "task-005",
    name: "Recepción de mercancía",
    description: "Recibir y revisar pedido del proveedor",
    areaId: "area-003",
    sectionId: "sec-005",
    priority: "medium",
    assignedTo: ["emp-004"],
    dueDate: "2026-05-20",
    estimatedTime: 60,
    actualTime: 0,
    status: "done_pending",
    completed: false,
    attachments: [],
    checklist: [
      { id: "chk-011", label: "Verificar guía", done: true },
      { id: "chk-012", label: "Contar piezas", done: true },
      { id: "chk-013", label: "Revisar daños", done: true },
    ],
    notes: "Todo en orden",
    incidents: [],
    isBlocked: false,
  },
];

export const MOCK_ASSIGNMENT_RULES: TaskAssignmentRule[] = [
  {
    id: "rule-001",
    taskTemplateId: "tpl-001",
    assigneeType: "position",
    assigneeId: "pos-002",
    dayOfWeek: [1, 2, 3, 4, 5],
    triggerTime: "08:00",
    triggerEvent: "time",
    isActive: true,
  },
  {
    id: "rule-002",
    taskTemplateId: "tpl-002",
    assigneeType: "section_supervisor",
    sectionId: "sec-001",
    dayOfWeek: [1, 3, 5],
    triggerEvent: "attendance_checkin",
    isActive: true,
  },
];

export const MOCK_ROUTINE_SCHEDULES: RoutineSchedule[] = [
  {
    id: "rs-001",
    routineId: "rt-001",
    triggerTime: "07:00",
    triggerDays: [1, 2, 3, 4, 5],
    autoAssign: true,
    notifyPush: true,
    isActive: true,
  },
];

export const MOCK_INCIDENTS: Incident[] = [
  {
    id: "inc-001",
    taskId: "task-001",
    reportedBy: "emp-001",
    type: "missing_material",
    description: "No hay jabón desinfectante en la bodega",
    status: "open",
    createdAt: "2026-05-20T08:15:00Z",
  },
];

// ─── Helper: attach sections to areas ────────────────────────────────────────
function areasWithSections(): Area[] {
  return MOCK_AREAS.map((a) => ({
    ...a,
    sections: MOCK_SECTIONS.filter((s) => s.areaId === a.id),
  }));
}

// ═══════════════════════════════════════════════════════════════════════════
// MOCK API FUNCTIONS — ÁREAS
// ═══════════════════════════════════════════════════════════════════════════

export async function mockListAreas(): Promise<Area[]> {
  await delay(300);
  return MOCK_AREAS.map((a) => ({ ...a }));
}

export async function mockListAreasWithSections(): Promise<Area[]> {
  await delay(350);
  return areasWithSections().map((a) => ({ ...a, sections: a.sections?.map((s) => ({ ...s })) }));
}

export async function mockCreateArea(payload: CreateAreaPayload): Promise<Area> {
  await delay(400);
  const created: Area = { id: nextId(), ...payload, sections: [] };
  MOCK_AREAS.push(created);
  return { ...created };
}

export async function mockUpdateArea(id: string, payload: UpdateAreaPayload): Promise<Area> {
  await delay(300);
  const idx = MOCK_AREAS.findIndex((a) => a.id === id);
  if (idx === -1) throw new Error("Área no encontrada");
  MOCK_AREAS[idx] = { ...MOCK_AREAS[idx], ...payload };
  return { ...MOCK_AREAS[idx] };
}

export async function mockDeleteArea(id: string): Promise<void> {
  await delay(300);
  const idx = MOCK_AREAS.findIndex((a) => a.id === id);
  if (idx !== -1) MOCK_AREAS.splice(idx, 1);
  // cascade delete sections
  for (let i = MOCK_SECTIONS.length - 1; i >= 0; i--) {
    if (MOCK_SECTIONS[i].areaId === id) MOCK_SECTIONS.splice(i, 1);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MOCK API FUNCTIONS — SECCIONES
// ═══════════════════════════════════════════════════════════════════════════

export async function mockListSections(): Promise<Section[]> {
  await delay(300);
  return MOCK_SECTIONS.map((s) => ({ ...s }));
}

export async function mockListSectionsByArea(areaId: string): Promise<Section[]> {
  await delay(250);
  return MOCK_SECTIONS.filter((s) => s.areaId === areaId).map((s) => ({ ...s }));
}

export async function mockCreateSection(payload: CreateSectionPayload): Promise<Section> {
  await delay(400);
  const created: Section = { id: nextId(), ...payload };
  MOCK_SECTIONS.push(created);
  return { ...created };
}

export async function mockUpdateSection(id: string, payload: UpdateSectionPayload): Promise<Section> {
  await delay(300);
  const idx = MOCK_SECTIONS.findIndex((s) => s.id === id);
  if (idx === -1) throw new Error("Sección no encontrada");
  MOCK_SECTIONS[idx] = { ...MOCK_SECTIONS[idx], ...payload };
  return { ...MOCK_SECTIONS[idx] };
}

export async function mockDeleteSection(id: string): Promise<void> {
  await delay(300);
  const idx = MOCK_SECTIONS.findIndex((s) => s.id === id);
  if (idx !== -1) MOCK_SECTIONS.splice(idx, 1);
}

// ═══════════════════════════════════════════════════════════════════════════
// MOCK API FUNCTIONS — POSICIONES
// ═══════════════════════════════════════════════════════════════════════════

export async function mockListPositions(): Promise<Position[]> {
  await delay(300);
  return MOCK_POSITIONS.map((p) => ({ ...p }));
}

export async function mockGetPosition(id: string): Promise<Position> {
  await delay(250);
  const pos = MOCK_POSITIONS.find((p) => p.id === id);
  if (!pos) throw new Error("Posición no encontrada");
  return { ...pos };
}

export async function mockCreatePosition(payload: CreatePositionPayload): Promise<Position> {
  await delay(400);
  const created: Position = { id: nextId(), ...payload, baseTasks: [] };
  MOCK_POSITIONS.push(created);
  return { ...created };
}

export async function mockUpdatePosition(id: string, payload: UpdatePositionPayload): Promise<Position> {
  await delay(300);
  const idx = MOCK_POSITIONS.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error("Posición no encontrada");
  MOCK_POSITIONS[idx] = { ...MOCK_POSITIONS[idx], ...payload };
  return { ...MOCK_POSITIONS[idx] };
}

export async function mockDeletePosition(id: string): Promise<void> {
  await delay(300);
  const idx = MOCK_POSITIONS.findIndex((p) => p.id === id);
  if (idx !== -1) MOCK_POSITIONS.splice(idx, 1);
}

export async function mockGetBaseTasks(_positionId: string): Promise<TaskTemplate[]> {
  await delay(250);
  return [];
}

export async function mockPostBaseTasks(_positionId: string, _templateIds: string[]): Promise<void> {
  await delay(300);
}

// ═══════════════════════════════════════════════════════════════════════════
// MOCK API FUNCTIONS — TASK ASSIGNMENT RULES
// ═══════════════════════════════════════════════════════════════════════════

export async function mockListTaskAssignmentRules(): Promise<TaskAssignmentRule[]> {
  await delay(300);
  return MOCK_ASSIGNMENT_RULES.map((r) => ({ ...r }));
}

export async function mockListRulesByTemplate(templateId: string): Promise<TaskAssignmentRule[]> {
  await delay(250);
  return MOCK_ASSIGNMENT_RULES.filter((r) => r.taskTemplateId === templateId).map((r) => ({ ...r }));
}

export async function mockListRulesByEmpleado(_empleadoId: string): Promise<TaskAssignmentRule[]> {
  await delay(250);
  return MOCK_ASSIGNMENT_RULES.map((r) => ({ ...r }));
}

export async function mockCreateTaskAssignmentRule(payload: CreateTaskAssignmentRulePayload): Promise<TaskAssignmentRule> {
  await delay(400);
  const created: TaskAssignmentRule = { id: nextId(), ...payload };
  MOCK_ASSIGNMENT_RULES.push(created);
  return { ...created };
}

export async function mockBulkCreateRules(payloads: CreateTaskAssignmentRulePayload[]): Promise<TaskAssignmentRule[]> {
  await delay(500);
  const created = payloads.map((p) => ({ id: nextId(), ...p }));
  MOCK_ASSIGNMENT_RULES.push(...created);
  return created.map((c) => ({ ...c }));
}

export async function mockUpdateTaskAssignmentRule(id: string, payload: UpdateTaskAssignmentRulePayload): Promise<TaskAssignmentRule> {
  await delay(300);
  const idx = MOCK_ASSIGNMENT_RULES.findIndex((r) => r.id === id);
  if (idx === -1) throw new Error("Regla no encontrada");
  MOCK_ASSIGNMENT_RULES[idx] = { ...MOCK_ASSIGNMENT_RULES[idx], ...payload };
  return { ...MOCK_ASSIGNMENT_RULES[idx] };
}

export async function mockDeleteTaskAssignmentRule(id: string): Promise<void> {
  await delay(300);
  const idx = MOCK_ASSIGNMENT_RULES.findIndex((r) => r.id === id);
  if (idx !== -1) MOCK_ASSIGNMENT_RULES.splice(idx, 1);
}

// ═══════════════════════════════════════════════════════════════════════════
// MOCK API FUNCTIONS — ROUTINE SCHEDULES
// ═══════════════════════════════════════════════════════════════════════════

export async function mockListRoutineSchedules(): Promise<RoutineSchedule[]> {
  await delay(300);
  return MOCK_ROUTINE_SCHEDULES.map((r) => ({ ...r }));
}

export async function mockCreateRoutineSchedule(payload: CreateRoutineSchedulePayload): Promise<RoutineSchedule> {
  await delay(400);
  const created: RoutineSchedule = { id: nextId(), ...payload };
  MOCK_ROUTINE_SCHEDULES.push(created);
  return { ...created };
}

export async function mockUpdateRoutineSchedule(id: string, payload: UpdateRoutineSchedulePayload): Promise<RoutineSchedule> {
  await delay(300);
  const idx = MOCK_ROUTINE_SCHEDULES.findIndex((r) => r.id === id);
  if (idx === -1) throw new Error("Schedule no encontrado");
  MOCK_ROUTINE_SCHEDULES[idx] = { ...MOCK_ROUTINE_SCHEDULES[idx], ...payload };
  return { ...MOCK_ROUTINE_SCHEDULES[idx] };
}

export async function mockDeleteRoutineSchedule(id: string): Promise<void> {
  await delay(300);
  const idx = MOCK_ROUTINE_SCHEDULES.findIndex((r) => r.id === id);
  if (idx !== -1) MOCK_ROUTINE_SCHEDULES.splice(idx, 1);
}

// ═══════════════════════════════════════════════════════════════════════════
// MOCK API FUNCTIONS — INCIDENTS
// ═══════════════════════════════════════════════════════════════════════════

export async function mockListIncidents(): Promise<Incident[]> {
  await delay(300);
  return MOCK_INCIDENTS.map((i) => ({ ...i }));
}

export async function mockCreateIncident(payload: CreateIncidentPayload): Promise<Incident> {
  await delay(400);
  const created: Incident = {
    id: nextId(),
    ...payload,
    status: "open",
    createdAt: new Date().toISOString(),
  };
  MOCK_INCIDENTS.push(created);
  return { ...created };
}

export async function mockResolveIncident(id: string, resolvedBy: string): Promise<Incident> {
  await delay(300);
  const idx = MOCK_INCIDENTS.findIndex((i) => i.id === id);
  if (idx === -1) throw new Error("Incidencia no encontrada");
  MOCK_INCIDENTS[idx] = {
    ...MOCK_INCIDENTS[idx],
    status: "resolved",
    resolvedBy,
    resolvedAt: new Date().toISOString(),
  };
  return { ...MOCK_INCIDENTS[idx] };
}

export async function mockDismissIncident(id: string): Promise<Incident> {
  await delay(300);
  const idx = MOCK_INCIDENTS.findIndex((i) => i.id === id);
  if (idx === -1) throw new Error("Incidencia no encontrada");
  MOCK_INCIDENTS[idx] = { ...MOCK_INCIDENTS[idx], status: "dismissed" };
  return { ...MOCK_INCIDENTS[idx] };
}

// ═══════════════════════════════════════════════════════════════════════════
// MOCK API FUNCTIONS — SUPERVISOR SECTIONS
// ═══════════════════════════════════════════════════════════════════════════

export async function mockGetMySections(): Promise<Section[]> {
  await delay(300);
  return [MOCK_SECTIONS[0], MOCK_SECTIONS[2]].map((s) => ({ ...s }));
}

export async function mockAssignSupervisorSection(_sectionId: string, _supervisorId: string): Promise<void> {
  await delay(400);
}

export async function mockDeleteSupervisorSection(_id: string): Promise<void> {
  await delay(300);
}

// ═══════════════════════════════════════════════════════════════════════════
// MOCK API FUNCTIONS — TAREAS V2
// ═══════════════════════════════════════════════════════════════════════════

export async function mockGetTaskTree(): Promise<TaskV2[]> {
  await delay(400);
  return MOCK_TASKS.map((t) => ({
    ...t,
    area: MOCK_AREAS.find((a) => a.id === t.areaId),
    section: MOCK_SECTIONS.find((s) => s.id === t.sectionId),
  }));
}

export async function mockGetTasksBySection(sectionId: string): Promise<TaskV2[]> {
  await delay(350);
  return MOCK_TASKS.filter((t) => t.sectionId === sectionId).map((t) => ({
    ...t,
    area: MOCK_AREAS.find((a) => a.id === t.areaId),
    section: MOCK_SECTIONS.find((s) => s.id === t.sectionId),
  }));
}

export async function mockStartTask(id: string): Promise<TaskV2> {
  await delay(300);
  const idx = MOCK_TASKS.findIndex((t) => t.id === id);
  if (idx === -1) throw new Error("Tarea no encontrada");
  MOCK_TASKS[idx] = {
    ...MOCK_TASKS[idx],
    status: "in_progress",
    startedAt: new Date().toISOString(),
    isBlocked: false,
  };
  return { ...MOCK_TASKS[idx] };
}

export async function mockFinishTask(id: string): Promise<TaskV2> {
  await delay(300);
  const idx = MOCK_TASKS.findIndex((t) => t.id === id);
  if (idx === -1) throw new Error("Tarea no encontrada");
  MOCK_TASKS[idx] = {
    ...MOCK_TASKS[idx],
    status: "done_pending",
    completed: true,
  };
  return { ...MOCK_TASKS[idx] };
}
