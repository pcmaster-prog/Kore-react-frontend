import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDashboardPesaje,
  getHistorialPesaje,
  createPesaje,
  updatePesaje,
  deletePesaje,
  getSabores,
  createSabor,
  updateSabor,
  deleteSabor,
} from "../api";
import type { CreatePesajePayload, CreateSaborPayload, UpdateSaborPayload } from "../types";

export function useDashboardPesaje() {
  return useQuery({
    queryKey: ["pesaje-dashboard"],
    queryFn: getDashboardPesaje,
  });
}

export function useHistorialPesaje(params?: { search?: string; limit?: number }) {
  return useQuery({
    queryKey: ["pesaje-historial", params],
    queryFn: () => getHistorialPesaje(params),
  });
}

export function useSabores(conInactivos = false) {
  return useQuery({
    queryKey: ["pesaje-sabores", conInactivos],
    queryFn: () => getSabores(conInactivos),
  });
}

export function useCreatePesaje() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePesajePayload) => createPesaje(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pesaje-historial"] });
      queryClient.invalidateQueries({ queryKey: ["pesaje-dashboard"] });
    },
  });
}

export function useUpdatePesaje() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreatePesajePayload> }) => updatePesaje(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pesaje-historial"] });
      queryClient.invalidateQueries({ queryKey: ["pesaje-dashboard"] });
    },
  });
}

export function useDeletePesaje() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deletePesaje(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pesaje-historial"] });
      queryClient.invalidateQueries({ queryKey: ["pesaje-dashboard"] });
    },
  });
}

export function useCreateSabor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSaborPayload) => createSabor(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pesaje-sabores"] });
    },
  });
}

export function useUpdateSabor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSaborPayload }) => updateSabor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pesaje-sabores"] });
    },
  });
}

export function useDeleteSabor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteSabor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pesaje-sabores"] });
    },
  });
}
