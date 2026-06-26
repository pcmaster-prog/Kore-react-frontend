import api from "@/lib/http";
import type {
  ApiResponse,
  CreatePesajePayload,
  CreateSaborPayload,
  DashboardStats,
  PesajeRegistro,
  PesajeSabor,
  UpdateSaborPayload,
} from "./types";

export async function getDashboardPesaje(): Promise<ApiResponse<DashboardStats>> {
  const res = await api.get("/pesaje/dashboard");
  return res.data;
}

export async function getHistorialPesaje(params?: { search?: string; limit?: number }): Promise<ApiResponse<PesajeRegistro[]>> {
  const res = await api.get("/pesaje/historial", { params });
  return res.data;
}

export async function createPesaje(payload: CreatePesajePayload): Promise<ApiResponse<PesajeRegistro>> {
  const res = await api.post("/pesaje", payload);
  return res.data;
}

export async function updatePesaje(id: number, payload: Partial<CreatePesajePayload>): Promise<ApiResponse<PesajeRegistro>> {
  const res = await api.put(`/pesaje/registros/${id}`, payload);
  return res.data;
}

export async function deletePesaje(id: number): Promise<ApiResponse<null>> {
  const res = await api.delete(`/pesaje/registros/${id}`);
  return res.data;
}

export async function getSabores(conInactivos = false): Promise<ApiResponse<PesajeSabor[]>> {
  const res = await api.get("/pesaje/sabores", { params: { con_inactivos: conInactivos ? 1 : 0 } });
  return res.data;
}

export async function createSabor(payload: CreateSaborPayload): Promise<ApiResponse<PesajeSabor>> {
  const res = await api.post("/pesaje/sabores", payload);
  return res.data;
}

export async function updateSabor(id: number, payload: UpdateSaborPayload): Promise<ApiResponse<PesajeSabor>> {
  const res = await api.put(`/pesaje/sabores/${id}`, payload);
  return res.data;
}

export async function deleteSabor(id: number): Promise<ApiResponse<null>> {
  const res = await api.delete(`/pesaje/sabores/${id}`);
  return res.data;
}
