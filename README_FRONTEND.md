# Kore Frontend — Cambios Pendientes (Frontend)

Stack: React 18 · TypeScript · Tailwind CSS · React Router v6 · Vite · Vercel (producción)

---

## 1. Eliminar Empleado

**Contexto:** En `EmpleadosPage.tsx` el modal de acciones solo tiene `Editar` y `Activar/Desactivar`. Se necesita agregar un botón de borrado con modal de confirmación.

### Cambios en `src/features/employees/EmpleadosPage.tsx`

**Agregar botón en la tabla:**
```tsx
<button
  onClick={() => setDeleteTarget(user)}
  className="rounded-xl border border-red-200 text-red-600 px-3 py-1.5 text-xs font-medium hover:bg-red-50 transition"
>
  Eliminar
</button>
```

**Nuevo modal de confirmación de borrado:**
- Mostrar nombre del empleado
- Advertencia: "Esta acción es permanente. Se eliminarán todos sus registros de asistencia, tareas y evidencias."
- Dos botones: `Cancelar` y `Eliminar permanentemente` (rojo)

**Nuevo estado:**
```tsx
const [deleteTarget, setDeleteTarget] = useState<UserItem | null>(null);
const [deleting, setDeleting] = useState(false);
```

**Función de borrado:**
```tsx
async function confirmDelete() {
  if (!deleteTarget) return;
  setDeleting(true);
  try {
    await deleteUser(deleteTarget.id); // llamada a api.ts
    setUsers(prev => prev.filter(u => u.id !== deleteTarget.id));
    showToast("ok", "Empleado eliminado permanentemente");
    setDeleteTarget(null);
  } catch (e: any) {
    showToast("err", e?.response?.data?.message ?? "Error al eliminar");
  } finally {
    setDeleting(false);
  }
}
```

### Cambios en `src/features/employees/api.ts`

Agregar función:
```ts
export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/usuarios/${id}`);
}
```

---

## 2. Registro de Empresa y Módulos

### 2a. Página de registro público

**Ruta nueva:** `/register`
**Archivo nuevo:** `src/features/auth/RegisterPage.tsx`

**Flujo en 3 pasos (wizard):**

**Paso 1 — Datos de la empresa:**
- Nombre de la empresa (required)
- Industria (select: Retail, Restaurante, Manufactura, Servicios, Otro)
- Rango de empleados (select: 1-10, 11-50, 51-200, 200+)

**Paso 2 — Módulos a activar:**
- Cards seleccionables con toggle:
  - ✅ Tareas — Asigna y supervisa tareas con evidencias
  - ✅ Asistencia — Control de entrada/salida del equipo
  - ✅ Nómina — Calcula y aprueba el pago semanal
  - ✅ Configuración — Siempre activo, no desmarcable
- Al menos 1 módulo debe estar seleccionado

**Paso 3 — Cuenta de administrador:**
- Nombre completo
- Correo electrónico
- Contraseña (mínimo 6 caracteres)
- Confirmar contraseña

Al enviar → `POST /api/register` → guardar token en store → redirigir a `/app/manager/dashboard`

**Agregar en `routes.tsx`:**
```tsx
{ path: "/register", element: <RegisterPage /> }
```

**Agregar link en `LoginPage.tsx`:**
```tsx
<Link to="/register">¿No tienes cuenta? Regístrate</Link>
```

### 2b. Configuración de módulos (dentro de la app)

**Archivo a modificar:** `src/features/configuracion/ConfiguracionPage.tsx`

Agregar nueva tab `Módulos` que:
- Lista los módulos disponibles con un toggle switch por cada uno
- Llama a `POST /api/v1/empresa/modulos` al cambiar
- Muestra badge "Activo" / "Inactivo"
- El módulo `Configuración` no tiene toggle (siempre activo)

**Efecto en AppShell:** Los links del sidebar deben respetar los módulos activos. Hacer un `GET /api/v1/empresa/modulos` al iniciar sesión y guardar en el store de auth. Si `nomina` está desactivado, ocultar el link de Nómina, etc.

---

## 3. Restricción de Asistencia por Red WiFi

### 3a. Manejo del error en el frontend

Cuando el backend devuelve `403` con `code: "NETWORK_RESTRICTED"`, mostrar un mensaje claro:

**En `EmployeeAttendancePage.tsx`**, en el catch de cada acción (checkIn, checkOut, etc.):
```tsx
if (e?.response?.status === 403 && e?.response?.data?.code === 'NETWORK_RESTRICTED') {
  setErr("⚠️ Solo puedes marcar asistencia desde la red de la tienda. Conéctate al WiFi del local.");
} else {
  setErr(e?.response?.data?.message ?? "Error al registrar asistencia");
}
```

Mostrar este error con un estilo llamativo (border amber, ícono de WiFi).

### 3b. Configuración de IP en admin

**En `ConfiguracionPage.tsx`**, agregar campo en la tab de `General` o nueva tab `Red`:
- Input de texto: "IP o rango permitido (CIDR)"
- Placeholder: `Ej. 192.168.1.0/24 o 201.175.42.10`
- Botón guardar
- Nota informativa: "Deja vacío para permitir el acceso desde cualquier red"
- Botón "¿Cuál es mi IP actual?" → hace `GET https://api.ipify.org?format=json` y rellena el campo

