
# 🎨 SISTEMA DE TEMAS (THEME ENGINE) — KORE OPS SUITE
## Implementación completa de 6 temas visuales con Theme Switcher

---

## 📋 RESUMEN EJECUTIVO

Implementar un **Theme Engine** completo que permita al usuario seleccionar entre 6 temas visuales desde su perfil. Al seleccionar un tema, toda la aplicación se actualiza instantáneamente con una transición suave de 400ms. Los temas son **solo de color** — no cambian layout, tipografía ni estructura.

**Archivos a modificar/crear:**
- Nuevo: `src/styles/themes.css` (tokens CSS)
- Nuevo: `src/components/ThemeSwitcher.tsx` (selector de temas)
- Modificar: `src/components/PreferencesCard.tsx` (integrar ThemeSwitcher)
- Modificar: `tailwind.config.js` (mapear variables CSS)
- Modificar: `src/App.tsx` o `src/main.tsx` (aplicar tema al cargar)

---

## 🎯 ARQUITECTURA TÉCNICA

### 1. Sistema de Tokens CSS (variables custom properties)

Cada tema se define como un bloque `[data-theme="nombre"]` en `:root`. La app envuelve el `<body>` o el contenedor principal con el atributo `data-theme`. Todas las variables se aplican con `transition` de 400ms.

