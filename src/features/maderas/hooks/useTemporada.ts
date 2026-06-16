import { useQuery } from "@tanstack/react-query";
import { getTemporadas, getTemporadaActiva } from "../api";

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
