// src/app/guards/RequireRole.tsx
import { Navigate, useLocation } from "react-router-dom";
import { auth, type Role } from "@/features/auth/store";

export function RequireRole({ allow, children }: { allow: Role[]; children: React.ReactNode }) {
  const location = useLocation();
  const { user } = auth.get();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!allow.includes(user.role)) {
    return <Navigate to="/app" replace />;
  }

  return children;
}
