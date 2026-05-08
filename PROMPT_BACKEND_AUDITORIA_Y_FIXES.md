# PROMT PARA AUDITORIA Y FIXES DEL BACKEND KORE

> Este documento es un contexto completo para ejecutar fixes de seguridad, arquitectura y calidad en el backend Laravel de Kore Ops Suite. Fue generado cruzando el analisis del backend con el analisis del frontend para garantizar coherencia entre ambos lados.

---

## 1. STACK TECNICO CONFIRMADO

- **Framework:** Laravel 12 (PHP 8.2)
- **Autenticacion:** Laravel Sanctum
- **Base de datos:** MySQL/PostgreSQL (session driver = database)
- **Storage:** Amazon S3 (archivos no se guardan en public/)
- **Notificaciones:** Firebase Cloud Messaging (FCM) + Resend (emails)
- **Frontend asociado:** React 19 + Vite + Capacitor (app hibrida Android/iOS) + PWA
- **Entorno de produccion:** Railway (URL expuesta en frontend)

---

## 2. PROBLEMAS CRITICOS DE SEGURIDAD (P0 - Corregir HOY)

### 2.1 APP_KEY vacia
- **Archivo:** `.env` linea 3
- **Riesgo:** Sin esta clave, la encriptacion de sesiones, cookies y tokens de Laravel es inexistente o usa valores predeterminados inseguros.
- **Accion:** Ejecutar `php artisan key:generate` inmediatamente. En produccion, rotar la clave y forzar relogueo de todos los usuarios.

### 2.2 API Keys expuestas en el repositorio
- **Archivos:** `.env` (RESEND_API_KEY), `README_BIENVENIDA_BACKEND.md`, `README_NOTIFICACIONES_BACKEND.md` (FIREBASE_VAPID_KEY + FIREBASE_CREDENTIALS JSON completo)
- **Riesgo:** Cualquiera con acceso al repo puede enviar emails como tu dominio, enviar notificaciones push o acceder a tu proyecto Firebase.
- **Accion:**
  1. Rotar TODAS estas claves AHORA en los dashboards de Resend y Firebase.
  2. Eliminar estos valores de los READMEs y del `.env` commiteado.
  3. Si ya estan en historial de Git, usar `git-filter-repo` o BFG para eliminarlos del historial.

### 2.3 EvidenciasController permite subir CUALQUIER archivo
- **Archivo:** `app/Http/Controllers/Api/V1/EvidencesController.php:23-24`
- **Riesgo:** Un atacante puede subir `.php`, `.exe`, `.sh`, etc. y potencialmente ejecutar codigo en el servidor o en S3 si hay alguna misconfiguracion.
- **Accion:** Agregar validacion estricta:
  ```php
  'file' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf,mp4,webm', 'max:10240']
  ```

### 2.4 Tokens de Sanctum NUNCA expiran
- **Archivo:** `config/sanctum.php:15` -> `'expiration' => null`
- **Riesgo:** Si un token se filtra (dispositivo robado, interceptacion, XSS en frontend), es valido para siempre a menos que se borre manualmente de la BD.
- **Accion:** Definir expiracion razonable:
  ```php
  'expiration' => 60 * 24 * 30, // 30 dias
  ```
  - **Nota importante:** El frontend actualmente almacena el token en `localStorage` (peor escenario). Mientras no migres a cookies, al menos con expiracion el dano de un token robado es limitado en tiempo.

### 2.5 APP_DEBUG=true en .env versionado
- **Archivo:** `.env`
- **Riesgo:** Stack traces exponen rutas del servidor, nombres de tablas, variables de entorno y estructura interna.
- **Accion:** Cambiar a `APP_DEBUG=false` en el `.env` que esta en el repo. En produccion, usar variables de entorno del servidor.

---

## 3. PROBLEMAS DE ARQUITECTURA (P1 - Esta semana)

### 3.1 No existen Form Requests
- **Problema:** Toda la validacion esta en los controladores. `ActivityLogsController`, `DashboardController` y `TardinessReportController` ni siquiera validan en algunos metodos.
- **Accion:** Crear Form Requests (`php artisan make:request StoreUserRequest`). Separar validacion de logica y centralizar reglas complejas.

