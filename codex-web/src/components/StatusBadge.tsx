import type { GoalStatus, TaskStatus } from "../types/codex";

const TASK_LABELS: Record<TaskStatus, string> = {
  pending: "Pending",
  ready: "Ready",
  running: "Running",
  completed: "Completed",
  failed: "Failed",
  blocked: "Blocked",
};

const GOAL_LABELS: Record<GoalStatus, string> = {
  draft: "Draft",
  discovering: "Discovering",
  planning: "Planning",
  awaiting_approval: "Awaiting approval",
  executing: "Executing",
  paused: "Paused",
  completed: "Completed",
  failed: "Failed",
};

type TaskBadgeProps = { kind: "task"; status: TaskStatus };
type GoalBadgeProps = { kind: "goal"; status: GoalStatus };
type Props = TaskBadgeProps | GoalBadgeProps;

export function StatusBadge(props: Props) {
  const label =
    props.kind === "task"
      ? TASK_LABELS[props.status]
      : GOAL_LABELS[props.status];
  const cls =
    props.kind === "task"
      ? `status-chip ${props.status}`
      : `status-chip goal-status-${props.status.replace("_", "-")}`;
  return <span className={cls}>{label}</span>;
}
