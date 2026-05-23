// src/features/tasks/areaApi.ts
// ─── API bridge para el nuevo módulo de Tareas por Área/Sección ────────────
// Endpoints del apéndice A (sin /v1/ porque la baseURL ya incluye /api/v1)

import api from "@/lib/http";
import type {
  Area,
  Section,
  Position,
  TaskTemplate,
  TaskAssignmentRule,
  RoutineSchedule,
  Incident,
  TaskV2,
  EmpleadoSection,
  UnassignedTask,
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
} from "./types";

// ─── Toggle mocks (desarrollo offline) ──────────────────────────────────────
// Cuando el backend esté listo, poner USE_MOCKS = false en taskAreaMocks
import {
  USE_MOCKS,
  mockListAreas,
  mockListAreasWithSections,
  mockCreateArea,
  mockUpdateArea,
  mockDeleteArea,
  mockListSections,
  mockListSectionsByArea,
  mockCreateSection,
  mockUpdateSection,
  mockDeleteSection,
  mockListPositions,
  mockGetPosition,
  mockCreatePosition,
  mockUpdatePosition,
  mockDeletePosition,
  mockGetBaseTasks,
  mockPostBaseTasks,
  mockListTaskAssignmentRules,
  mockListRulesByTemplate,
  mockListRulesByEmpleado,
  mockCreateTaskAssignmentRule,
  mockBulkCreateRules,
  mockUpdateTaskAssignmentRule,
  mockDeleteTaskAssignmentRule,
  mockListRoutineSchedules,
  mockCreateRoutineSchedule,
  mockUpdateRoutineSchedule,
  mockDeleteRoutineSchedule,
  mockListIncidents,
  mockCreateIncident,
  mockResolveIncident,
  mockDismissIncident,
  mockGetMySections,
  mockAssignSupervisorSection,
  mockDeleteSupervisorSection,
  mockGetTaskTree,
  mockGetTasksBySection,
  mockStartTask,
  mockFinishTask,
  mockFetchEmpleadoSections,
  mockAssignSectionToEmpleado,
  mockRemoveSectionFromEmpleado,
  mockFetchSectionEmpleados,
  mockFetchUnassignedTasks,
  mockReasignarTarea,
} from "@/mocks/taskAreaMocks";

// ═══════════════════════════════════════════════════════════════════════════
// ÁREAS
// ═══════════════════════════════════════════════════════════════════════════

export async function listAreas(): Promise<Area[]> {
  if (USE_MOCKS) return mockListAreas();
  const res = await api.get("/areas");
  return Array.isArray(res.data) ? res.data : (res.data.data ?? []);
}

export async function listAreasWithSections(): Promise<Area[]> {
  if (USE_MOCKS) return mockListAreasWithSections();
  const res = await api.get("/areas/with-sections");
  return Array.isArray(res.data) ? res.data : (res.data.data ?? []);
}

export async function createArea(payload: CreateAreaPayload): Promise<Area> {
  if (USE_MOCKS) return mockCreateArea(payload);
  const res = await api.post("/areas", payload);
  return res.data.item ?? res.data;
}

export async function updateArea(id: string, payload: UpdateAreaPayload): Promise<Area> {
  if (USE_MOCKS) return mockUpdateArea(id, payload);
  const res = await api.patch(`/areas/${id}`, payload);
  return res.data.item ?? res.data;
}