### 3.2 No existen API Resources
- **Problema:** Los modelos se serializan directamente (`return response()->json($gondola)`). Esto expone todos los campos del modelo.
- **Ejemplo grave:** `Empresa` no tiene `$hidden`, por lo que expone `settings`, `documentos` y `allowed_ip` en cualquier respuesta JSON.
- **Accion:**
  1. Crear Resources para cada entidad (`php artisan make:resource GondolaResource`).
  2. Agregar `protected $hidden = ['settings', 'documentos', 'allowed_ip'];` al modelo `Empresa`.
  3. Definir explicitamente que campos se exponen en cada endpoint.

### 3.3 Controladores monoliticos (violacion grave de SRP)
| Controlador | Lineas | Problema |
|-------------|--------|----------|
| `AttendanceControllerV2` | 1,221 | Check-in/out, pausas, comidas, ajustes admin, descansos, calculos, notificaciones, validacion de red... todo en uno |
| `TasksController` | 922 | CRUD, asignaciones, notificaciones, logica de permisos |
| `PayrollController` | 566 | Calculo de nomina, generacion de periodos, aprobaciones, recalculos |
| `SemaforoController` | 548 | Evaluaciones, calculos de metricas, rankings |

- **Accion:** Extraer logica de negocio a Services:
  - `PayrollService` para calculos de nomina
  - `AttendanceService` para calculos de asistencia
  - `TaskService` para logica de asignaciones

### 3.4 Autorizacion por rol copy-pasteada 40+ veces
- **Patron repetido:**
  ```php
  if (!in_array($u->role, ['admin','supervisor'])) {
      return response()->json(['message'=>'No autorizado'], 403);
  }
  ```
- **Problema:** Si cambias un rol o agregas uno nuevo, debes editar decenas de archivos. Es muy propenso a errores.
- **Accion:** Crear `RoleMiddleware` o usar Policies/Gates de Laravel:
  ```php
  // En rutas
  Route::middleware(['role:admin,supervisor'])->...
  // O en controller
  $this->authorize('manage-tasks');
  ```

### 3.5 No hay Jobs ni Queues
- **Problema:** Notificaciones push y emails se envian sincronicamente dentro del request HTTP. Si tienes 50 tokens FCM, el usuario espera 50 requests HTTP a Firebase.
- **Accion:** Crear jobs para:
  - `SendPushNotification`
  - `SendWelcomeEmail`
  - Procesamiento de nomina masiva
  - Despacharlos con `dispatch()` o `dispatchSync()`.

### 3.6 Problemas N+1 Query
- **Ubicaciones:**
  - `SemaforoController::index()` -> carga `EmployeeEvaluation` uno por uno dentro de un `map()`
  - `UsersController::index()` -> carga `Empleado` uno por usuario
  - `AttendanceControllerV2` -> multiples lugares
- **Accion:** Usar eager loading (`with()`) o `cursor()` para iteraciones grandes.

---

## 4. PROBLEMAS MEDIOS (P2 - Mejoras recomendadas)

### 4.1 Exposicion de detalles de errores al cliente
- **Archivo:** `UsersController.php:182-185`
  ```php
  } catch (\Throwable $e) {
      return response()->json(['message' => 'Error', 'detail' => $e->getMessage()], 500);
  }
  ```
- **Riesgo:** `$e->getMessage()` puede filtrar paths, queries SQL o nombres de tabla.
- **Accion:** En produccion, loguear el error internamente y devolver un mensaje generico.

### 4.2 Cookies de sesion inseguras
- **Ubicacion:** `.env` tiene `SESSION_ENCRYPT=false` y `SESSION_SECURE_COOKIE` no esta definido.
- **Accion:** En produccion:
  ```env
  SESSION_ENCRYPT=true
  SESSION_SECURE_COOKIE=true
  ```

### 4.3 CORS muy permisivo
- **Archivo:** `config/cors.php`
  ```php
  'allowed_methods' => ['*'],
  'allowed_headers' => ['*'],
  ```
- **Accion:** Restringir a los metodos que realmente usas (`GET, POST, PUT, PATCH, DELETE`).

### 4.4 Uso de `env()` en codigo de aplicacion
- **Archivo:** `app/Services/NotificationService.php:30-32`
- **Problema:** Si cacheas configuracion (`php artisan config:cache`), `env()` devuelve `null`.
- **Accion:** Leer siempre desde `config('services.firebase...')`.

