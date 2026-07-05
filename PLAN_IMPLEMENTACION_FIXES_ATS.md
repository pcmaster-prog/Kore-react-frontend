# Plan de Implementación — Fixes de Seguridad, Compliance e Integridad del ATS

> **Proyectos involucrados:**
> - Frontend ERP Kore: `C:\Users\adanc\Desktop\Kore-react-frontend-git`
> - Backend Laravel: `C:\Users\adanc\Desktop\Kore-laravel-backend-main`
> - Portal de Vacantes: `C:\Users\adanc\Desktop\Vacantes_Final`
>
> **Fecha:** 2026-07-03  
> **Revisión:** 1.1 — ajustado tras revisión de gaps críticos (cifrado vs. búsqueda, TenantContext en jobs, retención legal, rollout por feature flag).
> **Instrucción:** NO PROCEDER con la implementación hasta nueva autorización explícita.

---

## 1. Resumen Ejecutivo

Se identificaron **12 riesgos** agrupados en 4 áreas. Este plan propone corregirlos en **5 sprints**, priorizando seguridad y compliance antes de refactorizaciones de arquitectura.

### Matriz de prioridad

| Prioridad | Área | Issues | Esfuerzo estimado |
|-----------|------|--------|-------------------|
| 🔴 **P0 — Crítico** | Seguridad / Compliance | 1, 2, 3, 4, 5 | 6-7 semanas |
| 🟠 **P1 — Alto** | Integridad de datos / lógica | 6, 7, 8, 9 | 2-3 semanas |
| 🟡 **P2 — Medio** | Arquitectura / mantenibilidad | 10, 11, 12 | 2-3 semanas |

> **Nota:** Los números de issue corresponden a los 12 puntos levantados en la revisión.

---

## 2. Decisiones Arquitectónicas Previas (resolver antes de escribir migraciones)

### 2.1 Cifrado + búsqueda determinística de RFC/CURP/NSS

**Problema:** El cast `encrypted` nativo de Laravel usa IV aleatorio. No permite `WHERE rfc = ?`. El Issue 9 requiere búsqueda determinística para recontratación.

**Decisión recomendada: Blind index con HMAC determinístico y clave derivada por tenant.**

- Cifrar columnas `rfc`, `curp`, `nss` con cast `encrypted`.
- Agregar columnas `rfc_hash`, `curp_hash`, `nss_hash` con HMAC-SHA256 determinista.
- Buscar por `rfc_hash`, no por `rfc`.
- **La clave HMAC debe derivarse por `empresa_id`** para evitar correlación cross-tenant. El mismo RFC en la Empresa A y la Empresa B debe producir hashes distintos.

```php
// app/Helpers/IdentityHasher.php
class IdentityHasher
{
    public static function hash(string $value, string $empresaId): string
    {
        $tenantKey = hash_hmac('sha256', $empresaId, config('privacy.identity_hmac_key'));
        return hash_hmac('sha256', self::normalize($value), $tenantKey);
    }

    public static function normalize(string $value): string
    {
        return strtoupper(preg_replace('/\s+/', '', $value));
    }
}
```

**Regla de negocio: aislamiento por empresa.** La recontratación/blacklist solo busca dentro de la misma `empresa_id`. Si en el futuro se desea blacklist de plataforma (cross-tenant) como feature deliberada, debe ser una decisión explícita con su propio consentimiento/aviso de privacidad, no un efecto secundario de la implementación.

**Alternativa:** CipherSweet (más robusto, blind indexing nativo, pero añade dependencia y complejidad). Se mantiene como opción si el volumen de datos crece o se requieren búsquedas compuestas.

**Implicación:** La migración de cifrado debe crear las columnas `_hash` desde el inicio. No se puede migrar a `encrypted` simple y agregar los índices después sin re-procesar todos los datos.

**Rotación de clave:** cambiar `privacy.identity_hmac_key` invalida todos los `_hash` existentes. Rotar requiere re-hashear toda la tabla `empleados` y `applications.contact_info`. Documentar esto en `config/privacy.php` y runbooks de operación.

### 2.2 TenantContext en jobs de cola

**Problema:** `TenantContext` estático funciona en requests HTTP, pero los jobs asíncronos corren fuera del request. Si un job toca un modelo con `BelongsToTenant`, el Global Scope puede fallar.

