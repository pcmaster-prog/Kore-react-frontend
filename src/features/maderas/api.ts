import api from "@/lib/http";
import type { 
  ProductoMadera, BastonMadera, RegistroProduccion, 
  Ensamblaje, TemporadaMadera, TablaCortePXT 
} from "./types";

// Dashboard
export async function getDashboard() {
  const res = await api.get("/maderas/dashboard");
  return res.data;
}

// Inventario
export async function getInventario() {
  const res = await api.get("/maderas/inventario");
  return res.data;
}

export async function ajustarInventario(payload: any) {
  const res = await api.post("/maderas/inventario/ajuste", payload);
  return res.data;
}

// Tablas Corte
export async function getTablasCortes() {
  const res = await api.get("/maderas/tablas-cortes");
  return res.data.data as TablaCortePXT[];
}

// Productos & Catálogo
export async function getProductos() {
  const res = await api.get("/maderas/productos");
  return res.data.data as ProductoMadera[];
}

// Bastones
export async function getBastones() {
  const res = await api.get("/maderas/bastones");
  return res.data.data as BastonMadera[];
}

// Temporadas
export async function getTemporadas() {
  const res = await api.get("/maderas/temporadas");
  return res.data.data as TemporadaMadera[];
}

export async function getTemporadaActiva() {
  const res = await api.get("/maderas/temporadas/activa");
  return res.data.data as TemporadaMadera;
}

// Producción
export async function getProduccion(params?: any) {
  const res = await api.get("/maderas/produccion", { params });
  return res.data;
}

export async function createProduccion(payload: { producto_id: string; cantidad: number; notas?: string }) {
  const res = await api.post("/maderas/produccion", payload);
  return res.data.data as RegistroProduccion;
}

export async function anularProduccion(id: string) {
  const res = await api.put(`/maderas/produccion/${id}/anular`);
  return res.data;
}

// Ensamblaje
export async function getEnsamblajes(params?: any) {
  const res = await api.get("/maderas/ensamblaje", { params });
  return res.data;
}

export async function createEnsamblaje(payload: { producto_id: string; cantidad_bolsas: number }) {
  const res = await api.post("/maderas/ensamblaje", payload);
  return res.data.data as Ensamblaje;
}

// Pedidos
export async function calcularPedido() {
  const res = await api.get("/maderas/pedidos/calcular");
  return res.data;
}

export async function getPedidos() {
  const res = await api.get("/maderas/pedidos");
  return res.data;
}

export async function downloadPedidoPdf(id: string) {
  const res = await api.get(`/maderas/pedidos/${id}/pdf`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `pedido-${id}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}
