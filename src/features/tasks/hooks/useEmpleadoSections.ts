// src/features/tasks/hooks/useEmpleadoSections.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchEmpleadoSections,
  assignSectionToEmpleado,
  removeSectionFromEmpleado,
  fetchSectionEmpleados,
} from "@/features/tasks/areaApi";
const ES_KEY = ["empleado-sections"] as const;
const SE_KEY = ["section-empleados"] as const;

export function useEmpleadoSections(empleadoId: string | null) {
  return useQuery({
    queryKey: [...ES_KEY, empleadoId],
    queryFn: () => fetchEmpleadoSections(empleadoId!),
    enabled: !!empleadoId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useAssignSectionToEmpleado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ empleadoId, sectionId, isPrimary }: { empleadoId: string; sectionId: string; isPrimary?: boolean }) =>
      assignSectionToEmpleado(empleadoId, sectionId, isPrimary),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: [...ES_KEY, vars.empleadoId] });
      qc.invalidateQueries({ queryKey: SE_KEY });
    },
  });
}

export function useRemoveSectionFromEmpleado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ empleadoId, sectionId }: { empleadoId: string; sectionId: string }) =>
      removeSectionFromEmpleado(empleadoId, sectionId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: [...ES_KEY, vars.empleadoId] });
      qc.invalidateQueries({ queryKey: SE_KEY });
    },
  });
}

export function useSectionEmpleados(sectionId: string | null) {
  return useQuery({
    queryKey: [...SE_KEY, sectionId],
    queryFn: () => fetchSectionEmpleados(sectionId!),
    enabled: !!sectionId,
    staleTime: 2 * 60 * 1000,
  });
}
