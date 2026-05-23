// src/features/tasks/hooks/useAreas.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listAreas,
  listAreasWithSections,
  createArea,
  updateArea,
  deleteArea,
} from "@/features/tasks/areaApi";
import type { CreateAreaPayload, UpdateAreaPayload } from "@/features/tasks/types";

const AREAS_KEY = ["areas"] as const;
const AREAS_WITH_SECTIONS_KEY = ["areas", "with-sections"] as const;

export function useAreas(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: AREAS_KEY,
    queryFn: listAreas,
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled !== false,
  });
}

export function useAreasWithSections(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: AREAS_WITH_SECTIONS_KEY,
    queryFn: listAreasWithSections,
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled !== false,
  });
}

export function useCreateArea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAreaPayload) => createArea(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: AREAS_KEY });
      qc.invalidateQueries({ queryKey: AREAS_WITH_SECTIONS_KEY });
    },
  });
}

export function useUpdateArea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAreaPayload }) => updateArea(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: AREAS_KEY });
      qc.invalidateQueries({ queryKey: AREAS_WITH_SECTIONS_KEY });
    },
  });
}

export function useDeleteArea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteArea(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: AREAS_KEY });
      qc.invalidateQueries({ queryKey: AREAS_WITH_SECTIONS_KEY });
    },
  });
}
