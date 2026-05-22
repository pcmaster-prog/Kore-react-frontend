// src/features/tasks/hooks/usePositions.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listPositions,
  getPosition,
  createPosition,
  updatePosition,
  deletePosition,
  getBaseTasks,
  assignBaseTasks,
} from "@/features/tasks/areaApi";
import type { CreatePositionPayload, UpdatePositionPayload } from "@/features/tasks/types";

const POSITIONS_KEY = ["positions"] as const;

export function usePositions() {
  return useQuery({
    queryKey: POSITIONS_KEY,
    queryFn: listPositions,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePosition(id: string | null) {
  return useQuery({
    queryKey: [...POSITIONS_KEY, id],
    queryFn: () => getPosition(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreatePosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePositionPayload) => createPosition(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: POSITIONS_KEY }),
  });
}

export function useUpdatePosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePositionPayload }) => updatePosition(id, payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: POSITIONS_KEY });
      qc.invalidateQueries({ queryKey: [...POSITIONS_KEY, variables.id] });
    },
  });
}

export function useDeletePosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePosition(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: POSITIONS_KEY }),
  });
}

export function useBaseTasks(positionId: string | null) {
  return useQuery({
    queryKey: [...POSITIONS_KEY, positionId, "base-tasks"],
    queryFn: () => getBaseTasks(positionId!),
    enabled: !!positionId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAssignBaseTasks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ positionId, templateIds }: { positionId: string; templateIds: string[] }) =>
      assignBaseTasks(positionId, templateIds),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: [...POSITIONS_KEY, variables.positionId, "base-tasks"] });
    },
  });
}
