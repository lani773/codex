import type { CodexEvent } from "../../types/codex";
export type ConnectionState = "connected" | "connecting" | "disconnected" | "reconnecting";
type Command = { type: string; [key: string]: unknown };
export class WebSocketManager {
  private socket?: WebSocket;
  private attempts = 0;
  private stopped = false;
  private heartbeat?: number;
  private listeners = new Set<(event: CodexEvent) => void>();
  constructor(private readonly url: string, private readonly onState: (state: ConnectionState) => void, private readonly token?: string) {}
  connect() { this.stopped = false; this.open(); }
  disconnect() { this.stopped = true; window.clearInterval(this.heartbeat); this.socket?.close(); this.onState("disconnected"); }
  subscribe(listener: (event: CodexEvent) => void) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  subscribeToGoal(goalId: string) { return this.send({ type: "goal.subscribe", goal_id: goalId }); }
  unsubscribeFromGoal(goalId: string) { return this.send({ type: "goal.unsubscribe", goal_id: goalId }); }
  send(command: Command) { if (this.socket?.readyState !== WebSocket.OPEN) return false; this.socket.send(JSON.stringify(command)); return true; }
  private open() { this.onState(this.attempts ? "reconnecting" : "connecting"); this.socket = new WebSocket(this.url); this.socket.onopen = () => { this.attempts = 0; this.onState("connected"); if (this.token) this.send({ type: "session.authenticate", token: this.token }); this.send({ type: "state.sync" }); this.startHeartbeat(); }; this.socket.onmessage = (message) => this.route(message.data); this.socket.onclose = () => { window.clearInterval(this.heartbeat); if (!this.stopped) this.reconnect(); }; this.socket.onerror = () => this.socket?.close(); }
  private startHeartbeat() { window.clearInterval(this.heartbeat); this.heartbeat = window.setInterval(() => this.send({ type: "heartbeat" }), 25_000); }
  private reconnect() { this.attempts += 1; window.setTimeout(() => this.open(), Math.min(1_000 * 2 ** this.attempts, 15_000)); }
  private route(payload: unknown) { if (typeof payload !== "string") return; try { const event = JSON.parse(payload) as CodexEvent; if (typeof event.type === "string") this.listeners.forEach((listener) => listener(event)); } catch { /* Ignore a malformed server event without dropping the connection. */ } }
}
