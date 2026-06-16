# 🏗️ Kore Ops Suite — Análisis Técnico Completo (Full-Stack)

> **Documento:** Análisis Arquitectónico y Funcional Unificado  
> **Proyecto:** Kore Ops Suite — ERP de Operaciones para Recursos Humanos  
> **Repositorios:**  
> - 🌐 Frontend: `github.com/pcmaster-prog/Kore-react-frontend`  
> - ⚙️ Backend: `github.com/pcmaster-prog/Kore-laravel-backend`  
> **Actualizado:** Junio 2026

---

## 📌 Tabla de Contenidos

1. [Visión General del Producto](#1-visión-general-del-producto)
2. [Stack Tecnológico Completo](#2-stack-tecnológico-completo)
3. [Arquitectura de Alto Nivel (Full-Stack)](#3-arquitectura-de-alto-nivel-full-stack)
4. [Backend — Laravel 11 API](#4-backend--laravel-11-api)
   - [4.1 Modelo Multi-Tenant](#41-modelo-multi-tenant)
   - [4.2 Sistema de Middlewares y Control de Acceso](#42-sistema-de-middlewares-y-control-de-acceso)
   - [4.3 Módulos del Negocio](#43-módulos-del-negocio)
   - [4.4 Integraciones Externas del Backend](#44-integraciones-externas-del-backend)
   - [4.5 Escalabilidad y Seguridad](#45-escalabilidad-y-seguridad)
5. [Frontend — React 19 + Vite 7](#5-frontend--react-19--vite-7)
   - [5.1 Arquitectura por Features (FSD)](#51-arquitectura-por-features-fsd)
   - [5.2 Sistema de Rutas y Guards](#52-sistema-de-rutas-y-guards)
   - [5.3 Gestión de Estado](#53-gestión-de-estado)
   - [5.4 Capa HTTP — Integración con Backend](#54-capa-http--integración-con-backend)
   - [5.5 Sistema de Notificaciones Push (FCM)](#55-sistema-de-notificaciones-push-fcm)
   - [5.6 PWA — Capacidades Offline y Estrategias de Caché](#56-pwa--capacidades-offline-y-estrategias-de-caché)
   - [5.7 Aplicación Nativa Android (Capacitor)](#57-aplicación-nativa-android-capacitor)
   - [5.8 Feature Flags y Gestión de Releases](#58-feature-flags-y-gestión-de-releases)
6. [Flujos Funcionales End-to-End](#6-flujos-funcionales-end-to-end)
   - [6.1 Flujo de Autenticación](#61-flujo-de-autenticación)
   - [6.2 Flujo de Asistencia (Check-In)](#62-flujo-de-asistencia-check-in)
   - [6.3 Flujo de Tareas con Evidencia](#63-flujo-de-tareas-con-evidencia)
   - [6.4 Flujo de Nómina y Recibos](#64-flujo-de-nómina-y-recibos)
   - [6.5 Flujo de Góndolas (Inventario en Piso)](#65-flujo-de-góndolas-inventario-en-piso)
7. [Resiliencia, Calidad y Prácticas de Ingeniería](#7-resiliencia-calidad-y-prácticas-de-ingeniería)
8. [Infraestructura y Despliegue](#8-infraestructura-y-despliegue)
9. [Consideraciones Técnicas y Áreas de Mejora](#9-consideraciones-técnicas-y-áreas-de-mejora)
10. [Conclusión](#10-conclusión)

---

## 1. Visión General del Producto

**Kore Ops Suite** no es una simple aplicación web. Es un **ERP de Operaciones de Campo** diseñado específicamente para empresas que combinan la gestión clásica de Recursos Humanos con la operatividad en el piso de trabajo (tiendas, almacenes, plantas).

Su objetivo es unificar en una sola plataforma todo el ciclo operativo de un empleado:

| Dominio | Cobertura |
|---|---|
| 🏢 Configuración | Empresa, IPs, días festivos, módulos activos, estructura organizacional |
| 👥 Empleados | Alta, expediente digital, vinculación con usuario del sistema |
| ⏱️ Asistencia | Entradas/salidas, comidas, pausas, retardos, faltas |
| 📋 Tareas | Asignación, evidencia fotográfica, revisión y aprobación |
| 💰 Nómina | Periodos, cálculo automático, recibos digitales, gratificaciones |
| 🛒 Góndolas | Gestión de inventario en piso, órdenes de relleno con comprobante |
| 🚦 Semáforo | Evaluación de desempeño ponderada (Rojo / Amarillo / Verde) |
| 📊 Reportes | Generación de informes exportables en PDF directo desde el cliente |

El sistema distingue claramente tres **perfiles de usuario**: `admin`, `supervisor` y `empleado`, cada uno con vistas, permisos y flujos de trabajo diferenciados tanto en el frontend como en el backend.

---

## 2. Stack Tecnológico Completo

### 🌐 Frontend

| Categoría | Tecnología | Versión | Propósito |
|---|---|---|---|
| Framework UI | React | 19 | Renderizado de la interfaz |
| Lenguaje | TypeScript | ~5.9 | Tipado estático |
| Build Tool | Vite | 7 | Empaquetado y HMR ultrarrápido |
| Enrutamiento | React Router DOM | 7 | Navegación del lado del cliente (SPA) |
| Estado del Cliente | Zustand | 5 | Estado global de UI y sesión |
| Estado del Servidor | TanStack React Query | 5 | Caching, fetching y sincronización |
| HTTP Client | Axios | 1.13 | Comunicación con la API |
| Estilos | Tailwind CSS | 4 | Utilidades CSS y sistema de diseño |
| Iconos | Lucide React | 0.563 | Librería de íconos consistentes |
| Gráficos | Recharts | 3 | Visualización de KPIs y reportes |
| PDF/Reportes | jsPDF + html2canvas | 4 / 1.4 | Generación de documentos en el cliente |
| Seguridad HTML | DOMPurify | 3 | Sanitización de contenido HTML |
| Imágenes | browser-image-compression | 2 | Compresión antes de subir al server |
| PWA | vite-plugin-pwa + Workbox | 1.2 | Caché offline y Service Worker |
| Nativo Android | Capacitor | 8 | Empaquetado como app Android nativa |
| Notificaciones | Firebase SDK | 12 | Push notifications vía FCM |
| Testing | Vitest + Testing Library | 4 | Tests unitarios e integración |

### ⚙️ Backend

| Categoría | Tecnología | Versión | Propósito |
|---|---|---|---|
| Framework Core | Laravel | 11 | API RESTful principal |
| Lenguaje | PHP | ^8.2 | Runtime del servidor |
| Autenticación | Laravel Sanctum | — | Emisión y validación de tokens de API |
| Base de Datos | PostgreSQL | — | Persistencia principal (ORM Eloquent) |
| Almacenamiento | Amazon S3 | — | Fotos, documentos y evidencias |
| Correo | Resend | — | Envío de credenciales y documentos (onboarding) |
| Notificaciones Push | Firebase FCM | — | Alertas en tiempo real a empleados y managers |
| Infraestructura | Railway | — | Plataforma de despliegue en la nube |
| Identificadores | UUIDs | — | IDs en todas las entidades críticas |

---

## 3. Arquitectura de Alto Nivel (Full-Stack)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        KORE OPS SUITE                               │
│                                                                     │
│   ┌──────────────────────────────────────────────────────────┐     │
│   │                   CLIENTE (Frontend)                      │     │
│   │                                                          │     │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │     │
│   │  │  Browser PWA  │  │  Android App  │  │    iOS App   │  │     │
│   │  │  (Chrome,     │  │  (Capacitor)  │  │  (Capacitor) │  │     │
│   │  │   Safari...)  │  │               │  │              │  │     │
│   │  └──────┬───────┘  └──────┬────────┘  └──────┬───────┘  │     │
│   │         │                 │                   │          │     │
│   │         └─────────────────┼───────────────────┘          │     │
│   │                           │                              │     │
│   │         ┌─────────────────▼──────────────────┐           │     │
│   │         │          React 19 + Vite 7          │           │     │
│   │         │  ┌──────────┐  ┌────────────────┐  │           │     │
│   │         │  │ Zustand  │  │  React Query   │  │           │     │
│   │         │  │ (UI/UX)  │  │ (Server State) │  │           │     │
│   │         │  └──────────┘  └────────────────┘  │           │     │
│   │         │  ┌──────────────────────────────┐  │           │     │
│   │         │  │       Axios HTTP Client       │  │           │     │
│   │         │  │  (Interceptors, CSRF, Auth)   │  │           │     │
│   │         │  └──────────────────────────────┘  │           │     │
│   │         └─────────────────┬──────────────────┘           │     │
│   └───────────────────────────┼──────────────────────────────┘     │
│                               │ HTTPS / REST                        │
│                               │ Bearer Token (Sanctum)              │
│   ┌───────────────────────────▼──────────────────────────────┐     │
│   │                   SERVIDOR (Backend)                      │     │
│   │                                                          │     │
│   │  ┌─────────────────────────────────────────────────┐    │     │
│   │  │               Laravel 11 API                    │    │     │
│   │  │  ┌─────────────┐  ┌──────────────────────────┐  │    │     │
│   │  │  │ Middlewares  │  │      Controllers /        │  │    │     │
│   │  │  │ auth:sanctum │  │      API Resources        │  │    │     │
│   │  │  │ tenant       │  │                           │  │    │     │
│   │  │  │ module:*     │  │  ┌────────┐ ┌─────────┐  │  │    │     │
│   │  │  │ role:*       │  │  │ Models │ │Eloquent │  │  │    │     │
│   │  │  └─────────────┘  │  │(Tenant)│ │  ORM    │  │  │    │     │
│   │  │                   │  └────────┘ └─────────┘  │  │    │     │
│   │  └──────────────────────────────────────────────┘    │     │
│   │                                                          │     │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │     │
│   │  │PostgreSQL│  │   AWS S3  │  │  Firebase │  │ Resend │  │     │
│   │  │  (Data)  │  │  (Files) │  │   (Push)  │  │ (Mail) │  │     │
│   │  └──────────┘  └──────────┘  └──────────┘  └────────┘  │     │
│   └──────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Backend — Laravel 11 API

### 4.1 Modelo Multi-Tenant

El backend está diseñado bajo una arquitectura **multi-tenant** donde el concepto central es la **Empresa**. Cada usuario pertenece a una empresa (tenant), y absolutamente todas las operaciones de lectura y escritura están restringidas a los datos de ese tenant específico.

```
Empresa (Tenant)
 ├── Users (credenciales de acceso)
 │    └── roles: admin | supervisor | empleado
 ├── Empleados (datos operativos / expediente)
 │    ├── Asistencia (AttendanceDays)
 │    ├── Nómina (PayrollEntries)
 │    └── Tareas (TaskAssignments)
 ├── Áreas y Secciones (estructura organizacional)
 ├── Módulos activos (feature toggles por tenant)
 └── Configuraciones (IPs, días festivos, semáforo...)
```

La separación entre `User` (credenciales) y `Empleado` (datos operativos) es una decisión de diseño inteligente que permite:
- Gestionar empleados antes de que tengan cuenta en el sistema.
- Reasignar usuarios a diferentes registros de empleado.
- Mantener un histórico de nómina incluso si un usuario cambia sus credenciales.

### 4.2 Sistema de Middlewares y Control de Acceso

El control de acceso opera en **cuatro capas de middleware apiladas**, aplicando el principio de defensa en profundidad:

```
REQUEST
   │
   ▼
[1] auth:sanctum         → ¿El token es válido y activo?
   │
   ▼
[2] tenant               → ¿El request pertenece al tenant correcto?
   │                        Restringe automáticamente todas las queries a la empresa.
   ▼
[3] module:asistencia    → ¿La empresa tiene contratado este módulo?
   │                        Permite activar/desactivar funcionalidades por tenant.
   ▼
[4] role:admin           → ¿El usuario tiene el rol necesario para esta acción?
   │
   ▼
CONTROLLER / RESOURCE
```

Esta arquitectura de middlewares garantiza que incluso si un bug permite omitir una capa, las demás capas actúan como red de seguridad.

**Roles del sistema:**

| Rol | Acceso | Capacidades Principales |
|---|---|---|
| `admin` | Total a su empresa | Configuración, nómina, empleados, reportes completos |
| `supervisor` | Operativo | Asistencia del equipo, tareas, semáforo, bitácora |
| `empleado` | Personal | Sus tareas, su asistencia, sus recibos |

### 4.3 Módulos del Negocio

#### 🧩 Módulo de Configuración y Empleados

El corazón administrativo del sistema:

- **Configuración de Empresa:** IPs de acceso permitidas (geofencing por IP para el fichaje), días festivos, documentos corporativos (reglamentos, contratos tipo).
- **Estructura Organizacional:** Gestión de `Áreas`, `Secciones` y `Positions` (puestos/cargos) que sirven como contenedores para la asignación de tareas.
- **Gestión de Empleados:** CRUD completo del expediente (`Empleado`), incluyendo RFC, NSS, foto, documento de expediente en PDF (almacenado en S3) e historial.
- **Vinculación User ↔ Empleado:** Un proceso dedicado para enlazar una cuenta de usuario (login) con su registro de empleado.
- **Dashboards Diferenciados:** El backend provee endpoints específicos para el dashboard de `Manager/Admin`, `Supervisor` y `Empleado`, devolviendo KPIs y métricas adaptados a cada rol.

#### 📋 Módulo de Tareas (Task Management)

Uno de los motores más complejos del sistema:

- **Catálogo de Tareas y Plantillas (`TaskTemplates`):** Definición reutilizable de tareas con sus requerimientos de evidencia.
- **Rutinas (`TaskRoutines`) y Horarios (`RoutineSchedules`):** Agrupaciones de tareas recurrentes que se generan automáticamente según una frecuencia definida (diaria, semanal, etc.).
- **Reglas de Asignación (`TaskAssignmentRules`):** Lógica para asignar tareas automáticamente a empleados o grupos basándose en área, sección o turno.
- **Flujo de Vida de una Tarea:**

  ```
  CREADA → ASIGNADA → INICIADA → COMPLETADA (pendiente revisión)
                                      ↓
                              [Supervisor revisa]
                                 ↙         ↘
                          APROBADA       RECHAZADA
                                            ↓
                                      (Empleado reintenta)
  ```

- **Evidencias:** Las tareas completadas requieren comprobación fotográfica o documental. El archivo se comprime en el cliente antes de ser subido a S3 vía backend.
- **Cola de Revisión (`reviewQueue`):** Vista dedicada para supervisores que centraliza todas las tareas pendientes de aprobación.
- **Tareas Huérfanas:** El sistema detecta tareas creadas que nunca fueron asignadas, mostrándolas en una vista dedicada para el manager (`TareasHuerfanasPage`).

#### ⏱️ Módulo de Asistencia (Time & Attendance)

Control de tiempo granular con múltiples estados:

| Endpoint | Acción | Actor |
|---|---|---|
| `check_in` | Entrada al turno | Empleado |
| `break_start` | Inicio de pausa | Empleado |
| `break_end` | Fin de pausa | Empleado |
| `meal_start` | Inicio de comida | Empleado |
| `meal_end` | Fin de comida | Empleado |
| `check_out` | Salida del turno | Empleado |
| `ajustar` | Corrección manual de registros | Admin/Supervisor |

**Sistemas adicionales de asistencia:**

- **`TardinessConfigController`:** Configura los umbrales de tolerancia para retardos. El backend calcula automáticamente si un check-in constituye un retardo basándose en el horario asignado al empleado.
- **Resúmenes Mensuales:** Endpoints que agregan los datos de asistencia por periodo para su uso en el cálculo de nómina.
- **Flujos de Solicitudes:**
  - **Ausencias Justificadas:** El empleado solicita, el manager aprueba/rechaza.
  - **`MealSwapRequest`:** Permiso para cambiar el horario de la comida.
  - **`OvertimeRequest`:** Solicitud y registro de horas extra con su respectiva aprobación.

#### 💰 Módulo de Nómina (Payroll)

- **Periodos de Pago (`PayrollPeriod`):** Creación y definición del rango de fechas (ej. semana del 10 al 16 de junio).
- **Generación de Entradas (`PayrollEntry`):** El backend calcula automáticamente para cada empleado las horas trabajadas, los retardos acumulados (y su descuento correspondiente), los días de descanso y aplica las reglas de nómina de la empresa.
- **Cierre Masivo:** Un endpoint permite al admin cerrar todos los registros de un periodo de una sola vez, marcándolos como definitivos.
- **Gratificaciones (`GratificationTypes`):** Sistema configurable de bonos o pagos extraordinarios (vales, premios, comisiones) que se pueden agregar a un periodo.
- **Recibos Digitales (`EmployeeReceiptController`):** Los empleados acceden a sus recibos históricos y tienen la capacidad de "firmar" digitalmente, confirmando que han recibido y revisado el documento.

#### 🛒 Módulo de Góndolas (Inventario en Piso)

Diseñado específicamente para operaciones de **retail o gestión de anaqueles**:

- **Mapeo Producto-Góndola:** Cada producto tiene una ubicación física asignada en el almacén o tienda.
- **Órdenes de Relleno (`GondolaOrdenes`):** Un supervisor o el sistema detecta que una góndola requiere resurtido y genera una orden.
- **Flujo de Relleno:**

  ```
  ORDEN CREADA (supervisor)
       ↓
  INICIADA (empleado acepta la orden)
       ↓
  EN PROCESO (empleado rellena físicamente)
       ↓
  COMPLETADA (empleado genera comprobante fotográfico)
  ```

- **Comprobante de Relleno:** Al completar, el sistema genera un registro documental del relleno.

#### 🚦 Módulo de Semáforo de Desempeño

Sistema de evaluación continua del performance de los empleados:

- **Evaluación por Admin/Supervisor:** Los supervisores pueden evaluar a los empleados bajo su cargo a través del endpoint `evaluarAdmin`.
- **Evaluación Peer-to-Peer:** Permite que compañeros de trabajo se evalúen entre sí, agregando una dimensión de evaluación 360°.
- **Clasificación Ponderada:** El sistema combina las evaluaciones, asistencia y tareas completadas para generar un indicador visual de desempeño:
  - 🔴 **Rojo:** Desempeño deficiente / por debajo del umbral mínimo.
  - 🟡 **Amarillo:** Desempeño aceptable / área de mejora.
  - 🟢 **Verde:** Desempeño destacado / cumple o supera los objetivos.

### 4.4 Integraciones Externas del Backend

| Servicio | Caso de Uso | Detalles |
|---|---|---|
| **Amazon S3** | Almacenamiento de archivos | Fotos de evidencias de tareas, expedientes en PDF, documentos corporativos. Se exponen a través de URIs temporales firmadas para máxima seguridad. |
| **Firebase FCM** | Notificaciones Push | El backend almacena el token FCM de cada dispositivo. Envía notificaciones cuando: se asigna una tarea, se rechaza una evidencia, hay un aviso de la empresa. |
| **Resend** | Email transaccional | Se usa principalmente en el flujo de **onboarding**: enviar correo de bienvenida al nuevo empleado con sus credenciales iniciales, adjuntando documentos como el reglamento interno. |

### 4.5 Escalabilidad y Seguridad

- **UUIDs Globales:** Todas las entidades críticas (empleados, tareas, periodos de nómina) usan UUIDs en lugar de IDs secuenciales, previniendo enumeración y mejorando seguridad.
- **Auditoría:** Tablas `ActivityLog` y `AuditLog` rastrean quién modificó qué y cuándo en el sistema.
- **Soft Deletes (planificado):** Los modelos críticos (`Empleado`, `Task`, `PayrollPeriod`, etc.) están siendo migrados a soft deletes para preservar el histórico ante borrados accidentales.
- **Rate Limiting:** Endpoints sensibles (check-in, subida de evidencias) tienen throttling estricto para prevenir abusos.
- **Queue de Notificaciones (planificado):** Las notificaciones FCM se están migrando a una cola asíncrona (`QUEUE_CONNECTION=database`) para evitar que fallos de Firebase afecten la respuesta del servidor.

---

## 5. Frontend — React 19 + Vite 7

### 5.1 Arquitectura por Features (FSD)

El frontend implementa una variante del patrón **Feature-Sliced Design**, donde el código se organiza por _dominio de negocio_ en lugar de por tipo de archivo. Esto resulta en módulos altamente cohesivos y de bajo acoplamiento:

```
src/
├── app/                        # Inicialización y configuración global
│   ├── routes.tsx              # Router central con lazy loading
│   ├── guards/                 # RequireAuth, RequireRole
│   └── layout/                 # AppShell (layout principal con nav)
│
├── components/                 # Componentes de UI genéricos y reutilizables
│   ├── PageHeader.tsx          # Encabezado estándar de páginas
│   ├── KpiCard.tsx             # Tarjeta de indicadores clave
│   ├── EmptyState.tsx          # Estado vacío (celebration/neutral/action)
│   ├── ThemeSwitcher.tsx       # Toggle dark/light mode
│   ├── ErrorBoundary.tsx       # Captura de errores de renderizado
│   ├── GlobalErrorToast.tsx    # Toast global para errores 500+
│   ├── NotificationToast.tsx   # Notificaciones in-app
│   ├── PWAInstallPrompt.tsx    # Prompt de instalación de la PWA
│   └── PageSkeleton.tsx        # Skeleton loading entre lazy routes
│
├── features/                   # ← CORAZÓN DE LA APP (17 módulos)
│   ├── auth/                   # Login, Register, authStore
│   ├── dashboard/              # ManagerDashboard, EmployeeDashboard
│   ├── tasks/                  # Tareas (manager + empleado + áreas + rutinas)
│   ├── routines/               # Gestión de rutinas recurrentes
│   ├── attendance/             # Asistencia (manager + empleado)
│   ├── tardiness/              # Retardos y faltas
│   ├── employees/              # Gestión de expedientes
│   ├── profile/                # Perfil personal del usuario
│   ├── nomina/                 # Gestión de nómina (admin)
│   ├── recibos/                # Mis recibos (empleado) + tipos de gratificación
│   ├── gondolas/               # Relleno de góndolas
│   ├── semaforo/               # Semáforo de desempeño
│   ├── reportes/               # Generación de reportes
│   ├── configuracion/          # Configuración de empresa
│   ├── bitacora/               # Bitácora de actividad
│   ├── activity/               # Log de actividades
│   └── templates/              # Plantillas de tareas
│
├── lib/                        # Configuraciones de librerías core
│   ├── http.ts                 # Cliente Axios + interceptors
│   ├── firebase.ts             # Setup FCM + lazy messaging
│   ├── queryClient.ts          # Configuración de React Query
│   ├── featureFlags.ts         # Sistema de feature flags
│   ├── imageCompression.ts     # Compresión de imágenes antes del upload
│   ├── sanitize.tsx            # DOMPurify para HTML seguro
│   └── utils.ts                # Utilidades generales
│
├── hooks/                      # Custom hooks globales
├── types/                      # Definiciones de tipos TypeScript
├── styles/                     # Temas CSS (dark/light)
└── mocks/                      # Datos mock para pruebas
```

### 5.2 Sistema de Rutas y Guards

El enrutador (`routes.tsx`) implementa un sofisticado sistema de control de acceso de **dos niveles**:

**Nivel 1 — `RequireAuth`:** Verifica que exista una sesión activa. Si no hay token, redirige a `/login`.

**Nivel 2 — `RequireRole`:** Verifica que el rol del usuario tenga permiso para esa ruta específica. Si el rol es insuficiente, redirige al dashboard correspondiente.

```
/login                              (público)
/register                           (público)
/app                                [RequireAuth]
  ├── /                             → RoleAwareRedirect (admin/sup → manager, emp → employee)
  │
  ├── manager/dashboard             [RequireRole: admin, supervisor]
  ├── manager/tareas                [RequireRole: admin, supervisor]
  ├── manager/tareas/areas          [RequireRole: admin, supervisor]
  ├── manager/tareas/huerfanas      [RequireRole: admin, supervisor]
  ├── manager/tareas/rutinas/:id    [RequireRole: admin, supervisor]
  ├── manager/bitacora              [RequireRole: admin, supervisor]
  ├── manager/asistencia            [RequireRole: admin, supervisor]
  ├── manager/semaforo              [RequireRole: admin, supervisor]
  ├── manager/reportes              [RequireRole: admin, supervisor]
  ├── manager/usuarios              [RequireRole: admin ONLY]
  ├── manager/configuracion         [RequireRole: admin ONLY]
  ├── manager/nomina                [RequireRole: admin ONLY]
  ├── manager/tipos-gratificacion   [RequireRole: admin ONLY]
  │
  ├── employee/dashboard            [RequireRole: empleado]
  ├── employee/mis-tareas/asignaciones  [RequireRole: empleado]
  ├── employee/mis-tareas/areas     [RequireRole: empleado]
  ├── employee/asistencia           [RequireAuth]
  ├── employee/gondola-relleno/:id  [RequireAuth]
  ├── employee/mis-recibos          [RequireRole: empleado]
  │
  └── perfil                        [RequireAuth] (compartida, ambos roles)
```

**Lazy Loading Universal:** Todas las rutas (excepto Login/Register) son cargadas de forma diferida usando `React.lazy()` con un `<Suspense fallback={<PageSkeleton />}>` envolviendo cada componente. Esto garantiza que el bundle inicial sea mínimo y la app cargue instantáneamente.

### 5.3 Gestión de Estado

El frontend usa una **estrategia de estado dual** que separa claramente las responsabilidades:

#### Zustand — Estado del Cliente (UI, Sesión)

```typescript
// authStore: gestiona token, usuario, expiración
const { token, user, isTokenExpired, logout } = useAuthStore();

// El token se persiste en localStorage para sobrevivir recargas
// isTokenExpired() se verifica en cada request antes de enviarlo
```

Zustand maneja:
- Datos de sesión del usuario (token, rol, empresa, datos de perfil)
- Preferencias de UI (tema, estado de paneles)
- Estado de notificaciones temporales

#### TanStack React Query — Estado del Servidor (API Data)

```typescript
// Patrón típico en cada feature:
const { data: tasks, isLoading, error } = useQuery({
  queryKey: ['tasks', filters],
  queryFn: () => api.get('/tareas'),
  staleTime: 1000 * 60 * 5, // 5 minutos de caché
});
```

React Query gestiona:
- Caching automático de respuestas de la API
- Re-fetching inteligente (al enfocar ventana, al reconectar red)
- Estado de carga, error y éxito en cada request
- Invalidación de caché tras mutaciones (POST/PUT/DELETE)
- Paginación y queries infinitas

### 5.4 Capa HTTP — Integración con Backend

El cliente HTTP (`src/lib/http.ts`) es una instancia configurada de Axios con interceptors que implementa un flujo de autenticación completo:

```
[TODA REQUEST SALIENTE]
        │
        ▼
[Request Interceptor]
  1. Leer token del authStore (Zustand)
  2. ¿El token está expirado? → logout() + evento "kore:unauthorized"
  3. No expirado → adjuntar "Authorization: Bearer {token}"
        │
        ▼
[API de Laravel] ←──── HTTPS ────────────────────────────────────┐
        │                                                         │
        ▼                                                         │
[Response Interceptor]                                            │
  - HTTP 401 → logout() + evento "kore:unauthorized"             │
  - HTTP 500+ → dispara evento "kore-error" con el mensaje       │
                → GlobalErrorToast.tsx lo escucha y lo muestra   │
  - HTTP 2xx → retorna response normalmente                      │
        │                                                         │
        ▼                                                         │
[React Query / Componente]                                        │
```

**Flujo CSRF con Sanctum:**
Antes de cualquier operación que modifique datos (POST/PUT/DELETE), la función `fetchCsrfCookie()` obtiene la cookie CSRF de Laravel Sanctum, protegiéndose contra ataques de tipo CSRF.

**Variables de entorno:**
```
VITE_API_URL=https://kore-laravel-backend-production.up.railway.app/api/v1
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_PROJECT_ID=kore-ops
VITE_FIREBASE_VAPID_KEY=...
```

### 5.5 Sistema de Notificaciones Push (FCM)

La integración con Firebase Cloud Messaging está diseñada con una estrategia de **carga diferida (lazy)** para minimizar el impacto en el bundle inicial:

```typescript
// firebase.ts — Patrón de carga diferida

// ✅ El SDK de messaging NO se incluye en el bundle inicial
// Solo se carga cuando el usuario otorga permiso de notificaciones

export async function requestNotificationPermission(): Promise<string | null> {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  // Solo aquí se importa getToken (lazy import)
  const { getToken } = await import('firebase/messaging');
  const token = await getToken(messaging, { vapidKey: VAPID_KEY });
  return token;
}
```

**Flujo completo FCM:**
1. El usuario otorga permisos de notificación en el navegador.
2. El frontend obtiene el token FCM del dispositivo.
3. Este token se envía al backend (`POST /fcm/token`), donde se almacena vinculado al usuario.
4. Cuando ocurre un evento relevante (tarea asignada, evidencia rechazada), el backend usa FCM para enviar una notificación push al dispositivo específico.
5. Si la app está en primer plano, `onForegroundMessage()` captura la notificación y la muestra como un toast in-app.
6. Si está en segundo plano, el Service Worker la maneja mostrando la notificación del sistema operativo.

### 5.6 PWA — Capacidades Offline y Estrategias de Caché

Kore está completamente configurada como una **Progressive Web App** de nivel empresarial. La configuración de Workbox implementa estrategias de caché diferenciadas por tipo de recurso:

| Recurso | Estrategia | Descripción |
|---|---|---|
| App Shell (JS, CSS, HTML) | **Pre-cache** (SW install) | Se descarga completo al instalar. Siempre disponible offline. |
| Llamadas a la API | **NetworkFirst** (10s timeout) | Prioriza la red; si falla, usa la caché. Garantiza datos frescos pero tolera desconexiones. |
| Imágenes externas | **CacheFirst** (30 días) | Sirve desde caché; actualiza en segundo plano. Ahorra ancho de banda en imágenes de evidencias. |

**Actualizaciones automáticas:**
```typescript
// main.tsx — Service Worker auto-update
const updateSW = registerSW({
  onNeedRefresh() {
    // Se detecta nueva versión → pregunta al usuario
    if (confirm("Nueva versión disponible. ¿Actualizar?")) {
      updateSW(true); // Activa el nuevo SW y recarga
    }
  },
  onOfflineReady() {
    // Silencioso: la app ya está lista para uso offline
  },
});
```

**Instalación nativa:** El componente `PWAInstallPrompt.tsx` muestra un banner contextual invitando al usuario a instalar la app en su pantalla de inicio, con la experiencia completa de una app nativa (modo `standalone`, sin barra del navegador).

### 5.7 Aplicación Nativa Android (Capacitor)

El mismo código React se puede compilar como una aplicación Android nativa gracias a **Capacitor 8**:

```typescript
// capacitor.config.ts
const config: CapacitorConfig = {
  appId: 'com.kore.ops',     // ID único en Google Play Store
  appName: 'Kore',
  webDir: 'dist',            // El build de Vite
  server: {
    androidScheme: 'https',  // Sirve desde https://localhost en Android
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#313852',  // Color corporativo de Kore
    },
    StatusBar: {
      style: 'light',
      backgroundColor: '#313852',
    },
  },
};
```

**Comandos de build Android:**
```bash
npm run build:android   # Compila Vite + sincroniza con Capacitor
npm run open:android    # Abre Android Studio para build final / debug
```

Capacitor provee además acceso a APIs nativas como la cámara (para capturar evidencias fotográficas directamente), notificaciones del SO, y geolocalización.

### 5.8 Feature Flags y Gestión de Releases

El sistema cuenta con un mecanismo de **feature flags** en `src/lib/featureFlags.ts` para gestionar el despliegue gradual de nuevas funcionalidades sin necesidad de branches complejos o múltiples deploys:

```typescript
export const featureFlags = {
  newHeader: true,           // Fase 1: Nuevo PageHeader unificado
  newEmptyState: true,       // Fase 1: EmptyState con variantes
  smartKpi: true,            // Fase 1: KpiCard con hideIfZero
  newAdminDashboard: true,   // Fase 2: Dashboard Admin inteligente
  newEmployeeDashboard: true,// Fase 2: Dashboard Empleado inteligente
  newAdminTasks: true,       // Fase 3: Refactor Tasks Admin
  newEmployeeTasks: true,    // Fase 3: Refactor Tasks Empleado
  newTaskModal: true,        // Fase 3: Modal de Nueva Tarea mejorado
  newManagementAdmin: true,  // Fase 4: Gestión Admin refactor
  newTaskModule: true,       // Módulo nuevo: Tareas por Área/Sección v2
} as const;
```

Esto permite:
- **Rollback instantáneo:** Cambiar `true` a `false` revierte una funcionalidad en segundos.
- **Releases por fases:** Los cambios se pueden activar progresivamente (Fase 1 → 2 → 3...).
- **Testing A/B:** Aunque aún no implementado formalmente, la infraestructura lo soporta.

---

## 6. Flujos Funcionales End-to-End

### 6.1 Flujo de Autenticación

```
EMPLEADO (Browser/App)                    BACKEND (Laravel)
       │                                         │
       │── POST /login {email, password} ───────▶│
       │                                         │ Verifica credenciales
       │                                         │ Genera Sanctum token
       │◀── 200 OK {token, user, role} ──────────│
       │                                         │
       │  [Zustand authStore]                    │
       │  token → localStorage                   │
       │  user, role → state                     │
       │                                         │
       │  [Router: RoleAwareRedirect]            │
       │  role === "empleado" → /employee/dashboard
       │  role === "admin"    → /manager/dashboard
       │                                         │
       │── GET /fcm/token {token: "..."} ────────▶│
       │  (registrar dispositivo para push)      │
```

### 6.2 Flujo de Asistencia (Check-In)

```
EMPLEADO                         FRONTEND                       BACKEND
    │                                │                              │
    │── Pulsa "Registrar Entrada" ──▶│                              │
    │                                │── POST /asistencia/entrada ─▶│
    │                                │   {timestamp, location?}     │
    │                                │                              │ Verifica:
    │                                │                              │ - IP permitida
    │                                │                              │ - Horario del empleado
    │                                │                              │ - Calcula retardo (si aplica)
    │                                │                              │ - Guarda AttendanceDay
    │                                │                              │ - Dispara evento FCM (async)
    │                                │◀── 200 OK {attendance} ─────│
    │                                │   [React Query invalida cache]
    │◀── UI muestra estado "EN TURNO"│
    │    con hora de entrada y        │
    │    alerta si fue retardo        │
```

### 6.3 Flujo de Tareas con Evidencia

```
EMPLEADO                         FRONTEND                       BACKEND                   S3
    │                                │                              │                      │
    │── Ve tarea asignada ──────────▶│ GET /mis-asignaciones        │                      │
    │                                │──────────────────────────────▶│                    │
    │                                │◀── [{task, status, deadline}] │                    │
    │                                │                              │                      │
    │── Pulsa "Iniciar Tarea" ───────▶│ PUT /asignaciones/{id}/iniciar                    │
    │                                │──────────────────────────────▶│                    │
    │                                │◀── 200 OK {status: "iniciada"}│                    │
    │                                │                              │                      │
    │── Completa y adjunta foto ─────▶│                              │                      │
    │                                │ [imageCompression.ts]         │                      │
    │                                │ Comprime imagen ≤80% calidad  │                      │
    │                                │                              │                      │
    │                                │ POST /evidencias/upload       │                      │
    │                                │ {file, task_assignment_id} ──▶│                    │
    │                                │                              │── PUT ───────────────▶│
    │                                │                              │  (archivo a S3)       │
    │                                │                              │◀── S3 URL ────────────│
    │                                │◀── 200 OK {evidencia_url} ───│                      │
    │                                │                              │                      │
    │                                │ PUT /asignaciones/{id}/finalizar                    │
    │                                │──────────────────────────────▶│                    │
    │                                │                              │ Estado → "pendiente revisión"
    │                                │                              │ Notifica supervisor (FCM)
```

### 6.4 Flujo de Nómina y Recibos

```
ADMIN                            FRONTEND (Manager)             BACKEND
    │                                │                              │
    │── Define periodo ─────────────▶│ POST /nomina/periodos        │
    │   {week_start, week_end}       │──────────────────────────────▶│
    │                                │                              │ Crea PayrollPeriod
    │                                │                              │
    │── Genera nómina ───────────────▶│ POST /nomina/generar         │
    │                                │──────────────────────────────▶│
    │                                │                              │ Para cada empleado:
    │                                │                              │ - Calcula horas trabajadas
    │                                │                              │ - Descuenta retardos
    │                                │                              │ - Agrega gratificaciones
    │                                │                              │ - Crea PayrollEntry
    │                                │◀── 200 OK {entries: [...]} ──│
    │                                │                              │
    │── Revisa y ajusta ────────────▶│ PATCH /nomina/entries/{id}   │
    │── Cierra periodo ─────────────▶│ POST /nomina/periodos/{id}/cerrar
    │                                │                              │
    │                                │        [EMPLEADO]            │
    │                                │                              │
    │                                │ GET /mis-recibos ────────────▶│
    │                                │◀── [{recibo, periodo, monto}]│
    │                                │                              │
    │                                │ POST /recibos/{id}/firmar ───▶│
    │                                │                              │ Marca firma digital
```

### 6.5 Flujo de Góndolas (Inventario en Piso)

```
SUPERVISOR                       EMPLEADO                       BACKEND
    │                                │                              │
    │── Crea orden de relleno ──────▶│                              │
    │   (detecta góndola vacía)      │ POST /gondolas/ordenes ──────▶│
    │                                │                              │ Crea GondolaOrden
    │                                │                              │ Notifica empleados (FCM)
    │                                │                              │
    │                                │── Ve orden en dashboard ─────▶│
    │                                │ GET /gondolas/ordenes ────────▶│
    │                                │◀── [{orden, productos, ubicacion}]
    │                                │                              │
    │                                │── Inicia orden ─────────────▶│
    │                                │ PUT /gondolas/ordenes/{id}/iniciar
    │                                │                              │
    │                                │── [Rellena físicamente] ─────│
    │                                │                              │
    │                                │── Completa con foto ─────────▶│
    │                                │ POST /evidencias + PUT /ordenes/{id}/completar
    │                                │                              │ Genera comprobante
    │                                │◀── 200 OK (comprobante) ─────│
    │◀── Notificación: orden completada ──────────────────────────── │
```

---

## 7. Resiliencia, Calidad y Prácticas de Ingeniería

### Tolerancia a Fallos en el Frontend

El sistema implementa múltiples capas de recuperación ante errores, especialmente crítico en entornos móviles con conectividad inestable:

**1. Manejo de Chunks Obsoletos (Problema de Deploy)**
```typescript
// main.tsx — Handler global de Promise rejections
window.addEventListener("unhandledrejection", (event) => {
  const msg = event.reason?.message || String(event.reason);
  if (isChunkError(msg)) {
    event.preventDefault();
    window.location.reload(); // Auto-recarga silenciosa
  }
});
```
Cuando se despliega una nueva versión, los chunks de JS con hashes anteriores dejan de existir. Este handler detecta el error específico y recarga automáticamente, evitando "pantallas blancas" post-deploy.

**2. ErrorBoundary de React**
Envuelve toda la aplicación (`<ErrorBoundary>`). Cualquier error no capturado en el árbol de componentes es atrapado aquí, mostrando una pantalla de fallback elegante con opción de recargar.

**3. Route Error Handler**
El router tiene un `errorElement={<RouteError />}` que captura errores específicos de carga de rutas (lazy components), distinguiendo entre errores de chunk (nueva versión) y errores inesperados.

**4. Interceptors de Axios**
- Token expirado → `logout()` automático + evento que redirige al login.
- HTTP 401 → `logout()` + redirección.
- HTTP 500+ → Toast global con el mensaje del servidor.

**5. PWA Offline**
La estrategia `NetworkFirst` con timeout de 10 segundos garantiza que si el servidor no responde, el usuario ve datos cacheados en lugar de un error.

### Testing

El proyecto tiene infraestructura de testing configurada y lista para usar:

```bash
npm run test          # Vitest (modo run, una vez)
npm run test:watch    # Vitest (modo watch, interactivo)
npm run test:coverage # Reporte de cobertura de código
```

- **Vitest:** Test runner moderno, compatible con el ecosistema de Vite (sin configuración extra para transformar TS/JSX).
- **React Testing Library:** Tests centrados en el comportamiento del usuario, no en los detalles de implementación.
- **Testing Library DOM + user-event:** Simulación realista de interacciones de usuario.
- **jsdom:** Entorno de navegador simulado para ejecutar tests en Node.js.

### Calidad de Código

- **TypeScript Strict:** El compilador detecta inconsistencias de tipos en tiempo de desarrollo, antes de llegar a producción.
- **ESLint con reglas Type-Aware:** Las reglas de ESLint específicas de React (`react-hooks`, `react-refresh`) previenen bugs comunes como dependencias faltantes en `useEffect` o componentes que no se recargan en HMR.
- **Sanitización de HTML:** `dompurify` protege contra ataques XSS en cualquier contenido dinámico renderizado como HTML.

---

## 8. Infraestructura y Despliegue

```
┌─────────────────────────────────────────────────────────────────┐
│                    INFRAESTRUCTURA DE PRODUCCIÓN                 │
│                                                                  │
│  ┌─────────────────────────────┐   ┌────────────────────────┐   │
│  │       FRONTEND              │   │       BACKEND           │   │
│  │                             │   │                         │   │
│  │  Vercel (vercel.json ✓)     │   │  Railway                │   │
│  │  ──────────────────────     │   │  ─────────────────────  │   │
│  │  • CDN Global               │   │  • Laravel 11 + PHP 8.2 │   │
│  │  • Build: Vite              │   │  • PostgreSQL (addon)    │   │
│  │  • PWA Service Worker       │   │  • Queue Worker          │   │
│  │  • Auto-deploy desde Git    │   │  • Auto-deploy desde Git │   │
│  │                             │   │                         │   │
│  └─────────────────────────────┘   └────────────────────────┘   │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  Amazon S3   │  │   Firebase   │  │       Resend         │   │
│  │  ──────────  │  │  ──────────  │  │  ─────────────────── │   │
│  │  Evidencias  │  │  FCM Push    │  │  Email transaccional  │   │
│  │  Archivos    │  │  Kore-ops    │  │  Onboarding empleados │   │
│  │  URIs temp.  │  │  Project     │  │                       │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Proceso de Build y Deploy:**

| Entorno | Frontend | Backend |
|---|---|---|
| **Desarrollo** | `npm run dev` (Vite HMR) | `php artisan serve` |
| **Android Dev** | `npm run build:android` → Android Studio | — |
| **Producción Web** | `npm run build` → Vercel CI/CD | Railway CI/CD |
| **Producción APK** | `npx cap build android` → Play Store | — |

**Variables de Entorno:**
- `.env` → Desarrollo local
- `.env.production` → Producción (Vercel/Railway inyectan las vars)

---

## 9. Consideraciones Técnicas y Áreas de Mejora

Las siguientes son mejoras planificadas o identificadas en la especificación técnica del proyecto (`KORE_ESPECIFICACION_TECNICA.md`):

### Backend

| Área | Estado | Impacto |
|---|---|---|
| Form Requests para validación | Planificado | Elimina lógica de validación dentro de controllers |
| Notificaciones FCM en Queue | Planificado | Evita timeouts si Firebase falla |
| Rate Limiting global en API | Planificado | Previene abusos y ataques DDoS |
| Soft Deletes en modelos críticos | Planificado | Preserva histórico de nómina ante borrados |
| API Resources estandarizados | Planificado | Consistencia en las respuestas JSON |
| Cache de cálculos de nómina | Planificado | Performance en generación masiva |
| Timezone por empresa | Planificado | Soporte multi-zona horaria |

### Frontend

| Área | Observación |
|---|---|
| Feature Flags en ON | Todos los flags están en `true`, indicando que las refactorizaciones de las 4 fases ya fueron completadas. |
| Bundle Size | Dependencias grandes (`firebase`, `jspdf`, `recharts`) podrían beneficiarse de tree-shaking adicional. El lazy loading de FCM ya es una buena práctica en esta dirección. |
| Testing Coverage | La infraestructura está lista pero los tests necesitan expandirse en cobertura de los flujos críticos (auth, asistencia, nómina). |
| Offline-first en Mutations | Las mutaciones (POST/PUT) no tienen soporte offline todavía. Si el usuario pierde conexión al hacer check-in, la acción se pierde. Esto podría implementarse con React Query `optimisticUpdates` + background sync del Service Worker. |

---

## 10. Conclusión

**Kore Ops Suite** representa un sistema de gestión empresarial técnicamente maduro que combina de forma efectiva tecnologías modernas tanto en el frontend como en el backend.

### Fortalezas Clave

1. **Arquitectura Modular y Escalable:** La separación por features en el frontend y por módulos/middlewares en el backend permite que cualquier pieza del sistema pueda ser desarrollada, testeada y desplegada de forma independiente.

2. **Multi-plataforma sin duplicar código:** El mismo código React funciona como PWA en el navegador, se instala como app nativa en Android (Capacitor), y en el futuro puede publicarse en iOS, todo manteniendo una única base de código.

3. **Resiliencia Excepcional:** El sistema tiene múltiples capas de recuperación ante fallos: manejo de chunks obsoletos, ErrorBoundary, interceptors HTTP, estrategias de caché PWA y auto-actualización del Service Worker.

4. **Seguridad en Profundidad:** La arquitectura multi-tenant con middlewares apilados (`auth → tenant → module → role`), el uso de UUIDs, la sanitización de HTML y la protección CSRF forman una defensa robusta.

5. **Experiencia de Operación de Campo:** El diseño está claramente orientado a usuarios en campo (empleados en tienda/almacén) que necesitan una interfaz rápida, confiable con mala conexión, y accesible desde sus teléfonos.

### Perfil del Sistema

| Dimensión | Calificación | Justificación |
|---|---|---|
| Madurez Técnica | ⭐⭐⭐⭐⭐ | Stack actualísimo, patrones avanzados |
| Escalabilidad | ⭐⭐⭐⭐☆ | Multi-tenant sólido; queues pendientes |
| Resiliencia | ⭐⭐⭐⭐⭐ | Múltiples capas de tolerancia a fallos |
| Cobertura Funcional | ⭐⭐⭐⭐⭐ | Cubre todo el ciclo operativo de un empleado |
| Testing | ⭐⭐⭐☆☆ | Infraestructura lista; cobertura por expandir |
| Offline-first | ⭐⭐⭐⭐☆ | PWA configurada; mutaciones offline pendientes |

> **Kore Ops Suite es una plataforma de nivel empresarial construida con las mejores prácticas actuales de la industria, lista para crecer con el negocio.**
