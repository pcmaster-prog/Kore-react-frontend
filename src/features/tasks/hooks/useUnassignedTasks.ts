// src/features/tasks/hooks/useUnassignedTasks.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchUnassignedTasks, reasignarTarea } from "@/features/tasks/areaApi";
import { deleteTask } from "@/features/tasks/api";

const UNASSIGNED_KEY = ["unassigned-tasks"] as const;
const TASK_TREE_KEY = ["tareas", "tree"] as const;

export function useUnassignedTasks() {
  return useQuery({
    queryKey: UNASSIGNED_KEY,
    queryFn: fetchUnassignedTasks,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });
}

export function useReasignarTarea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, empleadoIds }: { taskId: string; empleadoIds: string[] }) =>
      reasignarTarea(taskId, empleadoIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: UNASSIGNED_KEY });
      qc.invalidateQueries({ queryKey: TASK_TREE_KEY });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => deleteTask(taskId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: UNASSIGNED_KEY });
      qc.invalidateQueries({ queryKey: TASK_TREE_KEY });
    },
  });
}
