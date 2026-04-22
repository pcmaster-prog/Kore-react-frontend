
# 🎯 PROMPT DE AJUSTES UI/UX — KORE OPS SUITE
## Versión 2026-04-22 | Ajustes post-implementación inicial

---

## 📊 1. DASHBOARD PRINCIPAL (Admin)
**Referencias:** image(2).png, image(3).png

### 🔴 Header — Cambios obligatorios
| Antes | Después |
|-------|---------|
| "Dashboard" (título grande) + "Buenos días, Adan · miércoles, 22 de abril" (subtítulo) | **Solo** "Buenos días, Adan" + fecha en una sola línea, tamaño mediano (no hero masivo) |
| Badge "TODO BAJO CONTROL ✓" | **ELIMINAR** completamente |

**Especificación técnica:**
- El header debe ser una sola línea: `Buenos días, Adan · miércoles, 22 de abril`
- Tamaño de fuente: `text-xl` o `text-2xl` máximo (no `text-4xl` como está actualmente)
- Sin fondo oscuro, sin badge de estado. El título "Dashboard" desaparece.
- Los botones de acción rápida ("+ Nueva Tarea", "Ver Asistencia", "Generar Nómina") se mantienen alineados a la derecha.

### 🔴 KPI "Completadas" — Rediseño completo
| Antes | Después |
|-------|---------|
| Card grande vertical: "COMPLETADAS · 9 · Total este mes" | **Card horizontal pequeña**: "Completadas hoy: 0" (o el número del día) |

**Especificación técnica:**
- Cambiar de **vertical a horizontal**
- Dimensiones: ~200px × 80px (no 300px × 150px como está)
- Mostrar solo datos del **día actual**, no del mes
- Si no hay completadas hoy: mostrar "0" o "—" en lugar de ocultar la card
- Ubicación: alineada a la izquierda, al mismo nivel del header o justo debajo en una sola fila

### 🔴 Botón "6/16 presentes hoy" — Reubicación
| Antes | Después |
|-------|---------|
| Botón flotante abajo a la izquierda, separado del contenido | **Mover al lado derecho** de la card "Completadas hoy", en la misma fila |

**Especificación técnica:**
- Crear una fila horizontal: `[Completadas hoy: X] [6/16 presentes hoy →]`
- El botón de presentes debe tener el mismo alto que la card de completadas
- En móvil: apilar verticalmente, primero completadas, luego presentes

### 🔴 Actividad Reciente — Ajustes
| Antes | Después |
|-------|---------|
| Lista estática con datos falsos ("hace 12 min", "hace 25 min") | **Hacer funcional con datos reales** o **convertir en sección desplegable/collapsible** |

**Especificación técnica:**
- **OPCIÓN A (preferida):** Conectar con endpoint real de actividad. Si no hay datos reales, mostrar empty state: "No hay actividad reciente" en lugar de datos falsos.
- **OPCIÓN B:** Si no hay endpoint real aún, hacer la sección **collapsible** (acordeón) con título "Actividad Reciente ▼" que se expanda al hacer clic. Por defecto: colapsada.
- Eliminar el badge "⚠ PENDIENTE BACKEND" — ya no aplica si se hace funcional o se oculta.
- Cada item debe mostrar: icono + descripción + timestamp real (relativo: "hace 5 min", "hace 2 horas")

### 🔴 Monitoreo de Tareas — Ajustes
- Mantener tabs "En Proceso / Vencidas" pero **aumentar altura del contenedor** para que no haya scroll interno con pocos items
- Empty state actual ("No hay tareas en proceso · Todo está bajo control") está bien, pero centrar mejor verticalmente

### 🔴 Tareas Disponibles + Carga del Equipo
- Mantener como está pero verificar que en móvil se apilen correctamente (una columna)
- El scroll interno en "Carga del Equipo" está bien si hay muchos empleados, pero aumentar altura mínima

---

## 📋 2. GESTIÓN DE TAREAS (Admin)
**Referencias:** image(4).png (Listado), image(5).png (Plantillas), image(6).png (Rutinas), image(7).png (Góndolas)

