import { useState } from "react";
import { useGoalBuilder } from "../hooks/useGoalBuilder";
import { QuestionCard } from "../components/QuestionCard";

const SUGGESTIONS = [
  "Build a smart home device-control app",
  "Add secure team authentication",
  "Create a customer support dashboard",
  "Build an offline-first note-taking tool",
];

const STEPS: Array<{ phase: string; label: string }> = [
  { phase: "describing", label: "Describe" },
  { phase: "discovering", label: "Discover" },
  { phase: "reviewing", label: "Review" },
  { phase: "approved", label: "Approved" },
];

type Props = {
  onCreate: (title: string, objective: string) => Promise<void>;
};

export function GoalBuilderPage({ onCreate }: Props) {
  const builder = useGoalBuilder();
  const { state } = builder;
  const phaseIndex = STEPS.findIndex((s) => s.phase === state.phase);

  return (
    <div className="builder-layout">
      <section className="panel builder-main">
        <BuilderStepper currentIndex={phaseIndex} />

        {state.phase === "describing" && (
          <DescribePhase builder={builder} onCreate={onCreate} />
        )}
        {state.phase === "discovering" && (
          <DiscoverPhase builder={builder} />
        )}
        {state.phase === "reviewing" && (
          <ReviewPhase builder={builder} onCreate={onCreate} />
        )}
        {state.phase === "approved" && (
          <ApprovedPhase />
        )}
      </section>

      <aside className="panel builder-process">
        <span className="eyebrow">WHAT HAPPENS NEXT</span>
        <ol>
          <li>
            <span>1</span>
            <div>
              <b>Understand the outcome</b>
              <p>Codex finds the objective, actors, and main capabilities.</p>
            </div>
          </li>
          <li>
            <span>2</span>
            <div>
              <b>Clarify only what matters</b>
              <p>Structured questions replace long back-and-forth messages.</p>
            </div>
          </li>
          <li>
            <span>3</span>
            <div>
              <b>Review requirements</b>
              <p>Edit, add, or remove scope before the plan is generated.</p>
            </div>
          </li>
          <li>
            <span>4</span>
            <div>
              <b>Execute with evidence</b>
              <p>Tasks, files, tests, errors, and verification stay connected to this goal.</p>
            </div>
          </li>
        </ol>
      </aside>
    </div>
  );
}

// ─── Stepper ──────────────────────────────────────────────────────────────────

