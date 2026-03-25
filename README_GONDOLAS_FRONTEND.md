# Kore — Gondola Refill Management: Frontend

Stack: React 18 · TypeScript · Tailwind CSS · Vercel

---

## Resumen del Feature

Módulo de gestión de góndolas integrado en la sección de Tareas. El admin
configura góndolas con sus productos. El supervisor asigna órdenes de relleno.
El empleado registra cantidades y sube evidencia desde su móvil.

---

## 1. Tipos TypeScript

**Crear `src/features/gondolas/types.ts`:**

```typescript
export type Unidad = 'pz' | 'kg' | 'caja' | 'media_caja';

export type GondolaStatus = 'pendiente' | 'en_proceso' | 'completado' | 'aprobado' | 'rechazado';

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
```

---

## 2. API Client

**Crear `src/features/gondolas/api.ts`:**

```typescript
import api from '@/lib/http';
import type { Gondola, GondolaProducto, GondolaOrden } from './types';

// ── Góndolas ──────────────────────────────────────────────────────────────
export const listGondolas = () =>
  api.get('/gondolas').then(r => r.data as Gondola[]);

export const getGondola = (id: string) =>
  api.get(`/gondolas/${id}`).then(r => r.data as Gondola & { productos: GondolaProducto[] });

export const createGondola = (data: { nombre: string; descripcion?: string; ubicacion?: string }) =>
  api.post('/gondolas', data).then(r => r.data as Gondola);

export const updateGondola = (id: string, data: Partial<Gondola>) =>
  api.patch(`/gondolas/${id}`, data).then(r => r.data as Gondola);

export const deleteGondola = (id: string) =>
  api.delete(`/gondolas/${id}`);

// ── Productos ─────────────────────────────────────────────────────────────
export const addProducto = (gondolaId: string, data: {
  nombre: string; clave?: string; unidad: string; descripcion?: string;
}) => api.post(`/gondolas/${gondolaId}/productos`, data).then(r => r.data as GondolaProducto);

export const updateProducto = (gondolaId: string, productoId: string, data: Partial<GondolaProducto>) =>
  api.patch(`/gondolas/${gondolaId}/productos/${productoId}`, data).then(r => r.data as GondolaProducto);

export const removeProducto = (gondolaId: string, productoId: string) =>
  api.delete(`/gondolas/${gondolaId}/productos/${productoId}`);

export const uploadFotoProducto = (gondolaId: string, productoId: string, file: File) => {
  const form = new FormData();
  form.append('file', file);
  return api.post(`/gondolas/${gondolaId}/productos/${productoId}/foto`, form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data as { foto_url: string });
};

// ── Órdenes ───────────────────────────────────────────────────────────────
export const listOrdenes = (params?: { status?: string; gondola_id?: string; empleado_id?: string }) =>
  api.get('/gondola-ordenes', { params }).then(r => r.data as GondolaOrden[]);

export const getOrden = (id: string) =>
  api.get(`/gondola-ordenes/${id}`).then(r => r.data as GondolaOrden);

export const createOrden = (data: { gondola_id: string; empleado_id: string; notas?: string }) =>
  api.post('/gondola-ordenes', data).then(r => r.data as GondolaOrden);

export const iniciarOrden = (id: string) =>
  api.post(`/gondola-ordenes/${id}/iniciar`).then(r => r.data as GondolaOrden);

export const completarOrden = (id: string, data: {
  items: Array<{ id: string; cantidad: number }>;
  notas_empleado?: string;
  evidencia?: File;
}) => {
  const form = new FormData();
  form.append('items', JSON.stringify(data.items));
  if (data.notas_empleado) form.append('notas_empleado', data.notas_empleado);
  if (data.evidencia) form.append('evidencia', data.evidencia);
  return api.post(`/gondola-ordenes/${id}/completar`, form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data as GondolaOrden);
};

export const aprobarOrden = (id: string) =>
  api.post(`/gondola-ordenes/${id}/aprobar`).then(r => r.data as GondolaOrden);

export const rechazarOrden = (id: string, notas_rechazo: string) =>
  api.post(`/gondola-ordenes/${id}/rechazar`, { notas_rechazo }).then(r => r.data as GondolaOrden);

export const misOrdenesGondola = () =>
  api.get('/mis-ordenes-gondola').then(r => r.data as GondolaOrden[]);
```

---

## 3. Pantallas Manager

### 3a. Tab "Góndolas" en `TareasManagerPage.tsx`

**Modificar `src/features/tasks/TareasManagerPage.tsx`:**

Agregar un cuarto tab `gondolas` junto a Tareas / Plantillas / Rutinas:

```tsx
// Agregar al array de tabs:
{ key: "gondolas", label: "Góndolas", icon: <LayoutGrid className="h-4 w-4" /> }

// Agregar en el render:
{tab === "gondolas" && <GondolasManagerTab />}
```

---

### 3b. Componente `GondolasManagerTab`

**Crear `src/features/gondolas/GondolasManagerTab.tsx`:**

**Vista principal — Grid de góndolas:**

