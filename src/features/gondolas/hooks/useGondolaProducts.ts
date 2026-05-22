// src/features/gondolas/hooks/useGondolaProducts.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductoToGondola,
  updateProductoEnGondola,
  removeProductoDeGondola,
  generarTareaDeRelleno,
} from "@/features/gondolas/api";
import type { Product } from "@/features/gondolas/types";

const PRODUCTS_KEY = ["products"] as const;
const GONDOLA_KEY = ["gondolas"] as const;

// ═══════════════════════════════════════════════════════════════════════════
// Products (catálogo maestro)
// ═══════════════════════════════════════════════════════════════════════════

export function useProducts(params?: { active?: boolean; search?: string; unit?: string }) {
  return useQuery({
    queryKey: [...PRODUCTS_KEY, params],
    queryFn: () => fetchProducts(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof createProduct>[0]) => createProduct(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCTS_KEY }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateProduct>[1] }) =>
      updateProduct(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCTS_KEY }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCTS_KEY }),
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Product ↔ Gondola linking
// ═══════════════════════════════════════════════════════════════════════════

export function useAddProductToGondola() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      gondolaId,
      productId,
      orden,
    }: {
      gondolaId: string;
      productId: string;
      orden?: number;
    }) => addProductoToGondola(gondolaId, productId, orden),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: [...GONDOLA_KEY, variables.gondolaId] });
    },
  });
}

export function useUpdateProductoEnGondola() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      gondolaId,
      locationId,
      data,
    }: {
      gondolaId: string;
      locationId: string;
      data: Parameters<typeof updateProductoEnGondola>[2];
    }) => updateProductoEnGondola(gondolaId, locationId, data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: [...GONDOLA_KEY, variables.gondolaId] });
    },
  });
}

export function useRemoveProductoDeGondola() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ gondolaId, locationId }: { gondolaId: string; locationId: string }) =>
      removeProductoDeGondola(gondolaId, locationId),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: [...GONDOLA_KEY, variables.gondolaId] });
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Generar tarea de relleno
// ═══════════════════════════════════════════════════════════════════════════

export function useGenerateRefillTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      gondolaId,
      data,
    }: {
      gondolaId: string;
      data: Parameters<typeof generarTareaDeRelleno>[1];
    }) => generarTareaDeRelleno(gondolaId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: GONDOLA_KEY });
      qc.invalidateQueries({ queryKey: ["mis-ordenes-gondola"] });
      qc.invalidateQueries({ queryKey: ["mis-tareas"] });
    },
  });
}