### 🔴 Header unificado
| Antes | Después |
|-------|---------|
| "Gestión de Tareas" + subtítulo largo + tabs + subtabs + filtros | **Simplificar:** Título "Gestión de Tareas" más compacto, sin subtítulo redundante |

**Especificación técnica:**
- Eliminar subtítulo: "Supervisa la ejecución, configura plantillas y programa rutinas automáticas." — es demasiado largo y obvio.
- El título debe ser una sola línea con los tabs al lado o debajo.

### 🔴 Tabs dobles — Simplificación
| Antes | Después |
|-------|---------|
| Nivel 1: Tareas / Plantillas / Rutinas / Góndolas<br>Nivel 2: Listado de Tareas / Aprobaciones Pendientes (solo en Tareas) | **Un solo nivel:** Tareas / Plantillas / Rutinas / Góndolas. Las "Aprobaciones Pendientes" pasan a ser un **filtro** o **badge** dentro de la pestaña Tareas |

**Especificación técnica:**
- En la pestaña "Tareas", agregar un toggle o chip: "Aprobaciones (3)" al lado del buscador
- Si no hay aprobaciones pendientes, no mostrar el chip
- Eliminar completamente la segunda barra de tabs

### 🔴 Filtros — Correcciones
| Antes | Después |
|-------|---------|
| "TODOS LOS ESTADOS" · "TODOS LOS EMI" · Buscador | "Todos los estados" · "Todos los empleados" · Buscador |

**Especificación técnica:**
- "EMI" → "Empleados" (texto completo, no abreviatura interna)
- Los filtros deben estar **deshabilitados visualmente** (opacity-50, pointer-events-none) cuando no hay datos
- Badge "0 TAREAS TOTALES" → ocultar si es 0, o mostrar como texto sutil no como badge

### 🔴 Plantillas — Acciones en móvil (CRÍTICO)
| Antes | Después |
|-------|---------|
| Botones editar/eliminar solo visibles en hover (desktop) | **Siempre visibles** en móvil, o usar menú "⋯" en todas las vistas |

**Especificación técnica:**
- **Desktop:** Mantener hover opcional, pero agregar menú "⋯" como alternativa
- **Móvil (< 768px):** Cada card de plantilla debe tener un botón "⋯" (tres puntos) siempre visible que despliegue opciones: Editar, Eliminar, Duplicar
- Las cards de plantilla deben ser **touch-friendly**: padding mínimo 16px, botones mínimo 44×44px
- Verificar que el grid de 3 columnas en desktop se convierta en **1 columna en móvil**

### 🔴 Rutinas — Acciones en móvil (CRÍTICO)
| Antes | Después |
|-------|---------|
| Botones editar/eliminar solo en hover | **Mismo patrón que Plantillas:** menú "⋯" siempre visible en móvil |

**Especificación técnica:**
- Cada card de rutina debe tener menú "⋯" en esquina superior derecha
- Acciones: Ver rutina, Editar, Eliminar, Duplicar
- En desktop: hover muestra acciones rápidas, pero menú "⋯" siempre disponible

### 🔴 Góndolas — Tabs secundarios
| Antes | Después |
|-------|---------|
| Tabs: Góndolas / Órdenes | **Mantener**, pero hacer más compactos. Usar estilo pill buttons en lugar de tabs grandes |

**Especificación técnica:**
- Los subtabs "Góndolas / Órdenes" deben ser más pequeños (h-8 en lugar de h-10)
- Badge de estado ("Completado", "Aprobado") debe tener color coding consistente:
  - Completado: verde
  - Aprobado: azul
  - Pendiente: amarillo

### 🔴 Listado de Tareas (vacío) — Empty state
| Antes | Después |
|-------|---------|
| "NO HAY TAREAS QUE MOSTRAR · Modifica los filtros..." | **Más amigable:** "No hay tareas activas · Prueba cambiando los filtros o crea una nueva tarea" + CTA "+ Nueva Tarea" |

---

