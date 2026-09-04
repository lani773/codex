// ─── Primitive types ──────────────────────────────────────────────────────────

export type Theme = "light" | "dark" | "system";

export type TaskStatus =
  | "pending"
  | "ready"
  | "running"
  | "completed"
  | "failed"
  | "blocked";

export type GoalStatus =
  | "draft"
  | "discovering"
  | "planning"
  | "awaiting_approval"
  | "executing"
  | "paused"
  | "completed"
  | "failed";

export type ApprovalDecision = "approved" | "rejected";

export type RiskLevel = "low" | "medium" | "high";

// ─── Questions ────────────────────────────────────────────────────────────────

export type QuestionOption = {
  label: string;
  value: string;
  description?: string;
};

export type QuestionType =
  | "text"
  | "checkbox"
  | "radio"
  | "select"
  | "multi_field"
  | "confirmation";

export type CodexQuestion = {
  id: string;
  goalId: string;
  type: QuestionType;
  title: string;
  description?: string;
  options?: QuestionOption[];
  required: boolean;
  defaultValue?: string | string[] | Record<string, string>;
};

// ─── Goal Builder ─────────────────────────────────────────────────────────────

export type GoalBuilderPhase =
  | "describing"
  | "discovering"
  | "reviewing"
  | "approved";

export type GoalBuilderState = {
  phase: GoalBuilderPhase;
  idea: string;
  title: string;
  objective: string;
  pendingQuestions: CodexQuestion[];
  answeredQuestions: Map<string, unknown>;
  draftRequirements: Array<{ id: string; text: string }>;
  draftSuccessCriteria: Array<{ id: string; text: string }>;
};

// ─── Tasks ────────────────────────────────────────────────────────────────────

export type TaskAttempt = {
  id: string;
  startedAt: string;
  finishedAt?: string;
  status: "running" | "completed" | "failed";
  summary: string;
};

export type Task = {
  id: string;
  title: string;
  phase: string;
  status: TaskStatus;
  progress: number;
  summary: string;
  files: string[];
  dependencies: string[];
  agent: string;
  attempts?: TaskAttempt[];
  blockedReason?: string;
  startedAt?: string;
  completedAt?: string;
};

// ─── Goal ─────────────────────────────────────────────────────────────────────

export type Requirement = { id: string; text: string; checked: boolean };
export type SuccessCriterion = { id: string; text: string; checked: boolean };

export type Goal = {
  id: string;
  title: string;
  objective: string;
  status: GoalStatus;
  progress: number;
  requirements: Requirement[];
  successCriteria: SuccessCriterion[];
};

// ─── Snapshot ─────────────────────────────────────────────────────────────────

export type GoalSnapshot = {
  goal: Goal;
  tasks: Task[];
  messages?: ChatMessage[];
  activity?: Activity[];
  questions?: CodexQuestion[];
  serverSequence: number;
};

// ─── Chat ─────────────────────────────────────────────────────────────────────

export type ChatMessageRole = "user" | "codex" | "system";

export type ChatMessage = {
  id: string;
  role: ChatMessageRole;
  content: string;
  time: string;
  fileIds?: string[];
};

// ─── Activity ─────────────────────────────────────────────────────────────────

export type ActivityKind = "success" | "working" | "warning" | "error";

export type Activity = {
  id: string;
  time: string;
  kind: ActivityKind;
  text: string;
};

// ─── Files ────────────────────────────────────────────────────────────────────

export type FileNode = {
  id: string;
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
  language?: string;
  updatedAt?: string;
  size?: string;
  content?: string;
  loading?: boolean;
};

// ─── Changes ──────────────────────────────────────────────────────────────────

export type ChangeStatus = "created" | "modified" | "deleted";

export type Change = {
  id: string;
  path: string;
  status: ChangeStatus;
  additions: number;
  deletions: number;
  summary: string;
  diff: string[];
  taskId?: string;
};

// ─── Tests ────────────────────────────────────────────────────────────────────

export type TestStatus = "passed" | "failed" | "running" | "pending";
export type TestGroup = "Unit" | "Integration" | "Quality" | "Build";

export type TestResult = {
  id: string;
  name: string;
  group: TestGroup;
  status: TestStatus;
  duration?: string;
  details?: string;
};

// ─── Terminal ─────────────────────────────────────────────────────────────────

export type TerminalEntryType = "command" | "output" | "success" | "error";

