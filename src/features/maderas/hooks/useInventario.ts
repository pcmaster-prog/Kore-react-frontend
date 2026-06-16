import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getInventario, createInventario } from "../api";

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
    },
  });
}