## ⏱️ 3. ASISTENCIA GENERAL (Admin)
**Referencias:** image(8).png, image(9).png

### 🔴 Header oscuro — Eliminar o compactar
| Antes | Después |
|-------|---------|
| Hero oscuro masivo: "GESTIÓN DE PERSONAL · Control de Asistencia · Miércoles, 22 De Abril De 2026" | **PageHeader compacto:** "Control de Asistencia · Miércoles 22 de abril" en una sola línea |

**Especificación técnica:**
- Eliminar fondo oscuro, usar fondo transparente/blanco
- Fecha en formato natural: "Miércoles 22 de abril" (no "22 De Abril De 2026")
- Datepicker mantenerlo pero más compacto

### 🔴 3 Cards KPI (Presentes/Ausentes/En Turno) — Rediseño
| Antes | Después |
|-------|---------|
| 3 cards grandes verticales: 6 Presentes / 10 Ausentes / 6 En Turno | **1 card horizontal compacta** con resumen visual, o **3 mini-cards en fila horizontal** mucho más pequeñas |

**Especificación técnica:**
- **OPCIÓN A (preferida):** Una sola card horizontal:
  ```
  ┌─────────────────────────────────────────┐
  │  👥 6 Presentes  │  🏠 10 Ausentes  │  ⏰ 6 En Turno  │
  │  38% del personal   63% del personal    38% del personal  │
  └─────────────────────────────────────────┘
  ```
- **OPCIÓN B:** 3 mini-cards en fila horizontal, cada una ~120px × 80px
- Eliminar porcentajes redundantes o mostrarlos más pequeños
- Color coding: Presentes = verde, Ausentes = rojo/gris, En Turno = amarillo/azul

### 🔴 Resumen del Día — Reubicación
| Antes | Después |
|-------|---------|
| Card "Resumen del Día" abajo a la izquierda, separada | **Mover al lado derecho** de la card de KPIs de asistencia, en la misma fila |

**Especificación técnica:**
- Layout horizontal: `[KPIs Asistencia] [Resumen del Día]`
- Resumen del Día debe ser más compacto:
  - "Turnos cerrados: 0" → texto simple, no barra completa
  - "En turno activo: 6" → texto simple
  - "Sin entrada: 10" → texto simple
  - "Asistencia: 38%" → barra de progreso horizontal más delgada
- En móvil: apilar verticalmente

### 🔴 Tabla de Registro — Ajustes
- Mantener estructura pero:
  - Columna "Estado": badges más pequeños y compactos
  - "FALTANTE" → cambiar a "Ausente" (más natural)
  - "EN CURSO" → cambiar a "En turno" (más natural)
  - Botones de acción (editar/entrada manual): usar iconos más pequeños o menú "⋯"

---

## 👥 4. EQUIPO / USUARIOS (Admin)
**Referencias:** image(10).png

### 🔴 Header — Compactar
| Antes | Después |
|-------|---------|
| Hero oscuro: "RECURSOS HUMANOS · Equipo · Gestiona las cuentas..." | **PageHeader compacto:** "Equipo" + subtítulo opcional |

### 🔴 3 Cards KPI — Rediseño
| Antes | Después |
|-------|---------|
| 3 cards grandes: 16 Total / 16 Activos / 0 Inactivos | **1 card compacta** o **eliminar 2 cards** |

**Especificación técnica:**
- **OPCIÓN A (preferida):** Solo mostrar 1 card: "16 empleados" con indicador visual de activos/inactivos
  ```
  ┌────────────────────────┐
  │  👥 16 empleados      │
  │  ● 16 activos · ○ 0 inactivos │
  └────────────────────────┘
  ```
- **OPCIÓN B:** 3 mini-cards horizontales muy compactas (~100px × 60px cada una)
- La card "Inactivos: 0" debe ocultarse si es 0 (usar `<KpiCard hideIfZero>`)

