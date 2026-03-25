// src/routes.tsx
import { createBrowserRouter, Navigate } from "react-router-dom";
import { RequireAuth } from "./guards/RequireAuth";
import { RequireRole } from "./guards/RequireRole";
import AppShell from "./layout/AppShell";

// Auth
import LoginPage from "@/features/auth/LoginPage";
import RegisterPage from "@/features/auth/RegisterPage";

// Dashboards
import ManagerDashboard from "@/features/dashboard/ManagerDashboard";
import EmployeeDashboard from "@/features/dashboard/EmployeeDashboard";

// Tareas
import TasksPageEmployee from "@/features/tasks/EmployeeTasksPage";
import TareasManagerPage from "@/features/tasks/TareasManagerPage";
import RoutineDetailPage from "@/features/tasks/catalog/RoutineDetailPage";

// Asistencia
import EmployeeAttendancePage from "@/features/attendance/EmployeeAttendancePage";
import ManagerAttendancePage from "@/features/attendance/ManagerAttendancePage";

// Perfil
import ProfilePage from "@/features/profile/ProfilePage";
import EmpleadosPage from "@/features/employees/EmpleadosPage";

//Configuracion
import ConfiguracionPage from "@/features/configuracion/ConfiguracionPage";

//Nomina
import NominaPage from "@/features/nomina/NominaPage";

// Góndolas
import GondolaRellenoPage from "@/features/gondolas/GondolaRellenoPage";

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
        element: <Navigate to="/app/manager/dashboard" replace />,
      },

      {
        path: "manager/dashboard",
        element: (
          <RequireRole allow={["admin", "supervisor"]}>
            <ManagerDashboard />
          </RequireRole>
        ),
      },
      {
        path: "manager/tareas",
        element: (
          <RequireRole allow={["admin", "supervisor"]}>
            <TareasManagerPage />
          </RequireRole>
        ),
      },
      {
        // Detalle de rutina sigue siendo ruta propia
        path: "manager/tareas/rutinas/:id",
        element: (
          <RequireRole allow={["admin", "supervisor"]}>
            <RoutineDetailPage />
          </RequireRole>
        ),
      },
      {
        path: "manager/asistencia",
        element: (
          <RequireRole allow={["admin", "supervisor"]}>
            <ManagerAttendancePage />
          </RequireRole>
        ),
      },
      {
        path: "manager/usuarios",
        element: (
          <RequireRole allow={["admin"]}>
            <EmpleadosPage />
          </RequireRole>
        ),
      },
      // Solo admin:
      {
        path: "manager/configuracion",
        element: (
          <RequireRole allow={["admin"]}>
            <ConfiguracionPage />
          </RequireRole>
        ),
      },
      {
        path: "manager/nomina",
        element: (
          <RequireRole allow={["admin"]}>
            <NominaPage />
          </RequireRole>
        ),
      },

      // ── Employee ──────────────────────────────────────────────────────────────
      {
        path: "employee/dashboard",
        element: (
          <RequireRole allow={["empleado"]}>
            <EmployeeDashboard />
          </RequireRole>
        ),
      },
      {
        path: "employee/mis-tareas/asignaciones",
        element: (
          <RequireRole allow={["empleado"]}>
            <TasksPageEmployee />
          </RequireRole>
        ),
      },
      {
        path: "employee/asistencia",
        element: (
          <RequireAuth>
            <EmployeeAttendancePage />
          </RequireAuth>
        ),
      },
      {
        path: "employee/gondola-relleno/:ordenId",
        element: (
          <RequireAuth>
            <GondolaRellenoPage />
          </RequireAuth>
        ),
      },

      // ── Compartidas (ambos roles) ─────────────────────────────────────────────
      {
        path: "perfil",
        element: (
          <RequireAuth>
            <ProfilePage />
          </RequireAuth>
        ),
      },

      { path: "*", element: <Navigate to="/login" replace /> },
    ],
  },

  { path: "*", element: <Navigate to="/login" replace /> },
]);
