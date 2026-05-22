// src/features/tasks/hooks/useIncidents.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listIncidents,
  createIncident,
  resolveIncident,
  dismissIncident,
} from "@/features/tasks/areaApi";
import type { CreateIncidentPayload } from "@/features/tasks/types";

const INCIDENTS_KEY = ["incidents"] as const;

export function useIncidents() {
  return useQuery({
    queryKey: INCIDENTS_KEY,
    queryFn: listIncidents,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateIncidentPayload) => createIncident(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: INCIDENTS_KEY }),
  });
}

export function useResolveIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, resolvedBy }: { id: string; resolvedBy: string }) => resolveIncident(id, resolvedBy),
    onSuccess: () => qc.invalidateQueries({ queryKey: INCIDENTS_KEY }),
  });
}

export function useDismissIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dismissIncident(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: INCIDENTS_KEY }),
  });
}
