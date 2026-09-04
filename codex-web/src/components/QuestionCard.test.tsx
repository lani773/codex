import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuestionCard } from "./QuestionCard";
import type { CodexQuestion } from "../types/codex";

describe("QuestionCard", () => {
  it("renders a text question and submits value", () => {
    const question: CodexQuestion = {
      id: "q1",
      goalId: "g1",
      title: "What is your name?",
      type: "text",
      required: true,
    };
    const submit = vi.fn();

    render(<QuestionCard question={question} onSubmit={submit} />);
    
    expect(screen.getByText("What is your name?")).toBeDefined();
    
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Alice" } });
    
    fireEvent.click(screen.getByRole("button", { name: "Send answer" }));
    
    expect(submit).toHaveBeenCalledWith("Alice");
  });

  it("shows an error when a required question is submitted empty", () => {
    const question: CodexQuestion = {
      id: "q2",
      goalId: "g1",
      title: "Required?",
      type: "text",
      required: true,
    };
    const submit = vi.fn();

    render(<QuestionCard question={question} onSubmit={submit} />);
    
    fireEvent.click(screen.getByRole("button", { name: "Send answer" }));
    
    expect(screen.getByRole("alert").textContent).toContain("requires an answer");
    expect(submit).not.toHaveBeenCalled();
  });

  it("handles multi_field questions", () => {
    const question: CodexQuestion = {
      id: "q3",
      goalId: "g1",
      title: "Provide credentials",
      type: "multi_field",
      required: true,
      options: [
        { label: "Username", value: "username" },
        { label: "Password", value: "password" },
      ]
    };
    const submit = vi.fn();

    render(<QuestionCard question={question} onSubmit={submit} />);
    
    const inputs = screen.getAllByRole("textbox");
    expect(inputs).toHaveLength(2);
    
    fireEvent.change(inputs[0], { target: { value: "admin" } });
    fireEvent.change(inputs[1], { target: { value: "secret" } });
    
    fireEvent.click(screen.getByRole("button", { name: "Send answer" }));
    
    expect(submit).toHaveBeenCalledWith({ username: "admin", password: "secret" });
  });

  it("handles confirmation questions without a submit button", () => {
    const question: CodexQuestion = {
      id: "q4",
      goalId: "g1",
      title: "Are you sure?",
      type: "confirmation",
      required: true,
    };
    const submit = vi.fn();

    render(<QuestionCard question={question} onSubmit={submit} />);
    
    expect(screen.queryByRole("button", { name: "Send answer" })).toBeNull();
    
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    expect(submit).toHaveBeenCalledWith(true);
  });
});
