// src/features/tasks/hooks/useTaskAssignmentRules.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listTaskAssignmentRules,
  listRulesByTemplate,
  listRulesByEmpleado,
  createTaskAssignmentRule,
  bulkCreateTaskAssignmentRules,
  updateTaskAssignmentRule,
  deleteTaskAssignmentRule,
} from "@/features/tasks/areaApi";
import type { CreateTaskAssignmentRulePayload, UpdateTaskAssignmentRulePayload } from "@/features/tasks/types";

const RULES_KEY = ["task-assignment-rules"] as const;

export function useTaskAssignmentRules() {
  return useQuery({
    queryKey: RULES_KEY,
    queryFn: listTaskAssignmentRules,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRulesByTemplate(templateId: string | null) {
  return useQuery({
    queryKey: [...RULES_KEY, "by-template", templateId],
    queryFn: () => listRulesByTemplate(templateId!),
    enabled: !!templateId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRulesByEmpleado(empleadoId: string | null) {
  return useQuery({
    queryKey: [...RULES_KEY, "by-empleado", empleadoId],
    queryFn: () => listRulesByEmpleado(empleadoId!),
    enabled: !!empleadoId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateTaskAssignmentRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTaskAssignmentRulePayload) => createTaskAssignmentRule(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: RULES_KEY }),
  });
}

export function useBulkCreateRules() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payloads: CreateTaskAssignmentRulePayload[]) => bulkCreateTaskAssignmentRules(payloads),
    onSuccess: () => qc.invalidateQueries({ queryKey: RULES_KEY }),
  });
}

export function useUpdateTaskAssignmentRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTaskAssignmentRulePayload }) =>
      updateTaskAssignmentRule(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: RULES_KEY }),
  });
}

export function useDeleteTaskAssignmentRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTaskAssignmentRule(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: RULES_KEY }),
  });
}
