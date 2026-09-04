# Codex Goal Workspace

React + TypeScript + Vite control center for a persistent, goal-driven Codex run. The backend is authoritative: React renders received state and sends typed commands.

The full backend architecture, API contract, security rules, rollout plan, and test matrix are in [BACKEND_API_PLAN.md](./BACKEND_API_PLAN.md).

## Run locally

```sh
pnpm install
pnpm dev
```

Copy `.env.example` to `.env.local`. `VITE_USE_MOCKS=true` provides a populated development UI. Set it to `false` to enable the WebSocket client.

When using a live backend, also set `VITE_CODEX_GOAL_ID`. The client hydrates that goal from the backend after each successful connection, so missed WebSocket events cannot become the source of truth.

## Workspace routes

| Route | Workspace |
| --- | --- |
| `/` | Execution overview, activity, questions, and goal-aware chat |
| `/goal`, `/plan`, `/tasks` | Scope, execution plan, and task inspection |
| `/files`, `/changes` | Lazy repository browsing and diff review |
| `/terminal`, `/tests` | Backend command output and verification evidence |
| `/approvals`, `/timeline` | Explicit security decisions and chronological history |
| `/settings` | Theme, model preference, and notification controls |
| `/new` | Goal Builder: turn a new idea into a Codex goal |

## Backend integration contract

### HTTP API

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/goals/:goalId/state` | Authoritative `GoalSnapshot`; call after connection and reconnection. |
| `POST` | `/api/goals` | Create a goal from `{ title, objective }`. |
| `PATCH` | `/api/goals/:goalId` | Update objective, requirements, or success criteria. |
| `GET` | `/api/projects/:projectId/tree?path=` | Lazy-load repository paths. |
| `GET` | `/api/files/:fileId` | Fetch one authorized file or diff. |
| `POST` | `/api/files` | Multipart upload; returns `{ id, name, size, status }`. |

`GoalSnapshot` must include `{ goal, tasks, serverSequence }`; it may additionally include `messages`, `activity`, and open `questions`. Use authenticated sessions or `Authorization: Bearer <token>`. Upload large files through HTTP, then include only the returned file ID in WebSocket messages.

### WebSocket

Connect to `VITE_CODEX_WS_URL` (default `ws://localhost:8787/ws`). Authenticate during the handshake or with `session.authenticate`. The client reconnects with exponential backoff and sends `state.sync` after every reconnect.

```json
{ "type": "task.progress", "goal_id": "goal_123", "task_id": "task_014", "progress": 72, "message": "Implementing permission checks" }
```

Required server events:

```text
goal.created | goal.updated | goal.ready | goal.approved | goal.progress
question.created | question.answered
plan.created | plan.updated
task.created | task.started | task.progress | task.completed | task.failed | task.blocked
file.created | file.modified
command.started | command.output | command.completed
test.started | test.result
agent.status | provider.status
goal.paused | goal.resumed | goal.completed | goal.failed
```

Include a monotonic `sequence` per goal. The client ignores stale state-changing events and requests `/state` after reconnection. The server may return an equivalent `goal.snapshot` event in response to `state.sync`. Never send hidden model reasoning; send action summaries, decisions, errors, and results.

### Client commands

```json
{ "type": "question.answer", "question_id": "q_123", "answer": ["lights", "fans"] }
{ "type": "goal.pause", "goal_id": "goal_123" }
{ "type": "goal.resume", "goal_id": "goal_123" }
{ "type": "goal.stop", "goal_id": "goal_123" }
{ "type": "plan.approve", "goal_id": "goal_123" }
{ "type": "task.retry", "goal_id": "goal_123", "task_id": "task_014" }
{ "type": "chat.message", "goal_id": "goal_123", "content": "Prioritize offline support", "file_ids": ["file_123"] }
{ "type": "approval.decide", "approval_id": "approval_123", "decision": "approved" }
```

Dangerous actions (stopping, migrations, dependency installs, network calls, and patch approval) must produce an explicit approval request before execution. The UI must never bypass Codex sandbox or approval policy.

## Frontend boundaries

`src/services/websocket/WebSocketManager.ts` owns connection, heartbeat, subscription, reconnection, and event routing. `src/services/api/` contains separate Goal, Task, Project, and File clients. Components do not construct network requests directly.
