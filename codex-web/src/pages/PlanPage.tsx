import { useMemo, useState } from "react";
import { StatusBadge } from "../components/StatusBadge";
import { ProgressBar } from "../components/ProgressBar";
import { EmptyState } from "../components/EmptyState";
import { TaskDrawer } from "../components/TaskDrawer";
import type { Task, GoalStatus } from "../types/codex";

type Props = {
  tasks: Task[];
  goalStatus: GoalStatus;
  onApprovePlan: () => void;
  onRetryTask?: (taskId: string) => void;
};

export function PlanPage({ tasks, goalStatus, onApprovePlan, onRetryTask }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const phases = useMemo(() => {
    return [...new Set(tasks.map((task) => task.phase))];
  }, [tasks]);

  const selectedTask = useMemo(
    () => tasks.find((t) => t.id === selectedId) ?? null,
    [tasks, selectedId]
  );

  return (
    <div className="plan-layout">
      <section className="panel plan-main">
        <div className="panel-header">
          <div>
            <span className="eyebrow">EXECUTION PLAN</span>
            <h2>Delivery map</h2>
          </div>
          {goalStatus === "awaiting_approval" && (
            <button className="primary" onClick={onApprovePlan}>
              Approve plan
            </button>
          )}
        </div>

        {goalStatus === "awaiting_approval" && (
          <div className="plan-banner" role="alert">
            <span aria-hidden="true">!</span>
            <div>
              <b>Plan is ready for review</b>
              <p>Review the tasks below and approve the plan to begin execution.</p>
            </div>
          </div>
        )}

        {tasks.length === 0 ? (
          <EmptyState
            title="No plan generated yet"
            message="Codex is still discovering or planning."
            icon="⌘"
          />
        ) : (
          <div className="plan-tree">
            {phases.map((phase, index) => {
              const phaseTasks = tasks.filter((t) => t.phase === phase);
              const completed = phaseTasks.filter((t) => t.status === "completed").length;
              return (
                <div className="phase" key={phase}>
                  <div className="phase-title">
                    <span className="phase-number">{index + 1}</span>
                    <b>{phase}</b>
                    <small>
                      {completed}/{phaseTasks.length} complete
                    </small>
                  </div>
                  <div className="phase-tasks">
                    {phaseTasks.map((task) => (
                      <button
                        key={task.id}
                        className={
                          selectedId === task.id ? "plan-task selected" : "plan-task"
                        }
                        onClick={() => setSelectedId(task.id)}
                        aria-label={`View details for ${task.title}`}
                      >
                        <i className={`status-dot status-${task.status}`} aria-hidden="true" />
                        <span className="plan-task-title">{task.title}</span>
                        <div className="plan-task-status">
                          <StatusBadge kind="task" status={task.status} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {selectedId && (
        <TaskDrawer
          task={selectedTask}
          onClose={() => setSelectedId(null)}
          onRetry={onRetryTask}
        />
      )}
    </div>
  );
}
