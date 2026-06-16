export type ProductoMadera = {
  id: string;
  sku: string;
  nombre: string;
  tipo: "base" | "bolsa";
  activo: boolean;
};

export type RecetaMadera = {
  id: string;
  producto_id: string;
  baston_id: string;
  cortes_por_baston: number;
  medida_corte_cm: number;
};

export type BastonMadera = {
  id: string;
  grosor_mm: number;
  largo_cm: number;
  stock: number;
};

export type RegistroProduccion = {
  id: string;
  fecha: string;
  producto_id: string;
  cantidad: number;
  user_id: string;
  notas: string | null;
  anulado: boolean;
  producto?: ProductoMadera;
};

export type Ensamblaje = {
  id: string;
  fecha: string;
  producto_id: string; // debe ser tipo bolsa
  cantidad_bolsas: number;
  user_id: string;
};

export type TemporadaMadera = {
  id: string;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  meta_bolsas: number;
  activa: boolean;
};

export type TablaCortePXT = {
  id: string;
  medida_cm: number;
  piezas_por_tabla: number;
};
