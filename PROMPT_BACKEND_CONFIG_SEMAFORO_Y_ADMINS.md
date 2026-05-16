# Prompt para Backend: Configuración Semáforo + Administradores en Reportes

> Este prompt debe ejecutarse en el proyecto backend de Kore (Laravel). El frontend ya está implementado y espera estos endpoints exactos.

---

## 1. Incluir Administradores en Reporte de Asistencia Semanal

### Endpoint existente (modificar)
```
GET /api/v1/reportes/asistencia-semanal
```

### Nuevo Query Parameter
| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `incluir_admins` | boolean | `false` | Si es `true`, incluir empleados con rol `admin` en el reporte |

### Lógica a modificar
1. El endpoint ya filtra empleados por `empleado_ids` si se envía.
2. **Nuevo comportamiento**: Si NO se envía `empleado_ids` (reporte de todos) y `incluir_admins=false` (default), excluir del query los usuarios cuyo `role === 'admin'` o `role === 'superadmin'`.
3. Si `incluir_admins=true`, NO aplicar el filtro de rol. Incluir TODOS los empleados activos.
4. Si se envía `empleado_ids` (selección específica), respetar esa lista sin importar el valor de `incluir_admins`.

### Ejemplo de uso desde frontend
```
GET /api/v1/reportes/asistencia-semanal?from=2026-05-10&to=2026-05-16&incluir_admins=true
```

---

## 2. Configuración del Semáforo (Persistencia en Backend)

> **Contexto**: Actualmente la configuración del semáforo (criterios de evaluación, pesos, umbrales de colores) se guarda en `localStorage` del navegador. Esto causa que:
> - Cada dispositivo tenga su propia configuración
> - Al limpiar caché se pierde la config
> - Los admins no pueden compartir la misma configuración
>
> **Solución**: Mover la config al backend con endpoints CRUD.

### 2.1 Migración: Crear tabla `semaforo_configs`

```php
Schema::create('semaforo_configs', function (Blueprint $table) {
    $table->id();
    $table->foreignId('created_by')->constrained('users');
    $table->json('criterios_admin');       // Array de {key, label}
    $table->json('criterios_peer');        // Array de {key, label, icon}
    $table->unsignedTinyInteger('peso_admin')->default(70);
    $table->unsignedTinyInteger('peso_peer')->default(30);
    $table->unsignedTinyInteger('umbral_verde')->default(80);
    $table->unsignedTinyInteger('umbral_amarillo')->default(60);
    $table->timestamps();
});
```

> **Nota**: Solo debe existir **una fila activa** por empresa. Se puede usar `created_by` para saber quién modificó por última vez, o agregar `company_id` si el sistema es multi-tenant.

### 2.2 Endpoint: Obtener Configuración

```
GET /api/v1/semaforo/config
```

### Response 200 OK
```json
{
  "criterios_admin": [
    { "key": "puntualidad", "label": "Puntualidad" },
    { "key": "asistencia", "label": "Asistencia" },
    { "key": "productividad", "label": "Productividad" },
    { "key": "calidad", "label": "Calidad de trabajo" },
    { "key": "disciplina", "label": "Disciplina" },
    { "key": "proactividad", "label": "Proactividad" },
    { "key": "trabajo_equipo", "label": "Trabajo en equipo" },
    { "key": "cumplimiento", "label": "Cumplimiento de normas" }
  ],
  "criterios_peer": [
    { "key": "cooperacion", "label": "Cooperación", "icon": "Handshake" },
    { "key": "comunicacion", "label": "Comunicación", "icon": "MessageCircle" },
    { "key": "responsabilidad", "label": "Responsabilidad", "icon": "Shield" },
    { "key": "apoyo", "label": "Apoyo al equipo", "icon": "Heart" }
  ],
  "peso_admin": 70,
  "peso_peer": 30,
  "umbral_verde": 80,
  "umbral_amarillo": 60,
  "updated_at": "2026-05-16T12:00:00Z"
}
```

