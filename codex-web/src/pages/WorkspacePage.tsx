import { QuestionCard } from "../components/QuestionCard";
import { ProgressBar } from "../components/ProgressBar";
import { AgentStatusBar } from "../components/AgentStatusBar";
import { NotificationBell, ActivityFeed } from "../components/NotificationBell";
import { StatusBadge } from "../components/StatusBadge";
import type {
  Activity,
  AgentStatus,
  ChatMessage,
  CodexQuestion,
  Goal,
  ProviderStatus,
  Task,
} from "../types/codex";

type Props = {
  goal: Goal;
  tasks: Task[];
  activity: Activity[];
  messages: ChatMessage[];
  question?: CodexQuestion;
  draft: string;
  agents: AgentStatus[];
  providers: ProviderStatus[];
  onDraftChange: (value: string) => void;
  onSend: () => void;
  onAnswer: (answer: unknown) => void;
  onOpenPlan: () => void;
  onAttach: (files: FileList | null) => void;
};

export function WorkspacePage({
  goal,
  tasks,
  activity,
  messages,
  question,
  draft,
  agents,
  providers,
  onDraftChange,
  onSend,
  onAnswer,
  onOpenPlan,
  onAttach,
}: Props) {
  const completed = tasks.filter((t) => t.status === "completed").length;
  const running = tasks.filter((t) => t.status === "running");
  const failedCount = tasks.filter((t) => t.status === "failed").length;

  return (
    <>
      <section className="metric-grid">
        <Metric
          label="Goal progress"
          value={`${goal.progress}%`}
          detail={`${completed} / ${tasks.length} tasks completed`}
          progress={goal.progress}
        />
        <Metric
          label="Current focus"
          value={running.length > 0 ? running[0].id : "None"}
          detail={running.length > 0 ? running[0].title : "Awaiting next steps"}
        />
        <Metric
          label="Goal health"
          value={failedCount > 0 ? "Needs attention" : "Healthy"}
          detail={failedCount > 0 ? `${failedCount} tasks failed` : "Execution is proceeding"}
        />
        <Metric
          label="Waiting on you"
          value={question ? "1 item" : "All clear"}
          detail={question ? "Input required" : "No pending decisions"}
        />
      </section>

      <div className="content-grid">
        <section className="panel plan-panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">EXECUTION PLAN</span>
              <h2>Delivery map</h2>
            </div>
            <button className="text-button" onClick={onOpenPlan}>
              Open plan →
            </button>
          </div>
          <div className="task-list">
            {tasks.slice(0, 5).map((task) => (
              <article className="task-row" key={task.id}>
                <i className={`status-dot status-${task.status}`} aria-hidden="true" />
                <div className="task-row-main">
                  <b>{task.title}</b>
                  <small>
                    {task.phase} · {task.id}
                  </small>
                </div>
                <div className="task-progress">
                  {task.status === "running" ? (
                    <ProgressBar value={task.progress} label={`${task.progress}%`} size="sm" />
                  ) : (
                    <StatusBadge kind="task" status={task.status} />
                  )}
                </div>
              </article>
            ))}
            {tasks.length > 5 && (
              <button className="text-button view-all-btn" onClick={onOpenPlan}>
                View all {tasks.length} tasks
              </button>
            )}
          </div>
        </section>

        <section className="panel activity-panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">LIVE SIGNAL</span>
              <h2>Codex activity</h2>
            </div>
            <AgentStatusBar agents={agents} providers={providers} />
          </div>
          <div className="activity-feed-container">
            <ActivityFeed activity={activity} limit={10} />
          </div>
        </section>

        <section className="panel chat-panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">CONVERSATION</span>
              <h2>Work with Codex</h2>
            </div>
            <label className="attach" title="Attach files" aria-label="Attach files">
              ⌕ <input type="file" multiple onChange={(e) => onAttach(e.target.files)} />
            </label>
          </div>
          <div className="messages" role="log" aria-live="polite">
            {messages.map((msg) => (
              <article className={`message ${msg.role}`} key={msg.id}>
                <span aria-hidden="true">
                  {msg.role === "codex" ? "C" : msg.role === "system" ? "!" : "You"}
                </span>
                <div className="message-bubble">
                  <p>{msg.content}</p>
                  {msg.fileIds && msg.fileIds.length > 0 && (
                    <div className="message-attachments">
                      {msg.fileIds.map((f) => (
                        <span key={f} className="file-chip small">
                          ▱ {f}
                        </span>
                      ))}
                    </div>
                  )}
                  <small>{msg.time}</small>
                </div>
              </article>
            ))}
          </div>
          <div className="composer">
            <textarea
              value={draft}
              onChange={(e) => onDraftChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSend();
                }
              }}
              placeholder="Give Codex context, feedback, or a new direction…"
              aria-label="Message Codex"
              rows={2}
            />
            <button
              className="primary"
              onClick={onSend}
              disabled={!draft.trim()}
              aria-label="Send message"
            >
              Send ↑
            </button>
          </div>
        </section>

        {question && <QuestionCard question={question} onSubmit={onAnswer} />}
      </div>
    </>
  );
}

function Metric({
  label,
  value,
  detail,
  progress,
}: {
  label: string;
  value: string;
  detail: string;
  progress?: number;
}) {
  return (
    <section className="metric">
      <span className="metric-label">{label}</span>
      <strong className="metric-value">{value}</strong>
      <small className="metric-detail">{detail}</small>
      {progress !== undefined && (
        <div className="mini-progress" aria-hidden="true">
          <i style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
        </div>
      )}
    </section>
  );
}
