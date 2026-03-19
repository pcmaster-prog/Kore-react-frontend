// AppRoutes.tsx (ejemplo)
import { Routes, Route, Navigate } from "react-router-dom";
import TemplatesPage from "@/features/tasks/catalog/TemplatesPage";
import RoutinesIndexRoute from "@/features/tasks/catalog/RoutinesIndexRoute";
import RoutineDetailPage from "@/features/tasks/catalog/RoutineDetailPage";
import CatalogPage from "@/features/tasks/catalog/CatalogPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/tasks/catalog" replace />} />

      <Route path="/tasks/templates" element={<TemplatesPage />} />

      <Route path="/tasks/routines" element={<RoutinesIndexRoute />} />
      <Route path="/tasks/routines/:id" element={<RoutineDetailPage />} />

      <Route path="/tasks/catalog" element={<CatalogPage />} />
    </Routes>
  );
}
