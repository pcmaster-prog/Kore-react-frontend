# 🎯 Prompt de Implementación Backend — Sistema de Días Feriados (Festivos)

## Contexto
Proyecto: **Kore Laravel Backend**  
Framework: **Laravel 10/11 + Sanctum + UUIDs**  
Tenant: Todas las rutas autenticadas usan `auth:sanctum` y el usuario pertenece a una `empresa_id`.  
Base de datos: MySQL/PostgreSQL via Railway.  

El frontend ya está implementado y espera estos endpoints. Se debe respetar la convención de UUIDs y el patrón de respuesta JSON existente.

---

## 📋 Resumen de cambios requeridos

1. **Nueva tabla** `holidays` para almacenar festivos por empresa.
2. **Nuevo controlador** `HolidayController` con CRUD + carga masiva de México.
3. **Rutas API** bajo el grupo autenticado.
4. **Modificar `AttendanceControllerV2`** para detectar festivos al consultar `/asistencia/mis-hoy`.
5. **Modificar `PayrollController`** para contar festivos pagados al generar nómina y agregar `holidays_paid` a `payroll_entries`.
6. **Modificar migración/modelo** de `attendance_days` para agregar `holiday` al enum de `status`.

---

## 1. Migración: `create_holidays_table`

```bash
php artisan make:migration create_holidays_table
```

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('holidays', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('empresa_id')->constrained('empresas')->cascadeOnDelete();
            $table->string('name');
            $table->date('date');
            $table->boolean('is_paid')->default(true);
            $table->timestamps();

            $table->unique(['empresa_id', 'date']);
            $table->index(['empresa_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('holidays');
    }
};
```

Ejecutar:
```bash
php artisan migrate
```

---

## 2. Modelo: `app/Models/Holiday.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Holiday extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'empresa_id',
        'name',
        'date',
        'is_paid',
    ];

    protected $casts = [
        'date' => 'date',
        'is_paid' => 'boolean',
    ];

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }
}
```

---

## 3. Controlador: `app/Http/Controllers/Api/V1/HolidayController.php`

```php
<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Holiday;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class HolidayController extends Controller
{
    /**
     * GET /api/empresa/festivos
     * Lista todos los festivos de la empresa del usuario autenticado.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $holidays = Holiday::where('empresa_id', $user->empresa_id)
            ->orderBy('date', 'asc')
            ->get();

        return response()->json([
            'data' => $holidays,
        ]);
    }

    /**
     * POST /api/empresa/festivos
     * Crea un festivo manualmente.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Solo el administrador puede gestionar festivos'], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'date' => ['required', 'date_format:Y-m-d'],
            'is_paid' => ['sometimes', 'boolean'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Datos inválidos', 'errors' => $validator->errors()], 422);
        }

        $holiday = Holiday::updateOrCreate(
            [
                'empresa_id' => $user->empresa_id,
                'date' => $request->input('date'),
            ],
            [
                'name' => $request->input('name'),
                'is_paid' => $request->boolean('is_paid', true),
            ]
        );

        return response()->json([
            'message' => $holiday->wasRecentlyCreated ? 'Festivo creado' : 'Festivo actualizado',
            'data' => $holiday,
        ], 201);
    }

    /**
     * DELETE /api/empresa/festivos/{id}
     * Elimina un festivo.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $user = $request->user();

        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Solo el administrador puede gestionar festivos'], 403);
        }

        $holiday = Holiday::where('empresa_id', $user->empresa_id)
            ->where('id', $id)
            ->firstOrFail();

        $holiday->delete();

        return response()->json([
            'message' => 'Festivo eliminado',
        ]);
    }

    /**
     * POST /api/empresa/festivos/cargar-mexico
     * Carga los 7 festivos oficiales de México para el año indicado (default año actual).
     */
    public function loadMexicoHolidays(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Solo el administrador puede gestionar festivos'], 403);
        }

        $year = $request->input('year', now()->year);

        $mexicoHolidays = [
            ['name' => 'Año Nuevo', 'month_day' => '01-01'],
            ['name' => 'Día de la Constitución', 'month_day' => '02-05'],
            ['name' => 'Natalicio de Benito Juárez', 'month_day' => '03-21'],
            ['name' => 'Día del Trabajo', 'month_day' => '05-01'],
            ['name' => 'Día de la Independencia', 'month_day' => '09-16'],
            ['name' => 'Día de la Revolución', 'month_day' => '11-20'],
            ['name' => 'Navidad', 'month_day' => '12-25'],
        ];

        $created = 0;
        $data = [];

        foreach ($mexicoHolidays as $h) {
            $date = "{$year}-{$h['month_day']}";

            $holiday = Holiday::updateOrCreate(
                [
                    'empresa_id' => $user->empresa_id,
                    'date' => $date,
                ],
                [
                    'name' => $h['name'],
                    'is_paid' => true,
                ]
            );

            if ($holiday->wasRecentlyCreated) {
                $created++;
            }

            $data[] = $holiday;
        }

        return response()->json([
            'message' => "{$created} festivos creados",
            'created' => $created,
            'data' => $data,
        ]);
    }
}
```

---

## 4. Rutas: `routes/api.php`

Agregar dentro del grupo autenticado (donde ya están `/empresa/settings`, `/empresa/modulos`, etc.):

```php
use App\Http\Controllers\Api\V1\HolidayController;

