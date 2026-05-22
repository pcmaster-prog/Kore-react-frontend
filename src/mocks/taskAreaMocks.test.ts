// src/mocks/taskAreaMocks.test.ts
import { describe, it, expect } from "vitest";
import {
  mockListAreas,
  mockListAreasWithSections,
  mockGetTaskTree,
  mockStartTask,
  MOCK_AREAS,
} from "./taskAreaMocks";

describe("Task Area Mocks", () => {
  it("returns demo areas", async () => {
    const areas = await mockListAreas();
    expect(areas).toHaveLength(5);
    expect(areas[0].name).toBe("Patio");
  });

  it("returns areas with sections nested", async () => {
    const areas = await mockListAreasWithSections();
    expect(areas[0].sections).toBeDefined();
    expect(areas[0].sections!.length).toBeGreaterThan(0);
  });

  it("returns task tree with area/section enriched", async () => {
    const tasks = await mockGetTaskTree();
    expect(tasks.length).toBeGreaterThan(0);
    expect(tasks[0].area).toBeDefined();
    expect(tasks[0].section).toBeDefined();
  });

  it("starts a task and updates status", async () => {
    const tasks = await mockGetTaskTree();
    const taskId = tasks[0].id;
    const updated = await mockStartTask(taskId);
    expect(updated.status).toBe("in_progress");
    expect(updated.startedAt).toBeDefined();
  });

  it("areas have correct demo data", () => {
    expect(MOCK_AREAS.map((a) => a.name)).toContain("Mostrador");
    expect(MOCK_AREAS.map((a) => a.name)).toContain("Almacén");
  });
});
