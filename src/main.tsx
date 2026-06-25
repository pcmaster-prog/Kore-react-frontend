import React from "react";
import ReactDOM from "react-dom/client";
document.documentElement.lang = "es";
import { registerSW } from "virtual:pwa-register";

import Root from "@/app/Root";
import "@/tailwind.css.ts";
import "@/styles/themes.css";

// ── Global chunk error handler ───────────────────────────────────────────────
// Cuando Vite genera nuevos hashes tras un deploy, los usuarios con la app
// abierta intentan cargar chunks antiguos que ya no existen. Detectamos
// estos errores y recargamos automáticamente para obtener la nueva versión.

function isChunkError(msg: string): boolean {
  return (
    msg.includes("Failed to fetch dynamically imported module") ||
    msg.includes("Loading chunk") ||
    msg.includes("dynamically imported module") ||
    msg.includes("Cannot find module")
  );
}

window.addEventListener("unhandledrejection", (event) => {
  const msg = event.reason?.message || String(event.reason);
  if (isChunkError(msg)) {
    event.preventDefault();
    window.location.reload();
  }
});

window.addEventListener("error", (event) => {
  const msg = event.message || "";
  if (isChunkError(msg)) {
    event.preventDefault();
    window.location.reload();
  }
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);

// Auto-actualizar cuando hay nueva versión
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm("Nueva versión disponible. ¿Actualizar?")) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    // App lista para uso offline (silencioso en producción)
  },
});
