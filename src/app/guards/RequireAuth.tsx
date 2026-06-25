// src/app/guards/RequireAuth.tsx
import { useEffect } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { auth } from "@/features/auth/store";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const nav = useNavigate();
  const { user } = auth.get();

  useEffect(() => {
    const on401 = () => {
      auth.clear();
      nav("/login", { replace: true, state: { from: location } });
    };

    window.addEventListener("kore:unauthorized", on401);
    return () => window.removeEventListener("kore:unauthorized", on401);
  }, [nav, location]);

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
