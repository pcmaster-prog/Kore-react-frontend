# 📋 Kore — Especificación Técnica de Correcciones y Mejoras

> **Destinatario:** Antigravity (Agente de Implementación)  
> **Proyecto:** Kore — Gestión de Empleados, Asistencia, Tareas y Nómina  
> **Fecha:** 2026-04-23  
> **Repositorios:**
> - Frontend: `https://github.com/pcmaster-prog/Kore-react-frontend`
> - Backend: `https://github.com/pcmaster-prog/Kore-laravel-backend`

---

## 📌 Índice

1. [Backend — Correcciones Críticas](#1-backend--correcciones-críticas)
2. [Backend — Arquitectura y Escalabilidad](#2-backend--arquitectura-y-escalabilidad)
3. [Backend — Sistema de Retardos y Faltas (Nuevo)](#3-backend--sistema-de-retardos-y-faltas-nuevo)
4. [Frontend — Correcciones Críticas](#4-frontend--correcciones-críticas)
5. [Frontend — Arquitectura y Calidad](#5-frontend--arquitectura-y-calidad)
6. [Anexos — Ejemplos de Código](#6-anexos--ejemplos-de-código)

---

## 1. Backend — Correcciones Críticas

### 1.1 Crear Form Requests para desbloquear los God Controllers
**Estado:** Todos los controllers validan inline con `$request->validate([...])`.  
**Acción:** Extraer la validación a clases `FormRequest` dedicadas.

**Controllers que requieren Form Request obligatorio:**
- `AttendanceControllerV2` → `CheckInRequest`, `BreakRequest`, `AdjustAttendanceRequest`
- `TasksController` → `StoreTaskRequest`, `AssignTaskRequest`, `UpdateAssignmentRequest`
- `PayrollController` → `GeneratePayrollRequest`, `UpdatePayrollEntryRequest`
- `EmployeesController` → `StoreEmployeeRequest`, `UpdateEmployeeRequest`, `LinkUserRequest`
- `RegisterController` → ya tiene validación inline, extraer a `RegisterCompanyRequest`

**Ejemplo de estructura:**
```bash
php artisan make:request Api/V1/Attendance/CheckInRequest
php artisan make:request Api/V1/Tasks/StoreTaskRequest
```

**Reglas importantes a mantener:**
- `admin_password` en registro: mínimo 8, al menos 1 mayúscula, 1 minúscula, 1 número, 1 símbolo.
- `expediente`: `file|mimes:pdf,jpg,png|max:5120`
- UUIDs: usar `'uuid'` en todas las rutas que reciban `$id` de empleados/tareas/periodos.

---

### 1.2 Extraer Notificaciones FCM a Colas (Queues)
**Estado:** Las notificaciones se envían sincrónicamente dentro del request HTTP.  
**Impacto:** Si FCM falla o tarda, el usuario recibe timeout o error 500.  
**Acción:**

1. Crear eventos:
```bash
php artisan make:event Attendance\CheckInRecorded
php artisan make:event Tasks\TaskAssigned
php artisan make:event Tasks\TaskCompletedPending
```

2. Crear listeners queued:
```bash
php artisan make:listener SendAttendanceNotification --queued
php artisan make:listener SendTaskAssignedNotification --queued
```

3. En los controllers, reemplazar:
```php
// ❌ ANTES (bloqueante)
try {
    app(NotificationService::class)->sendToManagers(...);
} catch (\Throwable $e) { ... }

// ✅ DESPUÉS (fire-and-forget)
event(new CheckInRecorded($day, $emp, $lateMinutes, $tardCount));
```

4. Configurar `QUEUE_CONNECTION=database` en `.env` de producción y ejecutar worker en Railway:
```bash
php artisan queue:work --sleep=3 --tries=3
```

---

### 1.3 Implementar Rate Limiting Global
**Estado:** Solo `login` y `register` tienen `throttle`.  
**Acción:** Aplicar throttle a todo el grupo autenticado:

```php
// routes/api.php
Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {
    // ... todas las rutas autenticadas
});
```

Configurar en `App\Providers\RouteServiceProvider`:
```php
RateLimiter::for('api', function (Request $request) {
    return Limit::perMinute(120)->by($request->user()?->id ?: $request->ip());
});
```

Endpoints sensibles que deben tener throttle más estricto:
- `POST /asistencia/entrada` → `throttle:10,1`
- `POST /evidencias/upload` → `throttle:10,1`
- `POST /fcm/token` → `throttle:5,1`

---

### 1.4 Agregar SoftDeletes a Modelos Críticos
**Estado:** No hay soft deletes. Un empleado borrado pierde todo su histórico de nómina.  
**Modelos a proteger:**
- `Empleado`
- `Task`
- `PayrollPeriod`
- `PayrollEntry`
- `AttendanceDay`

**Migraciones necesarias:**
```bash
php artisan make:migration add_soft_deletes_to_empleados_table
php artisan make:migration add_soft_deletes_to_tasks_table
php artisan make:migration add_soft_deletes_to_payroll_periods_table
php artisan make:migration add_soft_deletes_to_payroll_entries_table
php artisan make:migration add_soft_deletes_to_attendance_days_table
```

**En cada modelo:**
```php
use Illuminate\Database\Eloquent\SoftDeletes;

class Empleado extends Model
{
    use SoftDeletes;
    // ...
}
```

**Regla de negocio:** Si un `Empleado` tiene `PayrollEntry` aprobados, no permitir `forceDelete()`. Solo soft delete.

---

### 1.5 Crear API Resources para Estandarizar Respuestas
**Estado:** Cada controller tiene métodos privados `present()`, `presentDay()`, `presentTask()`.  
**Acción:** Crear Resources reutilizables:

```bash
php artisan make:resource EmployeeResource
php artisan make:resource AttendanceDayResource
php artisan make:resource TaskResource
php artisan make:resource PayrollPeriodResource
php artisan make:resource PayrollEntryResource
```

**Ejemplo:**
```php
class EmployeeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'full_name' => $this->full_name,
            'employee_code' => $this->employee_code,
            'position_title' => $this->position_title,
            'status' => $this->status,
            'hired_at' => $this->hired_at?->toDateString(),
            'user_id' => $this->user_id,
            'rfc' => $this->rfc,
            'nss' => $this->nss,
            'expediente_url' => $this->expediente_url,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
```

---

### 1.6 Cachear Cálculos de Nómina
**Estado:** `PayrollController::computeEntry()` recalcula asistencia desde cero en cada generación.  
**Acción:** Cachear por semana/empleado:

```php
$cacheKey = "payroll:{$empresaId}:{$weekStart}:{$empleadoId}:minutes";
$workedMinutes = Cache::remember($cacheKey, now()->addHours(6), function () use ($emp, $weekStart, $weekEnd) {
    return $this->calcularHorasSemanales($emp, $weekStart, $weekEnd);
});
```

Invalidar cache cuando:
- Se ajusta asistencia manualmente (`ajustar()`)
- Se elimina un día (`eliminarDia()`)
- Se marca/cancela descanso

---

### 1.7 Timezone por Empresa
**Estado:** Se usa `now()` global del servidor.  
**Acción:**
1. Agregar columna `timezone` a `empresas` (default: `America/Mexico_City`).
2. Crear helper o middleware que setee el timezone:
```php
// En TenantMiddleware o un helper
$tz = $empresa->timezone ?? 'America/Mexico_City';
config(['app.timezone' => $tz]);
date_default_timezone_set($tz);
```
3. Usar `now()` normalmente; Laravel respetará el timezone seteado.

---

### 1.8 Middleware de Auditoría Automática
**Estado:** `ActivityLogger::log()` se llama manualmente en cada controller.  
**Acción:** Implementar un trait `LogsActivity` o usar Model Observers para modelos críticos.

**Modelos a auditar automáticamente:**
- `Empleado` (crear, actualizar, eliminar, vincular usuario)
- `AttendanceDay` (ajustes manuales, eliminaciones)
- `PayrollPeriod` (generar, aprobar)
- `Task` (cambio de estado, asignación)

**Ejemplo con Observer:**
```bash
php artisan make:observer EmpleadoObserver --model=Empleado
```

---

### 1.9 Documentar API con Scribe
**Acción:**
```bash
composer require knuckleswtf/scribe
php artisan vendor:publish --tag=scribe-config
php artisan scribe:generate
```
Documentar al menos los endpoints públicos y los de asistencia/tareas/nómina.

---

### 1.10 PHPStan + Pint en CI
**Acción:**
1. Asegurar que `composer.json` tenga:
```json
"scripts": {
    "lint": "pint",
    "analyse": "phpstan analyse --memory-limit=512M"
}
```
2. Crear `.github/workflows/ci.yml` (si usas GitHub Actions) o configurar en Railway.
3. Nivel mínimo PHPStan: **nivel 6**.

---

## 2. Backend — Arquitectura y Escalabilidad

### 2.1 Refactorizar God Controllers en Actions/Services
**Controllers objetivo:** `AttendanceControllerV2`, `TasksController`, `PayrollController`.

**Nueva estructura sugerida:**
```
app/
  Modules/
    Attendance/
      Controllers/
        AttendanceControllerV2.php
      Services/
        AttendanceStateMachine.php      // lógica de estados (out/working/break/closed)
        AttendanceCalculator.php        // computeTotals, calcularHorasSemanales
        NetworkValidator.php            // validateNetworkAccess
        LateDetector.php                // detección de retardos
      Actions/
        CheckInAction.php
        CheckOutAction.php
        BreakStartAction.php
        AdjustAttendanceAction.php
      Events/
        CheckInRecorded.php
        CheckOutRecorded.php
    Payroll/
      Services/
        PayrollGenerator.php
        PayrollCalculator.php
      Actions/
        GeneratePeriodAction.php
        ApprovePeriodAction.php
    Tasks/
      Services/
        TaskWorkflow.php
        TaskAssigner.php
      Actions/
        CreateTaskAction.php
        AssignTaskAction.php
        CompleteTaskAction.php
```

**Regla:** Los controllers solo deben:
1. Inyectar el Form Request
2. Autorizar (policy/gate)
3. Llamar a la Action/Service
4. Retornar Resource/Response

---

### 2.2 Implementar Policies para Autorización
**Acción:**
```bash
php artisan make:policy EmpleadoPolicy --model=Empleado
php artisan make:policy TaskPolicy --model=Task
php artisan make:policy PayrollPolicy --model=PayrollPeriod
```

**Ejemplo:**
```php
class EmpleadoPolicy
{
    public function view(User $user, Empleado $empleado): bool
    {
        return $user->empresa_id === $empleado->empresa_id
            && in_array($user->role, ['admin', 'supervisor']);
    }

    public function update(User $user, Empleado $empleado): bool
    {
        return $user->empresa_id === $empleado->empresa_id
            && $user->role === 'admin';
    }
}
```

En el controller:
```php
public function show(Request $request, Empleado $empleado)
{
    $this->authorize('view', $empleado);
    return new EmployeeResource($empleado);
}
```

---

### 2.3 Geofencing para Asistencia (Complemento a IP)
**Estado:** Solo validación por IP.  
**Acción:** Agregar validación opcional por geolocalización.

1. Agregar a `empresas.settings`:
```json
{
  "location": {
    "enabled": true,
    "lat": 19.4326,
    "lng": -99.1332,
    "radius_meters": 200
  }
}
```

2. El frontend (Capacitor) envía lat/lng en el header o body:
```json
{
  "lat": 19.4326,
  "lng": -99.1332
}
```

3. Validar distancia con fórmula Haversine. Si está fuera del radio, rechazar con código `OUT_OF_RANGE`.

---

## 3. Backend — Sistema de Retardos y Faltas (Nuevo)

### 3.1 Visión General
El admin debe poder configurar **desde la UI** los parámetros del sistema de puntualidad. El sistema debe:

1. Detectar retardos automáticamente al marcar entrada.
2. Acumular retardos por período configurable (semana/quincena/mes).
3. Convertir N retardos en 1 falta.
4. Si un empleado tiene falta por retardos acumulados, su día de descanso pagado **no se paga** en la nómina correspondiente.
5. Todo debe ser configurable y visible en el dashboard del admin.

---

### 3.2 Configuración Administrable (Nueva Tabla/Settings)

**Opción A (Recomendada): Tabla dedicada `tardiness_configs`**

```php
Schema::create('tardiness_configs', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->foreignUuid('empresa_id')->constrained('empresas')->cascadeOnDelete();

    // Parámetros de retardo
    $table->unsignedSmallInteger('grace_period_minutes')->default(10); // minutos de tolerancia
    $table->unsignedSmallInteger('late_threshold_minutes')->default(1); // a partir de cuántos min después de la tolerancia se considera retardo

    // Acumulación
    $table->unsignedTinyInteger('lates_to_absence')->default(3); // cuántos retardos = 1 falta
    $table->enum('accumulation_period', ['week', 'biweek', 'month'])->default('month');

    // Penalización
    $table->boolean('penalize_rest_day')->default(true); // true = quitar pago de descanso si hay falta por retardos
    $table->boolean('notify_employee_on_late')->default(true);
    $table->boolean('notify_manager_on_late')->default(true);

    $table->timestamps();
    $table->unique('empresa_id');
});
```

**Opción B:** Guardar dentro de `empresas.settings` JSON (menos normalizado, más simple para MVP).

**Recomendación:** Usar Opción A si se quiere historial/auditoría de cambios de configuración. Usar Opción B si se quiere simplicidad. **Para este proyecto, Opción A es mejor.**

**Seed por defecto al registrar empresa:**
```php
TardinessConfig::create([
    'empresa_id' => $empresa->id,
    'grace_period_minutes' => 10,
    'late_threshold_minutes' => 1,
    'lates_to_absence' => 3,
    'accumulation_period' => 'month',
    'penalize_rest_day' => true,
]);
```

---

### 3.3 Lógica de Detección de Retardo (CheckIn)

**Flujo en `CheckInAction` o `AttendanceControllerV2::checkIn`:**

```php
public function checkIn(Request $request)
{
    [$user, $empresaId, $empleado] = $this->authEmployee($request);
    $empresa = Empresa::find($empresaId);
    $config = TardinessConfig::where('empresa_id', $empresaId)->first();

    // 1. Validaciones previas (red, horario, descanso)...

    // 2. Calcular retardo
    $lateMinutes = 0;
    $isLate = false;

    $operativo = $empresa->settings['operativo'] ?? null;
    if ($operativo && isset($operativo['check_in_time'])) {
        $checkInTime = Carbon::parse($operativo['check_in_time']);
        $graceEnd = $checkInTime->copy()->addMinutes($config->grace_period_minutes);
        $now = now();

        if ($now->greaterThan($graceEnd)) {
            $lateMinutes = (int) ceil($now->diffInMinutes($graceEnd));
            $isLate = $lateMinutes >= $config->late_threshold_minutes;
        }
    }

    // 3. Crear registro de asistencia
    $day = AttendanceDay::firstOrCreate(...);
    $day->late_minutes = $isLate ? $lateMinutes : 0;
    $day->is_late = $isLate;
    $day->save();

    // 4. Si es retardo, registrar en tabla de acumulación
    if ($isLate) {
        $this->recordLate($empresaId, $empleado->id, $day->date, $lateMinutes, $config);
    }

    // 5. Notificaciones (queued)...

    return response()->json([
        'message' => $isLate 
            ? "Entrada registrada. ⚠️ Vas con {$lateMinutes} min de retardo." 
            : 'Entrada registrada correctamente.',
        'late_minutes' => $lateMinutes,
        'is_late' => $isLate,
        'day' => new AttendanceDayResource($day),
    ]);
}
```

**Nuevos campos en `attendance_days`:**
```php
$table->boolean('is_late')->default(false)->after('late_minutes');
```

---

### 3.4 Tabla de Acumulación de Retardos

```php
Schema::create('employee_late_records', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->foreignUuid('empresa_id')->constrained('empresas')->cascadeOnDelete();
    $table->foreignUuid('empleado_id')->constrained('empleados')->cascadeOnDelete();
    $table->date('date');
    $table->unsignedSmallInteger('late_minutes');
    $table->enum('period_type', ['week', 'biweek', 'month']);
    $table->string('period_key'); // ej: "2026-04" o "2026-W17"
    $table->boolean('converted_to_absence')->default(false);
    $table->timestamps();

    $table->index(['empresa_id', 'empleado_id', 'period_key']);
});
```

**Método `recordLate`:**
```php
private function recordLate(string $empresaId, string $empleadoId, Carbon $date, int $minutes, TardinessConfig $config): void
{
    $periodKey = match($config->accumulation_period) {
        'week' => $date->format('Y') . '-W' . $date->weekOfYear,
        'biweek' => $date->format('Y') . '-B' . ceil($date->day / 15),
        'month' => $date->format('Y-m'),
    };

    EmployeeLateRecord::create([
        'empresa_id' => $empresaId,
        'empleado_id' => $empleadoId,
        'date' => $date,
        'late_minutes' => $minutes,
        'period_type' => $config->accumulation_period,
        'period_key' => $periodKey,
    ]);

    // Verificar si se alcanzó el límite para convertir en falta
    $this->evaluateAbsenceConversion($empresaId, $empleadoId, $periodKey, $config);
}
```

---

### 3.5 Conversión Retardos → Falta

```php
private function evaluateAbsenceConversion(string $empresaId, string $empleadoId, string $periodKey, TardinessConfig $config): void
{
    $count = EmployeeLateRecord::where('empresa_id', $empresaId)
        ->where('empleado_id', $empleadoId)
        ->where('period_key', $periodKey)
        ->where('converted_to_absence', false)
        ->count();

    if ($count >= $config->lates_to_absence) {
        // Marcar los últimos N retardos como convertidos
        $records = EmployeeLateRecord::where('empresa_id', $empresaId)
            ->where('empleado_id', $empleadoId)
            ->where('period_key', $periodKey)
            ->where('converted_to_absence', false)
            ->orderBy('date')
            ->limit($config->lates_to_absence)
            ->get();

        foreach ($records as $r) {
            $r->update(['converted_to_absence' => true]);
        }

        // Crear registro de falta
        EmployeeAbsence::create([
            'empresa_id' => $empresaId,
            'empleado_id' => $empleadoId,
            'period_key' => $periodKey,
            'type' => 'late_accumulation',
            'source_late_ids' => $records->pluck('id')->toArray(),
            'affects_rest_day_payment' => $config->penalize_rest_day,
        ]);

        // Notificar al empleado y managers
        event(new LateAccumulatedToAbsence($empresaId, $empleadoId, $periodKey));
    }
}
```

**Tabla `employee_absences`:**
```php
Schema::create('employee_absences', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->foreignUuid('empresa_id')->constrained('empresas')->cascadeOnDelete();
    $table->foreignUuid('empleado_id')->constrained('empleados')->cascadeOnDelete();
    $table->string('period_key');
    $table->enum('type', ['late_accumulation', 'unjustified', 'justified'])->default('late_accumulation');
    $table->json('source_late_ids')->nullable(); // IDs de los retardos que generaron esta falta
    $table->boolean('affects_rest_day_payment')->default(true);
    $table->text('note')->nullable();
    $table->timestamps();

    $table->index(['empresa_id', 'empleado_id', 'period_key']);
});
```

---

### 3.6 Impacto en Nómina (Penalización de Descanso)

**Modificar `PayrollController::computeEntry`:**

```php
private function computeEntry(...): PayrollEntry
{
    // ... cálculo normal ...

    $config = TardinessConfig::where('empresa_id', $empresaId)->first();
    $periodKey = match($config?->accumulation_period ?? 'month') {
        'week' => Carbon::parse($weekStart)->format('Y') . '-W' . Carbon::parse($weekStart)->weekOfYear,
        'biweek' => Carbon::parse($weekStart)->format('Y') . '-B' . ceil(Carbon::parse($weekStart)->day / 15),
        'month' => Carbon::parse($weekStart)->format('Y-m'),
    };

    // Verificar si tiene falta por retardos acumulados en este período
    $hasAbsence = EmployeeAbsence::where('empresa_id', $empresaId)
        ->where('empleado_id', $emp->id)
        ->where('period_key', $periodKey)
        ->where('type', 'late_accumulation')
        ->where('affects_rest_day_payment', true)
        ->exists();

    if ($hasAbsence) {
        $restDaysPaid = 0; // ¡Se anula el descanso pagado!
        $penaltyNote = 'Descanso no pagado por acumulación de retardos (' . ($config->lates_to_absence ?? 3) . ' retardos = 1 falta)';
    } else {
        $restDaysPaid = min($paidRestDays, 1);
        $penaltyNote = null;
    }

    // ... resto del cálculo ...

    $data = [
        // ... campos existentes ...
        'rest_days_paid' => $restDaysPaid,
        'penalty_note' => $penaltyNote,
        'has_absence_penalty' => $hasAbsence,
    ];

    // ... guardar entry ...
}
```

**Nuevos campos en `payroll_entries`:**
```php
$table->text('penalty_note')->nullable()->after('bonus_note');
$table->boolean('has_absence_penalty')->default(false)->after('absences_count');
```

---

### 3.7 Endpoints para Configuración de Retardos

```php
// routes/api.php (dentro de auth:sanctum + tenant + module:configuracion)
Route::get('/config/retardos', [TardinessConfigController::class, 'show']);
Route::patch('/config/retardos', [TardinessConfigController::class, 'update']);

// Dashboard / Reportes
Route::get('/retardos/resumen-mes', [TardinessReportController::class, 'monthlySummary']);
Route::get('/retardos/empleado/{empleadoId}', [TardinessReportController::class, 'employeeDetail']);
Route::get('/retardos/faltas-activas', [TardinessReportController::class, 'activeAbsences']);
```

**Controlador `TardinessConfigController`:**
```php
class TardinessConfigController extends Controller
{
    public function show(Request $request)
    {
        $u = $request->user();
        $config = TardinessConfig::firstOrCreate(
            ['empresa_id' => $u->empresa_id],
            ['grace_period_minutes' => 10, 'lates_to_absence' => 3]
        );
        return response()->json($config);
    }

    public function update(Request $request)
    {
        $u = $request->user();
        if ($u->role !== 'admin') {
            return response()->json(['message' => 'Solo admin puede modificar configuración de retardos'], 403);
        }

        $data = $request->validate([
            'grace_period_minutes' => ['sometimes', 'integer', 'min:0', 'max:120'],
            'late_threshold_minutes' => ['sometimes', 'integer', 'min:1', 'max:60'],
            'lates_to_absence' => ['sometimes', 'integer', 'min:1', 'max:10'],
            'accumulation_period' => ['sometimes', 'in:week,biweek,month'],
            'penalize_rest_day' => ['sometimes', 'boolean'],
            'notify_employee_on_late' => ['sometimes', 'boolean'],
            'notify_manager_on_late' => ['sometimes', 'boolean'],
        ]);

        $config = TardinessConfig::where('empresa_id', $u->empresa_id)->firstOrFail();
        $config->update($data);

        ActivityLogger::log($u->empresa_id, $u->id, null, 'tardiness.config_updated', 'tardiness_config', $config->id, $data, $request);

        return response()->json(['message' => 'Configuración actualizada', 'config' => $config]);
    }
}
```

---

### 3.8 Respuesta al Empleado (Frontend)

Cuando el empleado marca entrada y tiene retardo, el backend debe responder:

```json
{
  "message": "Entrada registrada. ⚠️ Vas con 15 min de retardo.",
  "late_minutes": 15,
  "is_late": true,
  "tardiness_count_this_period": 2,
  "lates_to_absence": 3,
  "warning": "⚠️ Cuidado: 1 retardo más y se generará 1 falta. Tu próximo descanso pagado no se cubrirá.",
  "day": { ... }
}
```

Si es el retardo que genera la falta:
```json
{
  "message": "Entrada registrada. ⚠️ Vas con 20 min de retardo.",
  "late_minutes": 20,
  "is_late": true,
  "tardiness_count_this_period": 3,
  "absence_generated": true,
  "warning": "🚨 Has acumulado 3 retardos. Se ha generado 1 falta. Tu día de descanso de esta semana NO será pagado.",
  "day": { ... }
}
```

---

### 3.9 Reporte para Admin

**Endpoint:** `GET /retardos/resumen-mes?month=2026-04`

```json
{
  "period": "2026-04",
  "config": {
    "grace_period_minutes": 10,
    "lates_to_absence": 3
  },
  "summary": [
    {
      "empleado_id": "...",
      "empleado_name": "Juan Pérez",
      "total_lates": 4,
      "total_late_minutes": 65,
      "absences_generated": 1,
      "rest_day_penalized": true,
      "dates": ["2026-04-02", "2026-04-05", "2026-04-10", "2026-04-15"]
    }
  ]
}
```

---

## 4. Frontend — Correcciones Críticas

### 4.1 Arreglar `main.tsx` — Render Vacío
**Archivo:** `src/main.tsx`  
**Estado:** El `render()` está vacío. La app no muestra nada.

**Reemplazar por:**
```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { registerSW } from "virtual:pwa-register";

import { queryClient } from "@/lib/queryClient";
import { router } from "./app/routes";
import ErrorBoundary from "@/components/ErrorBoundary";
import "./tailwind.css.ts";
import "./styles/themes.css";

document.documentElement.lang = "es";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm("Nueva versión disponible. ¿Actualizar?")) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log("Kore listo para uso offline");
  },
});
```

**Nota:** `App.tsx` está completamente comentado. Si no se usa, eliminarlo o dejarlo como componente wrapper si es necesario.

---

### 4.2 Interceptor de Axios con Manejo de 401
**Archivo:** Crear `src/lib/api.ts` (o revisar el existente).  
**Acción:** Implementar interceptor global.

```ts
import axios from "axios";
import { auth } from "@/features/auth/store";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = auth.getToken(); // o localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      auth.clear();
      window.location.href = "/login";
    }

    // Toast global de error
    if (err.response?.status >= 500) {
      window.dispatchEvent(new CustomEvent("kore-error", {
        detail: { message: "Error del servidor. Intenta más tarde." }
      }));
    }

    return Promise.reject(err);
  }
);

export default api;
```

**Asegurar que TODOS los hooks usen esta instancia `api`, no axios directamente.**

---

### 4.3 Implementar Optimistic Updates en React Query
**Estado:** Las mutaciones esperan respuesta del servidor para actualizar UI.  
**Acción:** Implementar en las mutaciones críticas:

**Ejemplo en asignaciones de tareas:**
```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

const queryClient = useQueryClient();

const updateAssignment = useMutation({
  mutationFn: async ({ assignmentId, status }) => {
    const { data } = await api.patch(`/mis-tareas/asignacion/${assignmentId}`, { status });
    return data;
  },
  onMutate: async (newData) => {
    await queryClient.cancelQueries({ queryKey: ["my-assignments"] });
    const previous = queryClient.getQueryData(["my-assignments"]);

    queryClient.setQueryData(["my-assignments"], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        data: old.data.map((a: any) =>
          a.assignment.id === newData.assignmentId
            ? { ...a, assignment: { ...a.assignment, status: newData.status } }
            : a
        ),
      };
    });

    return { previous };
  },
  onError: (err, newData, context) => {
    if (context?.previous) {
      queryClient.setQueryData(["my-assignments"], context.previous);
    }
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ["my-assignments"] });
  },
});
```

Aplicar lo mismo en:
- Marcar entrada/salida de asistencia
- Completar items de checklist
- Cambiar estado de tareas

---

### 4.4 Manejo de Estado Offline / Background Sync
**Estado:** Es PWA + Capacitor pero no hay sincronización offline.  
**Acción:**

1. Crear `src/lib/offlineQueue.ts` usando IndexedDB (via `idb` package):
```ts
import { openDB } from "idb";

const dbPromise = openDB("kore-offline", 1, {
  upgrade(db) {
    db.createObjectStore("requests", { keyPath: "id", autoIncrement: true });
  },
});

export async function queueRequest(endpoint: string, payload: any) {
  const db = await dbPromise;
  await db.add("requests", { endpoint, payload, createdAt: Date.now() });
}

export async function syncQueuedRequests() {
  const db = await dbPromise;
  const requests = await db.getAll("requests");

  for (const req of requests) {
    try {
      await api.post(req.endpoint, req.payload);
      await db.delete("requests", req.id);
    } catch (e) {
      console.error("Sync failed for", req);
    }
  }
}
```

2. En el Service Worker (ya configurado con Workbox), agregar:
```js
// En vite.config.ts workbox config
runtimeCaching: [
  {
    urlPattern: /^https:\/\/tu-api\/api\/asistencia\/.*/,
    handler: "NetworkOnly",
    options: {
      backgroundSync: {
        name: "attendance-queue",
        options: {
          maxRetentionTime: 24 * 60, // 24 horas
        },
      },
    },
  },
],
```

3. En el frontend, detectar offline y guardar en cola:
```ts
async function handleCheckIn() {
  if (!navigator.onLine) {
    await queueRequest("/asistencia/entrada", { lat, lng });
    toast.info("Sin conexión. Tu entrada se sincronizará automáticamente.");
    return;
  }
  // ... llamada normal
}
```

---

## 5. Frontend — Arquitectura y Calidad

### 5.1 Testing Stack
**Instalar:**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
npm install -D @playwright/test
```

**Configurar `vitest.config.ts`:**
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

**Tests prioritarios:**
1. `LoginPage.test.tsx` — validación de formulario, submit, error 401
2. `AttendanceButton.test.tsx` — estados (entrada, pausa, salida), deshabilitado en descanso
3. `useAuth.test.ts` — persistencia de token, logout
4. E2E Playwright: flujo completo "Login → Marcar entrada → Ver dashboard → Cerrar sesión"

---

### 5.2 Feature Flags (Preparación)
**Instalar:**
```bash
npm install flagsmith
```

**Crear `src/lib/flags.ts`:**
```ts
import flagsmith from "flagsmith";

export async function initFlags() {
  await flagsmith.init({
    environmentID: import.meta.env.VITE_FLAGSMITH_KEY,
  });
}

export const isEnabled = (flag: string) => flagsmith.hasFeature(flag);
```

Usar para desplegar gradualmente el nuevo módulo de retardos.

---

### 5.3 i18n (Preparación para Multi-país)
**Instalar:**
```bash
npm install react-i18next i18next i18next-browser-languagedetector
```

**Crear `src/i18n/index.ts`:**
```ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import es from "./locales/es.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { es: { translation: es } },
    fallbackLng: "es",
    interpolation: { escapeValue: false },
  });
```

Aunque todo sea español por ahora, envolver los textos en `t("key")` para evitar deuda técnica.

---

### 5.4 Mejoras de UX/UI

#### 5.4.1 Pantalla de Configuración de Retardos (Nueva)
**Ruta:** `/app/manager/configuracion/retardos`  
**Componentes:**
- `TardinessConfigForm` — formulario con los campos de `TardinessConfig`
- `TardinessReportTable` — tabla de resumen mensual por empleado
- `AbsenceAlert` — banner cuando un empleado genera falta

**Diseño del formulario:**
```tsx
<form className="space-y-6">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <NumberInput
      label="Minutos de tolerancia"
      description="Después de la hora de entrada, cuántos minutos permitir sin contar retardo"
      name="grace_period_minutes"
      min={0}
      max={120}
    />
    <NumberInput
      label="Retardos para 1 falta"
      description="Cuántos retardos acumulados equivalen a una falta"
      name="lates_to_absence"
      min={1}
      max={10}
    />
    <Select
      label="Período de acumulación"
      name="accumulation_period"
      options={[
        { value: "week", label: "Semanal" },
        { value: "biweek", label: "Quincenal" },
        { value: "month", label: "Mensual" },
      ]}
    />
    <Toggle
      label="Penalizar descanso pagado"
      description="Si tiene falta por retardos, no pagar su día de descanso"
      name="penalize_rest_day"
    />
  </div>
</form>
```

#### 5.4.2 Toast de Retardo en Tiempo Real
Cuando el empleado marca entrada y el backend responde con `is_late: true`, mostrar un toast prominente:

```tsx
// En el hook de check-in
const { mutate: checkIn } = useMutation({
  mutationFn: api.post("/asistencia/entrada"),
  onSuccess: (data) => {
    if (data.is_late) {
      toast.warning(data.warning, { duration: 8000, icon: "⚠️" });
    } else {
      toast.success("Entrada registrada correctamente");
    }
  },
});
```

#### 5.4.3 Indicador de Retardos en Dashboard del Empleado
Mostrar un widget pequeño:
```tsx
<div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
  <div className="flex items-center gap-2 text-amber-800">
    <ClockIcon className="w-5 h-5" />
    <span className="font-semibold">Retardos este mes</span>
  </div>
  <div className="mt-2 flex items-end gap-2">
    <span className="text-3xl font-bold text-amber-900">{tardinessCount}</span>
    <span className="text-sm text-amber-700 mb-1">/ {config.lates_to_absence} permitidos</span>
  </div>
  {tardinessCount >= config.lates_to_absence - 1 && (
    <p className="mt-2 text-sm text-red-600 font-medium">
      ⚠️ Cuidado: 1 retardo más y perderás tu descanso pagado.
    </p>
  )}
</div>
```

---

### 5.5 Estandarizar Imports
**Regla:** Todo debe usar el path alias `@/`.
```ts
// ❌ Mal
import { queryClient } from "../lib/queryClient";

// ✅ Bien
import { queryClient } from "@/lib/queryClient";
```

Revisar especialmente:
- `src/main.tsx` (importa `./app/routes` y `./tailwind.css.ts`)
- Todos los lazy imports en `routes.tsx`

---

## 6. Anexos — Ejemplos de Código

### Anexo A: Migración Completa del Sistema de Retardos

```php
<?php
// database/migrations/2026_04_23_000001_create_tardiness_configs_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tardiness_configs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('empresa_id')->constrained('empresas')->cascadeOnDelete();
            $table->unsignedSmallInteger('grace_period_minutes')->default(10);
            $table->unsignedSmallInteger('late_threshold_minutes')->default(1);
            $table->unsignedTinyInteger('lates_to_absence')->default(3);
            $table->enum('accumulation_period', ['week', 'biweek', 'month'])->default('month');
            $table->boolean('penalize_rest_day')->default(true);
            $table->boolean('notify_employee_on_late')->default(true);
            $table->boolean('notify_manager_on_late')->default(true);
            $table->timestamps();
            $table->unique('empresa_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tardiness_configs');
    }
};
```

```php
<?php
// database/migrations/2026_04_23_000002_create_employee_late_records_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employee_late_records', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('empresa_id')->constrained('empresas')->cascadeOnDelete();
            $table->foreignUuid('empleado_id')->constrained('empleados')->cascadeOnDelete();
            $table->date('date');
            $table->unsignedSmallInteger('late_minutes');
            $table->enum('period_type', ['week', 'biweek', 'month']);
            $table->string('period_key');
            $table->boolean('converted_to_absence')->default(false);
            $table->timestamps();
            $table->index(['empresa_id', 'empleado_id', 'period_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_late_records');
    }
};
```

```php
<?php
// database/migrations/2026_04_23_000003_create_employee_absences_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employee_absences', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('empresa_id')->constrained('empresas')->cascadeOnDelete();
            $table->foreignUuid('empleado_id')->constrained('empleados')->cascadeOnDelete();
            $table->string('period_key');
            $table->enum('type', ['late_accumulation', 'unjustified', 'justified'])->default('late_accumulation');
            $table->json('source_late_ids')->nullable();
            $table->boolean('affects_rest_day_payment')->default(true);
            $table->text('note')->nullable();
            $table->timestamps();
            $table->index(['empresa_id', 'empleado_id', 'period_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_absences');
    }
};
```

```php
<?php
// database/migrations/2026_04_23_000004_add_soft_deletes_to_models.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('empleados', fn(Blueprint $t) => $t->softDeletes());
        Schema::table('tasks', fn(Blueprint $t) => $t->softDeletes());
        Schema::table('payroll_periods', fn(Blueprint $t) => $t->softDeletes());
        Schema::table('payroll_entries', fn(Blueprint $t) => $t->softDeletes());
        Schema::table('attendance_days', fn(Blueprint $t) => $t->softDeletes());
    }

    public function down(): void
    {
        Schema::table('empleados', fn(Blueprint $t) => $t->dropSoftDeletes());
        Schema::table('tasks', fn(Blueprint $t) => $t->dropSoftDeletes());
        Schema::table('payroll_periods', fn(Blueprint $t) => $t->dropSoftDeletes());
        Schema::table('payroll_entries', fn(Blueprint $t) => $t->dropSoftDeletes());
        Schema::table('attendance_days', fn(Blueprint $t) => $t->dropSoftDeletes());
    }
};
```

```php
<?php
// database/migrations/2026_04_23_000005_add_penalty_fields_to_payroll_entries.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payroll_entries', function (Blueprint $table) {
            $table->text('penalty_note')->nullable()->after('bonus_note');
            $table->boolean('has_absence_penalty')->default(false)->after('absences_count');
        });
    }

    public function down(): void
    {
        Schema::table('payroll_entries', function (Blueprint $table) {
            $table->dropColumn(['penalty_note', 'has_absence_penalty']);
        });
    }
};
```

---

### Anexo B: Seeder de Configuración Inicial

```php
<?php
// database/seeders/TardinessConfigSeeder.php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Empresa;
use App\Models\TardinessConfig;