```css
/* src/styles/themes.css */
:root {
  --t: 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ═══════════════════════════════════════════════════════════ */
/* ① BEIGE CLÁSICO (default)                                  */
/* ═══════════════════════════════════════════════════════════ */
[data-theme="beige"] {
  --bg-page: #f2ece2;
  --bg-sidebar: #1c2030;
  --bg-sidebar-hover: rgba(255,255,255,0.05);
  --bg-card: #ffffff;
  --bg-card2: #f8f4ee;
  --sb-text: #8892a8;
  --sb-active-bg: #2a3045;
  --sb-active: #ffffff;
  --accent-btn: #1c2030;
  --accent-btn-text: #ffffff;
  --text-h: #111827;
  --text-b: #6b7280;
  --badge-p-bg: #e0e7ff;
  --badge-p-c: #3730a3;
  --badge-a-bg: #fef3c7;
  --badge-a-c: #92400e;
  --badge-b-bg: #d1fae5;
  --badge-b-c: #065f46;
  --bar1: #4f46e5;
  --bar2: #818cf8;
  --bar3: #c7d2fe;
  --dot1: #10b981;
  --dot2: #6366f1;
  --dot3: #f59e0b;
  --border: #e8e1d6;
  --shadow: 0 1px 4px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04);
}

/* ═══════════════════════════════════════════════════════════ */
/* ② AZUL PRO                                                 */
/* ═══════════════════════════════════════════════════════════ */
[data-theme="azul"] {
  --bg-page: #edf2fc;
  --bg-sidebar: #1746c8;
  --bg-sidebar-hover: rgba(255,255,255,0.08);
  --bg-card: #ffffff;
  --bg-card2: #f0f5fd;
  --sb-text: #a5c0f5;
  --sb-active-bg: #1338a0;
  --sb-active: #ffffff;
  --accent-btn: #2563eb;
  --accent-btn-text: #ffffff;
  --text-h: #0f172a;
  --text-b: #4b5a72;
  --badge-p-bg: #dbeafe;
  --badge-p-c: #1e40af;
  --badge-a-bg: #fef3c7;
  --badge-a-c: #92400e;
  --badge-b-bg: #d1fae5;
  --badge-b-c: #065f46;
  --bar1: #2563eb;
  --bar2: #60a5fa;
  --bar3: #bfdbfe;
  --dot1: #10b981;
  --dot2: #3b82f6;
  --dot3: #f59e0b;
  --border: #d5e3f8;
  --shadow: 0 1px 4px rgba(37,99,235,0.06), 0 4px 16px rgba(37,99,235,0.07);
}

/* ═══════════════════════════════════════════════════════════ */
/* ③ MORADO ELEGANTE                                          */
/* ═══════════════════════════════════════════════════════════ */
[data-theme="morado"] {
  --bg-page: #f5f0fe;
  --bg-sidebar: #120228;
  --bg-sidebar-hover: rgba(255,255,255,0.06);
  --bg-card: #ffffff;
  --bg-card2: #f9f5ff;
  --sb-text: #7a5a9e;
  --sb-active-bg: #220640;
  --sb-active: #e9d8ff;
  --accent-btn: #7c3aed;
  --accent-btn-text: #ffffff;
  --text-h: #1a0533;
  --text-b: #6b5880;
  --badge-p-bg: #ede9fe;
  --badge-p-c: #5b21b6;
  --badge-a-bg: #fef9c3;
  --badge-a-c: #713f12;
  --badge-b-bg: #fce7f3;
  --badge-b-c: #9d174d;
  --bar1: #7c3aed;
  --bar2: #a78bfa;
  --bar3: #ddd6fe;
  --dot1: #c084fc;
  --dot2: #e879f9;
  --dot3: #facc15;
  --border: #e2d4f8;
  --shadow: 0 1px 4px rgba(109,40,217,0.07), 0 4px 20px rgba(109,40,217,0.09);
}

/* ═══════════════════════════════════════════════════════════ */
/* ④ ROSA SUAVE                                               */
/* ═══════════════════════════════════════════════════════════ */
[data-theme="rosa"] {
  --bg-page: #fdf0f5;
  --bg-sidebar: #3b0027;
  --bg-sidebar-hover: rgba(255,255,255,0.06);
  --bg-card: #ffffff;
  --bg-card2: #fff5f9;
  --sb-text: #c07090;
  --sb-active-bg: #5c0038;
  --sb-active: #ffd6e8;
  --accent-btn: #db2777;
  --accent-btn-text: #ffffff;
  --text-h: #3b0027;
  --text-b: #8a5070;
  --badge-p-bg: #fce7f3;
  --badge-p-c: #be185d;
  --badge-a-bg: #fee2e2;
  --badge-a-c: #991b1b;
  --badge-b-bg: #fce7f3;
  --badge-b-c: #9d174d;
  --bar1: #ec4899;
  --bar2: #f9a8d4;
  --bar3: #fce7f3;
  --dot1: #f43f5e;
  --dot2: #e879f9;
  --dot3: #fb923c;
  --border: #f9d0e4;
  --shadow: 0 1px 4px rgba(219,39,119,0.06), 0 4px 16px rgba(219,39,119,0.07);
}

/* ═══════════════════════════════════════════════════════════ */
/* ⑤ OSCURO ESPACIAL                                          */
/* ═══════════════════════════════════════════════════════════ */
[data-theme="oscuro"] {
  --bg-page: #07090f;
  --bg-sidebar: #030508;
  --bg-sidebar-hover: rgba(255,255,255,0.04);
  --bg-card: #0e1220;
  --bg-card2: #090d18;
  --sb-text: #2e4060;
  --sb-active-bg: #0c1a34;
  --sb-active: #a8c8ff;
  --accent-btn: #0ea5e9;
  --accent-btn-text: #ffffff;
  --text-h: #d8e4f5;
  --text-b: #3d5270;
  --badge-p-bg: #0c2348;
  --badge-p-c: #60a5fa;
  --badge-a-bg: #271500;
  --badge-a-c: #fbbf24;
  --badge-b-bg: #022614;
  --badge-b-c: #34d399;
  --bar1: #0ea5e9;
  --bar2: #38bdf8;
  --bar3: #7dd3fc;
  --dot1: #34d399;
  --dot2: #38bdf8;
  --dot3: #a78bfa;
  --border: #0d1826;
  --shadow: 0 1px 4px rgba(0,0,0,0.5), 0 4px 24px rgba(0,0,0,0.6);
}

/* ═══════════════════════════════════════════════════════════ */
/* ⑥ BLACK — jet black + clean white                          */
/* ═══════════════════════════════════════════════════════════ */
[data-theme="black"] {
  --bg-page: #050505;
  --bg-sidebar: #000000;
  --bg-sidebar-hover: rgba(255,255,255,0.04);
  --bg-card: #111111;
  --bg-card2: #090909;
  --sb-text: #333333;
  --sb-active-bg: #1c1c1c;
  --sb-active: #eeeeee;
  --accent-btn: #ffffff;
  --accent-btn-text: #000000;
  --text-h: #eeeeee;
  --text-b: #444444;
  --badge-p-bg: #1a1a1a;
  --badge-p-c: #d4d4d4;
  --badge-a-bg: #1f1200;
  --badge-a-c: #d97706;
  --badge-b-bg: #021a0c;
  --badge-b-c: #34d399;
  --bar1: #e5e5e5;
  --bar2: #737373;
  --bar3: #404040;
  --dot1: #e5e5e5;
  --dot2: #737373;
  --dot3: #a3a3a3;
  --border: #1c1c1c;
  --shadow: 0 1px 4px rgba(0,0,0,0.9), 0 4px 24px rgba(0,0,0,0.95);
}

/* Transición global para TODOS los elementos */
*, *::before, *::after {
  transition: background-color var(--t), 
              border-color var(--t), 
              color var(--t), 
              box-shadow var(--t),
              fill var(--t),
              stroke var(--t);
}
```