// ... rutas existentes ...

Route::middleware(['auth:sanctum'])->group(function () {
    // ... otras rutas ...

    // Festivos
    Route::get('/empresa/festivos', [HolidayController::class, 'index']);
    Route::post('/empresa/festivos', [HolidayController::class, 'store']);
    Route::delete('/empresa/festivos/{id}', [HolidayController::class, 'destroy']);
    Route::post('/empresa/festivos/cargar-mexico', [HolidayController::class, 'loadMexicoHolidays']);
});
```

---

## 5. Modificación en Asistencia: `AttendanceControllerV2`

### 5.1 Agregar `holiday` al enum de `status`

Si `status` está como string en la migración de `attendance_days`, modificar la migración (o crear una nueva si ya está en producción):

```bash
php artisan make:migration add_holiday_status_to_attendance_days_table
```

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Solo si usas enum. Si es string, no es estrictamente necesario,
        // pero es buena práctica validar en el modelo.
        // Alternativa: si usas CHECK constraint o enum en PostgreSQL:
        DB::statement("ALTER TABLE attendance_days MODIFY status ENUM('open','closed','day_off','present','late','holiday') DEFAULT 'open'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE attendance_days MODIFY status ENUM('open','closed','day_off','present','late') DEFAULT 'open'");
    }
};
```

> **Nota:** Si usas PostgreSQL, el enum se maneja diferente. En ese caso, simplemente asegúrate de que el modelo/validación acepte `"holiday"`.

### 5.2 Modificar el método `misHoy()` (o `checkIn()` + respuesta de hoy)

En el endpoint `GET /asistencia/mis-hoy`, antes de responder, verificar si hoy es festivo:

```php
use App\Models\Holiday;

// Dentro del método que responde /asistencia/mis-hoy
public function misHoy(Request $request)
{
    $user = $request->user();
    $empresaId = $user->empresa_id;
    $today = now()->toDateString();

    // Buscar si hoy es festivo
    $holiday = Holiday::where('empresa_id', $empresaId)
        ->where('date', $today)
        ->first();

    if ($holiday) {
        // Crear o actualizar el registro de asistencia como festivo
        $day = AttendanceDay::firstOrNew([
            'empresa_id' => $empresaId,
            'empleado_id' => $user->empleado->id,
            'date' => $today,
        ]);

        if (!$day->exists) {
            $day->status = 'holiday';
            $day->save();
        } elseif ($day->status !== 'holiday') {
            // Si ya existe con otro estado, no sobrescribir (podría ser un día que ya trabajó)
            // pero para el MVP, dejamos el estado existente y solo marcamos is_holiday en la respuesta.
        }

        return response()->json([
            'date' => $today,
            'is_rest_day' => false,
            'is_holiday' => true,
            'holiday_name' => $holiday->name,
            'state' => 'rest',
            'actions' => [
                'check_in' => false,
                'break_start' => false,
                'break_end' => false,
                'check_out' => false,
            ],
            'day' => $day->exists ? $day : [
                'id' => null,
                'empleado_id' => $user->empleado->id,
                'date' => $today,
                'status' => 'holiday',
                'first_check_in_at' => null,
                'last_check_out_at' => null,
            ],
            'totals' => null,
        ]);
    }

    // ... lógica existente de is_rest_day, check_in, etc. ...
}
```

### 5.3 Bloquear check-in en días festivos

En el método `checkIn()`:

```php
public function checkIn(Request $request)
{
    $user = $request->user();
    $empresaId = $user->empresa_id;
    $today = now()->toDateString();

    $isHoliday = Holiday::where('empresa_id', $empresaId)
        ->where('date', $today)
        ->exists();

    if ($isHoliday) {
        return response()->json([
            'message' => 'Hoy es día festivo. No se requiere asistencia.',
            'code' => 'HOLIDAY',
        ], 422);
    }

    // ... resto de la lógica existente ...
}
```

### 5.4 En el historial (`mis-dias` / `por-fecha`)

Asegurar que cuando se consulte el historial, los días con `status === 'holiday'` se incluyan correctamente en la respuesta. Normalmente esto ya funciona si el campo `status` tiene el valor `"holiday"` en la base de datos.

---

## 6. Modificación en Nómina: `PayrollController`

### 6.1 Agregar columna `holidays_paid` a `payroll_entries`

```bash
php artisan make:migration add_holidays_paid_to_payroll_entries_table
```

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payroll_entries', function (Blueprint $table) {
            $table->unsignedTinyInteger('holidays_paid')->default(0)->after('rest_days_paid');
        });
    }

    public function down(): void
    {
        Schema::table('payroll_entries', function (Blueprint $table) {
            $table->dropColumn('holidays_paid');
        });
    }
};
```

Ejecutar:
```bash
php artisan migrate
```

### 6.2 Modificar el modelo `PayrollEntry`

```php
// app/Models/PayrollEntry.php
protected $fillable = [
    // ... campos existentes ...
    'holidays_paid',
];

