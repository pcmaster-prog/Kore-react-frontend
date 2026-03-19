import { Navigate } from "react-router-dom";
import { auth } from "@/features/auth/store";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { token } = auth.get();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}
