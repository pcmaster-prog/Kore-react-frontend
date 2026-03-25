// src/features/gondolas/api.ts
import api from "@/lib/http";
import type { Gondola, GondolaProducto, GondolaOrden } from "./types";

// ── Góndolas ──────────────────────────────────────────────────────────────
export const listGondolas = () =>
  api.get("/gondolas").then((r) => {
    const list = Array.isArray(r.data) ? r.data : r.data?.data;
    return (list || []) as Gondola[];
  });

export const getGondola = (id: string) =>
  api
    .get(`/gondolas/${id}`)
    .then((r) => r.data as Gondola & { productos: GondolaProducto[] });

export const createGondola = (data: {
  nombre: string;
  descripcion?: string;
  ubicacion?: string;
}) => api.post("/gondolas", data).then((r) => r.data as Gondola);

export const updateGondola = (id: string, data: Partial<Gondola>) =>
  api.patch(`/gondolas/${id}`, data).then((r) => r.data as Gondola);

export const deleteGondola = (id: string) => api.delete(`/gondolas/${id}`);

// ── Productos ─────────────────────────────────────────────────────────────
export const addProducto = (
  gondolaId: string,
  data: {
    nombre: string;
    clave?: string;
    unidad: string;
    descripcion?: string;
  },
) =>
  api
    .post(`/gondolas/${gondolaId}/productos`, data)
    .then((r) => r.data as GondolaProducto);

export const updateProducto = (
  gondolaId: string,
  productoId: string,
  data: Partial<GondolaProducto>,
) =>
  api
    .patch(`/gondolas/${gondolaId}/productos/${productoId}`, data)
    .then((r) => r.data as GondolaProducto);

export const removeProducto = (gondolaId: string, productoId: string) =>
  api.delete(`/gondolas/${gondolaId}/productos/${productoId}`);

export const uploadFotoProducto = (
  gondolaId: string,
  productoId: string,
  file: File,
) => {
  const form = new FormData();
  form.append("file", file);
  return api
    .post(`/gondolas/${gondolaId}/productos/${productoId}/foto`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data as { foto_url: string });
};

// ── Órdenes ───────────────────────────────────────────────────────────────
export const listOrdenes = (params?: {
  status?: string;
  gondola_id?: string;
  empleado_id?: string;
}) =>
  api.get("/gondola-ordenes", { params }).then((r) => {
    const list = Array.isArray(r.data) ? r.data : r.data?.data;
    return (list || []) as GondolaOrden[];
  });

export const getOrden = (id: string) =>
  api.get(`/gondola-ordenes/${id}`).then((r) => r.data as GondolaOrden);

export const createOrden = (data: {
  gondola_id: string;
  empleado_id: string;
  notas?: string;
}) => api.post("/gondola-ordenes", data).then((r) => r.data as GondolaOrden);

export const iniciarOrden = (id: string) =>
  api
    .post(`/gondola-ordenes/${id}/iniciar`)
    .then((r) => r.data as GondolaOrden);

export const completarOrden = (
  id: string,
  data: {
    items: Array<{ id: string; cantidad: number }>;
    notas_empleado?: string;
    evidencia?: File;
  },
) => {
  const form = new FormData();
  form.append("items", JSON.stringify(data.items));
  if (data.notas_empleado) form.append("notas_empleado", data.notas_empleado);
  if (data.evidencia) form.append("evidencia", data.evidencia);
  return api
    .post(`/gondola-ordenes/${id}/completar`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data as GondolaOrden);
};

export const aprobarOrden = (id: string) =>
  api
    .post(`/gondola-ordenes/${id}/aprobar`)
    .then((r) => r.data as GondolaOrden);

export const rechazarOrden = (id: string, notas_rechazo: string) =>
  api
    .post(`/gondola-ordenes/${id}/rechazar`, { notas_rechazo })
    .then((r) => r.data as GondolaOrden);

export const misOrdenesGondola = () =>
  api.get("/mis-ordenes-gondola").then((r) => {
    const list = Array.isArray(r.data) ? r.data : r.data?.data;
    return (list || []) as GondolaOrden[];
  });
