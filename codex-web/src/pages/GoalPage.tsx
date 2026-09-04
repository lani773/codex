import { useState, useRef } from "react";
import { StatusBadge } from "../components/StatusBadge";
import { ProgressBar } from "../components/ProgressBar";
import { EmptyState } from "../components/EmptyState";
import type { Goal } from "../types/codex";

type Props = {
  goal: Goal;
  onToggleRequirement: (id: string) => void;
  onAddRequirement: (text: string) => void;
  onDeleteRequirement: (id: string) => void;
  onToggleCriterion: (id: string) => void;
  onAddCriterion: (text: string) => void;
  onDeleteCriterion: (id: string) => void;
  onUpdateObjective: (objective: string) => void;
};

export function GoalPage({
  goal,
  onToggleRequirement,
  onAddRequirement,
  onDeleteRequirement,
  onToggleCriterion,
  onAddCriterion,
  onDeleteCriterion,
  onUpdateObjective,
}: Props) {
  return (
    <div className="page-grid goal-page">
      <GoalHero goal={goal} onUpdateObjective={onUpdateObjective} />

      <RequirementsPanel
        goal={goal}
        onToggle={onToggleRequirement}
        onAdd={onAddRequirement}
        onDelete={onDeleteRequirement}
      />

      <CriteriaPanel
        goal={goal}
        onToggle={onToggleCriterion}
        onAdd={onAddCriterion}
        onDelete={onDeleteCriterion}
      />

      <GoalSummaryCard goal={goal} />
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function GoalHero({
  goal,
  onUpdateObjective,
}: {
  goal: Goal;
  onUpdateObjective: (objective: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(goal.objective);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const startEdit = () => {
    setDraft(goal.objective);
    setEditing(true);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const save = () => {
    if (draft.trim() && draft.trim() !== goal.objective) {
      onUpdateObjective(draft.trim());
    }
    setEditing(false);
  };

  const cancel = () => {
    setDraft(goal.objective);
    setEditing(false);
  };

  return (
    <section className="panel goal-hero">
      <div className="goal-hero-header">
        <span className="eyebrow">GOAL</span>
        <StatusBadge kind="goal" status={goal.status} />
      </div>
      <h2>{goal.title}</h2>

      {editing ? (
        <div className="objective-editor">
          <textarea
            ref={textareaRef}
            className="objective-textarea"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            aria-label="Edit objective"
          />
          <div className="objective-actions">
            <button className="primary" onClick={save}>Save</button>
            <button onClick={cancel}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="objective-display">
          <p className="objective">{goal.objective}</p>
          <button className="text-button edit-objective" onClick={startEdit} aria-label="Edit objective">
            Edit ✎
          </button>
        </div>
      )}

      <ProgressBar
        value={goal.progress}
        label="Goal progress"
        detail={`${goal.progress}%`}
        size="lg"
        animated
      />
      <small className="muted progress-note">
        Codex calculates this only from authoritative task state.
      </small>
    </section>
  );
}

// ─── Requirements ─────────────────────────────────────────────────────────────

function RequirementsPanel({
  goal,
  onToggle,
  onAdd,
  onDelete,
}: {
  goal: Goal;
  onToggle: (id: string) => void;
  onAdd: (text: string) => void;
  onDelete: (id: string) => void;
}) {
  const [newText, setNewText] = useState("");
  const checked = goal.requirements.filter((r) => r.checked).length;

  const add = () => {
    if (newText.trim()) {
      onAdd(newText.trim());
      setNewText("");
    }
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <span className="eyebrow">REQUIREMENTS</span>
          <h2>What we are building</h2>
        </div>
        <span className="count-pill">{checked}/{goal.requirements.length}</span>
      </div>

      {goal.requirements.length === 0 ? (
        <EmptyState
          title="No requirements yet"
          message="Add requirements to define the scope of this goal."
          icon="▱"
        />
      ) : (
        <div className="editable-list" role="list">
          {goal.requirements.map((req) => (
            <label key={req.id} className="editable-item" role="listitem">
              <input
                type="checkbox"
                checked={req.checked}
                onChange={() => onToggle(req.id)}
                aria-label={req.text}
              />
              <span>{req.text}</span>
              <button
                className="delete-btn"
                aria-label={`Remove requirement: ${req.text}`}
                onClick={() => onDelete(req.id)}
              >
                ✕
              </button>
            </label>
          ))}
        </div>
      )}

      <div className="inline-form">
        <input
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add a requirement"
          aria-label="New requirement"
        />
        <button onClick={add}>Add</button>
      </div>
    </section>
  );
}

// ─── Success Criteria ─────────────────────────────────────────────────────────

function CriteriaPanel({
  goal,
  onToggle,
  onAdd,
  onDelete,
}: {
  goal: Goal;
  onToggle: (id: string) => void;
  onAdd: (text: string) => void;
  onDelete: (id: string) => void;
}) {
  const [newText, setNewText] = useState("");
  const checkedCount = goal.successCriteria.filter((c) => c.checked).length;

  const add = () => {
    if (newText.trim()) {
      onAdd(newText.trim());
      setNewText("");
    }
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <span className="eyebrow">SUCCESS CRITERIA</span>
          <h2>How we know it is done</h2>
        </div>
        <span className="count-pill">
          {checkedCount}/{goal.successCriteria.length}
        </span>
      </div>

      {goal.successCriteria.length === 0 ? (
        <EmptyState
          title="No success criteria yet"
          message="Add criteria to define when this goal is complete."
          icon="⚗"
        />
      ) : (
        <div className="criteria-list" role="list">
          {goal.successCriteria.map((crit) => (
            <div key={crit.id} className="criterion-row" role="listitem">
              <button
                className={`criterion${crit.checked ? " done" : ""}`}
                onClick={() => onToggle(crit.id)}
                aria-pressed={crit.checked}
                aria-label={`Mark criterion ${crit.checked ? "incomplete" : "complete"}: ${crit.text}`}
              >
                {crit.checked ? "✓" : ""}
              </button>
              <span className={crit.checked ? "criterion-text done" : "criterion-text"}>
                {crit.text}
              </span>
              <button
                className="delete-btn"
                aria-label={`Remove criterion: ${crit.text}`}
                onClick={() => onDelete(crit.id)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="inline-form">
        <input
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add a success criterion"
          aria-label="New success criterion"
        />
        <button onClick={add}>Add</button>
      </div>
    </section>
  );
}

// ─── Summary card ─────────────────────────────────────────────────────────────

function GoalSummaryCard({ goal }: { goal: Goal }) {
  return (
    <section className="panel summary-card">
      <span className="eyebrow">SCOPE SIGNAL</span>
      <h2>Goal health</h2>
      <dl>
        <div>
          <dt>Status</dt>
          <dd>
            <StatusBadge kind="goal" status={goal.status} />
          </dd>
        </div>
        <div>
          <dt>Requirements</dt>
          <dd>{goal.requirements.length}</dd>
        </div>
        <div>
          <dt>Success criteria</dt>
          <dd>
            {goal.successCriteria.filter((c) => c.checked).length}/
            {goal.successCriteria.length}
          </dd>
        </div>
        <div>
          <dt>Progress</dt>
          <dd>{goal.progress}%</dd>
        </div>
      </dl>
      <p>Changes to requirements are submitted to Codex for planning impact analysis.</p>
    </section>
  );
}