**Decisión:** Cada job que acceda a modelos tenant-scoped recibirá `empresa_id` en su constructor y seteará `TenantContext::setId()` al inicio de `handle()`.

```php
abstract class TenantAwareJob implements ShouldQueue
{
    public function __construct(protected string $empresaId) {}

    public function handle(): void
    {
        TenantContext::setId($this->empresaId);
        try {
            $this->run();
        } finally {
            TenantContext::clear();
        }
    }

    abstract protected function run(): void;
}
```

**Implicación:** El Issue 11 (notificaciones en cola) debe construirse sobre esta base. Se documenta explícitamente en la sección correspondiente.

### 2.3 ARCO vs. retención legal

**Problema:** LFPDPPP permite negar la eliminación cuando hay obligación legal de conservar datos.

**Decisión:** El endpoint de eliminación debe distinguir:

| Perfil | Acción permitida | Motivo |
|--------|------------------|--------|
| Aspirante no contratado (`status != hired`) | Eliminación completa o anonimización | No hay obligación de retención |
| Ex-empleado (`status = hired` o existe `Empleado`) | Solo anonimización parcial | LFT, SAT, IMSS obligan retener datos laborales y fiscales por años |

**Regla de negocio:**
- Si el usuario tiene un `Empleado` relacionado, rechazar `DELETE` con `409 Conflict` y explicar que los datos se conservan por obligación legal.
- Permitir `DELETE` solo para usuarios con `role = aspirante` y sin historial de empleado.
- Para ex-empleados, ofrecer endpoint de rectificación (`PUT`) pero no eliminación total.

---

## 3. Fase 0 — Preparación (1 semana)

### 3.1 Backups y ambiente de pruebas
- [ ] Crear rama `feature/ats-security-fixes` en los 3 repositorios.
- [ ] Asegurar base de datos de staging con datos representativos (múltiples empresas, aplicaciones en varios estados).
- [ ] Exportar schema actual y semilla de prueba.

### 3.2 Tests de regresión
- [ ] Escribir tests de característica (`Feature`) para los escenarios actuales que NO deben romperse:
  - Crear/editar/publishar vacante.
  - Aplicar, screening passed/failed, agendar entrevista, enviar oferta, aceptar oferta, contratar.
- [ ] Confirmar que los tests existentes (`tests/Feature/Ats*`) pasan antes de cambiar lógica.

### 3.3 Definir estándares
- [ ] Elegir ruta de cifrado: **Blind index con HMAC determinístico** (recomendado) o CipherSweet.
- [ ] Generar `privacy.identity_hmac_key` segura y agregarla a `.env` (no usar `APP_KEY`).
- [ ] Definir política de rate limiting por tipo de endpoint.
- [ ] Crear template de aviso de privacidad y consentimiento (con revisión legal).
- [ ] Definir feature flag para activación gradual de `BelongsToTenant`.

---

## 4. Fase 1 — Multi-tenancy (Sprint 1, 2 semanas)

> **Objetivo:** Cerrar filtraciones cross-tenant. Este sprint es exclusivo para Issue 2 porque es el cambio con mayor blast radius.

### Issue 2 — Multi-tenancy sin Global Scope

**Severidad:** 🔴 Crítica (filtración de datos entre empresas)

**Estado actual:**
- `Application`, `JobOpening`, etc. **no tienen** Global Scope.
- La seguridad depende de filtros manuales en cada query.
- Endpoints públicos pueden devolver vacantes de **todas** las empresas si no se resuelve `empresa_id`.

**Implementación:**

1. **Crear trait `BelongsToTenant` con soporte para feature flag por empresa y semántica fail-closed:**
   ```php
   trait BelongsToTenant
   {
       protected static function bootBelongsToTenant()
       {
           static::addGlobalScope('tenant', function (Builder $builder) {
               $tenantId = TenantContext::getId();

               if (!$tenantId) {
                   if (app()->runningInConsole() && TenantContext::isExplicitlyBypassed()) {
                       return; // comando/job que declaró explícitamente bypass via runWithoutTenant
                   }
                   throw new MissingTenantContextException(
                       'Query a modelo tenant-scoped sin contexto de empresa establecido.'
                   );
               }

               // El flag controla si el scope está activo para este tenant.
               // Pero si hay TenantContext, SIEMPRE filtramos por empresa.
               $enabled = Cache::remember("tenant_scope:{$tenantId}", 60, function () use ($tenantId) {
                   $empresa = Empresa::find($tenantId);
                   return (bool) ($empresa?->settings['ats']['tenant_scope_enabled'] ?? false);
               });

               if (!$enabled) {
                   return; // durante rollout gradual: este tenant aún no migra al scope
               }

               $builder->where($builder->getModel()->getTable() . '.empresa_id', $tenantId);
           });

           static::creating(function ($model) {
               if (!$model->empresa_id && $tenantId = TenantContext::getId()) {
                   $model->empresa_id = $tenantId;
               }
           });
       }

       public function scopeWithoutTenant($query)
       {
           return $query->withoutGlobalScope('tenant');
       }
   }
   ```

   **Principio:** el scope **nunca** falla en abierto. Si hay `TenantContext`, filtra. Si no lo hay, revienta. El feature flag solo decide si el scope aplica a ese tenant durante la migración gradual; no decide si filtrar o no cuando el contexto existe.