---

## 4. Supervisor y Admin pueden Marcar Asistencia

**Contexto:** La `EmployeeAttendancePage` está detrás de `RequireRole allow={["empleado"]}`. Supervisores y admins no pueden acceder.

### 4a. Cambios en `routes.tsx`

```tsx
// ❌ ANTES:
{
  path: "employee/asistencia",
  element: (
    <RequireRole allow={["empleado"]}>
      <EmployeeAttendancePage />
    </RequireRole>
  ),
},

// ✅ DESPUÉS — todos los roles pueden marcar su propia asistencia:
{
  path: "employee/asistencia",
  element: (
    <RequireAuth>
      <EmployeeAttendancePage />
    </RequireAuth>
  ),
},
```

### 4b. Cambios en `AppShell.tsx`

Agregar el link de Asistencia en la sección del manager:

```tsx
// En el bloque de manager (admin + supervisor), agregar bajo "Equipo":
<SidebarLink 
  to="/app/employee/asistencia" 
  label="Mi Asistencia" 
  icon={<Clock className="h-4 w-4" />} 
  onClick={onNav} 
/>
```

O bien mover `EmployeeAttendancePage` a una ruta compartida como `/app/mi-asistencia`.

### 4c. Verificar en `EmployeeAttendancePage.tsx`

Asegurarse de que no haya hardcoded checks de `role === 'empleado'` que bloqueen la UI para otros roles.

---

## 5. Evidencias en Producción — Cloudflare R2

**Contexto:** Las URLs de evidencias apuntan a `railway.app/.../storage/...` que no existen en producción porque Railway no tiene sistema de archivos persistente.

### 5a. No hay cambios de código en frontend

El frontend ya consume la URL que devuelve el backend en el campo `url` de la evidencia. Una vez que el backend esté configurado con R2, las URLs nuevas serán del tipo:

```
https://pub-xxxx.r2.dev/kore/{empresa_id}/evidences/2026/03/01/archivo.jpg
```

o con custom domain:
```
https://storage.tudominio.com/kore/{empresa_id}/evidences/...
```

### 5b. Variable de entorno en Vercel (si aplica)

Si en algún componente se construye la URL manualmente (no recomendado), agregar en Vercel:
```
VITE_STORAGE_URL=https://tu-dominio-r2.com
```

### 5c. Verificar componente visor de evidencias

En el componente que muestra imágenes de evidencias (probablemente en `EmployeeTasksPage.tsx` o un componente `EvidenceViewer`):

- Asegurarse de usar el campo `url` que devuelve la API, no construir la URL manualmente
- Agregar manejo de error de imagen:
```tsx
<img 
  src={evidence.url} 
  alt={evidence.original_name}
  onError={(e) => {
    (e.target as HTMLImageElement).src = '/placeholder-image.png';
  }}
/>
```
- Mostrar un estado de loading mientras carga la imagen

---

## 6. Día de Descanso — Marcado desde la App

**Contexto:** Los empleados con pago `por día` tienen derecho a 1 día de descanso pagado por semana. Actualmente no hay UI para marcarlo — se hacía manualmente con SQL. Se necesita que el empleado lo marque desde `EmployeeAttendancePage`.

### 6a. Cambios en `EmployeeAttendancePage.tsx`

**Lógica de visibilidad del botón:**
- Solo mostrar el botón "Es mi día de descanso" si:
  - El empleado tiene `payment_type === 'daily'` (dato que viene del estado del día o del perfil)
  - No ha marcado entrada hoy (`status !== 'checked_in'` y sin `first_check_in`)
  - No ha usado su descanso esta semana (`rest_used_this_week === false`, dato del endpoint de estado)
  - El día actual no es ya un descanso (`status !== 'rest_day'`)

