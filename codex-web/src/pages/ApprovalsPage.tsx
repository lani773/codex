import { useMemo, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import type { Approval, ApprovalDecision } from "../types/codex";

type Props = {
  approvals: Approval[];
  onDecide: (approvalId: string, decision: ApprovalDecision) => void;
};

const RISK_DESCRIPTIONS = {
  low: "Safe to approve. Only affects local workspace state.",
  medium: "Moderate risk. Requires network access or modifies system state.",
  high: "High risk. Can execute arbitrary code, modify credentials, or incur costs.",
};

export function ApprovalsPage({ approvals, onDecide }: Props) {
  const pending = approvals.filter((a) => a.status === "pending");
  const [selectedId, setSelectedId] = useState<string | null>(
    pending[0]?.id ?? approvals[0]?.id ?? null
  );

  const selected = useMemo(
    () => approvals.find((a) => a.id === selectedId) ?? approvals[0] ?? null,
    [approvals, selectedId]
  );

  // For the confirmation dialog
  const [confirming, setConfirming] = useState(false);

  const handleDecision = (decision: ApprovalDecision) => {
    if (decision === "approved" && selected?.risk === "high" && !confirming) {
      setConfirming(true);
      return;
    }
    onDecide(selected.id, decision);
    setConfirming(false);
  };

  return (
    <div className="approvals-layout">
      <section className="panel approval-list-panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">APPROVAL CENTER</span>
            <h2>{pending.length} decisions waiting</h2>
          </div>
          <span className="count-pill">Explicit consent</span>
        </div>

        <p className="approval-intro">
          Codex never executes sensitive actions until you make a recorded decision.
        </p>

        {approvals.length === 0 ? (
          <EmptyState
            title="No approvals"
            message="There are no security or execution approvals pending."
            icon="!"
          />
        ) : (
          <div className="approval-items" role="list">
            {approvals.map((approval) => (
              <button
                key={approval.id}
                role="listitem"
                onClick={() => {
                  setSelectedId(approval.id);
                  setConfirming(false);
                }}
                className={
                  approval.id === selected?.id
                    ? "approval-row selected"
                    : "approval-row"
                }
                aria-selected={approval.id === selected?.id}
              >
                <span className={`risk-badge ${approval.risk}`}>
                  {approval.risk}
                </span>
                <div className="approval-row-main">
                  <b>{approval.title}</b>
                  <small>
                    {approval.requestedAt} · {approval.status.replace("_", " ")}
                  </small>
                </div>
                <span className="approval-row-indicator">
                  {approval.status === "pending"
                    ? "›"
                    : approval.status === "approved"
                    ? "✓"
                    : "×"}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      {selected && (
        <section className="panel approval-detail">
          <span className="eyebrow">APPROVAL REQUEST</span>
          <h2>{selected.title}</h2>

          <div className="approval-status-row">
            <span
              className={`status-chip ${
                selected.status === "pending" ? "running" : selected.status
              }`}
            >
              {selected.status}
            </span>
            <span className={`risk-pill risk-pill-${selected.risk}`}>
              {selected.risk} risk
            </span>
          </div>

          <p className="approval-desc">{selected.description}</p>
          <p className="approval-risk-desc">{RISK_DESCRIPTIONS[selected.risk]}</p>

          <div className="approval-scope">
            <span className="approval-scope-label">Codex wants to</span>
            <ul className="approval-items-list">
              {selected.items.map((item, i) => (
                <li key={i} className="approval-item-line">
                  <input
                    type="checkbox"
                    defaultChecked={item.selected}
                    disabled
                    aria-label={item.label}
                  />
                  <div>
                    <b>{item.label}</b>
                    <small>{item.detail}</small>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {selected.status === "pending" && (
            <div className="approval-actions-container">
              {confirming ? (
                <div className="approval-confirm" role="alert">
                  <p><strong>Are you sure?</strong> This is a high-risk action.</p>
                  <div className="approval-actions">
                    <button onClick={() => setConfirming(false)}>Cancel</button>
                    <button
                      className="primary danger-bg"
                      onClick={() => handleDecision("approved")}
                    >
                      Yes, approve
                    </button>
                  </div>
                </div>
              ) : (
                <div className="approval-actions">
                  <button onClick={() => handleDecision("rejected")}>
                    Reject
                  </button>
                  <button
                    className="primary"
                    onClick={() => handleDecision("approved")}
                  >
                    Approve selected
                  </button>
                </div>
              )}
            </div>
          )}

          <p className="approval-note">
            This decision is sent to the backend. It does not override Codex sandbox
            or security policies.
          </p>
        </section>
      )}
    </div>
  );
}
