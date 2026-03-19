// src/auth/RequireAuth.tsx
import { useEffect } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { auth } from "./store";

export default function RequireAuth() {
  const location = useLocation();
  const nav = useNavigate();
  const { token, user } = auth.get();

  useEffect(() => {
    const on401 = () => {
      auth.clear();
      nav("/login", { replace: true, state: { from: location } });
    };

    window.addEventListener("kore:unauthorized", on401 as any);
    return () => window.removeEventListener("kore:unauthorized", on401 as any);
  }, [nav, location]);

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // opcional: si tienes token pero no user, podrías pedir /auth/me aquí
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
