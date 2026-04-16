# Kore — Asignación de Tareas a Supervisores + Góndolas Integradas + Responsividad

Stack: Laravel 11 · React 18 · TypeScript · Tailwind CSS

---

## Resumen de cambios

1. Los admins pueden asignar tareas a supervisores
2. Reglas de jerarquía en asignación de tareas
3. Notificación al supervisor cuando se le asigna una tarea
4. Órdenes de góndola aparecen en el panel principal del empleado/supervisor
5. Empleado/supervisor puede iniciar un relleno de góndola por iniciativa propia
6. Notificación al admin/supervisor cuando alguien inicia un relleno por cuenta propia
7. Revisión y corrección de responsividad móvil

---

## PARTE 1 — Reglas de jerarquía en asignación de tareas

### Reglas exactas:

| Quien asigna | Puede asignar a |
|---|---|
| Admin | Empleados, Supervisores (NO a otros admins, NO a sí mismo) |
| Supervisor | Solo Empleados (NO a otros supervisores, NO a admins, NO a sí mismo) |

### 1a. Fix en `TasksController.php` — método `assign()`

```php
public function assign(Request $request, string $id)
{
    $u = $request->user();
    if (!in_array($u->role, ['admin', 'supervisor'])) {
        return response()->json(['message' => 'No autorizado'], 403);
    }

    $data = $request->validate([
        'empleado_ids' => ['required', 'array', 'min:1'],
        'empleado_ids.*' => ['uuid'],
    ]);

    $task = Task::where('empresa_id', $u->empresa_id)
        ->where('id', $id)
        ->first();
    if (!$task) return response()->json(['message' => 'Tarea no encontrada'], 404);

    // Obtener los usuarios vinculados a estos empleados
    $empleados = Empleado::where('empresa_id', $u->empresa_id)
        ->whereIn('id', $data['empleado_ids'])
        ->with('user')
        ->get();

    if ($empleados->count() !== count($data['empleado_ids'])) {
        return response()->json(['message' => 'Uno o más empleados no pertenecen a esta empresa'], 422);
    }

    // Validar jerarquía por cada empleado a asignar
    foreach ($empleados as $emp) {
        $targetRole = $emp->user?->role ?? 'empleado';

        // Nadie puede asignarse a sí mismo
        if ($emp->user_id === $u->id) {
            return response()->json([
                'message' => 'No puedes asignarte una tarea a ti mismo'
            ], 422);
        }

        // Supervisor no puede asignar a otros supervisores ni admins
        if ($u->role === 'supervisor' && in_array($targetRole, ['supervisor', 'admin'])) {
            return response()->json([
                'message' => "Un supervisor solo puede asignar tareas a empleados. " .
                             "{$emp->full_name} es {$targetRole}."
            ], 422);
        }

        // Admin no puede asignar a otros admins
        if ($u->role === 'admin' && $targetRole === 'admin') {
            return response()->json([
                'message' => "No puedes asignar tareas a otros administradores."
            ], 422);
        }
    }

    // Asignar
    DB::transaction(function () use ($u, $task, $empleados) {
        foreach ($empleados as $emp) {
            TaskAssignee::firstOrCreate(
                ['empresa_id' => $u->empresa_id, 'task_id' => $task->id, 'empleado_id' => $emp->id],
                ['status' => 'assigned']
            );

            // Notificar al asignado
            if ($emp->user_id) {
                app(\App\Services\NotificationService::class)->sendToUser(
                    userId: $emp->user_id,
                    title: '📋 Nueva tarea asignada',
                    body: "Se te asignó: {$task->title}",
                    data: [
                        'type'    => 'task.assigned',
                        'task_id' => $task->id,
                    ]
                );
            }
        }
    });

    if ($task->status === 'open') {
        $task->status = 'in_progress';
        $task->save();
    }

    return response()->json(['message' => 'Asignación OK']);
}
```

### 1b. Fix en el endpoint de listar empleados asignables

Agregar endpoint que devuelva solo empleados que el usuario puede asignar:

```php
// GET /tareas/empleados-asignables
public function empleadosAsignables(Request $request)
{
    $u = $request->user();
    if (!in_array($u->role, ['admin', 'supervisor'])) {
        return response()->json(['message' => 'No autorizado'], 403);
    }

    $query = Empleado::where('empresa_id', $u->empresa_id)
        ->where('status', 'active')
        ->with('user')
        ->whereHas('user'); // Solo empleados vinculados a un usuario

    if ($u->role === 'supervisor') {
        // Supervisor solo ve empleados
        $query->whereHas('user', fn($q) => $q->where('role', 'empleado'));
    } else {
        // Admin ve empleados y supervisores, pero NO otros admins NI a sí mismo
        $query->whereHas('user', fn($q) =>
            $q->whereIn('role', ['empleado', 'supervisor'])
              ->where('id', '!=', $u->id)
        );
    }

    $empleados = $query->get()->map(fn($emp) => [
        'id'             => $emp->id,
        'full_name'      => $emp->full_name,
        'position_title' => $emp->position_title,
        'role'           => $emp->user?->role,
        'avatar_url'     => $emp->user?->avatar_url,
    ]);

    return response()->json(['data' => $empleados]);
}
```

**Ruta:**
```php
Route::get('/tareas/empleados-asignables', [TasksController::class, 'empleadosAsignables']);
```

---

## PARTE 2 — Órdenes de góndola en el panel principal

### Problema actual
Las órdenes de relleno de góndola están enterradas en:
`Tareas → tab Góndolas → tab Mis órdenes`

### Solución
Mostrar las órdenes de góndola pendientes **directamente en el panel
principal de tareas** del empleado y supervisor, igual que las tareas normales.

### 2a. Backend — incluir órdenes de góndola en `myTasks` o crear endpoint combinado

**Modificar `GET /mis-tareas/asignaciones`** para incluir también las
órdenes de góndola activas, O crear un nuevo endpoint:

```php
// GET /mi-panel — combina tareas + góndolas para el empleado
public function miPanel(Request $request)
{
    [$u, $empresaId, $emp] = $this->authEmployee($request);

    // Tareas normales asignadas
    $tareas = TaskAssignee::where('empresa_id', $empresaId)
        ->where('empleado_id', $emp->id)
        ->whereIn('status', ['assigned', 'in_progress', 'rejected'])
        ->with('task')
        ->orderByDesc('created_at')
        ->limit(10)
        ->get()
        ->map(fn($a) => [
            'type'       => 'tarea',
            'id'         => $a->id,
            'title'      => $a->task?->title,
            'status'     => $a->status,
            'priority'   => $a->task?->priority,
            'created_at' => $a->created_at?->toISOString(),
        ]);

    // Órdenes de góndola activas
    $gondolas = \App\Models\GondolaOrden::where('empresa_id', $empresaId)
        ->where('empleado_id', $emp->id)
        ->whereIn('status', ['pendiente', 'en_proceso', 'rechazado'])
        ->with('gondola')
        ->orderByDesc('created_at')
        ->limit(10)
        ->get()
        ->map(fn($o) => [
            'type'       => 'gondola',
            'id'         => $o->id,
            'title'      => "Rellenar: {$o->gondola?->nombre}",
            'status'     => $o->status,
            'priority'   => 'medium',
            'created_at' => $o->created_at?->toISOString(),
        ]);

    // Combinar y ordenar por fecha
    $items = $tareas->concat($gondolas)
        ->sortByDesc('created_at')
        ->values();

    return response()->json(['data' => $items]);
}
```

**Ruta:**
```php
Route::get('/mi-panel', [TasksController::class, 'miPanel']);
// O agregar la lógica directamente en /mis-tareas/asignaciones
```

### 2b. Frontend — mostrar en el panel del empleado

**En `EmployeeTasksPage.tsx` o `EmployeeDashboard.tsx`:**

Al cargar la pantalla principal del empleado, mostrar una sección
"Pendiente ahora" que combina tareas y órdenes de góndola:

```tsx
// Cada item del panel tiene type: 'tarea' | 'gondola'
// Si es 'gondola': al tocar va a la pantalla GondolaRellenoPage
// Si es 'tarea': va al detalle de la tarea

{item.type === 'gondola' ? (
  <div className="flex items-center gap-2">
    <span className="text-xl">🛒</span>
    <span className="text-xs font-bold text-amber-600 uppercase">Góndola</span>
  </div>
) : (
  <div className="flex items-center gap-2">
    <span className="text-xl">📋</span>
    <span className="text-xs font-bold text-blue-600 uppercase">Tarea</span>
  </div>
)}
```

---

## PARTE 3 — Empleado inicia relleno de góndola por iniciativa propia

### Concepto
El empleado ve que una góndola necesita relleno y sin esperar una
orden, puede iniciarla él mismo desde su panel.

### 3a. Backend — endpoint de auto-asignación de góndola