protected $casts = [
    // ... casts existentes ...
    'holidays_paid' => 'integer',
];
```

### 6.3 Modificar `computeEntry()` o `generatePeriod()` en `PayrollController`

Donde se calcula el `subtotal` y `rest_days_paid`, agregar el cálculo de festivos:

```php
use App\Models\Holiday;

// Dentro del método que genera la nómina semanal
private function computeEntry($empleado, $weekStart, $weekEnd, $empresaId): array
{
    // ... cálculos existentes de horas trabajadas, descansos, etc. ...

    // Contar festivos pagados en el período
    $holidaysInPeriod = Holiday::where('empresa_id', $empresaId)
        ->where('is_paid', true)
        ->whereBetween('date', [$weekStart, $weekEnd])
        ->count();

    $holidaysPaid = $holidaysInPeriod;

    // Cálculo del pago de festivos
    $holidayPay = 0;

    if ($holidaysPaid > 0) {
        if ($empleado->payment_type === 'daily') {
            $holidayPay = $holidaysPaid * $empleado->daily_rate;
        } elseif ($empleado->payment_type === 'hourly') {
            // Para empleados por hora, un festivo pagado = 8 horas × hourly_rate
            // o usar daily_rate si existe
            $ratePerDay = $empleado->daily_rate ?? ($empleado->hourly_rate * 8);
            $holidayPay = $holidaysPaid * $ratePerDay;
        }
    }

    $subtotal = /* cálculo existente de horas/días trabajados */ + $holidayPay;

    return [
        // ... campos existentes ...
        'rest_days_paid' => $restDaysPaid,
        'holidays_paid' => $holidaysPaid,
        'subtotal' => $subtotal,
        // ...
    ];
}
```

### 6.4 Asegurar que `holidays_paid` se incluya en la respuesta JSON

En el método que devuelve el período de nómina (`GET /nomina/periodos/semana`), verificar que `holidays_paid` se incluya en cada entry:

```php
// En el resource o array de respuesta:
return [
    'id' => $entry->id,
    'empleado_id' => $entry->empleado_id,
    'empleado_name' => $entry->empleado->full_name,
    'payment_type' => $entry->payment_type,
    'rate' => $entry->rate,
    'units' => $entry->units,
    'rest_days_paid' => $entry->rest_days_paid,
    'holidays_paid' => $entry->holidays_paid, // <-- NUEVO
    'tardiness_count' => $entry->tardiness_count,
    'absences_count' => $entry->absences_count,
    'penalty_active' => $entry->penalty_active,
    'subtotal' => $entry->subtotal,
    'adjustment_amount' => $entry->adjustment_amount,
    'bonus_amount' => $entry->bonus_amount,
    'total' => $entry->total,
];
```

---

## 7. Validación final (Checklist)

- [ ] `php artisan migrate` ejecutado sin errores.
- [ ] `GET /api/empresa/festivos` devuelve `[]` para empresa sin festivos.
- [ ] `POST /api/empresa/festivos` crea un festivo (requiere `role: admin`).
- [ ] `POST /api/empresa/festivos/cargar-mexico` crea 7 registros.
- [ ] Re-ejecutar `cargar-mexico` no duplica registros (idempotente).
- [ ] `DELETE /api/empresa/festivos/{id}` elimina correctamente.
- [ ] `GET /api/asistencia/mis-hoy` en día festivo devuelve `is_holiday: true` + `holiday_name`.
- [ ] `POST /api/asistencia/entrada` en día festivo devuelve 422 con código `HOLIDAY`.  
- [ ] Empleado `hourly` con festivo en la semana recibe `holidays_paid > 0` en nómina.
- [ ] Empleado `daily` con festivo en la semana recibe `holidays_paid > 0` en nómina.
- [ ] El `subtotal` de nómina incluye el pago del festivo.
- [ ] Frontend compila (`npm run build`) y muestra correctamente los festivos.

---

## 8. Notas importantes

1. **Timezone**: Todas las fechas deben manejarse en el timezone de la empresa (`America/Mexico_City`). Si aún no tienes timezone por empresa, usa `now()` de Laravel que ya está configurado.
2. **Soft deletes**: Si en el futuro agregas SoftDeletes a `Holiday`, asegúrate de que las consultas en asistencia y nómina respeten `whereNull('deleted_at')`.
3. **Auditoría**: Si usas `ActivityLogger`, agregar un log cuando se carguen festivos de México:
   ```php
   ActivityLogger::log($empresaId, $user->id, null, 'festivos.cargar_mexico', 'holiday', null, ['created' => $created], $request);
   ```
4. **Empleados sin tipo de pago**: Si un empleado no tiene `payment_type` configurado, asumir `hourly` con `hourly_rate = 0` o simplemente no pagar festivos (`holidayPay = 0`).