2. **Crear `TenantContext` thread-safe / request-scoped con bypass seguro por closure:**
   ```php
   class TenantContext
   {
       private static ?string $id = null;
       private static bool $bypassed = false;

       public static function setId(string $id): void
       {
           self::$id = $id;
           self::$bypassed = false;
       }

       public static function getId(): ?string { return self::$id; }

       public static function clear(): void
       {
           self::$id = null;
           self::$bypassed = false;
       }

       /**
        * Ejecuta código sin contexto de tenant, garantizando reset en finally.
        * Úsalo en comandos de Artisan o jobs que intencionalmente necesiten
        * operar sin tenant (ej. migraciones de datos legacy).
        */
       public static function runWithoutTenant(\Closure $callback): mixed
       {
           $previousId = self::$id;
           self::$id = null;
           self::$bypassed = true;
           try {
               return $callback();
           } finally {
               self::$id = $previousId;
               self::$bypassed = false;
           }
       }

       public static function isExplicitlyBypassed(): bool
       {
           return self::$bypassed;
       }
   }
   ```

   **No exponer `TenantContext::bypass()` como método suelto.** Toda operación sin tenant debe pasar por `runWithoutTenant()` para garantizar el `finally`.

   **Uso de `IdentityHasher` con TenantContext:** cada vez que se escriba o busque por `rfc_hash`, `curp_hash`, `nss_hash`, se usará `IdentityHasher::hash($value, TenantContext::getId())`.

3. **Middleware `EnsureTenant`:**
   - Validar que el usuario tenga `empresa_id`.
   - Llamar `TenantContext::setId($user->empresa_id)`.

4. **Auditar y ajustar TODOS los entry points que toquen modelos tenant-scoped (acción obligatoria antes de merge):**
   - **Rutas ERP autenticadas:** ya pasan por `EnsureTenant` ✅.
   - **Rutas públicas del portal (`/public/jobs`, `/public/jobs/{id}`, `/public/jobs/filters`):** deben resolver `empresa_id` y llamar `TenantContext::setId($empresa->id)` **antes** de cualquier query a `JobOpening`.
     ```php
     $empresa = $this->resolveEmpresa($request);
     TenantContext::setId($empresa->id);
     ```
   - **Comandos de Artisan:** usar `TenantContext::runWithoutTenant(fn () => ...)` solo si realmente no necesitan tenant; de lo contrario, iterar por empresa con `TenantContext::setId($empresa->id)`.
   - **Jobs:** extender `TenantAwareJob` (ver Issue 11).
   - **Scheduled tasks:** setear contexto explícitamente o usar `runWithoutTenant`.
   - **Tests:** setear `TenantContext::setId($empresa->id)` en `setUp()` o usar `actingAs` con usuario que tenga empresa.

5. **Red de seguridad para workers de cola:**
   - En `AppServiceProvider::boot()` agregar:
     ```php
     Queue::before(fn () => TenantContext::clear());
     Queue::after(fn () => TenantContext::clear());
     ```
   - Esto limpia el contexto estático antes y después de cada job, protegiendo contra fugas entre jobs en `queue:work`.

6. **Aplicar el trait a modelos ATS:**
   - `JobOpening`
   - `JobOpeningTemplate`
   - `Application`
   - `ApplicationDocument`
   - `ApplicationStatusLog`
   - `ApplicationOffer`
   - `Interview`
   - `EmailTemplate`
   - `JobOpeningView`