```tsx
// Layout: grid 2-3 columnas en desktop
// Cada card de góndola muestra:
// - Nombre de la góndola (ej. "Góndola 1 - Cartones")
// - Ubicación si existe
// - "12 productos"
// - Último relleno: "hace 3 horas · Aprobado" o "Sin rellenos aún"
// - Badge de órdenes pendientes (número rojo si > 0)
// - Botón "Ver productos" → abre GondolaDetailModal
// - Botón "Crear orden" → abre CrearOrdenModal
// Header con botón "+ Nueva Góndola" → abre GondolaFormModal
```

**Estados de la card:**
- Sin órdenes pendientes: borde neutral, badge gris "0 pendientes"
- Con órdenes pendientes: borde amber, badge amber con número
- Último relleno aprobado reciente (<2h): indicador verde

---

### 3c. `GondolaDetailModal` (Modal lateral o modal grande)

**Crear `src/features/gondolas/GondolaDetailModal.tsx`:**

Muestra la góndola con dos tabs internos:

**Tab "Productos":**
- Lista de productos con: foto thumbnail (cuadrada 48px, rounded-xl), clave, nombre, badge de unidad, botón editar, toggle activo/inactivo
- Botón "+ Agregar producto" al final
- Inline form para agregar producto rápido (nombre, clave, unidad, descripción)
- Click en foto → abre selector de archivo para reemplazar foto

**Tab "Historial de órdenes":**
- Lista de órdenes pasadas de esta góndola
- Cada fila: fecha, empleado asignado, status badge, "Ver detalle"
- Click en fila → abre OrdenDetailModal

---

### 3d. `GondolaFormModal` (Crear/Editar góndola)

**Crear `src/features/gondolas/GondolaFormModal.tsx`:**

Campos:
- Nombre * (input text)
- Descripción (textarea, opcional)
- Ubicación (input text, ej. "Pasillo 3, lado derecho")

Botones: Cancelar / Guardar

---

### 3e. `CrearOrdenModal` (Asignar relleno)

**Crear `src/features/gondolas/CrearOrdenModal.tsx`:**

```
Título: "Nueva orden de relleno — [Nombre Góndola]"

Campos:
- Empleado a asignar (select con avatares, solo empleados activos)
- Nota opcional para el empleado (textarea)

Vista previa de productos que se incluirán:
- Lista compacta con nombre y unidad de cada producto activo
- "Se incluirán X productos"

Botones: Cancelar / Crear y asignar
```

---

### 3f. `OrdenDetailModal` (Ver/Aprobar orden)

**Crear `src/features/gondolas/OrdenDetailModal.tsx`:**

```
Header: Nombre góndola + status badge
Info: Empleado asignado, fecha creación, fecha completado

Sección "Cantidades registradas":
- Tabla: [foto] [clave] [nombre] [cantidad registrada] [unidad]
- Si cantidad es null → mostrar "—" en gris (no llenó)
- Si cantidad > 0 → mostrar en verde

Sección "Evidencia":
- Si hay foto: mostrarla clickeable (lightbox)
- Si no hay: "Sin evidencia"

Sección "Notas del empleado": texto si existe

Si status === 'completado':
  - Botón verde "✓ Aprobar"
  - Campo de texto + botón rojo "✗ Rechazar"

Si status === 'rechazado':
  - Banner rojo con notas_rechazo
  - Info: "El empleado puede volver a completar"

Si status === 'aprobado':
  - Banner verde "Aprobado el [fecha]"
```

---

### 3g. Vista "Órdenes activas" (opcional tab adicional)

Dentro de `GondolasManagerTab`, agregar un segundo tab "Órdenes" que muestre:
- Lista de todas las órdenes con status pendiente/en_proceso/completado
- Filtros: por góndola, por empleado, por status
- Click en fila → abre `OrdenDetailModal`

---

## 4. Pantallas Empleado

### 4a. Sección Góndolas en `EmployeeTasksPage.tsx`

**Modificar `src/features/tasks/EmployeeTasksPage.tsx`:**

Agregar tab "Góndolas" junto a "Asignaciones":

```tsx
{ key: "gondolas", label: "Góndolas", icon: <LayoutGrid className="h-4 w-4" /> }
{tab === "gondolas" && <GondolasEmpleadoTab />}
```

---

### 4b. `GondolasEmpleadoTab`

**Crear `src/features/gondolas/GondolasEmpleadoTab.tsx`:**

Lista de órdenes asignadas al empleado. Diseñada para móvil.

```tsx
// Secciones:
// 1. "Por hacer" — órdenes en status pendiente o en_proceso o rechazado
// 2. "Completadas hoy" — status completado o aprobado de hoy

// Card de orden:
// - Nombre de la góndola (grande, bold)
// - Cantidad de productos: "12 productos a registrar"
// - Hora de asignación: "Asignada hace 20 min"
// - Status badge
// - Si rechazada: banner rojo con nota del rechazo
// - Botón grande "Iniciar relleno" (si pendiente)
// - Botón grande "Continuar" (si en_proceso)
// - Botón "Ver detalle" (si completada/aprobada)
```

---