class TardinessConfigSeeder extends Seeder
{
    public function run(): void
    {
        Empresa::all()->each(function (Empresa $empresa) {
            TardinessConfig::firstOrCreate(
                ['empresa_id' => $empresa->id],
                [
                    'grace_period_minutes' => 10,
                    'late_threshold_minutes' => 1,
                    'lates_to_absence' => 3,
                    'accumulation_period' => 'month',
                    'penalize_rest_day' => true,
                ]
            );
        });
    }
}
```

---

### Anexo C: Comandos de Instalación Rápida

```bash
# Backend
composer require knuckleswtf/scribe
php artisan make:model TardinessConfig -m
php artisan make:model EmployeeLateRecord -m
php artisan make:model EmployeeAbsence -m
php artisan make:controller Api/V1/TardinessConfigController
php artisan make:controller Api/V1/TardinessReportController
php artisan make:resource TardinessConfigResource
php artisan make:request Api/V1/UpdateTardinessConfigRequest

# Frontend
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @playwright/test
npm install flagsmith react-i18next i18next i18next-browser-languagedetector idb
```

---

## ✅ Checklist de Entrega para Antigravity

### Fase 1 — Correcciones Críticas (Semana 1)
- [ ] Arreglar `main.tsx` (render vacío)
- [ ] Crear Form Requests para Attendance, Tasks, Payroll, Employees
- [ ] Extraer notificaciones FCM a Events + Queue
- [ ] Implementar interceptor Axios con 401 handling
- [ ] Agregar rate limiting global
- [ ] Crear migraciones de SoftDeletes
- [ ] Crear API Resources básicos

### Fase 2 — Arquitectura (Semana 2)
- [ ] Refactorizar AttendanceControllerV2 en Actions/Services
- [ ] Refactorizar TasksController en Actions/Services
- [ ] Refactorizar PayrollController en Actions/Services
- [ ] Crear Policies para Empleado, Task, Payroll
- [ ] Implementar cache en cálculos de nómina
- [ ] Configurar timezone por empresa
- [ ] Agregar PHPStan nivel 6 + Pint en CI

### Fase 3 — Sistema de Retardos (Semana 3)
- [ ] Crear migraciones: `tardiness_configs`, `employee_late_records`, `employee_absences`
- [ ] Crear modelos y relaciones
- [ ] Implementar `TardinessConfigController` (CRUD config)
- [ ] Modificar `CheckIn` para detectar retardos con config admin
- [ ] Implementar acumulación y conversión a falta
- [ ] Modificar `PayrollController` para penalizar descanso
- [ ] Crear `TardinessReportController` con resúmenes
- [ ] Frontend: pantalla de configuración de retardos
- [ ] Frontend: widget de retardos en dashboard empleado
- [ ] Frontend: toast de advertencia al marcar entrada con retardo

### Fase 4 — Calidad (Semana 4)
- [ ] Tests Vitest: Login, Attendance, Auth
- [ ] Tests E2E Playwright: flujo crítico
- [ ] Documentar API con Scribe
- [ ] Implementar optimistic updates en React Query
- [ ] Preparar i18n estructura
- [ ] Revisar N+1 queries en Tasks y Payroll

---

> **Nota final:** Este documento es la fuente de verdad. Cualquier duda de implementación, consultar este README antes de tomar decisiones de arquitectura. Priorizar siempre la estabilidad del sistema de asistencia y nómina sobre features cosméticos.
