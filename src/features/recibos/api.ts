import api from "@/lib/http";
import type {
  ReciboNominaListItem,
  ReciboNomina,
  ReciboGratificacionListItem,
  ReciboGratificacion,
  GratificationType,
  FirmaPayload,
  FirmaResponse,
} from "./recibos.types";

// ─── Recibos de Nómina (Empleado) ───

export async function listarRecibosNomina(): Promise<{
  data: ReciboNominaListItem[];
  pending_count: number;
  signed_count: number;
}> {
  const res = await api.get("/mis-recibos/nomina");
  return res.data;
}

export async function obtenerReciboNomina(id: number): Promise<ReciboNomina> {
  const res = await api.get(`/mis-recibos/nomina/${id}`);
  return res.data;
}

export async function firmarReciboNomina(
  id: number,
  payload: FirmaPayload
): Promise<FirmaResponse> {
  const res = await api.post(`/mis-recibos/nomina/${id}/firmar`, payload);
  return res.data;
}

// ─── Recibos de Gratificación (Empleado) ───

export async function listarRecibosGratificacion(): Promise<{
  data: ReciboGratificacionListItem[];
}> {
  const res = await api.get("/mis-recibos/gratificaciones");
  return res.data;
}

export async function obtenerReciboGratificacion(
  id: number
): Promise<ReciboGratificacion> {
  const res = await api.get(`/mis-recibos/gratificaciones/${id}`);
  return res.data;
}

export async function firmarReciboGratificacion(
  id: number,
  payload: FirmaPayload
): Promise<FirmaResponse> {
  const res = await api.post(`/mis-recibos/gratificaciones/${id}/firmar`, payload);
  return res.data;
}

// ─── Tipos de Gratificación (Admin) ───

export async function listarTiposGratificacion(): Promise<{
  data: GratificationType[];
}> {
  const res = await api.get("/admin/tipos-gratificacion");
  return res.data;
}

export async function crearTipoGratificacion(
  payload: Omit<GratificationType, "id" | "is_active">
): Promise<GratificationType> {
  const res = await api.post("/admin/tipos-gratificacion", payload);
  return res.data;
}

export async function actualizarTipoGratificacion(
  id: number,
  payload: Partial<Omit<GratificationType, "id">>
): Promise<GratificationType> {
  const res = await api.put(`/admin/tipos-gratificacion/${id}`, payload);
  return res.data;
}

export async function eliminarTipoGratificacion(id: number): Promise<void> {
  await api.delete(`/admin/tipos-gratificacion/${id}`);
}
