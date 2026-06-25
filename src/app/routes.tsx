import { createBrowserRouter, Navigate, useRouteError } from "react-router-dom";
import { lazy, Suspense } from "react";
import { RequireAuth } from "./guards/RequireAuth";
import { RequireRole } from "./guards/RequireRole";
import { RequireModulo } from "./guards/RequireModulo";
import AppShell from "./layout/AppShell";
import PageSkeleton from "@/components/PageSkeleton";
import { useAuthStore } from "@/features/auth/store";

// Vistas inmediatas (no lazy)
import LoginPage from "@/features/auth/LoginPage";
import RegisterPage from "@/features/auth/RegisterPage";
import SetPasswordPage from "@/features/auth/SetPasswordPage";

// ─── Lazy Loaded Components ──────────────────────────────────────────────────
// Dashboards
const ManagerDashboard = lazy(() => import("@/features/dashboard/ManagerDashboard"));
const EmployeeDashboard = lazy(() => import("@/features/dashboard/EmployeeDashboard"));

// Tareas
const TasksPageEmployee = lazy(() => import("@/features/tasks/EmployeeTasksPage"));
const TareasManagerPage = lazy(() => import("@/features/tasks/TareasManagerPage"));
const TareasHuerfanasPage = lazy(() => import("@/features/tasks/TareasHuerfanasPage"));
const TaskAreasPage = lazy(() => import("@/features/tasks/TaskAreasPage"));
const EmployeeTaskAreasPage = lazy(() => import("@/features/tasks/EmployeeTaskAreasPage"));
const RoutineDetailPage = lazy(() => import("@/features/tasks/catalog/RoutineDetailPage"));

// Bitácora
const BitacoraPage = lazy(() => import("@/features/bitacora/BitacoraPage"));

// Asistencia
const EmployeeAttendancePage = lazy(() => import("@/features/attendance/EmployeeAttendancePage"));
const ManagerAttendancePage = lazy(() => import("@/features/attendance/ManagerAttendancePage"));

// Perfil / Empleados
const ProfilePage = lazy(() => import("@/features/profile/ProfilePage"));
const EmpleadosPage = lazy(() => import("@/features/employees/EmpleadosPage"));

// Puestos
const PuestosPage = lazy(() => import("@/features/puestos/pages/PuestosPage"));
const PuestoFormPage = lazy(() => import("@/features/puestos/pages/PuestoFormPage"));

// Maderas
const MaderasLayout = lazy(() => import("@/features/maderas/MaderasLayout"));
const DashboardMaderasPage = lazy(() => import("@/features/maderas/pages/DashboardMaderasPage"));
const InventarioMaderasPage = lazy(() => import("@/features/maderas/pages/InventarioMaderasPage"));
const ProduccionMaderasPage = lazy(() => import("@/features/maderas/pages/ProduccionMaderasPage"));
const EnsamblajeMaderasPage = lazy(() => import("@/features/maderas/pages/EnsamblajeMaderasPage"));
const PedidosMaderasPage = lazy(() => import("@/features/maderas/pages/PedidosMaderasPage"));
const TemporadasMaderasPage = lazy(() => import("@/features/maderas/pages/TemporadasMaderasPage"));
const CatalogoMaderasPage = lazy(() => import("@/features/maderas/pages/CatalogoMaderasPage"));
const TablasCortePage = lazy(() => import("@/features/maderas/pages/TablasCortePage"));

// Pesaje
const PesajeLayout = lazy(() => import("@/features/pesaje/PesajeLayout"));
const DashboardPesajePage = lazy(() => import("@/features/pesaje/pages/DashboardPesajePage"));
const RegistroPesajePage = lazy(() => import("@/features/pesaje/pages/RegistroPesajePage"));
const HistorialPesajePage = lazy(() => import("@/features/pesaje/pages/HistorialPesajePage"));
const SaboresPesajePage = lazy(() => import("@/features/pesaje/pages/SaboresPesajePage"));

// Configuración
const ConfiguracionPage = lazy(() => import("@/features/configuracion/ConfiguracionPage"));

// Reclutamiento (ATS)
const RecruitmentLayout = lazy(() => import("@/features/recruitment/RecruitmentLayout"));
const RecruitmentDashboard = lazy(() => import("@/features/recruitment/pages/RecruitmentDashboard"));
const RecruitmentJobs = lazy(() => import("@/features/recruitment/pages/RecruitmentJobs"));
const RecruitmentCandidates = lazy(() => import("@/features/recruitment/pages/RecruitmentCandidates"));
const RecruitmentCandidateDetail = lazy(() => import("@/features/recruitment/pages/RecruitmentCandidateDetail"));
const RecruitmentReports = lazy(() => import("@/features/recruitment/pages/RecruitmentReports"));
const RecruitmentEmailTemplates = lazy(() => import("@/features/recruitment/pages/RecruitmentEmailTemplates"));

// Nómina
const NominaPage = lazy(() => import("@/features/nomina/NominaPage"));

