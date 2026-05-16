# Prompt para Backend: Cierre Masivo de Jornada + Módulo de Reportes

> Este prompt debe ejecutarse en el proyecto backend de Kore (Laravel). El frontend ya está implementado y espera estos endpoints exactos.

---

## 1. Cierre Masivo de Jornada

### Endpoint
```
POST /api/v1/asistencia/cerrar-masivo
```

### Request Body
```json
{
  "date": "2026-05-16",
  "motivo": "Cierre de turno por fin de jornada laboral"
}
```

### Lógica
1. Validar que `date` sea una fecha válida.
2. Buscar todos los registros de `attendance_days` (o tabla equivalente) donde:
   - `date = $date`
   - `first_check_in_at IS NOT NULL`
   - `last_check_out_at IS NULL`
   - `status != 'day_off'`
   - `status != 'holiday'`
3. Para cada registro encontrado:
   - `last_check_out_at = now()` (hora actual del servidor)
   - `status = 'closed'`
   - `admin_closed = true`
   - `admin_closed_by = auth()->id()` (ID del admin que cerró)
   - `admin_closed_reason = $motivo`
   - `updated_at = now()`
4. Registrar en log/auditoría (si existe tabla de auditoría).

### Response 200 OK
```json
{
  "message": "Se cerraron 5 jornadas correctamente",
  "closed_count": 5,
  "employees": ["Juan Pérez", "María García", "..."]
}
```

### Response 422 (sin empleados en turno)
```json
{
  "message": "No hay empleados en turno para cerrar en esta fecha"
}
```

### Response 403
```json
{
  "message": "No tienes permisos para realizar esta acción"
}
```

---

## 2. Reporte de Asistencia Semanal (Matriz)

### Endpoint
```
GET /api/v1/reportes/asistencia-semanal
```

### Query Parameters
| Param | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `from` | string (YYYY-MM-DD) | Sí | Fecha inicio (domingo preferente) |
| `to` | string (YYYY-MM-DD) | Sí | Fecha fin (sábado preferente) |
| `empleado_ids` | string (csv) | No | Filtrar por empleados específicos. Ej: "1,2,3". Si no se envía, todos. |
| `incluir_retardos` | boolean | No | Incluir info de retardos |
| `incluir_tiempos_comida` | boolean | No | Incluir tiempos de comida |

### Lógica
1. Validar que `from` <= `to`.
2. Si no se envían `empleado_ids`, usar todos los empleados activos (`is_active = true` y `role = 'empleado'`).
3. Para cada empleado, obtener todos sus registros de asistencia en el rango de fechas.
4. Agrupar por día de la semana (domingo a sábado).
5. Para cada día, determinar el estado:
   - Si `status = 'day_off'` → `"descanso"`
   - Si `status = 'holiday'` → `"festivo"`
   - Si `first_check_in_at IS NULL` → `"falta"`
   - Si `first_check_in_at IS NOT NULL AND last_check_out_at IS NOT NULL` → `"presente"`
   - Si `first_check_in_at IS NOT NULL AND last_check_out_at IS NULL` → `"en_turno"`
   - Si hay registro de retardo para ese día → `"retardo"` (puede coexistir con presente)
   - Si hay solicitud de vacaciones aprobada → `"vacaciones"`
   - Si hay solicitud de incapacidad aprobada → `"incapacidad"`
   - Prioridad: vacaciones > incapacidad > festivo > descanso > falta > retardo > presente > en_turno
6. Calcular `horas_trabajadas` en minutos (`last_check_out_at - first_check_in_at - break_minutes - lunch_minutes`).
7. Obtener `tiempo_comida_minutos` si aplica.
8. Calcular total de horas del empleado en la semana.
9. Calcular total de retardos.

### Response 200 OK
```json
{
  "semana": 20,
  "anio": 2026,
  "rango": {
    "desde": "2026-05-10",
    "hasta": "2026-05-16"
  },
  "filas": [
    {
      "empleado": {
        "id": "1",
        "nombre": "Juan Pérez",
        "comida_hora": "13:00:00",
        "position_title": "Cajero"
      },
      "dias": {
        "domingo": {
          "dia": "domingo",
          "fecha": "2026-05-10",
          "entrada": null,
          "salida": null,
          "estado": "descanso",
          "horas_trabajadas": 0,
          "tiempo_comida_minutos": 0
        },
        "lunes": {
          "dia": "lunes",
          "fecha": "2026-05-11",
          "entrada": "2026-05-11T08:30:00",
          "salida": "2026-05-11T17:00:00",
          "estado": "presente",
          "horas_trabajadas": 480,
          "tiempo_comida_minutos": 30
        },
        "martes": {
          "dia": "martes",
          "fecha": "2026-05-12",
          "entrada": null,
          "salida": null,
          "estado": "falta",
          "horas_trabajadas": 0,
          "tiempo_comida_minutos": 0
        },
        "miércoles": {
          "dia": "miércoles",
          "fecha": "2026-05-13",
          "entrada": "2026-05-13T08:45:00",
          "salida": "2026-05-13T17:02:00",
          "estado": "retardo",
          "horas_trabajadas": 497,
          "tiempo_comida_minutos": 30
        },
        "jueves": null,
        "viernes": null,
        "sábado": null
      },
      "total_horas": 977,
      "total_retardos": 1
    }
  ]
}
```

