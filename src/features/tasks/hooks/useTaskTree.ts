// src/features/tasks/hooks/useTaskTree.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTaskTree,
  getTasksBySection,
  startTask,
  finishTask,
} from "@/features/tasks/areaApi";

const TASK_TREE_KEY = ["tareas", "tree"] as const;
const TASKS_BY_SECTION_KEY = ["tareas", "by-section"] as const;

export function useTaskTree() {
  return useQuery({
    queryKey: TASK_TREE_KEY,
    queryFn: getTaskTree,
    staleTime: 2 * 60 * 1000,
  });
}

export function useTasksBySection(sectionId: string | null) {
  return useQuery({
    queryKey: [...TASKS_BY_SECTION_KEY, sectionId],
    queryFn: () => getTasksBySection(sectionId!),
    enabled: !!sectionId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useStartTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => startTask(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TASK_TREE_KEY });
      qc.invalidateQueries({ queryKey: TASKS_BY_SECTION_KEY });
    },
  });
}

export function useFinishTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => finishTask(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TASK_TREE_KEY });
      qc.invalidateQueries({ queryKey: TASKS_BY_SECTION_KEY });
    },
  });
}
