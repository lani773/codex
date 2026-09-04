# Codex Goal Workspace Backend API Plan

## Ownership and principles

The backend is authoritative for goals, plans, tasks, files, approvals, execution, tests, providers, and completion. `codex-web` only renders state and submits user intent. It never fabricates progress, executes shell commands, or treats a WebSocket event as the only durable truth.

- REST provides bounded resource operations, binary uploads, and recovery snapshots.
- A single authenticated WebSocket provides subscriptions, commands, and live events.
- JSON keys and enum values use `camelCase`; IDs are opaque strings such as `goal_123`.
- All mutable resources include `version`; stale updates return `409`.
- State-changing REST calls require `Idempotency-Key`.
- Timestamps use RFC 3339 UTC.
- Events contain useful action summaries and results, never model chain-of-thought.

```text
Codex Web
  REST: snapshots, goals, files, changes, reports
  WebSocket: commands, subscriptions, events
      ↓
Codex orchestration service
  Goal · Planner · Execution · Workspace · Tool gateway · Approval · Provider
```

## Canonical snapshot

`GET /api/v1/goals/:goalId/state` returns the bounded recovery document:

```ts
type GoalSnapshot = {
  goal: Goal;
  plan: Plan | null;
  tasks: Task[];
  questions: CodexQuestion[];
  approvals: Approval[];
  providerStatus: ProviderStatus[];
  execution: ExecutionSummary;
  serverSequence: number;
};
```

Terminal history, file content, diffs, activity, and chat must be paged separately. Never return an entire repository or unlimited history in this response.

## REST resources

| Method | Endpoint | Request / result |
| --- | --- | --- |
| `POST` | `/goals` | `{ projectId, title, objective, fileIds? }` → `201 Goal` |
| `GET` | `/goals/:goalId` | Lightweight `Goal` |
| `GET` | `/goals/:goalId/state` | `GoalSnapshot` after load/reconnect |
| `PATCH` | `/goals/:goalId` | `{ objective?, requirements?, successCriteria?, version }` |
| `POST` | `/goals/:goalId/pause` | `{ version }` → `202` |
| `POST` | `/goals/:goalId/resume` | `{ version }` → `202` |
| `POST` | `/goals/:goalId/stop` | `{ version, confirmation }` → `202` |
| `GET` | `/goals/:goalId/questions?status=open` | Paginated structured questions |
| `POST` | `/goals/:goalId/questions/:questionId/answer` | `{ answer, version }` → `202` |
| `GET` | `/goals/:goalId/plan` | `Plan` |
| `POST` | `/goals/:goalId/plan/approve` | `{ version }` → `202` |
| `POST` | `/goals/:goalId/plan/reject` | `{ feedback, version }` → `202` |
| `GET` | `/goals/:goalId/tasks?status=&cursor=&limit=` | Paginated tasks |
| `GET` | `/goals/:goalId/tasks/:taskId` | Task detail, dependencies, files, attempts |
| `POST` | `/goals/:goalId/tasks/:taskId/retry` | `{ version }` → `202` |
| `POST` | `/goals/:goalId/tasks/:taskId/cancel` | `{ version }` → `202` |
| `GET` | `/projects/:projectId/tree?path=&cursor=&limit=` | One lazy directory level |
| `GET` | `/projects/:projectId/files/:fileId` | One authorized file or preview |
| `GET` | `/goals/:goalId/changes?cursor=&limit=` | Change summaries |
| `GET` | `/goals/:goalId/changes/:changeId/diff` | Bounded unified diff |
| `GET` | `/goals/:goalId/terminal?cursor=&limit=` | Historical terminal chunks |
| `GET` | `/goals/:goalId/tests?cursor=&limit=` | Test runs/results |
| `GET` | `/goals/:goalId/timeline?cursor=&limit=` | User-visible event history |
| `GET` | `/goals/:goalId/report` | Final verified report |

### Files

Upload with `POST /files` using `multipart/form-data`. Validate project ownership, file type, size, quota, and malware policy. Return `{ id, name, size, uploadStatus, processingStatus }`; clients use the returned file IDs in chat and goal commands. For large content use signed object-storage upload URLs, never ordinary JSON WebSocket messages.

### Approvals

| Method | Endpoint | Request / result |
| --- | --- | --- |
| `GET` | `/goals/:goalId/approvals?status=pending` | Pending approval page |
| `GET` | `/goals/:goalId/approvals/:approvalId` | Full risk/scope detail |
| `POST` | `/goals/:goalId/approvals/:approvalId/decision` | `{ decision, selectedItemIds?, version }` → `202` |

