import api from "@/lib/http";

export async function getDashboardPesaje() {
  const res = await api.get("/pesaje/dashboard");
  return res.data;
}

export async function getHistorialPesaje(params?: any) {
  const res = await api.get("/pesaje/historial", { params });
  return res.data;
}

export async function createPesaje(payload: any) {
  const res = await api.post("/pesaje", payload);
  return res.data;
}

export async function getSabores() {
  const res = await api.get("/pesaje/sabores");
  return res.data;
}

export async function createSabor(payload: any) {
  const res = await api.post("/pesaje/sabores", payload);
  return res.data;
}

export async function updateSabor(id: number, payload: any) {
  const res = await api.put(`/pesaje/sabores/${id}`, payload);
  return res.data;
}
