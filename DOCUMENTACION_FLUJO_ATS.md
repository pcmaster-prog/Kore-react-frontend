# Documentación del Módulo de Reclutamiento (ATS)

> **Proyectos analizados:**
> - Frontend ERP Kore: `C:\Users\adanc\Desktop\Kore-react-frontend-git`
> - Backend Laravel: `C:\Users\adanc\Desktop\Kore-laravel-backend-main`
> - Portal de Vacantes: `C:\Users\adanc\Desktop\Vacantes_Final`
>
> **Fecha de generación:** 2026-07-03

---

## Tabla de Contenidos

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [¿Qué es el módulo de Reclutamiento?](#2-qué-es-el-módulo-de-reclutamiento)
3. [Arquitectura General](#3-arquitectura-general)
4. [Flujo del Administrador / Reclutador](#4-flujo-del-administrador--reclutador)
5. [Flujo del Candidato](#5-flujo-del-candidato)
6. [Flujo de Datos End-to-End](#6-flujo-de-datos-end-to-end)
7. [Modelos de Datos y Relaciones](#7-modelos-de-datos-y-relaciones)
8. [Endpoints API Principales](#8-endpoints-api-principales)
9. [Máquina de Estados](#9-máquina-de-estados)
10. [Lógica de Negocio Clave](#10-lógica-de-negocio-clave)
11. [Componentes y Vistas Principales](#11-componentes-y-vistas-principales)
12. [Roles y Permisos](#12-roles-y-permisos)
13. [Integraciones con Otros Módulos](#13-integraciones-con-otros-módulos)
14. [Hallazgos y Observaciones](#14-hallazgos-y-observaciones)

---

## 1. Resumen Ejecutivo

El módulo de **Reclutamiento (ATS - Applicant Tracking System)** es un sistema completo de gestión de talento que permite:

- **Publicar vacantes** desde el ERP Kore hacia un portal público.
- **Capturar postulaciones** de candidatos externos.
- **Gestionar el pipeline** de selección con etapas formales.
- **Evaluar candidatos** mediante screening, entrevistas con scorecard y guía de preguntas.
- **Enviar ofertas laborales** y convertir a un candidato aprobado en empleado.

El sistema está compuesto por **tres aplicaciones** que trabajan en conjunto:

| Sistema | Tecnología | Usuario | Propósito |
|---------|-----------|---------|-----------|
| **ERP Kore (React)** | React 19 + Vite + Tailwind | Administradores / Reclutadores | Crear vacantes, revisar candidatos, agendar entrevistas, enviar ofertas, contratar. |
| **Backend (Laravel)** | Laravel 11 + PostgreSQL | API compartida | Lógica de negocio, base de datos, autenticación, notificaciones, almacenamiento seguro. |
| **Portal de Vacantes (React)** | React 19 + Vite + shadcn/ui | Candidatos externos | Ver vacantes, postularse, llenar expediente, ver inducción, autoevaluación, aceptar oferta. |

---

## 2. ¿Qué es el módulo de Reclutamiento?

Es el **Sistema de Seguimiento de Candidatos (ATS)** de Kore. Permite a una empresa gestionar todo el ciclo de vida de una vacante y sus postulaciones, desde la publicación hasta la contratación.

### Funcionalidades principales

| Funcionalidad | Descripción |
|---------------|-------------|
| **Gestión de Vacantes** | Crear, editar, publicar, cerrar y compartir vacantes con URL pública. |
| **Plantillas de Vacante** | Guardar configuraciones reutilizables de vacantes. |
| **Pipeline de Candidatos** | Kanban con etapas: Nuevos, Evaluación, Entrevista solicitada, Entrevistas, Oferta, Contratados, Rechazados. |
| **Screening / Autoevaluación** | Cuestionario configurable por vacante con puntaje mínimo de aprobación. |
| **Entrevistas** | Agendado con método (presencial, video, teléfono), scorecard y guía de preguntas. |
| **Ofertas Laborales** | Generación, envío, aceptación/rechazo con firma del candidato. |
| **Contratación y Recontratación** | Convertir candidato en empleado de prueba o restaurar un ex-empleado. |
| **Documentos** | Expediente digital del candidato (CV, INE, CURP, etc.) y documentos de alta. |
| **Notificaciones** | Correos personalizables y mensajes de WhatsApp. |
| **Reportes y Analytics** | Funnel de conversión, tiempos por etapa, motivos de rechazo, entrevistas próximas. |
| **Plantillas de Email** | Personalización de correos automáticos por tipo y empresa. |

---

## 3. Arquitectura General

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                               USUARIO FINAL                                  │
│  ┌─────────────────────┐                    ┌─────────────────────────────┐ │
│  │  ERP Kore (React)   │                    │  Portal de Vacantes (React) │ │
│  │  /app/manager/...   │                    │  vacantes.decorartereposteria.mx │ │
│  └──────────┬──────────┘                    └──────────────┬──────────────┘ │
└─────────────┼──────────────────────────────────────────────┼───────────────┘
              │ Bearer Token (Sanctum)                       │ Cookie HttpOnly + OAuth
              │                                              │
              └──────────────────────┬───────────────────────┘
                                     │
                         ┌───────────▼────────────┐
                         │   Backend Laravel      │
                         │   /api/v1/...          │
                         │                        │
                         │  • /ats/*   (admin)    │
                         │  • /portal/* (aspirante)│
                         │  • /public/* (público) │
                         └───────────┬────────────┘
                                     │
                         ┌───────────▼────────────┐
                         │   PostgreSQL + S3      │
                         │   (multi-empresa)      │
                         └────────────────────────┘
```

### Separación de autenticación

| Sistema | Mecanismo | Rol de usuario |
|---------|-----------|----------------|
| ERP Kore | Bearer Token de Laravel Sanctum | `admin`, `supervisor`, `empleado` |
| Portal de Vacantes | Google OAuth + cookie HttpOnly `portal_token` | `aspirante` |

Ambos convergen en la misma tabla `users` del backend, diferenciados por el campo `role`.

---

## 4. Flujo del Administrador / Reclutador

### 4.1 Acceso al módulo

1. El usuario ingresa al ERP Kore con rol `admin`.
2. Navega a **Sistema → Reclutamiento**.
3. El layout interno muestra 5 pestañas:
   - Dashboard
   - Vacantes
   - Candidatos
   - Emails
   - Reportes

### 4.2 Crear una vacante

1. En **Vacantes**, clic en **"Nueva Vacante"**.
2. Se abre el asistente `JobFormWizard` en modal.
3. El asistente tiene **3 pasos**:

#### Paso 1 — Información General
- Título (obligatorio)
- Departamento
- Tipo de empleo: `full-time`, `part-time`, `intern`, `temporary`
- Ubicación
- Rango salarial
- Horario
- Número de vacantes
- Estado: `draft`, `open`, `closed`
- Checkbox "Destacar vacante"

#### Paso 2 — Perfil y Detalles
- Sobre nosotros
- Objetivo del puesto
- Formación académica (lista)
- Experiencia requerida (lista)
- Conocimientos técnicos (lista)
- Competencias blandas (lista)
- Responsabilidades (lista)
- Descripción general libre

#### Paso 3 — Configuración y Flujo
- Beneficios (lista)
- Indicadores de desempeño (lista)
- Configuración avanzada:
  - Slug URL amigable
  - Fecha/hora de publicación
  - URL de imagen banner
  - URL de video de inducción
  - Tags internos
- Flujo de selección:
  - Puntaje mínimo de screening (1-10, default 7)
  - Preguntas de autoevaluación (pregunta, opciones, índice correcto)
  - Guía de preguntas de entrevista por categoría
  - Plantilla de scorecard (criterios de evaluación)

4. Al guardar, se envía `POST /api/v1/ats/jobs`.
5. El backend genera el slug automáticamente si no se proporciona.

### 4.3 Gestionar candidatos

1. En **Candidatos**, se ve un **pipeline Kanban** por etapas:
   - Nuevos
   - Evaluación
   - Entrevista solicitada
   - Entrevistas
   - Contratados
   - Rechazados
2. Desde cada tarjeta se puede:
   - Avanzar etapa
   - Agendar entrevista
   - Marcar para revisión manual
   - Rechazar (con motivo y notificación WhatsApp)
3. Al hacer clic en una tarjeta se entra al **detalle del candidato**.

### 4.4 Detalle del candidato

El detalle muestra:
- Perfil y contacto
- Documentos subidos
- Evaluación de screening
- Video de inducción visto
- Educación y experiencia

Acciones disponibles según el estatus:
- Enviar a evaluación
- Agendar entrevista (fecha, método, ubicación, meeting URL, notificación WhatsApp)
- Registrar resultado de entrevista
- Editar scorecard
- **Modo Entrevista** (panel lateral con guía, scorecard, checklist de documentos)
- Enviar/editar oferta (salario diario, meses de prueba, puesto)
- Reenviar oferta
- Contratar a prueba
- Recontratación rápida (si es ex-empleado)
- Rechazar
- Reintentar evaluación (solo si fue rechazado)

### 4.5 Compartir vacante

- Cada vacante tiene botón de **compartir**.
- Genera URL pública: `{VITE_PORTAL_URL}/jobs/{slug}`.
- Permite copiar link, compartir por WhatsApp/Facebook/LinkedIn y mostrar QR.

### 4.6 Reportes

- Filtros por rango de fechas y vacante.
- KPIs: total aplicaciones, contrataciones, entrevistas próximas 7 días, vacantes abiertas.
- Gráficos: funnel de conversión, distribución por estatus, tiempo promedio por etapa, motivos de rechazo.

---

## 5. Flujo del Candidato

```
Landing (/)
    │
    ▼
Detalle de vacante (/vacante/:id)
    │
    ▼
Postularse ──► Login con Google (si no autenticado)
    │
    ▼
Expediente digital (/expediente)
    │
    ▼
Inducción (/induccion) — video de bienvenida
    │
    ▼
Autoevaluación (/autoevaluacion) — cuestionario
    │
    ├──── Aprobado ──► Solicitar entrevista en vivo
    │
    └──── Rechazado ──► Pantalla de rechazo
    │
    ▼
Dashboard del candidato (/dashboard)
    │
    ├──── Entrevista programada
    │
    ├──── Oferta recibida ──► /oferta (aceptar/rechazar)
    │
    └──── Documentos de alta
```

### 5.1 Landing y detalle

1. El candidato entra al portal público.
2. Ve listado de vacantes abiertas con filtros.
3. Clic en una vacante para ver detalle estructurado.
4. Clic en **"Postularme"**.

### 5.2 Autenticación

- Si no está autenticado, redirige a `/login`.
- Login con Google OAuth.
- El backend crea/actualiza el usuario con `role = 'aspirante'`.
- La sesión se mantiene con cookie HttpOnly.

### 5.3 Expediente digital

El candidato debe completar:
- Teléfono, RFC, CURP, NSS, dirección
- Educación y experiencia
- 6 documentos obligatorios: acta de nacimiento, CURP, comprobante de domicilio, RFC, NSS, CV

### 5.4 Inducción

- Reproduce video de bienvenida de la empresa.
- Lee contenido de la Ley Federal del Trabajo y valores.
- Se marca como visto al 80% de reproducción o manualmente.

### 5.5 Autoevaluación

- Responde cuestionario de la vacante.
- El backend calcula el puntaje.
- Si aprueba (≥ `screening_pass_score`), pasa a solicitar entrevista.
- Si reprueba, la aplicación se rechaza.

### 5.6 Panel del candidato

- Progreso visual de 3 pasos.
- Entrevistas programadas.
- Ofertas pendientes.
- Documentos faltantes.
- Contacto directo con RRHH por WhatsApp.

### 5.7 Aceptación de oferta

- En `/oferta` ve salario diario, periodo de prueba, puesto y notas.
- Debe escribir su nombre completo y aceptar términos.
- Al aceptar, el backend lo convierte en empleado de prueba (`empleado_prueba`).

---

## 6. Flujo de Datos End-to-End

### 6.1 Publicación de una vacante

```
Admin crea vacante en ERP
        │
        ▼
POST /api/v1/ats/jobs
        │
        ▼
Backend valida y guarda en job_openings
        │
        ▼
Vacante disponible en portal si status = open y published_at <= now
```

### 6.2 Postulación de un candidato

```
Candidato ve vacante en portal
        │
        ▼
POST /api/v1/portal/apply (job_opening_id)
        │
        ▼
Backend crea Application con status = new
Backend verifica si es recontratación (Empleado::withTrashed)
Backend envía notificación applicationReceived
        │
        ▼
Admin ve la postulación en el Kanban del ERP
```

### 6.3 Screening

```
Candidato completa inducción
        │
        ▼
POST /api/v1/portal/applications/{id}/induction
        │
        ▼
Candidato responde autoevaluación
        │
        ▼
POST /api/v1/portal/applications/{id}/screening
        │
        ▼
Backend compara respuestas con screening_questions
Calcula score = correctas / total * 10
        │
        ├──── score >= screening_pass_score ──► status = screening
        │
        └──── score < screening_pass_score ──► status = rejected
```

### 6.4 Entrevista

```
Candidato solicita entrevista en vivo
        │
        ▼
POST /api/v1/portal/applications/{id}/request-interview
        │
        ▼
status = interview-requested
        │
        ▼
Admin agenda entrevista
        │
        ▼
POST /api/v1/ats/applications/{id}/interview
        │
        ▼
Se crea registro en interviews, status = interviewing
Se notifica al candidato por email y WhatsApp
        │
        ▼
Durante/Después de la entrevista:
Admin completa scorecard y checklist de documentos
PUT /api/v1/ats/interviews/{id}
        │
        ▼
Admin registra resultado:
POST /api/v1/ats/applications/{id}/interview/result
```

### 6.5 Oferta y contratación

```
Candidato aprobado en entrevista (status = interviewing)
        │
        ▼
Admin envía oferta
POST /api/v1/ats/applications/{id}/offer
        │
        ▼
Se crea ApplicationOffer, status = offer-sent
Se notifica al candidato por email y WhatsApp
        │
        ▼
Candidato acepta oferta en /oferta
POST /api/v1/portal/offer/accept
        │
        ▼
Backend crea/restaura Empleado
Cambia User.role a empleado_prueba
Genera UserActivationToken
Envía email de bienvenida
status = hired
```

---

## 7. Modelos de Datos y Relaciones

### Entidades principales

| Entidad | Tabla | Propósito |
|---------|-------|-----------|
| **Vacante** | `job_openings` | Vacante publicada por la empresa. |
| **Plantilla de Vacante** | `job_opening_templates` | Plantilla reutilizable para crear vacantes. |
| **Vista de Vacante** | `job_opening_views` | Analytics de visitas al detalle público. |
| **Postulación** | `applications` | Aplicación de un aspirante a una vacante. |
| **Documento** | `application_documents` | Archivos subidos por el candidato. |
| **Bitácora de Estado** | `application_status_logs` | Historial de cambios de estado. |
| **Oferta** | `application_offers` | Oferta laboral enviada a un candidato. |
| **Entrevista** | `interviews` | Entrevista agendada con scorecard y checklist. |
| **Plantilla de Email** | `email_templates` | Plantillas de correo personalizables por empresa. |

### Campos clave de `job_openings`

- `title`, `description`
- `about_us`, `objective`, `responsibilities`
- `education_requirements`, `experience_requirements`, `knowledge_requirements`, `competencies`
- `salary_range`, `schedule`, `location`, `job_type`, `department`
- `vacancies_count`, `benefits`, `tags`
- `status` (draft / open / closed)
- `is_featured`, `published_at`, `slug`
- `image_url`, `induction_video_url`
- `screening_questions` (JSON), `screening_pass_score`
- `scorecard_template` (JSON)
- `interview_guide_questions` (JSON)

### Campos clave de `applications`

- `status`
- `job_opening_id`, `user_id`, `empresa_id`
- `contact_info`, `education`, `experience`
- `has_induction_video_watched`, `induction_video_watched_at`
- `screening_test_results`
- `manual_review_required`, `manual_review_reason`
- `is_rehire`, `blacklist_alert`

### Relaciones

```
Empresa
 ├── JobOpening
 │    ├── JobOpeningView
 │    └── Application
 │         ├── ApplicationDocument
 │         ├── ApplicationStatusLog
 │         ├── Interview
 │         └── ApplicationOffer (latest)
 ├── JobOpeningTemplate
 └── EmailTemplate
```

---

## 8. Endpoints API Principales

### 8.1 Públicos (sin autenticación)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/public/jobs` | Listar vacantes abiertas |
| GET | `/api/v1/public/jobs/filters` | Opciones de filtros |
| GET | `/api/v1/public/jobs/{id}` | Detalle de vacante (UUID o slug) |

### 8.2 Portal del Aspirante

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/auth/portal/me` | Perfil del aspirante |
| POST | `/api/v1/auth/portal/logout` | Cerrar sesión |
| POST | `/api/v1/portal/apply` | Postularse a una vacante |
| GET | `/api/v1/portal/applications` | Mis postulaciones |
| GET | `/api/v1/portal/my-application` | Postulación actual |
| PUT | `/api/v1/portal/applications/{id}/expediente` | Actualizar expediente |
| POST | `/api/v1/portal/applications/{id}/documents` | Subir documento |
| DELETE | `/api/v1/portal/applications/{id}/documents` | Eliminar documento |
| POST | `/api/v1/portal/applications/{id}/induction` | Marcar inducción vista |
| POST | `/api/v1/portal/applications/{id}/screening` | Enviar autoevaluación |
| POST | `/api/v1/portal/applications/{id}/request-interview` | Solicitar entrevista |
| POST | `/api/v1/portal/offer/accept` | Aceptar oferta |
| POST | `/api/v1/portal/offer/reject` | Rechazar oferta |
| GET | `/api/v1/portal/onboarding-documents` | Documentos de alta |

### 8.3 Admin ERP

#### Vacantes

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/ats/jobs` | Listar vacantes |
| POST | `/api/v1/ats/jobs` | Crear vacante |
| GET | `/api/v1/ats/jobs/{id}` | Ver vacante |
| PUT/PATCH | `/api/v1/ats/jobs/{id}` | Editar vacante |
| DELETE | `/api/v1/ats/jobs/{id}` | Eliminar vacante |

#### Plantillas

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET/POST | `/api/v1/ats/job-templates` | CRUD plantillas |
| POST | `/api/v1/ats/job-templates/{id}/duplicate` | Duplicar plantilla |

#### Postulaciones

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/ats/applications` | Listar postulaciones |
| GET | `/api/v1/ats/applications/{id}` | Ver postulación |
| POST | `/api/v1/ats/applications/{id}/status` | Cambiar estado |
| POST | `/api/v1/ats/applications/{id}/interview` | Agendar entrevista |
| POST | `/api/v1/ats/applications/{id}/interview/result` | Registrar resultado |
| POST | `/api/v1/ats/applications/{id}/hire` | Contratar a prueba |
| POST | `/api/v1/ats/applications/{id}/reject` | Rechazar |
| POST | `/api/v1/ats/applications/{id}/manual-review` | Revisión manual |
| POST | `/api/v1/ats/applications/{id}/reset-screening` | Reiniciar evaluación |
| GET | `/api/v1/ats/applications/{id}/rehire-check` | Verificar recontratación |
| POST | `/api/v1/ats/applications/{id}/rehire` | Recontratar |

#### Entrevistas

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/ats/applications/{id}/interviews` | Listar entrevistas |
| POST | `/api/v1/ats/applications/{id}/interviews` | Crear entrevista |
| GET | `/api/v1/ats/interviews/{id}` | Ver entrevista |
| PUT | `/api/v1/ats/interviews/{id}` | Editar entrevista |
| DELETE | `/api/v1/ats/interviews/{id}` | Eliminar entrevista |

#### Ofertas

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/v1/ats/applications/{id}/offer` | Enviar oferta |
| GET | `/api/v1/ats/applications/{id}/offer` | Ver oferta |
| POST | `/api/v1/ats/applications/{id}/offer/resend` | Reenviar oferta |

#### Documentos de alta

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/ats/applications/{id}/onboarding-documents` | Checklist admin |
| POST | `/api/v1/ats/applications/{id}/onboarding-documents/{type}/verify` | Verificar documento |
| POST | `/api/v1/ats/applications/{id}/onboarding-documents/{type}/unverify` | Desverificar documento |

#### Analytics y Emails

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/ats/analytics/pipeline` | Reportes |
| GET/POST/PUT/DELETE | `/api/v1/ats/email-templates` | Plantillas de correo |
| GET | `/api/v1/ats/email-templates/types` | Tipos disponibles |

---

## 9. Máquina de Estados

### Estados de una postulación

```
new
  │
  ├──► screening ──► interview-requested ──► interviewing
  │                                              │
  │                                              ├──► offer-sent ──► hired
  │                                              │
  └──► rejected ◄────────────────────────────────┘
```

### Estados permitidos

| Desde | Hacia permitidos |
|-------|------------------|
| `new` | `screening`, `rejected` |
| `screening` | `interview-requested`, `rejected` |
| `interview-requested` | `interviewing`, `rejected` |
| `interviewing` | `offer-sent`, `hired`, `rejected` |
| `offer-sent` | `hired`, `rejected` |
| `hired` | — |
| `rejected` | — (excepto reset-screening) |

### Estados de una vacante

- `draft` — Borrador
- `open` — Abierta y visible en el portal
- `closed` — Cerrada

### Estados de una entrevista

- `pending`
- `passed`
- `failed`

### Estados de una oferta

- `draft`
- `sent`
- `accepted`
- `rejected`

---

## 10. Lógica de Negocio Clave

### 10.1 Screening / Autoevaluación

- Formato de pregunta: `{ question, options, correctIndex }`.
- `screening_pass_score` entre 1 y 10.
- Preguntas informativas (sin `correctIndex`) no afectan el puntaje y se consideran correctas.
- Fórmula: `score = round(correctas / total * 10)`.
- Si `score >= screening_pass_score`, pasa a `screening`.
- Si `score < screening_pass_score`, pasa a `rejected`.

### 10.2 Scorecard de Entrevista

- `JobOpening.scorecard_template`: criterios definidos al crear la vacante.
- `Interview.scorecard`: evaluación concreta `{ name, score (1-5), notes }`.
- Recomendación calculada por promedio:
  - ≥ 4.5 → "Excelente elección"
  - ≥ 3.5 → "Buena elección"
  - ≥ 2.5 → "Regular"
  - < 2.5 → "No recomendado"

### 10.3 Guía de Entrevista

- `JobOpening.interview_guide_questions`: arreglo `{ category, question }`.
- Categorías: Motivación, Experiencia, Disponibilidad, Actitud, Conocimiento técnico.
- Se usa en el "Modo Entrevista" del ERP para guiar al entrevistador.

### 10.4 Checklist de Documentos

- `Interview.document_checklist`: seguimiento de documentos presentados/faltantes/pendientes.
- Tipos: acta de nacimiento, CURP, comprobante de domicilio, RFC, NSS, CV, INE, etc.

### 10.5 Recontratación

- Al aplicar se consulta `Empleado::withTrashed()` por email, RFC o CURP.
- Se marca `is_rehire = true` y `blacklist_alert = true` si aplica.
- Admin puede recontratar restaurando el registro de empleado anterior.

### 10.6 Notificaciones

**Tipos de notificación:**
- Aplicación recibida
- Entrevista programada / recordatorio
- Oferta enviada
- Contratación
- Rechazo

**Canales:**
- Email: usa plantillas personalizables por empresa (`EmailTemplate`) o Mailables predefinidos.
- WhatsApp: envía mensajes si el candidato tiene teléfono y se habilita `notify_whatsapp`.

### 10.7 Almacenamiento de Archivos

- Disco privado (`s3_private` o `local`).
- Prohibido el uso de disco `public`.
- URLs firmadas de 30 minutos.
- Validación de MIME type y tamaño máximo (5 MB por defecto).

### 10.8 Analytics

El reporte `/api/v1/ats/analytics/pipeline` devuelve:
- Totales por estado
- Funnel de conversión
- Tiempos promedio entre etapas
- Top 10 motivos de rechazo
- Vacantes abiertas con conteos
- Entrevistas próximas 7 días

---

## 11. Componentes y Vistas Principales

### 11.1 Frontend ERP Kore

| Ruta | Componente | Descripción |
|------|------------|-------------|
| `/app/manager/reclutamiento` | `RecruitmentDashboard` | KPIs generales |
| `/app/manager/reclutamiento/vacantes` | `RecruitmentJobs` | CRUD de vacantes |
| `/app/manager/reclutamiento/candidatos` | `RecruitmentCandidates` | Pipeline Kanban |
| `/app/manager/reclutamiento/candidatos/:id` | `RecruitmentCandidateDetail` | Detalle del candidato |
| `/app/manager/reclutamiento/emails` | `RecruitmentEmailTemplates` | Plantillas de email |
| `/app/manager/reclutamiento/reportes` | `RecruitmentReports` | Analytics |

**Componentes clave:**
- `JobFormWizard`: asistente de creación/edición de vacantes.
- `InterviewModePanel`: panel lateral de modo entrevista.
- `BulletListField`: campos de lista multilínea.
- `WhatsAppTestWidget`: prueba de WhatsApp desde dashboard.

### 11.2 Portal de Vacantes

| Ruta | Página | Descripción |
|------|--------|-------------|
| `/` | `VacancyList` | Landing de vacantes |
| `/vacante/:id` | `VacancyDetail` | Detalle de puesto |
| `/login` | `Login` | OAuth Google |
| `/auth/google/callback` | `GoogleCallback` | Callback OAuth |
| `/expediente` | `Expediente` | Datos personales + documentos |
| `/induccion` | `Induccion` | Video de bienvenida |
| `/autoevaluacion` | `Autoevaluacion` | Cuestionario |
| `/estado/:status` | `Estado` | Pantallas de estado |
| `/dashboard` | `Dashboard` | Panel del candidato |
| `/oferta` | `OfferPage` | Aceptación de oferta |

---

## 12. Roles y Permisos

### Roles del sistema

| Rol | Descripción |
|-----|-------------|
| `admin` | Acceso total al ERP y al ATS. |
| `supervisor` | Acceso limitado según módulos asignados. |
| `empleado` | Usuario interno operativo. |
| `empleado_prueba` | Empleado recién contratado en periodo de prueba. |
| `aspirante` | Candidato externo del portal de vacantes. |

### Acceso al módulo de reclutamiento

- **ERP:** El acceso al ATS requiere rol `admin` y el módulo `reclutamiento` activo.
- **Portal:** Solo usuarios con `role = 'aspirante'`.

### Gates relevantes

| Gate | Roles permitidos |
|------|------------------|
| `manage-users` | `admin` |
| `admin` | `admin` |
| `supervisor` | `admin`, `supervisor` |

---

## 13. Integraciones con Otros Módulos

| Módulo | Relación con ATS |
|--------|------------------|
| **Empresa** | `empresa_id` en todas las tablas ATS; `settings.reclutamiento.welcome_video_url` en portal. |
| **Usuarios / Auth** | Aspirantes se autentican con OAuth; al contratar cambian a `empleado_prueba`. |
| **Empleados** | Contratación crea/restaura registro en `Empleado`. |
| **Puestos** | `ApplicationOffer.position_id` y `Empleado.position_id` vinculan catálogo de puestos. |
| **Módulos** | Durante onboarding se asignan módulos individuales al nuevo empleado. |
| **Nómina / Asistencia** | El empleado recién creado puede ser usado por asistencia y nómina. |
| **Correos** | `EmailTemplate` personaliza notificaciones ATS por empresa. |
| **WhatsApp** | Notificaciones push para candidatos. |
| **Almacenamiento** | `SecureFileStorage` para CVs, INE, comprobantes, etc. |

---

## 14. Hallazgos y Observaciones

### 14.1 Frontend ERP Kore

1. **No hay hooks ni stores dedicados** para el módulo; cada página maneja su propio estado con `useState`/`useEffect`.
2. **Módulo `reclutamiento` ausente en la UI de Capacidades** (`ConfiguracionPage.tsx`), aunque el código de menú y rutas lo soporta.
3. **Variable `VITE_PORTAL_URL` no documentada** en `.env.example`, lo que puede causar links de compartir incorrectos en desarrollo.
4. **Mix de endpoints legacy y nuevos**: existe `scheduleInterview` pero el detalle usa `createInterview`, lo que sugiere migración en curso.
5. **No hay drag-and-drop real** en el Kanban; los candidatos se mueven mediante botones "Avanzar".

### 14.2 Backend Laravel

1. **Inconsistencia menor en comentarios de migraciones:** la migración base de `applications` menciona estados como `testing` y `offering`, pero el código real usa `screening`, `interview-requested`, `interviewing`, `offer-sent`.
2. **Aceptación de oferta:** no valida la máquina de estados `canTransition`, solo que la aplicación esté en `offer-sent`.
3. **Configuración de WhatsApp:** los tests referencian `api.callmebot.com`, pero el servicio actual usa Evolution API.
4. **Guía de entrevista y checklist:** campos agregados recientemente (2026-07-03), el frontend debe manejarlos como JSON.
5. **No hay módulo `reclutamiento` en `empresa_modules`:** el acceso admin al ATS se basa únicamente en el rol `admin`.

### 14.3 Portal de Vacantes

1. **Aplicación separada del ERP Kore**, con dominio propio y branding específico (Decorarte Repostería).
2. **Autenticación dual:** OAuth Google para aspirantes vs. Sanctum para ERP.
3. **Progreso local en `localStorage`** para el flujo de postulación.
4. **Contenido de vacante dual:** detecta si la vacante tiene secciones estructuradas o legacy.
5. **Video de inducción flexible:** soporta YouTube y video directo.

---

## 15. Archivos Clave por Proyecto

### Frontend ERP Kore

- `src/features/recruitment/api/recruitmentApi.ts`
- `src/features/recruitment/components/JobFormWizard.tsx`
- `src/features/recruitment/components/InterviewModePanel.tsx`
- `src/features/recruitment/pages/RecruitmentJobs.tsx`
- `src/features/recruitment/pages/RecruitmentCandidates.tsx`
- `src/features/recruitment/pages/RecruitmentCandidateDetail.tsx`
- `src/features/recruitment/types/recruitment.ts`
- `src/app/routes.tsx`

### Backend Laravel

- `app/Models/JobOpening.php`
- `app/Models/Application.php`
- `app/Models/Interview.php`
- `app/Models/ApplicationOffer.php`
- `app/Http/Controllers/Api/V1/JobOpeningController.php`
- `app/Http/Controllers/Api/V1/ApplicationController.php`
- `app/Http/Controllers/Api/V1/InterviewController.php`
- `app/Services/AtsNotificationService.php`
- `app/Services/EmployeeOnboardingService.php`
- `app/Services/InterviewService.php`
- `routes/api.php`

### Portal de Vacantes

- `app/src/App.tsx`
- `app/src/pages/VacancyList.tsx`
- `app/src/pages/VacancyDetail.tsx`
- `app/src/pages/Expediente.tsx`
- `app/src/pages/Induccion.tsx`
- `app/src/pages/Autoevaluacion.tsx`
- `app/src/pages/Dashboard.tsx`
- `app/src/pages/OfferPage.tsx`
- `app/src/lib/http.ts`
- `app/src/hooks/useAuth.ts`

---

*Fin de la documentación.*