### 2. Integración con Tailwind CSS

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // Fondos
        'k-bg-page': 'var(--bg-page)',
        'k-bg-sidebar': 'var(--bg-sidebar)',
        'k-bg-sidebar-hover': 'var(--bg-sidebar-hover)',
        'k-bg-card': 'var(--bg-card)',
        'k-bg-card2': 'var(--bg-card2)',

        // Textos
        'k-text-h': 'var(--text-h)',
        'k-text-b': 'var(--text-b)',
        'k-sb-text': 'var(--sb-text)',
        'k-sb-active': 'var(--sb-active)',

        // Acciones
        'k-accent-btn': 'var(--accent-btn)',
        'k-accent-btn-text': 'var(--accent-btn-text)',
        'k-sb-active-bg': 'var(--sb-active-bg)',

        // Badges
        'k-badge-p-bg': 'var(--badge-p-bg)',
        'k-badge-p-c': 'var(--badge-p-c)',
        'k-badge-a-bg': 'var(--badge-a-bg)',
        'k-badge-a-c': 'var(--badge-a-c)',
        'k-badge-b-bg': 'var(--badge-b-bg)',
        'k-badge-b-c': 'var(--badge-b-c)',

        // Barras / Charts
        'k-bar1': 'var(--bar1)',
        'k-bar2': 'var(--bar2)',
        'k-bar3': 'var(--bar3)',

        // Dots / Indicadores
        'k-dot1': 'var(--dot1)',
        'k-dot2': 'var(--dot2)',
        'k-dot3': 'var(--dot3)',

        // Misc
        'k-border': 'var(--border)',
      },
      boxShadow: {
        'k-card': 'var(--shadow)',
      },
      transitionTimingFunction: {
        'k-theme': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        'k-theme': '400ms',
      },
    },
  },
}
```

### 3. Hook de React para manejar temas

```tsx
// src/hooks/useTheme.ts
import { useState, useEffect, useCallback } from 'react';

export type ThemeName = 'beige' | 'azul' | 'morado' | 'rosa' | 'oscuro' | 'black';

interface ThemeConfig {
  id: ThemeName;
  label: string;
  preview: string; // color del dot
  description: string;
}

export const THEMES: ThemeConfig[] = [
  { id: 'beige', label: 'Beige Clásico', preview: '#4f46e5', description: 'El look original de Kore' },
  { id: 'azul', label: 'Azul Pro', preview: '#2563eb', description: 'Profesional y corporativo' },
  { id: 'morado', label: 'Morado Elegante', preview: '#7c3aed', description: 'Sofisticado y diferenciador' },
  { id: 'rosa', label: 'Rosa Suave', preview: '#db2777', description: 'Moderno y amigable' },
  { id: 'oscuro', label: 'Oscuro Espacial', preview: '#0ea5e9', description: 'Para turnos nocturnos' },
  { id: 'black', label: 'Black', preview: '#e5e5e5', description: 'Minimalista y audaz' },
];

