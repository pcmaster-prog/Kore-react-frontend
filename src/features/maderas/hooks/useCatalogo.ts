import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCatalogos, createCatalogo, deleteCatalogo } from "../api";

export function useCatalogos() {
  return useQuery({
    queryKey: ["maderas-catalogos"],
    queryFn: getCatalogos,
  });
}

export function useCreateCatalogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCatalogo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maderas-catalogos"] });
    },
  });
}

export function useDeleteCatalogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCatalogo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maderas-catalogos"] });
    },
  });
}
