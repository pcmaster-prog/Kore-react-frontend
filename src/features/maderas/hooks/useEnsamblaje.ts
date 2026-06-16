import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getEnsamblajes, createEnsamblaje } from "../api";

export function useEnsamblajes(params?: any) {
  return useQuery({
    queryKey: ["maderas-ensamblaje", params],
    queryFn: () => getEnsamblajes(params),
  });
}

export function useCreateEnsamblaje() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEnsamblaje,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maderas-ensamblaje"] });
      queryClient.invalidateQueries({ queryKey: ["maderas-inventario"] });
    },
  });
}
