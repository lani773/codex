import { useMemo, useState } from "react";
import { StatusBadge } from "../components/StatusBadge";
import { ProgressBar } from "../components/ProgressBar";
import { EmptyState } from "../components/EmptyState";
import { TaskDrawer } from "../components/TaskDrawer";
import type { Task, TaskStatus } from "../types/codex";

const STATUSES: Array<TaskStatus | "all"> = [
  "all",
  "running",
  "ready",
  "pending",
  "completed",
  "failed",
  "blocked",
];

type Props = {
  tasks: Task[];
  onRetryTask?: (taskId: string) => void;
};

export function TasksPage({ tasks, onRetryTask }: Props) {
  const [filter, setFilter] = useState<TaskStatus | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const visibleTasks = useMemo(() => {
    if (filter === "all") return tasks;
    return tasks.filter((task) => task.status === filter);
  }, [filter, tasks]);

  const selectedTask = useMemo(
    () => tasks.find((t) => t.id === selectedId) ?? null,
    [tasks, selectedId]
  );

  return (
    <div className="tasks-layout">
      <section className="panel tasks-main">
        <div className="panel-header">
          <div>
            <span className="eyebrow">TASKS</span>
            <h2>Execution queue</h2>
          </div>
          <span className="count-pill">{tasks.length} tasks</span>
        </div>

        <div className="filter-row" role="tablist" aria-label="Task filters">
          {STATUSES.map((status) => (
            <button
              key={status}
              role="tab"
              aria-selected={filter === status}
              className={filter === status ? "filter active" : "filter"}
              onClick={() => setFilter(status)}
            >
              {status}
            </button>
          ))}
        </div>

        {visibleTasks.length === 0 ? (
          <EmptyState
            title="No tasks found"
            message={`There are no tasks matching the "${filter}" filter.`}
            icon="✓"
            action={
              filter !== "all"
                ? { label: "Clear filter", onClick: () => setFilter("all") }
                : undefined
            }
          />
        ) : (
          <div className="task-table" role="grid">
            <div className="table-head" role="row">
              <span role="columnheader">Task</span>
              <span role="columnheader">Status</span>
              <span role="columnheader">Progress</span>
            </div>
            {visibleTasks.map((task) => (
              <button
                key={task.id}
                role="row"
                className="table-row"
                onClick={() => setSelectedId(task.id)}
                aria-label={`View details for ${task.title}`}
              >
                <div role="gridcell" className="task-cell-main">
                  <b>{task.title}</b>
                  <small>
                    {task.id} · {task.phase}
                  </small>
                </div>
                <div role="gridcell">
                  <StatusBadge kind="task" status={task.status} />
                </div>
                <div role="gridcell" className="table-progress">
                  <ProgressBar
                    value={task.progress}
                    label={`${task.progress}%`}
                    size="sm"
                  />
                </div>
              </button>
            ))}
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
