// src/features/tasks/taskStore.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { useTaskStore } from "./taskStore";

describe("taskStore", () => {
  beforeEach(() => {
    useTaskStore.setState({
      selectedAreaId: null,
      selectedSectionId: null,
      selectedTaskId: null,
    });
  });

  it("selects area and clears children", () => {
    useTaskStore.getState().selectArea("area-001");
    expect(useTaskStore.getState().selectedAreaId).toBe("area-001");
    expect(useTaskStore.getState().selectedSectionId).toBeNull();
    expect(useTaskStore.getState().selectedTaskId).toBeNull();
  });

  it("selects section and clears task", () => {
    useTaskStore.getState().selectArea("area-001");
    useTaskStore.getState().selectSection("sec-001");
    expect(useTaskStore.getState().selectedSectionId).toBe("sec-001");
    expect(useTaskStore.getState().selectedTaskId).toBeNull();
  });

  it("selects task", () => {
    useTaskStore.getState().selectTask("task-001");
    expect(useTaskStore.getState().selectedTaskId).toBe("task-001");
  });

  it("clears all selection", () => {
    useTaskStore.getState().selectArea("area-001");
    useTaskStore.getState().selectSection("sec-001");
    useTaskStore.getState().selectTask("task-001");
    useTaskStore.getState().clearSelection();
    expect(useTaskStore.getState().selectedAreaId).toBeNull();
    expect(useTaskStore.getState().selectedSectionId).toBeNull();
    expect(useTaskStore.getState().selectedTaskId).toBeNull();
  });
});
