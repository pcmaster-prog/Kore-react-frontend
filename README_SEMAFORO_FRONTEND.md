# Kore — Semáforo de Desempeño: Frontend

Stack: React 18 · TypeScript · Tailwind CSS · Vercel
Diseño: Stitch Design API Key `AQ.Ab8RN6LnA8DaNmkmXs5ZeyWsydeN8esTT3tkrPrZpICvP7WQOA`

**IMPORTANTE:** Usar el API key de Stitch para extraer los tokens exactos
de colores, tipografía y spacing antes de escribir cualquier CSS.

---

## Design Tokens (del diseño Stitch)

```
Background:      #F5F3EE
Primary dark:    #1E2D4A
Card bg:         #FFFFFF
Border:          #E8E6E0

Verde:           badge bg #dcfce7, text #166534, progress #22c55e
Amarillo:        badge bg #fef3c7, text #92400e, progress #f59e0b
Rojo:            badge bg #fee2e2, text #991b1b, progress #ef4444

Border radius cards:   24px
Border radius buttons: 999px
Border radius inputs:  12px

Heading: Bold, #1E2D4A
Body:    Regular, #374151
Muted:   #6B7280
Label:   11px uppercase letter-spacing 0.08em
```

---

## 1. Tipos TypeScript

**Crear `src/features/semaforo/types.ts`:**

```typescript
export type SemaforoColor = 'verde' | 'amarillo' | 'rojo' | null;

export type EvaluadorRol = 'admin' | 'supervisor';

export type Accion =
  | 'mantener_desempeno'
  | 'capacitacion'
  | 'llamada_atencion'
  | 'seguimiento_30_dias';

export type EmployeeEvaluation = {
  id: string;
  empleado_id: string;
  is_active: boolean;
  activated_at: string;
  deactivated_at?: string | null;
  evaluaciones_count: number;
  peer_evaluaciones_count: number;
  semaforo: SemaforoColor;
};

export type EmpleadoConEvaluacion = {
  empleado: {
    id: string;
    full_name: string;
    position_title?: string | null;
  };
  evaluation: EmployeeEvaluation | null;
};

export type EvaluacionCriterios = {
  puntualidad: number;
  responsabilidad: number;
  actitud_trabajo: number;
  orden_limpieza: number;
  atencion_cliente: number;
  trabajo_equipo: number;
  iniciativa: number;
  aprendizaje_adaptacion: number;
};

export type DesempenoEvaluacion = EvaluacionCriterios & {
  id: string;
  evaluador: { full_name: string; role: string };
  evaluador_rol: EvaluadorRol;
  total: number;
  porcentaje: number;
  acciones: Accion[];
  observaciones?: string | null;
  created_at: string;
};

export type PeerEvaluacion = {
  id: string;
  evaluador?: { full_name: string }; // solo visible para admin
  colaboracion: number;
  puntualidad: number;
  actitud: number;
  comunicacion: number;
  promedio: number;
  porcentaje: number;
};

export type ResultadoCompleto = {
  empleado: { id: string; full_name: string; position_title?: string | null };
  is_active: boolean;
  activated_at: string;
  deactivated_at?: string | null;
  final_score: number | null;
  semaforo: SemaforoColor;
  eval_score: number | null;
  peer_score: number | null;
  evaluaciones: DesempenoEvaluacion[];
  peer_evaluaciones: PeerEvaluacion[];
  peer_count: number;
};

export type CompaneroParaEvaluar = {
  empleado: { id: string; full_name: string; position_title?: string | null };
  evaluation_id: string;
  already_evaluated: boolean;
};
```

---

## 2. API Client

**Crear `src/features/semaforo/api.ts`:**

