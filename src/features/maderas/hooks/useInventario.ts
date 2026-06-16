import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getInventario, ajustarInventario, getBastones } from "../api";

export function useInventario() {
  return useQuery({
    queryKey: ["maderas-inventario"],
    queryFn: getInventario,
  });
}

export function useBastones() {
  return useQuery({
    queryKey: ["maderas-bastones"],
    queryFn: getBastones,
  });
}

export function useAjustarInventario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ajustarInventario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maderas-inventario"] });
      queryClient.invalidateQueries({ queryKey: ["maderas-bastones"] });
    },
  });
}
