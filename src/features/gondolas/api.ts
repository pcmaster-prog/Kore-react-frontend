// src/features/gondolas/api.ts
import api from "@/lib/http";
import type { Gondola, GondolaProducto, GondolaOrden, Product } from "./types";

// ═══════════════════════════════════════════════════════════════════════════
// ① CATÁLOGO MAESTRO DE PRODUCTOS
// ═══════════════════════════════════════════════════════════════════════════

export const fetchProducts = (params?: { active?: boolean; search?: string; unit?: string }) =>
  api.get("/products", { params }).then((r) => {
    const list = Array.isArray(r.data) ? r.data : r.data?.data;
    return (list || []) as Product[];
  });

export const createProduct = (data: {
  sku?: string;
  name: string;
  description?: string;
  default_unit: string;
  photo?: File;
}) => {
  const form = new FormData();
  form.append("name", data.name);
  if (data.sku) form.append("sku", data.sku);
  if (data.description) form.append("description", data.description);
  form.append("default_unit", data.default_unit);
  if (data.photo) form.append("photo", data.photo);
  return api
    .post("/products", form, { headers: { "Content-Type": "multipart/form-data" } })
    .then((r) => r.data as Product);
};

export const updateProduct = (id: string, data: Partial<Product> & { photo?: File }) => {
  const form = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && key !== "photo") form.append(key, String(value));
  });
  if (data.photo) form.append("photo", data.photo);
  return api
    .post(`/products/${id}`, form, {
      headers: { "Content-Type": "multipart/form-data" },
      params: { _method: "PATCH" },
    })
    .then((r) => r.data as Product);
};

export const deleteProduct = (id: string) => api.delete(`/products/${id}`);

export const fetchProductLocations = (productId: string) =>
  api.get(`/products/${productId}/locations`).then((r) => r.data);

// ═══════════════════════════════════════════════════════════════════════════
// ② GÓNDOLAS
// ═══════════════════════════════════════════════════════════════════════════

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

// ── Productos en góndola (vinculación al catálogo maestro) ──

export const addProductoToGondola = (gondolaId: string, productId: string, orden?: number) =>
  api
    .post(`/gondolas/${gondolaId}/productos`, { product_id: productId, orden })
    .then((r) => r.data as GondolaProducto);

export const updateProductoEnGondola = (
  gondolaId: string,
  locationId: string,
  data: { orden?: number; activo?: boolean },
) =>
  api
    .patch(`/gondolas/${gondolaId}/productos/${locationId}`, data)
    .then((r) => r.data as GondolaProducto);

export const removeProductoDeGondola = (gondolaId: string, locationId: string) =>
  api.delete(`/gondolas/${gondolaId}/productos/${locationId}`);

export const uploadFotoProducto = (gondolaId: string, productId: string, file: File) => {
  const form = new FormData();
  form.append("file", file);
  return api
    .post(`/gondolas/${gondolaId}/productos/${productId}/foto`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data as { foto_url: string });
};

// ═══════════════════════════════════════════════════════════════════════════
// ③ GENERAR TAREA DE RELLENO
// ═══════════════════════════════════════════════════════════════════════════

export const generarTareaDeRelleno = (
  gondolaId: string,
  data: {
    empleado_ids: string[];
    due_at?: string;
    notas?: string;
  },
) =>
  api
    .post(`/gondolas/${gondolaId}/generar-tarea`, data)
    .then((r) => r.data as { message: string; orden_id: string; task_id?: string });

// ═══════════════════════════════════════════════════════════════════════════
// ④ ÓRDENES
// ═══════════════════════════════════════════════════════════════════════════

export const listOrdenes = (params?: {
  status?: string;
  gondola_id?: string;
  empleado_id?: string;
}) =>
  api.get("/gondola-ordenes", { params }).then((r) => {
    const list = Array.isArray(r.data) ? r.data : r.data?.data;
    return (list || []).map((o: any) => ({ ...o, items: o.items || [] })) as GondolaOrden[];
  });

export const getOrden = (id: string) =>
  api.get(`/gondola-ordenes/${id}`).then((r) => {
    const o = r.data;
    return { ...o, items: o.items || [] } as GondolaOrden;
  });

export const createOrden = (data: {
  gondola_id: string;
  empleado_id: string;
  notas?: string;
}) => api.post("/gondola-ordenes", data).then((r) => r.data as GondolaOrden);

export const iniciarOrden = (id: string) =>
  api.post(`/gondola-ordenes/${id}/iniciar`).then((r) => {
    const o = r.data;
    return { ...o, items: o.items || [] } as GondolaOrden;
  });

export const completarOrden = (
  id: string,
  data: {
    items: Array<{ id: string; cantidad: number; unit?: string }>;
    notas_empleado?: string;
    evidencia_url?: string;
    evidencia?: File;
  },
) => {
  const form = new FormData();
  form.append("items", JSON.stringify(data.items));
  if (data.notas_empleado) form.append("notas_empleado", data.notas_empleado);
  if (data.evidencia_url) form.append("evidencia_url", data.evidencia_url);
  if (data.evidencia) form.append("evidencia", data.evidencia);
  return api
    .post(`/gondola-ordenes/${id}/completar`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => {
      const o = r.data;
      return { ...o, items: o.items || [] } as GondolaOrden;
    });
};

export const aprobarOrden = (id: string) =>
  api.post(`/gondola-ordenes/${id}/aprobar`).then((r) => r.data as GondolaOrden);

export const rechazarOrden = (id: string, notas_rechazo: string) =>
  api
    .post(`/gondola-ordenes/${id}/rechazar`, { notas_rechazo })
    .then((r) => r.data as GondolaOrden);

export const misOrdenesGondola = () =>
  api.get("/mis-ordenes-gondola").then((r) => {
    const list = Array.isArray(r.data) ? r.data : r.data?.data;
    return (list || []).map((o: any) => ({ ...o, items: o.items || [] })) as GondolaOrden[];
  });

export const autoRellenarGondola = (gondolaId: string) =>
  api
    .post(`/gondolas/${gondolaId}/auto-rellenar`)
    .then((r) => r.data as { message: string; orden_id: string });
