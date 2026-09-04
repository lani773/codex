import type {
  Activity,
  AgentStatus,
  Approval,
  ApprovalDecision,
  ChatMessage,
  CodexEvent,
  CodexQuestion,
  Goal,
  GoalSnapshot,
  GoalStatus,
  ProviderStatus,
  Task,
  TerminalEntry,
  TestResult,
} from "../types/codex";

// ─── State ────────────────────────────────────────────────────────────────────

export type GoalState = {
  goal: Goal;
  tasks: Task[];
  messages: ChatMessage[];
  activity: Activity[];
  approvals: Approval[];
  question: CodexQuestion | undefined;
  terminalEntries: TerminalEntry[];
  testResults: TestResult[];
  agents: AgentStatus[];
  providers: ProviderStatus[];
  paused: boolean;
  lastSequence: number;
};

// ─── Actions ──────────────────────────────────────────────────────────────────

export type GoalAction =
  | { type: "INIT_MOCK"; goal: Goal; tasks: Task[]; messages: ChatMessage[]; activity: Activity[]; approvals: Approval[]; question: CodexQuestion | undefined; terminalEntries: TerminalEntry[]; testResults: TestResult[] }
  | { type: "WS_EVENT"; event: CodexEvent }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "SET_GOAL"; goal: Goal }
  | { type: "ADD_MESSAGE"; message: ChatMessage }
  | { type: "ADD_ACTIVITY"; activity: Activity }
  | { type: "TOGGLE_REQUIREMENT"; id: string }
  | { type: "ADD_REQUIREMENT"; text: string }
  | { type: "DELETE_REQUIREMENT"; id: string }
  | { type: "TOGGLE_CRITERION"; id: string }
  | { type: "ADD_CRITERION"; text: string }
  | { type: "DELETE_CRITERION"; id: string }
  | { type: "UPDATE_OBJECTIVE"; objective: string }
  | { type: "DECIDE_APPROVAL"; approvalId: string; decision: ApprovalDecision }
  | { type: "DISMISS_QUESTION" }
  | { type: "APPEND_TERMINAL"; entry: TerminalEntry };

// ─── Initial state ────────────────────────────────────────────────────────────

const emptyGoal: Goal = {
  id: "",
  title: "Loading goal…",
  objective: "Waiting for authoritative Codex state.",
  status: "draft" as GoalStatus,
  progress: 0,
  requirements: [],
  successCriteria: [],
};