7. **Endpoints públicos:**
   - Hacer obligatorio `empresa_id` o `empresa_slug`.
   - Si no se envía ninguno y no hay default, devolver `400 Bad Request`.
   - Nunca devolver datos sin filtro de empresa.
   - **Setear `TenantContext::setId($empresa->id)` en el controller antes de cualquier query.**

8. **Feature flag por empresa:**
   - Agregar columna/campo `settings.ats.tenant_scope_enabled` en `empresas`.
   - Inicialmente `false` para todas.
   - Activar empresa por empresa en staging y luego en producción.
   - Una vez alcanzada **100% de cobertura**, cambiar default a `true`.

7. **Invalidación inmediata de cache del flag:**
   - En el observer/hook del modelo `Empresa`, cuando cambie `settings.ats.tenant_scope_enabled`, ejecutar:
     ```php
     Cache::forget("tenant_scope:{$empresa->id}");
     ```
   - Esto garantiza que el killswitch/feature flag tenga efecto inmediato, sin depender del TTL de 60s.

8. **Runbook de operaciones:**
   - Cualquier cambio a `settings.ats.tenant_scope_enabled` debe hacerse siempre vía Eloquent (`Empresa::find($id)->update([...])`), nunca con `DB::table('empresas')->update(...)` crudo. El observer no se dispara con query builder directo.
   - Si se debe hacer un update crudo (migración, script de mantenimiento), ejecutar manualmente `Cache::forget("tenant_scope:{$empresaId}")` después.

9. **NO eliminar filtros manuales en este sprint.**
   - Mientras el flag esté activándose gradualmente, los `where('empresa_id', ...)` manuales siguen siendo la salvaguarda.
   - La limpieza de filtros redundantes se hará **después** de confirmar que todas las empresas tienen el flag en `true` (Sprint posterior o tarea de refactor).

10. **Tests:**
   - Usuario de empresa A no puede ver vacantes/candidatos de empresa B.
   - Endpoint público sin empresa_id/slug rechaza la petición.
   - Endpoint público con empresa_slug solo devuelve datos de esa empresa.
   - Feature flag: con scope desactivado, los datos se filtran manualmente como antes.
   - **Query a modelo tenant-scoped sin `TenantContext` lanza `MissingTenantContextException`.**
   - **Query con `TenantContext` SIEMPRE filtra por `empresa_id`, independientemente del flag.**
   - Cambio del flag invalida cache inmediatamente.
   - **Smoke test:** `GET /public/jobs/{slug}` devuelve 200 con el trait aplicado y el flag en false.
   - **Smoke test:** `GET /public/jobs/{slug}` de otra empresa no devuelve datos de la primera empresa.

**Archivos a modificar:**
- `app/Traits/BelongsToTenant.php` (nuevo)
- `app/Services/TenantContext.php` (nuevo)
- `app/Exceptions/MissingTenantContextException.php` (nuevo)
- `app/Observers/EmpresaObserver.php` (nuevo o actualizar)
- `app/Http/Middleware/EnsureTenant.php`
- `app/Models/{JobOpening,Application,Interview,...}.php`
- `app/Http/Controllers/Api/V1/JobOpeningController.php` (métodos públicos)
- `app/Http/Controllers/Api/V1/*Controller.php` (eliminar `where('empresa_id')` manual)
- `config/ats.php` (nuevo)
- `database/migrations/2026_07_04_000000_add_ats_settings_to_empresas.php`
- `tests/Feature/AtsTenantIsolationTest.php` (nuevo)

**Esfuerzo:** 8-10 días (incluye testing exhaustivo y rollout por feature flag). **Nota:** la limpieza de filtros manuales es trabajo adicional que NO se incluye aquí.

---

## 5. Fase 2 — Estado, CSRF y Rate Limiting (Sprint 2, 2 semanas)

### Issue 1 — Máquina de estados no aplicada consistentemente

**Severidad:** 🟠 Alta

**Estado actual:**
- `POST /ats/applications/{id}/status` **SÍ** valida `canTransition`.
- `ApplicationOfferController::accept` valida `status === 'offer-sent'`.
- `EmployeeOnboardingService::create` no valida la transición `offer-sent → hired`.
- `hireTrial` crea token/email **fuera** de la transacción.
- No hay `lockForUpdate` en ofertas/empleados.

**Implementación:**

