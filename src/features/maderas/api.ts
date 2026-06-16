import api from "@/lib/http";
import type { 
  MaderasCatalogo, MaderasTablaCorte, MaderasTemporada, 
  MaderasInventario, MaderasProduccion, MaderasEnsamble, 
  MaderasPedido 
} from "./types";

// Catálogos
export async function getProductos() {
  const res = await api.get<{ data: MaderasCatalogo[] }>("/maderas/productos");
  return res.data.data;
}

export async function getBastones() {
  const res = await api.get<{ data: MaderasCatalogo[] }>("/maderas/bastones");
  return res.data.data;
}

export async function createCatalogo(data: Partial<MaderasCatalogo>) {
  const res = await api.post<{ data: MaderasCatalogo }>("/maderas/catalogo", data);
  return res.data.data;
}

export async function deleteCatalogo(id: number) {
  const res = await api.delete(`/maderas/catalogo/${id}`);
  return res.data;
}

// Tablas Corte
export async function getTablasCortes() {
  const res = await api.get<{ data: MaderasTablaCorte[] }>("/maderas/tablas-cortes");
  return res.data.data;
}

export async function createTablaCorte(data: Partial<MaderasTablaCorte>) {
  const res = await api.post<{ data: MaderasTablaCorte }>("/maderas/tablas-cortes", data);
  return res.data.data;
}

// Temporadas
export async function getTemporadas() {
  const res = await api.get<{ data: MaderasTemporada[] }>("/maderas/temporadas");
  return res.data.data;
}

export async function createTemporada(data: Partial<MaderasTemporada>) {
  const res = await api.post<{ data: MaderasTemporada }>("/maderas/temporadas", data);
  return res.data.data;
}

export async function getTemporadaActiva() {
  const res = await api.get<{ data: MaderasTemporada | null }>("/maderas/temporadas/activa");
  return res.data.data;
}

// Inventario
export async function getInventario() {
  const res = await api.get<MaderasInventario[]>("/maderas/inventario");
  return res.data;
}

export async function createInventario(data: Partial<MaderasInventario>) {
  const res = await api.post<MaderasInventario>("/maderas/inventario", data);
  return res.data;
}

// Producción
export async function getProduccion() {
  const res = await api.get<MaderasProduccion[]>("/maderas/produccion");
  return res.data;
}

export async function createProduccion(data: Partial<MaderasProduccion>) {
  const res = await api.post<MaderasProduccion>("/maderas/produccion", data);
  return res.data;
}

export async function anularProduccion(id: number) {
  const res = await api.delete(`/maderas/produccion/${id}`);
  return res.data;
}

// Ensambles
export async function getEnsambles() {
  const res = await api.get<MaderasEnsamble[]>("/maderas/ensambles");
  return res.data;
}

export async function createEnsamble(data: any) {
  const res = await api.post<MaderasEnsamble>("/maderas/ensambles", data);
  return res.data;
}

export async function updateEnsamble(id: number, data: Partial<MaderasEnsamble>) {
  const res = await api.put<MaderasEnsamble>(`/maderas/ensambles/${id}`, data);
  return res.data;
}

// Pedidos
export async function getPedidos() {
  const res = await api.get<MaderasPedido[]>("/maderas/pedidos");
  return res.data;
}

export async function createPedido(data: Partial<MaderasPedido>) {
  const res = await api.post<MaderasPedido>("/maderas/pedidos", data);
  return res.data;
}

export async function updatePedido(id: number, data: Partial<MaderasPedido>) {
  const res = await api.put<MaderasPedido>(`/maderas/pedidos/${id}`, data);
  return res.data;
}
