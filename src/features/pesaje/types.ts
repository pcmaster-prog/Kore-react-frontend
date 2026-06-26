export type PesajeSabor = {
  id: number;
  empresa_id?: string | null;
  nombre: string;
  presentacion?: string | null;
  peso_estandar: number;
  unidad: string;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
};

export type PesajeRegistro = {
  id: number;
  empresa_id?: string | null;
  empleado_id: string;
  sabor_id: number;
  cantidad: number;
  peso: number;
  fecha_registro: string;
  created_at?: string;
  updated_at?: string;
  empleado?: {
    id: string;
    full_name?: string;
    nombres?: string;
    apellidos?: string;
  } | null;
  sabor?: PesajeSabor | null;
};

export type CreatePesajePayload = {
  empleado_id: string;
  sabor_id: number;
  cantidad: number;
  peso?: number;
};

export type CreateSaborPayload = {
  nombre: string;
  presentacion?: string;
  peso_estandar: number;
  unidad: string;
};

export type UpdateSaborPayload = Partial<CreateSaborPayload> & {
  activo?: boolean;
};

export type DashboardStats = {
  kgIngresadosHoy: number;
  viajesHoy: number;
  unidadesHoy: number;
  tendencia: number;
  ultimosViajes: PesajeRegistro[];
};

export type ApiResponse<T> = {
  data: T;
  message?: string;
};