1. **Centralizar la máquina de estados en el modelo `Application`:**
   ```php
   public function canTransitionTo(string $newStatus): bool
   {
       if ($this->status === $newStatus) return false;
       $allowed = config('ats.allowed_transitions');
       if ($newStatus === 'rejected' && in_array($this->status, ['new','screening','interview-requested','interviewing','offer-sent'])) {
           return true;
       }
       return in_array($newStatus, $allowed[$this->status] ?? [], true);
   }

   public function transitionTo(string $newStatus, ?User $changedBy = null, ?string $notes = null): void
   {
       if (!$this->canTransitionTo($newStatus)) {
           throw new InvalidStatusTransitionException($this->status, $newStatus);
       }
       // update + log
   }
   ```

2. **Refactorizar `ApplicationController::changeStatus`** para usar `$app->transitionTo()`.

3. **Refactorizar `ApplicationOfferController::accept`:**
   - Usar `$app->lockForUpdate()->findOrFail($id)`.
   - Validar estado dentro de la transacción.
   - Llamar `$app->transitionTo('hired')` desde `EmployeeOnboardingService`.

4. **Refactorizar `ApplicationController::hireTrial` y `rehire`:**
   - Incluir token de activación dentro de la transacción.
   - Aplicar `lockForUpdate` sobre `Application` y `User`.

5. **Tests:**
   - Transición ilegal `new → hired` devuelve 422.
   - Doble aceptación de oferta no crea dos empleados.

**Archivos a modificar:**
- `app/Models/Application.php`
- `app/Exceptions/InvalidStatusTransitionException.php` (nuevo)
- `app/Http/Controllers/Api/V1/ApplicationController.php`
- `app/Http/Controllers/Api/V1/ApplicationOfferController.php`
- `app/Services/EmployeeOnboardingService.php`
- `config/ats.php`
- `tests/Feature/AtsStatusTransitionsTest.php` (nuevo)

**Esfuerzo:** 4 días

---

### Issue 5 — Cookie HttpOnly + OAuth: CSRF / SameSite

**Severidad:** 🟠 Alta

**Implementación:**

1. **Remover fallback Bearer en `PortalCookieAuth` para producción.**
2. **Endpoint CSRF:** usar `GET /sanctum/csrf-cookie`.
3. **Frontend portal:** bootstrap CSRF antes de POST/PUT/DELETE.
4. **Validar Origin/Referer** en middleware `EnsurePortalAccess`.

**Archivos a modificar:**
- `app/Http/Middleware/PortalCookieAuth.php`
- `app/Http/Middleware/EnsurePortalAccess.php`
- `Vacantes_Final/src/lib/http.ts`
- `Vacantes_Final/src/main.tsx`

**Esfuerzo:** 3 días

---

### Issue 4 — Sin rate limiting / CAPTCHA en endpoints públicos

**Severidad:** 🟠 Alta

**Implementación:**

1. **Rate limiters:**
   - `public`: 30/min por IP.
   - `portal_offer`: 5/min por usuario.
   - `document_upload`: 10/min por usuario.

2. **Honeypot** en formularios del portal.

3. **CAPTCHA:** planificar integración (hCaptcha/reCAPTCHA v3) en `/portal/apply` y `/portal/offer/accept`. **Nota:** esto requiere keys de proveedor y revisión del aviso de privacidad/cookies por scripts de terceros.

**Archivos a modificar:**
- `app/Providers/AppServiceProvider.php`
- `routes/api.php`
- `app/Http/Requests/PortalApplyRequest.php`
- `app/Http/Requests/AcceptOfferRequest.php`
- Portal: forms con honeypot + CAPTCHA.

**Esfuerzo:** 3-5 días (depende de obtención de keys CAPTCHA y ajustes legales)

---

## 6. Fase 3 — Compliance y Datos Sensibles (Sprint 3, 2 semanas)

### Issue 3 — Datos sensibles y LFPDPPP

**Severidad:** 🔴 Crítica

**Implementación:**

#### A. Cifrado + blind index

1. **Columnas cifradas + hashes:**
   - `applications.contact_info` → cifrado completo con cast `EncryptedSensitiveData`.
   - `empleados.rfc`, `empleados.curp`, `empleados.nss` → cast `encrypted`.
   - Columnas `_hash` para búsqueda determinística.

2. **Helper `IdentityHasher`:**
   - Normaliza (trim, mayúsculas, sin espacios).
   - Genera HMAC-SHA256 con `privacy.identity_hmac_key`.