export type TerminalEntry = {
  id: string;
  type: TerminalEntryType;
  content: string;
  timestamp?: string;
};

// ─── Approvals ────────────────────────────────────────────────────────────────

export type ApprovalStatus = "pending" | "approved" | "rejected";

export type ApprovalItem = {
  label: string;
  detail: string;
  selected: boolean;
};

export type Approval = {
  id: string;
  goalId: string;
  title: string;
  description: string;
  risk: RiskLevel;
  requestedAt: string;
  items: ApprovalItem[];
  status: ApprovalStatus;
};

// ─── Timeline ─────────────────────────────────────────────────────────────────

export type TimelineEventType =
  | "goal"
  | "plan"
  | "task"
  | "test"
  | "approval"
  | "error";

export type TimelineEvent = {
  id: string;
  time: string;
  title: string;
  description: string;
  type: TimelineEventType;
};

// ─── Agent & Provider status ──────────────────────────────────────────────────

export type AgentRole = "planner" | "coder" | "tester" | "reviewer";

export type AgentStatus = {
  id: string;
  name: string;
  role: AgentRole;
  status: "idle" | "working" | "waiting" | "error";
  currentTask?: string;
  model?: string;
};

export type ProviderStatus = {
  id: string;
  name: string;
  available: boolean;
  latencyMs?: number;
};

// ─── WebSocket event union ────────────────────────────────────────────────────

type WithSequence = { goal_id?: string; sequence?: number };

export type CodexEvent = (
  | { type: "goal.snapshot"; snapshot: GoalSnapshot }
  | { type: "goal.created"; goal: Goal }
  | { type: "goal.updated"; goal: Partial<Goal> }
  | { type: "goal.ready"; goal: Goal }
  | { type: "goal.approved" }
  | { type: "goal.progress"; progress: number }
  | { type: "goal.paused" }
  | { type: "goal.resumed" }
  | { type: "goal.completed"; goal: Goal }
  | { type: "goal.failed"; reason: string }
  | { type: "question.created"; question: CodexQuestion }
  | { type: "question.answered"; question_id: string; answer: unknown }
  | { type: "plan.created"; tasks: Task[] }
  | { type: "plan.updated"; tasks: Task[] }
  | { type: "task.created"; task: Task }
  | { type: "task.started"; task_id: string }
  | {
      type: "task.progress";
      task_id: string;
      progress: number;
      message: string;
    }
  | { type: "task.completed"; task_id: string }
  | { type: "task.failed"; task_id: string; reason: string }
  | { type: "task.blocked"; task_id: string; reason: string }
  | { type: "file.created"; file: FileNode }
  | { type: "file.modified"; file: FileNode }
  | { type: "command.started"; command_id: string; command: string }
  | {
      type: "command.output";
      command_id: string;
      output: string;
      stream: "stdout" | "stderr";
    }
  | {
      type: "command.completed";
      command_id: string;
      exit_code: number;
    }
  | { type: "test.started"; test_id: string }
  | {
      type: "test.result";
      name: string;
      status: "passed" | "failed";
      details?: string;
      duration?: string;
    }
  | { type: "agent.status"; agents: AgentStatus[] }
  | { type: "provider.status"; providers: ProviderStatus[] }
  | { type: "approval.requested"; approval: Approval }
  | { type: "activity"; activity: Activity }
  | { type: "terminal.output"; output: string }
) &
  WithSequence;

// ─── Client commands (for documentation / WS.send typing) ────────────────────

export type CodexCommand =
  | { type: "session.authenticate"; token: string }
  | { type: "state.sync" }
  | { type: "heartbeat" }
  | { type: "goal.subscribe"; goal_id: string }
  | { type: "goal.unsubscribe"; goal_id: string }
  | { type: "goal.pause"; goal_id: string }
  | { type: "goal.resume"; goal_id: string }
  | { type: "goal.stop"; goal_id: string }
  | { type: "plan.approve"; goal_id: string }
  | { type: "task.retry"; goal_id: string; task_id: string }
  | {
      type: "chat.message";
      goal_id: string;
      content: string;
      file_ids?: string[];
    }
  | {
      type: "question.answer";
      question_id: string | undefined;
      answer: unknown;
    }
  | {
      type: "approval.decide";
      approval_id: string;
      decision: ApprovalDecision;
    }
  | { type: "goal.update"; goal_id: string; patch: Partial<Goal> };
