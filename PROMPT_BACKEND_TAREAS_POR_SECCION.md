# Prompt Backend: Sistema de Tareas por Sección

## Contexto

Stack: **Laravel 11** + **Sanctum**

El frontend ya está implementado y espera que el backend soporte los siguientes cambios. El sistema actual tiene:

- `task_templates` — plantillas de tareas
- `task_routines` — rutinas que agrupan plantillas
- `tasks` — tareas instanciadas (asignaciones)
- `users` / `empleados` — usuarios con roles: `admin`, `supervisor`, `empleado`
- Catálogo diario (`/tareas/catalogo`) — devuelve plantillas activas según rutinas del día
- Jerarquía de asignación: Admin → todos, Supervisor → solo empleados

## 1. Migraciones Necesarias

### 1.1 `task_templates`
Agregar dos columnas:
```php
$table->string('section')->nullable()->after('priority');
$table->string('department')->nullable()->after('section');
```

### 1.2 `users` (o `empleados`, según donde guardes el perfil del supervisor)
Agregar una columna para la sección asignada al supervisor:
```php
$table->string('section')->nullable()->after('role');
```

> Nota: Si el supervisor ya tiene una relación con `empleado`, puede ir en `empleados.section`. El frontend lee `user.section` desde el token/endpoint de auth.

---

## 2. Modelos

### 2.1 `TaskTemplate`
Agregar al `$fillable`:
```php
'section',
'department',
```

### 2.2 `User` / `Empleado`
Agregar al `$fillable` (o `$appends` si es accessor):
```php
'section',
```

---

## 3. Endpoints a Modificar

### 3.1 `GET /task-templates`
**Agregar parámetro de query:** `?section=Carnicería`

Filtrar plantillas por sección cuando se reciba el parámetro.

**Response actual:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Limpiar área",
      "description": "...",
      "priority": "high",
      "estimated_minutes": 15,
      "section": "Carnicería",
      "department": "Operaciones",
      "is_active": true
    }
  ]
}
```

### 3.2 `GET /tareas/catalogo`
**Agregar parámetro de query:** `?section=Carnicería&date=2026-05-17`

Cuando el usuario es `supervisor` y no se envía `section`, **filtrar automáticamente** por `user->section`.

Cuando el usuario es `admin`, no filtrar por sección a menos que se envíe el parámetro explícito.

**Response actual:**
```json
{
  "date": "2026-05-17",
  "dow": 6,
  "routines": [...],
  "catalog": [
    {
      "routine_item_id": "uuid",
      "routine_id": "uuid",
      "routine_name": "Rutina Diaria",
      "template": {
        "id": "uuid",
        "title": "Verificar temperatura",
        "description": "...",
        "priority": "urgent",
        "section": "Carnicería",
        "department": "Operaciones",
        "meta": { "estimated_minutes": 10 }
      }
    }
  ]
}
```

> Importante: El frontend usa `(template as any).section` para filtrar. Asegúrate de que `section` venga dentro del objeto `template`.

### 3.3 `POST /task-templates`
Aceptar en el body:
```json
{
  "title": "...",
  "description": "...",
  "priority": "high",
  "section": "Carnicería",
  "department": "Operaciones",
  ...
}
```

### 3.4 `PATCH /task-templates/{id}`
Aceptar `section` y `department` en el payload.

---

## 4. Endpoint Nuevo

### 4.1 `GET /sections`
Devolver las secciones únicas existentes en la empresa para llenar dropdowns.

```json
{
  "data": [
    { "id": "carniceria", "name": "Carnicería", "department": "Operaciones" },
    { "id": "panaderia", "name": "Panadería", "department": "Operaciones" }
  ]
}
```

Puede ser un `SELECT DISTINCT section, department FROM task_templates WHERE empresa_id = ?`.

---

## 5. Validaciones de Negocio

### 5.1 Supervisor solo asigna de su sección
En los endpoints:
- `POST /tareas/{id}/asignar`
- `POST /tareas/crear-desde-catalogo-bulk`
- `POST /task-routines/{id}/assign`

Si el usuario autenticado es `supervisor`:
1. Obtener `user->section`
2. Verificar que la tarea/plantilla/rutina pertenezca a esa sección
3. Si no coincide, devolver **403**:
```json
{ "message": "No puedes asignar tareas de otra sección. Tu sección asignada es: Carnicería" }
```

### 5.2 Admin puede asignar cualquier sección
Sin restricciones.

---

## 6. Auth / Perfil del Supervisor

Asegurar que el endpoint que devuelve el usuario autenticado (login / me) incluya `section`:

```json
{
  "id": "uuid",
  "name": "Juan Pérez",
  "email": "juan@ejemplo.com",
  "role": "supervisor",
  "section": "Carnicería",
  "empresa_id": "uuid"
}
```

El frontend lee `user.section` desde `useAuthStore((s) => s.user)`.

---

## 7. Asignación Múltiple (ya existe, verificar compatibilidad)

El endpoint `POST /tareas/crear-desde-catalogo-bulk` ya existe. El frontend lo usa para asignar múltiples plantillas:

```json
{
  "date": "2026-05-17",
  "template_ids": ["uuid1", "uuid2"],
  "empleado_ids": ["uuid-empleado"],
  "allow_duplicate": false
}
```

Solo agregar validación de sección (punto 5.1).

---

## Checklist de Implementación

- [ ] Migración `task_templates` (+ `section`, `department`)
- [ ] Migración `users` o `empleados` (+ `section` para supervisores)
- [ ] `TaskTemplate` model: `section` y `department` en `$fillable`
- [ ] `GET /task-templates?section=X` filtra por sección
- [ ] `GET /tareas/catalogo?section=X` filtra por sección
- [ ] `POST /task-templates` acepta `section` y `department`
- [ ] `PATCH /task-templates/{id}` acepta `section` y `department`
- [ ] `GET /sections` endpoint nuevo
- [ ] Auth / me devuelve `section` del usuario
- [ ] Validación: supervisor solo asigna tareas de su sección
- [ ] Pruebas con Postman o similar

---

## Notas para el Dev Backend

- Los campos son **strings** por ahora (Opción C del plan: híbrida). El frontend ya maneja el tipo `string | null`.
- No es necesario crear una tabla `sections` todavía. Un `SELECT DISTINCT` es suficiente para el endpoint `/sections`.
- Si prefieres hacer la tabla `sections` desde el inicio, adelante — solo avisa al frontend para ajustar los tipos a `{ id, name, department }`.
- El build del frontend actual (`main` branch) ya está preparado para recibir estos campos. Una vez deployado el backend, todo debe funcionar sin cambios adicionales en frontend.
