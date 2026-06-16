import { Navigate, useLocation } from "react-router-dom";
import { auth } from "@/features/auth/store";

export function RequireModulo({ slug, children }: { slug: string; children: React.ReactNode }) {
  const location = useLocation();
  const { user } = auth.get();

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  // Admin tiene acceso total — sin evaluar módulos
  if (user.role === "admin") return children;

  const modules = auth.getModules();
  if (!modules.includes(slug)) return <Navigate to="/app" replace />;

  return children;
}
