import { ProgressBar } from "../components/ProgressBar";
import { EmptyState } from "../components/EmptyState";
import type { TestResult } from "../types/codex";

type Props = {
  results: TestResult[];
};

export function TestsPage({ results }: Props) {
  const groups = [...new Set(results.map((r) => r.group))];
  const passed = results.filter((r) => r.status === "passed").length;
  const failed = results.filter((r) => r.status === "failed").length;

  const percentage =
    results.length > 0 ? Math.round((passed / results.length) * 100) : 0;

  return (
    <div className="tests-layout">
      <section className="panel test-summary">
        <span className="eyebrow">VERIFICATION</span>
        <h2>
          {passed}/{results.length} checks passing
        </h2>

        {results.length > 0 && (
          <div className="test-progress-overview">
            <ProgressBar value={percentage} size="lg" animated={false} />
            {failed > 0 && (
              <span className="test-failed-note danger-text">
                {failed} check{failed === 1 ? "" : "s"} failed
              </span>
            )}
          </div>
        )}

        <p>
          Only backend-reported checks can verify that this goal is complete.
          Codex runs these automatically during the execution and verification
          phases.
        </p>
      </section>

      <section className="panel test-list-panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">TEST RESULTS</span>
            <h2>Current run</h2>
          </div>
        </div>

        {results.length === 0 ? (
          <EmptyState
            title="No tests run yet"
            message="Test results will appear here once Codex reaches the verification phase."
            icon="⚗"
          />
        ) : (
          <div className="test-groups">
            {groups.map((group) => {
              const groupResults = results.filter((r) => r.group === group);
              return (
                <div className="test-group" key={group}>
                  <h3>{group}</h3>
                  <div className="test-items" role="list">
                    {groupResults.map((result) => (
                      <TestRow key={result.id} result={result} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function TestRow({ result }: { result: TestResult }) {
  return (
    <article className="test-row" role="listitem">
      <span
        className={`test-icon status-${result.status}`}
        aria-label={result.status}
      >
        {result.status === "passed"
          ? "✓"
          : result.status === "failed"
          ? "✕"
          : "·"}
      </span>
      <div className="test-row-main">
        <b>{result.name}</b>
        <small>
          {result.status === "running"
            ? "Running…"
            : result.status === "pending"
            ? "Pending"
            : result.duration}
        </small>
        {result.details && result.status === "failed" && (
          <pre className="test-error-details">{result.details}</pre>
        )}
      </div>
    </article>
  );
}
