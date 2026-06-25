// src/features/auth/__tests__/authStore.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "../authStore";
import type { AuthUser } from "../authStore";

const mockUser: AuthUser = {
  id: "user-001",
  name: "Test Admin",
  email: "admin@kore.com",
  role: "admin",
  empresa_id: "emp-001",
  modules: ["asistencia", "tareas", "nomina"],
};

describe("useAuthStore", () => {
  beforeEach(() => {
    // Reset store state between tests
    useAuthStore.getState().logout();
    sessionStorage.clear();
  });

  it("should start with null user", () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.modules).toEqual([]);
  });

  it("should set user correctly", () => {
    useAuthStore.getState().setUser(mockUser);

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.user?.role).toBe("admin");
  });

  it("should set modules and dispatch event", () => {
    const modules = ["asistencia", "tareas"];
    let eventFired = false;
    const handler = () => { eventFired = true; };
    window.addEventListener("kore-modules-updated", handler);

    useAuthStore.getState().setModules(modules);

    expect(useAuthStore.getState().modules).toEqual(modules);
    expect(eventFired).toBe(true);

    window.removeEventListener("kore-modules-updated", handler);
  });

  it("should logout and clear all state", () => {
    useAuthStore.getState().setUser(mockUser);
    useAuthStore.getState().setModules(["asistencia"]);

    // Verify state is set
    expect(useAuthStore.getState().user).toBe(mockUser);

    // Logout
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.modules).toEqual([]);
  });
});

// ─── Legacy `auth` wrapper tests ─────────────────────────────────────────────
import { auth } from "../authStore";

describe("auth (legacy wrapper)", () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
    sessionStorage.clear();
  });

  it("auth.get() returns null when not authenticated", () => {
    const state = auth.get();
    expect(state.user).toBeNull();
  });

  it("auth.set() and auth.get() round-trip", () => {
    auth.set({ user: mockUser });
    const state = auth.get();
    expect(state.user?.email).toBe("admin@kore.com");
  });

  it("auth.clear() clears everything", () => {
    auth.set({ user: mockUser });
    auth.clear();
    expect(auth.get().user).toBeNull();
  });

  it("auth.setModules() and auth.getModules()", () => {
    auth.setModules(["tareas", "nomina"]);
    expect(auth.getModules()).toEqual(["tareas", "nomina"]);
  });
});
