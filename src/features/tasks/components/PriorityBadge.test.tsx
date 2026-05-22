// src/features/tasks/components/PriorityBadge.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import PriorityBadge from "./PriorityBadge";

describe("PriorityBadge", () => {
  it("renders low priority", () => {
    render(<PriorityBadge priority="low" />);
    expect(screen.getByText("Baja")).toBeInTheDocument();
  });

  it("renders medium priority", () => {
    render(<PriorityBadge priority="medium" />);
    expect(screen.getByText("Media")).toBeInTheDocument();
  });

  it("renders high priority", () => {
    render(<PriorityBadge priority="high" />);
    expect(screen.getByText("Alta")).toBeInTheDocument();
  });

  it("renders urgent priority", () => {
    render(<PriorityBadge priority="urgent" />);
    expect(screen.getByText("Urgente")).toBeInTheDocument();
  });
});