### 🔴 Botón "Nuevo Usuario" — Reubicación
| Antes | Después |
|-------|---------|
| Botón arriba a la derecha, alineado con header oscuro | **Mover debajo del header**, alineado a la derecha de la barra de búsqueda, o flotante sticky en esquina inferior derecha (FAB) |

**Especificación técnica:**
- **Opción 1:** Al lado derecho de la barra de búsqueda: `[Buscar...] [Todos los roles ▼] [+ Nuevo Usuario]`
- **Opción 2 (móvil):** FAB (Floating Action Button) en esquina inferior derecha
- El botón actual se pierde visualmente porque está muy arriba y oscuro

### 🔴 Tabla — Ajustes
- Columna "NO. EMPLEADO" (EMP-001): mover a tooltip al hover del nombre, o mostrar solo si hay espacio
- En móvil: tabla debe convertirse en cards de empleado (una por fila) o usar scroll horizontal
- Acciones (editar/eliminar): en móvil, usar menú "⋯" siempre visible

---

## ⚙️ 5. CONFIGURACIÓN DEL SISTEMA (Admin)
**Referencias:** image(11).png

### ✅ Estado actual — Bien implementado
- Grupos colapsables: Personal / Operaciones / Sistema ✓
- Esquema Operativo compacto ✓
- Vista previa de la semana ✓
- Excepciones y festivos ✓

### 🔴 Vista Previa de la Semana — Hacer funcional
| Antes | Después |
|-------|---------|
| Vista estática con horarios hardcodeados (08:20 - 17:10 todos los días) | **Dinámica:** Reflejar los valores reales de los inputs de "Jornada Standard" |

**Especificación técnica:**
- Cuando el usuario cambie "Entrada" o "Salida" en los inputs, la vista previa debe actualizarse en tiempo real
- El día de inicio de semana ("Dom" en el dropdown) debe resaltar ese día como inicio en la vista previa
- Días "Libre" (Dom y Sáb en el ejemplo) deben mostrarse con estilo diferente (gris, tachado, o "Descanso")
- **Backend requerido:** Guardar configuración de horarios (`PUT /api/settings/schedule`)
  - Campos: `entry_time`, `exit_time`, `week_start_day`, `tolerance_minutes`, `max_hours`
  - Toggle: `auto_close_shift` (boolean)

### 🔴 Cierre Automático — Tooltip funcional
- El icono ⓘ junto a "Cierre Automático" debe mostrar tooltip explicativo al hover/touch

---

## 👤 6. MI PERFIL (Empleado/Admin)
**Referencias:** image(12).png

### ✅ Estado actual — Bien implementado
- Layout con avatar, info personal, datos laborales, preferencias ✓
- Actividad reciente ✓
- Seguridad colapsable ✓

### 🔴 Preferencias — Hacer funcionales
| Antes | Después |
|-------|---------|
| Toggle "Notificaciones Push" decorativo | **Funcional:** Persistir en localStorage y/o backend |
| Select "Idioma: Español" decorativo | **Funcional:** Cambiar idioma de la interfaz (si hay i18n) o guardar preferencia |
| Select "Tema: Sistema" decorativo | **Funcional:** Implementar dark/light mode |

**Especificación técnica:**

**Notificaciones Push:**
- Guardar estado en localStorage: `kore_preferences.notifications = true/false`
- Si se habilita, solicitar permiso de notificación del navegador (`Notification.requestPermission()`)
- Mostrar toast de confirmación: "Notificaciones habilitadas" / "Notificaciones deshabilitadas"
- **Backend:** `PUT /api/users/preferences` con campo `notifications_enabled`

**Idioma:**
- Guardar en localStorage: `kore_preferences.language = 'es'`
- Si la app tiene i18n implementado, aplicar cambio inmediato
- Si no hay i18n, guardar preferencia para futura implementación
- **Backend:** `PUT /api/users/preferences` con campo `language`

**Tema:**
- Opciones: "Sistema" (default) / "Claro" / "Oscuro"
- Implementar con Tailwind `dark:` classes
- Guardar en localStorage: `kore_preferences.theme = 'system' | 'light' | 'dark'`
- "Sistema": detectar `prefers-color-scheme`
- **Backend:** `PUT /api/users/preferences` con campo `theme`