**Notas importantes:**
- `entrada` y `salida` deben ser timestamps ISO 8601 completos (ej: `2026-05-11T08:30:00`) o `null`.
- Los días sin datos deben venir como `null` (no omitidos).
- `comida_hora` es el horario configurado de comida del empleado (puede venir de `meal_schedules` o similar).
- `total_horas` en minutos.

---

## 3. Reporte por Empleado

### Endpoint
```
GET /api/v1/reportes/empleado/{empleado_id}
```

### Query Parameters
| Param | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `from` | string (YYYY-MM-DD) | Sí | Fecha inicio |
| `to` | string (YYYY-MM-DD) | Sí | Fecha fin |
| `incluir_retardos` | boolean | No | Incluir info de retardos |
| `incluir_tiempos_comida` | boolean | No | Incluir tiempos de comida |

### Lógica
1. Validar que el empleado existe y pertenece a la empresa del admin.
2. Obtener todos los registros de asistencia del empleado en el rango.
3. Calcular resumen:
   - `dias_trabajados`: días con entrada y salida
   - `dias_faltas`: días sin entrada (y no es descanso/festivo/vacaciones)
   - `dias_descanso`: días con `status = 'day_off'`
   - `total_horas`: suma de minutos trabajados
   - `total_retardos`: cantidad de días con retardo
   - `promedio_comida_minutos`: promedio de tiempo de comida
4. Devolver detalle día por día ordenado cronológicamente.

### Response 200 OK
```json
{
  "empleado": {
    "id": "1",
    "nombre": "Juan Pérez",
    "position_title": "Cajero",
    "hired_at": "2024-01-15"
  },
  "periodo": {
    "desde": "2026-05-01",
    "hasta": "2026-05-31"
  },
  "resumen": {
    "dias_trabajados": 22,
    "dias_faltas": 2,
    "dias_descanso": 8,
    "total_horas": 10560,
    "total_retardos": 3,
    "promedio_comida_minutos": 32
  },
  "detalle": [
    {
      "fecha": "2026-05-01",
      "entrada": "2026-05-01T08:30:00",
      "salida": "2026-05-01T17:00:00",
      "estado": "presente",
      "horas_trabajadas": 480,
      "tiempo_comida_minutos": 30,
      "retardos_minutos": null
    },
    {
      "fecha": "2026-05-02",
      "entrada": null,
      "salida": null,
      "estado": "falta",
      "horas_trabajadas": 0,
      "tiempo_comida_minutos": 0,
      "retardos_minutos": null
    }
  ]
}
```

### Estados posibles para `detalle.estado`
Los mismos que para el reporte semanal:
`"presente" | "falta" | "descanso" | "vacaciones" | "incapacidad" | "festivo" | "retardo" | "en_turno" | "ausente"`

---

## Migraciones sugeridas

### Tabla `attendance_days` (o equivalente)
Agregar columnas si no existen:
```php
$table->boolean('admin_closed')->default(false);
$table->foreignId('admin_closed_by')->nullable()->constrained('users');
$table->text('admin_closed_reason')->nullable();
```

---

## Consideraciones de seguridad
- Todos los endpoints deben requerir autenticación (Sanctum).
- Solo usuarios con rol `admin` o `supervisor` pueden acceder.
- Para el endpoint de empleado, verificar que el empleado pertenezca a la misma empresa que el usuario autenticado (si aplica multi-tenancy).

## Tests sugeridos
- Cerrar jornada masiva con 0 empleados en turno → 422.
- Cerrar jornada masiva con 3 empleados en turno → 200, verificar que todos quedan `status=closed`.
- Reporte semanal sin empleado_ids → incluye todos los activos.
- Reporte semanal con rango inválido (from > to) → 422.
- Reporte por empleado de otro usuario → 403.