3. **Actualizar `EmployeeOnboardingService` y `ApplicationController`** para escribir hash al guardar.

4. **Migración reversible:**
   - Backup.
   - Script de comando que cifra y genera hashes.
   - Verificación de descifrado antes de eliminar columnas planas (si se decide renombrar).

#### B. Aviso de privacidad y consentimiento

1. Tabla `privacy_consents`.
2. Endpoint `GET /public/privacy-notice`.
3. Requerir `privacy_consent: true` en `apply` y `offer/accept`.

#### C. Endpoint ARCO con retención legal

1. **`GET /portal/me/data`** — devolver datos personales.
2. **`PUT /portal/me/data`** — rectificación de datos no sensibles.
3. **`DELETE /portal/me/data`**:
   - Permitido solo si `role = aspirante` y no existe `Empleado` relacionado.
   - Para ex-empleados, devolver `409 Conflict` con mensaje de obligación legal.
   - Anonimizar `contact_info`, `education`, `experience`.
   - Borrar documentos físicos.
   - Mantener estadísticas agregadas anonimizadas.

#### D. Tests

- Encriptación transparente.
- Búsqueda por hash funciona para recontratación dentro de la misma empresa.
- Consentimiento requerido.
- Endpoint ARCO respeta retención legal.

**Archivos a modificar:**
- `app/Casts/EncryptedSensitiveData.php` (nuevo)
- `app/Helpers/IdentityHasher.php` (nuevo)
- `app/Models/Application.php`
- `app/Models/Empleado.php`
- `app/Services/EmployeeOnboardingService.php`
- `app/Http/Controllers/Api/V1/ApplicationController.php`
- `app/Http/Controllers/Api/V1/ApplicationOfferController.php`
- `app/Http/Controllers/Api/V1/PortalMeController.php` (nuevo)
- `database/migrations/2026_07_05_000000_encrypt_sensitive_fields.php`
- `database/migrations/2026_07_05_000001_create_privacy_consents_table.php`
- `config/privacy.php` (nuevo)
- `app/Console/Commands/EncryptSensitiveData.php` (nuevo)

**Esfuerzo:** 8 días

---

## 7. Fase 4 — Integridad de Datos y Lógica de Negocio (Sprint 4, 2 semanas)

### Issue 6 — Snapshot de preguntas de screening

**Severidad:** 🟠 Alta

**Implementación:**

```php
$app->update([
    'screening_test_results' => [
        'snapshot_version' => now()->toDateTimeString(),
        'screening_pass_score' => $job->screening_pass_score,
        'questions' => collect($job->screening_questions)->map(fn ($q) => [
            'question' => $q['question'],
            'options' => $q['options'] ?? [],
            'correctIndex' => $q['correctIndex'] ?? null,
        ])->toArray(),
        'answers' => $validated['answers'],
        'score' => $score,
        'passed' => $passed,
    ],
]);
```

**Esfuerzo:** 3 días

---

### Issue 7 — Aceptación de oferta sin lock / idempotencia

**Severidad:** 🟠 Alta

**Implementación:**

1. **Lock pesimista** en `ApplicationOfferController::accept`.
2. **Idempotency-Key:**
   - Backend lee header `Idempotency-Key`.
   - Cachear respuesta por 24h.
3. **Frontend portal:** `OfferPage.tsx` debe generar UUID y enviarlo en header.

**Archivos a modificar:**
- `app/Http/Controllers/Api/V1/ApplicationOfferController.php`
- `app/Services/IdempotencyService.php` (nuevo)
- `Vacantes_Final/src/pages/OfferPage.tsx`

**Esfuerzo:** 3 días

---

### Issue 8 — Falta estado `withdrawn`

**Severidad:** 🟡 Media

**Implementación:**

1. Agregar `withdrawn` a transiciones permitidas desde estados activos.
2. Endpoint `POST /portal/applications/{id}/withdraw`.
3. Actualizar reportes para excluir `withdrawn` de rechazos.

**Esfuerzo:** 3 días

---

### Issue 9 — Recontratación sin normalización

**Severidad:** 🟡 Media

**Implementación:**

1. Usar `IdentityHasher::hash($value, $empresaId)` para generar hashes por tenant.
2. `checkRehire()` y `rehire()` deben buscar por email, RFC y CURP **dentro de la misma `empresa_id`** (igual que `apply()`).
3. Crear tabla real `employee_blacklist` para distinguir blacklist de recontratación. La blacklist es por empresa; si se desea cross-tenant, debe ser feature deliberada con su propio consentimiento.