export const INITIAL_STATE: GoalState = {
  goal: emptyGoal,
  tasks: [],
  messages: [],
  activity: [],
  approvals: [],
  question: undefined,
  terminalEntries: [],
  testResults: [],
  agents: [],
  providers: [],
  paused: false,
  lastSequence: -1,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function applySnapshot(state: GoalState, snapshot: GoalSnapshot): GoalState {
  return {
    ...state,
    goal: snapshot.goal,
    tasks: snapshot.tasks,
    messages: snapshot.messages ?? [],
    activity: snapshot.activity ?? [],
    question: snapshot.questions?.[0],
    lastSequence: snapshot.serverSequence,
  };
}

function isStale(state: GoalState, seq: number | undefined): boolean {
  if (seq === undefined) return false;
  return seq <= state.lastSequence;
}

function makeActivity(text: string, kind: Activity["kind"] = "working"): Activity {
  return { id: crypto.randomUUID(), time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), kind, text };
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

export function goalReducer(state: GoalState, action: GoalAction): GoalState {
  switch (action.type) {
    // ── Bootstrap ────────────────────────────────────────────────────────────
    case "INIT_MOCK":
      return {
        ...state,
        goal: action.goal,
        tasks: action.tasks,
        messages: action.messages,
        activity: action.activity,
        approvals: action.approvals,
        question: action.question,
        terminalEntries: action.terminalEntries,
        testResults: action.testResults,
        paused: false,
      };

    // ── WebSocket events ──────────────────────────────────────────────────────
    case "WS_EVENT": {
      const { event } = action;
      if (isStale(state, event.sequence)) return state;
      const nextSeq = event.sequence !== undefined
        ? Math.max(state.lastSequence, event.sequence)
        : state.lastSequence;

      switch (event.type) {
        case "goal.snapshot":
          return applySnapshot(state, event.snapshot);

        case "goal.updated":
          return {
            ...state,
            goal: { ...state.goal, ...event.goal },
            lastSequence: nextSeq,
          };

        case "goal.created":
        case "goal.ready":
          return { ...state, goal: event.goal, lastSequence: nextSeq };

        case "goal.progress":
          return {
            ...state,
            goal: { ...state.goal, progress: event.progress },
            lastSequence: nextSeq,
          };

        case "goal.paused":
          return { ...state, paused: true, lastSequence: nextSeq };

        case "goal.resumed":
          return { ...state, paused: false, lastSequence: nextSeq };

        case "goal.completed":
          return {
            ...state,
            goal: { ...event.goal, status: "completed" },
            lastSequence: nextSeq,
          };

        case "goal.failed":
          return {
            ...state,
            goal: { ...state.goal, status: "failed" },
            activity: [makeActivity(`Goal failed: ${event.reason}`, "error"), ...state.activity],
            lastSequence: nextSeq,
          };

        case "plan.created":
        case "plan.updated":
          return { ...state, tasks: event.tasks, lastSequence: nextSeq };

        case "task.created":
          return {
            ...state,
            tasks: [...state.tasks, event.task],
            lastSequence: nextSeq,
          };

        case "task.started":
          return {
            ...state,
            tasks: state.tasks.map((t) =>
              t.id === event.task_id ? { ...t, status: "running" } : t
            ),
            lastSequence: nextSeq,
          };

        case "task.progress":
          return {
            ...state,
            tasks: state.tasks.map((t) =>
              t.id === event.task_id
                ? { ...t, progress: event.progress, summary: event.message, status: "running" }
                : t
            ),
            lastSequence: nextSeq,
          };

        case "task.completed":
          return {
            ...state,
            tasks: state.tasks.map((t) =>
              t.id === event.task_id ? { ...t, status: "completed", progress: 100 } : t
            ),
            lastSequence: nextSeq,
          };

        case "task.failed":
          return {
            ...state,
            tasks: state.tasks.map((t) =>
              t.id === event.task_id
                ? { ...t, status: "failed", summary: event.reason }
                : t
            ),
            activity: [makeActivity(`Task ${event.task_id} failed`, "error"), ...state.activity],
            lastSequence: nextSeq,
          };

        case "task.blocked":
          return {
            ...state,
            tasks: state.tasks.map((t) =>
              t.id === event.task_id
                ? { ...t, status: "blocked", blockedReason: event.reason }
                : t
            ),
            lastSequence: nextSeq,
          };

        case "question.created":
          return { ...state, question: event.question, lastSequence: nextSeq };

        case "test.result": {
          const existing = state.testResults.find((r) => r.name === event.name);
          const updated: TestResult = {
            id: existing?.id ?? crypto.randomUUID(),
            name: event.name,
            group: existing?.group ?? "Unit",
            status: event.status,
            details: event.details,
            duration: event.duration,
          };
          return {
            ...state,
            testResults: existing
              ? state.testResults.map((r) => (r.name === event.name ? updated : r))
              : [...state.testResults, updated],
            lastSequence: nextSeq,
          };
        }

        case "agent.status":
          return { ...state, agents: event.agents, lastSequence: nextSeq };

        case "provider.status":
          return { ...state, providers: event.providers, lastSequence: nextSeq };

        case "approval.requested":
          return {
            ...state,
            approvals: [...state.approvals, event.approval],
            activity: [makeActivity("Approval required: " + event.approval.title, "warning"), ...state.activity],
            lastSequence: nextSeq,
          };

        case "activity":
          return {
            ...state,
            activity: [event.activity, ...state.activity],
            lastSequence: nextSeq,
          };

        case "command.output":
          return {
            ...state,
            terminalEntries: [
              ...state.terminalEntries,
              {
                id: crypto.randomUUID(),
                type: event.stream === "stderr" ? "error" : "output",
                content: event.output,
              } as TerminalEntry,
            ],
            lastSequence: nextSeq,
          };

        case "terminal.output":
          return {
            ...state,
            terminalEntries: [
              ...state.terminalEntries,
              { id: crypto.randomUUID(), type: "output", content: event.output } as TerminalEntry,
            ],
            lastSequence: nextSeq,
          };

        default:
          return state;
      }
    }

    // ── UI mutations ──────────────────────────────────────────────────────────
    case "PAUSE":
      return {
        ...state,
        paused: true,
        activity: [makeActivity("Execution paused"), ...state.activity],
      };

    case "RESUME":
      return {
        ...state,
        paused: false,
        activity: [makeActivity("Execution resumed", "success"), ...state.activity],
      };

    case "SET_GOAL":
      return { ...state, goal: action.goal };

    case "ADD_MESSAGE":
      return { ...state, messages: [...state.messages, action.message] };

    case "ADD_ACTIVITY":
      return { ...state, activity: [action.activity, ...state.activity] };

    case "TOGGLE_REQUIREMENT":
      return {
        ...state,
        goal: {
          ...state.goal,
          requirements: state.goal.requirements.map((r) =>
            r.id === action.id ? { ...r, checked: !r.checked } : r
          ),
        },
      };

    case "ADD_REQUIREMENT":
      return {
        ...state,
        goal: {
          ...state.goal,
          requirements: [
            ...state.goal.requirements,
            { id: crypto.randomUUID(), text: action.text, checked: false },
          ],
        },
      };

    case "DELETE_REQUIREMENT":
      return {
        ...state,
        goal: {
          ...state.goal,
          requirements: state.goal.requirements.filter((r) => r.id !== action.id),
        },
      };

    case "TOGGLE_CRITERION":
      return {
        ...state,
        goal: {
          ...state.goal,
          successCriteria: state.goal.successCriteria.map((c) =>
            c.id === action.id ? { ...c, checked: !c.checked } : c
          ),
        },
      };

    case "ADD_CRITERION":
      return {
        ...state,
        goal: {
          ...state.goal,
          successCriteria: [
            ...state.goal.successCriteria,
            { id: crypto.randomUUID(), text: action.text, checked: false },
          ],
        },
      };

    case "DELETE_CRITERION":
      return {
        ...state,
        goal: {
          ...state.goal,
          successCriteria: state.goal.successCriteria.filter((c) => c.id !== action.id),
        },
      };

    case "UPDATE_OBJECTIVE":
      return {
        ...state,
        goal: { ...state.goal, objective: action.objective },
      };

    case "DECIDE_APPROVAL":
      return {
        ...state,
        approvals: state.approvals.map((a) =>
          a.id === action.approvalId ? { ...a, status: action.decision } : a
        ),
        activity: [
          makeActivity(
            `Approval ${action.decision}`,
            action.decision === "approved" ? "success" : "warning"
          ),
          ...state.activity,
        ],
      };

    case "DISMISS_QUESTION":
      return { ...state, question: undefined };

    case "APPEND_TERMINAL":
      return {
        ...state,
        terminalEntries: [...state.terminalEntries, action.entry],
      };

    default:
      return state;
  }
}

// ─── Type re-export for consumers ────────────────────────────────────────────
export type { TestResult };