export async function deleteArea(id: string): Promise<void> {
  if (USE_MOCKS) return mockDeleteArea(id);
  await api.delete(`/areas/${id}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// SECCIONES
// ═══════════════════════════════════════════════════════════════════════════

export async function listSections(): Promise<Section[]> {
  if (USE_MOCKS) return mockListSections();
  const res = await api.get("/sections");
  return Array.isArray(res.data) ? res.data : (res.data.data ?? []);
}

export async function listSectionsByArea(areaId: string): Promise<Section[]> {
  if (USE_MOCKS) return mockListSectionsByArea(areaId);
  const res = await api.get(`/sections/by-area/${areaId}`);
  return Array.isArray(res.data) ? res.data : (res.data.data ?? []);
}

export async function createSection(payload: CreateSectionPayload): Promise<Section> {
  if (USE_MOCKS) return mockCreateSection(payload);
  const res = await api.post("/sections", payload);
  return res.data.item ?? res.data;
}

export async function updateSection(id: string, payload: UpdateSectionPayload): Promise<Section> {
  if (USE_MOCKS) return mockUpdateSection(id, payload);
  const res = await api.patch(`/sections/${id}`, payload);
  return res.data.item ?? res.data;
}

export async function deleteSection(id: string): Promise<void> {
  if (USE_MOCKS) return mockDeleteSection(id);
  await api.delete(`/sections/${id}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// POSICIONES
// ═══════════════════════════════════════════════════════════════════════════

export async function listPositions(): Promise<Position[]> {
  if (USE_MOCKS) return mockListPositions();
  const res = await api.get("/positions");
  return Array.isArray(res.data) ? res.data : (res.data.data ?? []);
}

export async function getPosition(id: string): Promise<Position> {
  if (USE_MOCKS) return mockGetPosition(id);
  const res = await api.get(`/positions/${id}`);
  return res.data.item ?? res.data;
}

export async function createPosition(payload: CreatePositionPayload): Promise<Position> {
  if (USE_MOCKS) return mockCreatePosition(payload);
  const res = await api.post("/positions", payload);
  return res.data.item ?? res.data;
}

export async function updatePosition(id: string, payload: UpdatePositionPayload): Promise<Position> {
  if (USE_MOCKS) return mockUpdatePosition(id, payload);
  const res = await api.patch(`/positions/${id}`, payload);
  return res.data.item ?? res.data;
}

export async function deletePosition(id: string): Promise<void> {
  if (USE_MOCKS) return mockDeletePosition(id);
  await api.delete(`/positions/${id}`);
}

export async function getBaseTasks(positionId: string): Promise<TaskTemplate[]> {
  if (USE_MOCKS) return mockGetBaseTasks(positionId);
  const res = await api.get(`/positions/${positionId}/base-tasks`);
  return Array.isArray(res.data) ? res.data : (res.data.data ?? []);
}

export async function assignBaseTasks(positionId: string, templateIds: string[]): Promise<void> {
  if (USE_MOCKS) return mockPostBaseTasks(positionId, templateIds);
  await api.post(`/positions/${positionId}/base-tasks`, { template_ids: templateIds });
}

// ═══════════════════════════════════════════════════════════════════════════
// TASK ASSIGNMENT RULES
// ═══════════════════════════════════════════════════════════════════════════

export async function listTaskAssignmentRules(): Promise<TaskAssignmentRule[]> {
  if (USE_MOCKS) return mockListTaskAssignmentRules();
  const res = await api.get("/task-assignment-rules");
  return Array.isArray(res.data) ? res.data : (res.data.data ?? []);
}

export async function listRulesByTemplate(templateId: string): Promise<TaskAssignmentRule[]> {
  if (USE_MOCKS) return mockListRulesByTemplate(templateId);
  const res = await api.get(`/task-assignment-rules/by-template/${templateId}`);
  return Array.isArray(res.data) ? res.data : (res.data.data ?? []);
}

export async function listRulesByEmpleado(empleadoId: string): Promise<TaskAssignmentRule[]> {
  if (USE_MOCKS) return mockListRulesByEmpleado(empleadoId);
  const res = await api.get(`/task-assignment-rules/by-empleado/${empleadoId}`);
  return Array.isArray(res.data) ? res.data : (res.data.data ?? []);
}

export async function createTaskAssignmentRule(payload: CreateTaskAssignmentRulePayload): Promise<TaskAssignmentRule> {
  if (USE_MOCKS) return mockCreateTaskAssignmentRule(payload);
  const res = await api.post("/task-assignment-rules", payload);
  return res.data.item ?? res.data;
}

export async function bulkCreateTaskAssignmentRules(payloads: CreateTaskAssignmentRulePayload[]): Promise<TaskAssignmentRule[]> {
  if (USE_MOCKS) return mockBulkCreateRules(payloads);
  const res = await api.post("/task-assignment-rules/bulk", { rules: payloads });
  return Array.isArray(res.data) ? res.data : (res.data.data ?? []);
}

export async function updateTaskAssignmentRule(id: string, payload: UpdateTaskAssignmentRulePayload): Promise<TaskAssignmentRule> {
  if (USE_MOCKS) return mockUpdateTaskAssignmentRule(id, payload);
  const res = await api.patch(`/task-assignment-rules/${id}`, payload);
  return res.data.item ?? res.data;
}

export async function deleteTaskAssignmentRule(id: string): Promise<void> {
  if (USE_MOCKS) return mockDeleteTaskAssignmentRule(id);
  await api.delete(`/task-assignment-rules/${id}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// ROUTINE SCHEDULES
// ═══════════════════════════════════════════════════════════════════════════

export async function listRoutineSchedules(): Promise<RoutineSchedule[]> {
  if (USE_MOCKS) return mockListRoutineSchedules();
  const res = await api.get("/routine-schedules");
  return Array.isArray(res.data) ? res.data : (res.data.data ?? []);
}

export async function createRoutineSchedule(payload: CreateRoutineSchedulePayload): Promise<RoutineSchedule> {
  if (USE_MOCKS) return mockCreateRoutineSchedule(payload);
  const res = await api.post("/routine-schedules", payload);
  return res.data.item ?? res.data;
}

export async function updateRoutineSchedule(id: string, payload: UpdateRoutineSchedulePayload): Promise<RoutineSchedule> {
  if (USE_MOCKS) return mockUpdateRoutineSchedule(id, payload);
  const res = await api.patch(`/routine-schedules/${id}`, payload);
  return res.data.item ?? res.data;
}

export async function deleteRoutineSchedule(id: string): Promise<void> {
  if (USE_MOCKS) return mockDeleteRoutineSchedule(id);
  await api.delete(`/routine-schedules/${id}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// INCIDENTS
// ═══════════════════════════════════════════════════════════════════════════

export async function listIncidents(): Promise<Incident[]> {
  if (USE_MOCKS) return mockListIncidents();
  const res = await api.get("/incidents");
  return Array.isArray(res.data) ? res.data : (res.data.data ?? []);
}

export async function createIncident(payload: CreateIncidentPayload): Promise<Incident> {
  if (USE_MOCKS) return mockCreateIncident(payload);
  const res = await api.post("/incidents", payload);
  return res.data.item ?? res.data;
}

export async function resolveIncident(id: string, resolvedBy: string): Promise<Incident> {
  if (USE_MOCKS) return mockResolveIncident(id, resolvedBy);
  const res = await api.patch(`/incidents/${id}/resolve`, { resolved_by: resolvedBy });
  return res.data.item ?? res.data;
}

export async function dismissIncident(id: string): Promise<Incident> {
  if (USE_MOCKS) return mockDismissIncident(id);
  const res = await api.patch(`/incidents/${id}/dismiss`);
  return res.data.item ?? res.data;
}

// ═══════════════════════════════════════════════════════════════════════════
// SUPERVISOR SECTIONS
// ═══════════════════════════════════════════════════════════════════════════

export async function getMySections(): Promise<Section[]> {
  if (USE_MOCKS) return mockGetMySections();
  const res = await api.get("/my-sections");
  return Array.isArray(res.data) ? res.data : (res.data.data ?? []);
}

export async function assignSupervisorSection(sectionId: string, supervisorId: string): Promise<void> {
  if (USE_MOCKS) return mockAssignSupervisorSection(sectionId, supervisorId);
  await api.post("/supervisor-sections/assign", { section_id: sectionId, supervisor_id: supervisorId });
}

export async function deleteSupervisorSection(id: string): Promise<void> {
  if (USE_MOCKS) return mockDeleteSupervisorSection(id);
  await api.delete(`/supervisor-sections/${id}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// EMPLEADO-SECCIONES
// ═══════════════════════════════════════════════════════════════════════════

export async function fetchEmpleadoSections(empleadoId: string): Promise<EmpleadoSection[]> {
  if (USE_MOCKS) return mockFetchEmpleadoSections(empleadoId);
  const res = await api.get(`/empleados/${empleadoId}/sections`);
  return Array.isArray(res.data) ? res.data : (res.data.data ?? []);
}

export async function assignSectionToEmpleado(empleadoId: string, sectionId: string, isPrimary = false): Promise<EmpleadoSection> {
  if (USE_MOCKS) return mockAssignSectionToEmpleado(empleadoId, sectionId, isPrimary);
  const res = await api.post(`/empleados/${empleadoId}/sections`, { section_id: sectionId, is_primary: isPrimary });
  return res.data.item ?? res.data;
}

export async function removeSectionFromEmpleado(empleadoId: string, sectionId: string): Promise<void> {
  if (USE_MOCKS) return mockRemoveSectionFromEmpleado(empleadoId, sectionId);
  await api.delete(`/empleados/${empleadoId}/sections/${sectionId}`);
}

export async function fetchSectionEmpleados(sectionId: string): Promise<{ id: string; full_name: string }[]> {
  if (USE_MOCKS) return mockFetchSectionEmpleados(sectionId);
  const res = await api.get(`/sections/${sectionId}/empleados`);
  return Array.isArray(res.data) ? res.data : (res.data.data ?? []);
}

// ═══════════════════════════════════════════════════════════════════════════
// TAREAS HUÉRFANAS
// ═══════════════════════════════════════════════════════════════════════════

export async function fetchUnassignedTasks(): Promise<UnassignedTask[]> {
  if (USE_MOCKS) return mockFetchUnassignedTasks();
  const res = await api.get("/tareas/huerfanas");
  return Array.isArray(res.data) ? res.data : (res.data.data ?? []);
}

export async function reasignarTarea(taskId: string, empleadoIds: string[]): Promise<void> {
  if (USE_MOCKS) return mockReasignarTarea(taskId, empleadoIds);
  await api.post(`/tareas/${taskId}/reasignar`, { empleado_ids: empleadoIds });
}

// ═══════════════════════════════════════════════════════════════════════════
// TAREAS V2 (tree / by-section / iniciar / finalizar)
// ═══════════════════════════════════════════════════════════════════════════

export async function getTaskTree(): Promise<TaskV2[]> {
  if (USE_MOCKS) return mockGetTaskTree();
  const res = await api.get("/tareas/tree");
  return Array.isArray(res.data) ? res.data : (res.data.data ?? []);
}

export async function getTasksBySection(sectionId: string): Promise<TaskV2[]> {
  if (USE_MOCKS) return mockGetTasksBySection(sectionId);
  const res = await api.get(`/tareas/by-section/${sectionId}`);
  return Array.isArray(res.data) ? res.data : (res.data.data ?? []);
}

export async function startTask(id: string): Promise<TaskV2> {
  if (USE_MOCKS) return mockStartTask(id);
  const res = await api.post(`/tareas/${id}/iniciar`);
  return res.data.item ?? res.data;
}

export async function finishTask(id: string): Promise<TaskV2> {
  if (USE_MOCKS) return mockFinishTask(id);
  const res = await api.post(`/tareas/${id}/finalizar`);
  return res.data.item ?? res.data;
}