**Esfuerzo:** 3 días

---

## 8. Fase 5 — Arquitectura y Mantenibilidad (Sprint 5, 2 semanas)

### Issue 11 — Notificaciones síncronas en flujos críticos

**Severidad:** 🟠 Alta

**Implementación:**

1. **Jobs tenant-aware (con protección de Queue::before/after ya activa desde Sprint 1):**
   ```php
   class SendHiredNotification extends TenantAwareJob
   {
       public function __construct(string $empresaId, private string $applicationId)
       {
           parent::__construct($empresaId);
       }

       protected function run(): void
       {
           $app = Application::findOrFail($this->applicationId);
           // enviar email/WhatsApp
       }
   }
   ```

   **Nota:** `TenantAwareJob` debe confiar en que `Queue::before`/`Queue::after` limpian el estado entre jobs, pero igual implementar su propio `try/finally` como defensa en profundidad.

2. Refactorizar `AtsNotificationService` para encolar jobs.
3. WhatsApp asíncrono.
4. Configurar `QUEUE_CONNECTION=redis` y `failed_jobs`.

**Esfuerzo:** 5 días

---

### Issue 10 — Frontend ERP `recruitment` sin React Query

**Severidad:** 🟡 Media

**Implementación:**

1. Crear hooks con TanStack Query.
2. Refactorizar páginas para usar hooks.
3. Reemplazar `alert()` y `console.error` por toasts.

**Esfuerzo:** 8 días (esto podría requerir un sprint adicional si se hace página por página)

---

### Issue 12 — Portal usa `localStorage` como fuente de verdad

**Severidad:** 🟠 Alta

**Implementación:**

1. Endpoint `GET /portal/applications/{id}/progress`.
2. Hook `useApplicationProgress`.
3. Reemplazar lecturas de `localStorage` por datos del backend.
4. Mantener `localStorage` solo como caché offline opcional.

**Esfuerzo:** 6 días

---

## 9. Plan de Sprints Revisado

| Sprint | Duración | Issues | Esfuerzo total |
|--------|----------|--------|----------------|
| **Sprint 1** | 2 semanas | Issue 2 — Multi-tenancy | 8-10 días |
| **Sprint 2** | 2 semanas | Issues 1, 5, 4 | 10-12 días |
| **Sprint 3** | 2 semanas | Issue 3 — LFPDPPP + cifrado | 8 días |
| **Sprint 4** | 2 semanas | Issues 6, 7, 8, 9 | 9-12 días |
| **Sprint 5** | 2-3 semanas | Issues 11, 12, 10 | 14-19 días |

**Total estimado:** 10-11 semanas con margen.

---

## 10. Rollout y Feature Flags

### Issue 2 — Multi-tenancy (3 fases explícitas)

1. **Fase A — Implementar scope fail-closed sin quitar filtros manuales (Sprint 1):**
   - Agregar `BelongsToTenant` con feature flag por empresa y semántica fail-closed.
   - Mantener todos los `where('empresa_id', ...)` existentes.
   - **Desde el día 1, cualquier query sin `TenantContext` debe lanzar excepción.** Esto sirve como mecanismo de detección temprana: tests/staging van a fallar ruidosamente en cualquier código path que aún no sea tenant-aware (jobs viejos, comandos, tinker, scheduled tasks).
   - Validar en staging con al menos 2 empresas.
   - Activar en producción empresa por empresa.

2. **Fase B — Confirmar 100% de cobertura:**
   - Todos los registros de `empresas` deben tener `settings.ats.tenant_scope_enabled = true`.
   - Monitorear logs de error y queries durante al menos 1 semana.
   - Asegurar que todos los jobs, comandos y tareas programadas que toquen modelos tenant-scoped usen `TenantAwareJob` o `TenantContext::setId()` / `TenantContext::bypass()` explícito.

3. **Fase C — Limpiar filtros manuales (Sprint separado, después de Fase B):**
   - Solo entonces quitar los `where('empresa_id', ...)` redundantes de controladores.
   - Ejecutar tests de regresión de aislamiento cross-tenant.
   - Eliminar feature flag o dejarlo como killswitch con invalidación de cache inmediata.

