import { useQuery } from "@tanstack/react-query";
import { getProductos, getTablasCortes } from "../api";

export function useProductos() {
  return useQuery({
    queryKey: ["maderas-productos"],
    queryFn: getProductos,
  });
}

export function useTablasCortes() {
  return useQuery({
    queryKey: ["maderas-tablas-cortes"],
    queryFn: getTablasCortes,
  });
}
