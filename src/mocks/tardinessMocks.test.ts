// src/mocks/tardinessMocks.test.ts
import { describe, it, expect } from "vitest";
import {
  mockGetTardinessConfig,
  mockUpdateTardinessConfig,
  mockGetMonthlySummary,
  mockGetEmployeeDetail,
  MOCK_TARDINESS_CONFIG,
} from "./tardinessMocks";

describe("Tardiness Mocks", () => {
  it("returns default config", async () => {
    const config = await mockGetTardinessConfig();
    expect(config.grace_period_minutes).toBe(10);
    expect(config.lates_to_absence).toBe(3);
    expect(config.accumulation_period).toBe("month");
    expect(config.penalize_rest_day).toBe(true);
  });

  it("updates config with partial data", async () => {
    const result = await mockUpdateTardinessConfig({
      grace_period_minutes: 15,
      lates_to_absence: 5,
    });
    expect(result.message).toBe("Configuración actualizada");
    expect(result.config.grace_period_minutes).toBe(15);
    expect(result.config.lates_to_absence).toBe(5);
    // Other fields remain unchanged
    expect(result.config.penalize_rest_day).toBe(true);

    // Reset the mock singleton
    Object.assign(MOCK_TARDINESS_CONFIG, {
      grace_period_minutes: 10,
      lates_to_absence: 3,
    });
  });

  it("returns monthly summary with employee data", async () => {
    const summary = await mockGetMonthlySummary("2026-04");
    expect(summary.period).toBe("2026-04");
    expect(summary.summary.length).toBeGreaterThan(0);

    const juan = summary.summary.find((e) => e.empleado_name === "Juan Pérez");
    expect(juan).toBeDefined();
    expect(juan!.total_lates).toBe(4);
    expect(juan!.absences_generated).toBe(1);
    expect(juan!.rest_day_penalized).toBe(true);
  });

  it("returns employee detail with lates and absences", async () => {
    const detail = await mockGetEmployeeDetail("e-001");
    expect(detail.empleado_name).toBe("Juan Pérez");
    expect(detail.lates.length).toBe(4);
    expect(detail.absences.length).toBe(1);

    const convertedLates = detail.lates.filter((l) => l.converted_to_absence);
    expect(convertedLates.length).toBe(3);
  });
});