**Riesgo evitado:**
- No hay ventana de tiempo en que un controlador sin filtro manual sirva datos a una empresa que aún no tiene el flag activo.
- El scope nunca falla en abierto: sin `TenantContext` revienta, y con `TenantContext` siempre filtra.
- Los workers de cola no heredan contexto/bypass entre jobs.

### Issue 3 — Cifrado

- Ejecutar migración en mantenimiento programado.
- Backup completo previo.
- Script de validación que descifra una muestra aleatoria y compara con texto plano original.
- Solo eliminar columnas planas (si aplica) después de 1 semana de monitoreo.

### Issue 11 — Colas

- Desplegar workers de queue antes de encolar jobs.
- Monitorear `failed_jobs`.
- Configurar alertas.

---

## 11. Dependencias y Riesgos

### Dependencias externas
- Texto final del aviso de privacidad (legal/compliance).
- Keys de CAPTCHA (si se implementa).
- `QUEUE_CONNECTION=redis` configurado en producción.
- `privacy.identity_hmac_key` generada y guardada en `.env`.

### Riesgos técnicos
| Riesgo | Mitigación |
|--------|------------|
| Migración de cifrado falle en datos existentes | Backup + script reversible + validación de descifrado. |
| Global Scope rompa queries existentes | Feature flag + tests exhaustivos + rollout gradual. |
| Jobs pierdan contexto de tenant | `TenantAwareJob` base + siempre recibir `empresa_id`. |
| Refactor React Query introduzca regresiones | Migrar una página a la vez. |
| Endpoint ARCO elimine datos de ex-empleado | Regla de negocio que rechaza eliminación si existe `Empleado`. |
| Notificaciones en cola requieren supervisión | Horizon/failed_jobs + alertas. |

---

## 12. Criterios de Aceptación Generales

- [ ] Todos los tests de Feature pasan.
- [ ] Auditoría de seguridad no encuentra filtraciones cross-tenant.
- [ ] Query sin `TenantContext` lanza `MissingTenantContextException` en todos los tests.
- [ ] Datos sensibles (RFC/CURP/NSS) no aparecen en texto plano en BD.
- [ ] Búsqueda por RFC/CURP/NSS funciona mediante blind index.
- [ ] Endpoints públicos requieren identificación de empresa.
- [ ] Un candidato no puede saltar de `new` a `hired`.
- [ ] Doble aceptación de oferta no crea duplicados.
- [ ] Notificaciones no bloquean respuestas HTTP.
- [ ] Portal funciona correctamente con `localStorage` limpio.
- [ ] Endpoint ARCO respeta retención legal para ex-empleados.
- [ ] Jobs en cola mantienen contexto de tenant.
- [ ] Documentación actualizada (`DOCUMENTACION_FLUJO_ATS.md`).

---

## 13. Archivos Clave a Crear o Modificar

### Backend
- `app/Traits/BelongsToTenant.php` (nuevo)
- `app/Services/TenantContext.php` (nuevo)
- `app/Exceptions/InvalidStatusTransitionException.php` (nuevo)
- `app/Casts/EncryptedSensitiveData.php` (nuevo)
- `app/Helpers/IdentityHasher.php` (nuevo)
- `app/Services/IdempotencyService.php` (nuevo)
- `app/Jobs/TenantAwareJob.php` (nuevo)
- `app/Jobs/Ats/*` (nuevos)
- `app/Http/Controllers/Api/V1/PortalMeController.php` (nuevo)
- `app/Http/Controllers/Api/V1/PortalApplicationController.php` (nuevo)
- `app/Console/Commands/EncryptSensitiveData.php` (nuevo)
- `config/ats.php` (nuevo)
- `config/privacy.php` (nuevo)

### Frontend ERP
- `src/features/recruitment/hooks/*.ts` (nuevos)
- `src/features/recruitment/pages/*.tsx` (refactor)

### Portal
- `src/hooks/useApplicationProgress.ts` (nuevo)
- `src/pages/OfferPage.tsx` (idempotency key)
- `src/lib/http.ts` (CSRF bootstrap)

---

## 14. Instrucción Final

**No iniciar implementación hasta autorización explícita.** El siguiente paso recomendado, una vez aprobado, es comenzar con el **Sprint 1 (Issue 2 — Multi-tenancy con Global Scope y feature flag)**, ya que es el fundamento sobre el que descansan varios fixes posteriores.

---

*Fin del plan de implementación — Revisión 1.1.*
