import { useState, useRef, useEffect } from "react";
import { EmptyState } from "../components/EmptyState";
import type { TerminalEntry } from "../types/codex";

type Props = {
  entries: TerminalEntry[];
};

export function TerminalPage({ entries }: Props) {
  const [query, setQuery] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const shown = query
    ? entries.filter((e) => e.content.toLowerCase().includes(query.toLowerCase()))
    : entries;

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [shown, autoScroll]);

  // If user scrolls up, disable auto-scroll
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 30;
    setAutoScroll(isAtBottom);
  };

  const lastCommand = [...entries].reverse().find((e) => e.type === "command");
  const isRunning =
    lastCommand && entries[entries.length - 1]?.type !== "success" && entries[entries.length - 1]?.type !== "error";

  return (
    <div className="terminal-layout">
      <section className="terminal-window">
        <div className="terminal-bar">
          <div className="terminal-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <span>Codex output · read only</span>
          <button
            aria-label="Scroll to bottom"
            title="Auto-scroll"
            className={autoScroll ? "terminal-auto-scroll active" : "terminal-auto-scroll"}
            onClick={() => {
              setAutoScroll(true);
              if (scrollRef.current) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
              }
            }}
          >
            ↓
          </button>
        </div>

        <div
          className="terminal-content"
          ref={scrollRef}
          onScroll={handleScroll}
          role="log"
          aria-live="polite"
        >
          {entries.length === 0 ? (
            <div className="terminal-empty">No commands executed yet.</div>
          ) : (
            shown.map((entry) => (
              <pre className={`term-entry term-${entry.type}`} key={entry.id}>
                {entry.content}
              </pre>
            ))
          )}
        </div>
      </section>

      <aside className="panel terminal-side">
        <span className="eyebrow">COMMAND HISTORY</span>
        <h2>Execution log</h2>
        <p>
          Commands are executed only by the secure Codex backend—not by this
          browser. Output is streamed live.
        </p>

        <label className="terminal-search-label">
          Filter output
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search log…"
          />
        </label>

        {lastCommand ? (
          <div className="command-summary">
            <b>Last command</b>
            <code>{lastCommand.content}</code>
            <span
              className={`status-chip ${isRunning ? "running" : "completed"}`}
            >
              {isRunning ? "Running" : "Completed"}
            </span>
          </div>
        ) : (
          <div className="command-summary empty">
            <span className="muted">No commands running</span>
          </div>
        )}
      </aside>
    </div>
  );
}
