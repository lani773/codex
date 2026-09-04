import { StatusBadge } from "./StatusBadge";
import { ProgressBar } from "./ProgressBar";
import type { Task } from "../types/codex";

type Props = {
  task: Task | null;
  onClose: () => void;
  onRetry?: (taskId: string) => void;
};

export function TaskDrawer({ task, onClose, onRetry }: Props) {
  if (!task) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="drawer-backdrop"
        aria-hidden="true"
        onClick={onClose}
      />
      {/* Drawer */}
      <aside className="task-drawer" role="dialog" aria-modal="true" aria-label={task.title}>
        <div className="drawer-header">
          <div>
            <span className="eyebrow">{task.id}</span>
            <h2>{task.title}</h2>
          </div>
          <button
            className="drawer-close"
            onClick={onClose}
            aria-label="Close task detail"
          >
            ×
          </button>
        </div>

        <div className="drawer-body">
          <div className="drawer-badges">
            <StatusBadge kind="task" status={task.status} />
            {task.agent && (
              <span className="agent-pill">{task.agent}</span>
            )}
          </div>

          <p className="drawer-summary">{task.summary}</p>

          {task.status === "running" && (
            <ProgressBar
              value={task.progress}
              label="Progress"
              detail={`${task.progress}%`}
              size="md"
            />
          )}

          {task.blockedReason && (
            <div className="drawer-blocked" role="alert">
              <span>⊘ Blocked</span>
              <p>{task.blockedReason}</p>
            </div>
          )}

          <DrawerSection label="Phase">
            <span>{task.phase}</span>
          </DrawerSection>

          <DrawerSection label="Dependencies">
            {task.dependencies.length > 0 ? (
              <ul className="dep-list">
                {task.dependencies.map((dep) => (
                  <li key={dep}>
                    <code>{dep}</code>
                  </li>
                ))}
              </ul>
            ) : (
              <span className="muted">No dependencies</span>
            )}
          </DrawerSection>

          {task.files.length > 0 && (
            <DrawerSection label="Affected files">
              <ul className="file-chip-list">
                {task.files.map((f) => (
                  <li key={f} className="file-chip">
                    <span aria-hidden="true">▱</span> {f}
                  </li>
                ))}
              </ul>
            </DrawerSection>
          )}

          {task.attempts && task.attempts.length > 0 && (
            <DrawerSection label="Attempts">
              <ol className="attempt-list">
                {task.attempts.map((attempt, i) => (
                  <li key={attempt.id} className={`attempt attempt-${attempt.status}`}>
                    <span className="attempt-num">{i + 1}</span>
                    <div>
                      <b>{attempt.summary}</b>
                      <small>
                        {attempt.startedAt}
                        {attempt.finishedAt ? ` → ${attempt.finishedAt}` : " (in progress)"}
                      </small>
                    </div>
                    <StatusBadge kind="task" status={attempt.status === "running" ? "running" : attempt.status === "completed" ? "completed" : "failed"} />
                  </li>
                ))}
              </ol>
            </DrawerSection>
          )}

          {task.startedAt && (
            <DrawerSection label="Timing">
              <span>Started {task.startedAt}</span>
              {task.completedAt && <span> · Completed {task.completedAt}</span>}
            </DrawerSection>
          )}
        </div>

        <div className="drawer-footer">
          {task.status === "failed" && onRetry && (
            <button
              className="primary"
              onClick={() => onRetry(task.id)}
              aria-label={`Retry task ${task.id}`}
            >
              ↻ Retry task
            </button>
          )}
          <button onClick={onClose}>Close</button>
        </div>
      </aside>
    </>
  );
}

function DrawerSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="drawer-section">
      <span className="drawer-section-label">{label}</span>
      <div>{children}</div>
    </div>
  );
}