An approval identifies the requested operation, affected resources, risk, policy reason, expiry, and audit ID. It cannot grant blanket future authority.

## WebSocket protocol

Connect to `wss://<host>/api/v1/ws`.

1. Authenticate during upgrade or with `session.authenticate`.
2. Send `goal.subscribe` for each active goal.
3. Send `state.sync` at connection and after reconnect.
4. Server replies with `goal.snapshot` or event replay after the supplied sequence.
5. Send heartbeat every 25 seconds.

Every event includes `eventId`, `goalId`, `sequence`, and `occurredAt`.

```json
{
  "type": "task.progress",
  "eventId": "event_123",
  "goalId": "goal_123",
  "sequence": 381,
  "occurredAt": "2026-09-04T20:35:00Z",
  "taskId": "task_014",
  "progress": 72,
  "message": "Implementing permission checks"
}
```

Client command types: `session.authenticate`, `heartbeat`, `state.sync`, `goal.subscribe`, `goal.unsubscribe`, `chat.message`, `question.answer`, `goal.update`, `plan.approve`, `plan.reject`, `goal.pause`, `goal.resume`, `goal.stop`, `task.retry`, `task.cancel`, and `approval.decide`.

Server event types: `goal.created`, `goal.updated`, `goal.ready`, `goal.progress`, `goal.snapshot`, `goal.paused`, `goal.resumed`, `goal.completed`, `goal.failed`, `question.created`, `question.answered`, `plan.created`, `plan.updated`, `task.created`, `task.started`, `task.progress`, `task.completed`, `task.failed`, `task.blocked`, `file.created`, `file.processed`, `file.failed`, `file.modified`, `change.created`, `change.updated`, `command.started`, `command.output`, `command.completed`, `test.started`, `test.result`, `test.completed`, `approval.requested`, `approval.decided`, `agent.status`, `provider.status`, `activity.created`, and `notification.created`.

## Consistency and security

- Persist the resource mutation and its event outbox record in one transaction.
- Allocate each per-goal sequence transactionally; client discards events at or below its applied sequence.
- Deduplicate commands with `commandId` or `Idempotency-Key`.
- Enforce project membership on every REST resource and WebSocket subscription.
- Validate that every task, file, and approval belongs to the requested goal/project.
- Commands execute only through the Codex sandbox/tool policy; browsers have no shell capability.
- Redact secrets from output, diffs, errors, activities, and final reports.
- Rate limit commands/uploads and cap streamed/paged content sizes.

## Delivery phases

### Phase 1 — foundation

Authentication, authorization, error envelope, goal CRUD, snapshots, audit IDs, WebSocket authentication, subscriptions, heartbeat, sequence allocation, and sync.

**Exit:** a browser can reconnect, hydrate a goal, and discard stale events.

### Phase 2 — discovery and planning

Backend-driven questions, validated answers, requirement edits, plan/task/dependency APIs, and plan approval.

**Exit:** idea → questions → approved plan survives reload and reconnect at each step.

### Phase 3 — execution visibility

Task lifecycle, provider/agent state, terminal output, tests, activity, retries, failures, pause/resume/stop.

**Exit:** live execution is visible without polling task status.

### Phase 4 — workspace and approvals

Lazy file tree, uploads, diffs, change review, scoped approval decisions, expiry, and audit records.

**Exit:** users understand exactly what is changing and what approval permits.

### Phase 5 — verification and operations

Server-side success-criteria aggregation, completion gate, final report, logs, metrics, tracing, and event delivery monitoring.

**Exit:** `goal.completed` has reproducible verification evidence.

## Mandatory backend tests

- REST and WebSocket authorization.
- Idempotency for create, commands, retry, stop, and approvals.
- Invalid goal/task state transitions and stale versions.
- Event ordering, duplicates, replay, reconnect, and snapshot recovery.
- Every structured question schema and answer validation.
- Upload ownership/type/quota/size checks.
- Approval expiry, rejection, audit persistence, and policy enforcement.
- Secret redaction and bounded terminal/diff paging.
- Completion cannot emit until required tests, build, security checks, and success criteria pass.

## Decisions required before implementation

1. Extend Codex app-server v2 or build a separate web orchestration service?
2. Which identity/session provider will protect browser and WebSocket access?
3. Which file store and attachment limits are required?
4. Which operations require approval by default?
5. What retention policies apply to files, logs, diffs, event history, and audit records?
