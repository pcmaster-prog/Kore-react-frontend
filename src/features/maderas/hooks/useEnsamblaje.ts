import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getEnsambles, createEnsamble, updateEnsamble } from "../api";

export function useEnsambles() {
  return useQuery({
    queryKey: ["maderas-ensambles"],
    queryFn: getEnsambles,
  });
}

export function useCreateEnsamble() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEnsamble,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maderas-ensambles"] });
      // Removes materials from inventory
      queryClient.invalidateQueries({ queryKey: ["maderas-inventario"] });
    },
  });
}

export function useUpdateEnsamble() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateEnsamble(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maderas-ensambles"] });
      // If status became listo, it adds finished products to inventory
      queryClient.invalidateQueries({ queryKey: ["maderas-inventario"] });
    },
  });
}