function BuilderStepper({ currentIndex }: { currentIndex: number }) {
  return (
    <div className="builder-stepper" aria-label="Goal creation steps">
      {STEPS.map((step, i) => (
        <div
          key={step.phase}
          className={
            i < currentIndex
              ? "stepper-step done"
              : i === currentIndex
              ? "stepper-step active"
              : "stepper-step"
          }
          aria-current={i === currentIndex ? "step" : undefined}
        >
          <span className="stepper-dot">{i < currentIndex ? "✓" : i + 1}</span>
          <span className="stepper-label">{step.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Phase: Describe ──────────────────────────────────────────────────────────

function DescribePhase({
  builder,
  onCreate,
}: {
  builder: ReturnType<typeof useGoalBuilder>;
  onCreate: Props["onCreate"];
}) {
  const { state, setIdea, beginDiscovering, setError } = builder;
  const [busy, setBusy] = useState(false);

  const proceed = async () => {
    const objective = state.idea.trim();
    if (!objective) {
      setError("Describe what you want Codex to build first.");
      return;
    }
    const title =
      objective.length > 54 ? `${objective.slice(0, 51).trimEnd()}…` : objective;

    setBusy(true);
    try {
      // In mock mode we skip the real API and go straight to reviewing
      await onCreate(title, objective);
      beginDiscovering(title, objective);
    } catch {
      setError("Codex could not create this goal. Check the backend connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <span className="eyebrow">START A GOAL</span>
      <h2>Develop your idea with Codex.</h2>
      <p>
        Describe the outcome in your own words. Codex will turn it into
        requirements, ask focused questions, then prepare a plan for your
        approval.
      </p>
      <textarea
        className="idea-input"
        value={state.idea}
        onChange={(e) => setIdea(e.target.value)}
        placeholder="I want to build a local-first smart home app where people can securely control their devices…"
        autoFocus
        aria-label="Describe your goal"
        rows={6}
      />
      <div className="suggestions">
        <span>Try a starting point</span>
        <div>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setIdea(s)}
              aria-label={`Use suggestion: ${s}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
      <button
        className="primary builder-submit"
        disabled={busy || !state.idea.trim()}
        onClick={() => void proceed()}
      >
        {busy ? "Creating goal…" : "Develop idea →"}
      </button>
    </>
  );
}

// ─── Phase: Discover ──────────────────────────────────────────────────────────

function DiscoverPhase({ builder }: { builder: ReturnType<typeof useGoalBuilder> }) {
  const { state, answerQuestion, beginReviewing } = builder;

  const handleAnswer = (answer: unknown) => {
    if (state.currentQuestion) {
      answerQuestion(state.currentQuestion.id, answer);
    }
  };

  const skipToReview = () => {
    beginReviewing(
      [{ id: crypto.randomUUID(), text: `Objective: ${state.objective}` }],
      [{ id: crypto.randomUUID(), text: "All success criteria met" }],
    );
  };

  return (
    <>
      <span className="eyebrow">DISCOVERY</span>
      <h2>A few focused questions.</h2>
      <p>
        These questions shape the requirements and execution plan. You can skip
        any of them.
      </p>

      {state.currentQuestion ? (
        <QuestionCard
          question={state.currentQuestion}
          onSubmit={handleAnswer}
        />
      ) : (
        <div className="discovery-waiting">
          <span className="spinner" aria-hidden="true" />
          <p>Codex is preparing questions…</p>
          <button className="text-button" onClick={skipToReview}>
            Skip to review →
          </button>
        </div>
      )}

      <div className="discovery-answers">
        {state.answeredQuestions.length > 0 && (
          <>
            <span className="eyebrow">ANSWERED</span>
            <ul>
              {state.answeredQuestions.map((a, i) => (
                <li key={i}>
                  <code>{String(a.questionId)}</code>:{" "}
                  <b>{JSON.stringify(a.answer)}</b>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  );
}

// ─── Phase: Review ────────────────────────────────────────────────────────────

function ReviewPhase({
  builder,
  onCreate,
}: {
  builder: ReturnType<typeof useGoalBuilder>;
  onCreate: Props["onCreate"];
}) {
  const {
    state,
    approve,
    addRequirement,
    removeRequirement,
    editRequirement,
    addCriterion,
    removeCriterion,
    editCriterion,
    setError,
  } = builder;

  const [newReq, setNewReq] = useState("");
  const [newCrit, setNewCrit] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleApprove = async () => {
    approve();
    try {
      await onCreate(state.title, state.objective);
    } catch {
      setError("Goal creation failed. Please try again.");
    }
  };

  return (
    <>
      <span className="eyebrow">REVIEW &amp; APPROVE</span>
      <h2>Confirm the scope before execution begins.</h2>
      <p>
        These requirements and success criteria were derived from your idea and
        your answers. Edit, add, or remove them before approving.
      </p>

      <section className="review-section">
        <div className="panel-header">
          <div>
            <span className="eyebrow">REQUIREMENTS</span>
            <h3>What we are building</h3>
          </div>
        </div>
        <ul className="editable-review-list">
          {state.draftRequirements.map((req) => (
            <li key={req.id}>
              {editingId === req.id ? (
                <input
                  autoFocus
                  defaultValue={req.text}
                  onBlur={(e) => {
                    editRequirement(req.id, e.target.value);
                    setEditingId(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      editRequirement(req.id, e.currentTarget.value);
                      setEditingId(null);
                    }
                    if (e.key === "Escape") setEditingId(null);
                  }}
                />
              ) : (
                <span>{req.text}</span>
              )}
              <div className="review-item-actions">
                <button
                  aria-label={`Edit ${req.text}`}
                  onClick={() => setEditingId(req.id)}
                >
                  ✎
                </button>
                <button
                  aria-label={`Remove ${req.text}`}
                  onClick={() => removeRequirement(req.id)}
                  className="danger-text"
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
        <div className="inline-form">
          <input
            value={newReq}
            onChange={(e) => setNewReq(e.target.value)}
            placeholder="Add a requirement"
            onKeyDown={(e) => {
              if (e.key === "Enter" && newReq.trim()) {
                addRequirement(newReq.trim());
                setNewReq("");
              }
            }}
            aria-label="Add requirement"
          />
          <button
            onClick={() => {
              if (newReq.trim()) {
                addRequirement(newReq.trim());
                setNewReq("");
              }
            }}
          >
            Add
          </button>
        </div>
      </section>

      <section className="review-section">
        <div className="panel-header">
          <div>
            <span className="eyebrow">SUCCESS CRITERIA</span>
            <h3>How we know it is done</h3>
          </div>
        </div>
        <ul className="editable-review-list">
          {state.draftSuccessCriteria.map((crit) => (
            <li key={crit.id}>
              <span>{crit.text}</span>
              <div className="review-item-actions">
                <button
                  aria-label={`Remove criterion ${crit.text}`}
                  onClick={() => removeCriterion(crit.id)}
                  className="danger-text"
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
        <div className="inline-form">
          <input
            value={newCrit}
            onChange={(e) => setNewCrit(e.target.value)}
            placeholder="Add a success criterion"
            onKeyDown={(e) => {
              if (e.key === "Enter" && newCrit.trim()) {
                addCriterion(newCrit.trim());
                setNewCrit("");
              }
            }}
            aria-label="Add success criterion"
          />
          <button
            onClick={() => {
              if (newCrit.trim()) {
                addCriterion(newCrit.trim());
                setNewCrit("");
              }
            }}
          >
            Add
          </button>
        </div>
      </section>

      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}

      <div className="review-actions">
        <button className="primary" onClick={() => void handleApprove()} disabled={state.submitting}>
          {state.submitting ? "Creating goal…" : "Approve and start →"}
        </button>
      </div>
    </>
  );
}

// ─── Phase: Approved ──────────────────────────────────────────────────────────

function ApprovedPhase() {
  return (
    <div className="approved-state">
      <span className="approved-icon" aria-hidden="true">✓</span>
      <h2>Goal approved.</h2>
      <p>
        Codex is initializing your workspace. You will be redirected to the
        execution view shortly.
      </p>
      <span className="spinner" aria-hidden="true" />
    </div>
  );
}