```typescript
import api from '@/lib/http';
import type {
  EmpleadoConEvaluacion, ResultadoCompleto,
  EvaluacionCriterios, Accion, CompaneroParaEvaluar
} from './types';

// ── Admin ──────────────────────────────────────────────────────────────────
export const listEmpleadosEvaluacion = () =>
  api.get('/semaforo/empleados').then(r => r.data as EmpleadoConEvaluacion[]);

export const activarEvaluacion = (empleadoId: string) =>
  api.post(`/semaforo/empleados/${empleadoId}/activar`).then(r => r.data);

export const desactivarEvaluacion = (empleadoId: string) =>
  api.post(`/semaforo/empleados/${empleadoId}/desactivar`).then(r => r.data);

export const getResultado = (empleadoId: string) =>
  api.get(`/semaforo/empleados/${empleadoId}/resultado`).then(r => r.data as ResultadoCompleto);

export const evaluarEmpleado = (data: EvaluacionCriterios & {
  empleado_id: string;
  acciones?: Accion[];
  observaciones?: string;
}) => api.post('/semaforo/evaluaciones', data).then(r => r.data);

// ── Supervisor ────────────────────────────────────────────────────────────
export const getPendientesSupervisor = () =>
  api.get('/semaforo/mis-evaluaciones-pendientes').then(r => r.data as EmpleadoConEvaluacion[]);

// ── Empleado ──────────────────────────────────────────────────────────────
export const getCompanerosParaEvaluar = () =>
  api.get('/semaforo/companeros').then(r => r.data as {
    companeros: CompaneroParaEvaluar[];
    progress: { evaluated: number; total: number };
  });

export const enviarPeerEvaluacion = (data: {
  employee_evaluation_id: string;
  evaluado_empleado_id: string;
  colaboracion: number;
  puntualidad: number;
  actitud: number;
  comunicacion: number;
}) => api.post('/semaforo/peer-evaluaciones', data).then(r => r.data);
```

---

## 3. Utilidades

**Crear `src/features/semaforo/utils.ts`:**

```typescript
import type { SemaforoColor, Accion } from './types';

export const SEMAFORO_CONFIG = {
  verde: {
    label: 'Verde',
    badgeBg: '#dcfce7',
    badgeText: '#166534',
    progressColor: '#22c55e',
    dot: '🟢',
    rango: '80 – 100%',
    descripcion: 'Empleado confiable. Buen desempeño.',
  },
  amarillo: {
    label: 'Amarillo',
    badgeBg: '#fef3c7',
    badgeText: '#92400e',
    progressColor: '#f59e0b',
    dot: '🟡',
    rango: '60 – 79%',
    descripcion: 'Empleado funcional pero con áreas de mejora.',
  },
  rojo: {
    label: 'Rojo',
    badgeBg: '#fee2e2',
    badgeText: '#991b1b',
    progressColor: '#ef4444',
    dot: '🔴',
    rango: '0 – 59%',
    descripcion: 'Requiere seguimiento o corrección.',
  },
};

export const CRITERIOS_ADMIN = [
  { key: 'puntualidad',           label: 'Puntualidad' },
  { key: 'responsabilidad',       label: 'Responsabilidad' },
  { key: 'actitud_trabajo',       label: 'Actitud de Trabajo' },
  { key: 'orden_limpieza',        label: 'Orden y Limpieza' },
  { key: 'atencion_cliente',      label: 'Atención al Cliente' },
  { key: 'trabajo_equipo',        label: 'Trabajo en Equipo' },
  { key: 'iniciativa',            label: 'Iniciativa' },
  { key: 'aprendizaje_adaptacion', label: 'Aprendizaje / Adaptación' },
] as const;

export const CRITERIOS_PEER = [
  { key: 'colaboracion', label: 'Colaboración',  icon: '🤝' },
  { key: 'puntualidad',  label: 'Puntualidad',   icon: '⏰' },
  { key: 'actitud',      label: 'Actitud',        icon: '😊' },
  { key: 'comunicacion', label: 'Comunicación',   icon: '💬' },
] as const;

export const ACCIONES_CONFIG: Record<Accion, { label: string; color: string }> = {
  mantener_desempeno:    { label: 'Mantener desempeño',    color: '#1E2D4A' },
  capacitacion:          { label: 'Capacitación',           color: '#3b82f6' },
  llamada_atencion:      { label: 'Llamada de atención',    color: '#f59e0b' },
  seguimiento_30_dias:   { label: 'Seguimiento en 30 días', color: '#8b5cf6' },
};

export function calcSemaforo(score: number | null): SemaforoColor {
  if (score === null) return null;
  if (score >= 80) return 'verde';
  if (score >= 60) return 'amarillo';
  return 'rojo';
}

export function initials(name: string): string {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}
```