```php
// POST /gondolas/{gondolaId}/auto-rellenar
public function autoRellenar(Request $request, string $gondolaId)
{
    $u = $request->user();

    // Empleados Y supervisores pueden auto-asignarse
    $emp = Empleado::where('empresa_id', $u->empresa_id)
        ->where('user_id', $u->id)
        ->first();

    if (!$emp) {
        return response()->json(['message' => 'Empleado no vinculado'], 404);
    }

    $gondola = \App\Models\Gondola::where('empresa_id', $u->empresa_id)
        ->where('id', $gondolaId)
        ->where('activo', true)
        ->firstOrFail();

    // Verificar que no haya ya una orden activa de este empleado para esta góndola
    $existing = \App\Models\GondolaOrden::where('empresa_id', $u->empresa_id)
        ->where('gondola_id', $gondolaId)
        ->where('empleado_id', $emp->id)
        ->whereIn('status', ['pendiente', 'en_proceso'])
        ->first();

    if ($existing) {
        return response()->json([
            'message' => 'Ya tienes una orden activa para esta góndola',
            'orden_id' => $existing->id,
        ], 409);
    }

    // Crear la orden
    $orden = \App\Models\GondolaOrden::create([
        'empresa_id'  => $u->empresa_id,
        'gondola_id'  => $gondolaId,
        'empleado_id' => $emp->id,
        'status'      => 'en_proceso', // Inicia directamente en proceso
        'notas_empleado' => 'Iniciado por iniciativa propia',
    ]);

    // Copiar snapshot de productos
    foreach ($gondola->productos as $producto) {
        \App\Models\GondolaOrdenItem::create([
            'empresa_id'          => $u->empresa_id,
            'orden_id'            => $orden->id,
            'gondola_producto_id' => $producto->id,
            'clave'               => $producto->clave,
            'nombre'              => $producto->nombre,
            'unidad'              => $producto->unidad,
            'cantidad'            => null,
        ]);
    }

    // Notificar a admin y supervisores
    app(\App\Services\NotificationService::class)->sendToManagers(
        empresaId: $u->empresa_id,
        title: '🛒 Relleno iniciado por iniciativa',
        body: "{$emp->full_name} inició el relleno de {$gondola->nombre}",
        data: [
            'type'      => 'gondola.auto_started',
            'orden_id'  => $orden->id,
            'gondola'   => $gondola->nombre,
            'empleado'  => $emp->full_name,
        ]
    );

    return response()->json([
        'message'  => 'Relleno iniciado',
        'orden_id' => $orden->id,
    ], 201);
}
```

**Ruta:**
```php
Route::post('/gondolas/{gondolaId}/auto-rellenar',
    [GondolaOrdenesController::class, 'autoRellenar']);
```

### 3b. Frontend — pantalla de selección de góndola

**En `GondolasEmpleadoTab.tsx` agregar sección "Rellenar por iniciativa":**

```tsx
// Sección nueva al final de la pantalla del empleado:
// "¿Ves algo que necesita relleno?"
// Lista de todas las góndolas activas de la empresa
// Al tocar una → confirmación → inicia el relleno
// Navega automáticamente a GondolaRellenoPage con la nueva orden

<div className="mt-6">
  <div className="text-xs font-bold text-neutral-400 uppercase tracking-wide mb-3">
    ¿Ves algo que necesita relleno?
  </div>
  <div className="space-y-2">
    {gondolasDisponibles.map(g => (
      <button
        key={g.id}
        onClick={() => handleAutoRellenar(g.id, g.nombre)}
        className="w-full flex items-center gap-3 p-3 rounded-2xl border border-dashed border-neutral-200 hover:border-[#313852] hover:bg-neutral-50 transition text-left"
      >
        <span className="text-xl">🛒</span>
        <div>
          <div className="text-sm font-bold text-[#313852]">{g.nombre}</div>
          <div className="text-xs text-neutral-400">
            {g.productos_count} productos · {g.ubicacion ?? 'Sin ubicación'}
          </div>
        </div>
        <div className="ml-auto text-xs font-bold text-[#313852]">
          Iniciar →
        </div>
      </button>
    ))}
  </div>
</div>
```

**Función `handleAutoRellenar`:**

```tsx
async function handleAutoRellenar(gondolaId: string, gondolaNombre: string) {
  if (!confirm(`¿Iniciar relleno de ${gondolaNombre}?`)) return;
  try {
    const res = await api.post(`/gondolas/${gondolaId}/auto-rellenar`);
    navigate(`/app/employee/gondola-relleno/${res.data.orden_id}`);
  } catch (e: any) {
    // Si ya hay una orden activa, navegar a ella
    if (e?.response?.status === 409) {
      navigate(`/app/employee/gondola-relleno/${e.response.data.orden_id}`);
    } else {
      alert(e?.response?.data?.message ?? 'Error al iniciar relleno');
    }
  }
}
```

