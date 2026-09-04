import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { GoalBuilderPage } from "./GoalBuilderPage";
import { useGoalBuilder } from "../hooks/useGoalBuilder";
import type { CodexQuestion } from "../types/codex";

// Partially mock the hook to control state transitions if needed, 
// or just test the real hook in integration. Testing integration is better here.

describe("GoalBuilderPage", () => {
  it("navigates the full creation flow", async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<GoalBuilderPage onCreate={onCreate} />);
    
    // 1. Describing phase
    expect(screen.getByText("Develop your idea with Codex.")).toBeDefined();
    const textarea = screen.getByRole("textbox", { name: "Describe your goal" });
    
    fireEvent.change(textarea, { target: { value: "I want to build a smart home app" } });
    fireEvent.click(screen.getByRole("button", { name: "Develop idea →" }));
    
    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith("I want to build a smart home app", "I want to build a smart home app");
    });
    
    // 2. Discovering phase
    expect(screen.getByText("A few focused questions.")).toBeDefined();
    
    // Skip to review
    fireEvent.click(screen.getByRole("button", { name: "Skip to review →" }));
    
    // 3. Reviewing phase
    expect(screen.getByText("Confirm the scope before execution begins.")).toBeDefined();
    
    // Add a requirement
    const reqInput = screen.getByRole("textbox", { name: "Add requirement" });
    fireEvent.change(reqInput, { target: { value: "Must work offline" } });
    fireEvent.keyDown(reqInput, { key: "Enter", code: "Enter" });
    
    expect(screen.getByText("Must work offline")).toBeDefined();
    
    // Approve
    fireEvent.click(screen.getByRole("button", { name: "Approve and start →" }));
    
    // 4. Approved phase
    await waitFor(() => {
      expect(screen.getByText("Goal approved.")).toBeDefined();
    });
  });
});
