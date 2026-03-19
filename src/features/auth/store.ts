//features/auth/store.ts
export type Role = "admin" | "supervisor" | "empleado";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  empresa_id: string;
  modules?: string[];
};

export type AuthState = {
  token: string | null;
  user: AuthUser | null;
};

export const auth = {
  get(): AuthState {
    const token = localStorage.getItem("kore_token");
    const userRaw = localStorage.getItem("kore_user");
    return {
      token,
      user: userRaw ? (JSON.parse(userRaw) as AuthUser) : null,
    };
  },
  set(payload: { token: string; user: AuthUser }) {
    localStorage.setItem("kore_token", payload.token);
    localStorage.setItem("kore_user", JSON.stringify(payload.user));
  },
  clear() {
    localStorage.removeItem("kore_token");
    localStorage.removeItem("kore_user");
    localStorage.removeItem("kore_modules");
  },
  setModules(modules: string[]) {
    localStorage.setItem("kore_modules", JSON.stringify(modules));
  },
  getModules(): string[] {
    const raw = localStorage.getItem("kore_modules");
    return raw ? (JSON.parse(raw) as string[]) : [];
  },
};
