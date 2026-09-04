import type { AgentStatus, ProviderStatus } from "../types/codex";

const ROLE_ICONS: Record<AgentStatus["role"], string> = {
  planner: "⌘",
  coder: "⌨",
  tester: "⚗",
  reviewer: "◈",
};

type Props = {
  agents: AgentStatus[];
  providers: ProviderStatus[];
};

export function AgentStatusBar({ agents, providers }: Props) {
  if (agents.length === 0 && providers.length === 0) return null;

  return (
    <div className="agent-status-bar" role="status" aria-label="Agent and provider status">
      {agents.length > 0 && (
        <div className="agent-status-agents">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className={`agent-pill agent-${agent.status}`}
              title={agent.currentTask ?? agent.status}
            >
              <span className="agent-role-icon" aria-hidden="true">
                {ROLE_ICONS[agent.role]}
              </span>
              <span className="agent-name">{agent.name}</span>
              <i className={`agent-dot agent-dot-${agent.status}`} />
            </div>
          ))}
        </div>
      )}
      {providers.length > 0 && (
        <div className="agent-status-providers">
          {providers.map((p) => (
            <span
              key={p.id}
              className={`provider-pill ${p.available ? "available" : "unavailable"}`}
              title={p.latencyMs !== undefined ? `${p.latencyMs}ms` : p.available ? "Available" : "Unavailable"}
            >
              <i className={`provider-dot ${p.available ? "online" : "offline"}`} />
              {p.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
