import type { Goal, GoalSnapshot } from "../../types/codex";
import { CodexClient } from "./CodexClient";
export class GoalClient extends CodexClient {
  getState(goalId: string) { return this.request<GoalSnapshot>(`/goals/${encodeURIComponent(goalId)}/state`); }
  create(input: Pick<Goal, "title" | "objective">) { return this.request<Goal>("/goals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) }); }
  update(goalId: string, input: Partial<Pick<Goal, "objective" | "requirements" | "successCriteria">>) { return this.request<Goal>(`/goals/${encodeURIComponent(goalId)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) }); }
}
