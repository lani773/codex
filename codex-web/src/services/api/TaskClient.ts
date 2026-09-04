import type { Task } from "../../types/codex";
import { CodexClient } from "./CodexClient";
export class TaskClient extends CodexClient {
  get(goalId: string, taskId: string) { return this.request<Task>(`/goals/${encodeURIComponent(goalId)}/tasks/${encodeURIComponent(taskId)}`); }
  retry(goalId: string, taskId: string) { return this.request<void>(`/goals/${encodeURIComponent(goalId)}/tasks/${encodeURIComponent(taskId)}/retry`, { method: "POST" }); }
  cancel(goalId: string, taskId: string) { return this.request<void>(`/goals/${encodeURIComponent(goalId)}/tasks/${encodeURIComponent(taskId)}/cancel`, { method: "POST" }); }
}
