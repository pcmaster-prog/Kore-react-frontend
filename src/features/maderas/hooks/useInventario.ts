import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getInventario, createInventario, updateInventario } from "../api";
import type { MaderasInventario } from "../types";

export function useInventario() {
  return useQuery({
    queryKey: ["maderas-inventario"],
    queryFn: getInventario,
  });
}

export function useCreateInventario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createInventario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maderas-inventario"] });
      queryClient.invalidateQueries({ queryKey: ["maderas-dashboard"] });
    },
  });
}

export function useUpdateInventario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<MaderasInventario> }) => updateInventario(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maderas-inventario"] });
      queryClient.invalidateQueries({ queryKey: ["maderas-dashboard"] });
    },
  });
}