// Recibos
const MisRecibosPage = lazy(() => import("@/features/recibos/MisRecibosPage"));
const TiposGratificacionPage = lazy(() => import("@/features/recibos/admin/TiposGratificacionPage"));

// Góndolas
const GondolaRellenoPage = lazy(() => import("@/features/gondolas/GondolaRellenoPage"));

// Semáforo
const SemaforoSupervisorPage = lazy(() => import("@/features/semaforo/SemaforoSupervisorPage"));

// Reportes
const ReportesPage = lazy(() => import("@/features/reportes/ReportesPage"));

// Wrapper para Suspense
function Suspended({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageSkeleton />}>{children}</Suspense>;
}

// Manejador de errores de ruta (chunk load, lazy fail, etc.)
function RouteError() {
  const error = useRouteError() as Error | undefined;
  const isChunkError =
    error?.message?.includes("Failed to fetch dynamically imported module") ||
    error?.message?.includes("Loading chunk") ||
    error?.message?.includes("dynamically imported module");

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto h-20 w-20 rounded-3xl bg-amber-50 border border-amber-100 flex items-center justify-center shadow-sm">
          <svg className="h-10 w-10 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182M2.985 14.652" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight">
            {isChunkError ? "Nueva versión disponible" : "Algo salió mal"}
          </h1>
          <p className="mt-3 text-sm text-neutral-500 leading-relaxed">
            {isChunkError
              ? "La aplicación se actualizó. Recarga la página para obtener la última versión."
              : "Ocurrió un error inesperado. Intenta recargar la página."}
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 rounded-2xl bg-neutral-900 text-white px-6 py-3 text-sm font-bold tracking-wide hover:bg-neutral-800 transition-all shadow-md hover:shadow-lg"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182M2.985 14.652" />
          </svg>
          Recargar Página
        </button>
        <div className="text-[10px] font-bold text-neutral-300 uppercase tracking-[0.2em]">
          Kore · Ops Suite
        </div>
      </div>
    </div>
  );
}

