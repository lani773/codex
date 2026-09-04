import type { Activity } from "../types/codex";

type Props = {
  count: number;
  unread: number;
  onClick: () => void;
};

export function NotificationBell({ count, unread, onClick }: Props) {
  return (
    <button
      className="notif-bell"
      onClick={onClick}
      aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ""}`}
    >
      <span aria-hidden="true">◷</span>
      {unread > 0 && (
        <span className="notif-badge" aria-hidden="true">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
      {count === 0 && <span className="sr-only">No notifications</span>}
    </button>
  );
}

// ─── Activity feed panel ───────────────────────────────────────────────────────

const KIND_ICONS: Record<Activity["kind"], string> = {
  success: "✓",
  working: "·",
  warning: "!",
  error: "⚠",
};

export function ActivityFeed({
  activity,
  limit = 20,
}: {
  activity: Activity[];
  limit?: number;
}) {
  const shown = activity.slice(0, limit);
  return (
    <ol className="activity-list" aria-label="Activity feed">
      {shown.map((item) => (
        <li key={item.id} className={`activity-item activity-${item.kind}`}>
          <span
            className={`activity-icon ${item.kind}`}
            aria-label={item.kind}
          >
            {KIND_ICONS[item.kind]}
          </span>
          <div>
            <b>{item.text}</b>
            <time dateTime={item.time}>{item.time}</time>
          </div>
        </li>
      ))}
      {activity.length === 0 && (
        <li className="activity-empty">No activity yet.</li>
      )}
    </ol>
  );
}
