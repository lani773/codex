import type { ChatMessage } from "../types/codex";

type Props = {
  messages: ChatMessage[];
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  onAttach: (files: FileList | null) => void;
};

export function ChatPage({
  messages,
  draft,
  onDraftChange,
  onSend,
  onAttach,
}: Props) {
  return (
    <div className="chat-page">
      <section className="panel chat-panel chat-full">
        <div className="panel-header">
          <div>
            <span className="eyebrow">CONVERSATION</span>
            <h2>Work with Codex</h2>
          </div>
        </div>

        <div className="messages conversation-thread" role="log" aria-live="polite">
          {messages.length === 0 ? (
            <div className="empty-state chat-empty">
              <span className="empty-state-icon" aria-hidden="true">◌</span>
              <b>No messages yet</b>
              <p>Say hello or give Codex a new direction.</p>
            </div>
          ) : (
            messages.map((msg) => (
              <article className={`message ${msg.role}`} key={msg.id}>
                <span aria-hidden="true">
                  {msg.role === "codex"
                    ? "C"
                    : msg.role === "system"
                    ? "!"
                    : "You"}
                </span>
                <div className="message-bubble">
                  <p>{msg.content}</p>
                  {msg.fileIds && msg.fileIds.length > 0 && (
                    <div className="message-attachments">
                      {msg.fileIds.map((f) => (
                        <span key={f} className="file-chip small">
                          ▱ {f}
                        </span>
                      ))}
                    </div>
                  )}
                  <small>{msg.time}</small>
                </div>
              </article>
            ))
          )}
        </div>

        <div className="composer expanded">
          <label
            className="attach"
            title="Attach files"
            aria-label="Attach files"
          >
            ⌕
            <input
              type="file"
              multiple
              onChange={(e) => onAttach(e.target.files)}
            />
          </label>
          <textarea
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            placeholder="Give Codex context, feedback, or a new direction…"
            aria-label="Message Codex"
            rows={3}
          />
          <button
            className="primary"
            onClick={onSend}
            disabled={!draft.trim()}
            aria-label="Send message"
          >
            Send ↑
          </button>
        </div>
      </section>

      <aside className="chat-context panel">
        <span className="eyebrow">CONTEXT</span>
        <h2>How Codex uses chat</h2>
        <p>
          Codex reads this conversation as part of its working memory. It uses
          your feedback to adjust its plan, rewrite requirements, or modify its
          approach.
        </p>
        <p>
          <strong>What you can do here:</strong>
        </p>
        <ul>
          <li>Correct misunderstandings</li>
          <li>Change the scope mid-execution</li>
          <li>Ask questions about the current state</li>
          <li>Provide API keys or secrets directly</li>
        </ul>
      </aside>
    </div>
  );
}