### 4.5 No hay AuthServiceProvider ni Policies
- **Ubicacion:** `app/Providers/` solo tiene `AppServiceProvider.php`
- **Problema:** No hay autorizacion centralizada. Cada controlador inventa su propia logica.
- **Accion:** Crear `AuthServiceProvider` y definir policies para recursos clave (`User`, `Empleado`, `Task`, `PayrollPeriod`).

### 4.6 No hay Eventos/Listeners
- **Problema:** Las notificaciones estan acopladas directamente a los controladores (`TasksController::assign()` llama a `NotificationService` directamente).
- **Accion:** Usar el bus de eventos de Laravel para desacoplar:
  ```php
  event(new TaskAssigned($task));
  // El listener se encarga de la notificacion
  ```

---

## 5. PUNTOS DE CRUCE CON EL FRONTEND (COORDINACION NECESARIA)

### 5.1 AUTENTICACION: Migracion de Bearer tokens a cookies httpOnly
**Estado actual:**
- Frontend guarda token JWT en `localStorage` (vulnerable a XSS)
- Backend usa Sanctum con tokens Bearer que nunca expiran

**Problema:** Esta es la combinacion mas insegura posible. Un XSS en el frontend roba el token, y como nunca expira, el atacante tiene acceso permanente.

**Decision arquitectonica requerida:**
- **Opcion A (Recomendada):** Migrar a modo SPA de Sanctum (cookies httpOnly + CSRF)
  - Backend: Configurar `SANCTUM_STATEFUL_DOMAINS`, `SESSION_DRIVER=database`, `supports_credentials => true` en CORS
  - Backend: Eliminar respuesta de `token` en login, confiar en cookies de sesion
  - Frontend: Eliminar header `Authorization: Bearer`, eliminar Zustand persist del token, confiar en `withCredentials: true`
  - Frontend: Manejar CSRF cookie con `GET /sanctum/csrf-cookie` antes de login (ya lo hace parcialmente)

- **Opcion B (Parche rapido):** Si no se puede migrar a cookies ahora:
  - Backend: Agregar expiracion a tokens (30 dias minimo)
  - Frontend: Mover token de `localStorage` a `sessionStorage` (se borra al cerrar pestana)
  - Frontend: Implementar refresh token rotation

**Accion inmediata:** Al menos implementar la expiracion de tokens (P0) mientras se decide la migracion.

### 5.2 VALIDACION DE ARCHIVOS SUBIDOS
**Estado actual:**
- Backend: `EvidencesController` solo valida `'file' => 'required'`
- Frontend: `EvidenciaUploader.tsx` solo tiene `accept="image/*"` (bypassable)

**Accion coordinada:**
- Backend: `'file' => ['required','file','mimes:jpg,jpeg,png,pdf,mp4,webm','max:10240']`
- Frontend: Validar MIME real con `file.type` y tamano maximo antes de enviar

### 5.3 TIPADO DE DATOS: Resources vs any[]
**Estado actual:**
- Backend: No hay API Resources, devuelve modelos completos
- Frontend: 212 usos de `any` en 51 archivos

**Accion coordinada:**
- Backend: Crear Resources que definan EXACTAMENTE que campos se devuelven
- Frontend: Crear interfaces TypeScript que mapeen esos Resources
- Esto elimina `as any` y previene filtrado de datos sensibles

### 5.4 NOTIFICACIONES PUSH
**Estado actual:**
- Backend: Envio sincronico de 50+ requests FCM dentro del request HTTP
- Frontend: Firebase API key y VAPID key hardcodeadas en codigo fuente

**Accion coordinada:**
- Backend: Crear `SendPushNotification` Job y despachar con `dispatch()`
- Frontend: Mover VAPID key a variable de entorno
- Frontend: El service worker necesita inyeccion de variables en build time

### 5.5 MANEJO DE ERRORES Y EXCEPCIONES
**Estado actual:**
- Backend: Algunos controllers devuelven `$e->getMessage()` al cliente
- Frontend: 15+ `catch { /* silent */ }` que tragan errores sin avisar al usuario

**Accion coordinada:**
- Backend: Estandarizar formato de errores:
  ```json
  {
    "message": "Error descriptivo para el usuario",
    "error_code": "TASK_NOT_FOUND",
    "details": { "field": "reason" }
  }
  ```
