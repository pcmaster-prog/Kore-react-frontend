// src/features/tasks/catalog/RoutinesIndexRoute.tsx
import { useNavigate } from "react-router-dom";
import RoutinesPage from "./RoutinesPage";

export default function RoutinesIndexRoute() {
  const nav = useNavigate();
  return <RoutinesPage onOpenDetail={(id) => nav(`/tasks/routines/${id}`)} />;
}