**UI cuando el día es descanso:**
Cuando `status === 'rest_day'`, mostrar una card especial en lugar de los botones de entrada:

```tsx
// Estado visual del día de descanso
<div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-center">
  <div className="text-4xl mb-2">🛋️</div>
  <div className="font-semibold text-emerald-800">Día de descanso</div>
  <div className="text-sm text-emerald-600 mt-1">Este día cuenta como pagado en tu nómina</div>
  {/* Botón cancelar solo si la nómina no está aprobada */}
  <button onClick={cancelRestDay} className="mt-3 text-xs text-emerald-700 underline">
    Cancelar descanso
  </button>
</div>
```

**Botón en estado inicial (sin entrada, empleado daily):**
```tsx
<button
  onClick={markRestDay}
  className="w-full rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50 py-4 text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition"
>
  🛋️ Marcar como día de descanso
  <div className="text-xs text-emerald-500 mt-0.5 font-normal">Cuenta como día pagado en nómina</div>
</button>
```

**Funciones a agregar:**
```tsx
async function markRestDay() {
  try {
    await api.post('/asistencia/descanso', { date: today });
    // refrescar estado del día
    await loadStatus();
    showToast("ok", "Día de descanso registrado ✓");
  } catch (e: any) {
    if (e?.response?.data?.code === 'REST_ALREADY_USED') {
      setErr("Ya tienes un día de descanso registrado esta semana.");
    } else {
      setErr(e?.response?.data?.message ?? "Error al registrar descanso");
    }
  }
}

async function cancelRestDay() {
  try {
    await api.delete(`/asistencia/descanso/${today}`);
    await loadStatus();
    showToast("ok", "Descanso cancelado");
  } catch (e: any) {
    setErr(e?.response?.data?.message ?? "No se pudo cancelar");
  }
}
```

### 6b. Cambios en el endpoint de estado

El `GET /api/v1/asistencia/estado` devolverá campos nuevos. Actualizar el tipo en el frontend:

```ts
type AttendanceStatus = {
  // campos existentes...
  status: 'idle' | 'checked_in' | 'on_break' | 'checked_out' | 'rest_day';
  can_mark_rest: boolean;       // true si es daily y puede marcar descanso hoy
  rest_used_this_week: boolean; // true si ya usó su descanso esta semana
  is_paid_rest?: boolean;       // true si el descanso de hoy es pagado
};
```

### 6c. Indicador en el Manager

En `ManagerAttendancePage.tsx`, en la lista de empleados del día, mostrar un badge especial para los que tienen descanso:

```tsx
// En la columna de estado del empleado:
{emp.status === 'rest_day' && (
  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
    🛋️ Descanso
  </span>
)}
```

---

## Resumen de archivos a crear/modificar

| Archivo | Acción |
|---|---|
| `src/features/auth/RegisterPage.tsx` | Crear — wizard de registro en 3 pasos |
| `src/features/employees/EmpleadosPage.tsx` | Agregar botón y modal de eliminar |
| `src/features/employees/api.ts` | Agregar función `deleteUser()` |
| `src/features/configuracion/ConfiguracionPage.tsx` | Agregar tabs de Módulos y Red/IP |
| `src/features/attendance/EmployeeAttendancePage.tsx` | Manejo error NETWORK_RESTRICTED + botón descanso + estado rest_day |
| `src/features/attendance/ManagerAttendancePage.tsx` | Badge de descanso en lista de empleados |
| `src/layout/AppShell.tsx` | Agregar "Mi Asistencia" para admin/supervisor, respetar módulos activos |
| `src/routes.tsx` | Agregar `/register`, cambiar guard de asistencia |
| `src/features/auth/store.ts` | Guardar módulos activos de la empresa en el store |

---

## Notas generales

- El design system es consistente: `rounded-3xl` para cards, `rounded-2xl` para inputs/botones, `bg-neutral-900` para acciones primarias
- Todos los modales tienen backdrop blur y cierre al hacer click fuera
- Los toasts desaparecen a los 3.5 segundos
- Los errores de API se muestran con `bg-rose-50 border-rose-200 text-rose-700`
- Los éxitos con `bg-emerald-50 border-emerald-200 text-emerald-800`
