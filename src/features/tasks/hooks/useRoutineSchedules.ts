// src/features/tasks/hooks/useRoutineSchedules.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listRoutineSchedules,
  createRoutineSchedule,
  updateRoutineSchedule,
  deleteRoutineSchedule,
} from "@/features/tasks/areaApi";
import type { CreateRoutineSchedulePayload, UpdateRoutineSchedulePayload } from "@/features/tasks/types";

const SCHEDULES_KEY = ["routine-schedules"] as const;

export function useRoutineSchedules() {
  return useQuery({
    queryKey: SCHEDULES_KEY,
    queryFn: listRoutineSchedules,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateRoutineSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRoutineSchedulePayload) => createRoutineSchedule(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: SCHEDULES_KEY }),
  });
}

export function useUpdateRoutineSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateRoutineSchedulePayload }) =>
      updateRoutineSchedule(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: SCHEDULES_KEY }),
  });
}

export function useDeleteRoutineSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRoutineSchedule(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: SCHEDULES_KEY }),
  });
}