---

## PARTE 4 — Revisión de responsividad móvil

Revisar y corregir los siguientes componentes en pantallas de 375px-430px
(iPhone 13/14/15 y Android típicos):

### Pantallas a revisar:

**1. `EmployeeTasksPage.tsx`**
- Los tabs deben ser scrollables horizontalmente sin desbordarse
- Los botones de acción deben tener mínimo 44px de altura (tap target)
- El texto no debe cortarse con `...` en nombres largos

**2. `GondolaRellenoPage.tsx`**
- Los inputs de cantidad (+/-) deben ser cómodos con el pulgar
- El footer fijo no debe tapar contenido en iPhone con home indicator
- Agregar `padding-bottom: env(safe-area-inset-bottom)` al footer

**3. `MiAsistenciaPage.tsx` / `EmployeeAttendancePage.tsx`**
- Botón de check-in debe ser grande y centrado
- El cronómetro de comida debe ser legible en pantalla pequeña

**4. `SemaforoEmpleadoTab.tsx`**
- Las estrellas de evaluación deben tener 44px mínimo de tap target
- El modal de peer evaluation debe ser full-screen en móvil

**5. `AppShell.tsx` — Sidebar en móvil**
- El sidebar debe cerrarse al navegar en móvil
- El overlay debe ser táctil (click fuera cierra el sidebar)

### Fixes generales de CSS a aplicar:

```css
/* En index.css — fixes globales para móvil */

/* Safe area para iPhone con notch/Dynamic Island */
.mobile-safe-bottom {
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
}

/* Evitar zoom en inputs en iOS */
input, select, textarea {
  font-size: 16px !important; /* iOS hace zoom si font-size < 16px */
}

/* Tap targets mínimos */
button, a, [role="button"] {
  min-height: 44px;
  min-width: 44px;
}
```

### Componentes específicos a corregir:

**Footer fijo en GondolaRellenoPage:**
```tsx
// ❌ ANTES:
<div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">

// ✅ DESPUÉS (safe area iPhone):
<div className="fixed bottom-0 left-0 right-0 bg-white border-t"
     style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
               paddingLeft: '1rem', paddingRight: '1rem', paddingTop: '1rem' }}>
```

**Tabs horizontales scrollables:**
```tsx
// Asegurar que todos los tabs tengan:
<div className="flex overflow-x-auto gap-1 p-1.5 ... hide-scrollbar">
  // hide-scrollbar: scrollbar-width: none en CSS
```

---

## PARTE 5 — Verificar notificaciones con nueva lógica de asignación

Asegurarse de que estas notificaciones funcionen correctamente:

| Evento | Quién recibe |
|---|---|
| Admin asigna tarea a supervisor | El supervisor |
| Admin asigna tarea a empleado | El empleado |
| Supervisor asigna tarea a empleado | El empleado |
| Empleado inicia relleno por iniciativa | Todos los admins y supervisores |
| Empleado completa relleno de góndola | Todos los admins y supervisores |
| Empleado completa tarea (done_pending) | Todos los admins y supervisores |

**Verificar en `NotificationService.php` que `sendToManagers()` incluya
tanto admins como supervisores** (actualmente puede que solo envíe a admins):

```php
public function sendToManagers(string $empresaId, ...): void
{
    $managerIds = \App\Models\User::where('empresa_id', $empresaId)
        ->whereIn('role', ['admin', 'supervisor']) // ← verificar que incluya ambos roles
        ->pluck('id')
        ->toArray();
    // ...
}
```

---

## Resumen de archivos a crear/modificar

| Archivo | Acción |
|---|---|
| `app/Http/Controllers/Api/V1/TasksController.php` | Modificar — jerarquía en assign() + empleadosAsignables() + miPanel() |
| `app/Http/Controllers/Api/V1/GondolaOrdenesController.php` | Modificar — agregar autoRellenar() |
| `app/Services/NotificationService.php` | Verificar — sendToManagers() incluye supervisores |
| `routes/api.php` | Modificar — rutas nuevas |
| `src/features/tasks/api.ts` | Modificar — getEmpleadosAsignables() + getMiPanel() |
| `src/features/tasks/EmployeeTasksPage.tsx` | Modificar — panel combinado tareas+góndolas |
| `src/features/gondolas/GondolasEmpleadoTab.tsx` | Modificar — sección auto-relleno |
| `src/features/gondolas/GondolaRellenoPage.tsx` | Modificar — safe area + responsividad |
| `src/app/AppShell.tsx` | Modificar — sidebar cierra en móvil |
| `src/index.css` | Modificar — fixes globales responsividad |