### Response 404 (sin config guardada aún)
```json
{
  "criterios_admin": [
    { "key": "puntualidad", "label": "Puntualidad" },
    { "key": "asistencia", "label": "Asistencia" },
    { "key": "productividad", "label": "Productividad" },
    { "key": "calidad", "label": "Calidad de trabajo" },
    { "key": "disciplina", "label": "Disciplina" },
    { "key": "proactividad", "label": "Proactividad" },
    { "key": "trabajo_equipo", "label": "Trabajo en equipo" },
    { "key": "cumplimiento", "label": "Cumplimiento de normas" }
  ],
  "criterios_peer": [
    { "key": "cooperacion", "label": "Cooperación", "icon": "Handshake" },
    { "key": "comunicacion", "label": "Comunicación", "icon": "MessageCircle" },
    { "key": "responsabilidad", "label": "Responsabilidad", "icon": "Shield" },
    { "key": "apoyo", "label": "Apoyo al equipo", "icon": "Heart" }
  ],
  "peso_admin": 70,
  "peso_peer": 30,
  "umbral_verde": 80,
  "umbral_amarillo": 60
}
```
> Si no hay config guardada, devolver los **valores por defecto** (misma estructura, sin `updated_at`).

### 2.3 Endpoint: Guardar/Actualizar Configuración

```
POST /api/v1/semaforo/config
```

### Request Body
```json
{
  "criterios_admin": [
    { "key": "puntualidad", "label": "Puntualidad" }
  ],
  "criterios_peer": [
    { "key": "cooperacion", "label": "Cooperación", "icon": "Handshake" }
  ],
  "peso_admin": 70,
  "peso_peer": 30,
  "umbral_verde": 80,
  "umbral_amarillo": 60
}
```

### Validaciones
- `criterios_admin`: array, mínimo 1 elemento, cada item debe tener `key` (string, snake_case) y `label` (string, max 50 chars)
- `criterios_peer`: array, mínimo 1 elemento, cada item debe tener `key`, `label`, y `icon` (string, nombre de icono Lucide)
- `peso_admin` + `peso_peer` debe sumar **exactamente 100**
- `peso_admin`, `peso_peer`: integer, 0-100
- `umbral_verde`: integer, 0-100, debe ser **mayor** que `umbral_amarillo`
- `umbral_amarillo`: integer, 0-100

### Response 200 OK
```json
{
  "message": "Configuración guardada correctamente",
  "config": { /* objeto config completo */ }
}
```

### Response 422 (validación fallida)
```json
{
  "message": "Los pesos deben sumar 100",
  "errors": {
    "peso_admin": ["peso_admin + peso_peer debe sumar 100"]
  }
}
```

### Middleware
- Solo usuarios con rol `admin` o `superadmin` pueden modificar.
- Cualquier usuario autenticado puede leer (GET).

---

## 3. Peer Evaluations — Endpoint de Compañeros

### Endpoint existente (verificar/ajustar)
```
GET /api/v1/semaforo/companeros
```

### Response esperado por el frontend
```json
{
  "companeros": [
    {
      "id": "123",
      "nombre": "Juan Pérez",
      "position_title": "Ayudante General",
      "avatar_url": null
    }
  ],
  "progress": {
    "evaluados": 2,
    "total": 5
  }
}
```

### Lógica requerida
1. Obtener el `employee_id` del usuario autenticado (no el `user_id`, sino el perfil de empleado asociado).
2. Buscar empleados del **mismo departamento/área** que el usuario logueado.
3. **Excluir** al empleado logueado de la lista (no puede evaluarse a sí mismo).
4. Solo incluir empleados con `status = 'active'`.
5. Para cada compañero, determinar si ya fue evaluado por el usuario logueado en el **periodo de evaluación actual** (semana/mes actual, según la lógica de negocio).
6. `progress.evaluados` = cantidad de compañeros ya evaluados.
7. `progress.total` = cantidad total de compañeros encontrados.

---

## Resumen de cambios a realizar en el backend

| # | Cambio | Prioridad |
|---|--------|-----------|
| 1 | Agregar `incluir_admins` a `GET /reportes/asistencia-semanal` | **Alta** (ya hay checkbox en frontend) |
| 2 | Crear migración `semaforo_configs` | Media |
| 3 | Implementar `GET /semaforo/config` | Media |
| 4 | Implementar `POST /semaforo/config` | Media |
| 5 | Verificar `GET /semaforo/companeros` devuelve `progress` y excluye al usuario actual | Media |
