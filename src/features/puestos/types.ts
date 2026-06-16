export type Puesto = {
  id: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  modulos: string[];           // slugs de módulos asignados
  empleados_count?: number;
  created_at: string;
};

export type ModuloDisponible = {
  slug: string;
  nombre: string;
};

export type EmpleadoModuloOverride = {
  id: string;
  modulo_slug: string;
  asignado_por: string;
  created_at: string;
};

export type AccesoEfectivoEmpleado = {
  heredados: string[];      // del puesto
  individuales: string[];   // overrides
  efectivos: string[];      // unión de ambos
};
