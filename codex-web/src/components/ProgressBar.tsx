type Props = {
  value: number;   // 0–100
  label?: string;
  detail?: string;
  animated?: boolean;
  size?: "sm" | "md" | "lg";
};

export function ProgressBar({ value, label, detail, animated = true, size = "md" }: Props) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className={`progress-bar-wrapper size-${size}`}>
      {(label || detail) && (
        <div className="progress-bar-header">
          {label && <span className="progress-bar-label">{label}</span>}
          {detail && <span className="progress-bar-detail">{detail}</span>}
        </div>
      )}
      <div
        className="progress-bar-track"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Progress"}
      >
        <div
          className={`progress-bar-fill${animated ? " animated" : ""}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