function RoleAwareRedirect() {
  const user = useAuthStore((s) => s.user);
  if (user?.role === "empleado" || user?.role === "empleado_prueba") {
    return <Navigate to="/app/employee/dashboard" replace />;
  }
  return <Navigate to="/app/manager/dashboard" replace />;
}

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/set-password", element: <SetPasswordPage /> },

  {
    path: "/app",
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    errorElement: <RouteError />,
    children: [
      {
        index: true,
        element: <RoleAwareRedirect />,
      },

      {
        path: "manager/dashboard",
        element: (
          <RequireRole allow={["admin", "supervisor"]}>
            <Suspended><ManagerDashboard /></Suspended>
          </RequireRole>
        ),
      },
      {
        path: "manager/tareas",
        element: (
          <RequireRole allow={["admin", "supervisor"]}>
            <Suspended><TareasManagerPage /></Suspended>
          </RequireRole>
        ),
      },
      {
        path: "manager/tareas/areas",
        element: (
          <RequireRole allow={["admin", "supervisor"]}>
            <Suspended><TaskAreasPage /></Suspended>
          </RequireRole>
        ),
      },
      {
        path: "manager/tareas/huerfanas",
        element: (
          <RequireRole allow={["admin", "supervisor"]}>
            <Suspended><TareasHuerfanasPage /></Suspended>
          </RequireRole>
        ),
      },
      {
        path: "manager/bitacora",
        element: (
          <RequireRole allow={["admin", "supervisor"]}>
            <Suspended><BitacoraPage /></Suspended>
          </RequireRole>
        ),
      },
      {
        path: "manager/tareas/rutinas/:id",
        element: (
          <RequireRole allow={["admin", "supervisor"]}>
            <Suspended><RoutineDetailPage /></Suspended>
          </RequireRole>
        ),
      },
      {
        path: "manager/asistencia",
        element: (
          <RequireRole allow={["admin", "supervisor"]}>
            <Suspended><ManagerAttendancePage /></Suspended>
          </RequireRole>
        ),
      },
      {
        path: "manager/usuarios",
        element: (
          <RequireRole allow={["admin"]}>
            <Suspended><EmpleadosPage /></Suspended>
          </RequireRole>
        ),
      },
      {
        path: "manager/puestos",
        element: (
          <RequireRole allow={["admin"]}>
            <Suspended><PuestosPage /></Suspended>
          </RequireRole>
        ),
      },
      {
        path: "manager/puestos/nuevo",
        element: (
          <RequireRole allow={["admin"]}>
            <Suspended><PuestoFormPage /></Suspended>
          </RequireRole>
        ),
      },
      {
        path: "manager/puestos/:id",
        element: (
          <RequireRole allow={["admin"]}>
            <Suspended><PuestoFormPage /></Suspended>
          </RequireRole>
        ),
      },
      {
        path: "manager/reclutamiento",
        element: (
          <RequireRole allow={["admin"]}>
            <RequireModulo slug="reclutamiento">
              <Suspended><RecruitmentLayout /></Suspended>
            </RequireModulo>
          </RequireRole>
        ),
        children: [
          { index: true, element: <Suspended><RecruitmentDashboard /></Suspended> },
          { path: "vacantes", element: <Suspended><RecruitmentJobs /></Suspended> },
          { path: "reportes", element: <Suspended><RecruitmentReports /></Suspended> },
          { path: "candidatos", element: <Suspended><RecruitmentCandidates /></Suspended> },
          { path: "candidatos/:id", element: <Suspended><RecruitmentCandidateDetail /></Suspended> },
          { path: "emails", element: <Suspended><RecruitmentEmailTemplates /></Suspended> },
        ],
      },
      {
        path: "manager/configuracion",
        element: (
          <RequireRole allow={["admin"]}>
            <Suspended><ConfiguracionPage /></Suspended>
          </RequireRole>
        ),
      },
      {
        path: "manager/nomina",
        element: (
          <RequireRole allow={["admin"]}>
            <Suspended><NominaPage /></Suspended>
          </RequireRole>
        ),
      },
      {
        path: "manager/tipos-gratificacion",
        element: (
          <RequireRole allow={["admin"]}>
            <Suspended><TiposGratificacionPage /></Suspended>
          </RequireRole>
        ),
      },
      {
        path: "manager/semaforo",
        element: (
          <RequireRole allow={["admin", "supervisor"]}>
            <Suspended><SemaforoSupervisorPage /></Suspended>
          </RequireRole>
        ),
      },
      {
        path: "manager/reportes",
        element: (
          <RequireRole allow={["admin", "supervisor"]}>
            <Suspended><ReportesPage /></Suspended>
          </RequireRole>
        ),
      },

      // ── Employee ──────────────────────────────────────────────────────────────
      {
        path: "employee/dashboard",
        element: (
          <RequireRole allow={["empleado", "empleado_prueba"]}>
            <Suspended><EmployeeDashboard /></Suspended>
          </RequireRole>
        ),
      },
      {
        path: "employee/mis-tareas/asignaciones",
        element: (
          <RequireRole allow={["empleado", "empleado_prueba"]}>
            <Suspended><TasksPageEmployee /></Suspended>
          </RequireRole>
        ),
      },
      {
        path: "employee/mis-tareas/areas",
        element: (
          <RequireRole allow={["empleado", "empleado_prueba"]}>
            <Suspended><EmployeeTaskAreasPage /></Suspended>
          </RequireRole>
        ),
      },
      {
        path: "employee/asistencia",
        element: (
          <RequireAuth>
            <Suspended><EmployeeAttendancePage /></Suspended>
          </RequireAuth>
        ),
      },
      {
        path: "employee/gondola-relleno/:ordenId",
        element: (
          <RequireAuth>
            <Suspended><GondolaRellenoPage /></Suspended>
          </RequireAuth>
        ),
      },
      {
        path: "employee/mis-recibos",
        element: (
          <RequireRole allow={["empleado", "empleado_prueba"]}>
            <Suspended><MisRecibosPage /></Suspended>
          </RequireRole>
        ),
      },

      // ── Compartidas (ambos roles) ─────────────────────────────────────────────
      {
        path: "perfil",
        element: (
          <RequireAuth>
            <Suspended><ProfilePage /></Suspended>
          </RequireAuth>
        ),
      },

      // ── Maderas (módulo produccion_maderas) ──
      {
        path: "maderas",
        element: <RequireModulo slug="produccion_maderas"><Suspended><MaderasLayout /></Suspended></RequireModulo>,
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: "dashboard", element: <Suspended><DashboardMaderasPage /></Suspended> },
          { path: "inventario", element: <Suspended><InventarioMaderasPage /></Suspended> },
          { path: "produccion", element: <Suspended><ProduccionMaderasPage /></Suspended> },
          { path: "ensamblaje", element: <Suspended><EnsamblajeMaderasPage /></Suspended> },
          { path: "pedidos", element: <Suspended><PedidosMaderasPage /></Suspended> },
          { path: "temporadas", element: <RequireRole allow={["admin"]}><Suspended><TemporadasMaderasPage /></Suspended></RequireRole> },
          { path: "catalogo", element: <RequireRole allow={["admin"]}><Suspended><CatalogoMaderasPage /></Suspended></RequireRole> },
          { path: "tablas-corte", element: <RequireRole allow={["admin"]}><Suspended><TablasCortePage /></Suspended></RequireRole> },
        ]
      },

      // ── Pesaje (módulo produccion_pesaje) ──
      {
        path: "pesaje",
        element: <RequireModulo slug="produccion_pesaje"><Suspended><PesajeLayout /></Suspended></RequireModulo>,
        children: [
          { path: "dashboard", element: <Suspended><DashboardPesajePage /></Suspended> },
          { path: "registrar", element: <Suspended><RegistroPesajePage /></Suspended> },
          { path: "historial", element: <Suspended><HistorialPesajePage /></Suspended> },
          { path: "sabores", element: <RequireRole allow={["admin"]}><Suspended><SaboresPesajePage /></Suspended></RequireRole> },
        ]
      },

      { path: "*", element: <Navigate to="/login" replace /> },
    ],
  },

  { path: "*", element: <Navigate to="/login" replace /> },
]);


