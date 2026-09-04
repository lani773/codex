import { describe, it, expect } from "vitest";
import { goalReducer, INITIAL_STATE, type GoalState } from "./useGoalReducer";
import type { CodexEvent, GoalSnapshot } from "../types/codex";

describe("useGoalReducer", () => {
  it("initializes with mock data", () => {
    const state = goalReducer(INITIAL_STATE, {
      type: "INIT_MOCK",
      goal: { id: "1", title: "Mock", objective: "Mock", status: "draft", progress: 0, requirements: [], successCriteria: [] },
      tasks: [],
      messages: [],
      activity: [],
      approvals: [],
      question: undefined,
      terminalEntries: [],
      testResults: [],
    });
    expect(state.goal.title).toBe("Mock");
  });

  it("handles goal.snapshot by replacing core state", () => {
    const snapshot: GoalSnapshot = {
      goal: { id: "1", title: "Snap", objective: "Snap", status: "draft", progress: 50, requirements: [], successCriteria: [] },
      tasks: [{ id: "t1", title: "T1", phase: "P1", status: "pending", progress: 0, summary: "", files: [], dependencies: [], agent: "A" }],
      serverSequence: 42,
    };
    
    const state = goalReducer(INITIAL_STATE, {
      type: "WS_EVENT",
      event: { type: "goal.snapshot", snapshot, sequence: 42 }
    });
    
    expect(state.goal.title).toBe("Snap");
    expect(state.tasks).toHaveLength(1);
    expect(state.lastSequence).toBe(42);
  });

  it("ignores stale events", () => {
    const stateWithSeq: GoalState = { ...INITIAL_STATE, lastSequence: 10 };
    
    const state = goalReducer(stateWithSeq, {
      type: "WS_EVENT",
      event: { type: "goal.progress", progress: 100, sequence: 5 }
    });
    
    // Should be ignored
    expect(state.goal.progress).toBe(0);
  });

  it("updates task progress", () => {
    const initialState: GoalState = {
      ...INITIAL_STATE,
      tasks: [{ id: "t1", title: "T1", phase: "P1", status: "running", progress: 0, summary: "Start", files: [], dependencies: [], agent: "A" }],
    };

    const state = goalReducer(initialState, {
      type: "WS_EVENT",
      event: { type: "task.progress", task_id: "t1", progress: 50, message: "Halfway", sequence: 1 }
    });

    expect(state.tasks[0].progress).toBe(50);
    expect(state.tasks[0].summary).toBe("Halfway");
  });

  it("adds an error activity when a task fails", () => {
    const initialState: GoalState = {
      ...INITIAL_STATE,
      tasks: [{ id: "t1", title: "T1", phase: "P1", status: "running", progress: 0, summary: "Start", files: [], dependencies: [], agent: "A" }],
    };

    const state = goalReducer(initialState, {
      type: "WS_EVENT",
      event: { type: "task.failed", task_id: "t1", reason: "Boom", sequence: 1 }
    });

    expect(state.tasks[0].status).toBe("failed");
    expect(state.activity[0].kind).toBe("error");
    expect(state.activity[0].text).toContain("failed");
  });
});