---

## 4. Componente StarRating (reutilizable)

**Crear `src/features/semaforo/StarRating.tsx`:**

```tsx
// Props:
//   value: number (0-5)
//   onChange?: (value: number) => void
//   size?: 'sm' | 'md' | 'lg'  →  sm=16px, md=24px, lg=36px
//   readOnly?: boolean

// Comportamiento:
//   - Hover: resalta las estrellas hasta el hover
//   - Click: fija el valor
//   - ReadOnly: sin hover ni click
//   - Filled color: #1E2D4A
//   - Empty color: #D1D5DB
//   - Mobile: padding mínimo para 44px de tap target
//   - Transición suave en hover (200ms)
```

---

## 5. Componente SemaforoBadge (reutilizable)

**Crear `src/features/semaforo/SemaforoBadge.tsx`:**

```tsx
// Props:
//   status: SemaforoColor
//   showDot?: boolean
//   size?: 'sm' | 'md'

// Render:
//   <span style={{ background: badgeBg, color: badgeText }}
//         className="rounded-full border px-2.5 py-1 text-xs font-medium">
//     {showDot && <span className="dot" />}
//     {label}
//   </span>

// Si status es null: mostrar "Sin evaluar" en gris neutro
```

---

## 6. Pantallas Admin

### 6a. Tab "Semáforo" en ConfiguracionPage

**Modificar `src/features/configuracion/ConfiguracionPage.tsx`:**

Agregar tab al array TABS:
```tsx
{ key: "semaforo", label: "Semáforo", icon: <Activity className="h-4 w-4" /> }
// Agregar en el render:
{tab === "semaforo" && <SemaforoAdminTab />}
```

---

### 6b. `SemaforoAdminTab` — Vista principal admin

**Crear `src/features/semaforo/SemaforoAdminTab.tsx`:**

**Layout (desktop):**

```
Header:
  - Título "Semáforo de Desempeño" Bold 24px #1E2D4A
  - Subtítulo "Evaluaciones de empleados nuevos"

Sección "En evaluación activa":
  - Label "EN EVALUACIÓN ACTIVA" — 11px uppercase gris
  - Grid de cards de empleados con evaluación activa
  - Cada card:
    - Avatar 44px + nombre + puesto
    - Badge semáforo (si ya hay score)
    - "X eval. recibidas" — gris
    - Botones:
      - "Evaluar" (si el admin no ha evaluado aún) → abre EvaluacionFormModal
      - "Ver resultado" → abre ResultadoModal
      - "Desactivar" (botón rojo outline) → confirmar y desactivar

Sección "Todos los empleados":
  - Label "EMPLEADOS SIN EVALUACIÓN ACTIVA"
  - Lista de empleados restantes
  - Cada fila: avatar + nombre + puesto + botón "Activar evaluación" (pill outline)
  - Al activar: el empleado pasa a la sección de arriba
```

---

### 6c. `EvaluacionFormModal` — Formulario de evaluación (admin/supervisor)

**Crear `src/features/semaforo/EvaluacionFormModal.tsx`:**

