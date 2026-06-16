import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPedidos, createPedido, updatePedido, calcularPedido } from "../api";

export function usePedidos() {
  return useQuery({
    queryKey: ["maderas-pedidos"],
    queryFn: getPedidos,
  });
}

export function useCalcularPedido() {
  return useMutation({
    mutationFn: (temporada_id: number) => calcularPedido(temporada_id),
  });
}

export function useCreatePedido() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPedido,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maderas-pedidos"] });
    },
  });
}

export function useUpdatePedido() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updatePedido(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maderas-pedidos"] });
    },
  });
}
