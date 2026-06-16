import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listPuestos,
  createPuesto,
  updatePuesto,
  deletePuesto,
  getModulosDisponibles,
  getEmpleadoModulos,
  addEmpleadoModulo,
  removeEmpleadoModulo,
} from "../api";

export function usePuestos(search?: string) {
  return useQuery({
    queryKey: ["puestos", search],
    queryFn: () => listPuestos({ search }),
  });
}

export function useModulosDisponibles() {
  return useQuery({
    queryKey: ["modulos-disponibles"],
    queryFn: getModulosDisponibles,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useCreatePuesto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPuesto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["puestos"] });
    },
  });
}

export function useUpdatePuesto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updatePuesto>[1] }) =>
      updatePuesto(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["puestos"] });
    },
  });
}

export function useDeletePuesto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePuesto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["puestos"] });
    },
  });
}

// Hooks para asignación individual de módulos a empleados

export function useEmpleadoModulos(empleadoId: string) {
  return useQuery({
    queryKey: ["empleado-modulos", empleadoId],
    queryFn: () => getEmpleadoModulos(empleadoId),
    enabled: !!empleadoId,
  });
}

export function useAddEmpleadoModulo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ empleadoId, modulo_slug }: { empleadoId: string; modulo_slug: string }) =>
      addEmpleadoModulo(empleadoId, modulo_slug),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["empleado-modulos", variables.empleadoId] });
    },
  });
}

export function useRemoveEmpleadoModulo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ empleadoId, modulo_slug }: { empleadoId: string; modulo_slug: string }) =>
      removeEmpleadoModulo(empleadoId, modulo_slug),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["empleado-modulos", variables.empleadoId] });
    },
  });
}