```
Modal centrado, max-width 560px, rounded-[24px]
Background blanco, shadow suave

Header:
  - Avatar 48px (initials, bg #1E2D4A text blanco)
  - Nombre empleado Bold 22px
  - Cargo 12px uppercase gris
  - Badge "EVALUACIÓN DE DESEMPEÑO" pill #1E2D4A

Cuerpo (scrollable si necesario):

  Label sección: "CRITERIOS DE EVALUACIÓN" 11px uppercase gris

  8 filas de criterios:
    [Nombre criterio]     [★★★★☆]    [4/5]
    Separados por línea sutil #F0EFE8
    Padding vertical 14px

  Card de score (se actualiza en tiempo real):
    Fondo #F9F8F5, rounded-[16px]
    Left: "PUNTAJE TOTAL" label + "32 / 40" bold 28px
    Right: badge semáforo dinámico
    Progress bar debajo con color del semáforo

  Acciones (pill toggles multi-select):
    ● Mantener desempeño  → activo: bg #1E2D4A
    ● Capacitación         → activo: bg #3b82f6
    ● Llamada de atención  → activo: bg #f59e0b
    ● Seguimiento 30 días  → activo: bg #8b5cf6
    Inactivo: bg #F3F4F6, text #374151

  Textarea observaciones:
    Placeholder: "Observaciones adicionales..."
    Border 1px #E5E7EB, radius 12px

Footer:
  "Cancelar" outline + "Guardar Evaluación" filled #1E2D4A pill 48px
```

**Lógica del score en tiempo real:**
```tsx
// Al cambiar cualquier estrella, recalcular inmediatamente:
const total = Object.values(criterios).reduce((a, b) => a + b, 0); // max 40
const porcentaje = (total / 40) * 100;
const semaforo = calcSemaforo(porcentaje);
```

---

### 6d. `ResultadoModal` — Ver resultado completo (solo admin)

**Crear `src/features/semaforo/ResultadoModal.tsx`:**

```
Modal grande, max-width 680px

Header:
  - Avatar + nombre + puesto
  - Badge semáforo grande
  - Score final: "87.5%" Bold 32px

Sección scores:
  - Dos cards side by side:
    Card 1: "Evaluaciones (Admin/Supervisor)" → eval_score%
    Card 2: "Evaluaciones compañeros" → peer_score%
  - Fórmula visible: "(70% × eval) + (30% × peers)"

Sección "Evaluaciones recibidas":
  Por cada evaluación (admin o supervisor):
    - Evaluador: nombre + rol badge
    - Fecha
    - 8 criterios con sus estrellas (readonly) + total
    - Acciones tomadas como pills
    - Observaciones

Sección "Opinión de compañeros":
  - "X compañeros evaluaron" 
  - Promedio de cada criterio (colaboración, puntualidad, actitud, comunicación)
  - Lista de evaluaciones con nombre del evaluador (admin ve quién evaluó)

Si is_active = true:
  - Botón "Desactivar evaluación" rojo al pie
```

---

## 7. Pantallas Supervisor

### `SemaforoSupervisorSection`

**Crear `src/features/semaforo/SemaforoSupervisorSection.tsx`:**

El supervisor ve en su dashboard o en una sección dedicada:
- Lista de empleados pendientes de su evaluación
- Mismo formulario `EvaluacionFormModal` (reutilizar)
- NO ve el resultado final completo
- NO puede activar/desactivar

**Dónde integrarlo:**
Agregar link "Evaluaciones pendientes" en el sidebar del supervisor
o una sección en `ManagerDashboard.tsx` si hay pendientes.

---

## 8. Pantallas Empleado

### 8a. Tab "Evaluar" en `EmployeeTasksPage`

**Modificar `src/features/tasks/EmployeeTasksPage.tsx`:**

Agregar tab "Evaluar" junto a los existentes:
```tsx
{ key: "evaluar", label: "Evaluar", icon: <Star className="h-4 w-4" /> }
{tab === "evaluar" && <SemaforoEmpleadoTab />}
```

Solo mostrar el tab si hay compañeros para evaluar (llamar API al montar).

---

### 8b. `SemaforoEmpleadoTab` — Lista de compañeros a evaluar

**Crear `src/features/semaforo/SemaforoEmpleadoTab.tsx`:**

**Diseño mobile-first (390px):**

