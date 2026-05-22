// src/features/gondolas/types.ts

export type Unidad = "pz" | "kg" | "caja" | "media_caja";

export type GondolaStatus =
  | "pendiente"
  | "en_proceso"
  | "completado"
  | "aprobado"
  | "rechazado";

// ═══════════════════════════════════════════════════════════════════════════
// ① CATÁLOGO MAESTRO DE PRODUCTOS
// ═══════════════════════════════════════════════════════════════════════════

export interface Product {
  id: string;
  sku: string | null;
  name: string;
  description: string | null;
  default_unit: string;
  photo_url: string | null;
  is_active: boolean;
  locations_count?: number;
}

export interface ProductLocation {
  id: string;
  gondola_id: string;
  product_id: string;
  product?: Product;
  orden: number;
  activo: boolean;
  // Campos legacy (para productos aún no migrados):
  clave?: string | null;
  nombre?: string | null;
  unidad?: string | null;
  foto_url?: string | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// ② GÓNDOLAS
// ═══════════════════════════════════════════════════════════════════════════

export type Gondola = {
  id: string;
  nombre: string;
  descripcion?: string | null;
  ubicacion?: string | null;
  orden: number;
  activo: boolean;
  productos_count: number;
  ultima_orden?: {
    created_at: string;
    status: GondolaStatus;
  } | null;
  ordenes_pendientes: number;
};

// Legacy — solo para productos sin product_id
export interface GondolaProductoLegacy {
  id: string;
  gondola_id: string;
  clave: string | null;
  nombre: string;
  descripcion: string | null;
  unidad: string;
  foto_url: string | null;
  orden: number;
  activo: boolean;
}

// Nuevo — unificador que el backend devuelve
export interface GondolaProducto {
  id: string; // Este ES el location_id (gondola_productos.id)
  product_id?: string | null;
  product?: Product;
  // Fallback legacy:
  clave?: string | null;
  nombre?: string | null;
  unidad?: string | null;
  foto_url?: string | null;
  orden: number;
  activo: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// ③ ÓRDENES
// ═══════════════════════════════════════════════════════════════════════════

export type GondolaOrdenItem = {
  id: string;
  product_id?: string | null;
  product?: Product | null;
  // Snapshot legacy (siempre presente para historial):
  clave: string | null;
  nombre: string;
  unidad: string;
  cantidad: number | null;
  unit?: string | null; // unidad dinámica registrada por empleado
  foto_url?: string | null;
};

export type GondolaOrden = {
  id: string;
  gondola: { id: string; nombre: string };
  empleado: { id: string; full_name: string; position_title?: string | null };
  status: GondolaStatus;
  notas_empleado?: string | null;
  notas_rechazo?: string | null;
  evidencia_url?: string | null;
  completed_at?: string | null;
  approved_at?: string | null;
  created_at: string;
  items: GondolaOrdenItem[];
};
