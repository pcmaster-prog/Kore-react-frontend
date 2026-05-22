// src/features/tasks/hooks/useTaskTimer.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTaskTimer } from "./useTaskTimer";

describe("useTaskTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts idle", () => {
    const { result } = renderHook(() => useTaskTimer());
    expect(result.current.isRunning).toBe(false);
    expect(result.current.elapsedSeconds).toBe(0);
    expect(result.current.activeTaskId).toBeNull();
  });

  it("starts timer and counts seconds", () => {
    const { result } = renderHook(() => useTaskTimer());

    act(() => {
      result.current.start("task-001");
    });

    expect(result.current.isRunning).toBe(true);
    expect(result.current.activeTaskId).toBe("task-001");

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.elapsedSeconds).toBe(3);
  });

  it("stops timer and returns duration", () => {
    const { result } = renderHook(() => useTaskTimer());

    act(() => {
      result.current.start("task-001");
      vi.advanceTimersByTime(5000);
    });

    let duration = 0;
    act(() => {
      duration = result.current.stop();
    });

    expect(duration).toBe(5);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.activeTaskId).toBeNull();
  });

  it("resets timer", () => {
    const { result } = renderHook(() => useTaskTimer());

    act(() => {
      result.current.start("task-001");
      vi.advanceTimersByTime(2000);
      result.current.reset();
    });

    expect(result.current.elapsedSeconds).toBe(0);
    expect(result.current.isRunning).toBe(false);
  });
});
