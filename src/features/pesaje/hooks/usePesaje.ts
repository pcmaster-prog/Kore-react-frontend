import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDashboardPesaje, getHistorialPesaje, createPesaje, getSabores } from "../api";

export function useDashboardPesaje() {
  return useQuery({
    queryKey: ["pesaje-dashboard"],
    queryFn: getDashboardPesaje,
  });
}

export function useHistorialPesaje(params?: any) {
  return useQuery({
    queryKey: ["pesaje-historial", params],
    queryFn: () => getHistorialPesaje(params),
  });
}

export function useSabores() {
  return useQuery({
    queryKey: ["pesaje-sabores"],
    queryFn: getSabores,
  });
}

export function useCreatePesaje() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPesaje,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pesaje-historial"] });
      queryClient.invalidateQueries({ queryKey: ["pesaje-dashboard"] });
    },
  });
}
