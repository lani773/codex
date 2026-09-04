import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ApprovalsPage } from "./ApprovalsPage";
import type { Approval } from "../types/codex";

describe("ApprovalsPage", () => {
  const mockApprovals: Approval[] = [
    {
      id: "a1",
      goalId: "g1",
      title: "Install dependencies",
      description: "Need to install vitest",
      risk: "low",
      requestedAt: "10:00",
      status: "pending",
      items: [{ label: "npm i", detail: "vitest", selected: true }],
    },
    {
      id: "a2",
      goalId: "g1",
      title: "Run arbitrary script",
      description: "Need to run bash",
      risk: "high",
      requestedAt: "10:05",
      status: "pending",
      items: [{ label: "run sh", detail: "rm -rf", selected: true }],
    },
  ];

  it("renders pending approvals and selects the first one", () => {
    render(<ApprovalsPage approvals={mockApprovals} onDecide={vi.fn()} />);
    
    expect(screen.getByText("Install dependencies")).toBeDefined();
    expect(screen.getByText("Run arbitrary script")).toBeDefined();
    expect(screen.getByText("Need to install vitest")).toBeDefined();
  });

  it("submits a low risk approval without confirmation", () => {
    const onDecide = vi.fn();
    render(<ApprovalsPage approvals={mockApprovals} onDecide={onDecide} />);
    
    // a1 is selected by default
    fireEvent.click(screen.getByRole("button", { name: "Approve selected" }));
    
    expect(onDecide).toHaveBeenCalledWith("a1", "approved");
  });

  it("requires confirmation for high risk approvals", () => {
    const onDecide = vi.fn();
    render(<ApprovalsPage approvals={mockApprovals} onDecide={onDecide} />);
    
    // Select the high risk one
    fireEvent.click(screen.getByRole("listitem", { name: /Run arbitrary script/i }));
    
    // Click approve
    fireEvent.click(screen.getByRole("button", { name: "Approve selected" }));
    
    // Should not have submitted yet
    expect(onDecide).not.toHaveBeenCalled();
    
    // Confirmation dialog should be visible
    expect(screen.getByText("Are you sure?")).toBeDefined();
    
    // Click confirm
    fireEvent.click(screen.getByRole("button", { name: "Yes, approve" }));
    
    expect(onDecide).toHaveBeenCalledWith("a2", "approved");
  });
});
