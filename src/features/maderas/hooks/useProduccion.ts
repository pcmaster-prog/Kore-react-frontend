import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProduccion, createProduccion, anularProduccion } from "../api";

export function useProduccion() {
  return useQuery({
    queryKey: ["maderas-produccion"],
    queryFn: getProduccion,
  });
}

export function useCreateProduccion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProduccion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maderas-produccion"] });
      // Produccion modifies inventario too
      queryClient.invalidateQueries({ queryKey: ["maderas-inventario"] });
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
    },
  });
}