### 4c. `GondolaRellenoPage` (Pantalla de llenado de cantidades)

**Crear `src/features/gondolas/GondolaRellenoPage.tsx`:**

Esta es la pantalla más importante del flujo del empleado. Diseñada 100% para móvil.

```tsx
// Header fijo:
// - Botón back "←"
// - Nombre de la góndola
// - "X de Y productos llenados" (contador)
// - Status badge

// Lista de productos (scrollable):
// Cada item:
// ┌─────────────────────────────────────┐
// │ [foto 56px] C28D                    │
// │             Cartón Red. Dorado 28cm │
// │                                     │
// │  [  -  ] [   12   ] [  +  ]  pz    │
// └─────────────────────────────────────┘
// - Foto cuadrada con rounded-xl (si no hay foto: ícono genérico)
// - Clave + nombre del producto
// - Input numérico con botones - y + a los lados (thumb-friendly)
// - Badge de unidad (pz/kg/caja/media_caja)
// - Si cantidad > 0: fondo ligeramente verde
// - Si cantidad = 0: fondo neutro

// Footer fijo:
// - Input opcional "Notas para el admin" (expandible)
// - Botón cámara "📷 Agregar evidencia"
// - Botón grande "Marcar como completado" (disabled si no hay cantidades)

// Flujo:
// 1. Al entrar: si status es 'pendiente', llamar iniciarOrden() automáticamente
// 2. Al tocar "Marcar como completado": 
//    - Validar que al menos 1 producto tenga cantidad > 0
//    - Si no hay evidencia, mostrar alerta "¿Seguro? No agregaste foto de evidencia"
//    - Llamar completarOrden() con items + notas + evidencia
//    - Navegar de regreso a GondolasEmpleadoTab
// 3. Si orden rechazada: mostrar banner con nota, permitir editar y volver a completar
```

**Ruta a agregar en `routes.tsx`:**
```tsx
{
  path: "employee/gondola-relleno/:ordenId",
  element: (
    <RequireAuth>
      <GondolaRellenoPage />
    </RequireAuth>
  ),
}
```

---

### 4d. Componente `EvidenciaUploader`

**Crear `src/features/gondolas/EvidenciaUploader.tsx`:**

```tsx
// Botón que abre selector de archivo (accept="image/*")
// Al seleccionar: muestra preview de la foto
// Botón "✕" para eliminar y seleccionar otra
// Diseño: 
//   - Sin foto: área dashed con ícono de cámara y texto "Toca para agregar foto"
//   - Con foto: imagen preview con botón eliminar en esquina
```

---

## 5. Helpers y Utilidades

**Crear `src/features/gondolas/utils.ts`:**

```typescript
export const UNIDADES: Record<string, string> = {
  pz: 'pz',
  kg: 'kg',
  caja: 'caja',
  media_caja: 'media caja',
};

export const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pendiente:   { label: 'Pendiente',   color: 'bg-neutral-100 text-neutral-600 border-neutral-200' },
  en_proceso:  { label: 'En proceso',  color: 'bg-blue-100 text-blue-700 border-blue-200' },
  completado:  { label: 'Completado',  color: 'bg-amber-100 text-amber-700 border-amber-200' },
  aprobado:    { label: 'Aprobado',    color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  rechazado:   { label: 'Rechazado',   color: 'bg-rose-100 text-rose-700 border-rose-200' },
};

export function tiempoRelativo(iso: string): string {
  // "hace 5 min", "hace 2 horas", "ayer"
}
```

---

## 6. Paleta de colores del diseño

Usar estas clases de Tailwind o CSS variables para consistencia con el resto del rediseño:

- Fondo de páginas: `bg-[#F7F4EB]` o variable `--bone`
- Cards: `bg-white` con `border border-[#C2CBD4]`
- Acciones primarias: `bg-[#313852] text-white`
- Hover primario: `hover:bg-[#252d42]`
- Texto principal: `text-[#313852]`

---

## 7. Resumen de archivos a crear/modificar

| Archivo | Acción |
|---|---|
| `src/features/gondolas/types.ts` | Crear |
| `src/features/gondolas/api.ts` | Crear |
| `src/features/gondolas/utils.ts` | Crear |
| `src/features/gondolas/GondolasManagerTab.tsx` | Crear |
| `src/features/gondolas/GondolaDetailModal.tsx` | Crear |
| `src/features/gondolas/GondolaFormModal.tsx` | Crear |
| `src/features/gondolas/CrearOrdenModal.tsx` | Crear |
| `src/features/gondolas/OrdenDetailModal.tsx` | Crear |
| `src/features/gondolas/GondolasEmpleadoTab.tsx` | Crear |
| `src/features/gondolas/GondolaRellenoPage.tsx` | Crear |
| `src/features/gondolas/EvidenciaUploader.tsx` | Crear |
| `src/features/tasks/TareasManagerPage.tsx` | Modificar — agregar tab Góndolas |
| `src/features/tasks/EmployeeTasksPage.tsx` | Modificar — agregar tab Góndolas |
| `src/routes.tsx` | Modificar — agregar ruta GondolaRellenoPage |
