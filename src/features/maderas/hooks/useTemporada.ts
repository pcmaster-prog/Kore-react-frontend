import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTemporadas, getTemporadaActiva, createTemporada } from "../api";

export function useTemporadas() {
  return useQuery({
    queryKey: ["maderas-temporadas"],
    queryFn: getTemporadas,
  });
}

export function useTemporadaActiva() {
  return useQuery({
    queryKey: ["maderas-temporada-activa"],
    queryFn: getTemporadaActiva,
  });
}

export function useCreateTemporada() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTemporada,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maderas-temporadas"] });
      queryClient.invalidateQueries({ queryKey: ["maderas-temporada-activa"] });
    },
  });
}
