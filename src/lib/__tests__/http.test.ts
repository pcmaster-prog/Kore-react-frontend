// src/lib/__tests__/http.test.ts
// Tests for the HTTP interceptor: 401 event dispatch + 500+ error event dispatch
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

import api from "../http";

type InterceptorHandler = {
  rejected: (error: {
    response?: { status: number; data?: { message?: string } };
  }) => Promise<never>;
};

type InterceptorHandlers = {
  handlers: InterceptorHandler[];
};

describe("HTTP Interceptor", () => {
  let eventHandler: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    eventHandler = vi.fn();
  });

  afterEach(() => {
    window.removeEventListener("kore-error" as unknown as string, eventHandler as EventListener);
    window.removeEventListener("kore:unauthorized" as unknown as string, eventHandler as EventListener);
  });

  it("dispatches kore-error event on 500+ responses", async () => {
    window.addEventListener("kore-error" as unknown as string, eventHandler as EventListener);

    // Simulate a 500 response via axios interceptor
    const errorResponse = {
      response: {
        status: 500,
        data: { message: "Internal Server Error" },
      },
    };

    // Access the response interceptor directly
    const interceptors = (api.interceptors.response as unknown as InterceptorHandlers).handlers;
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
    window.addEventListener("kore-error" as unknown as string, eventHandler as EventListener);

    const errorResponse = {
      response: {
        status: 503,
        data: {},
      },
    };

    const interceptors = (api.interceptors.response as unknown as InterceptorHandlers).handlers;
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

  it("dispatches kore:unauthorized on 401", async () => {
    window.addEventListener("kore:unauthorized" as unknown as string, eventHandler as EventListener);

    const errorResponse = {
      response: {
        status: 401,
        data: { message: "Unauthenticated" },
      },
    };

    const interceptors = (api.interceptors.response as unknown as InterceptorHandlers).handlers;
    const errorInterceptor = interceptors[interceptors.length - 1].rejected;

    try {
      await errorInterceptor(errorResponse);
    } catch {
      // Expected to reject
    }

    expect(eventHandler).toHaveBeenCalledOnce();
  });

  it("does NOT dispatch kore-error for 4xx client errors (other than 401)", async () => {
    window.addEventListener("kore-error" as unknown as string, eventHandler as EventListener);

    const errorResponse = {
      response: {
        status: 422,
        data: { message: "Validation error" },
      },
    };

    const interceptors = (api.interceptors.response as unknown as InterceptorHandlers).handlers;
    const errorInterceptor = interceptors[interceptors.length - 1].rejected;

    try {
      await errorInterceptor(errorResponse);
    } catch {
      // Expected to reject
    }

    expect(eventHandler).not.toHaveBeenCalled();
  });
});
