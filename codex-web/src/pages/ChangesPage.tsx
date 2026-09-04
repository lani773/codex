import { useState } from "react";
import { EmptyState } from "../components/EmptyState";
import type { Change } from "../types/codex";

type Props = {
  changes: Change[];
  onApproveAll?: () => void;
  onApproveChange?: (changeId: string) => void;
  onRejectChange?: (changeId: string) => void;
};

export function ChangesPage({
  changes,
  onApproveAll,
  onApproveChange,
  onRejectChange,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(
    changes[0]?.id ?? null
  );

  const selected = changes.find((c) => c.id === selectedId) ?? null;

  const totals = changes.reduce(
    (acc, change) => ({
      additions: acc.additions + change.additions,
      deletions: acc.deletions + change.deletions,
    }),
    { additions: 0, deletions: 0 }
  );

  return (
    <div className="changes-layout">
      <section className="panel change-list-panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">CHANGES</span>
            <h2>{changes.length} files changed</h2>
          </div>
          {onApproveAll && changes.length > 0 && (
            <button className="primary" onClick={onApproveAll}>
              Approve all
            </button>
          )}
        </div>

        {changes.length === 0 ? (
          <EmptyState
            title="No changes"
            message="There are no pending file modifications."
            icon="↗"
          />
        ) : (
          <>
            <div className="change-totals">
              <span>
                <b>+{totals.additions}</b> additions
              </span>
              <span>
                <b>−{totals.deletions}</b> deletions
              </span>
            </div>

            <div className="change-list" role="list">
              {changes.map((change) => (
                <button
                  key={change.id}
                  role="listitem"
                  className={
                    selectedId === change.id
                      ? "change-row selected"
                      : "change-row"
                  }
                  onClick={() => setSelectedId(change.id)}
                  aria-selected={selectedId === change.id}
                >
                  <span className={`change-status ${change.status}`} aria-hidden="true">
                    {change.status === "created" ? "A" : change.status === "deleted" ? "D" : "M"}
                  </span>
                  <div className="change-row-info">
                    <b>{change.path}</b>
                    <small>{change.summary}</small>
                  </div>
                  <span className="change-row-stats">
                    <i>+{change.additions}</i> <em>−{change.deletions}</em>
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="panel diff-view">
        <div className="code-header">
          <div>
            <span className="eyebrow">{selected?.status.toUpperCase() ?? "DIFF"}</span>
            <b>{selected?.path ?? "Select a change"}</b>
          </div>
        </div>

        {!selected ? (
          <EmptyState
            title="Select a change"
            message="Choose a file to review its diff."
            icon="↗"
          />
        ) : (
          <>
            <pre className="diff line-numbers-pre">
              <code>
                {selected.diff.map((line, index) => {
                  const type = line.startsWith("+")
                    ? "add"
                    : line.startsWith("-")
                    ? "remove"
                    : "";
                  return (
                    <div key={`${line}-${index}`} className={`code-line ${type}`}>
                      <span className="line-number" aria-hidden="true">
                        {index + 1}
                      </span>
                      <span className="line-content">{line}</span>
                    </div>
                  );
                })}
              </code>
            </pre>

            <div className="diff-actions">
              {onRejectChange && (
                <button onClick={() => onRejectChange(selected.id)}>
                  Reject change
                </button>
              )}
              {onApproveChange && (
                <button className="primary" onClick={() => onApproveChange(selected.id)}>
                  Approve change
                </button>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
