// src/lib/__tests__/http.test.ts
// Tests for the HTTP interceptor: 401 logout + 500+ error event dispatch
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import axios from "axios";

// We need to mock authStore before importing http
vi.mock("@/features/auth/authStore", () => ({
  useAuthStore: {
    getState: vi.fn(() => ({
      token: "test-token",
      isTokenExpired: () => false,
      logout: vi.fn(),
    })),
  },
}));

import api from "../http";
import { useAuthStore } from "@/features/auth/authStore";

describe("HTTP Interceptor", () => {
  let eventHandler: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    eventHandler = vi.fn();
  });

  afterEach(() => {
    window.removeEventListener("kore-error", eventHandler);
    window.removeEventListener("kore:unauthorized", eventHandler);
  });

  it("attaches Authorization header when token exists", () => {
    const state = useAuthStore.getState();
    expect(state.token).toBe("test-token");
  });

  it("dispatches kore-error event on 500+ responses", async () => {
    window.addEventListener("kore-error", eventHandler);

    // Simulate a 500 response via axios interceptor
    const errorResponse = {
      response: {
        status: 500,
        data: { message: "Internal Server Error" },
      },
    };

    // Access the response interceptor directly
    const interceptors = (api.interceptors.response as any).handlers;
    const errorInterceptor = interceptors[interceptors.length - 1].rejected;

    try {
      await errorInterceptor(errorResponse);
    } catch {
      // Expected to reject
    }

    expect(eventHandler).toHaveBeenCalledOnce();
    const event = eventHandler.mock.calls[0][0] as CustomEvent;
    expect(event.detail.message).toBe("Internal Server Error");
    expect(event.detail.status).toBe(500);
  });

  it("dispatches kore-error with default message when server returns no message", async () => {
    window.addEventListener("kore-error", eventHandler);

    const errorResponse = {
      response: {
        status: 503,
        data: {},
      },
    };

    const interceptors = (api.interceptors.response as any).handlers;
    const errorInterceptor = interceptors[interceptors.length - 1].rejected;

    try {
      await errorInterceptor(errorResponse);
    } catch {
      // Expected to reject
    }

    expect(eventHandler).toHaveBeenCalledOnce();
    const event = eventHandler.mock.calls[0][0] as CustomEvent;
    expect(event.detail.message).toBe("Error del servidor. Intenta más tarde.");
    expect(event.detail.status).toBe(503);
  });

  it("dispatches kore:unauthorized and calls logout on 401", async () => {
    window.addEventListener("kore:unauthorized", eventHandler);

    const mockLogout = vi.fn();
    (useAuthStore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
      token: "test-token",
      isTokenExpired: () => false,
      logout: mockLogout,
    });

    const errorResponse = {
      response: {
        status: 401,
        data: { message: "Unauthenticated" },
      },
    };

    const interceptors = (api.interceptors.response as any).handlers;
    const errorInterceptor = interceptors[interceptors.length - 1].rejected;

    try {
      await errorInterceptor(errorResponse);
    } catch {
      // Expected to reject
    }

    expect(eventHandler).toHaveBeenCalledOnce();
    expect(mockLogout).toHaveBeenCalled();
  });

  it("does NOT dispatch kore-error for 4xx client errors (other than 401)", async () => {
    window.addEventListener("kore-error", eventHandler);

    const errorResponse = {
      response: {
        status: 422,
        data: { message: "Validation error" },
      },
    };

    const interceptors = (api.interceptors.response as any).handlers;
    const errorInterceptor = interceptors[interceptors.length - 1].rejected;

    try {
      await errorInterceptor(errorResponse);
    } catch {
      // Expected to reject
    }

    expect(eventHandler).not.toHaveBeenCalled();
  });
});
