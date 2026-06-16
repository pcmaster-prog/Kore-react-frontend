import { useQuery, useMutation } from "@tanstack/react-query";
import { getPedidos, calcularPedido, downloadPedidoPdf } from "../api";

export function usePedidos() {
  return useQuery({
    queryKey: ["maderas-pedidos"],
    queryFn: getPedidos,
  });
}

export function useCalcularPedido() {
  return useQuery({
    queryKey: ["maderas-calcular-pedido"],
    queryFn: calcularPedido,
    staleTime: 0, // Siempre re-calcular
  });
}

export function useDownloadPedido() {
  return useMutation({
    mutationFn: downloadPedidoPdf,
  });
}
