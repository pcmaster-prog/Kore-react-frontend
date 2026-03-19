import { Navigate } from "react-router-dom";
import { auth, type Role } from "@/features/auth/store";

export function RequireRole({ allow, children }: { allow: Role[]; children: React.ReactNode }) {
  const { user } = auth.get();
  if (!user) return <Navigate to="/login" replace />;
  if (!allow.includes(user.role)) return <Navigate to="/app" replace />;
  return children;
}
