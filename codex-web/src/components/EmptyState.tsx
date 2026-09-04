type Props = {
  title: string;
  message?: string;
  icon?: string;
  action?: { label: string; onClick: () => void };
};

export function EmptyState({ title, message, icon = "◌", action }: Props) {
  return (
    <div className="empty-state" role="status">
      <span className="empty-state-icon" aria-hidden="true">{icon}</span>
      <b>{title}</b>
      {message && <p>{message}</p>}
      {action && (
        <button className="primary" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}

export function LoadingState({ message = "Loading…" }: { message?: string }) {
  return (
    <div className="empty-state loading-state" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <b>{message}</b>
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="empty-state error-state" role="alert">
      <span className="empty-state-icon" aria-hidden="true">⚠</span>
      <b>{title}</b>
      {message && <p>{message}</p>}
      {onRetry && (
        <button className="primary" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}
