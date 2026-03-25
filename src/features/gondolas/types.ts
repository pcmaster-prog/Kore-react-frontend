// src/features/gondolas/types.ts

export type Unidad = "pz" | "kg" | "caja" | "media_caja";

export type GondolaStatus =
  | "pendiente"
  | "en_proceso"
  | "completado"
  | "aprobado"
  | "rechazado";

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

export type GondolaProducto = {
  id: string;
  gondola_id: string;
  clave?: string | null;
  nombre: string;
  descripcion?: string | null;
  unidad: Unidad;
  foto_url?: string | null;
  orden: number;
  activo: boolean;
};

export type GondolaOrdenItem = {
  id: string;
  gondola_producto_id: string;
  clave?: string | null;
  nombre: string;
  unidad: Unidad;
  cantidad: number | null;
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