const STORAGE_KEY = 'kore-theme';
const DEFAULT_THEME: ThemeName = 'beige';

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    // 1. Intentar leer de localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY) as ThemeName;
      if (saved && THEMES.find(t => t.id === saved)) return saved;
    }
    return DEFAULT_THEME;
  });

  const applyTheme = useCallback((newTheme: ThemeName) => {
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
    setThemeState(newTheme);
  }, []);

  // Aplicar tema al montar
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  // Sincronizar con backend (opcional, se llama cuando el usuario guarda preferencias)
  const syncWithBackend = useCallback(async (userId: string) => {
    try {
      await fetch(`/api/users/${userId}/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme }),
      });
    } catch (e) {
      console.warn('No se pudo sincronizar tema con backend:', e);
    }
  }, [theme]);

  return { theme, setTheme: applyTheme, syncWithBackend, themes: THEMES };
}
```

### 4. Componente ThemeSwitcher (para el Perfil)

```tsx
// src/components/ThemeSwitcher.tsx
import { useState } from 'react';
import { useTheme, THEMES, ThemeName } from '../hooks/useTheme';
import { ChevronDown, Check, Palette } from 'lucide-react';

export function ThemeSwitcher() {
  const { theme: currentTheme, setTheme, themes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const activeTheme = themes.find(t => t.id === currentTheme);

  return (
    <div className="relative">
      {/* Trigger — muestra el tema actual */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full gap-3 px-4 py-3 rounded-xl border border-k-border bg-k-bg-card hover:bg-k-bg-card2 transition-all"
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-5 h-5 rounded-full border-2 border-k-border shadow-sm"
            style={{ backgroundColor: activeTheme?.preview }}
          />
          <div className="text-left">
            <p className="text-sm font-medium text-k-text-h">{activeTheme?.label}</p>
            <p className="text-xs text-k-text-b">{activeTheme?.description}</p>
          </div>
        </div>
        <ChevronDown 
          className={`w-4 h-4 text-k-text-b transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown de temas */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 py-2 rounded-xl border border-k-border bg-k-bg-card shadow-k-card overflow-hidden">
          <div className="px-3 pb-2 mb-1 border-b border-k-border">
            <p className="text-xs font-semibold text-k-text-b uppercase tracking-wider">Selecciona un tema</p>
          </div>

          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTheme(t.id);
                setIsOpen(false);
              }}
              className={`flex items-center gap-3 w-full px-4 py-3 text-left transition-colors hover:bg-k-bg-card2
                ${currentTheme === t.id ? 'bg-k-bg-card2' : ''}
              `}
            >
              {/* Preview dot */}
              <div className="relative flex-shrink-0">
                <div 
                  className="w-6 h-6 rounded-full border-2 border-k-border shadow-sm"
                  style={{ backgroundColor: t.preview }}
                />
                {currentTheme === t.id && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-k-accent-btn text-k-accent-btn-text flex items-center justify-center">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${currentTheme === t.id ? 'text-k-text-h' : 'text-k-text-b'}`}>
                  {t.label}
                </p>
                <p className="text-xs text-k-text-b truncate">{t.description}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 5. Integración en la tarjeta de Preferencias del Perfil

```tsx
// src/components/PreferencesCard.tsx (modificar)
import { ThemeSwitcher } from './ThemeSwitcher';
import { Bell, Globe, Moon, Palette } from 'lucide-react';

export function PreferencesCard() {
  return (
    <div className="bg-k-bg-card border border-k-border rounded-2xl p-5 shadow-k-card">
      <div className="flex items-center gap-2 mb-5">
        <Palette className="w-5 h-5 text-k-text-b" />
        <h3 className="text-base font-semibold text-k-text-h">Preferencias</h3>
      </div>

      <div className="space-y-5">
        {/* TEMA — NUEVO */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-k-text-h mb-2">
            <Moon className="w-4 h-4" />
            Tema visual
          </label>
          <ThemeSwitcher />
        </div>

        {/* NOTIFICACIONES — existente, hacer funcional */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-k-text-b" />
            <span className="text-sm text-k-text-h">Notificaciones Push</span>
          </div>
          <ToggleSwitch 
            checked={notificationsEnabled} 
            onChange={handleNotificationsToggle} 
          />
        </div>

        {/* IDIOMA — existente, hacer funcional */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-k-text-b" />
            <span className="text-sm text-k-text-h">Idioma</span>
          </div>
          <select 
            value={language}
            onChange={handleLanguageChange}
            className="text-sm bg-k-bg-card2 border border-k-border rounded-lg px-3 py-1.5 text-k-text-h"
          >
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>
    </div>
  );
}
```

### 6. Aplicar tema al cargar la app

```tsx
// src/App.tsx o src/main.tsx
import { useEffect } from 'react';
import './styles/themes.css'; // Importar los tokens CSS

function App() {
  useEffect(() => {
    // Aplicar tema guardado ANTES de que React renderice para evitar flash
    const savedTheme = localStorage.getItem('kore-theme') || 'beige';
    document.body.setAttribute('data-theme', savedTheme);
  }, []);

  return (
    <div className="min-h-screen bg-k-bg-page text-k-text-h">
      {/* ... resto de la app */}
    </div>
  );
}
```

### 7. Refactor de componentes existentes para usar tokens

Todos los componentes deben migrar de colores hardcodeados a tokens. Ejemplos:

**Sidebar:**
```tsx
// Antes
<div className="bg-[#2D3748] text-gray-400">

// Después
<div className="bg-k-bg-sidebar text-k-sb-text">
```

**Cards:**
```tsx
// Antes
<div className="bg-white border border-gray-200 shadow-sm">

// Después
<div className="bg-k-bg-card border border-k-border shadow-k-card">
```

**Botones primarios:**
```tsx
// Antes
<button className="bg-slate-800 text-white">

// Después
<button className="bg-k-accent-btn text-k-accent-btn-text">
```

**Badges:**
```tsx
// Antes
<span className="bg-yellow-100 text-yellow-800">

// Después
<span className="bg-k-badge-a-bg text-k-badge-a-c">
```

---

## 📱 RESPONSIVE DEL THEME SWITCHER

En móvil, el dropdown debe:
- Ocupar el ancho completo del contenedor
- Mostrar los items con padding táctil (min 44px alto)
- Cerrarse al tocar fuera (useClickOutside)
- Usar `position: fixed` si el contenedor padre tiene `overflow: hidden`

---

## 🔧 BACKEND REQUERIDO

| Endpoint | Método | Body | Descripción |
|----------|--------|------|-------------|
| `GET /api/users/me/preferences` | GET | — | Obtener preferencias del usuario incluyendo `theme` |
| `PUT /api/users/me/preferences` | PUT | `{ theme: "azul" }` | Guardar tema seleccionado |

**Schema de preferencias:**
```json
{
  "theme": "beige | azul | morado | rosa | oscuro | black",
  "language": "es | en",
  "notifications_enabled": true,
  "dark_mode": false
}
```

**Flujo de sincronización:**
1. Al cargar la app: leer `localStorage` primero (instantáneo), luego fetchear preferencias del backend
2. Si backend devuelve un tema diferente: actualizar UI y localStorage
3. Al cambiar tema: actualizar localStorage inmediatamente, sincronizar con backend en background (no bloquear UI)

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Fase 1: Fundación (1 día)
- [ ] Crear `src/styles/themes.css` con los 6 temas exactos
- [ ] Modificar `tailwind.config.js` para mapear variables CSS
- [ ] Crear `src/hooks/useTheme.ts`
- [ ] Importar `themes.css` en `main.tsx`
- [ ] Aplicar tema al cargar (evitar flash)

### Fase 2: Componente ThemeSwitcher (1 día)
- [ ] Crear `src/components/ThemeSwitcher.tsx`
- [ ] Dropdown funcional con los 6 temas
- [ ] Indicador visual del tema activo (check + dot)
- [ ] Cerrar al hacer clic fuera
- [ ] Persistir en localStorage

### Fase 3: Refactor de componentes (2-3 días)
- [ ] Sidebar: migrar a tokens
- [ ] Cards/KPIs: migrar a tokens
- [ ] Botones: migrar a tokens
- [ ] Badges: migrar a tokens
- [ ] Tablas: migrar a tokens
- [ ] Inputs/formularios: migrar a tokens
- [ ] Headers/PageHeader: migrar a tokens
- [ ] Empty states: migrar a tokens
- [ ] Modales: migrar a tokens

### Fase 4: Perfil y preferencias (1 día)
- [ ] Integrar ThemeSwitcher en PreferencesCard
- [ ] Hacer funcional toggle de notificaciones
- [ ] Hacer funcional select de idioma
- [ ] Conectar con backend (guardar preferencias)

### Fase 5: Testing (1 día)
- [ ] Verificar transición suave entre temas
- [ ] Verificar que no hay flash de tema incorrecto al cargar
- [ ] Verificar en móvil (dropdown táctil)
- [ ] Verificar temas oscuros (oscuro, black) en todas las pantallas
- [ ] Verificar que badges mantienen legibilidad en todos los temas

---

## ⚠️ CONSIDERACIONES IMPORTANTES

1. **Flash de tema incorrecto (FOUC):** 
   - Aplicar `data-theme` en `<body>` ANTES de que React monte
   - Usar un script inline en `index.html` si es necesario:
   ```html
   <script>
     (function() {
       const theme = localStorage.getItem('kore-theme') || 'beige';
       document.documentElement.setAttribute('data-theme', theme);
     })();
   </script>
   ```

2. **Gráficos y charts:**
   - Las barras de progreso usan `var(--bar1)`, `var(--bar2)`, `var(--bar3)`
   - Si usan librerías como Recharts, pasar los colores como props desde el tema activo

3. **Imágenes y SVGs:**
   - Los iconos de Lucide heredan color del texto (`currentColor`), así que se adaptan automáticamente
   - Ilustraciones SVG: usar `fill="currentColor"` o `fill="var(--text-h)"` donde aplique

4. **Temas oscuros (oscuro, black):**
   - Verificar contraste de texto en todos los componentes
   - Los inputs deben tener fondo diferente al fondo de página
   - Los placeholders deben ser visibles

5. **No modificar:**
   - Layout (grid, flex, gaps, padding, margin)
   - Tipografía (fuentes, tamaños de fuente, pesos)
   - Estructura de componentes
   - Lógica de negocio
   - Solo cambiar valores de color

---

## 📊 MAPA DE MIGRACIÓN DE COLORES

| Elemento actual | Token a usar | Notas |
|-----------------|--------------|-------|
| Fondo de página (beige #F5F5EB) | `bg-k-bg-page` | Cambia por tema |
| Sidebar oscuro | `bg-k-bg-sidebar` | Azul en tema azul, morado en tema morado |
| Texto sidebar inactivo | `text-k-sb-text` | Más claro que el activo |
| Texto sidebar activo | `text-k-sb-active` | Blanco o color acento |
| Fondo item sidebar activo | `bg-k-sb-active-bg` | Variante más clara del sidebar |
| Cards blancas | `bg-k-bg-card` | Blanco en temas claros, gris oscuro en oscuros |
| Fondo hover cards | `bg-k-bg-card2` | Variante más oscura/clara para hover |
| Botones primarios | `bg-k-accent-btn` | Color principal del tema |
| Texto botones primarios | `text-k-accent-btn-text` | Generalmente blanco |
| Títulos (h1, h2) | `text-k-text-h` | Casi negro en claros, casi blanco en oscuros |
| Texto secundario | `text-k-text-b` | Gris medio |
| Bordes | `border-k-border` | Color de borde adaptado al tema |
| Sombras | `shadow-k-card` | Sombra con tinte del color del tema |
| Badge alta/pendiente | `bg-k-badge-a-bg text-k-badge-a-c` | Amarillo |
| Badge baja/completada | `bg-k-badge-b-bg text-k-badge-b-c` | Verde |
| Badge primaria/media | `bg-k-badge-p-bg text-k-badge-p-c` | Azul/acento |
| Barras de progreso 1 | `bg-k-bar1` | Color principal |
| Barras de progreso 2 | `bg-k-bar2` | Variante más clara |
| Barras de progreso 3 | `bg-k-bar3` | Variante muy clara |
| Dots indicadores | `bg-k-dot1/2/3` | Colores de estado |

---

*Prompt generado el 2026-04-22. Tokens extraídos del HTML de referencia del cliente.*
