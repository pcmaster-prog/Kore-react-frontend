import { createBrowserRouter, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { RequireAuth } from "./guards/RequireAuth";
import { RequireRole } from "./guards/RequireRole";
import AppShell from "./layout/AppShell";
import PageSkeleton from "@/components/PageSkeleton";
import { useAuthStore } from "@/features/auth/store";

// Vistas inmediatas (no lazy)
import LoginPage from "@/features/auth/LoginPage";
import RegisterPage from "@/features/auth/RegisterPage";

// ─── Lazy Loaded Components ──────────────────────────────────────────────────
// Dashboards
const ManagerDashboard = lazy(() => import("@/features/dashboard/ManagerDashboard"));
const EmployeeDashboard = lazy(() => import("@/features/dashboard/EmployeeDashboard"));

// Tareas
const TasksPageEmployee = lazy(() => import("@/features/tasks/EmployeeTasksPage"));
const TareasManagerPage = lazy(() => import("@/features/tasks/TareasManagerPage"));
const RoutineDetailPage = lazy(() => import("@/features/tasks/catalog/RoutineDetailPage"));

// Bitácora
const BitacoraPage = lazy(() => import("@/features/bitacora/BitacoraPage"));

// Asistencia
const EmployeeAttendancePage = lazy(() => import("@/features/attendance/EmployeeAttendancePage"));
const ManagerAttendancePage = lazy(() => import("@/features/attendance/ManagerAttendancePage"));

// Perfil / Empleados
const ProfilePage = lazy(() => import("@/features/profile/ProfilePage"));
const EmpleadosPage = lazy(() => import("@/features/employees/EmpleadosPage"));

// Configuración
const ConfiguracionPage = lazy(() => import("@/features/configuracion/ConfiguracionPage"));

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

function RoleAwareRedirect() {
  const user = useAuthStore((s) => s.user);
  if (user?.role === "empleado") {
    return <Navigate to="/app/employee/dashboard" replace />;
  }
  return <Navigate to="/app/manager/dashboard" replace />;
}

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },

  {
    path: "/app",
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
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
          <RequireRole allow={["empleado"]}>
            <Suspended><EmployeeDashboard /></Suspended>
          </RequireRole>
        ),
      },
      {
        path: "employee/mis-tareas/asignaciones",
        element: (
          <RequireRole allow={["empleado"]}>
            <Suspended><TasksPageEmployee /></Suspended>
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
          <RequireRole allow={["empleado"]}>
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

      { path: "*", element: <Navigate to="/login" replace /> },
    ],
  },

  { path: "*", element: <Navigate to="/login" replace /> },
]);
