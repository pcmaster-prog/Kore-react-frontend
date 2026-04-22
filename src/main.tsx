import React from "react";
import ReactDOM from "react-dom/client";
document.documentElement.lang = "es";
import { RouterProvider } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { registerSW } from "virtual:pwa-register";

import { queryClient } from "@/lib/queryClient";
import { router } from "./app/routes";
import ErrorBoundary from "@/components/ErrorBoundary";
import "./tailwind.css.ts";
import "./styles/themes.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ErrorBoundary>
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
    console.log("Kore listo para uso offline");
  },
});
