# Kore — Progressive Web App (PWA)

Stack: React 18 · Vite · TypeScript · Vercel

---

## Resumen

Convertir la app de Kore en una PWA instalable en Android e iOS.
El usuario abre la app en Chrome/Safari, ve el banner "Agregar a pantalla
de inicio" y la instala como app nativa — con icono, splash screen y
sin barra del navegador.

---

## 1. Instalar plugin de PWA para Vite

```bash
npm install -D vite-plugin-pwa
```

---

## 2. Configurar `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Kore Ops Suite',
        short_name: 'Kore',
        description: 'Operación con evidencia (y sin drama).',
        theme_color: '#313852',
        background_color: '#F7F4EB',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // Cachear assets estáticos
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // No cachear las llamadas a la API
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/kore-laravel-backend-production\.up\.railway\.app\/api/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true, // Habilitar PWA en desarrollo para pruebas
      },
    }),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
```

---

## 3. Iconos requeridos

Crear o generar los siguientes archivos en la carpeta `public/`:

```
public/
  ├── pwa-192x192.png       ← Ícono 192x192px
  ├── pwa-512x512.png       ← Ícono 512x512px
  ├── apple-touch-icon.png  ← Ícono 180x180px para iOS
  ├── masked-icon.svg       ← Ícono SVG para Android maskable
  └── favicon.ico           ← Ya existe
```

**Contenido del ícono:**
- Fondo: `#313852` (navy obsidian)
- Letra "K" en blanco, bold, centrada
- O el logo actual de Kore si existe

**Herramienta para generar todos los tamaños:**
Usar [https://realfavicongenerator.net](https://realfavicongenerator.net) o
[https://maskable.app](https://maskable.app) para el ícono maskable.

---

## 4. Agregar meta tags en `index.html`

```html
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />

    <!-- PWA Meta Tags -->
    <meta name="theme-color" content="#313852" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="Kore" />
    <meta name="description" content="Operación con evidencia (y sin drama)." />

    <!-- iOS Icons -->
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

    <!-- Favicon -->
    <link rel="icon" type="image/ico" href="/favicon.ico" />

    <title>Kore Ops Suite</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

## 5. Componente de instalación `PWAInstallPrompt`

Crear un banner que aparece cuando la app es instalable.

**Crear `src/components/PWAInstallPrompt.tsx`:**

```tsx
import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Detectar iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone = window.matchMedia('(display-mode: standalone)').matches;

    // Si ya está instalada, no mostrar nada
    if (standalone) return;

    if (ios) {
      setIsIOS(true);
      // Mostrar instrucciones iOS si no se descartó antes
      const dismissed = localStorage.getItem('pwa-ios-dismissed');
      if (!dismissed) setShowBanner(true);
      return;
    }

    // Android / Chrome
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  }

  function handleDismiss() {
    setShowBanner(false);
    localStorage.setItem(
      isIOS ? 'pwa-ios-dismissed' : 'pwa-install-dismissed',
      '1'
    );
  }

  if (!showBanner) return null;

  // Banner para iOS
  if (isIOS) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom">
        <div className="bg-[#313852] text-white rounded-[24px] p-5 shadow-2xl">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center">
                <Download className="h-5 w-5" />
              </div>
              <div>
                <div className="font-bold text-sm">Instalar Kore</div>
                <div className="text-white/60 text-xs">Acceso rápido desde tu pantalla de inicio</div>
              </div>
            </div>
            <button onClick={handleDismiss} className="text-white/40 hover:text-white transition">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 text-xs text-white/80 leading-relaxed">
            Toca <strong>Compartir</strong> (□↑) en Safari → luego
            <strong> "Agregar a pantalla de inicio"</strong>
          </div>
        </div>
      </div>
    );
  }

  // Banner para Android/Chrome
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom">
      <div className="bg-[#313852] text-white rounded-[24px] p-5 shadow-2xl flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
          <Download className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm">Instalar Kore</div>
          <div className="text-white/60 text-xs">
            Acceso rápido desde tu pantalla de inicio
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleDismiss}
            className="h-9 px-3 rounded-xl bg-white/10 text-xs font-bold hover:bg-white/20 transition"
          >
            Ahora no
          </button>
          <button
            onClick={handleInstall}
            className="h-9 px-4 rounded-xl bg-white text-[#313852] text-xs font-bold hover:bg-white/90 transition"
          >
            Instalar
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 6. Integrar `PWAInstallPrompt` en `App.tsx`

```tsx
import PWAInstallPrompt from '@/components/PWAInstallPrompt';

export default function App() {
  return (
    <>
      {/* ... router y layout existente ... */}
      <PWAInstallPrompt />
    </>
  );
}
```

---

## 7. Registrar Service Worker en `main.tsx`

El plugin `vite-plugin-pwa` genera el Service Worker automáticamente.
Solo agregar al final de `main.tsx`:

```tsx
import { registerSW } from 'virtual:pwa-register';

// Auto-actualizar cuando hay nueva versión
const updateSW = registerSW({
  onNeedRefresh() {
    // Opcional: mostrar toast "Nueva versión disponible"
    if (confirm('Nueva versión disponible. ¿Actualizar?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('Kore listo para uso offline');
  },
});
```

---

## 8. Ajustes CSS para móvil en `index.css`

```css
/* Evitar el bounce scroll en iOS */
html, body {
  overscroll-behavior: none;
  -webkit-tap-highlight-color: transparent;
}

/* Safe area para iPhone con notch */
#root {
  padding-bottom: env(safe-area-inset-bottom);
  padding-top: env(safe-area-inset-top);
}
```

---

## 9. Verificación en Vercel

Vercel sirve automáticamente el `manifest.json` y el Service Worker
generado por Vite. No requiere configuración adicional.

Para verificar que la PWA funciona después del deploy:
1. Abrir Chrome DevTools → Application → Manifest
2. Verificar que aparezcan los iconos y el nombre
3. En Application → Service Workers → verificar que esté activo
4. En un celular Android: abrir Chrome → menú → "Agregar a pantalla de inicio"

---

## 10. Resumen de archivos a crear/modificar

| Archivo | Acción |
|---|---|
| `package.json` | Modificar — agregar `vite-plugin-pwa` |
| `vite.config.ts` | Modificar — configurar VitePWA |
| `index.html` | Modificar — agregar meta tags PWA |
| `src/main.tsx` | Modificar — registrar Service Worker |
| `src/App.tsx` | Modificar — agregar `<PWAInstallPrompt />` |
| `src/components/PWAInstallPrompt.tsx` | Crear |
| `public/pwa-192x192.png` | Crear — ícono 192x192 |
| `public/pwa-512x512.png` | Crear — ícono 512x512 |
| `public/apple-touch-icon.png` | Crear — ícono 180x180 |
| `public/masked-icon.svg` | Crear — ícono SVG maskable |

---

## Notas importantes

- **El banner de instalación NO aparece en Safari iOS automáticamente** — por eso existe el componente con instrucciones manuales para iOS
- **En Android Chrome** el banner nativo aparece solo — el componente lo captura y muestra un banner más bonito
- **Si el usuario descarta el banner**, se guarda en `localStorage` y no vuelve a aparecer
- **La app funciona offline parcialmente** — las páginas ya cargadas se sirven desde caché, las llamadas a la API requieren conexión
