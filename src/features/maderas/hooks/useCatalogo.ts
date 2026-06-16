import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProductos, getBastones, createCatalogo, deleteCatalogo, getTablasCortes, createTablaCorte } from "../api";

export function useProductos() {
  return useQuery({
    queryKey: ["maderas-productos"],
    queryFn: getProductos,
  });
}

export function useBastones() {
  return useQuery({
    queryKey: ["maderas-bastones"],
    queryFn: getBastones,
  });
}

export function useCreateCatalogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCatalogo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maderas-productos"] });
      queryClient.invalidateQueries({ queryKey: ["maderas-bastones"] });
    },
  });
}

export function useDeleteCatalogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCatalogo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maderas-productos"] });
      queryClient.invalidateQueries({ queryKey: ["maderas-bastones"] });
    },
  });
}

export function useTablasCortes() {
  return useQuery({
    queryKey: ["maderas-tablas-cortes"],
    queryFn: getTablasCortes,
  });
}

export function useCreateTablaCorte() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTablaCorte,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maderas-tablas-cortes"] });
    },
  });
}
