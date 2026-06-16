export type MaderasCatalogo = {
  id: number;
  nombre: string;
  tipo: "baston" | "producto_terminado" | "insumo";
  unidad_medida: string;
  created_at: string;
  updated_at: string;
};

export type MaderasTablaCorte = {
  id: number;
  nombre: string;
  rendimiento_esperado: number;
  created_at: string;
  updated_at: string;
};

export type MaderasTemporada = {
  id: number;
  nombre: string;
  mes_inicio: number;
  mes_fin: number;
  multiplicador: number;
  created_at: string;
  updated_at: string;
};

export type MaderasInventario = {
  id: number;
  catalogo_id: number;
  stock: number;
  stock_minimo: number;
  status: "ok" | "low" | "critical";
  created_at: string;
  updated_at: string;
  catalogo?: MaderasCatalogo;
};

export type MaderasProduccion = {
  id: number;
  empleado_id: string; // UUID
  catalogo_id: number;
  maquina: string | null;
  cantidad: number;
  fecha_registro: string;
  created_at: string;
  updated_at: string;
  empleado?: any; // To do: add Empleado type
  catalogo?: MaderasCatalogo;
};

export type MaderasEnsamblePieza = {
  id: number;
  ensamble_id: number;
  catalogo_id: number;
  cantidad_usada: number;
  created_at: string;
  updated_at: string;
  catalogo?: MaderasCatalogo;
};

export type MaderasEnsamble = {
  id: number;
  catalogo_id: number;
  cantidad_generada: number;
  status: "en_proceso" | "listo";
  created_at: string;
  updated_at: string;
  catalogo?: MaderasCatalogo;
  piezas?: MaderasEnsamblePieza[];
};

export type PedidoItem = {
  categoria: string;
  cantidad: number;
  descripcion: string;
  precio_unitario: number;
  total: number;
  piezas_calculadas?: number;
  recibido?: number;
};

export type MaderasPedido = {
  id: number;
  codigo: string;
  cliente: string;
  total_unidades: number;
  total_precio: number;
  items: PedidoItem[];
  status: "pendiente" | "entregado";
  fecha_entrega: string | null;
  created_at: string;
  updated_at: string;
};