```
Header:
  "Evaluar Compañeros" Bold 20px centrado
  "ANÓNIMO" badge pequeño

Info banner azul suave:
  ℹ️ "Tu evaluación es completamente anónima."

Label: "Compañeros en evaluación"

Lista de cards por compañero:
  Card bg blanco, rounded-[16px], border #F0EFE8

  [Avatar 44px] [Nombre bold] [Cargo 12px gris]
  Right:
    Si pendiente: botón "Evaluar →" outline dashed #1E2D4A
    Si evaluado:  "✅ Evaluado" verde, no clickeable

Sticky bottom bar bg #1E2D4A:
  "Progreso: X de Y compañeros"
  Progress bar verde

Si no hay compañeros para evaluar:
  Empty state: "No hay compañeros en evaluación activa en este momento."
```

---

### 8c. `PeerEvaluacionModal` — Formulario peer evaluation (mobile)

**Crear `src/features/semaforo/PeerEvaluacionModal.tsx`:**

```
Full-screen modal o bottom sheet en mobile

Header:
  ← back
  Badge "👁 TU EVALUACIÓN ES ANÓNIMA"

Perfil evaluado (centrado):
  Avatar 72px
  Nombre Bold 24px
  "EVALUACIÓN DE COMPAÑERO" label gris

4 criterios (cards individuales):
  Cada card: bg blanco, rounded-[20px], shadow suave
  [Icono 24px] [Nombre criterio Bold 16px]
  [★★★★★ grandes 36px, min tap 44px]
  Fondo verde suave si > 0

CTA sticky bottom:
  "Enviar Evaluación ►"
  bg #1E2D4A, height 56px, pill, full width
  Disabled si no completó las 4 estrellas (opacity 0.5)

Al enviar:
  Toast "✅ Evaluación enviada"
  Si evaluó a TODOS: toast especial con 🎉
  Actualizar lista sin refetch
```

---

## 9. Integración en AppShell

**Modificar `src/layout/AppShell.tsx`:**

Para el supervisor, agregar link en el sidebar si tiene evaluaciones pendientes:

```tsx
// En el grupo EQUIPO del supervisor:
{pendingEvaluations > 0 && (
  <SidebarLink
    to="/app/manager/semaforo"
    label={`Evaluaciones (${pendingEvaluations})`}
    icon={<Activity className="h-4 w-4" />}
    onClick={onNav}
  />
)}
```

---

## 10. Ruta nueva (opcional — si el supervisor necesita página dedicada)

**Modificar `src/routes.tsx`:**

```tsx
import SemaforoSupervisorPage from "@/features/semaforo/SemaforoSupervisorPage";

{
  path: "manager/semaforo",
  element: (
    <RequireRole allow={["admin", "supervisor"]}>
      <SemaforoSupervisorPage />
    </RequireRole>
  ),
}
```

---

## 11. Estados de UI requeridos

```
Loading:  Skeleton cards (no spinners en listas)
Empty:    Mensaje amigable + ícono/ilustración
Error:    Toast rojo top-right, 4s auto-dismiss
Success:  Toast verde "✅ ..."
```

---

## 12. Resumen de archivos a crear/modificar

| Archivo | Acción |
|---|---|
| `src/features/semaforo/types.ts` | Crear |
| `src/features/semaforo/api.ts` | Crear |
| `src/features/semaforo/utils.ts` | Crear |
| `src/features/semaforo/StarRating.tsx` | Crear |
| `src/features/semaforo/SemaforoBadge.tsx` | Crear |
| `src/features/semaforo/SemaforoAdminTab.tsx` | Crear |
| `src/features/semaforo/EvaluacionFormModal.tsx` | Crear |
| `src/features/semaforo/ResultadoModal.tsx` | Crear |
| `src/features/semaforo/SemaforoSupervisorSection.tsx` | Crear |
| `src/features/semaforo/SemaforoEmpleadoTab.tsx` | Crear |
| `src/features/semaforo/PeerEvaluacionModal.tsx` | Crear |
| `src/features/configuracion/ConfiguracionPage.tsx` | Modificar — agregar tab Semáforo |
| `src/features/tasks/EmployeeTasksPage.tsx` | Modificar — agregar tab Evaluar |
| `src/layout/AppShell.tsx` | Modificar — link supervisor si hay pendientes |
| `src/routes.tsx` | Modificar — ruta supervisor semáforo |