### 🔴 Correo electrónico — Overflow en móvil (BUG)
| Antes | Después |
|-------|---------|
| Correo largo (ej: "adan.cuellar.hernandez@empresa.com") se sale del recuadro en móvil | **Truncar con ellipsis** o **hacer scrollable** |

**Especificación técnica:**
- Aplicar `truncate` o `overflow-hidden text-ellipsis` al campo de correo
- Ancho máximo: 100% del contenedor padre
- En móvil: si el correo es muy largo, mostrar solo primera parte + "..." con tooltip completo al hover
- Alternativa: reducir tamaño de fuente del correo en móvil (`text-sm`)

### 🔴 Avatar — Mejora opcional
- El avatar con iniciales "AC" está bien, pero agregar overlay de cámara al hover para subir foto
- **Backend:** `POST /api/users/avatar` (multipart/form-data)

---

## 📱 RESPONSIVE — Consideraciones globales

### Breakpoints
- **Desktop:** ≥ 1024px — Layout completo
- **Tablet:** 768px - 1023px — Sidebar colapsado, grids de 2 columnas
- **Móvil:** < 768px — Sidebar como drawer, grids de 1 columna, FABs

### Patrones táctiles obligatorios
- Todos los botones de acción deben ser ≥ 44×44px
- Menús "⋯" siempre visibles en móvil (no hover-only)
- Scroll horizontal en tablas solo como último recurso
- Cards apiladas verticalmente en móvil

---

## 🔧 ENDPOINTS DE BACKEND REQUERIDOS

| Endpoint | Método | Uso | Prioridad |
|----------|--------|-----|-----------|
| `GET /api/activity-log` | GET | Feed de actividad reciente real | Alta |
| `PUT /api/settings/schedule` | PUT | Guardar configuración de horarios | Alta |
| `PUT /api/users/preferences` | PUT | Guardar preferencias (tema, idioma, notificaciones) | Alta |
| `POST /api/users/avatar` | POST | Subir foto de perfil | Media |
| `GET /api/attendance/summary?date=today` | GET | Datos de asistencia del día para KPIs | Alta |

---

## ✅ CHECKLIST DE VALIDACIÓN

### Dashboard
- [ ] Header dice "Buenos días, Adan · miércoles, 22 de abril" (sin "Dashboard", sin badge)
- [ ] Card "Completadas" es horizontal y pequeña, filtrada por día
- [ ] Botón "6/16 presentes" está al lado de la card de completadas
- [ ] Actividad reciente usa datos reales o está colapsada por defecto

### Tareas
- [ ] Tabs dobles unificados en uno solo
- [ ] "EMI" cambiado a "Empleados"
- [ ] En móvil, cada card de plantilla/rutina tiene menú "⋯" visible
- [ ] Grid de 3 cols → 1 col en móvil

### Asistencia
- [ ] Header compacto sin fondo oscuro
- [ ] 3 cards KPI fusionadas en 1 horizontal o 3 mini-cards
- [ ] Resumen del día al lado de KPIs (no abajo)
- [ ] Badges de estado más pequeños y con texto natural

### Equipo
- [ ] Solo 1 card de KPI ("16 empleados") o 3 mini-cards
- [ ] Card "Inactivos: 0" oculta
- [ ] Botón "Nuevo Usuario" al lado del buscador o como FAB
- [ ] En móvil: tabla → cards o scroll horizontal

### Configuración
- [ ] Vista previa de semana actualiza al cambiar inputs
- [ ] Días libres marcados visualmente
- [ ] Guardar cambios persiste en backend

### Perfil
- [ ] Toggle notificaciones funcional (localStorage + backend)
- [ ] Select idioma guarda preferencia
- [ ] Select tema aplica dark/light mode
- [ ] Correo no se sale del recuadro en móvil (truncate)

---

*Prompt generado el 2026-04-22. Incluye ajustes específicos del cliente basados en capturas de pantalla actuales.*
