import api from "@/lib/http";
import type { Puesto, ModuloDisponible, EmpleadoModuloOverride, AccesoEfectivoEmpleado } from "./types";

export async function listPuestos(params?: { search?: string }) {
  const res = await api.get("/puestos", { params });
  return res.data as {
    data: Puesto[];
    total: number;
    current_page: number;
    last_page: number;
  };
}

export async function createPuesto(payload: { nombre: string; descripcion?: string; modulos: string[] }) {
  const res = await api.post("/puestos", payload);
  return res.data.data as Puesto;
}

export async function updatePuesto(id: string, payload: { nombre?: string; descripcion?: string; modulos?: string[]; activo?: boolean }) {
  const res = await api.put(`/puestos/${id}`, payload);
  return res.data.data as Puesto;
}

export async function deletePuesto(id: string) {
  await api.delete(`/puestos/${id}`);
}

export async function getModulosDisponibles() {
  const res = await api.get("/puestos/modulos-disponibles");
  return res.data.data as ModuloDisponible[];
}

export async function getEmpleadoModulos(empleadoId: string) {
  const res = await api.get(`/empleados/${empleadoId}/modulos`);
  return res.data as AccesoEfectivoEmpleado;
}

export async function addEmpleadoModulo(empleadoId: string, modulo_slug: string) {
  const res = await api.post(`/empleados/${empleadoId}/modulos`, { modulo_slug });
  return res.data.data as EmpleadoModuloOverride;
}

export async function removeEmpleadoModulo(empleadoId: string, modulo_slug: string) {
  await api.delete(`/empleados/${empleadoId}/modulos/${modulo_slug}`);
}
