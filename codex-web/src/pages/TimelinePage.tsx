import { useState } from "react";
import { EmptyState } from "../components/EmptyState";
import type { TimelineEvent } from "../types/codex";

const FILTERS: Array<TimelineEvent["type"] | "all"> = [
  "all",
  "goal",
  "plan",
  "task",
  "approval",
  "test",
  "error",
];

type Props = {
  events: TimelineEvent[];
};

export function TimelinePage({ events }: Props) {
  const [filter, setFilter] = useState<TimelineEvent["type"] | "all">("all");

  const shown =
    filter === "all" ? events : events.filter((e) => e.type === filter);

  return (
    <div className="timeline-layout">
      <section className="panel timeline-panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">GOAL TIMELINE</span>
            <h2>Execution history</h2>
          </div>
          <span className="count-pill">{events.length} events</span>
        </div>

        <div className="filter-row" role="tablist" aria-label="Timeline filters">
          {FILTERS.map((item) => (
            <button
              key={item}
              role="tab"
              aria-selected={filter === item}
              onClick={() => setFilter(item)}
              className={filter === item ? "filter active" : "filter"}
            >
              {item}
            </button>
          ))}
        </div>

        {events.length === 0 ? (
          <EmptyState
            title="No events yet"
            message="The timeline will populate as Codex executes tasks."
            icon="◷"
          />
        ) : shown.length === 0 ? (
          <EmptyState
            title="No events found"
            message={`No events match the "${filter}" filter.`}
            icon="◷"
            action={{ label: "Clear filter", onClick: () => setFilter("all") }}
          />
        ) : (
          <ol className="timeline" aria-label="Timeline">
            {shown.map((event) => (
              <li key={event.id} className={`timeline-item type-${event.type}`}>
                <time dateTime={event.time}>{event.time}</time>
                <span
                  className={`timeline-dot dot-${event.type}`}
                  aria-hidden="true"
                />
                <div className="timeline-content">
                  <b>{event.title}</b>
                  <p>{event.description}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <aside className="panel timeline-aside">
        <span className="eyebrow">WHY THIS EXISTS</span>
        <h2>Clear execution, not hidden reasoning</h2>
        <p>
          The timeline records meaningful state changes: plans, task activity,
          errors, approvals, and verification results. It explicitly excludes the
          opaque reasoning steps of the underlying model.
        </p>
      </aside>
    </div>
  );
}
