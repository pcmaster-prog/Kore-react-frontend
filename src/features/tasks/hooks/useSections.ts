// src/features/tasks/hooks/useSections.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listSections,
  listSectionsByArea,
  createSection,
  updateSection,
  deleteSection,
} from "@/features/tasks/areaApi";
import type { CreateSectionPayload, UpdateSectionPayload } from "@/features/tasks/types";

const SECTIONS_KEY = ["sections"] as const;

export function useSections() {
  return useQuery({
    queryKey: SECTIONS_KEY,
    queryFn: listSections,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSectionsByArea(areaId: string | null) {
  return useQuery({
    queryKey: [...SECTIONS_KEY, "by-area", areaId],
    queryFn: () => listSectionsByArea(areaId!),
    enabled: !!areaId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSectionPayload) => createSection(payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: SECTIONS_KEY });
      qc.invalidateQueries({ queryKey: [...SECTIONS_KEY, "by-area", variables.areaId] });
      qc.invalidateQueries({ queryKey: ["areas", "with-sections"] });
    },
  });
}

export function useUpdateSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSectionPayload }) => updateSection(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SECTIONS_KEY });
      qc.invalidateQueries({ queryKey: ["areas", "with-sections"] });
    },
  });
}

export function useDeleteSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSection(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SECTIONS_KEY });
      qc.invalidateQueries({ queryKey: ["areas", "with-sections"] });
    },
  });
}
