import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProduccion, createProduccion, anularProduccion } from "../api";

export function useProduccion(params?: any) {
  return useQuery({
    queryKey: ["maderas-produccion", params],
    queryFn: () => getProduccion(params),
  });
}

export function useCreateProduccion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProduccion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maderas-produccion"] });
      queryClient.invalidateQueries({ queryKey: ["maderas-inventario"] });
      queryClient.invalidateQueries({ queryKey: ["maderas-bastones"] });
    },
  });
}

export function useAnularProduccion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: anularProduccion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maderas-produccion"] });
      queryClient.invalidateQueries({ queryKey: ["maderas-inventario"] });
      queryClient.invalidateQueries({ queryKey: ["maderas-bastones"] });
    },
  });
}
