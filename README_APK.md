# Kore — APK con Capacitor (Distribución Directa)

Stack: React 18 · Vite · TypeScript · Capacitor · Android Studio

---

## Resumen

Convertir la app web de Kore en una APK instalable directamente en
dispositivos Android sin necesidad de Play Store.

---

## 1. Instalar Capacitor

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npm install @capacitor/status-bar @capacitor/splash-screen
```

---

## 2. Inicializar Capacitor

```bash
npx cap init "Kore Ops Suite" "com.kore.ops" --web-dir=dist
```

Esto crea el archivo `capacitor.config.ts` en la raíz del proyecto.

---

## 3. Configurar `capacitor.config.ts`

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kore.ops',
  appName: 'Kore Ops Suite',
  webDir: 'dist',
  server: {
    // En desarrollo apunta al servidor local
    // En producción usa el build estático
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#313852',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
    StatusBar: {
      style: 'light',
      backgroundColor: '#313852',
    },
  },
};

export default config;
```

---

## 4. Agregar plataforma Android

```bash
npx cap add android
```

Esto crea la carpeta `android/` en la raíz del proyecto.

---

## 5. Configurar `vite.config.ts` para producción móvil

Asegurarse de que el build de Vite genere rutas relativas correctas:

```typescript
export default defineConfig({
  plugins: [react(), VitePWA(...)], // mantener PWA si ya está configurada
  base: '/', // importante para Capacitor
  build: {
    outDir: 'dist',
  },
  resolve: {
    alias: { '@': '/src' },
  },
});
```

---

## 6. Ajuste importante — URLs de la API

Capacitor sirve la app desde `https://localhost` en Android, no desde
`kore-react-frontend.vercel.app`. Verificar que el archivo de configuración
de la API apunte a la URL completa del backend:

**En `src/lib/http.ts` (o donde esté el axios base URL):**

```typescript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ??
    'https://kore-laravel-backend-production.up.railway.app/api/v1',
  // ...resto de la config
});
```

Verificar que `.env.production` tenga:
```env
VITE_API_URL=https://kore-laravel-backend-production.up.railway.app/api/v1
```

---

## 7. Splash Screen e íconos para Android

Instalar la herramienta de assets:

```bash
npm install -D @capacitor/assets
```

Crear la carpeta `assets/` en la raíz con:

```
assets/
  ├── icon.png          ← PNG cuadrado mínimo 1024x1024px (el logo de Kore)
  └── splash.png        ← PNG 2732x2732px (fondo #313852 con logo centrado)
```

Generar automáticamente todos los tamaños:

```bash
npx capacitor-assets generate --android
```

Esto genera los íconos y splash screens en los tamaños correctos para Android.

---

## 8. Script de build en `package.json`

Agregar estos scripts:

```json
{
  "scripts": {
    "build:android": "npm run build && npx cap sync android",
    "open:android": "npx cap open android"
  }
}
```

---

## 9. Generar la APK

**Paso 1 — Build y sincronizar:**
```bash
npm run build:android
```

**Paso 2 — Abrir Android Studio:**
```bash
npm run open:android
```

**Paso 3 — En Android Studio:**
1. Esperar que Gradle termine de sincronizar (puede tardar 2-5 min la primera vez)
2. Menú: **Build → Build Bundle(s) / APK(s) → Build APK(s)**
3. Esperar el build (~1-2 min)
4. Click en "locate" en la notificación que aparece abajo
5. El archivo APK estará en:
   ```
   android/app/build/outputs/apk/debug/app-debug.apk
   ```

---

## 10. Distribuir la APK

**Por WhatsApp:**
- Enviar el archivo `app-debug.apk` directamente

**Por link de descarga:**
- Subir el APK a Google Drive o cualquier servicio de archivos
- Compartir el link

**El empleado instala así:**
1. Recibe el APK
2. Lo abre en su celular
3. Android pide permiso "Instalar apps de fuentes desconocidas"
4. Lo habilita y confirma la instalación
5. Listo — aparece el ícono de Kore en su pantalla de inicio

---

## 11. Actualizar la APK en el futuro

Cada vez que haya cambios en el código:

```bash
npm run build:android
# Abrir Android Studio y generar nuevo APK
# Compartir el nuevo APK por el mismo canal
```

Los empleados instalan el nuevo APK encima del anterior — sus datos
de sesión se mantienen.

---

## 12. CORS en el backend (Railway)

Capacitor sirve la app desde `capacitor://localhost` y `https://localhost`.
Verificar que el backend de Laravel permita estas origins en CORS.

**En `config/cors.php` del backend Laravel:**

```php
'allowed_origins' => [
    'https://kore-react-frontend.vercel.app',
    'capacitor://localhost',
    'https://localhost',
    'http://localhost',
],
```

O si usa wildcard:
```php
'allowed_origins' => ['*'],
```

---

## 13. Resumen de archivos a crear/modificar

| Archivo | Acción |
|---|---|
| `package.json` | Modificar — agregar dependencias Capacitor y scripts |
| `capacitor.config.ts` | Crear |
| `vite.config.ts` | Modificar — agregar `base: '/'` |
| `src/lib/http.ts` | Verificar — URL base del API |
| `.env.production` | Verificar — `VITE_API_URL` correcto |
| `assets/icon.png` | Crear — logo 1024x1024 |
| `assets/splash.png` | Crear — splash 2732x2732 |
| `android/` | Generado automáticamente por Capacitor |

---

## Notas importantes

- La carpeta `android/` NO se sube a GitHub — agregarla a `.gitignore`
- El APK generado es de **debug** — funciona perfectamente para distribución
  directa. Para Play Store se necesita APK firmada (en el futuro)
- Cada que se hagan cambios en el código hay que correr
  `npm run build:android` y generar nuevo APK
- La sesión del usuario persiste entre actualizaciones de APK
