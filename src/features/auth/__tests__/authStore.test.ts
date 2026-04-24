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
    localStorage.clear();
  });

  it("should start with null token and user", () => {
    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
    expect(state.tokenExpiresAt).toBeNull();
  });

  it("should set auth correctly", () => {
    useAuthStore.getState().setAuth("test-token-123", mockUser);

    const state = useAuthStore.getState();
    expect(state.token).toBe("test-token-123");
    expect(state.user).toEqual(mockUser);
    expect(state.user?.role).toBe("admin");
    expect(state.tokenExpiresAt).toBeGreaterThan(Date.now());
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
    useAuthStore.getState().setAuth("test-token", mockUser);
    useAuthStore.getState().setModules(["asistencia"]);

    // Verify state is set
    expect(useAuthStore.getState().token).toBe("test-token");

    // Logout
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
    expect(state.modules).toEqual([]);
    expect(state.tokenExpiresAt).toBeNull();
  });

  it("should detect expired token", () => {
    useAuthStore.getState().setAuth("test-token", mockUser);

    // Not expired yet
    expect(useAuthStore.getState().isTokenExpired()).toBe(false);

    // Force expire by setting tokenExpiresAt to the past
    useAuthStore.setState({ tokenExpiresAt: Date.now() - 1000 });
    expect(useAuthStore.getState().isTokenExpired()).toBe(true);
  });

  it("should report expired when no tokenExpiresAt", () => {
    // No token set → isTokenExpired should return true
    expect(useAuthStore.getState().isTokenExpired()).toBe(true);
  });
});

// ─── Legacy `auth` wrapper tests ─────────────────────────────────────────────
import { auth } from "../authStore";

describe("auth (legacy wrapper)", () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
    localStorage.clear();
  });

  it("auth.get() returns null when not authenticated", () => {
    const state = auth.get();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
  });

  it("auth.set() and auth.get() round-trip", () => {
    auth.set({ token: "abc", user: mockUser });
    const state = auth.get();
    expect(state.token).toBe("abc");
    expect(state.user?.email).toBe("admin@kore.com");
  });

  it("auth.clear() clears everything", () => {
    auth.set({ token: "abc", user: mockUser });
    auth.clear();
    expect(auth.get().token).toBeNull();
  });

  it("auth.get() auto-clears expired token", () => {
    auth.set({ token: "abc", user: mockUser });
    // Force expire
    useAuthStore.setState({ tokenExpiresAt: Date.now() - 1000 });

    const state = auth.get();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
  });

  it("auth.setModules() and auth.getModules()", () => {
    auth.setModules(["tareas", "nomina"]);
    expect(auth.getModules()).toEqual(["tareas", "nomina"]);
  });
});