- Frontend: Interceptar errores con el sistema de eventos `kore-error` y mostrar toast/notificacion

---

## 6. PLAN DE ACCION RECOMENDADO

### Fase 1: Seguridad critica (Hoy - 1 hora)
1. [ ] Rotar RESEND_API_KEY y FIREBASE_VAPID_KEY
2. [ ] `php artisan key:generate` y mover `.env` fuera del repo
3. [ ] Agregar validacion de `mimes` en `EvidencesController`
4. [ ] Agregar expiracion a tokens de Sanctum
5. [ ] `APP_DEBUG=false`
6. [ ] `SESSION_ENCRYPT=true` + `SESSION_SECURE_COOKIE=true`

### Fase 2: Arquitectura (Esta semana - 2-3 dias)
7. [ ] Crear `RoleMiddleware` para centralizar autorizacion
8. [ ] Crear API Resources y agregar `$hidden` a `Empresa`
9. [ ] Extraer `PayrollService`, `AttendanceService`, `TaskService`
10. [ ] Crear Jobs para notificaciones y emails
11. [ ] Crear Form Requests para validacion centralizada

### Fase 3: Calidad y performance (Proxima semana - 2-3 dias)
12. [ ] Fix N+1 queries con eager loading
13. [ ] Eliminar `$e->getMessage()` de respuestas JSON
14. [ ] Crear `AuthServiceProvider` + Policies
15. [ ] Implementar Eventos/Listeners para desacoplar notificaciones
16. [ ] Restringir CORS a metodos/headers reales

---

## 7. BUENAS PRACTICAS QUE SI TIENES (mantener)

- Mass assignment protegido: Todos los modelos usan `$fillable`, ninguno tiene `$guarded = []`
- SQL Injection controlado: Los `whereRaw` usan bindings parametrizados (`?`)
- Laravel moderno: Laravel 12 y PHP 8.2
- Rate limiting basico: Login y registro tienen throttling
- Transacciones de BD: Se usan en operaciones multi-tabla
- Session driver = database: Mejor que file para entornos multi-servidor
- Archivos se guardan en S3: No hay almacenamiento directo en `public/` detectado

---

## 8. NOTAS TECNICAS PARA EL AGENTE

### Decisiones que afectan al frontend
- **Si migras a cookies httpOnly:** El frontend necesita eliminar el interceptor de `Authorization: Bearer` y el `authStore` dejara de persistir el token. El login seguira funcionando igual pero la cookie manejara la sesion.
- **Si creas API Resources:** Comparte la estructura de los Resources con el frontend para que generen las interfaces TypeScript correspondientes.
- **Si cambias el formato de errores:** Avisar al frontend para que actualice el interceptor de Axios en `src/lib/http.ts`.
- **Si implementas Jobs:** Los endpoints que antes tardaban por enviar notificaciones ahora responderan mas rapido. El frontend no necesita cambios, pero mejora la UX.

### Variables de entorno que deben configurarse
```env
# Seguridad
APP_KEY=base64:GENERADA_POR_ARTISAN
APP_DEBUG=false
SESSION_ENCRYPT=true
SESSION_SECURE_COOKIE=true

# Sanctum
SANCTUM_STATEFUL_DOMAINS=kore-frontend-url.com,localhost:5173
SANCTUM_TOKEN_PREFIX=

# CORS (ejemplo restrictivo)
CORS_ALLOWED_METHODS=GET,POST,PUT,PATCH,DELETE
CORS_ALLOWED_HEADERS=Content-Type,X-Requested-With,Authorization,X-XSRF-TOKEN
CORS_SUPPORTS_CREDENTIALS=true

# Firebase (NO commitear, usar variables de servidor)
FIREBASE_VAPID_KEY=DESDE_VARIABLE_ENTORNO
FIREBASE_CREDENTIALS_JSON=DESDE_VARIABLE_ENTORNO

# Resend (NO commitear)
RESEND_API_KEY=DESDE_VARIABLE_ENTORNO
Prioriza:
 • Expiración de tokens Sanctum (5 min)
  • Validación de mimes en EvidencesController (5 min)
  • Rotar secrets (10 min)

```

---

> **Contexto generado el:** 2026-05-03
> **Frontend asociado:** React 19 + Vite + Capacitor + PWA en Railway
> **Objetivo:** Backend alineado con frontend para seguridad y arquitectura coherentes
